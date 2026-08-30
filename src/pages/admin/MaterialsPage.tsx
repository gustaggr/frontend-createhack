import { FileText, FileVideo, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { CustomSelect } from '../../components/ui/CustomSelect'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { adminApi, type Group } from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { uploadToImageKit } from '../../lib/imagekitUpload'
import {
  materialsApi,
  type Material,
  type MaterialScope,
  type MaterialViewer,
} from '../../lib/materialsApi'
import { inputClass } from './InviteForms'

const SCOPE_LABELS: Record<MaterialScope, string> = {
  INDIVIDUAL: 'Um missionário',
  GROUP: 'Um grupo',
  LEADER_ALL: 'Todos que eu lidero',
  INSTITUTION: 'Toda a instituição',
}

function targetLabel(m: Material): string {
  if (m.scope === 'INDIVIDUAL') return m.missionary?.fullName ?? '—'
  if (m.scope === 'GROUP') return m.group?.name ?? '—'
  if (m.scope === 'LEADER_ALL') return 'Todos que o líder lidera'
  return 'Toda a instituição'
}

function useMaterialsAccess(institutionId: string): 'ADMIN' | 'LEADER' | 'NONE' {
  const { user } = useAuth()
  const isSuperAdmin = user?.roles.some((r) => r.role === 'SUPER_ADMIN' && r.status === 'ACTIVE')
  const isInstitutionAdmin = user?.roles.some(
    (r) => r.role === 'INSTITUTION_ADMIN' && r.status === 'ACTIVE' && r.institutionId === institutionId,
  )
  if (isSuperAdmin || isInstitutionAdmin) return 'ADMIN'
  const isLeader = user?.roles.some(
    (r) => r.role === 'LEADER' && r.status === 'ACTIVE' && r.institutionId === institutionId,
  )
  if (isLeader) return 'LEADER'
  return 'NONE'
}

function UploadMaterialForm({
  institutionId,
  access,
  groups,
  onCreated,
}: {
  institutionId: string
  access: 'ADMIN' | 'LEADER'
  groups: Group[]
  onCreated: () => void
}) {
  const scopeOptions: MaterialScope[] =
    access === 'ADMIN' ? ['INDIVIDUAL', 'GROUP', 'INSTITUTION'] : ['INDIVIDUAL', 'GROUP', 'LEADER_ALL']

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<MaterialScope>('INDIVIDUAL')
  const [groupId, setGroupId] = useState('')
  const [groupMembers, setGroupMembers] = useState<{ id: string; fullName: string }[]>([])
  const [missionaryId, setMissionaryId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) {
      setGroupMembers([])
      return
    }
    adminApi
      .getGroup(institutionId, groupId)
      .then((g) => setGroupMembers(g.members))
      .catch(() => setGroupMembers([]))
  }, [groupId, institutionId])

  function handleFileChange(f: File | null) {
    setError(null)
    if (!f) {
      setFile(null)
      return
    }
    if (!f.type.startsWith('video/') && f.type !== 'application/pdf') {
      setError('Envie um vídeo ou um PDF.')
      setFile(null)
      return
    }
    setFile(f)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError('Escolha um arquivo (vídeo ou PDF).')
      return
    }
    if (scope === 'GROUP' && !groupId) {
      setError('Escolha o grupo.')
      return
    }
    if (scope === 'INDIVIDUAL' && (!groupId || !missionaryId)) {
      setError('Escolha o grupo e o missionário.')
      return
    }

    setSubmitting(true)
    setProgress(0)
    try {
      const auth = await materialsApi.getUploadAuth(institutionId)
      const uploaded = await uploadToImageKit(file, auth, setProgress)

      await materialsApi.createMaterial(institutionId, {
        type: file.type === 'application/pdf' ? 'PDF' : 'VIDEO',
        title,
        description: description || undefined,
        scope,
        groupId: scope === 'GROUP' || scope === 'INDIVIDUAL' ? groupId : undefined,
        missionaryId: scope === 'INDIVIDUAL' ? missionaryId : undefined,
        fileUrl: uploaded.url,
        fileId: uploaded.fileId,
        thumbnailUrl: uploaded.thumbnailUrl,
      })

      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o material.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Descrição <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Arquivo (vídeo ou PDF)</label>
        <input
          required
          type="file"
          accept="video/*,application/pdf"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
      </div>

      <CustomSelect
        label="Para quem"
        value={SCOPE_LABELS[scope]}
        onChange={(label) => {
          const found = scopeOptions.find((s) => SCOPE_LABELS[s] === label)
          if (found) {
            setScope(found)
            setGroupId('')
            setMissionaryId('')
          }
        }}
        options={scopeOptions.map((s) => SCOPE_LABELS[s])}
      />

      {(scope === 'GROUP' || scope === 'INDIVIDUAL') && (
        <CustomSelect
          label="Grupo"
          value={groups.find((g) => g.id === groupId)?.name ?? ''}
          onChange={(name) => {
            setGroupId(groups.find((g) => g.name === name)?.id ?? '')
            setMissionaryId('')
          }}
          options={groups.map((g) => g.name)}
          placeholder="Selecione um grupo"
        />
      )}

      {scope === 'INDIVIDUAL' && groupId && (
        <CustomSelect
          label="Missionário"
          value={groupMembers.find((m) => m.id === missionaryId)?.fullName ?? ''}
          onChange={(name) => setMissionaryId(groupMembers.find((m) => m.fullName === name)?.id ?? '')}
          options={groupMembers.map((m) => m.fullName)}
          placeholder="Selecione um missionário"
        />
      )}

      {submitting && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-brand-600 transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pt-2">
        <Button type="submit" isLoading={submitting} className="w-full">
          {submitting ? 'Enviando…' : 'Enviar material'}
        </Button>
      </div>
    </form>
  )
}

