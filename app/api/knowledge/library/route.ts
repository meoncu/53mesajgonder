import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function GET(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'hadis';

  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('type', type)
    .order('order_index', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  console.log('Knowledge POST Request:', body);
  const { type, content, narrator, source } = body;

  const { data: lastItem } = await supabase
    .from('content_library')
    .select('order_index')
    .eq('type', type)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const nextIndex = lastItem ? lastItem.order_index + 1 : 1;

  const { data, error } = await supabase
    .from('content_library')
    .insert([{
      type,
      content,
      narrator,
      source,
      order_index: nextIndex,
      is_sent: false
    }])
    .select()
    .single();

  if (error) {
    console.error('Knowledge POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from('content_library')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
