import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function POST() {
  const supabase = getSupabase();
  try {
    const { data: automations, error: autoError } = await supabase
      .from('content_automation')
      .select('*')
      .eq('is_active', true);

    if (autoError) throw autoError;

    const processedItems = [];

    for (const auto of automations) {
      const { data: nextItem, error: itemError } = await supabase
        .from('content_library')
        .select('*')
        .eq('type', auto.content_type)
        .eq('is_sent', false)
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

      if (itemError || !nextItem) continue;

      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('full_name, primary_phone')
        .overlaps('group_ids', auto.group_ids);

      if (contactError || !contacts || contacts.length === 0) continue;

      await supabase
        .from('content_library')
        .update({ is_sent: true })
        .eq('id', nextItem.id);

      const { data: logData } = await supabase
        .from('content_logs')
        .insert([{
          content_id: nextItem.id,
          content_type: auto.content_type,
          recipient_group_ids: auto.group_ids,
          recipient_count: contacts.length,
          sent_recipients: contacts
        }])
        .select()
        .single();

      const n8nPayload = {
        action: 'scheduled_knowledge_send',
        content_type: auto.content_type,
        message: nextItem.content,
        narrator: nextItem.narrator,
        source: nextItem.source,
        recipients: contacts,
        log_id: logData?.id
      };

      processedItems.push(n8nPayload);
    }

    return NextResponse.json({ 
      success: true, 
      processed_count: processedItems.length,
      items: processedItems 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