function ViewersList({ institutionId, materialId }: { institutionId: string; materialId: string }) {
  const [viewers, setViewers] = useState<MaterialViewer[] | null>(null)

  useEffect(() => {
    materialsApi.getViewers(institutionId, materialId).then(setViewers).catch(() => setViewers([]))
  }, [institutionId, materialId])

  if (!viewers) return <p className="text-sm text-slate-400">Carregando…</p>
  if (viewers.length === 0) return <p className="text-sm text-slate-400">Sem público-alvo definido.</p>

  return (
    <ul className="divide-y divide-slate-50">
      {viewers.map((v) => (
        <li key={v.missionaryId} className="flex items-center justify-between py-2.5 text-sm">
          <span className="text-slate-700">{v.fullName}</span>
          {v.viewed ? (
            <span className="text-xs font-medium text-brand-600">
              Visto {v.viewedAt ? new Date(v.viewedAt).toLocaleDateString('pt-BR') : ''}
            </span>
          ) : (
            <span className="text-xs text-slate-400">Ainda não viu</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function MaterialsPage({
  institutionId: institutionIdProp,
  showCreateButton = true,
  createOpen: createOpenProp,
  onCreateOpenChange,
}: {
  institutionId?: string
  /** Quando false, o botão "Novo material" não é renderizado aqui — o pai controla a criação via createOpen/onCreateOpenChange. */
  showCreateButton?: boolean
  createOpen?: boolean
  onCreateOpenChange?: (open: boolean) => void
} = {}) {
  const params = useParams<{ institutionId: string }>()
  const institutionId = institutionIdProp ?? params.institutionId ?? ''
  const access = useMaterialsAccess(institutionId)

  const [materials, setMaterials] = useState<Material[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [internalCreateOpen, setInternalCreateOpen] = useState(false)
  const createOpen = createOpenProp ?? internalCreateOpen
  const setCreateOpen = onCreateOpenChange ?? setInternalCreateOpen
  const [viewersFor, setViewersFor] = useState<Material | null>(null)

  function load() {
    if (!institutionId) return
    materialsApi.listMaterials(institutionId).then(setMaterials).catch(() => {})
    adminApi.listGroups(institutionId).then(setGroups).catch(() => {})
  }

  useEffect(load, [institutionId])

  async function handleDelete(m: Material) {
    if (!confirm(`Apagar "${m.title}"? Essa ação não pode ser desfeita.`)) return
    try {
      await materialsApi.deleteMaterial(institutionId, m.id)
      load()
    } catch {
      // sem toast nesta rodada — a lista continua mostrando o item em caso de falha
    }
  }

  if (!institutionId || access === 'NONE') return null

  return (
    <>
      {showCreateButton && (
        <div className="mb-4 flex items-center justify-end gap-3">
          <Button variant="white" onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-2" />
            Novo material
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {materials.map((m) => (
          <Card key={m.id} className="shadow-sm border border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-brand-600">
                {m.type === 'VIDEO' ? <FileVideo size={18} /> : <FileText size={18} />}
                <h3 className="font-semibold text-slate-900">{m.title}</h3>
              </div>
              <button
                onClick={() => handleDelete(m)}
                className="p-1 text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                title="Apagar"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {m.description && <p className="mt-2 text-sm text-slate-600">{m.description}</p>}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="rounded-lg bg-slate-50 px-2 py-1 font-medium">{targetLabel(m)}</span>
              <button
                onClick={() => setViewersFor(m)}
                className="flex items-center gap-1 text-brand-600 hover:underline cursor-pointer"
              >
                <Users size={14} />
                {m._count.views}/{m.audienceSize} assistiram
              </button>
            </div>
          </Card>
        ))}
        {materials.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-slate-400">
            Nenhum material enviado ainda.
          </p>
        )}
      </div>

      {createOpen && (
        <Modal title="Novo material" onClose={() => setCreateOpen(false)}>
          <UploadMaterialForm
            institutionId={institutionId}
            access={access}
            groups={groups}
            onCreated={() => {
              setCreateOpen(false)
              load()
            }}
          />
        </Modal>
      )}

      {viewersFor && (
        <Modal title={`Quem viu — ${viewersFor.title}`} onClose={() => setViewersFor(null)}>
          <ViewersList institutionId={institutionId} materialId={viewersFor.id} />
        </Modal>
      )}
    </>
  )
}
