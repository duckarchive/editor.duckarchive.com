import { NextRequest, NextResponse } from 'next/server';
import { duckkeyPrisma } from '@/lib/db';

export async function GET() {
  try {
    const resources = await duckkeyPrisma.resource.findMany({
      take: 100,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { persons: true },
        },
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error('GET Resources Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newResource = await duckkeyPrisma.resource.create({
      data: body,
      include: {
        _count: {
          select: { persons: true },
        },
      },
    });

    return NextResponse.json(newResource, { status: 201 });
  } catch (error) {
    console.error('POST Resource Error:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}