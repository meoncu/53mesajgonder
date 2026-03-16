import { resolveRole } from '@/lib/auth/rbac';

export interface UserProfileInput {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  role?: string;
}

export function buildUserProfile(input: UserProfileInput) {
  const role = resolveRole(input.email, input.role);
  const now = new Date().toISOString();

  return {
    id: input.uid,
    email: input.email,
    displayName: input.displayName ?? '',
    photoURL: input.photoURL ?? '',
    role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}
