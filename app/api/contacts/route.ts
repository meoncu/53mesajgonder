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
    
    /* 1. Temporarily Disabling Shared Memory Cache to troubleshoot sync issue
    const cached = getCachedContacts();
    if (cached) {
      console.log('Serving contacts from server-side cache (shared)...');
      return NextResponse.json({ items: cached, fromCache: true });
    }
    */

    // 2. Refresh from Firestore
    console.log('Fetching contacts directly from Firestore (Cache Disabled for v0.2.5)...');
    try {
      const contactsRef = adminDb.collection('contacts');
      const snapshot = await contactsRef.limit(limitParams).get();
      
      console.log(`Firestore Debug: Collection 'contacts' has ${snapshot.size} documents reachable.`);
      
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Update Memory Cache (still keep it updated for future)
      setCachedContacts(items);
      
      // Update Local File Backup (Emergency fallback)
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(items, null, 2));

      return NextResponse.json({ items, total: items.length, debugCount: snapshot.size });
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


