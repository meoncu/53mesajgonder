import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('groups').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const docRef = await adminDb.collection('groups').add({
      name,
      description: description || '',
      ownerUserId: 'meoncu@gmail.com', // Demo user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberCount: 0
    });

    const newGroup = {
      id: docRef.id,
      name,
      description,
      memberCount: 0
    };

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error('Failed to create group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
