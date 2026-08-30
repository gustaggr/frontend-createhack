import { CheckCircle2, Circle, Pencil, Plus, UsersRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import InviteLinkResult from '../../components/dashboard/InviteLinkResult'
import Modal from '../../components/dashboard/Modal'
import { checkinApi, type GroupCheckinStatus } from '../../lib/checkinApi'
import { BAND_COLORS, BAND_LABELS, TREND_LABELS } from '../../lib/checkinLabels'
import { adminApi, type GroupDetail, type Member } from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { inputClass, InviteForm } from './InviteForms'

function EditGroupForm({
  institutionId,
  group,
  onSaved,
}: {
  institutionId: string
  group: GroupDetail
  onSaved: () => void
}) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? '')
  const [locality, setLocality] = useState(group.locality ?? '')
  const [leaderId, setLeaderId] = useState(group.leader.id)
  const [leaders, setLeaders] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (group.canReassignLeader) {
      adminApi.listMembers(institutionId, 'LEADER').then(setLeaders).catch(() => {})
    }
  }, [institutionId, group.canReassignLeader])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminApi.updateGroup(institutionId, group.id, {
        name,
        description: description || undefined,
        locality: locality || undefined,
        leaderId: group.canReassignLeader && leaderId !== group.leader.id ? leaderId : undefined,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o grupo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome do grupo</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>

      {group.canReassignLeader && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Líder responsável</label>
          <select
            value={leaderId}
            onChange={(e) => setLeaderId(e.target.value)}
            className={inputClass}
          >
            {leaders?.map((l) => (
              <option key={l.userId} value={l.userId}>
                {l.fullName}
              </option>
            ))}
            {!leaders?.some((l) => l.userId === group.leader.id) && (
              <option value={group.leader.id}>{group.leader.fullName}</option>
            )}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Localidade</label>
        <input value={locality} onChange={(e) => setLocality(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  )
}

export default function GroupDetailPage() {
  const { institutionId, groupId } = useParams<{ institutionId: string; groupId: string }>()

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [checkinsToday, setCheckinsToday] = useState<GroupCheckinStatus[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<'edit' | 'member' | null>(null)
  const [inviteResult, setInviteResult] = useState<{ activationLink: string; expiresAt: string } | null>(
    null,
  )

  function load() {
    if (!institutionId || !groupId) return
    adminApi
      .getGroup(institutionId, groupId)
      .then((g) => {
        setGroup(g)
        setError(null)
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o grupo.'),
      )
    checkinApi.getGroupCheckinsToday(institutionId, groupId).then(setCheckinsToday).catch(() => {})
  }

  useEffect(load, [institutionId, groupId])

  if (!institutionId || !groupId) return null

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <Link to="/home" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Voltar
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  if (!group) return null

  return (
    <DashboardLayout>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-brand-600">
            <UsersRound size={20} />
            <h1 className="text-xl font-bold text-slate-900">{group.name}</h1>
          </div>
          {group.locality && <p className="mt-1 text-sm text-slate-500">{group.locality}</p>}
          {group.description && <p className="mt-2 max-w-xl text-sm text-slate-600">{group.description}</p>}
          <p className="mt-2 text-sm text-slate-500">Líder: {group.leader.fullName}</p>
        </div>
        <button
          onClick={() => setModal('edit')}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
        >
          <Pencil size={14} />
          Editar grupo
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Membros</h2>
        <button
          onClick={() => setModal('member')}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={16} />
          Convidar membro
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-brand-50 text-left text-xs font-medium text-slate-400">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Hoje</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Tendência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {group.members.map((m) => {
              const status = checkinsToday?.find((c) => c.missionaryId === m.id)
              return (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link
                      to={`/admin/institutions/${institutionId}/missionaries/${m.id}`}
                      className="hover:text-brand-600 hover:underline"
                    >
                      {m.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.email}</td>
                  <td className="px-4 py-3">
                    {status?.answeredToday ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={14} />
                        Respondeu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Circle size={14} />
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {status?.answeredToday && status.overallBand ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${BAND_COLORS[status.overallBand].bg} ${BAND_COLORS[status.overallBand].text} ${BAND_COLORS[status.overallBand].ring}`}
                      >
                        {status.overallScore} · {BAND_LABELS[status.overallBand]}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {status?.answeredToday && status.trend ? TREND_LABELS[status.trend] : '—'}
                  </td>
                </tr>
              )
            })}
            {group.members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhum membro neste grupo ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === 'edit' && (
        <Modal title="Editar grupo" onClose={() => setModal(null)}>
          <EditGroupForm
            institutionId={institutionId}
            group={group}
            onSaved={() => {
              setModal(null)
              load()
            }}
          />
        </Modal>
      )}

      {modal === 'member' && (
        <Modal title="Convidar membro" onClose={() => setModal(null)}>
          <InviteForm
            institutionId={institutionId}
            role="MISSIONARY"
            fixedGroupId={group.id}
            onCreated={(result) => {
              setModal(null)
              setInviteResult(result)
              load()
            }}
          />
        </Modal>
      )}

      {inviteResult && (
        <Modal title="Convite pronto" onClose={() => setInviteResult(null)}>
          <InviteLinkResult activationLink={inviteResult.activationLink} expiresAt={inviteResult.expiresAt} />
        </Modal>
      )}
    </DashboardLayout>
  )
}
