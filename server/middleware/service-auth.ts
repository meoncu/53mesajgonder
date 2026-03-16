import { NextRequest } from 'next/server';
import { verifyServiceToken } from '@/server/integrations/n8n/n8n-service';

export function assertServiceAuth(req: NextRequest): boolean {
  const token = req.headers.get('x-service-token');
  return verifyServiceToken(token);
}
