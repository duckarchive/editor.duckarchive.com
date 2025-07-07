import { NextRequest, NextResponse } from 'next/server';
import { duckkeyPrisma } from '@/lib/db';

export async function GET() {
  try {
    const firstNames = await duckkeyPrisma.firstName.findMany({
      take: 100,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(firstNames);
  } catch (error) {
    console.error('GET FirstNames Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch first names' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newFirstName = await duckkeyPrisma.firstName.create({
      data: body,
    });

    return NextResponse.json(newFirstName, { status: 201 });
  } catch (error) {
    console.error('POST FirstName Error:', error);
    return NextResponse.json(
      { error: 'Failed to create first name' },
      { status: 500 }
    );
  }
}