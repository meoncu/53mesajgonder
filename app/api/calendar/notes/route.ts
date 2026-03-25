import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: items, error: dbError } = await supabase
      .from('calendar_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch calendar notes from Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, title, description, type } = await request.json();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('calendar_notes')
      .insert({
        date,
        title,
        description,
        type: type || 'user_note',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('Failed to create calendar note in Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase
      .from('calendar_notes')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete calendar note from Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
