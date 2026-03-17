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
  groupIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const campaignSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  name: z.string(),
  message: z.string(),
  groupIds: z.array(z.string()),
  status: campaignStatusSchema.default('draft'),
  scheduledAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Role = z.infer<typeof roleSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type Contact = z.infer<typeof contactSchema>;
