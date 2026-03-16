import { describe, expect, it } from 'vitest';
import { verifyServiceToken } from '@/server/integrations/n8n/n8n-service';

describe('n8n service auth', () => {
  it('rejects empty token', () => {
    expect(verifyServiceToken(null)).toBe(false);
  });
});
