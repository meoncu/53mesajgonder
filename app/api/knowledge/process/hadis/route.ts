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
    // 1. OTOMASYON AYARLARINI AL
    const { data: automation, error: autoError } = await supabase
      .from('content_automation')
      .select('*')
      .eq('content_type', 'hadis')
      .eq('is_active', true)
      .single();

    if (autoError || !automation) {
      return NextResponse.json({ success: false, message: 'Aktif hadis otomasyonu bulunamadı.' });
    }

    // 2. DAHA ÖNCE GÖNDERİLMEYEN İLK HADİSİ BUL
    const { data: logs } = await supabase
      .from('content_logs')
      .select('content_id')
      .eq('content_type', 'hadis');
    
    const sentIds = logs?.map(l => parseInt(l.content_id)) || [];

    const { data: nextHasith, error: hasithError } = await supabase
      .from('hadisler')
      .select('*')
      .not('id', 'in', `(${sentIds.length > 0 ? sentIds.join(',') : -1})`)
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (hasithError || !nextHasith) {
      return NextResponse.json({ success: false, message: 'Gönderilecek yeni hadis kalmadı.' });
    }

    // 3. HEDEF GRUPLARDAKİ KİŞİLERİ BUL
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('full_name, primary_phone')
      .contains('group_ids', automation.group_ids);

    if (contactError || !contacts || contacts.length === 0) {
      return NextResponse.json({ success: false, message: 'Hedef gruplarda kayıtlı kimse bulunamadı.' });
    }

    // 4. MESAJI FORMATLA (Ravi + Metin + Kaynak)
    const formattedMessage = `*${nextHasith.ravi}* anlatıyor:\n\n"${nextHasith.metin_turkce}"\n\n(Kaynak: ${nextHasith.kaynak})`;

    // 5. GÖNDERİM KAYDI OLUŞTUR (is_sent: false kalsın, n8n tamamlayınca true olacak)
    const { data: logRecord, error: logErr } = await supabase
      .from('content_logs')
      .insert([{
        content_id: String(nextHasith.id),
        content_type: 'hadis',
        recipient_group_ids: automation.group_ids,
        is_sent: false
      }])
      .select()
      .single();

    if (logErr) throw logErr;

    // N8N WORKFLOW'UNA UYGUN TASARLANMIŞ LİSTE FORMATI
    return NextResponse.json({
      success: true,
      items: [
        {
          item_id: nextHasith.id,
          raw_content: nextHasith.metin_turkce,
          formatted_message: formattedMessage,
          contacts: contacts, // 'recipients' yerine 'contacts' yaptık
          log_id: logRecord.id
        }
      ]
    });

  } catch (error: any) {
    console.error('Hadis Process Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
