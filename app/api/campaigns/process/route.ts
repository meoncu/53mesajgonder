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

    const processedCampaigns = [];

    for (const campaign of dueCampaigns) {
      const groupIds = campaign.group_ids || [];
      const contacts: any[] = [];

      if (groupIds.length > 0) {
        // Fetch contacts that belong to any of these groups
        // Using overlaps (&&) for array columns in Supabase
        const { data: contactsData, error: contactError } = await supabase
          .from('contacts')
          .select('id, full_name, primary_phone, normalized_primary_phone')
          .overlaps('group_ids', groupIds);

        if (contactError) {
          console.error(`Failed to fetch contacts for campaign ${campaign.id}:`, contactError);
          continue;
        }

        if (contactsData) {
          contactsData.forEach(c => {
            const phone = c.normalized_primary_phone || c.primary_phone;
            if (phone) {
              contacts.push({
                id: c.id,
                fullName: c.full_name,
                phone: phone
              });
            }
          });
        }
      }

      processedCampaigns.push({
        id: campaign.id,
        name: campaign.name,
        message: campaign.message,
        contacts,
        processedAtLocal: localNow
      });

      // Update status to 'processing'
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
