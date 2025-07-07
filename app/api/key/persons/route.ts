import { NextRequest, NextResponse } from 'next/server';
import { duckkeyPrisma } from '@/lib/db';

export async function GET() {
  try {
    const persons = await duckkeyPrisma.person.findMany({
      take: 100,
      orderBy: { created_at: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        resource: {
          select: { id: true, name: true, url: true },
        },
      },
    });

    return NextResponse.json(persons);
  } catch (error) {
    console.error('GET Persons Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newPerson = await duckkeyPrisma.person.create({
      data: body,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        resource: {
          select: { id: true, name: true, url: true },
        },
      },
    });

    return NextResponse.json(newPerson, { status: 201 });
  } catch (error) {
    console.error('POST Person Error:', error);
    return NextResponse.json(
      { error: 'Failed to create person' },
      { status: 500 }
    );
  }
}