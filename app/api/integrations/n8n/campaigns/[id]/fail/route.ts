import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { assertServiceAuth } from '@/server/middleware/service-auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertServiceAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  
  try {
    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase
      .from('campaigns')
      .update({
        status: 'failed',
        last_error: body?.reason ?? 'Unknown n8n error',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ campaignId: id, status: 'failed', reason: body?.reason ?? null });
  } catch (error: any) {
    console.error('Failed to fail campaign in Supabase:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
