import { NextResponse } from 'next/server';
import { GooglePeopleSyncService } from '@/server/integrations/google/people-sync-service';

export async function POST() {
  const service = new GooglePeopleSyncService();
  const result = await service.runFullSync('current-user');
  return NextResponse.json({ ok: true, result });
}
