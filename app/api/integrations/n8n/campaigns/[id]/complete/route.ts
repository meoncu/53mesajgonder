import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { assertServiceAuth } from '@/server/middleware/service-auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertServiceAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  
  try {
    await adminDb.collection('campaigns').doc(id).update({
      status: 'completed',
      updatedAt: new Date().toISOString()
    });
    return NextResponse.json({ campaignId: id, status: 'completed' });
  } catch (error) {
    console.error('Failed to complete campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
