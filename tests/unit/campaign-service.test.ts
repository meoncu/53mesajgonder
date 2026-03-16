import { describe, expect, it } from 'vitest';
import { canTransition } from '@/server/services/campaign-service';

describe('campaign state transitions', () => {
  it('allows scheduled -> queued', () => {
    expect(canTransition('scheduled', 'queued')).toBe(true);
  });

  it('blocks completed -> processing', () => {
    expect(canTransition('completed', 'processing')).toBe(false);
  });
});
