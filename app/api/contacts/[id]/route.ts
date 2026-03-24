import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes, fullName, primaryPhone, tags, groupIds } = body;

    const supabase = getSupabaseAdmin();
    
    // Map camcelCase body to snake_case DB fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (notes !== undefined) updateData.notes = notes;
    if (fullName !== undefined) updateData.full_name = fullName;
    if (primaryPhone !== undefined) updateData.primary_phone = primaryPhone;
    if (tags !== undefined) updateData.tags = tags;
    if (groupIds !== undefined) updateData.group_ids = groupIds;

    const { data, error: dbError } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;

    // Optional: Recalculate member counts for affected groups
    if (groupIds !== undefined) {
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
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('Failed to update contact in Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Get current contact info to find groups before deletion
    const { data: contactData } = await supabase
      .from('contacts')
      .select('group_ids')
      .eq('id', id)
      .single();

    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Recalculate counts for groups this contact was in
    if (contactData?.group_ids?.length) {
      for (const gid of contactData.group_ids) {
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .contains('group_ids', [gid]);
          
        await supabase
          .from('groups')
          .update({ member_count: count || 0 })
          .eq('id', gid);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contact from Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
