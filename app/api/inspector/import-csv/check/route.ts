import { inspectorPrisma } from "@/lib/db";
import { parseCode } from "@duckarchive/utils";
import { NextRequest, NextResponse } from "next/server";
import type {
  ImportPayload,
  CheckResult,
  ColumnMapping,
  CodeOverrides,
  TargetLevel,
} from "@/app/inspector/import-csv/lib/types";

function buildTree(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  targetLevel: TargetLevel,
  codeOverrides: CodeOverrides
): { l1Codes: Set<string>; l2ByL1: Map<string, Set<string>>; l3ByL1L2: Map<string, Set<string>> } {
  const reverseMap: Record<string, string> = {};
  for (const [csvHeader, dbField] of Object.entries(mapping)) {
    if (dbField) reverseMap[dbField] = csvHeader;
  }

  const l1Codes = new Set<string>();
  const l2ByL1 = new Map<string, Set<string>>();
  const l3ByL1L2 = new Map<string, Set<string>>();

  for (const row of rows) {
    const rawL1 = codeOverrides.level1_code?.trim() || (row[reverseMap["level1_code"]] || "").trim();
    const rawL2 = codeOverrides.level2_code?.trim() || (row[reverseMap["level2_code"]] || "").trim();
    if (!rawL1 || !rawL2) continue;

    const l1Code = parseCode(rawL1, true, true);
    const l2Code = parseCode(rawL2, true, true);
    if (!l1Code || !l2Code) continue;

    l1Codes.add(l1Code);

    if (!l2ByL1.has(l1Code)) l2ByL1.set(l1Code, new Set());
    l2ByL1.get(l1Code)!.add(l2Code);

    if (targetLevel === "level3") {
      const rawL3 = (row[reverseMap["level3_code"]] || "").trim();
      if (!rawL3) continue;
      const l3Code = parseCode(rawL3, true, true);
      if (!l3Code) continue;

      const key = `${l1Code}|${l2Code}`;
      if (!l3ByL1L2.has(key)) l3ByL1L2.set(key, new Set());
      l3ByL1L2.get(key)!.add(l3Code);
    }
  }

  return { l1Codes, l2ByL1, l3ByL1L2 };
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

    const { l1Codes, l2ByL1, l3ByL1L2 } = buildTree(rows, mapping, targetLevel, codeOverrides || {});
    const result: CheckResult = {
      level1: { create: 0, update: 0, skip: 0 },
      level2: { create: 0, update: 0, skip: 0 },
      level3: { create: 0, update: 0, skip: 0 },
      errors: [],
    };

    const isFDC = structureType === "fund-description-case";

    // Batch fetch all level-1 entities
    const l1CodesArr = Array.from(l1Codes);
    const existingL1 = isFDC
      ? await inspectorPrisma.fund.findMany({
          where: { code: { in: l1CodesArr }, archive_id: archive.id },
        })
      : await inspectorPrisma.fond.findMany({
          where: { code: { in: l1CodesArr }, archive_id: archive.id },
        });

    const l1IdMap = new Map<string, string>();
    for (const e of existingL1) {
      l1IdMap.set(e.code, e.id);
    }

    for (const code of l1CodesArr) {
      if (l1IdMap.has(code)) {
        if (conflictConfig.level1 === "overwrite") result.level1.update++;
        else result.level1.skip++;
      } else {
        result.level1.create++;
      }
    }

    // Batch fetch all level-2 entities per l1
    const l2IdMap = new Map<string, string>(); // "l1Code|l2Code" -> id

    for (const [l1Code, l2Codes] of Array.from(l2ByL1)) {
      const l1Id = l1IdMap.get(l1Code);
      if (l1Id) {
        const l2CodesArr = Array.from(l2Codes);
        const existingL2 = isFDC
          ? await inspectorPrisma.description.findMany({
              where: { code: { in: l2CodesArr }, fund_id: l1Id },
            })
          : await inspectorPrisma.inventory.findMany({
              where: { code: { in: l2CodesArr }, fond_id: l1Id },
            });

        for (const e of existingL2) {
          l2IdMap.set(`${l1Code}|${e.code}`, e.id);
        }

        for (const l2Code of l2CodesArr) {
          if (l2IdMap.has(`${l1Code}|${l2Code}`)) {
            if (conflictConfig.level2 === "overwrite") result.level2.update++;
            else result.level2.skip++;
          } else {
            result.level2.create++;
          }
        }
      } else {
        // l1 doesn't exist yet — all l2 under it will be created
        result.level2.create += l2Codes.size;
      }
    }

    // Batch fetch all level-3 entities per l2
    if (targetLevel === "level3") {
      for (const [key, l3Codes] of Array.from(l3ByL1L2)) {
        const l2Id = l2IdMap.get(key);
        if (l2Id) {
          const l3CodesArr = Array.from(l3Codes);
          const existingL3 = isFDC
            ? await inspectorPrisma.case.findMany({
                where: { code: { in: l3CodesArr }, description_id: l2Id },
                select: { code: true },
              })
            : await inspectorPrisma.file.findMany({
                where: { code: { in: l3CodesArr }, inventory_id: l2Id },
                select: { code: true },
              });

          const existingL3Codes = new Set(existingL3.map((e) => e.code));

          for (const l3Code of l3CodesArr) {
            if (existingL3Codes.has(l3Code)) {
              if (conflictConfig.level3 === "overwrite") result.level3.update++;
              else result.level3.skip++;
            } else {
              result.level3.create++;
            }
          }
        } else {
          // l2 doesn't exist yet — all l3 under it will be created
          result.level3.create += l3Codes.size;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("CSV Check Error:", error);
    return NextResponse.json(
      { error: "Failed to check import" },
      { status: 500 }
    );
  }
}
