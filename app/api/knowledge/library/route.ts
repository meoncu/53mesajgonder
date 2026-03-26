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

  console.log('Fetching Library for type:', type);

  try {
    if (type === 'hadis') {
      // DİKKAT: 'hadisler' tablosunda id sütunu int8 olduğu için sıralama id bazlı
      const { data: hadisler, error: hadisError } = await supabase
        .from('hadisler')
        .select('*')
        .order('id', { ascending: true });

      if (hadisError) {
        console.error('Hadisler Table Fetch Error:', hadisError);
        throw hadisError;
      }

      console.log('Hadis count from DB:', hadisler?.length || 0);

      // GÖNDERİLENLERİ TAKİP ETMEK İÇİN LOGLARI DA ÇEKELİM
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
    console.error('Total API Error:', error);
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
