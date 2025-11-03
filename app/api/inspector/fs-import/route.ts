import { NextRequest, NextResponse } from "next/server";

import { inspectorPrisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/inspector-client";
import { parseDate } from "@/lib/parse";

export type FSItemsFreshResponse = Prisma.FamilySearchItemGetPayload<{
  include: {
    project: {
      include: {
        archive: true;
      };
    };
  };
}>[];

export async function GET() {
  try {
    const items = await inspectorPrisma.familySearchItem.findMany({
      where: {
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
      take: 1000,
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

type FamilySearchItemWithProject = Prisma.FamilySearchItemGetPayload<{
  include: {
    project: {
      include: {
        archive: true;
      };
    };
  };
}>;

interface ImportItem extends FamilySearchItemWithProject {
  fullCode: string;
}

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

    const results = [];

    for (const item of items) {
      if (!item.fullCode || !item.project?.archive_id) {
        continue; // Skip items with invalid data
      }

      const [_aCode, fCode, dCode, cCode] = item.fullCode.split("-");
      const archive_id = item.project.archive_id;

      if (!fCode || !dCode || !cCode) continue;

      const transactionResult = await inspectorPrisma.$transaction(async (prisma) => {
        // 1. Find Case, Description, and Fund
        const caseItem = await prisma.case.findFirst({
          where: {
            description: {
              fund: {
                archive_id: archive_id,
                code: fCode,
              },
              code: dCode,
            },
            code: cCode,
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

        // If case doesn't exist, skip this item
        if (!caseItem) {
          return null;
        }

        let updatedCaseItem = caseItem;
        // If case title is different, update it
        if (!caseItem.title?.trim() && item.title) {
          updatedCaseItem = await prisma.case.update({
            where: {
              id: caseItem.id,
            },
            data: {
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
        }

        // 2. Upsert Match (caseOnlineCopy)
        const match = await prisma.caseOnlineCopy.upsert({
          where: {
            resource_id_case_id_api_params: {
              resource_id: FAMILY_SEARCH_RESOURCE_ID,
              case_id: updatedCaseItem.id,
              api_params: { dgs: item.dgs },
            },
          },
          update: {
            url: `https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${item.dgs}`,
          },
          create: {
            resource_id: FAMILY_SEARCH_RESOURCE_ID,
            case_id: updatedCaseItem.id,
            api_url: "https://sg30p0.familysearch.org/service/records/storage/dascloud/das/v2/",
            api_params: { dgs: item.dgs },
            url: `https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${item.dgs}`,
          },
        });

        // 3. Add CaseYears if needed
        if (updatedCaseItem.years.length === 0 && item.date) {
          const { start_year, end_year } = parseDate(item.date);
          if (start_year && end_year) {
            await prisma.caseYear.create({
              data: {
                case_id: updatedCaseItem.id,
                start_year,
                end_year,
              },
            });
          }
        }

        await prisma.familySearchItem.update({
          where: { id: item.id },
          data: {
            cataloged_at: new Date(),
          },
        });

        return { caseItem: updatedCaseItem, match };
      });

      if (transactionResult) {
        results.push(transactionResult);
      }
    }

    return NextResponse.json({
      message: "Import process completed.",
      processedCount: items.length,
      createdCount: results.length,
    });
  } catch (error) {
    console.error("FS Import Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}


