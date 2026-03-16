import { roleSchema, type Role } from '@/lib/validation/domain';

export const SUPER_ADMIN_EMAIL = 'meoncu@gmail.com';

export function resolveRole(email: string | null | undefined, storedRole?: string): Role {
  if (email === SUPER_ADMIN_EMAIL) return 'super_admin';
  const parsed = roleSchema.safeParse(storedRole);
  return parsed.success ? parsed.data : 'viewer';
}

export function canManage(role: Role, resource: 'contacts' | 'groups' | 'campaigns' | 'admin') {
  if (role === 'super_admin') return true;
  if (resource === 'admin') return role === 'admin';
  if (resource === 'campaigns') return role === 'admin' || role === 'editor';
  return role !== 'viewer';
}
