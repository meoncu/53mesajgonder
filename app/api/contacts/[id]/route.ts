import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase/admin';
import { invalidateContactsCache } from '@/lib/cache';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes, fullName, primaryPhone, tags, groupIds } = body;

    const contactRef = adminDb.collection('contacts').doc(id);
    const prevDoc = await contactRef.get();
    const prevData = prevDoc.data();
    const prevGroupIds = prevData?.groupIds || [];

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (notes !== undefined) updateData.notes = notes;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (primaryPhone !== undefined) updateData.primaryPhone = primaryPhone;
    if (tags !== undefined) updateData.tags = tags;
    if (groupIds !== undefined) updateData.groupIds = groupIds;

    await contactRef.update(updateData);
    invalidateContactsCache();

    // Update group member counts if groupIds changed
    if (groupIds !== undefined) {
      const allAffectedGroups = Array.from(new Set([...prevGroupIds, ...groupIds]));
      for (const gid of allAffectedGroups) {
        const groupRef = adminDb.collection('groups').doc(gid);
        const countSnapshot = await adminDb.collection('contacts')
          .where('groupIds', 'array-contains', gid)
          .count()
          .get();
        await groupRef.update({ memberCount: countSnapshot.data().count });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update contact:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the contact first to find groupIds
    const contactRef = adminDb.collection('contacts').doc(id);
    const contactDoc = await contactRef.get();
    
    if (!contactDoc.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    const contactData = contactDoc.data();
    const groupIds = contactData?.groupIds || [];
    
    // Delete the contact
    await contactRef.delete();
    invalidateContactsCache();
    
    // Update member counts for all groups it belonged to
    if (groupIds.length > 0) {
      for (const groupId of groupIds) {
        const groupRef = adminDb.collection('groups').doc(groupId);
        const countSnapshot = await adminDb.collection('contacts')
          .where('groupIds', 'array-contains', groupId)
          .count()
          .get();
          
        await groupRef.update({ memberCount: countSnapshot.data().count });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contact:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
