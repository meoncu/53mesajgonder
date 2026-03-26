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
    // 1. AKTİF HADİS OTOMASYONUNU ÇEK
    const { data: auto, error: autoError } = await supabase
      .from('content_automation')
      .select('*')
      .eq('is_active', true)
      .eq('content_type', 'hadis')
      .maybeSingle();

    if (autoError || !auto) return NextResponse.json({ success: false, message: 'Aktif Hadis otomasyonu bulunamadı.' });

    // 2. DAHA ÖNCE GÖNDERİLMİŞ HADİS ID'LERİNİ ÇEK
    const { data: sentLogs } = await supabase
      .from('content_logs')
      .select('content_id')
      .eq('content_type', 'hadis');
    
    const sentIds = sentLogs?.map(log => log.content_id) || [];

    // 3. SİZİN 'hadisler' TABLOSUNDAN GÖNDERİLMEMİŞ İLK HADİSİ ÇEK
    // (id'ye göre sıralı)
    const { data: nextHadis, error: hadisError } = await supabase
      .from('hadisler')
      .select('*')
      .not('id', 'in', `(${sentIds.join(',') || '0'})`)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (hadisError || !nextHadis) return NextResponse.json({ success: false, message: 'Gönderilecek yeni bir Hadis bulunamadı.' });

    // 4. MESAJ METNİNİ OLUŞTUR (İstediğiniz Format)
    // Ravi + Metin + Kaynak
    const fullMessage = `${nextHadis.ravi}\n\n"${nextHadis.metin_turkce}"\n\n(Kaynak: ${nextHadis.kaynak})`;

    // 5. ALICILARI ÇEK
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('full_name, primary_phone')
      .overlaps('group_ids', auto.group_ids);

    if (contactError || !contacts || contacts.length === 0) return NextResponse.json({ success: false, message: 'Alıcı bulunamadı.' });

    // 6. GÜNLÜĞE YAZ
    const { data: logData } = await supabase.from('content_logs').insert([{
      content_id: String(nextHadis.id),
      content_type: 'hadis',
      recipient_group_ids: auto.group_ids,
      recipient_count: contacts.length,
      sent_recipients: contacts
    }]).select().maybeSingle();

    // 7. n8n'e DİREKT HAZIR METNİ DÖN
    return NextResponse.json({ 
      success: true, 
      action: 'HADIS_TETIKLENDI',
      item_id: String(nextHadis.id),
      raw_content: nextHadis.metin_turkce,
      formatted_message: fullMessage, // n8n'de direkt bu alanı kullanabilirsiniz
      recipients: contacts,
      log_id: logData?.id
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() { return GET(); }
