export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ProcessingLock {
  claimedBy: string;
  claimedAt: string;
  lockUntil: string;
  idempotencyKey: string;
}
