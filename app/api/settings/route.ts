import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, updateAppSettings } from '@/lib/firebase/settings';

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await updateAppSettings(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
