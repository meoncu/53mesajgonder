import type { CampaignStatus } from '@/server/domain/types';

const transitions: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['queued', 'cancelled'],
  queued: ['processing', 'cancelled'],
  processing: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: ['queued', 'cancelled'],
  cancelled: [],
};

export function canTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return transitions[from].includes(to);
}
