import { inspectorPrisma } from "@/lib/db";
import { parseYears, parseCode, parseTitle } from "@duckarchive/utils";
import { NextRequest, NextResponse } from "next/server";
import { chunk } from "lodash";
import type {
  ImportPayload,
  ImportResult,
  ColumnMapping,
  CodeOverrides,
  ConflictConfig,
  TargetLevel,
} from "@/app/inspector/import-csv/lib/types";

interface TreeNode {
  title?: string;
  info?: string;
  tags?: string;
  full_code?: string;
  years?: string;
  start_year?: string;
  end_year?: string;
  children: Record<string, TreeNode>;
}

function buildReverseMap(mapping: ColumnMapping): Record<string, string> {
  const reverseMap: Record<string, string> = {};
  for (const [csvHeader, dbField] of Object.entries(mapping)) {
    if (dbField) reverseMap[dbField] = csvHeader;
  }
  return reverseMap;
}

function getVal(row: Record<string, string>, reverseMap: Record<string, string>, field: string): string | undefined {
  return reverseMap[field] ? (row[reverseMap[field]] || "").trim() || undefined : undefined;
}

function buildTree(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  targetLevel: TargetLevel,
  codeOverrides: CodeOverrides
): { tree: Record<string, TreeNode>; errors: { row: number; message: string }[] } {
  const tree: Record<string, TreeNode> = {};
  const errors: { row: number; message: string }[] = [];
  const reverseMap = buildReverseMap(mapping);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawL1 = codeOverrides.level1_code?.trim() || (row[reverseMap["level1_code"]] || "").trim();
    const rawL2 = codeOverrides.level2_code?.trim() || (row[reverseMap["level2_code"]] || "").trim();

    if (!rawL1 || !rawL2) {
      errors.push({ row: i + 1, message: "Відсутній код фонду або опису" });
      continue;
    }

    const l1Code = parseCode(rawL1, true, true);
    const l2Code = parseCode(rawL2, true, true);

    if (!l1Code || !l2Code) {
      errors.push({ row: i + 1, message: `Невалідний код: "${rawL1}" / "${rawL2}"` });
      continue;
    }

    if (!tree[l1Code]) {
      tree[l1Code] = {
        title: getVal(row, reverseMap, "level1_title"),
        info: getVal(row, reverseMap, "level1_info"),
        children: {},
      };
    }

    const l1 = tree[l1Code];
    if (!l1.children[l2Code]) {
      l1.children[l2Code] = {
        title: getVal(row, reverseMap, "level2_title"),
        info: getVal(row, reverseMap, "level2_info"),
        years: getVal(row, reverseMap, "years"),
        start_year: getVal(row, reverseMap, "start_year"),
        end_year: getVal(row, reverseMap, "end_year"),
        children: {},
      };
    }

    if (targetLevel === "level3") {
      const rawL3 = (row[reverseMap["level3_code"]] || "").trim();
      if (!rawL3) {
        errors.push({ row: i + 1, message: "Відсутній код справи/файлу" });
        continue;
      }
      const l3Code = parseCode(rawL3, true, true);
      if (!l3Code) {
        errors.push({ row: i + 1, message: `Невалідний код справи: "${rawL3}"` });
        continue;
      }

      const l2 = l1.children[l2Code];
      if (!l2.children[l3Code]) {
        l2.children[l3Code] = {
          title: getVal(row, reverseMap, "level3_title"),
          info: getVal(row, reverseMap, "level3_info"),
          full_code: getVal(row, reverseMap, "level3_full_code"),
          tags: getVal(row, reverseMap, "level3_tags"),
          years: getVal(row, reverseMap, "years"),
          start_year: getVal(row, reverseMap, "start_year"),
          end_year: getVal(row, reverseMap, "end_year"),
          children: {},
        };
      }
    }
  }

  return { tree, errors };
}

