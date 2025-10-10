import { NextResponse } from "next/server";

import { inspectorPrisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/inspector-client";

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
      orderBy: { project_id: "asc" },
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
