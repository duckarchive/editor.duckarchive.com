import { NextResponse } from "next/server";

import { catalogPrisma } from "@/lib/db";

export async function GET() {
  try {
    const users = await catalogPrisma.archive.findMany({
      take: 100,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET archives Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch archives" },
      { status: 500 }
    );
  }
}
