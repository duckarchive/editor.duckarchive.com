import { Prisma } from "@/generated/prisma/inspector-client";
import { buildWhereClause } from "@/lib/api";
import { inspectorPrisma } from "@/lib/db";
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