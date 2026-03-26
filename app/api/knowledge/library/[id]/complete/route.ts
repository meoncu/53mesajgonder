import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase Config Missing');
  return createClient(url, key);
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  try {
    // HADİSİ 'is_sent: true' OLARAK GÜNCELLE
    const { data, error } = await supabase
      .from('content_library')
      .update({ 
        is_sent: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'İçerik başarıyla tamamlandı olarak işaretlendi.',
      item: data 
    });

  } catch (error: any) {
    console.error('Complete Knowledge Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
