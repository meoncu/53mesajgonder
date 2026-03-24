import { getAppSettings } from '@/lib/firebase/settings';

/**
 * Get the current timestamp in the configured timezone as an ISO-like string BUT with the local time of that timezone.
 * Note: ISO-8601 usually ends with Z if it's UTC. If we want n8n to see local time without confusion, 
 * we might want to return a string without the Z or with the correct offset.
 */
export async function getLocalTimestamp(): Promise<string> {
  const { timezone } = await getAppSettings();
  
  // Format the current date in the specified timezone using Intl
  const now = new Date();
  
  // This produces a string like "2026-03-24 12:03:34" in the given timezone
  const formatted = now.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Convert "MM/DD/YYYY, HH:MM:SS" to "YYYY-MM-DDTHH:MM:SS"
  // Note: toLocaleString format can vary, so we should use Intl.DateTimeFormat parts for more reliability
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Get the current real UTC ISO string (safe for Firestore comparison)
 */
export function getUtcTimestamp(): string {
  return new Date().toISOString();
}
