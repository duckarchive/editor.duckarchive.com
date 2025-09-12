import { NextRequest, NextResponse } from "next/server";

import { catalogPrisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<BaseInstance> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await catalogPrisma.item.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(1);
  } catch (error) {
    console.error("PATCH Resource Error:", error);

    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 },
    );
  }
}
