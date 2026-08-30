import { Plus, RefreshCw, UsersRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import InviteLinkResult from '../../components/dashboard/InviteLinkResult'
import Modal from '../../components/dashboard/Modal'
import { useAuth } from '../../context/AuthContext'
import {
  adminApi,
  type Group,
  type Institution,
  type InviteSummary,
  type Member,
} from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { inputClass, InviteForm } from './InviteForms'

type Tab = 'directors' | 'groups' | 'leaders' | 'members' | 'invites'

const TABS: { id: Tab; label: string }[] = [
  { id: 'directors', label: 'Diretoria' },
  { id: 'groups', label: 'Grupos' },
  { id: 'leaders', label: 'Líderes' },
  { id: 'members', label: 'Membros' },
  { id: 'invites', label: 'Convites' },
]

const INVITE_STATUS_LABELS: Record<InviteSummary['status'], string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  EXPIRED: 'Expirado',
  REVOKED: 'Revogado',
}

function CreateGroupForm({
  institutionId,
  leaders,
  onCreated,
}: {
  institutionId: string
  leaders: Member[]
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [locality, setLocality] = useState('')
  const [leaderId, setLeaderId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminApi.createGroup(institutionId, {
        name,
        description: description || undefined,
        locality: locality || undefined,
        leaderId,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o grupo.')
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
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Líder responsável</label>
        <select required value={leaderId} onChange={(e) => setLeaderId(e.target.value)} className={inputClass}>
          <option value="">Selecione um líder</option>
          {leaders.map((l) => (
            <option key={l.userId} value={l.userId}>
              {l.fullName}
            </option>
          ))}
        </select>
        {leaders.length === 0 && (
          <p className="mt-1 text-xs text-slate-400">Convide um líder antes de criar um grupo.</p>
        )}
      </div>
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
        {submitting ? 'Criando…' : 'Criar grupo'}
      </button>
    </form>
  )
}

export default function InstitutionDetailPage() {
  const { institutionId } = useParams<{ institutionId: string }>()
  const { user } = useAuth()
  const isSuperAdmin = user?.roles.some((r) => r.role === 'SUPER_ADMIN' && r.status === 'ACTIVE')

  const [institution, setInstitution] = useState<Institution | null>(null)
  const [directors, setDirectors] = useState<Member[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [invites, setInvites] = useState<InviteSummary[]>([])
  const [tab, setTab] = useState<Tab>('directors')
  const [modal, setModal] = useState<'group' | 'director' | 'leader' | 'member' | null>(null)
  const [inviteResult, setInviteResult] = useState<{ activationLink: string; expiresAt: string } | null>(
    null,
  )

  const leaders = members.filter((m) => m.role === 'LEADER')
  const missionaries = members.filter((m) => m.role === 'MISSIONARY')

  function load() {
    if (!institutionId) return
    adminApi.getInstitution(institutionId).then(setInstitution).catch(() => {})
    adminApi.listMembers(institutionId, 'INSTITUTION_ADMIN').then(setDirectors).catch(() => {})
    adminApi.listMembers(institutionId).then(setMembers).catch(() => {})
    adminApi.listGroups(institutionId).then(setGroups).catch(() => {})
    adminApi.listInvites(institutionId).then(setInvites).catch(() => {})
  }

  useEffect(load, [institutionId])

  if (!institutionId) return null

  async function handleResend(inviteId: string) {
    try {
      const result = await adminApi.resendInvite(inviteId)
      setInviteResult(result)
      load()
    } catch {
      // erro já é visível pelo convite continuar pendente; sem toast nesta rodada
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">{institution?.displayName ?? 'Instituição'}</h1>
        <p className="text-sm text-slate-500">Diretoria, líderes, grupos e membros desta instituição.</p>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-brand-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-brand-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'directors' && (
        <section>
          <p className="mb-3 text-sm text-slate-500">
            O diretor comanda a instituição: adiciona líderes, grupos e membros.
          </p>
          {isSuperAdmin && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setModal('director')}
                className="flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                <Plus size={16} />
                Convidar diretor
              </button>
            </div>
          )}
          <MembersTable members={directors} showGroup={false} />
        </section>
      )}

      {tab === 'groups' && (
        <section>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setModal('group')}
              className="flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus size={16} />
              Novo grupo
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
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
                {g.description && <p className="mt-2 text-sm text-slate-600">{g.description}</p>}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Líder: {g.leader.fullName}</span>
                  <span className="font-medium text-slate-900">{g.memberCount} membro(s)</span>
                </div>
              </Link>
            ))}
            {groups.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-slate-400">
                Nenhum grupo cadastrado ainda.
              </p>
            )}
          </div>
        </section>
      )}

      {tab === 'leaders' && (
        <section>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setModal('leader')}
              className="flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus size={16} />
              Convidar líder
            </button>
          </div>
          <MembersTable members={leaders} showGroup={false} />
        </section>
      )}

      {tab === 'members' && (
        <section>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setModal('member')}
              className="flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus size={16} />
              Convidar membro
            </button>
          </div>
          <MembersTable members={missionaries} showGroup institutionId={institutionId} />
        </section>
      )}

      {tab === 'invites' && (
        <section className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-brand-50 text-left text-xs font-medium text-slate-400">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {invites.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{inv.fullName}</p>
                    <p className="text-xs text-slate-400">{inv.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{inv.role}</td>
                  <td className="px-4 py-3 text-slate-600">{INVITE_STATUS_LABELS[inv.status]}</td>
                  <td className="px-4 py-3 text-right">
                    {inv.status === 'PENDING' && (
                      <button
                        onClick={() => handleResend(inv.id)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                      >
                        <RefreshCw size={14} />
                        Obter link
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                    Nenhum convite criado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {modal === 'group' && (
        <Modal title="Novo grupo" onClose={() => setModal(null)}>
          <CreateGroupForm
            institutionId={institutionId}
            leaders={leaders}
            onCreated={() => {
              setModal(null)
              load()
            }}
          />
        </Modal>
      )}

      {modal === 'director' && (
        <Modal title="Convidar diretor" onClose={() => setModal(null)}>
          <InviteForm
            institutionId={institutionId}
            role="INSTITUTION_ADMIN"
            onCreated={(result) => {
              setModal(null)
              setInviteResult(result)
              load()
            }}
          />
        </Modal>
      )}

      {modal === 'leader' && (
        <Modal title="Convidar líder" onClose={() => setModal(null)}>
          <InviteForm
            institutionId={institutionId}
            role="LEADER"
            onCreated={(result) => {
              setModal(null)
              setInviteResult(result)
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
            groupOptions={groups.map((g) => ({ id: g.id, name: g.name }))}
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

function MembersTable({
  members,
  showGroup,
  institutionId,
}: {
  members: Member[]
  showGroup: boolean
  institutionId?: string
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-brand-50 text-left text-xs font-medium text-slate-400">
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">E-mail</th>
            {showGroup && <th className="px-4 py-3 font-medium">Grupo</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-50">
          {members.map((m) => (
            <tr key={m.userId}>
              <td className="px-4 py-3 font-medium text-slate-900">
                {institutionId ? (
                  <Link
                    to={`/admin/institutions/${institutionId}/missionaries/${m.userId}`}
                    className="hover:text-brand-600 hover:underline"
                  >
                    {m.fullName}
                  </Link>
                ) : (
                  m.fullName
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{m.email}</td>
              {showGroup && (
                <td className="px-4 py-3 text-slate-600">{m.group?.name ?? '—'}</td>
              )}
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={showGroup ? 3 : 2} className="px-4 py-8 text-center text-sm text-slate-400">
                Ninguém por aqui ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
