import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { assertServiceAuth } from '@/server/middleware/service-auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertServiceAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  
  try {
    await adminDb.collection('campaigns').doc(id).update({
      status: 'failed',
      lastError: body?.reason ?? 'Unknown n8n error',
      updatedAt: new Date().toISOString()
    });
    return NextResponse.json({ campaignId: id, status: 'failed', reason: body?.reason ?? null });
  } catch (error) {
    console.error('Failed to fail campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
