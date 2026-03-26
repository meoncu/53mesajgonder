import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase ortam değişkenleri (URL/KEY) eksik!');
  }

  return createClient(url, key);
};

export async function GET(request: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'hadis';

    const { data, error } = await supabase
      .from('content_library')
      .select('*')
      .eq('type', type)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ items: data || [] });
  } catch (error: any) {
    console.error('Library GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    console.log('Knowledge POST Request Body:', body);
    
    const { type, content, narrator, source } = body;
    if (!content) throw new Error('İçerik metni boş olamaz!');

    // Sıra numarasını bul
    const { data: lastItem, error: fetchError } = await supabase
      .from('content_library')
      .select('order_index')
      .eq('type', type)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
       console.error('Fetch last index error:', fetchError);
    }

    const nextIndex = (lastItem?.order_index ?? 0) + 1;

    // Kaydet
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

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Knowledge POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) throw new Error('ID belirtilmedi!');

    const { data, error } = await supabase
      .from('content_library')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Knowledge PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
