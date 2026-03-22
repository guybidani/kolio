import type { UserRole } from '@/types'

/**
 * Granular permissions for RBAC system
 */
export type Permission =
  | 'calls:read'
  | 'calls:read:own'
  | 'calls:write'
  | 'calls:upload'
  | 'reps:read'
  | 'reps:read:own'
  | 'reps:manage'
  | 'analytics:read'
  | 'analytics:read:own'
  | 'reports:read'
  | 'reports:generate'
  | 'playbook:read'
  | 'playbook:manage'
  | 'settings:read'
  | 'settings:manage'
  | 'users:read'
  | 'users:manage'
  | 'org:manage'

/**
 * Role hierarchy (higher number = more access)
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  REP: 1,
  MANAGER: 2,
  CEO: 3,
  ADMIN: 4,
}

/**
 * Permission map: which roles have which permissions
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'calls:read',
    'calls:read:own',
    'calls:write',
    'calls:upload',
    'reps:read',
    'reps:read:own',
    'reps:manage',
    'analytics:read',
    'analytics:read:own',
    'reports:read',
    'reports:generate',
    'playbook:read',
    'playbook:manage',
    'settings:read',
    'settings:manage',
    'users:read',
    'users:manage',
    'org:manage',
  ],
  CEO: [
    'calls:read',
    'calls:read:own',
    'reps:read',
    'reps:read:own',
    'analytics:read',
    'analytics:read:own',
    'reports:read',
    'playbook:read',
    'settings:read',
  ],
  MANAGER: [
    'calls:read',
    'calls:read:own',
    'calls:write',
    'calls:upload',
    'reps:read',
    'reps:read:own',
    'reps:manage',
    'analytics:read',
    'analytics:read:own',
    'reports:read',
    'reports:generate',
    'playbook:read',
    'playbook:manage',
    'settings:read',
    'settings:manage',
    'users:read',
  ],
  REP: [
    'calls:read:own',
    'calls:upload',
    'reps:read:own',
    'analytics:read:own',
    'playbook:read',
  ],
  VIEWER: [
    'calls:read',
    'reps:read',
    'analytics:read',
    'reports:read',
    'playbook:read',
  ],
}

export interface RBACUser {
  id: string
  role: string
  orgId: string
  isAdmin: boolean
}

/**
 * Check if a user has a specific permission
 */
export function can(user: RBACUser, permission: Permission): boolean {
  // System admins (isAdmin flag) always have full access
  if (user.isAdmin) return true

  const role = user.role as UserRole
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false

  return perms.includes(permission)
}

/**
 * Check if user can access a specific call
 * - ADMIN/CEO/MANAGER/VIEWER with calls:read can see all org calls
 * - REP can only see their own calls (linked via rep profile)
 */
export function canAccessCall(
  user: RBACUser & { repProfileId?: string | null },
  call: { orgId: string; repId?: string | null }
): boolean {
  if (user.isAdmin) return true

  // Must be same org
  if (user.orgId !== call.orgId) return false

  // If user can read all calls, allow
  if (can(user, 'calls:read')) return true

  // REP can only see own calls (matched via rep profile)
  if (can(user, 'calls:read:own') && user.repProfileId && call.repId === user.repProfileId) {
    return true
  }

  return false
}

/**
 * Check if user can access a specific rep's data
 * - ADMIN/CEO/MANAGER/VIEWER with reps:read can see all org reps
 * - REP can only see themselves
 * - MANAGER can also see reps they manage
 */
export function canAccessRep(
  user: RBACUser & { repProfileId?: string | null },
  rep: { id: string; orgId: string; managerId?: string | null }
): boolean {
  if (user.isAdmin) return true

  // Must be same org
  if (user.orgId !== rep.orgId) return false

  // If user can read all reps, allow
  if (can(user, 'reps:read')) return true

  // REP can only see self
  if (can(user, 'reps:read:own') && user.repProfileId === rep.id) return true

  // MANAGER can see reps they manage
  if (user.role === 'MANAGER' && rep.managerId === user.id) return true

  return false
}

/**
 * Check if a user's role is higher than another role
 */
export function isRoleHigherOrEqual(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole]
}

/**
 * Check if user can create a user with a specific role.
 * Cannot create users with equal or higher role than yourself (unless ADMIN).
 */
export function canCreateUserWithRole(creator: RBACUser, targetRole: UserRole): boolean {
  if (creator.isAdmin) return true

  const creatorRole = creator.role as UserRole

  // Only system admin can create CEO or ADMIN users
  if (targetRole === 'ADMIN' || targetRole === 'CEO') return false

  // Org ADMIN can create MANAGER, REP, and VIEWER
  if (creatorRole === 'ADMIN' && (targetRole === 'MANAGER' || targetRole === 'REP' || targetRole === 'VIEWER')) return true

  // MANAGER can create REP and VIEWER
  if (creatorRole === 'MANAGER' && (targetRole === 'REP' || targetRole === 'VIEWER')) return true

  // Everyone else cannot create users
  return false
}

/**
 * Get the list of nav items visible to a role
 */
export type NavSection = 'dashboard' | 'analytics' | 'calls' | 'reps' | 'playbook' | 'practice' | 'upload' | 'settings' | 'admin' | 'my-calls' | 'my-score' | 'coaching' | 'executive' | 'team-overview' | 'trends'

export function getVisibleNavItems(role: UserRole, isAdmin: boolean): NavSection[] {
  if (isAdmin) {
    return ['dashboard', 'analytics', 'calls', 'reps', 'playbook', 'practice', 'upload', 'settings', 'admin']
  }

  switch (role) {
    case 'ADMIN':
      return ['dashboard', 'analytics', 'calls', 'reps', 'playbook', 'practice', 'upload', 'settings', 'admin']
    case 'CEO':
      return ['dashboard', 'analytics', 'calls', 'reps', 'playbook', 'settings']
    case 'MANAGER':
      return ['dashboard', 'analytics', 'calls', 'reps', 'playbook', 'practice', 'upload', 'settings']
    case 'REP':
      return ['dashboard', 'calls', 'upload', 'playbook', 'practice']
    case 'VIEWER':
      return ['dashboard', 'analytics', 'calls', 'reps']
    default:
      return ['dashboard']
  }
}
