import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase Config Missing');
  return createClient(url, key);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'hadis';
  const supabase = getSupabase();

  try {
    if (type === 'hadis') {
      const { data: hadisler, error } = await supabase
        .from('hadisler')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      const { data: logs } = await supabase
        .from('content_logs')
        .select('content_id')
        .eq('content_type', 'hadis');
      
      const sentIds = new Set(logs?.map(l => String(l.content_id)) || []);

      const formatted = hadisler.map((h: any) => ({
        id: String(h.id),
        content: h.metin_turkce,
        narrator: h.ravi,
        source: h.kaynak,
        type: 'hadis',
        is_sent: sentIds.has(String(h.id)),
        order_index: h.id
      }));

      return NextResponse.json({ items: formatted });
    } else {
      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('type', type)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ items: data });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getSupabase();
  const { data, error } = await supabase.from('content_library').insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// GÜNCELLEME (PATCH) METODU
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, content, narrator, source, type } = body;
  const supabase = getSupabase();

  try {
    if (type === 'hadis') {
      // SİZİN 'hadisler' TABLOSUNU GÜNCELLE
      const { data, error } = await supabase
        .from('hadisler')
        .update({
          metin_turkce: content,
          ravi: narrator,
          kaynak: source,
        })
        .eq('id', parseInt(id)) // id int8 olduğu için sayıya çeviriyoruz
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // NORMAL KÜTÜPHANEYİ GÜNCELLE
      const { data, error } = await supabase
        .from('content_library')
        .update({
          content,
          narrator,
          source,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// SİLME (DELETE) METODU
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'hadis';
  const supabase = getSupabase();

  if (!id) return NextResponse.json({ error: 'ID eksik' }, { status: 400 });

  try {
    if (type === 'hadis') {
      const { error } = await supabase.from('hadisler').delete().eq('id', parseInt(id));
      if (error) throw error;
    } else {
      const { error } = await supabase.from('content_library').delete().eq('id', id);
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
