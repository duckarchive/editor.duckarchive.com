import { NextRequest, NextResponse } from 'next/server';
import { duckkeyPrisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    
    const firstName = await duckkeyPrisma.firstName.findUnique({
      where: { name: decodeURIComponent(name) },
    });

    if (!firstName) {
      return NextResponse.json(
        { error: 'First name not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(firstName);
  } catch (error) {
    console.error('GET FirstName Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch first name' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const body = await request.json();

    const updatedFirstName = await duckkeyPrisma.firstName.update({
      where: { name: decodeURIComponent(name) },
      data: body,
    });

    return NextResponse.json(updatedFirstName);
  } catch (error) {
    console.error('PATCH FirstName Error:', error);
    return NextResponse.json(
      { error: 'Failed to update first name' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    await duckkeyPrisma.firstName.delete({
      where: { name: decodeURIComponent(name) },
    });

    return NextResponse.json({ message: 'First name deleted successfully' });
  } catch (error) {
    console.error('DELETE FirstName Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete first name' },
      { status: 500 }
    );
  }
}