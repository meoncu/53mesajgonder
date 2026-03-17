import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // Fetch contacts that have this groupId in their groupIds array
    const snapshot = await adminDb.collection('contacts')
      .where('groupIds', 'array-contains', id)
      .get();
    
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch group members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { contactIds } = await request.json(); // Array of contact IDs to add

    if (!Array.isArray(contactIds)) {
      return NextResponse.json({ error: 'contactIds must be an array' }, { status: 400 });
    }

    const batch = adminDb.batch();
    
    for (const contactId of contactIds) {
      const contactRef = adminDb.collection('contacts').doc(contactId);
      batch.update(contactRef, {
        groupIds: admin.firestore.FieldValue.arrayUnion(id)
      });
    }

    await batch.commit();

    // Update group member count
    const groupRef = adminDb.collection('groups').doc(id);
    const countSnapshot = await adminDb.collection('contacts')
      .where('groupIds', 'array-contains', id)
      .count()
      .get();
      
    await groupRef.update({ memberCount: countSnapshot.data().count });

    return NextResponse.json({ success: true, count: countSnapshot.data().count });
  } catch (error) {
    console.error('Failed to add members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { contactId } = await request.json();

    const contactRef = adminDb.collection('contacts').doc(contactId);
    await contactRef.update({
      groupIds: admin.firestore.FieldValue.arrayRemove(id)
    });

    // Update group member count
    const groupRef = adminDb.collection('groups').doc(id);
    const countSnapshot = await adminDb.collection('contacts')
      .where('groupIds', 'array-contains', id)
      .count()
      .get();
      
    await groupRef.update({ memberCount: countSnapshot.data().count });

    return NextResponse.json({ success: true, count: countSnapshot.data().count });
  } catch (error) {
    console.error('Failed to remove member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
