import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAppSettings } from '@/lib/firebase/settings';
import { getLocalTimestamp, getUtcTimestamp } from '@/lib/utils/time';

export async function GET() {
  try {
    const settings = await getAppSettings();
    const now = getUtcTimestamp();
    const localNow = await getLocalTimestamp();
    
    // Find scheduled campaigns that are due
    const snapshot = await adminDb.collection('campaigns')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ items: [] });
    }

    const campaigns = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const groupIds = data.groupIds || [];
      let contacts: any[] = [];

      if (groupIds.length > 0) {
        // Fetch all unique contacts for these groups
        const contactsSnapshot = await adminDb.collection('contacts')
          .where('groupIds', 'array-contains-any', groupIds)
          .get();

        contacts = contactsSnapshot.docs.map(cDoc => {
          const cData = cDoc.data();
          return {
            id: cDoc.id,
            fullName: cData.fullName,
            phone: cData.normalizedPrimaryPhone || cData.primaryPhone
          };
        }).filter(c => !!c.phone); // Only contacts with phone
      }

      campaigns.push({
        id: doc.id,
        name: data.name,
        message: data.message,
        contacts,
        processedAtLocal: localNow
      });

      // Update status to 'processing' so it's not picked up again immediately
      await doc.ref.update({ 
        status: 'processing', 
        updatedAt: now 
      });
    }

    return NextResponse.json({ 
      items: campaigns,
      processedAt: now,
      timezone: settings.timezone
    });
  } catch (error: any) {
    console.error('Failed to process campaigns:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message
    }, { status: 500 });
  }
}
