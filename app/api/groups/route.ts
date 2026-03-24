import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getCachedGroups, setCachedGroups, invalidateGroupsCache } from '@/lib/cache';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(BACKUP_DIR, 'groups_backup.json');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function GET() {
  try {
    // 1. Memory Cache check
    const cached = getCachedGroups();
    if (cached) return NextResponse.json({ items: cached, fromCache: true });

    try {
      const snapshot = await adminDb.collection('groups').get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Update memory cache
      setCachedGroups(items);
      
      // Update file backup
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(items, null, 2));

      return NextResponse.json({ items });
    } catch (dbError: any) {
      if (dbError.code === 8 || dbError.message?.toLowerCase().includes('quota') || dbError.message?.toLowerCase().includes('resource_exhausted')) {
        if (fs.existsSync(BACKUP_FILE)) {
          const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
          return NextResponse.json({ items: backupData, offline: true });
        }
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const docRef = await adminDb.collection('groups').add({
      name,
      description: description || '',
      type: type || 'contact',
      color: color || '#3B82F6', // Default blue-600
      ownerUserId: 'meoncu@gmail.com', // Demo user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberCount: 0
    });

    const newGroup = {
      id: docRef.id,
      name,
      description,
      type: type || 'contact',
      color: color || '#3B82F6', // Default blue-600
      memberCount: 0
    };

    invalidateGroupsCache();

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error('Failed to create group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
