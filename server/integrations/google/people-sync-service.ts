import { google } from 'googleapis';
import { getSupabaseAdmin } from '@/lib/supabase';
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
    const supabase = getSupabaseAdmin();
    
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
        const normalizedPhone = primaryPhone.replace(/\s+/g, '').replace(/-/g, '');

        if (!primaryPhone && emails.length === 0) {
          skipped++;
          continue;
        }

        const id = resourceName.replace('people/', 'google_');
        
        // Map to snake_case for Supabase
        const dbContact = {
          id,
          full_name: fullName,
          first_name: person.names?.[0]?.givenName || '',
          last_name: person.names?.[0]?.familyName || '',
          primary_phone: primaryPhone,
          normalized_primary_phone: normalizedPhone,
          primary_email: emails[0] || '',
          source: 'google',
          notes: '',
          tags: ['google-sync'],
          group_ids: [],
          is_active: true,
          owner_user_id: ownerUserId,
          updated_at: new Date().toISOString()
        };

        const { error: dbError } = await supabase
          .from('contacts')
          .upsert(dbContact);

        if (dbError) {
          console.error(`Sync error for contact ${id}:`, dbError);
          skipped++;
          continue;
        }

        created++;
      }

      return { created, updated: 0, skipped, deleted: 0 };
    } catch (error: any) {
      console.error('PeopleSyncService Error Detail:', error);
      throw error;
    }
  }

  async runIncrementalSync(_ownerUserId: string, _syncToken: string): Promise<SyncResult> {
    return { created: 0, updated: 0, skipped: 0, deleted: 0 };
  }
}
