import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getCachedContacts, setCachedContacts, invalidateContactsCache } from '@/lib/cache';
import fs from 'fs';
import path from 'path';

// Local backup path
const BACKUP_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(BACKUP_DIR, 'contacts_backup.json');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParams = parseInt(searchParams.get('limit') || '4000'); // Standard set limit to prevent crash, user can lower it
    
    // 1. Try Shared Memory Cache first (Zero Firestore cost)
    const cached = getCachedContacts();
    if (cached) {
      console.log('Serving contacts from server-side cache (shared)...');
      return NextResponse.json({ items: cached, fromCache: true });
    }

    // 2. Refresh from Firestore
    console.log('Fetching contacts from Firestore (Shared cache expired or empty)...');
    try {
      // Use query with limit to save quota
      // Removing orderBy for troubleshooting empty sync results
      const query = adminDb.collection('contacts')
        .limit(limitParams);
        
      const snapshot = await query.get();
      console.log(`Firestore query returned ${snapshot.size} contacts.`);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Update Memory Cache
      setCachedContacts(items);
      
      // Update Local File Backup (Emergency fallback)
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(items, null, 2));

      return NextResponse.json({ items, total: items.length });
    } catch (dbError: any) {
      // 3. Quota Exceeded? Try Local File Fallback
      if (dbError.code === 8 || dbError.message?.toLowerCase().includes('quota') || dbError.message?.toLowerCase().includes('resource_exhausted')) {
        console.warn('FIRESTORE QUOTA EXCEEDED! Checking for local backup...');
        if (fs.existsSync(BACKUP_FILE)) {
          const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
          console.log('Serving contacts from local file backup (Offline mode)...');
          return NextResponse.json({ 
            items: backupData, 
            offline: true, 
            warning: 'Firestore kotanız dolduğu için veriler yedekten (salt okunur) gösteriliyor.' 
          });
        }
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


