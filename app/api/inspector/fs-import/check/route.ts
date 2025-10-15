import { NextRequest, NextResponse } from "next/server";
import { inspectorPrisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/inspector-client";

// Re-defining the type from the payload, as it's not directly available
// This should be kept in sync with the actual FamilySearchItem type
type FamilySearchItemWithProject = Prisma.FamilySearchItemGetPayload<{
  include: {
    project: {
      include: {
        archive: true;
      };
    };
  };
}>;

interface CheckItem extends FamilySearchItemWithProject {
  fullCode: string;
}

interface CheckStats {
  funds: {
    create: string[];
    update: string[];
  };
  descriptions: {
    create: string[];
    update: string[];
  };
  cases: {
    create: string[];
    update: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const items: CheckItem[] = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Request body must be an array of items" },
        { status: 400 }
      );
    }

    const stats: CheckStats = {
      funds: { create: [], update: [] },
      descriptions: { create: [], update: [] },
      cases: { create: [], update: [] },
    };

    for (const item of items) {
      if (!item.fullCode || !item.project?.archive_id) {
        continue; // Skip items with invalid data
      }

      const [_aCode, fCode, dCode, cCode] = item.fullCode.split("-");
      const archive_id = item.project.archive_id;

      if (!fCode) continue;

      // Check Fund
      const fund = await inspectorPrisma.fund.findUnique({
        where: { code_archive_id: { code: fCode, archive_id } },
      });

      if (fund) {
        if (!stats.funds.update.includes(fCode)) stats.funds.update.push(fCode);

        if (!dCode) continue;
        // Check Description
        const description = await inspectorPrisma.description.findUnique({
          where: { code_fund_id: { code: dCode, fund_id: fund.id } },
        });

        if (description) {
          if (!stats.descriptions.update.includes(dCode)) stats.descriptions.update.push(dCode);

          if (!cCode) continue;
          // Check Case
          const caseItem = await inspectorPrisma.case.findUnique({
            where: { code_description_id: { code: cCode, description_id: description.id } },
          });

          if (caseItem) {
            if (!stats.cases.update.includes(cCode)) stats.cases.update.push(cCode);
          } else {
            if (!stats.cases.create.includes(cCode)) stats.cases.create.push(cCode);
          }
        } else {
          if (!stats.descriptions.create.includes(dCode)) stats.descriptions.create.push(dCode);
        }
      } else {
        if (!stats.funds.create.includes(fCode)) stats.funds.create.push(fCode);
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("FS Import Check Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}