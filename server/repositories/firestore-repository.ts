import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

export async function listCollection<T>(name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function getById<T>(name: string, id: string): Promise<T | null> {
  const ref = doc(db, name, id);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
}

export async function putDoc<T extends { id: string }>(name: string, data: T): Promise<void> {
  await setDoc(doc(db, name, data.id), data, { merge: true });
}

export async function patchDoc(name: string, id: string, data: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, name, id), data);
}
