import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    
    // Fetch contacts that have this groupId in their group_ids array
    const { data: items, error: dbError } = await supabase
      .from('contacts')
      .select('*')
      .contains('group_ids', [id]);
    
    if (dbError) throw dbError;

    const formattedItems = (items || []).map((item: any) => ({
      id: item.id,
      fullName: item.full_name,
      primaryPhone: item.primary_phone,
      source: item.source
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error('Failed to fetch group members from Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { contactIds } = await request.json(); // Array of contact IDs to add

    if (!Array.isArray(contactIds)) {
      return NextResponse.json({ error: 'contactIds must be an array' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // In a production app, this should be a stored procedure or a batch update
    // For now, we update each contact to append the new groupId
    for (const contactId of contactIds) {
      // 1. Get current groups
      const { data: contact } = await supabase
        .from('contacts')
        .select('group_ids')
        .eq('id', contactId)
        .single();
      
      const currentGroups = contact?.group_ids || [];
      if (!currentGroups.includes(id)) {
        const newGroups = [...currentGroups, id];
        await supabase
          .from('contacts')
          .update({ group_ids: newGroups })
          .eq('id', contactId);
      }
    }

    // Update group member count
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .contains('group_ids', [id]);
      
    await supabase
      .from('groups')
      .update({ member_count: count || 0 })
      .eq('id', id);

    return NextResponse.json({ success: true, count: count || 0 });
  } catch (error) {
    console.error('Failed to add members in Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { contactId } = await request.json();

    const supabase = getSupabaseAdmin();

    // 1. Get current groups
    const { data: contact } = await supabase
      .from('contacts')
      .select('group_ids')
      .eq('id', contactId)
      .single();
    
    const currentGroups = contact?.group_ids || [];
    const newGroups = currentGroups.filter((gid: string) => gid !== id);

    await supabase
      .from('contacts')
      .update({ group_ids: newGroups })
      .eq('id', contactId);

    // Update group member count
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .contains('group_ids', [id]);
      
    await supabase
      .from('groups')
      .update({ member_count: count || 0 })
      .eq('id', id);

    return NextResponse.json({ success: true, count: count || 0 });
  } catch (error) {
    console.error('Failed to remove member in Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
