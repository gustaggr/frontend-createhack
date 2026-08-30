import { UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { adminApi, type Group } from '../../lib/adminApi'

export default function MyGroupsPage() {
  const { user } = useAuth()
  const institutionId = user?.roles.find((r) => r.role === 'LEADER' && r.status === 'ACTIVE')
    ?.institutionId

  const [groups, setGroups] = useState<Group[] | null>(null)

  useEffect(() => {
    if (!institutionId) return
    adminApi.listGroups(institutionId).then(setGroups).catch(() => {})
  }, [institutionId])

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Meus grupos</h1>
        <p className="text-sm text-slate-500">Grupos que você lidera.</p>
      </div>

      {!institutionId ? (
        <p className="text-sm text-slate-400">Você não tem um papel de líder ativo.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups?.map((g) => (
            <Link
              key={g.id}
              to={`/admin/institutions/${institutionId}/groups/${g.id}`}
              className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition-colors hover:border-brand-300"
            >
              <div className="flex items-center gap-2 text-brand-600">
                <UsersRound size={18} />
                <h3 className="font-semibold text-slate-900">{g.name}</h3>
              </div>
              {g.locality && <p className="mt-1 text-xs text-slate-400">{g.locality}</p>}
              <p className="mt-3 text-sm font-medium text-slate-900">{g.memberCount} membro(s)</p>
            </Link>
          ))}
          {groups?.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-slate-400">
              Você ainda não lidera nenhum grupo.
            </p>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
