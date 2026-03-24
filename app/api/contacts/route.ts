import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParams = parseInt(searchParams.get('limit') || '4000');
    
    // Switch to Supabase
    const supabase = getSupabaseAdmin();
    const { data: items, error: dbError } = await supabase
      .from('contacts')
      .select('*')
      .order('full_name', { ascending: true })
      .limit(limitParams);

    if (dbError) throw dbError;

    // Map snake_case to camelCase for frontend compatibility
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
      groupIds: item.group_ids,
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


