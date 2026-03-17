import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (notes !== undefined) updateData.notes = notes;

    await adminDb.collection('contacts').doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update contact:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
