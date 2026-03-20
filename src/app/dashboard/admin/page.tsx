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

export default function AdminPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<{ isAdmin: boolean } | null>(null)
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

  const fetchData = useCallback(async () => {
    try {
      const [meRes, orgsRes, usersRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/orgs'),
        fetch('/api/admin/users'),
      ])

      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const me = await meRes.json()
      if (!me.isAdmin) {
        router.push('/dashboard')
        return
      }
      setCurrentUser(me)

      if (orgsRes.ok) setOrgs(await orgsRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
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
    (u) => u.orgId === userOrgId && (u.role === 'MANAGER' || u.role === 'ADMIN')
  )

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

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userName,
        email: userEmail,
        password: userPassword,
        orgId: userOrgId,
        role: userRole,
        isAdmin: userIsAdmin,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40">Loading...</div>
      </div>
    )
  }

  if (!currentUser?.isAdmin) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">ניהול מערכת</h1>
          <p className="text-white/40">ניהול ארגונים ומשתמשים</p>
        </div>
      </div>

      {/* Organizations */}
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
                      {org.slug} | {org._count.users} users | {org._count.calls} calls | {org._count.reps} reps
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
              if (orgs.length > 0) setUserOrgId(orgs[0].id)
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
                      {user.email} | {user.org.name}
                      {user.managedReps.length > 0 && (
                        <> | מנהל: {user.managedReps.map((r) => r.name).join(', ')}</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Org Dialog */}
      <Dialog open={showNewOrg} onOpenChange={setShowNewOrg}>
        <DialogContent className="bg-[#12121A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>יצירת ארגון</DialogTitle>
          </DialogHeader>
          <form onSubmit={createOrg} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">שם</label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corp"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">מזהה</label>
              <Input
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="acme-corp"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            {orgError && (
              <p className="text-sm text-red-400">{orgError}</p>
            )}
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
              צור
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* New User Dialog */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent className="bg-[#12121A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>יצירת משתמש</DialogTitle>
          </DialogHeader>
          <form onSubmit={createUser} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">שם</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="John Doe"
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
                placeholder="john@company.com"
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
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">ארגון</label>
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
            <div>
              <label className="text-sm font-medium text-white/70 mb-1 block">תפקיד</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
              >
                <option value="ADMIN">מנהל</option>
                <option value="CEO">מנכ&quot;ל</option>
                <option value="MANAGER">מנהל צוות</option>
                <option value="REP">נציג</option>
                <option value="VIEWER">צופה</option>
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
            {userError && (
              <p className="text-sm text-red-400">{userError}</p>
            )}
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
              יצירת משתמש
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
