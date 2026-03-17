import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, message, groupIds, scheduledAt, status } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (name !== undefined) updateData.name = name;
    if (message !== undefined) updateData.message = message;
    if (groupIds !== undefined) updateData.groupIds = groupIds;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt;
    if (status !== undefined) updateData.status = status;

    await adminDb.collection('campaigns').doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    await adminDb.collection('campaigns').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
