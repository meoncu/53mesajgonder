import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('content_automation')
    .select('*');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { content_type, group_ids, schedule_day, schedule_time, is_active } = body;

  const { data, error } = await supabase
    .from('content_automation')
    .upsert({
      content_type,
      group_ids,
      schedule_day,
      schedule_time,
      is_active,
      updated_at: new Date().toISOString()
    }, { onConflict: 'content_type' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
