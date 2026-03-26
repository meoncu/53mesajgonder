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
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;
  
  const supabase = getSupabase();

  try {
    let totalCount = 0;
    let formatted: any[] = [];

    if (type === 'hadis') {
      // TOPLAM SAYIYI AL (Sayfalama için)
      const { count } = await supabase
        .from('hadisler')
        .select('*', { count: 'exact', head: true });
      
      totalCount = count || 0;

      // SADECE İLGİLİ SAYFAYI ÇEK
      const { data: hadisler, error } = await supabase
        .from('hadisler')
        .select('*')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // GÖNDERİLENLERİ TAKİP ETMEK İÇİN LOGLARI O SAYFA ÖZELİNDE KONTROL ET
      const currentIds = hadisler.map((h: any) => String(h.id));
      const { data: logs } = await supabase
        .from('content_logs')
        .select('content_id')
        .eq('content_type', 'hadis')
        .in('content_id', currentIds);
      
      const sentIds = new Set(logs?.map(l => String(l.content_id)) || []);

      formatted = hadisler.map((h: any) => ({
        id: String(h.id),
        content: h.metin_turkce,
        narrator: h.ravi,
        source: h.kaynak,
        type: 'hadis',
        is_sent: sentIds.has(String(h.id)),
        order_index: h.id
      }));

    } else {
      const { count } = await supabase
        .from('content_library')
        .select('*', { count: 'exact', head: true })
        .eq('type', type);
      
      totalCount = count || 0;

      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('type', type)
        .order('order_index', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      formatted = data;
    }

    return NextResponse.json({ 
      items: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST, PATCH, DELETE metotları aynı kalıyor
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getSupabase();
  const { data, error } = await supabase.from('content_library').insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, content, narrator, source, type } = body;
  const supabase = getSupabase();
  try {
    if (type === 'hadis') {
      const { data, error } = await supabase.from('hadisler').update({ metin_turkce: content, ravi: narrator, kaynak: source }).eq('id', parseInt(id)).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      const { data, error } = await supabase.from('content_library').update({ content, narrator, source }).eq('id', id).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
