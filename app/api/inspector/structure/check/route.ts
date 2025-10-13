import { NextRequest, NextResponse } from "next/server";
import { inspectorPrisma } from "@/lib/db";

interface OriginalStructure {
  archive_id?: string;
  fund_id?: string;
  description_id?: string;
  case_id?: string;
}

interface NewStructure {
  archive_code?: string;
  fund_code?: string;
  description_code?: string;
  case_code?: string;
}

export interface StructureCheckRequest {
  original: OriginalStructure;
  new: NewStructure;
}

interface DiffItem {
  entity: "архів" | "фонд" | "опис" | "справа";
  action: "create";
  code: string;
  message: string;
  relations?: {
    years?: number;
    authors?: number;
    locations?: number;
    matches?: number;
    fetches?: number;
  };
}

export interface StructureCheckResponse {
  valid: boolean;
  diff_items: DiffItem[];
  errors?: string[];
  deps?: number;
}

async function getRelationCounts(
  entity: "fund" | "description" | "case",
  id: string
) {
  const relations: {
    years?: number;
    authors?: number;
    locations?: number;
    matches?: number;
    fetches?: number;
  } = {};

  if (entity === "fund") {
    const [years, matches, fetches] = await Promise.all([
      inspectorPrisma.fundYear.count({ where: { fund_id: id } }),
      inspectorPrisma.match.count({ where: { fund_id: id } }),
      inspectorPrisma.fetch.count({ where: { fund_id: id } }),
    ]);
    relations.years = years;
    relations.matches = matches;
    relations.fetches = fetches;
  } else if (entity === "description") {
    const [years, matches, fetches] = await Promise.all([
      inspectorPrisma.descriptionYear.count({ where: { description_id: id } }),
      inspectorPrisma.match.count({ where: { description_id: id } }),
      inspectorPrisma.fetch.count({ where: { description_id: id } }),
    ]);
    relations.years = years;
    relations.matches = matches;
    relations.fetches = fetches;
  } else if (entity === "case") {
    const [years, authors, locations, matches, fetches] = await Promise.all([
      inspectorPrisma.caseYear.count({ where: { case_id: id } }),
      inspectorPrisma.caseAuthor.count({ where: { case_id: id } }),
      inspectorPrisma.caseLocation.count({ where: { case_id: id } }),
      inspectorPrisma.match.count({ where: { case_id: id } }),
      inspectorPrisma.fetch.count({ where: { case_id: id } }),
    ]);
    relations.years = years;
    relations.authors = authors;
    relations.locations = locations;
    relations.matches = matches;
    relations.fetches = fetches;
  }

  return relations;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<StructureCheckResponse>> {
  try {
    const body: StructureCheckRequest = await request.json();

    const errors: string[] = [];
    const diff_items: DiffItem[] = [];

    // Calculate deps automatically based on provided codes
    let deps = 1; // Always at least archive
    if (body.new.fund_code) deps = 2;
    if (body.new.description_code) deps = 3;
    if (body.new.case_code) deps = 4;

    // Get original entities by IDs (if provided)
    const originalEntities = await Promise.all([
      body.original.archive_id
        ? inspectorPrisma.archive.findUnique({
            where: { id: body.original.archive_id },
          })
        : null,
      body.original.fund_id
        ? inspectorPrisma.fund.findUnique({
            where: { id: body.original.fund_id },
          })
        : null,
      body.original.description_id
        ? inspectorPrisma.description.findUnique({
            where: { id: body.original.description_id },
          })
        : null,
      body.original.case_id
        ? inspectorPrisma.case.findUnique({
            where: { id: body.original.case_id },
          })
        : null,
    ]);

    const [originalArchive, originalFund, originalDescription, originalCase] =
      originalEntities;

    // Check what entities exist by their codes with strict hierarchy relationships
    const archiveExists = body.new.archive_code
      ? await inspectorPrisma.archive.findFirst({
          where: { code: body.new.archive_code },
        })
      : null;

    const fundExists =
      body.new.fund_code && archiveExists
        ? await inspectorPrisma.fund.findFirst({
            where: {
              code: body.new.fund_code,
              archive_id: archiveExists.id,
            },
          })
        : null;

    const descriptionExists =
      body.new.description_code && fundExists
        ? await inspectorPrisma.description.findFirst({
            where: {
              code: body.new.description_code,
              fund_id: fundExists.id,
            },
          })
        : null;

    const caseExists =
      body.new.case_code && descriptionExists
        ? await inspectorPrisma.case.findFirst({
            where: {
              code: body.new.case_code,
              description_id: descriptionExists.id,
            },
          })
        : null;

    // Archive is always required
    if (!body.new.archive_code) {
      errors.push("Код архіву обов'язковий");
      return NextResponse.json({
        valid: false,
        diff_items: [],
        errors,
        deps,
      });
    }

    if (!archiveExists) {
      errors.push("Архів з таким кодом не існує");
      return NextResponse.json({
        valid: false,
        diff_items: [],
        errors,
        deps,
      });
    }

    // Logic for deps = 1 (archive only)
    if (deps === 1) {
      if (archiveExists) {
        // Nothing to create, archive already exists
        return NextResponse.json({
          valid: true,
          diff_items: [],
          deps,
        });
      }
    }

    // Logic for deps = 2 (archive + fund)
    else if (deps === 2) {
      if (!body.new.fund_code) {
        errors.push("Код фонду обов'язковий при deps=2");
        return NextResponse.json({
          valid: false,
          diff_items: [],
          errors,
          deps,
        });
      }

      if (archiveExists && fundExists) {
        // Both exist - prevent changes
        errors.push("Фонд з такими реквізитами вже існує");
        return NextResponse.json({
          valid: false,
          diff_items: [],
          errors,
          deps,
        });
      }

      if (archiveExists && !fundExists) {
        // Create fund under archive
        let message = `Фонд "${body.new.fund_code}" буде створено в архіві "${body.new.archive_code}"`;
        let relations = undefined;

        // Check if we're transferring from another fund
        if (originalFund) {
          const sourceRelations = await getRelationCounts(
            "fund",
            originalFund.id
          );
          message = `Фонд "${body.new.fund_code}" буде створено в архіві "${body.new.archive_code}". Зв'язки будуть перенесені з фонду "${originalFund.code}"`;
          relations = sourceRelations;
        }

        diff_items.push({
          entity: "фонд",
          action: "create",
          code: body.new.fund_code,
          message,
          relations,
        });
      }
    }

    // Logic for deps = 3 (archive + fund + description)
    else if (deps === 3) {
      if (!body.new.fund_code || !body.new.description_code) {
        errors.push("Коди фонду та опису обов'язкові при deps=3");
        return NextResponse.json({
          valid: false,
          diff_items: [],
          errors,
          deps,
        });
      }

      if (archiveExists && fundExists && descriptionExists) {
        // All exist - prevent changes
        errors.push("Опис з такими реквізитами вже існує");
        return NextResponse.json({
          valid: false,
          diff_items: [],
          errors,
          deps,
        });
      }

      if (archiveExists && fundExists && !descriptionExists) {
        // Create description under fund
        let message = `Опис "${body.new.description_code}" буде створено в фонді "${body.new.fund_code}" архіву "${body.new.archive_code}"`;
        let relations = undefined;

        // Check if we're transferring from another description
        if (originalDescription) {
          const sourceRelations = await getRelationCounts(
            "description",
            originalDescription.id
          );
          message = `Опис "${body.new.description_code}" буде створено в фонді "${body.new.fund_code}" архіву "${body.new.archive_code}". Зв'язки будуть перенесені з опису "${originalDescription.code}"`;
          relations = sourceRelations;
        }

        diff_items.push({
          entity: "опис",
          action: "create",
          code: body.new.description_code,
          message,
          relations,
        });
      }

      if (archiveExists && !fundExists && !descriptionExists) {
        // Create fund and description
        diff_items.push({
          entity: "фонд",
          action: "create",
          code: body.new.fund_code,
          message: `Фонд "${body.new.fund_code}" буде створено в архіві "${body.new.archive_code}"`,
        });
        diff_items.push({
          entity: "опис",
          action: "create",
          code: body.new.description_code,
          message: `Опис "${body.new.description_code}" буде створено в новому фонді "${body.new.fund_code}"`,
        });
      }
    }

    // Logic for deps = 4 (archive + fund + description + case)
    else if (deps === 4) {
      if (
        !body.new.fund_code ||
        !body.new.description_code ||
        !body.new.case_code
      ) {
        errors.push("Коди фонду, опису та справи обов'язкові при deps=4");
        return NextResponse.json({
          valid: false,
          diff_items: [],
          errors,
          deps,
        });
      }

      if (archiveExists && fundExists && descriptionExists && caseExists) {
        // All exist - prevent changes
        errors.push("Справа з такими реквізитами вже існує");
        return NextResponse.json({
          valid: false,
          diff_items: [],
          errors,
          deps,
        });
      }

      if (archiveExists && fundExists && descriptionExists && !caseExists) {
        // Create case under description
        let message = `Справа "${body.new.case_code}" буде створена в описі "${body.new.description_code}" фонду "${body.new.fund_code}" архіву "${body.new.archive_code}"`;
        let relations = undefined;

        // Check if we're transferring from another case
        if (originalCase) {
          const sourceRelations = await getRelationCounts(
            "case",
            originalCase.id
          );
          message = `Справа "${body.new.case_code}" буде створена в описі "${body.new.description_code}" фонду "${body.new.fund_code}" архіву "${body.new.archive_code}". Зв'язки будуть перенесені зі справи "${originalCase.code}"`;
          relations = sourceRelations;
        }

        diff_items.push({
          entity: "справа",
          action: "create",
          code: body.new.case_code,
          message,
          relations,
        });
      }

      if (archiveExists && fundExists && !descriptionExists && !caseExists) {
        // Create description and case
        diff_items.push({
          entity: "опис",
          action: "create",
          code: body.new.description_code,
          message: `Опис "${body.new.description_code}" буде створено в фонді "${body.new.fund_code}" архіву "${body.new.archive_code}"`,
        });
        diff_items.push({
          entity: "справа",
          action: "create",
          code: body.new.case_code,
          message: `Справа "${body.new.case_code}" буде створена в новому описі "${body.new.description_code}"`,
        });
      }

      if (archiveExists && !fundExists && !descriptionExists && !caseExists) {
        // Create fund, description and case
        diff_items.push({
          entity: "фонд",
          action: "create",
          code: body.new.fund_code,
          message: `Фонд "${body.new.fund_code}" буде створено в архіві "${body.new.archive_code}"`,
        });
        diff_items.push({
          entity: "опис",
          action: "create",
          code: body.new.description_code,
          message: `Опис "${body.new.description_code}" буде створено в новому фонді "${body.new.fund_code}"`,
        });
        diff_items.push({
          entity: "справа",
          action: "create",
          code: body.new.case_code,
          message: `Справа "${body.new.case_code}" буде створена в новому описі "${body.new.description_code}"`,
        });
      }
    }

    return NextResponse.json({
      valid: true,
      diff_items,
      deps,
    });
  } catch (error) {
    console.error("Structure check error:", error);
    return NextResponse.json(
      {
        valid: false,
        diff_items: [],
        errors: ["Помилка перевірки структури"],
      },
      { status: 500 }
    );
  }
}
