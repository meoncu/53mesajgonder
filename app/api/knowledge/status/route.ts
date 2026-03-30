import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase Config Missing');
  return createClient(url, key);
};

export async function POST(request: Request) {
  const body = await request.json();
  const { id, type, is_sent } = body;
  const supabase = getSupabase();

  try {
    if (is_sent) {
      // Create a dummy log to mark it as sent
      const { error } = await supabase.from('content_logs').insert([{
        content_id: String(id),
        content_type: type,
        is_sent: true,
        recipient_group_ids: []
      }]);
      if (error) throw error;
    } else {
      // Remove it from logs to mark it as Unsent (SIRADA)
      const { error } = await supabase.from('content_logs')
        .delete()
        .eq('content_id', String(id))
        .eq('content_type', type);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
