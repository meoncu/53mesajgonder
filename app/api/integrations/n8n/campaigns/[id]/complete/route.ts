import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const SERVICE_TOKEN = 'f7d4b4a1c2e3g4h5i6j7k8l9m0n1o2p3';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('x-service-token');

    // Security Check
    if (token !== SERVICE_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Mark campaign as completed
    const { error: dbError } = await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: 'Campaign marked as completed' });
  } catch (error: any) {
    console.error('Failed to complete campaign:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
