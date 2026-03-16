import { NextRequest, NextResponse } from 'next/server';
import { createProcessingLock } from '@/server/integrations/n8n/n8n-service';
import { assertServiceAuth } from '@/server/middleware/service-auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertServiceAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const lock = createProcessingLock('n8n-worker');
  return NextResponse.json({ campaignId: id, lock, status: 'queued' });
}
