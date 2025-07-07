import { NextRequest, NextResponse } from 'next/server';
import { duckkeyPrisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const resource = await duckkeyPrisma.resource.findUnique({
      where: { id },
      include: {
        persons: {
          take: 10,
          orderBy: { created_at: 'desc' },
        },
        _count: {
          select: { persons: true },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.error('GET Resource Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedResource = await duckkeyPrisma.resource.update({
      where: { id },
      data: body,
      include: {
        _count: {
          select: { persons: true },
        },
      },
    });

    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error('PATCH Resource Error:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await duckkeyPrisma.resource.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('DELETE Resource Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}