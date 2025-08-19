import { NextRequest, NextResponse } from "next/server";

import { catalogPrisma } from "@/lib/db";

const FIELDS = catalogPrisma.item.fields;
const BATCH_FIELDS = [
  FIELDS.country.name,
  FIELDS.state.name,
  FIELDS.place.name,
  FIELDS.lat.name,
  FIELDS.lng.name,
  FIELDS.church_name.name,
  FIELDS.church_administration.name,
  FIELDS.confession.name,
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<BaseInstance> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (Object.keys(body).every((key) => BATCH_FIELDS.includes(key))) {
      const prev = await catalogPrisma.item.findUnique({
        where: { id },
      });

      if (!prev) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      const similar = await catalogPrisma.item.updateMany({
        where: {
          ...Object.fromEntries(
            BATCH_FIELDS.map((field) => [
              field,
              prev[field as keyof BaseInstance],
            ]),
          ),
        },
        data: body,
      });

      return NextResponse.json(similar);
    }

    const updatedResource = await catalogPrisma.item.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error("PATCH Resource Error:", error);

    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 },
    );
  }
}
