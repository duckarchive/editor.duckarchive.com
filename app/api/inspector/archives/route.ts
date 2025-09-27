import { NextResponse } from "next/server";

import { inspectorPrisma } from "@/lib/db";

export async function GET() {
  try {
    const archives = await inspectorPrisma.archive.findMany({
      take: 100,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(archives);
  } catch (error) {
    console.error("GET archives Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch archives" },
      { status: 500 }
    );
  }
}
