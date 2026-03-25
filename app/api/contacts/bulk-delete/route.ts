import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { contactIds } = await request.json();

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'contactIds must be a non-empty array' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Perform bulk delete
    const { error: dbError } = await supabase
      .from('contacts')
      .delete()
      .in('id', contactIds);

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      count: contactIds.length,
      message: `${contactIds.length} kişi başarıyla silindi.`
    });
  } catch (error) {
    console.error('Failed to bulk delete contacts from Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
