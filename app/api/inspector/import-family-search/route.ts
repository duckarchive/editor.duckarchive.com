import { Prisma } from "@/generated/prisma/inspector-client";
import { buildWhereClause } from "@/lib/api";
import { inspectorPrisma } from "@/lib/db";
import { parseDate } from "@/lib/parse";
import { chunk } from "lodash";
import { NextRequest, NextResponse } from "next/server";

export type GetImportFamilySearchResponse = Prisma.FamilySearchItemGetPayload<{
  include: {
    project: {
      include: {
        archive: true;
      };
    };
  };
}>[];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where = buildWhereClause(searchParams);

    const items = await inspectorPrisma.familySearchItem.findMany({
      where: {
        ...where,
        OR: [
          {
            updated_at: {
              gt: inspectorPrisma.familySearchItem.fields.cataloged_at,
            },
          },
          {
            cataloged_at: null,
          },
        ],
      },
      take: 500,
      orderBy: { project_id: "desc" },
      include: {
        project: {
          include: {
            archive: true,
          },
        },
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET items Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

type ImportItem = GetImportFamilySearchResponse[number] & {
  parsed_full_code: string;
};

const FAMILY_SEARCH_RESOURCE_ID = "e106fff5-12bd-4023-bbf6-fbf58faaf1b7";

export async function POST(request: NextRequest) {
  try {
    const items: ImportItem[] = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Request body must be an array of items" },
        { status: 400 }
      );
    }

    const flattenedItems = items.flatMap((item) => {
      if (item.parsed_full_code.includes(", ")) {
        return item.parsed_full_code
          .split(", ")
          .map((code) => ({ ...item, parsed_full_code: code }));
      }
      return [item];
    });

    const results = [];
    // Process in parallel chunks
    const chunks = chunk(flattenedItems, 10);
    for (const chunk of chunks) {
      console.log("Processing chunk");
      await Promise.all(
        chunk.map(async (item, idx) => {
          if (!item.parsed_full_code || !item.project?.archive_id) {
            return; // Skip items with invalid data
          }

          const [_aCode, fCode, dCode, cCode] =
            item.parsed_full_code.split("-");
          const archive_id = item.project.archive_id;

          if (!fCode || !dCode || !cCode) {
            return; // Skip items with invalid data
          }

          const transactionResult = await inspectorPrisma.$transaction(
            async (prisma) => {
              // 1. Find or create Fund
              const fund = await prisma.fund.upsert({
                where: { code_archive_id: { code: fCode, archive_id } },
                update: {},
                create: { code: fCode, archive_id },
              });

              // 2. Find or create Description
              const description = await prisma.description.upsert({
                where: { code_fund_id: { code: dCode, fund_id: fund.id } },
                update: {},
                create: { code: dCode, fund_id: fund.id },
              });

              // 3. Find or create Case
              const caseItem = await prisma.case.upsert({
                where: {
                  code_description_id: {
                    code: cCode,
                    description_id: description.id,
                  },
                },
                update: {
                  title: item.title,
                },
                create: {
                  code: cCode,
                  description_id: description.id,
                  title: item.title,
                },
                include: {
                  years: true,
                  description: {
                    include: {
                      fund: true,
                    },
                  },
                },
              });

              // 4. Upsert Match (caseOnlineCopy)
              const onlineCopy = await prisma.caseOnlineCopy.upsert({
                where: {
                  resource_id_case_id_api_params: {
                    resource_id: FAMILY_SEARCH_RESOURCE_ID,
                    case_id: caseItem.id,
                    api_params: { dgs: item.dgs },
                  },
                },
                update: {},
                create: {
                  resource_id: FAMILY_SEARCH_RESOURCE_ID,
                  case_id: caseItem.id,
                  api_url:
                    "https://sg30p0.familysearch.org/service/records/storage/dascloud/das/v2/",
                  api_params: { dgs: item.dgs },
                  url: `https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${item.dgs}`,
                },
              });

              // 5. Add CaseYears if needed
              if (caseItem.years.length === 0 && item.date) {
                const { start_year, end_year } = parseDate(item.date);
                if (start_year && end_year) {
                  await prisma.caseYear.create({
                    data: {
                      case_id: caseItem.id,
                      start_year,
                      end_year,
                    },
                  });
                }
              }

              // 6. Update FamilySearchItem
              await prisma.familySearchItem.update({
                where: { id: item.id },
                data: {
                  // set 1 min in future, to guarantee updated_at < cataloged_at
                  cataloged_at: new Date(Date.now() + 1000 * 60 * 1),
                },
              });

              return { caseItem, onlineCopy };
            }
          );

          if (transactionResult) {
            results.push(transactionResult);
          }
        })
      );
    }

    return NextResponse.json({
      message: "Import process completed.",
      processedCount: items.length,
    });
  } catch (error) {
    console.error("FS Import Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
