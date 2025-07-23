import { NextResponse } from "next/server";

import { catalogPrisma } from "@/lib/db";

export async function GET() {
  try {
    const items = await catalogPrisma.item.findMany({
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
