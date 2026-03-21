'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Shield,
  Plus,
  Building2,
  Users,
  UserPlus,
  Pencil,
  UserX,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  CEO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MANAGER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  REP: 'bg-green-500/10 text-green-400 border-green-500/20',
  VIEWER: 'bg-white/5 text-white/50 border-white/10',
}

interface Org {
  id: string
  name: string
  slug: string
  plan: string
  _count: { users: number; calls: number; reps: number }
  createdAt: string
}

interface ManagedRep {
  id: string
  name: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
  isAdmin: boolean
  isActive: boolean
  orgId: string
  org: { id: string; name: string; slug: string }
  managedReps: ManagedRep[]
  createdAt: string
}

interface Rep {
  id: string
  name: string
  phone: string | null
  extension: string | null
  isActive: boolean
  callCount: number
  avgScore: number | null
  lastCallDate: string | null
  managerId: string | null
  manager: { id: string; name: string } | null
}

interface CurrentUser {
  id: string
  isAdmin: boolean
  role: string
  orgId: string
}

export default function AdminPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [reps, setReps] = useState<Rep[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  // New org form
  const [showNewOrg, setShowNewOrg] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [orgError, setOrgError] = useState('')

  // New user form
  const [showNewUser, setShowNewUser] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userOrgId, setUserOrgId] = useState('')
  const [userRole, setUserRole] = useState('VIEWER')
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [userManagerId, setUserManagerId] = useState('')
  const [userError, setUserError] = useState('')

  // Edit user form
  const [showEditUser, setShowEditUser] = useState(false)
  const [editUserId, setEditUserId] = useState('')
  const [editUserName, setEditUserName] = useState('')
  const [editUserRole, setEditUserRole] = useState('')
  const [editUserActive, setEditUserActive] = useState(true)
  const [editUserError, setEditUserError] = useState('')

  // Edit rep form
  const [showEditRep, setShowEditRep] = useState(false)
  const [editRepId, setEditRepId] = useState('')
  const [editRepName, setEditRepName] = useState('')
  const [editRepPhone, setEditRepPhone] = useState('')
  const [editRepExtension, setEditRepExtension] = useState('')
  const [editRepActive, setEditRepActive] = useState(true)
  const [editRepError, setEditRepError] = useState('')

  const isSystemAdmin = currentUser?.isAdmin === true
  const isOrgAdmin = currentUser?.role === 'ADMIN'

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me')
      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const me = await meRes.json()

      // Allow system admins OR org ADMINs
      if (!me.isAdmin && me.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      setCurrentUser(me)

      if (me.isAdmin) {
        // System admin: fetch all orgs and users
        const [orgsRes, usersRes] = await Promise.all([
          fetch('/api/admin/orgs'),
          fetch('/api/admin/users'),
        ])
        if (orgsRes.ok) setOrgs(await orgsRes.json())
        if (usersRes.ok) setUsers(await usersRes.json())
      } else {
        // Org ADMIN: fetch only own org users and reps
        const [usersRes, repsRes] = await Promise.all([
          fetch(`/api/orgs/${me.orgId}/users`),
          fetch(`/api/orgs/${me.orgId}/reps`),
        ])
        if (usersRes.ok) setUsers(await usersRes.json())
        if (repsRes.ok) setReps(await repsRes.json())
      }
    } catch (err) {
      console.error('Failed to load admin data', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get managers for the selected org (for assigning to REPs)
  const managersForOrg = users.filter(
    (u) =>
      u.orgId === (isSystemAdmin ? userOrgId : currentUser?.orgId) &&
      (u.role === 'MANAGER' || u.role === 'ADMIN')
  )

  // Roles available for creation
  const availableRoles = isSystemAdmin
    ? ['ADMIN', 'CEO', 'MANAGER', 'REP', 'VIEWER']
    : ['MANAGER', 'REP', 'VIEWER']

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    setOrgError('')

    const res = await fetch('/api/admin/orgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: orgName, slug: orgSlug }),
    })

    const data = await res.json()
    if (!res.ok) {
      setOrgError(data.error)
      return
    }

    setShowNewOrg(false)
    setOrgName('')
    setOrgSlug('')
    fetchData()
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setUserError('')

    const orgId = isSystemAdmin ? userOrgId : currentUser?.orgId
    if (!orgId) {
      setUserError('לא נבחר ארגון')
      return
    }

    const endpoint = isSystemAdmin
      ? '/api/admin/users'
      : `/api/orgs/${orgId}/users`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userName,
        email: userEmail,
        password: userPassword,
        ...(isSystemAdmin ? { orgId } : {}),
        role: userRole,
        ...(isSystemAdmin ? { isAdmin: userIsAdmin } : {}),
        managerId: userRole === 'REP' && userManagerId ? userManagerId : undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setUserError(data.error)
      return
    }

    setShowNewUser(false)
    setUserName('')
    setUserEmail('')
    setUserPassword('')
    setUserOrgId('')
    setUserRole('VIEWER')
    setUserIsAdmin(false)
    setUserManagerId('')
    fetchData()
  }

  async function saveEditUser(e: React.FormEvent) {
    e.preventDefault()
    setEditUserError('')

    const targetUser = users.find((u) => u.id === editUserId)
    if (!targetUser) return

    const orgId = targetUser.orgId
    const res = await fetch(`/api/orgs/${orgId}/users/${editUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editUserName,
        role: editUserRole,
        isActive: editUserActive,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setEditUserError(data.error)
      return
    }

    setShowEditUser(false)
    fetchData()
  }

  async function deactivateUser(userId: string) {
    const targetUser = users.find((u) => u.id === userId)
    if (!targetUser) return

    if (!confirm('האם אתה בטוח שברצונך להשבית משתמש זה?')) return

    const orgId = targetUser.orgId
    const res = await fetch(`/api/orgs/${orgId}/users/${userId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'השבתת המשתמש נכשלה')
      return
    }

    fetchData()
  }

  async function saveEditRep(e: React.FormEvent) {
    e.preventDefault()
    setEditRepError('')

    const orgId = currentUser?.orgId
    if (!orgId) return

    const res = await fetch(`/api/orgs/${orgId}/reps/${editRepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editRepName,
        phone: editRepPhone || null,
        extension: editRepExtension || null,
        isActive: editRepActive,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setEditRepError(data.error)
      return
    }

    setShowEditRep(false)
    fetchData()
  }

  function openEditUser(user: User) {
    setEditUserId(user.id)
    setEditUserName(user.name)
    setEditUserRole(user.role)
    setEditUserActive(user.isActive)
    setEditUserError('')
    setShowEditUser(true)
  }

  function openEditRep(rep: Rep) {
    setEditRepId(rep.id)
    setEditRepName(rep.name)
    setEditRepPhone(rep.phone || '')
    setEditRepExtension(rep.extension || '')
    setEditRepActive(rep.isActive)
    setEditRepError('')
    setShowEditRep(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40">טוען...</div>
      </div>
    )
  }

  if (!currentUser || (!isSystemAdmin && !isOrgAdmin)) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isSystemAdmin ? 'ניהול מערכת' : 'ניהול ארגון'}
          </h1>
          <p className="text-white/40">
            {isSystemAdmin
              ? 'ניהול כל הארגונים והמשתמשים'
              : 'ניהול משתמשים ונציגים בארגון שלך'}
          </p>
        </div>
      </div>

      {/* Organizations - only for system admins */}
      {isSystemAdmin && (
        <>
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                ארגונים ({orgs.length})
              </h3>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                onClick={() => setShowNewOrg(true)}
              >
                <Plus className="h-4 w-4 ml-1" />
                ארגון חדש
              </Button>
            </div>
            <div className="px-5 pb-5">
              {orgs.length === 0 ? (
                <p className="text-sm text-white/50 text-center py-4">אין ארגונים עדיין</p>
              ) : (
                <div className="space-y-2">
                  {orgs.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.03]"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{org.name}</p>
                        <p className="text-xs text-white/50">
                          {org.slug} | {org._count.users} משתמשים | {org._count.calls} שיחות |{' '}
                          {org._count.reps} נציגים
                        </p>
                      </div>
                      <Badge className="bg-white/5 text-white/50 border border-white/10">
                        {org.plan}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-white/10" />
        </>
      )}

      {/* Users */}
      <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            משתמשים ({users.length})
          </h3>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            onClick={() => {
              if (isSystemAdmin && orgs.length > 0) setUserOrgId(orgs[0].id)
              setUserRole('VIEWER')
              setShowNewUser(true)
            }}
          >
            <UserPlus className="h-4 w-4 ml-1" />
            משתמש חדש
          </Button>
        </div>
        <div className="px-5 pb-5">
          {users.length === 0 ? (
            <p className="text-sm text-white/50 text-center py-4">אין משתמשים עדיין</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.03]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <Badge
                        className={cn(
                          'text-xs border',
                          ROLE_COLORS[user.role] || ROLE_COLORS.VIEWER
                        )}
                      >
                        {user.role}
                      </Badge>
                      {user.isAdmin && (
                        <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs">
                          מנהל מערכת
                        </Badge>
                      )}
                      {!user.isActive && (
                        <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                          לא פעיל
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/50">
                      {user.email}
                      {isSystemAdmin && user.org && <> | {user.org.name}</>}
                      {user.managedReps?.length > 0 && (
                        <> | מנהל: {user.managedReps.map((r) => r.name).join(', ')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/50 hover:text-white hover:bg-white/10"
                      onClick={() => openEditUser(user)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {user.id !== currentUser?.id && user.isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => deactivateUser(user.id)}
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reps - for org admins */}
      {!isSystemAdmin && reps.length > 0 && (
        <>
          <Separator className="bg-white/10" />
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-400" />
                נציגים ({reps.length})
              </h3>
            </div>
            <div className="px-5 pb-5">
              <div className="space-y-2">
                {reps.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.03] cursor-pointer hover:bg-white/[0.06] transition-colors"
                    onClick={() => router.push(`/dashboard/reps/${rep.id}`)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{rep.name}</p>
                        {!rep.isActive && (
                          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                            לא פעיל
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/50">
                        {rep.callCount} שיחות
                        {rep.avgScore !== null && <> | ממוצע: {rep.avgScore}</>}
                        {rep.manager && <> | מנהל: {rep.manager.name}</>}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/50 hover:text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditRep(rep)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Org Dialog - system admins only */}
      <Dialog open={showNewOrg} onOpenChange={setShowNewOrg}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>יצירת ארגון</DialogTitle>
          </DialogHeader>
          <form onSubmit={createOrg} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">שם</label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="שם הארגון"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">מזהה (Slug)</label>
              <Input
                value={orgSlug}
                onChange={(e) =>
                  setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder="slug-name"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            {orgError && <p className="text-sm text-red-400">{orgError}</p>}
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              צור ארגון
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* New User Dialog */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>יצירת משתמש</DialogTitle>
          </DialogHeader>
          <form onSubmit={createUser} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">שם</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="שם מלא"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">אימייל</label>
              <Input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="user@company.com"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">סיסמה</label>
              <Input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="מינימום 8 תווים"
                required
                minLength={8}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            {isSystemAdmin && (
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">
                  ארגון
                </label>
                <select
                  value={userOrgId}
                  onChange={(e) => setUserOrgId(e.target.value)}
                  required
                  className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                >
                  <option value="">בחר ארגון...</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">תפקיד</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Show manager assignment when creating a REP */}
            {userRole === 'REP' && managersForOrg.length > 0 && (
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">
                  שיוך מנהל
                </label>
                <select
                  value={userManagerId}
                  onChange={(e) => setUserManagerId(e.target.value)}
                  className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                >
                  <option value="">ללא מנהל</option>
                  {managersForOrg.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSystemAdmin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={userIsAdmin}
                  onChange={(e) => setUserIsAdmin(e.target.checked)}
                  className="rounded border-white/10"
                />
                <label htmlFor="isAdmin" className="text-sm text-white/70">
                  מנהל מערכת (יכול לנהל את כל הארגונים והמשתמשים)
                </label>
              </div>
            )}
            {userError && <p className="text-sm text-red-400">{userError}</p>}
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              צור משתמש
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>עריכת משתמש</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEditUser} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">שם</label>
              <Input
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">תפקיד</label>
              <select
                value={editUserRole}
                onChange={(e) => setEditUserRole(e.target.value)}
                className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editActive"
                checked={editUserActive}
                onChange={(e) => setEditUserActive(e.target.checked)}
                className="rounded border-white/10"
              />
              <label htmlFor="editActive" className="text-sm text-white/70">
                פעיל
              </label>
            </div>
            {editUserError && <p className="text-sm text-red-400">{editUserError}</p>}
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              שמור שינויים
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Rep Dialog */}
      <Dialog open={showEditRep} onOpenChange={setShowEditRep}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>עריכת נציג</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEditRep} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">שם</label>
              <Input
                value={editRepName}
                onChange={(e) => setEditRepName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">טלפון</label>
              <Input
                value={editRepPhone}
                onChange={(e) => setEditRepPhone(e.target.value)}
                placeholder="מספר טלפון"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">שלוחה</label>
              <Input
                value={editRepExtension}
                onChange={(e) => setEditRepExtension(e.target.value)}
                placeholder="שלוחת מרכזיה"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editRepActive"
                checked={editRepActive}
                onChange={(e) => setEditRepActive(e.target.checked)}
                className="rounded border-white/10"
              />
              <label htmlFor="editRepActive" className="text-sm text-white/70">
                פעיל
              </label>
            </div>
            {editRepError && <p className="text-sm text-red-400">{editRepError}</p>}
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              שמור שינויים
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
