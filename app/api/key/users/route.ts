import { NextRequest, NextResponse } from "next/server";
import { duckkeyPrisma } from "@/lib/db";

export async function GET() {
  try {
    const users = await duckkeyPrisma.user.findMany({
      take: 100,
      orderBy: { created_at: "desc" },
      include: {
        _count: {
          select: { persons: true },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET Users Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newUser = await duckkeyPrisma.user.create({
      data: body,
      include: {
        _count: {
          select: { persons: true },
        },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST User Error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
