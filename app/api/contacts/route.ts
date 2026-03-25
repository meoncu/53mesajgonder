import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParams = parseInt(searchParams.get('limit') || '4000');
    
    const supabase = getSupabaseAdmin();
    const { data: items, error: dbError } = await supabase
      .from('contacts')
      .select('*')
      .order('full_name', { ascending: true })
      .limit(limitParams);

    if (dbError) throw dbError;

    const formattedItems = (items || []).map((item: any) => ({
      id: item.id,
      fullName: item.full_name,
      firstName: item.first_name,
      lastName: item.last_name,
      primaryPhone: item.primary_phone,
      normalizedPrimaryPhone: item.normalized_primary_phone,
      primaryEmail: item.primary_email,
      source: item.source,
      notes: item.notes,
      tags: item.tags,
      groupIds: item.group_ids || [],
      isActive: item.is_active,
      ownerUserId: item.owner_user_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    return NextResponse.json({ 
      items: formattedItems, 
      total: formattedItems.length,
      source: 'supabase'
    });
  } catch (error) {
    console.error('Failed to fetch contacts from Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, primaryPhone, notes, groupIds, tags } = body;

    // Split full name into first and last name
    const names = (fullName || '').trim().split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    const supabase = getSupabaseAdmin();

    const dbContact = {
      id: crypto.randomUUID(),
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      primary_phone: primaryPhone || null,
      normalized_primary_phone: primaryPhone ? primaryPhone.replace(/[^0-9]/g, '') : null,
      notes: notes || '',
      group_ids: groupIds || [],
      tags: tags || [],
      source: 'manual',
      is_active: true,
      owner_user_id: 'meoncu@gmail.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert(dbContact)
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }

    // Recalculate member counts for affected groups
    const allGroups = groupIds || [];
    for (const gid of allGroups) {
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .contains('group_ids', [gid]);
        
      await supabase
        .from('groups')
        .update({ member_count: count || 0 })
        .eq('id', gid);
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error: any) {
    console.error('Failed to create contact in Supabase:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
