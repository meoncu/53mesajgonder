import { z } from 'zod';

export const roleSchema = z.enum(['super_admin', 'admin', 'editor', 'viewer']);
export const campaignStatusSchema = z.enum([
  'draft',
  'scheduled',
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const contactSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  source: z.enum(['google', 'manual', 'imported']),
  fullName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  primaryPhone: z.string().optional(),
  normalizedPrimaryPhone: z.string().optional(),
  primaryEmail: z.string().email().optional(),
  phones: z.array(z.string()).default([]),
  emails: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type Role = z.infer<typeof roleSchema>;
