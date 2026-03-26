import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { assertServiceAuth } from '@/server/middleware/service-auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertServiceAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { recipients } = body;
  
  try {
    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        is_archived: true,
        sent_recipients: recipients || [],
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ campaignId: id, status: 'completed', archived: true });
  } catch (error: any) {
    console.error('Failed to complete and archive campaign in Supabase:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
