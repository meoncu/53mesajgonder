import { getSupabaseAdmin } from './supabase';

async function debug() {
  const supabase = getSupabaseAdmin();
  const groupId = 'uk2bw981y2j';
  
  console.log('Searching for contacts in group:', groupId);
  
  const { data, error } = await supabase
    .from('contacts')
    .select('id, full_name, primary_phone, normalized_primary_phone, group_ids')
    .overlaps('group_ids', [groupId]);
    
  if (error) {
    console.error('Error fetching contacts:', error);
    return;
  }
  
  console.log(`Found ${data?.length || 0} contacts:`);
  data?.forEach(c => {
    console.log(`- ${c.full_name}: ${c.primary_phone || c.normalized_primary_phone || 'NO PHONE'}`);
  });
}

debug();
