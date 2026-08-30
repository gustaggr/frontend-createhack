import { UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Card } from '../../components/ui/Card'
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
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Meus grupos</h1>
        <p className="mt-1 text-sm font-medium text-white/80">Grupos que você lidera.</p>
      </div>

      {!institutionId ? (
        <p className="text-sm text-slate-400">Você não tem um papel de líder ativo.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups?.map((g) => (
            <Link key={g.id} to={`/admin/institutions/${institutionId}/groups/${g.id}`}>
              <Card className="shadow-sm border border-slate-100 p-4 transition-colors hover:border-brand-300">
                <div className="flex items-center gap-2 text-brand-600">
                  <UsersRound size={18} />
                  <h3 className="font-semibold text-slate-900">{g.name}</h3>
                </div>
                {g.locality && <p className="mt-1 text-xs text-slate-400">{g.locality}</p>}
                <p className="mt-3 text-sm font-medium text-slate-900">{g.memberCount} membro(s)</p>
              </Card>
            </Link>
          ))}
          {groups?.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-slate-400">
              Você ainda não lidera nenhum grupo.
            </p>
          )}
        </div>
      )}
    </>
  )
}
