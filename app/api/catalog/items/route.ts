import { NextRequest, NextResponse } from "next/server";

import { catalogPrisma } from "@/lib/db";
import { buildWhereClause } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where = buildWhereClause(searchParams);

    const items = await catalogPrisma.item.findMany({
      where,
      take: 100,
      orderBy: { created_at: "desc" },
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
