import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: items, error: dbError } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    const formattedItems = (items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      message: item.message,
      groupIds: item.group_ids,
      status: item.status,
      scheduledAt: item.scheduled_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error('Failed to fetch campaigns from Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, message, groupIds, scheduledAt } = body;

    if (!name || !message || !groupIds?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const id = Math.random().toString(36).substring(2, 15);

    const campaignData = {
      id,
      name,
      message,
      group_ids: groupIds,
      scheduled_at: scheduledAt || null,
      status: scheduledAt ? 'scheduled' : 'draft',
      owner_user_id: 'meoncu@gmail.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error: dbError } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      id: data.id,
      name: data.name,
      message: data.message,
      groupIds: data.group_ids,
      status: data.status,
      createdAt: data.created_at
    });
  } catch (error) {
    console.error('Failed to create campaign in Supabase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
