import type { Permission, User } from "./types";

/**
 * Returns true if the user satisfies the given module permission.
 *  - Super Admins (isSuperAdmin) bypass everything.
 *  - The ALL permission grants every module.
 *  - Otherwise the user must hold the exact permission.
 */
export function hasPermission(user: User | null | undefined, perm: Permission): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.permissions?.includes("ALL")) return true;
  return user.permissions?.includes(perm) ?? false;
}

/** True if the user satisfies ANY of the listed permissions. */
export function hasAnyPermission(user: User | null | undefined, ...perms: Permission[]): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.permissions?.includes("ALL")) return true;
  return perms.some((p) => user.permissions?.includes(p));
}
