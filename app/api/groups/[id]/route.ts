import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await adminDb.collection('groups').doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminDb.collection('groups').doc(id).delete();
    // In a real app, you might want to also remove this group from all contacts
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
