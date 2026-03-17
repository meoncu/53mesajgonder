import { google } from 'googleapis';
import { adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';
import { contactSchema } from '@/lib/validation/domain';

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
}

type Contact = z.infer<typeof contactSchema>;

export class GooglePeopleSyncService {
  async runFullSync(ownerUserId: string, accessToken: string): Promise<SyncResult> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const people = google.people({ version: 'v1', auth });
    
    let created = 0;
    let skipped = 0;

    try {
      const res = await people.people.connections.list({
        resourceName: 'people/me',
        pageSize: 1000,
        personFields: 'names,phoneNumbers,emailAddresses,metadata',
      });

      const connections = res.data.connections || [];

      for (const person of connections) {
        const resourceName = person.resourceName;
        if (!resourceName) continue;

        const fullName = person.names?.[0]?.displayName || 'İsimsiz';
        const phones = person.phoneNumbers?.map(p => p.value || '').filter(Boolean) || [];
        const emails = person.emailAddresses?.map(e => e.value || '').filter(Boolean) || [];
        
        const primaryPhone = phones[0] || '';
        // Basit bir temizleme: Boşluk ve tireleri kaldır
        const normalizedPhone = primaryPhone.replace(/\s+/g, '').replace(/-/g, '');

        if (!primaryPhone && emails.length === 0) {
          skipped++;
          continue;
        }

        const contactData: Contact = {
          id: resourceName.replace('people/', 'google_'),
          ownerUserId,
          source: 'google',
          fullName,
          firstName: person.names?.[0]?.givenName || '',
          lastName: person.names?.[0]?.familyName || '',
          primaryPhone,
          normalizedPrimaryPhone: normalizedPhone,
          primaryEmail: emails[0] || '',
          phones,
          emails,
          tags: ['google-sync'],
          groupIds: [],
          isActive: true,
        };

        await adminDb.collection('contacts').doc(contactData.id).set(contactData, { merge: true });
        created++;
      }

      return { created, updated: 0, skipped, deleted: 0 };
    } catch (error: any) {
      console.error('PeopleSyncService Error Detail:', {
        message: error.message,
        response: error.response?.data,
        errors: error.response?.data?.error?.errors
      });
      throw error;
    }
  }

  async runIncrementalSync(_ownerUserId: string, _syncToken: string): Promise<SyncResult> {
    return { created: 0, updated: 0, skipped: 0, deleted: 0 };
  }
}

