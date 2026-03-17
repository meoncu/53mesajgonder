import { NextRequest, NextResponse } from 'next/server';
import { GooglePeopleSyncService } from '@/server/integrations/google/people-sync-service';

export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();
  if (!accessToken) {
    return NextResponse.json({ error: 'accessToken is required' }, { status: 400 });
  }
  const service = new GooglePeopleSyncService();
  const result = await service.runFullSync('current-user', accessToken);
  return NextResponse.json({ ok: true, result });
}
