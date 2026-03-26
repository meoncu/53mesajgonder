import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase Config Missing');
  return createClient(url, key);
};

export async function GET() {
  const supabase = getSupabase();
  try {
    const { data: auto, error: autoError } = await supabase
      .from('content_automation')
      .select('*')
      .eq('is_active', true)
      .eq('content_type', 'sunnet')
      .maybeSingle();

    if (autoError || !auto) return NextResponse.json({ success: false, message: 'Aktif Sünnet otomasyonu bulunamadı.' });

    const { data: nextItem, error: itemError } = await supabase
      .from('content_library')
      .select('*')
      .eq('type', 'sunnet')
      .eq('is_sent', false)
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (itemError || !nextItem) return NextResponse.json({ success: false, message: 'Gönderilecek yeni Sünnet bulunamadı.' });

    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('full_name, primary_phone')
      .overlaps('group_ids', auto.group_ids);

    if (contactError || !contacts || contacts.length === 0) return NextResponse.json({ success: false, message: 'Alıcı bulunamadı.' });

    const { data: logData } = await supabase.from('content_logs').insert([{
      content_id: nextItem.id,
      content_type: 'sunnet',
      recipient_group_ids: auto.group_ids,
      recipient_count: contacts.length,
      sent_recipients: contacts
    }]).select().maybeSingle();

    return NextResponse.json({ 
      success: true, 
      action: 'SUNNET_TETIKLENDI',
      item_id: nextItem.id,
      content: nextItem.content,
      narrator: nextItem.narrator,
      source: nextItem.source,
      recipients: contacts,
      log_id: logData?.id
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() { return GET(); }
