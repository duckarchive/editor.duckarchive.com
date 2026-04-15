import { inspectorPrisma } from "@/lib/db";
import { parseYears, parseCode, parseTitle } from "@duckarchive/utils";
import { NextRequest, NextResponse } from "next/server";
import { chunk } from "lodash";
import type {
  ImportPayload,
  ImportResult,
  ColumnMapping,
  CodeOverrides,
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
  if (node.years) return parseYears(node.years);
  if (node.start_year && node.end_year) {
    const start = parseInt(node.start_year, 10);
    const end = parseInt(node.end_year, 10);
    if (!isNaN(start) && !isNaN(end)) return [{ start_year: start, end_year: end }];
  }
  if (node.start_year) return parseYears(node.start_year);
  if (node.end_year) return parseYears(node.end_year);
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
    console.time("CSV Import: Step 1");
    const l1Entries = Object.entries(tree);
    for (const l1Chunk of chunk(l1Entries, 50)) {
      await Promise.all(
        l1Chunk.map(async ([l1Code, node]) => {
          try {
            const title = node.title ? parseTitle(node.title) : undefined;
            const info = node.info ? parseTitle(node.info) : undefined;
            const updateData =
              conflictConfig.level1 === "overwrite"
                ? { ...(title !== undefined && { title }), ...(info !== undefined && { info }) }
                : {};

            const entity = isFDC
              ? await inspectorPrisma.fund.upsert({
                  where: { code_archive_id: { code: l1Code, archive_id: archive.id } },
                  update: updateData,
                  create: { code: l1Code, archive_id: archive.id, title, info },
                })
              : await inspectorPrisma.fond.upsert({
                  where: { code_archive_id: { code: l1Code, archive_id: archive.id } },
                  update: updateData,
                  create: { code: l1Code, archive_id: archive.id, title, info },
                });
            l1Ids.set(l1Code, entity.id);
          } catch (err: any) {
            errors.push({ row: 0, message: `Фонд "${l1Code}": ${err.message}` });
          }
        })
      );
    }
    console.timeEnd("CSV Import: Step 1");

    // Step 2: Upsert level-2 entities (descriptions/inventories)
    console.time("CSV Import: Step 2");
    const l2Entries: Array<{ l1Code: string; l2Code: string; node: TreeNode; l1Id: string }> = [];
    for (const [l1Code, l1Node] of Object.entries(tree)) {
      const l1Id = l1Ids.get(l1Code);
      if (!l1Id) continue;
      for (const [l2Code, l2Node] of Object.entries(l1Node.children)) {
        l2Entries.push({ l1Code, l2Code, node: l2Node, l1Id });
      }
    }

    for (const l2Chunk of chunk(l2Entries, 50)) {
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
            let isNew: boolean;

            if (isFDC) {
              // Check existence first to know if it's new
              const existing = await inspectorPrisma.description.findUnique({
                where: { code_fund_id: { code: l2Code, fund_id: l1Id } },
                select: { id: true },
              });
              if (existing) {
                entityId = existing.id;
                isNew = false;
                if (conflictConfig.level2 === "overwrite" && Object.keys(updateData).length > 0) {
                  await inspectorPrisma.description.update({
                    where: { id: existing.id },
                    data: updateData,
                  });
                }
              } else {
                const created = await inspectorPrisma.description.create({
                  data: { code: l2Code, fund_id: l1Id, title, info },
                });
                entityId = created.id;
                isNew = true;
              }
            } else {
              const existing = await inspectorPrisma.inventory.findUnique({
                where: { code_fond_id: { code: l2Code, fond_id: l1Id } },
                select: { id: true },
              });
              if (existing) {
                entityId = existing.id;
                isNew = false;
                if (conflictConfig.level2 === "overwrite" && Object.keys(updateData).length > 0) {
                  await inspectorPrisma.inventory.update({
                    where: { id: existing.id },
                    data: updateData,
                  });
                }
              } else {
                const created = await inspectorPrisma.inventory.create({
                  data: { code: l2Code, fond_id: l1Id, title, info },
                });
                entityId = created.id;
                isNew = true;
              }
            }

            l2Ids.set(`${l1Code}|${l2Code}`, entityId);

            // Add years only for newly created entities
            if (isNew) {
              const yearRanges = getYearRanges(node);
              for (const { start_year, end_year } of yearRanges) {
                try {
                  if (isFDC) {
                    await inspectorPrisma.descriptionYear.create({
                      data: { description_id: entityId, start_year, end_year },
                    });
                  } else {
                    await inspectorPrisma.inventoryYear.create({
                      data: { inventory_id: entityId, start_year, end_year },
                    });
                  }
                } catch {
                  // Ignore duplicate year entries
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
    console.timeEnd("CSV Import: Step 2");

    // Step 3: Upsert level-3 entities (cases/files)
    if (targetLevel === "level3") {
      console.time("CSV Import: Step 3");
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

      console.log(`CSV Import: Step 3 - processing ${l3Entries.length} entities`);

      for (const l3Chunk of chunk(l3Entries, 50)) {
        await Promise.all(
          l3Chunk.map(async ({ l1Code, l2Code, l3Code, node, l2Id }) => {
            try {
              const title = node.title ? parseTitle(node.title) : undefined;
              const info = node.info ? parseTitle(node.info) : undefined;
              const fullCode = node.full_code || [archive.code, l1Code, l2Code, l3Code].join("-");
              const tagsArray = node.tags
                ? node.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                : undefined;

              let entityId: string;
              let isNew: boolean;

              if (isFDC) {
                const existing = await inspectorPrisma.case.findUnique({
                  where: { code_description_id: { code: l3Code, description_id: l2Id } },
                  select: { id: true },
                });
                if (existing) {
                  entityId = existing.id;
                  isNew = false;
                  if (conflictConfig.level3 === "overwrite") {
                    await inspectorPrisma.case.update({
                      where: { id: existing.id },
                      data: {
                        ...(title !== undefined && { title }),
                        ...(info !== undefined && { info }),
                        full_code: fullCode,
                        ...(tagsArray && { tags: tagsArray }),
                      },
                    });
                  }
                } else {
                  const created = await inspectorPrisma.case.create({
                    data: {
                      code: l3Code,
                      description_id: l2Id,
                      title,
                      info,
                      full_code: fullCode,
                      tags: tagsArray || [],
                    },
                  });
                  entityId = created.id;
                  isNew = true;
                }
              } else {
                const existing = await inspectorPrisma.file.findUnique({
                  where: { code_inventory_id: { code: l3Code, inventory_id: l2Id } },
                  select: { id: true },
                });
                if (existing) {
                  entityId = existing.id;
                  isNew = false;
                  if (conflictConfig.level3 === "overwrite") {
                    await inspectorPrisma.file.update({
                      where: { id: existing.id },
                      data: {
                        ...(title !== undefined && { title }),
                        ...(info !== undefined && { info }),
                        full_code: fullCode,
                        ...(tagsArray && { tags: tagsArray }),
                      },
                    });
                  }
                } else {
                  const created = await inspectorPrisma.file.create({
                    data: {
                      code: l3Code,
                      inventory_id: l2Id,
                      title,
                      info,
                      full_code: fullCode,
                      tags: tagsArray || [],
                    },
                  });
                  entityId = created.id;
                  isNew = true;
                }
              }

              // Add years only for newly created entities
              if (isNew) {
                const yearRanges = getYearRanges(node);
                for (const { start_year, end_year } of yearRanges) {
                  try {
                    if (isFDC) {
                      await inspectorPrisma.caseYear.create({
                        data: { case_id: entityId, start_year, end_year },
                      });
                    } else {
                      await inspectorPrisma.fileYear.create({
                        data: { file_id: entityId, start_year, end_year },
                      });
                    }
                  } catch {
                    // Ignore duplicate year entries
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
      console.timeEnd("CSV Import: Step 3");
    }

    const result: ImportResult = {
      processedCount: rows.length,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 100),
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
