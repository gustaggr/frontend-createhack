import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function hasActiveRole(
  roles: { role: string; status: string; institutionId: string | null }[],
  role: string,
  institutionId?: string,
) {
  return roles.some(
    (r) =>
      r.role === role &&
      r.status === 'ACTIVE' &&
      (institutionId === undefined || r.institutionId === institutionId),
  )
}

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user || !hasActiveRole(user.roles, 'SUPER_ADMIN')) {
    return <Navigate to="/home" replace />
  }
  return <>{children}</>
}

export function RequireInstitutionAccess({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const { institutionId } = useParams<{ institutionId: string }>()

  if (loading) return null
  const allowed =
    !!user &&
    !!institutionId &&
    (hasActiveRole(user.roles, 'SUPER_ADMIN') ||
      hasActiveRole(user.roles, 'INSTITUTION_ADMIN', institutionId))

  if (!allowed) {
    return <Navigate to="/home" replace />
  }
  return <>{children}</>
}

/** Institution admin, super admin, ou líder — checagem grosseira; a posse real do
 * grupo específico é validada no backend (403 se o líder não for dono). */
export function RequireInstitutionOrLeaderAccess({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const { institutionId } = useParams<{ institutionId: string }>()

  if (loading) return null
  const allowed =
    !!user &&
    !!institutionId &&
    (hasActiveRole(user.roles, 'SUPER_ADMIN') ||
      hasActiveRole(user.roles, 'INSTITUTION_ADMIN', institutionId) ||
      hasActiveRole(user.roles, 'LEADER', institutionId))

  if (!allowed) {
    return <Navigate to="/home" replace />
  }
  return <>{children}</>
}
