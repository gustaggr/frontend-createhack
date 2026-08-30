import { Plus, RefreshCw, UsersRound, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import InviteLinkResult from '../../components/dashboard/InviteLinkResult'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { MultiSelectChips } from '../../components/ui/MultiSelectChips'
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
import MaterialsPage from './MaterialsPage'
import { EditMemberForm, DeleteMemberForm } from './MemberForms'

type Tab = 'directors' | 'groups' | 'leaders' | 'members' | 'invites' | 'materials'

const TABS: { id: Tab; label: string }[] = [
  { id: 'directors', label: 'Diretoria' },
  { id: 'groups', label: 'Grupos' },
  { id: 'leaders', label: 'Líderes' },
  { id: 'members', label: 'Membros' },
  { id: 'invites', label: 'Convites' },
  { id: 'materials', label: 'Materiais' },
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
  const [leaderIds, setLeaderIds] = useState<string[]>([])
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
        leaderIds,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o grupo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome do grupo</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <MultiSelectChips
          label="Líderes responsáveis"
          options={leaders.map((l) => ({ id: l.userId, label: l.fullName }))}
          selectedIds={leaderIds}
          onChange={setLeaderIds}
          emptyHint="Nenhum líder cadastrado ainda."
        />
        <p className="mt-1 text-xs text-slate-400">
          Opcional — deixe sem marcar nenhum pra um grupo sem líder designado (ex.: turma da escola).
        </p>
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

      <div className="pt-2">
        <Button type="submit" isLoading={submitting} className="w-full">
          {submitting ? 'Criando…' : 'Criar grupo'}
        </Button>
      </div>
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
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberModal, setMemberModal] = useState<'edit' | 'delete' | null>(null)
  const [materialsCreateOpen, setMaterialsCreateOpen] = useState(false)

  const leaders = members.filter((m) => m.role === 'LEADER')
  const missionaries = members.filter((m) => m.role === 'MISSIONARY')

  function load() {
    if (!institutionId) return
    adminApi.getInstitution(institutionId).then(setInstitution).catch(() => { })
    adminApi.listMembers(institutionId, 'INSTITUTION_ADMIN').then(setDirectors).catch(() => { })
    adminApi.listMembers(institutionId).then(setMembers).catch(() => { })
    adminApi.listGroups(institutionId).then(setGroups).catch(() => { })
    adminApi.listInvites(institutionId).then(setInvites).catch(() => { })
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
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {institution?.displayName ?? 'Instituição'}
          </h1>
          <p className="mt-1 text-sm font-medium text-white/80">
            Diretoria, líderes, grupos e membros desta instituição.
          </p>
        </div>
        <div className="flex gap-2">
          {tab === 'directors' && isSuperAdmin && (
            <Button variant="white" onClick={() => setModal('director')}>
              <Plus size={16} className="mr-2" />
              Convidar diretor
            </Button>
          )}
          {tab === 'groups' && (
            <Button variant="white" onClick={() => setModal('group')}>
              <Plus size={16} className="mr-2" />
              Novo grupo
            </Button>
          )}
          {tab === 'leaders' && (
            <Button variant="white" onClick={() => setModal('leader')}>
              <Plus size={16} className="mr-2" />
              Convidar líder
            </Button>
          )}
          {tab === 'materials' && (
            <Button variant="white" onClick={() => setMaterialsCreateOpen(true)}>
              <Plus size={16} className="mr-2" />
              Novo material
            </Button>
          )}
          {tab === 'members' && (
            <Button variant="white" onClick={() => setModal('member')}>
              <Plus size={16} className="mr-2" />
              Convidar membro
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all whitespace-nowrap ${tab === t.id
                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/25'
                : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-100'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'directors' && (
        <section>
          <MembersTable 
            members={directors} 
            showGroup={false} 
            onEdit={(m) => { setSelectedMember(m); setMemberModal('edit') }}
            onDelete={(m) => { setSelectedMember(m); setMemberModal('delete') }}
          />
        </section>
      )}

      {tab === 'groups' && (
        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
              <Link key={g.id} to={`/admin/institutions/${institutionId}/groups/${g.id}`}>
                <Card className="shadow-sm border border-slate-100 p-4 transition-colors hover:border-brand-300">
                  <div className="flex items-center gap-2 text-brand-600">
                    <UsersRound size={18} />
                    <h3 className="font-semibold text-slate-900">{g.name}</h3>
                  </div>
                  {g.locality && <p className="mt-1 text-xs text-slate-400">{g.locality}</p>}
                  {g.description && <p className="mt-2 text-sm text-slate-600">{g.description}</p>}
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {g.leaders.length > 0
                        ? `Líder(es): ${g.leaders.map((l) => l.fullName).join(', ')}`
                        : 'Sem líder atribuído'}
                    </span>
                    <span className="font-medium text-slate-900">{g.memberCount} membro(s)</span>
                  </div>
                </Card>
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
          <MembersTable 
            members={leaders} 
            showGroup={false} 
            onEdit={(m) => { setSelectedMember(m); setMemberModal('edit') }}
            onDelete={(m) => { setSelectedMember(m); setMemberModal('delete') }}
          />
        </section>
      )}

      {tab === 'members' && (
        <section>
          <MembersTable 
            members={missionaries} 
            showGroup 
            institutionId={institutionId} 
            onEdit={(m) => { setSelectedMember(m); setMemberModal('edit') }}
            onDelete={(m) => { setSelectedMember(m); setMemberModal('delete') }}
          />
        </section>
      )}

      {tab === 'invites' && (
        <section className="overflow-hidden bg-white rounded-[40px] shadow-xl border border-slate-100 pt-2 p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead className="border-b border-slate-100">
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Papel</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700 tracking-tight">{inv.fullName}</p>
                      <p className="text-[10px] font-black text-slate-400">{inv.email}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 text-xs tracking-tight">{inv.role}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${inv.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          inv.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                        {INVITE_STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === 'PENDING' && (
                        <button
                          onClick={() => handleResend(inv.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <RefreshCw size={12} />
                          Obter link
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {invites.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      Nenhum convite criado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'materials' && (
        <section>
          <MaterialsPage
            institutionId={institutionId}
            showCreateButton={false}
            createOpen={materialsCreateOpen}
            onCreateOpenChange={setMaterialsCreateOpen}
          />
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

      {memberModal === 'edit' && selectedMember && (
        <Modal title="Editar membro" onClose={() => setMemberModal(null)}>
          <EditMemberForm
            institutionId={institutionId}
            member={selectedMember}
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
            member={selectedMember}
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

function MembersTable({
  members,
  showGroup,
  institutionId,
  onEdit,
  onDelete,
}: {
  members: Member[]
  showGroup: boolean
  institutionId?: string
  onEdit: (m: Member) => void
  onDelete: (m: Member) => void
}) {
  return (
    <div className="overflow-hidden bg-white rounded-[40px] shadow-xl border border-slate-100 pt-2 p-0">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[480px]">
          <thead className="border-b border-slate-100">
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">E-mail</th>
              {showGroup && <th className="px-6 py-4">Grupo</th>}
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {members.map((m) => (
              <tr key={m.userId} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700 tracking-tight">
                  {institutionId ? (
                    <Link
                      to={`/admin/institutions/${institutionId}/missionaries/${m.userId}`}
                      className="hover:text-brand-600 transition-colors"
                    >
                      {m.fullName}
                    </Link>
                  ) : (
                    m.fullName
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500 font-medium text-xs">{m.email}</td>
                {showGroup && (
                  <td className="px-6 py-4 font-bold text-slate-600 text-xs tracking-tight">
                    {m.group ? (
                      <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        {m.group.name}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onEdit(m)} className="text-slate-400 hover:text-brand-600 transition-colors p-1" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(m)} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Remover">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={showGroup ? 4 : 3} className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  Ninguém por aqui ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
