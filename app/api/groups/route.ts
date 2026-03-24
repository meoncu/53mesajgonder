import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: items, error: dbError } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true });

    if (dbError) throw dbError;

    // Map snake_case to camelCase
    const formattedItems = (items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      color: item.color,
      memberCount: item.member_count,
      ownerUserId: item.owner_user_id,
      createdAt: item.created_at
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error('Failed to fetch groups from Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const id = Math.random().toString(36).substring(2, 15);
    
    const { data, error: dbError } = await supabase
      .from('groups')
      .insert({
        id,
        name,
        color: color || '#3B82F6',
        member_count: 0,
        owner_user_id: 'meoncu@gmail.com',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      id: data.id,
      name: data.name,
      color: data.color,
      memberCount: data.member_count
    });
  } catch (error) {
    console.error('Failed to create group in Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
