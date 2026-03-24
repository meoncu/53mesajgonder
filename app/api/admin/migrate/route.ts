import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Simple security check (optional, can be improved)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== 'migrate123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const results: any = { contacts: 0, groups: 0 };

  try {
    // 1. Migrate Groups
    const groupsSnapshot = await adminDb.collection('groups').get();
    for (const doc of groupsSnapshot.docs) {
      const data = doc.data();
      await supabase.from('groups').upsert({
        id: doc.id,
        name: data.name,
        color: data.color,
        member_count: data.memberCount || 0,
        owner_user_id: data.ownerUserId || 'meoncu@gmail.com',
        created_at: data.createdAt || new Date().toISOString()
      });
      results.groups++;
    }

    // 2. Migrate Contacts
    const contactsSnapshot = await adminDb.collection('contacts').get();
    for (const doc of contactsSnapshot.docs) {
      const data = doc.data();
      await supabase.from('contacts').upsert({
        id: doc.id,
        full_name: data.fullName,
        first_name: data.firstName || '',
        last_name: data.lastName || '',
        primary_phone: data.primaryPhone || '',
        normalized_primary_phone: data.normalizedPrimaryPhone || '',
        primary_email: data.primaryEmail || '',
        source: data.source || 'system',
        notes: data.notes || '',
        tags: data.tags || [],
        group_ids: data.groupIds || [],
        is_active: data.isActive ?? true,
        owner_user_id: data.ownerUserId || 'meoncu@gmail.com'
      });
      results.contacts++;
    }

    return NextResponse.json({ 
      message: 'Migration completed successfully', 
      results 
    });
  } catch (error: any) {
    console.error('Migration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
