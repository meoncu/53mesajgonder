import { NextRequest, NextResponse } from 'next/server';
import { assertServiceAuth } from '@/server/middleware/service-auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertServiceAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  return NextResponse.json({ campaignId: id, status: 'completed' });
}
