
import OverviewDashboard, { type OverviewScope } from '../components/dashboard/OverviewDashboard'
import { useAuth, type UserRoleContext } from '../context/AuthContext'
import MissionaryHome from './MissionaryHome'

const ROLE_LABELS: Record<UserRoleContext['role'], string> = {
  SUPER_ADMIN: 'Administrador da plataforma',
  INSTITUTION_ADMIN: 'Administrador da instituição',
  LEADER: 'Líder — Meus liderados',
  MISSIONARY: 'Missionário(a)',
  FAMILY: 'Familiar',
}

const OVERVIEW_TITLES: Record<'LEADER' | 'INSTITUTION_ADMIN' | 'SUPER_ADMIN', string> = {
  LEADER: 'Visão dos meus grupos',
  INSTITUTION_ADMIN: 'Visão da instituição',
  SUPER_ADMIN: 'Visão da plataforma',
}

export default function Home() {
  const { user, activeRole, setActiveRole } = useAuth()

  if (!user) return null

  let overview: { title: string; scope: OverviewScope } | null = null
  if (activeRole?.role === 'LEADER') {
    overview = { title: OVERVIEW_TITLES.LEADER, scope: { kind: 'leader' } }
  } else if (activeRole?.role === 'INSTITUTION_ADMIN' && activeRole.institutionId) {
    overview = {
      title: OVERVIEW_TITLES.INSTITUTION_ADMIN,
      scope: { kind: 'institution', institutionId: activeRole.institutionId },
    }
  } else if (activeRole?.role === 'SUPER_ADMIN') {
    overview = { title: OVERVIEW_TITLES.SUPER_ADMIN, scope: { kind: 'platform' } }
  }

  const isMissionary = activeRole?.role === 'MISSIONARY';

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isMissionary ? 'text-slate-900' : 'text-white'}`}>
            Olá, {user.preferredName ?? user.fullName}
          </h1>
          {activeRole && (
            <p className={`mt-1 font-medium ${isMissionary ? 'text-slate-500' : 'text-white/80'}`}>
              {ROLE_LABELS[activeRole.role]}
              {activeRole.institutionName ? ` · ${activeRole.institutionName}` : ''}
            </p>
          )}
        </div>

        {user.roles.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${activeRole?.id === role.id
                    ? isMissionary ? 'bg-[#F97316] text-white shadow-sm' : 'bg-white text-brand-700'
                    : isMissionary ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20'
                  }`}
              >
                {ROLE_LABELS[role.role]}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeRole?.role === 'MISSIONARY' ? (
        <MissionaryHome />
      ) : overview ? (
        <OverviewDashboard title={overview.title} scope={overview.scope} />
      ) : (
        <p className="text-sm text-slate-400">Nenhum painel disponível para este papel ainda.</p>
      )}
    </>
  )
}
