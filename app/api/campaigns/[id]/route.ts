import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, message, groupIds, scheduledAt, status } = body;

    const supabase = getSupabaseAdmin();
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (name !== undefined) updateData.name = name;
    if (message !== undefined) updateData.message = message;
    if (groupIds !== undefined) updateData.group_ids = groupIds;
    if (scheduledAt !== undefined) updateData.scheduled_at = scheduledAt;
    if (status !== undefined) updateData.status = status;

    const { error: dbError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update campaign in Supabase:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
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
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete campaign from Supabase:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
