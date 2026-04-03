import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAppSettings } from '@/lib/firebase/settings';
import { getLocalTimestamp, getUtcTimestamp } from '@/lib/utils/time';

export async function GET() {
  try {
    const settings = await getAppSettings();
    const now = getUtcTimestamp();
    const localNow = await getLocalTimestamp();
    
    const supabase = getSupabaseAdmin();

    const parseSafeArray = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          if (val.startsWith('[')) return JSON.parse(val);
          return val.split(',').map(s => s.trim()).filter(Boolean);
        } catch (e) {
          return [val];
        }
      }
      return [];
    };

    // Find scheduled campaigns that are due
    const { data: dueCampaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (campaignError) throw campaignError;

    if (!dueCampaigns || dueCampaigns.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const processedCampaigns: any[] = [];

    for (const campaign of dueCampaigns) {
      const groupIds = parseSafeArray(campaign.group_ids);
      const individualContactIds = parseSafeArray(campaign.contact_ids);
      
      const contactsMap = new Map<string, any>();

      // Combined Query for both groups and individual IDs to reduce DB calls and issues
      let allContacts: any[] = [];
      
      // 1. Fetch from Groups if any
      if (groupIds.length > 0) {
        const { data: groupContacts, error: groupError } = await supabase
          .from('contacts')
          .select('id, full_name, primary_phone, normalized_primary_phone')
          .overlaps('group_ids', groupIds);
        
        if (!groupError && groupContacts) {
          allContacts = [...allContacts, ...groupContacts];
        }
      }

      // 2. Fetch from Individual IDs if any
      if (individualContactIds.length > 0) {
        const { data: individualContacts, error: indError } = await supabase
          .from('contacts')
          .select('id, full_name, primary_phone, normalized_primary_phone')
          .in('id', individualContactIds);
        
        if (!indError && individualContacts) {
          allContacts = [...allContacts, ...individualContacts];
        }
      }

      // 3. Deduplicate and validate phones
      allContacts.forEach(c => {
        const phone = c.normalized_primary_phone || c.primary_phone;
        if (phone && !contactsMap.has(c.id)) {
          contactsMap.set(c.id, {
            id: c.id,
            fullName: c.full_name,
            phone: phone
          });
        }
      });

      const contacts = Array.from(contactsMap.values());

      // Create a separate item for each contact so automation processes them as separate rows
      contacts.forEach(contact => {
        processedCampaigns.push({
          id: campaign.id,
          name: campaign.name,
          message: campaign.message,
          contact, // Send a single contact instead of an array
          processedAtLocal: localNow
        });
      });

      // Update status to 'processing' once per campaign
      await supabase
        .from('campaigns')
        .update({ 
          status: 'processing', 
          updated_at: now 
        })
        .eq('id', campaign.id);
    }

    return NextResponse.json({ 
      items: processedCampaigns,
      processedAt: now,
      timezone: settings.timezone
    });
  } catch (error: any) {
    console.error('Failed to process campaigns:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message
    }, { status: 500 });
  }
}