function getYearRanges(node: TreeNode): { start_year: number; end_year: number }[] {
  // 1. Single raw "years" column
  if (node.years) {
    return parseYears(node.years);
  }
  // 2. Separate start_year + end_year columns
  if (node.start_year && node.end_year) {
    const start = parseInt(node.start_year, 10);
    const end = parseInt(node.end_year, 10);
    if (!isNaN(start) && !isNaN(end)) {
      return [{ start_year: start, end_year: end }];
    }
  }
  // 3. Only one of the two — try parseYears on it
  if (node.start_year) {
    return parseYears(node.start_year);
  }
  if (node.end_year) {
    return parseYears(node.end_year);
  }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportPayload = await request.json();
    const { rows, mapping, structureType, archiveId, conflictConfig, targetLevel, codeOverrides } = body;

    const archive = await inspectorPrisma.archive.findFirst({
      where: { code: archiveId },
    });

    if (!archive) {
      return NextResponse.json({ error: "Архів не знайдено" }, { status: 400 });
    }

    const { tree, errors } = buildTree(rows, mapping, targetLevel, codeOverrides || {});
    const isFDC = structureType === "fund-description-case";

    let successCount = 0;
    const l1Ids = new Map<string, string>();
    const l2Ids = new Map<string, string>();

    // Step 1: Upsert level-1 entities (funds/fonds)
    console.time("CSV Import: Step 1 - Level 1 entities");
    const l1Entries = Object.entries(tree);
    const l1Chunks = chunk(l1Entries, 10);

    for (const l1Chunk of l1Chunks) {
      await Promise.all(
        l1Chunk.map(async ([l1Code, node]) => {
          try {
            const title = node.title ? parseTitle(node.title) : undefined;
            const info = node.info ? parseTitle(node.info) : undefined;

            const updateData =
              conflictConfig.level1 === "overwrite"
                ? { ...(title !== undefined && { title }), ...(info !== undefined && { info }) }
                : {};

            let entity;
            if (isFDC) {
              entity = await inspectorPrisma.fund.upsert({
                where: { code_archive_id: { code: l1Code, archive_id: archive.id } },
                update: updateData,
                create: { code: l1Code, archive_id: archive.id, title, info },
              });
            } else {
              entity = await inspectorPrisma.fond.upsert({
                where: { code_archive_id: { code: l1Code, archive_id: archive.id } },
                update: updateData,
                create: { code: l1Code, archive_id: archive.id, title, info },
              });
            }
            l1Ids.set(l1Code, entity.id);
          } catch (err: any) {
            errors.push({ row: 0, message: `Фонд "${l1Code}": ${err.message}` });
          }
        })
      );
    }
    console.timeEnd("CSV Import: Step 1 - Level 1 entities");

    // Step 2: Upsert level-2 entities (descriptions/inventories)
    console.time("CSV Import: Step 2 - Level 2 entities");
    const l2Entries: Array<{ l1Code: string; l2Code: string; node: TreeNode; l1Id: string }> = [];

    for (const [l1Code, l1Node] of Object.entries(tree)) {
      const l1Id = l1Ids.get(l1Code);
      if (!l1Id) continue;
      for (const [l2Code, l2Node] of Object.entries(l1Node.children)) {
        l2Entries.push({ l1Code, l2Code, node: l2Node, l1Id });
      }
    }

    const l2Chunks = chunk(l2Entries, 10);
    for (const l2Chunk of l2Chunks) {
      await Promise.all(
        l2Chunk.map(async ({ l1Code, l2Code, node, l1Id }) => {
          try {
            const title = node.title ? parseTitle(node.title) : undefined;
            const info = node.info ? parseTitle(node.info) : undefined;

            const updateData =
              conflictConfig.level2 === "overwrite"
                ? { ...(title !== undefined && { title }), ...(info !== undefined && { info }) }
                : {};

            let entityId: string;
            let hasYears: boolean;

            if (isFDC) {
              const entity = await inspectorPrisma.description.upsert({
                where: { code_fund_id: { code: l2Code, fund_id: l1Id } },
                update: updateData,
                create: { code: l2Code, fund_id: l1Id, title, info },
                include: { years: true },
              });
              entityId = entity.id;
              hasYears = entity.years.length > 0;
            } else {
              const entity = await inspectorPrisma.inventory.upsert({
                where: { code_fond_id: { code: l2Code, fond_id: l1Id } },
                update: updateData,
                create: { code: l2Code, fond_id: l1Id, title, info },
                include: { years: true },
              });
              entityId = entity.id;
              hasYears = entity.years.length > 0;
            }

            l2Ids.set(`${l1Code}|${l2Code}`, entityId);

            // Add years if entity is new (no existing years)
            if (!hasYears) {
              const yearRanges = getYearRanges(node);
              for (const { start_year, end_year } of yearRanges) {
                if (isFDC) {
                  await inspectorPrisma.descriptionYear.create({
                    data: { description_id: entityId, start_year, end_year },
                  });
                } else {
                  await inspectorPrisma.inventoryYear.create({
                    data: { inventory_id: entityId, start_year, end_year },
                  });
                }
              }
            }

            successCount++;
          } catch (err: any) {
            errors.push({ row: 0, message: `Опис "${l1Code}-${l2Code}": ${err.message}` });
          }
        })
      );
    }
    console.timeEnd("CSV Import: Step 2 - Level 2 entities");

    // Step 3: Upsert level-3 entities (cases/files) if target level includes them
    if (targetLevel === "level3") {
      console.time("CSV Import: Step 3 - Level 3 entities");
      const l3Entries: Array<{
        l1Code: string;
        l2Code: string;
        l3Code: string;
        node: TreeNode;
        l2Id: string;
      }> = [];

      for (const [l1Code, l1Node] of Object.entries(tree)) {
        for (const [l2Code, l2Node] of Object.entries(l1Node.children)) {
          const l2Id = l2Ids.get(`${l1Code}|${l2Code}`);
          if (!l2Id) continue;
          for (const [l3Code, l3Node] of Object.entries(l2Node.children)) {
            l3Entries.push({ l1Code, l2Code, l3Code, node: l3Node, l2Id });
          }
        }
      }

      const l3Chunks = chunk(l3Entries, 10);
      for (const l3Chunk of l3Chunks) {
        await Promise.all(
          l3Chunk.map(async ({ l1Code, l2Code, l3Code, node, l2Id }) => {
            try {
              const title = node.title ? parseTitle(node.title) : undefined;
              const info = node.info ? parseTitle(node.info) : undefined;
              const fullCode = node.full_code || [archive.code, l1Code, l2Code, l3Code].join("-");

              // Handle tags: convert comma-separated string to array
              const tagsArray = node.tags
                ? node.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                : undefined;

              const updateData: Record<string, any> =
                conflictConfig.level3 === "overwrite"
                  ? {
                      ...(title !== undefined && { title }),
                      ...(info !== undefined && { info }),
                      full_code: fullCode,
                      ...(tagsArray && { tags: tagsArray }),
                    }
                  : {};

              let entityId: string;
              let hasYears: boolean;

              if (isFDC) {
                const entity = await inspectorPrisma.case.upsert({
                  where: { code_description_id: { code: l3Code, description_id: l2Id } },
                  update: updateData,
                  create: {
                    code: l3Code,
                    description_id: l2Id,
                    title,
                    info,
                    full_code: fullCode,
                    tags: tagsArray || [],
                  },
                  include: { years: true },
                });
                entityId = entity.id;
                hasYears = entity.years.length > 0;
              } else {
                const entity = await inspectorPrisma.file.upsert({
                  where: { code_inventory_id: { code: l3Code, inventory_id: l2Id } },
                  update: updateData,
                  create: {
                    code: l3Code,
                    inventory_id: l2Id,
                    title,
                    info,
                    full_code: fullCode,
                    tags: tagsArray || [],
                  },
                  include: { years: true },
                });
                entityId = entity.id;
                hasYears = entity.years.length > 0;
              }

              // Add years if entity is new (no existing years)
              if (!hasYears) {
                const yearRanges = getYearRanges(node);
                for (const { start_year, end_year } of yearRanges) {
                  if (isFDC) {
                    await inspectorPrisma.caseYear.create({
                      data: { case_id: entityId, start_year, end_year },
                    });
                  } else {
                    await inspectorPrisma.fileYear.create({
                      data: { file_id: entityId, start_year, end_year },
                    });
                  }
                }
              }

              successCount++;
            } catch (err: any) {
              errors.push({
                row: 0,
                message: `Справа "${l1Code}-${l2Code}-${l3Code}": ${err.message}`,
              });
            }
          })
        );
      }
      console.timeEnd("CSV Import: Step 3 - Level 3 entities");
    }

    const result: ImportResult = {
      processedCount: rows.length,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 100), // Limit error list
    };

    console.log(
      `CSV Import completed: ${successCount} success, ${errors.length} errors out of ${rows.length} rows`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("CSV Import Error:", error);
    return NextResponse.json(
      { error: "Failed to import CSV" },
      { status: 500 }
    );
  }
}
