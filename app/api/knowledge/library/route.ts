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
      // SİZİN ÖZEL 'hadisler' TABLONUZDAN ÇEK
      const { data: hadisler, error } = await supabase
        .from('hadisler')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      // GÖNDERİLENLERİ TAKİP ETMEK İÇİN LOGLARI DA ÇEKELİM
      const { data: logs } = await supabase
        .from('content_logs')
        .select('content_id')
        .eq('content_type', 'hadis');
      
      const sentIds = new Set(logs?.map(l => String(l.content_id)) || []);

      // BİZİM ARAYÜZE UYGUN FORMATTA DÖNÜŞTÜR
      const formatted = hadisler.map((h: any) => ({
        id: String(h.id),
        content: h.metin_turkce,
        narrator: h.ravi,
        source: h.kaynak,
        type: 'hadis',
        is_sent: sentIds.has(String(h.id)),
        order_index: h.id // id'yi sıra numarası olarak kullanıyoruz
      }));

      return NextResponse.json(formatted);
    } else {
      // DİĞERLERİ (Sünnet, İlmihal) NORMAL KÜTÜPHANEDEN GELSİN
      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('type', type)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST, PUT, DELETE metotları (Sadece content_library için kalabilir)
// Ancak Hadis eklerken/silirken sizin hadisler tablosuna da yazabiliriz isterseniz.
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getSupabase();
  const { data, error } = await supabase.from('content_library').insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
