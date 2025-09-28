import { NextRequest, NextResponse } from "next/server";

import { inspectorPrisma } from "@/lib/db";

const FIELDS = inspectorPrisma.case.fields;
const BATCH_FIELDS = [
  FIELDS.title.name,
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<BaseInstance> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const original = await inspectorPrisma.author.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Original item not found" },
        { status: 404 },
      );
    }

    if (Object.keys(body).every((key) => BATCH_FIELDS.includes(key))) {
      const similar = await inspectorPrisma.author.findMany({
        where: {
          ...Object.fromEntries(
            BATCH_FIELDS.map((field) => [
              field,
              original[field as keyof BaseInstance],
            ]),
          ),
        },
      });

      return NextResponse.json(similar);
    } else {
      return NextResponse.json([original]);
    }
  } catch (error) {
    console.error("GET similar items:", error);

    return NextResponse.json(
      { error: "Failed to retrieve resource" },
      { status: 500 },
    );
  }
}
