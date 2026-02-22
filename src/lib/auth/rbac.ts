import type { UserRole, Permission } from '@/types';
import { ROLE_PERMISSIONS } from '@/types';

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getRoleWeight(role: UserRole): number {
  const weights: Record<UserRole, number> = {
    superadmin: 5,
    admin: 4,
    manager: 3,
    staff: 2,
    viewer: 1,
  };
  return weights[role] ?? 0;
}

export function isRoleAtLeast(role: UserRole, minRole: UserRole): boolean {
  return getRoleWeight(role) >= getRoleWeight(minRole);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  viewer: 'Viewer',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  staff: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};
