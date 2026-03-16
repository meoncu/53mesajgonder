import { NextRequest, NextResponse } from 'next/server';
import { assertServiceAuth } from '@/server/middleware/service-auth';

export async function POST(req: NextRequest) {
  if (!assertServiceAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await req.json();
  return NextResponse.json({ ok: true, received: payload });
}
