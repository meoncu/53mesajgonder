import type { ProcessingLock } from '@/server/domain/types';

export function createProcessingLock(workerId: string): ProcessingLock {
  const now = new Date();
  const lockUntil = new Date(now.getTime() + 5 * 60 * 1000);
  return {
    claimedBy: workerId,
    claimedAt: now.toISOString(),
    lockUntil: lockUntil.toISOString(),
    idempotencyKey: crypto.randomUUID(),
  };
}

export function verifyServiceToken(token: string | null): boolean {
  if (!token) return false;
  return token === process.env.N8N_SERVICE_TOKEN;
}
