import { adminDb } from './admin';

export interface AppSettings {
  timezone: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  timezone: 'Europe/Istanbul',
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const doc = await adminDb.collection('settings').doc('app').get();
    if (!doc.exists) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...doc.data() } as AppSettings;
  } catch (error) {
    console.error('Failed to get app settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    await adminDb.collection('settings').doc('app').set(settings, { merge: true });
  } catch (error) {
    console.error('Failed to update app settings:', error);
    throw error;
  }
}
