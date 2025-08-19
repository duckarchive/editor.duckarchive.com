import { NextRequest, NextResponse } from "next/server";

import { duckkeyPrisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<BaseInstance> },
) {
  try {
    const { id } = await params;

    const user = await duckkeyPrisma.user.findUnique({
      where: { id },
      include: {
        persons: {
          take: 10,
          orderBy: { created_at: "desc" },
        },
        _count: {
          select: { persons: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET User Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<BaseInstance> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedUser = await duckkeyPrisma.user.update({
      where: { id },
      data: body,
      include: {
        _count: {
          select: { persons: true },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PATCH User Error:", error);

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<BaseInstance> },
) {
  try {
    const { id } = await params;

    await duckkeyPrisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE User Error:", error);

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
