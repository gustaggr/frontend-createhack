import { CheckCircle2, Circle, Pencil, Plus, UsersRound, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import InviteLinkResult from '../../components/dashboard/InviteLinkResult'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { MultiSelectChips } from '../../components/ui/MultiSelectChips'
import { checkinApi, type GroupCheckinStatus } from '../../lib/checkinApi'
import { BAND_COLORS, BAND_LABELS, TREND_LABELS } from '../../lib/checkinLabels'
import { adminApi, type GroupDetail, type Member } from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { inputClass, InviteForm } from './InviteForms'
import { EditMemberForm, DeleteMemberForm } from './MemberForms'

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
  const [leaderIds, setLeaderIds] = useState(group.leaders.map((l) => l.id))
  const [leaders, setLeaders] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (group.canManageLeaders) {
      adminApi.listMembers(institutionId, 'LEADER').then(setLeaders).catch(() => {})
    }
  }, [institutionId, group.canManageLeaders])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminApi.updateGroup(institutionId, group.id, {
        name,
        description: description || undefined,
        locality: locality || undefined,
        leaderIds: group.canManageLeaders ? leaderIds : undefined,
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

      {group.canManageLeaders && (
        <MultiSelectChips
          label="Líderes responsáveis"
          options={[
            ...group.leaders
              .filter((gl) => !leaders?.some((l) => l.userId === gl.id))
              .map((gl) => ({ id: gl.id, label: gl.fullName })),
            ...(leaders ?? []).map((l) => ({ id: l.userId, label: l.fullName })),
          ]}
          selectedIds={leaderIds}
          onChange={setLeaderIds}
          emptyHint="Nenhum líder cadastrado ainda."
        />
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

      <Button type="submit" isLoading={submitting} className="w-full">
        {submitting ? 'Salvando…' : 'Salvar alterações'}
      </Button>
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
  const [selectedMember, setSelectedMember] = useState<{ id: string; fullName: string; email: string } | null>(null)
  const [memberModal, setMemberModal] = useState<'edit' | 'delete' | null>(null)

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
      <>
        <Card className="shadow-sm border border-slate-100 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Link to="/home" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Voltar
          </Link>
        </Card>
      </>
    )
  }

  if (!group) return null

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-white">
            <UsersRound size={20} />
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
          </div>
          {group.locality && <p className="mt-1 text-sm font-medium text-white/80">{group.locality}</p>}
          {group.description && <p className="mt-2 max-w-xl text-sm text-white/80">{group.description}</p>}
          <p className="mt-2 text-sm font-medium text-white/80">
            {group.leaders.length > 0
              ? `Líder(es): ${group.leaders.map((l) => l.fullName).join(', ')}`
              : 'Sem líder atribuído'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="white" onClick={() => setModal('edit')}>
            <Pencil size={14} className="mr-2" />
            Editar grupo
          </Button>
          <Button variant="white" onClick={() => setModal('member')}>
            <Plus size={16} className="mr-2" />
            Convidar membro
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Membros</h2>
      </div>

      <div className="overflow-hidden bg-white rounded-[40px] shadow-xl border border-slate-100 pt-2 p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead className="border-b border-slate-100">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Hoje</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Tendência</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {group.members.map((m) => {
                const status = checkinsToday?.find((c) => c.missionaryId === m.id)
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 tracking-tight">
                      <Link
                        to={`/admin/institutions/${institutionId}/missionaries/${m.id}`}
                        className="hover:text-brand-600 transition-colors"
                      >
                        {m.fullName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">{m.email}</td>
                    <td className="px-6 py-4">
                      {status?.answeredToday ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                          <CheckCircle2 size={14} />
                          Respondeu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-xs">
                          <Circle size={14} />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {status?.answeredToday && status.overallBand ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border ${BAND_COLORS[status.overallBand].bg} ${BAND_COLORS[status.overallBand].text} ${BAND_COLORS[status.overallBand].ring}`}
                        >
                          {status.overallScore} · {BAND_LABELS[status.overallBand]}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold text-xs">
                      {status?.answeredToday && status.trend ? TREND_LABELS[status.trend] : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelectedMember(m); setMemberModal('edit') }} className="text-slate-400 hover:text-brand-600 transition-colors p-1" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => { setSelectedMember(m); setMemberModal('delete') }} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Remover">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {group.members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Nenhum membro neste grupo ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

      {memberModal === 'edit' && selectedMember && (
        <Modal title="Editar membro" onClose={() => setMemberModal(null)}>
          <EditMemberForm
            institutionId={institutionId}
            member={{ userId: selectedMember.id, fullName: selectedMember.fullName, email: selectedMember.email, role: 'MISSIONARY', preferredName: null, phone: null }}
            onSaved={() => {
              setMemberModal(null)
              load()
            }}
            onCancel={() => setMemberModal(null)}
          />
        </Modal>
      )}

      {memberModal === 'delete' && selectedMember && (
        <Modal title="Remover membro" onClose={() => setMemberModal(null)}>
          <DeleteMemberForm
            institutionId={institutionId}
            member={{ userId: selectedMember.id, fullName: selectedMember.fullName, email: selectedMember.email, role: 'MISSIONARY', preferredName: null, phone: null }}
            onDeleted={() => {
              setMemberModal(null)
              load()
            }}
            onCancel={() => setMemberModal(null)}
          />
        </Modal>
      )}
    </>
  )
}
