import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('campaigns').orderBy('createdAt', 'desc').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating campaign with body:', body);
    const { name, message, groupIds, scheduledAt } = body;

    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!message) missingFields.push('message');
    if (!groupIds || groupIds.length === 0) missingFields.push('groupIds');

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        fields: missingFields,
        received: { name, message, groupIds }
      }, { status: 400 });
    }

    const campaignData = {
      name,
      message,
      groupIds,
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? 'scheduled' : 'draft',
      ownerUserId: 'meoncu@gmail.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('campaigns').add(campaignData);

    return NextResponse.json({ id: docRef.id, ...campaignData });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
