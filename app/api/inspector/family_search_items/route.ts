import { NextRequest, NextResponse } from "next/server";

import { inspectorPrisma } from "@/lib/db";
import { buildWhereClause } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where = buildWhereClause(searchParams);

    const items = await inspectorPrisma.familySearchItem.findMany({
      where,
      take: 100,
      orderBy: { updated_at: "desc" },
      include: {
        project: true,
      }
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