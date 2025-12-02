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

// Cache key format: "archive_id|fund_code" or "archive_id|fund_code|description_code"
interface CachedDescription {
  id: string;
  years: any[];
}

interface RequestCache {
  fundIds: Map<string, string>;
  descriptions: Map<string, CachedDescription>;
}

export async function POST(request: NextRequest) {
  try {
    const items: ImportItem[] = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Request body must be an array of items" },
        { status: 400 }
      );
    }

    const flattenedItems = items
      .flatMap((item) => {
        if (item.parsed_full_code.includes(", ")) {
          return item.parsed_full_code
            .split(", ")
            .map((code) => ({ ...item, parsed_full_code: code }));
        }
        return [item];
      })
      .sort(() => Math.random() - 0.5); // Shuffle items to reduce potential deadlocks

    // Initialize request-level cache
    const cache: RequestCache = {
      fundIds: new Map(),
      descriptions: new Map(),
    };

    const results = [];
    // Process in parallel chunks
    let processedCount = 0;
    const chunks = chunk(flattenedItems, 20);
    for (const chunkData of chunks) {
      console.log(`Processing chunk ${++processedCount}/${chunks.length}`);
      await Promise.all(
        chunkData.map(async (item, idx) => {
          if (!item.parsed_full_code || !item.project?.archive_id) {
            return; // Skip items with invalid data
          }

          const [_aCode, fCode, dCode, cCode] =
            item.parsed_full_code.split("-");
          const archive_id = item.project.archive_id;

          if (!fCode || !dCode || !cCode) {
            if (fCode && dCode && !cCode) {
              // save description only
              const transactionResult = await inspectorPrisma.$transaction(
                async (prisma) => {
                  // Check cache for fund
                  const fundCacheKey = `${archive_id}|${fCode}`;
                  let fundId = cache.fundIds.get(fundCacheKey);

                  if (!fundId) {
                    // 1. Find or create Fund
                    const fund = await prisma.fund.upsert({
                      where: { code_archive_id: { code: fCode, archive_id } },
                      update: {},
                      create: { code: fCode, archive_id },
                    });
                    fundId = fund.id;
                    cache.fundIds.set(fundCacheKey, fundId);
                  }

                  // Check cache for description
                  const descCacheKey = `${archive_id}|${fCode}|${dCode}`;
                  let description = cache.descriptions.get(descCacheKey);

                  if (!description) {
                    // 2. Find or create Description
                    const upsertedDesc = await prisma.description.upsert({
                      where: { code_fund_id: { code: dCode, fund_id: fundId } },
                      update: {},
                      create: { code: dCode, fund_id: fundId },
                      include: {
                        years: true,
                      },
                    });
                    description = {
                      id: upsertedDesc.id,
                      years: upsertedDesc.years,
                    };
                    cache.descriptions.set(descCacheKey, description);
                  }

                  // 3. Upsert Match (descriptionOnlineCopy)
                  const onlineCopy = await prisma.descriptionOnlineCopy.upsert({
                    where: {
                      resource_id_description_id_api_params: {
                        resource_id: FAMILY_SEARCH_RESOURCE_ID,
                        description_id: description.id,
                        api_params: { dgs: item.dgs },
                      },
                    },
                    update: {},
                    create: {
                      resource_id: FAMILY_SEARCH_RESOURCE_ID,
                      description_id: description.id,
                      api_url:
                        "https://sg30p0.familysearch.org/service/records/storage/dascloud/das/v2/",
                      api_params: { dgs: item.dgs },
                      url: `https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${item.dgs}`,
                    },
                  });

                  // 4. Add DescriptionYears if needed
                  if (description.years.length === 0 && item.date) {
                    const { start_year, end_year } = parseDate(item.date);
                    if (start_year && end_year) {
                      await prisma.descriptionYear.create({
                        data: {
                          description_id: description.id,
                          start_year,
                          end_year,
                        },
                      });
                      // Update cache to reflect that years were added
                      description.years.push({ start_year, end_year });
                    }
                  }

                  // 5. Update FamilySearchItem
                  await prisma.familySearchItem.update({
                    where: { id: item.id },
                    data: {
                      // set 1 min in future, to guarantee updated_at < cataloged_at
                      cataloged_at: new Date(Date.now() + 1000 * 60 * 1),
                    },
                  });

                  return { description, onlineCopy };
                }
              );

              if (transactionResult) {
                results.push(transactionResult);
              }
            }
            return; // Skip items with invalid data
          }

          const transactionResult = await inspectorPrisma.$transaction(
            async (prisma) => {
              // Check cache for fund
              const fundCacheKey = `${archive_id}|${fCode}`;
              let fundId = cache.fundIds.get(fundCacheKey);

              if (!fundId) {
                // 1. Find or create Fund
                const fund = await prisma.fund.upsert({
                  where: { code_archive_id: { code: fCode, archive_id } },
                  update: {},
                  create: { code: fCode, archive_id },
                });
                fundId = fund.id;
                cache.fundIds.set(fundCacheKey, fundId);
              }

              // Check cache for description
              const descCacheKey = `${archive_id}|${fCode}|${dCode}`;
              let cachedDesc = cache.descriptions.get(descCacheKey);
              let descriptionId: string;

              if (!cachedDesc) {
                // 2. Find or create Description
                const upsertedDesc = await prisma.description.upsert({
                  where: { code_fund_id: { code: dCode, fund_id: fundId } },
                  update: {},
                  create: { code: dCode, fund_id: fundId },
                  include: {
                    years: true,
                  },
                });
                cachedDesc = { id: upsertedDesc.id, years: upsertedDesc.years };
                cache.descriptions.set(descCacheKey, cachedDesc);
              }
              descriptionId = cachedDesc.id;

              // 3. Find or create Case
              const caseItem = await prisma.case.upsert({
                where: {
                  code_description_id: {
                    code: cCode,
                    description_id: descriptionId,
                  },
                },
                update: {
                  title: item.title,
                },
                create: {
                  code: cCode,
                  description_id: descriptionId,
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
