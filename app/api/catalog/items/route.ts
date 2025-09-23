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

export async function PATCH(request: NextRequest) {
  try {
    const { ids, item } = await request.json();

    await catalogPrisma.item.updateMany({
      where: { id: { in: ids } },
      data: {
        ...item,
        lat: +item.lat,
        lng: +item.lng,
        radius_m: +item.radius_m,
      },
    });

    return NextResponse.json(ids.length);
  } catch (error) {
    console.error("PATCH Resource Error:", error);

    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}
