import { NextRequest, NextResponse } from "next/server";

import { inspectorPrisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<BaseInstance> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    body.lat = !isNaN(body.lat) ? parseFloat(body.lat) : null;
    body.lng = !isNaN(body.lng) ? parseFloat(body.lng) : null;
    delete body.radius_m;

    await inspectorPrisma.author.update({
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
