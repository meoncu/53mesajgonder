import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const SERVICE_TOKEN = 'f7d4b4a1c2e3g4h5i6j7k8l9m0n1o2p3';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('x-service-token');

    // Security Check
    if (token !== SERVICE_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Try to parse body. If n8n sends a contact, log it as an individual send.
    // If n8n sends no body, treat it as completing the whole campaign.
    let body: any = {};
    try {
      body = await request.json();
    } catch(e) {}

    if (body && body.contact) {
      const { data: campaign } = await supabase.from('campaigns').select('sent_recipients, contact_ids, group_ids').eq('id', id).single();
      const currentSent = campaign?.sent_recipients || [];
      const newSent = [...currentSent];
      
      if (!newSent.find((c: any) => c.id === body.contact.id)) {
        newSent.push(body.contact);
      }

      // Calculate total expected recipients
      let allContacts: any[] = [];
      const groupIds = campaign?.group_ids || [];
      const contactIds = campaign?.contact_ids || [];

      if (groupIds.length > 0) {
        const { data: groupContacts } = await supabase.from('contacts').select('id, primary_phone, normalized_primary_phone').overlaps('group_ids', groupIds);
        if (groupContacts) allContacts = [...allContacts, ...groupContacts];
      }
      if (contactIds.length > 0) {
        const { data: individualContacts } = await supabase.from('contacts').select('id, primary_phone, normalized_primary_phone').in('id', contactIds);
        if (individualContacts) allContacts = [...allContacts, ...individualContacts];
      }

      // Filter to only contacts with valid phones, as the automation only processes those
      const uniqueContactIds = new Set(
        allContacts
          .filter(c => c.primary_phone || c.normalized_primary_phone)
          .map(c => c.id)
      );
      const totalExpected = uniqueContactIds.size || 1; // Fallback to 1 to be safe

      const updateData: any = {
        sent_recipients: newSent,
        updated_at: new Date().toISOString()
      };

      let isCompletedNow = false;
      if (newSent.length >= totalExpected) {
        updateData.status = 'completed';
        updateData.sent_at = new Date().toISOString();
        isCompletedNow = true;
      }
      
      const { error: dbError } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id);
        
      if (dbError) throw dbError;
      return NextResponse.json({ 
        success: true, 
        message: isCompletedNow ? 'Contact sent and campaign completed' : 'Contact marked as sent', 
        sent_recipients: newSent,
        isCompleted: isCompletedNow
      });
    }

    // Mark campaign as completed
    const { error: dbError } = await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: 'Campaign marked as completed' });
  } catch (error: any) {
    console.error('Failed to complete campaign:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
