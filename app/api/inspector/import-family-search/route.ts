import { autoParseFSItem } from "@/app/inspector/import-family-search/parsers";
import { Prisma } from "@/generated/prisma/inspector-client";
import { buildWhereClause } from "@/lib/api";
import { inspectorPrisma } from "@/lib/db";
import { parseDate } from "@/lib/parse";
import { set, chunk } from "lodash";
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
      orderBy: { updated_at: "desc" },
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

interface DTree {
  [aCode: string]: {
    [fCode: string]: {
      [dCode: string]: {
        years: string;
        dgs: string;
        id: string;
      };
    };
  };
}
interface CTree {
  [aCode: string]: {
    [fCode: string]: {
      [dCode: string]: {
        [cCode: string]: {
          years: string;
          title: string | null;
          dgs: string;
          id: string;
        };
      };
    };
  };
}

const processByQueryParams = async (qp: URLSearchParams) => {
  const where = buildWhereClause(qp);

  const dbItems = await inspectorPrisma.familySearchItem.findMany({
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
    orderBy: { updated_at: "desc" },
    include: {
      project: {
        include: {
          archive: true,
        },
      },
    },
  });

  const items: ImportItem[] = dbItems.map(
    (item) =>
      ({
        ...item,
        parsed_full_code: autoParseFSItem(item).join(", "),
      }) as ImportItem
  );

  if (!Array.isArray(items)) {
    return 0;
  }

  const casesTree: CTree = {};
  const descriptionsTree: DTree = {};
  const fundIds: Map<string, string> = new Map();
  const descriptionIds: Map<string, string> = new Map();

  items
    .flatMap((item) => {
      if (item.parsed_full_code.includes(", ")) {
        return item.parsed_full_code
          .split(", ")
          .map((code) => ({ ...item, parsed_full_code: code }));
      }
      return [item];
    })
    .forEach((item) => {
      const [_aCode, fCode, dCode, cCode] = item.parsed_full_code.split("-");

      if (fCode && dCode && cCode) {
        // Case item
        set(casesTree, [item.project?.archive_id || "", fCode, dCode, cCode], {
          years: item.date,
          title: item.title,
          dgs: item.dgs,
          id: item.id,
        });
      } else if (fCode && dCode && !cCode) {
        // Description item
        set(descriptionsTree, [item.project?.archive_id || "", fCode, dCode], {
          years: item.date,
          dgs: item.dgs,
          id: item.id,
        });
      }
    });

  const catalogedAtTimestamp = new Date(Date.now() + 1000 * 60 * 1);
  const catalogedItemIds: string[] = [];

  // Step 1: Process all funds
  console.log("Step 1: Upserting funds...");
  const fundsToProcess: Array<{ archiveId: string; fundCode: string }> = [];

  for (const archiveId in casesTree) {
    for (const fundCode in casesTree[archiveId]) {
      const fundKey = `${archiveId}|${fundCode}`;
      if (!fundIds.has(fundKey)) {
        fundsToProcess.push({ archiveId, fundCode });
      }
    }
  }

  for (const archiveId in descriptionsTree) {
    for (const fundCode in descriptionsTree[archiveId]) {
      const fundKey = `${archiveId}|${fundCode}`;
      if (!fundIds.has(fundKey)) {
        fundsToProcess.push({ archiveId, fundCode });
      }
    }
  }

  const fundChunks = chunk(fundsToProcess, 10);
  for (const fundChunk of fundChunks) {
    await Promise.all(
      fundChunk.map(async ({ archiveId, fundCode }) => {
        const fundKey = `${archiveId}|${fundCode}`;
        if (!fundIds.has(fundKey)) {
          const fund = await inspectorPrisma.fund.upsert({
            where: {
              code_archive_id: { code: fundCode, archive_id: archiveId },
            },
            update: {},
            create: { code: fundCode, archive_id: archiveId },
          });
          fundIds.set(fundKey, fund.id);
        }
      })
    );
  }
  console.log(`Step 1: Completed upserting funds`);

  // Step 2: Process all descriptions
  console.log("Step 2: Upserting descriptions...");
  const descriptionsToProcess: Array<{
    archiveId: string;
    fundCode: string;
    dCode: string;
    fundId: string;
  }> = [];

  for (const archiveId in casesTree) {
    for (const fundCode in casesTree[archiveId]) {
      const fundId = fundIds.get(`${archiveId}|${fundCode}`)!;
      for (const dCode in casesTree[archiveId][fundCode]) {
        const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
        if (!descriptionIds.has(descCacheKey)) {
          descriptionsToProcess.push({ archiveId, fundCode, dCode, fundId });
        }
      }
    }
  }

  for (const archiveId in descriptionsTree) {
    for (const fundCode in descriptionsTree[archiveId]) {
      const fundId = fundIds.get(`${archiveId}|${fundCode}`)!;
      for (const dCode in descriptionsTree[archiveId][fundCode]) {
        const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
        if (!descriptionIds.has(descCacheKey)) {
          descriptionsToProcess.push({ archiveId, fundCode, dCode, fundId });
        }
      }
    }
  }

  const descChunks = chunk(descriptionsToProcess, 10);
  for (const descChunk of descChunks) {
    await Promise.all(
      descChunk.map(async ({ archiveId, fundCode, dCode, fundId }) => {
        const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
        if (!descriptionIds.has(descCacheKey)) {
          const description = await inspectorPrisma.description.upsert({
            where: { code_fund_id: { code: dCode, fund_id: fundId } },
            update: {},
            create: { code: dCode, fund_id: fundId },
            include: { years: true },
          });
          descriptionIds.set(descCacheKey, description.id);
        }
      })
    );
  }
  console.log(`Step 2: Completed upserting descriptions`);

  // Step 3: Process descriptions
  console.log("Step 3: Processing descriptions...");
  const descriptionItems: Array<{
    archiveId: string;
    fundCode: string;
    dCode: string;
    data: DTree[string][string][string];
  }> = [];

  for (const archiveId in descriptionsTree) {
    for (const fundCode in descriptionsTree[archiveId]) {
      for (const dCode in descriptionsTree[archiveId][fundCode]) {
        const data = descriptionsTree[archiveId][fundCode][dCode];
        descriptionItems.push({ archiveId, fundCode, dCode, data });
      }
    }
  }

  const descItemChunks = chunk(descriptionItems, 10);
  for (const descItemChunk of descItemChunks) {
    await Promise.all(
      descItemChunk.map(async ({ archiveId, fundCode, dCode, data }) => {
        const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
        const descriptionId = descriptionIds.get(descCacheKey)!;

        // Upsert descriptionOnlineCopy
        await inspectorPrisma.descriptionOnlineCopy.upsert({
          where: {
            resource_id_description_id_api_params: {
              resource_id: FAMILY_SEARCH_RESOURCE_ID,
              description_id: descriptionId,
              api_params: { dgs: data.dgs },
            },
          },
          update: {},
          create: {
            resource_id: FAMILY_SEARCH_RESOURCE_ID,
            description_id: descriptionId,
            api_url:
              "https://sg30p0.familysearch.org/service/records/storage/dascloud/das/v2/",
            api_params: { dgs: data.dgs },
            url: `https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${data.dgs}`,
          },
        });

        // Add years if needed
        const existingYears = await inspectorPrisma.descriptionYear.findMany({
          where: { description_id: descriptionId },
        });

        if (existingYears.length === 0 && data.years) {
          const { start_year, end_year } = parseDate(data.years);
          if (start_year && end_year) {
            await inspectorPrisma.descriptionYear.create({
              data: {
                description_id: descriptionId,
                start_year,
                end_year,
              },
            });
          }
        }

        catalogedItemIds.push(data.id);
      })
    );
  }
  console.log(`Step 3: Completed processing descriptions`);

  // Step 4: Process cases
  console.log("Step 4: Processing cases...");
  const caseItems: Array<{
    archiveId: string;
    fundCode: string;
    dCode: string;
    cCode: string;
    data: CTree[string][string][string][string];
    descriptionId: string;
  }> = [];

  for (const archiveId in casesTree) {
    for (const fundCode in casesTree[archiveId]) {
      for (const dCode in casesTree[archiveId][fundCode]) {
        const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
        const descriptionId = descriptionIds.get(descCacheKey);

        if (!descriptionId) {
          console.warn(
            `Step 4: Description not found for key ${descCacheKey}`
          );
          continue;
        }

        for (const cCode in casesTree[archiveId][fundCode][dCode]) {
          const data = casesTree[archiveId][fundCode][dCode][cCode];
          caseItems.push({
            archiveId,
            fundCode,
            dCode,
            cCode,
            data,
            descriptionId,
          });
        }
      }
    }
  }

  console.log(caseItems.length);

  const caseChunks = chunk(caseItems, 10);
  let caseCount = 0;
  for (const caseChunk of caseChunks) {
    await Promise.all(
      caseChunk.map(async ({ data, descriptionId, cCode }) => {
        // Upsert case
        const caseItem = await inspectorPrisma.case.upsert({
          where: {
            code_description_id: {
              code: cCode,
              description_id: descriptionId,
            },
          },
          update: { title: data.title },
          create: {
            code: cCode,
            description_id: descriptionId,
            title: data.title,
          },
          include: { years: true },
        });

        // Upsert caseOnlineCopy
        await inspectorPrisma.caseOnlineCopy.upsert({
          where: {
            resource_id_case_id_api_params: {
              resource_id: FAMILY_SEARCH_RESOURCE_ID,
              case_id: caseItem.id,
              api_params: { dgs: data.dgs },
            },
          },
          update: {},
          create: {
            resource_id: FAMILY_SEARCH_RESOURCE_ID,
            case_id: caseItem.id,
            api_url:
              "https://sg30p0.familysearch.org/service/records/storage/dascloud/das/v2/",
            api_params: { dgs: data.dgs },
            url: `https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${data.dgs}`,
          },
        });

        // Add years if needed
        const existingYears = await inspectorPrisma.caseYear.findMany({
          where: { case_id: caseItem.id },
        });

        if (existingYears.length === 0 && data.years) {
          const { start_year, end_year } = parseDate(data.years);
          if (start_year && end_year) {
            await inspectorPrisma.caseYear.create({
              data: {
                case_id: caseItem.id,
                start_year,
                end_year,
              },
            });
          }
        }

        catalogedItemIds.push(data.id);
      })
    );
    caseCount += caseChunk.length;
  }
  console.log(`Step 4: Completed processing ${caseCount} cases`);

  // Step 5: Update cataloged_at for all processed items
  if (catalogedItemIds.length > 0) {
    console.log(
      `Step 5: Updating ${catalogedItemIds.length} FamilySearchItems...`
    );
    await inspectorPrisma.familySearchItem.updateMany({
      where: { id: { in: catalogedItemIds } },
      data: { cataloged_at: catalogedAtTimestamp },
    });
    console.log(`Step 5: Completed updating FamilySearchItems`);
  }

  return caseCount;
};

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    let totalCount = 0;
    let count = 0;

    do {
      count = await processByQueryParams(searchParams);
      totalCount += count;
      console.log(`[PUT] Processed ${count} items in this iteration. Total: ${totalCount}`);
    } while (count > 0);

    console.log(
      `[PUT] Import process completed successfully. Processed ${totalCount} items total`
    );
    return NextResponse.json({
      message: "Import process completed.",
      processedCount: totalCount,
    });
  } catch (error) {
    console.error("[PUT] FS Import Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
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

    const casesTree: CTree = {};
    const descriptionsTree: DTree = {};
    const fundIds: Map<string, string> = new Map();
    const descriptionIds: Map<string, string> = new Map();

    items
      .flatMap((item) => {
        if (item.parsed_full_code.includes(", ")) {
          return item.parsed_full_code
            .split(", ")
            .map((code) => ({ ...item, parsed_full_code: code }));
        }
        return [item];
      })
      .forEach((item) => {
        const [_aCode, fCode, dCode, cCode] = item.parsed_full_code.split("-");

        if (fCode && dCode && cCode) {
          // Case item
          set(
            casesTree,
            [item.project?.archive_id || "", fCode, dCode, cCode],
            {
              years: item.date,
              title: item.title,
              dgs: item.dgs,
              id: item.id,
            }
          );
        } else if (fCode && dCode && !cCode) {
          // Description item
          set(
            descriptionsTree,
            [item.project?.archive_id || "", fCode, dCode],
            {
              years: item.date,
              dgs: item.dgs,
              id: item.id,
            }
          );
        }
      });

    const catalogedAtTimestamp = new Date(Date.now() + 1000 * 60 * 1);
    const catalogedItemIds: string[] = [];

    // Step 1: Process all funds
    console.log("[POST] Step 1: Upserting funds...");
    const fundsToProcess: Array<{ archiveId: string; fundCode: string }> = [];

    for (const archiveId in casesTree) {
      for (const fundCode in casesTree[archiveId]) {
        const fundKey = `${archiveId}|${fundCode}`;
        if (!fundIds.has(fundKey)) {
          fundsToProcess.push({ archiveId, fundCode });
        }
      }
    }

    for (const archiveId in descriptionsTree) {
      for (const fundCode in descriptionsTree[archiveId]) {
        const fundKey = `${archiveId}|${fundCode}`;
        if (!fundIds.has(fundKey)) {
          fundsToProcess.push({ archiveId, fundCode });
        }
      }
    }

    const fundChunks = chunk(fundsToProcess, 10);
    for (const fundChunk of fundChunks) {
      await Promise.all(
        fundChunk.map(async ({ archiveId, fundCode }) => {
          const fundKey = `${archiveId}|${fundCode}`;
          if (!fundIds.has(fundKey)) {
            const fund = await inspectorPrisma.fund.upsert({
              where: {
                code_archive_id: { code: fundCode, archive_id: archiveId },
              },
              update: {},
              create: { code: fundCode, archive_id: archiveId },
            });
            fundIds.set(fundKey, fund.id);
          }
        })
      );
    }
    console.log(`[POST] Step 1: Completed upserting funds`);

    // Step 2: Process all descriptions
    console.log("[POST] Step 2: Upserting descriptions...");
    const descriptionsToProcess: Array<{
      archiveId: string;
      fundCode: string;
      dCode: string;
      fundId: string;
    }> = [];

    for (const archiveId in casesTree) {
      for (const fundCode in casesTree[archiveId]) {
        const fundId = fundIds.get(`${archiveId}|${fundCode}`)!;
        for (const dCode in casesTree[archiveId][fundCode]) {
          const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
          if (!descriptionIds.has(descCacheKey)) {
            descriptionsToProcess.push({ archiveId, fundCode, dCode, fundId });
          }
        }
      }
    }

    for (const archiveId in descriptionsTree) {
      for (const fundCode in descriptionsTree[archiveId]) {
        const fundId = fundIds.get(`${archiveId}|${fundCode}`)!;
        for (const dCode in descriptionsTree[archiveId][fundCode]) {
          const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
          if (!descriptionIds.has(descCacheKey)) {
            descriptionsToProcess.push({ archiveId, fundCode, dCode, fundId });
          }
        }
      }
    }

    const descChunks = chunk(descriptionsToProcess, 10);
    for (const descChunk of descChunks) {
      await Promise.all(
        descChunk.map(async ({ archiveId, fundCode, dCode, fundId }) => {
          const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
          if (!descriptionIds.has(descCacheKey)) {
            const description = await inspectorPrisma.description.upsert({
              where: { code_fund_id: { code: dCode, fund_id: fundId } },
              update: {},
              create: { code: dCode, fund_id: fundId },
              include: { years: true },
            });
            descriptionIds.set(descCacheKey, description.id);
          }
        })
      );
    }
    console.log(`[POST] Step 2: Completed upserting descriptions`);

    // Step 3: Process descriptions
    console.log("[POST] Step 3: Processing descriptions...");
    const descriptionItems: Array<{
      archiveId: string;
      fundCode: string;
      dCode: string;
      data: DTree[string][string][string];
    }> = [];

    for (const archiveId in descriptionsTree) {
      for (const fundCode in descriptionsTree[archiveId]) {
        for (const dCode in descriptionsTree[archiveId][fundCode]) {
          const data = descriptionsTree[archiveId][fundCode][dCode];
          descriptionItems.push({ archiveId, fundCode, dCode, data });
        }
      }
    }

    const descItemChunks = chunk(descriptionItems, 10);
    for (const descItemChunk of descItemChunks) {
      await Promise.all(
        descItemChunk.map(async ({ archiveId, fundCode, dCode, data }) => {
          const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
          const descriptionId = descriptionIds.get(descCacheKey)!;

          // Upsert descriptionOnlineCopy
          await inspectorPrisma.descriptionOnlineCopy.upsert({
            where: {
              resource_id_description_id_api_params: {
                resource_id: FAMILY_SEARCH_RESOURCE_ID,
                description_id: descriptionId,
                api_params: { dgs: data.dgs },
              },
            },
            update: {},
            create: {
              resource_id: FAMILY_SEARCH_RESOURCE_ID,
              description_id: descriptionId,
              api_url:
                "https://sg30p0.familysearch.org/service/records/storage/dascloud/das/v2/",
              api_params: { dgs: data.dgs },
              url: `https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${data.dgs}`,
            },
          });

          // Add years if needed
          const existingYears = await inspectorPrisma.descriptionYear.findMany({
            where: { description_id: descriptionId },
          });

          if (existingYears.length === 0 && data.years) {
            const { start_year, end_year } = parseDate(data.years);
            if (start_year && end_year) {
              await inspectorPrisma.descriptionYear.create({
                data: {
                  description_id: descriptionId,
                  start_year,
                  end_year,
                },
              });
            }
          }

          catalogedItemIds.push(data.id);
        })
      );
    }
    console.log(`[POST] Step 3: Completed processing descriptions`);

    // Step 4: Process cases
    console.log("[POST] Step 4: Processing cases...");
    const caseItems: Array<{
      archiveId: string;
      fundCode: string;
      dCode: string;
      cCode: string;
      data: CTree[string][string][string][string];
      descriptionId: string;
    }> = [];

    for (const archiveId in casesTree) {
      for (const fundCode in casesTree[archiveId]) {
        for (const dCode in casesTree[archiveId][fundCode]) {
          const descCacheKey = `${archiveId}|${fundCode}|${dCode}`;
          const descriptionId = descriptionIds.get(descCacheKey);

          if (!descriptionId) {
            console.warn(
              `[POST] Step 4: Description not found for key ${descCacheKey}`
            );
            continue;
          }

          for (const cCode in casesTree[archiveId][fundCode][dCode]) {
            const data = casesTree[archiveId][fundCode][dCode][cCode];
            caseItems.push({
              archiveId,
              fundCode,
              dCode,
              cCode,
              data,
              descriptionId,
            });
          }
        }
      }
    }

    const caseChunks = chunk(caseItems, 10);
    let caseCount = 0;
    for (const caseChunk of caseChunks) {
      await Promise.all(
        caseChunk.map(async ({ data, descriptionId, cCode }) => {
          // Upsert case
          const caseItem = await inspectorPrisma.case.upsert({
            where: {
              code_description_id: {
                code: cCode,
                description_id: descriptionId,
              },
            },
            update: { title: data.title },
            create: {
              code: cCode,
              description_id: descriptionId,
              title: data.title,
            },
            include: { years: true },
          });

          // Upsert caseOnlineCopy
          await inspectorPrisma.caseOnlineCopy.upsert({
            where: {
              resource_id_case_id_api_params: {
                resource_id: FAMILY_SEARCH_RESOURCE_ID,
                case_id: caseItem.id,
                api_params: { dgs: data.dgs },
              },
            },
            update: {},
            create: {
              resource_id: FAMILY_SEARCH_RESOURCE_ID,
              case_id: caseItem.id,
              api_url:
                "https://sg30p0.familysearch.org/service/records/storage/dascloud/das/v2/",
              api_params: { dgs: data.dgs },
              url: `https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${data.dgs}`,
            },
          });

          // Add years if needed
          const existingYears = await inspectorPrisma.caseYear.findMany({
            where: { case_id: caseItem.id },
          });

          if (existingYears.length === 0 && data.years) {
            const { start_year, end_year } = parseDate(data.years);
            if (start_year && end_year) {
              await inspectorPrisma.caseYear.create({
                data: {
                  case_id: caseItem.id,
                  start_year,
                  end_year,
                },
              });
            }
          }

          catalogedItemIds.push(data.id);
        })
      );
      caseCount += caseChunk.length;
    }
    console.log(`[POST] Step 4: Completed processing ${caseCount} cases`);

    // Step 5: Update cataloged_at for all processed items
    if (catalogedItemIds.length > 0) {
      console.log(
        `[POST] Step 5: Updating ${catalogedItemIds.length} FamilySearchItems...`
      );
      await inspectorPrisma.familySearchItem.updateMany({
        where: { id: { in: catalogedItemIds } },
        data: { cataloged_at: catalogedAtTimestamp },
      });
      console.log(`[POST] Step 5: Completed updating FamilySearchItems`);
    }

    console.log(
      `[POST] Import process completed successfully. Processed ${items.length} items`
    );
    return NextResponse.json({
      message: "Import process completed.",
      processedCount: items.length,
    });
  } catch (error) {
    console.error("[POST] FS Import Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
