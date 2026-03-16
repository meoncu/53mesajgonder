import { NextRequest, NextResponse } from 'next/server';
import { assertServiceAuth } from '@/server/middleware/service-auth';

export async function GET(req: NextRequest) {
  if (!assertServiceAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ items: [], cursor: null });
}
