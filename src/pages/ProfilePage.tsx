import { Mail, User as UserIcon } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import { useAuth, type UserRoleContext } from '../context/AuthContext'

const ROLE_LABELS: Record<UserRoleContext['role'], string> = {
  SUPER_ADMIN: 'Administrador da plataforma',
  INSTITUTION_ADMIN: 'Administrador da instituição',
  LEADER: 'Líder',
  MISSIONARY: 'Missionário(a)',
  FAMILY: 'Familiar',
}

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  const displayName = user.preferredName ?? user.fullName
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xl">
        <h1 className="mb-5 text-xl font-bold text-slate-900">Meu perfil</h1>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
              {initial}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{user.fullName}</p>
              {user.preferredName && (
                <p className="text-sm text-slate-500">Prefere ser chamado(a) de {user.preferredName}</p>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-brand-50 pt-5">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Mail size={16} className="text-brand-600" />
              {user.email}
            </div>
          </div>

          <div className="mt-6 border-t border-brand-50 pt-5">
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              <UserIcon size={14} />
              Papéis
            </p>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span
                  key={role.id}
                  className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700"
                >
                  {ROLE_LABELS[role.role]}
                  {role.institutionName ? ` · ${role.institutionName}` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
