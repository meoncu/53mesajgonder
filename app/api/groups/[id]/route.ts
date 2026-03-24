import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, color } = body;

    const supabase = getSupabaseAdmin();
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;

    const { error: dbError } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update group in Supabase:', error);
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

    const { error: dbError } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    // Optional: Remove this group from all contacts
    // Supabase array removal: update contacts set group_ids = array_remove(group_ids, id)
    // For now we'll just delete the group.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete group from Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
