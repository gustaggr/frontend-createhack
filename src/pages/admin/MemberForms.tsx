import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { adminApi, type Member } from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { inputClass } from './InviteForms'

export function EditMemberForm({
  institutionId,
  member,
  onSaved,
  onCancel,
}: {
  institutionId: string
  member: Member
  onSaved: () => void
  onCancel: () => void
}) {
  const [fullName, setFullName] = useState(member.fullName)
  const [email, setEmail] = useState(member.email)
  const [phone, setPhone] = useState(member.phone ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminApi.updateMember(institutionId, member.userId, {
        fullName: fullName !== member.fullName ? fullName : undefined,
        email: email !== member.email ? email : undefined,
        phone: phone !== (member.phone ?? '') ? phone : undefined,
        password: password || undefined,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o membro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome completo</label>
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Telefone <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <input
          type="tel"
          placeholder="+55 11 91234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nova Senha <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Deixe em branco para manter a atual"
          className={inputClass}
          minLength={6}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={submitting}>
          {submitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

export function DeleteMemberForm({
  institutionId,
  member,
  onDeleted,
  onCancel,
}: {
  institutionId: string
  member: Member
  onDeleted: () => void
  onCancel: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleDelete() {
    setError(null)
    setSubmitting(true)
    try {
      await adminApi.removeMember(institutionId, member.userId)
      onDeleted()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível remover o membro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Você tem certeza que deseja remover <strong>{member.fullName}</strong>?
      </p>
      <p className="text-sm text-slate-600">
        Esta ação irá revogar o acesso à instituição e remover o usuário de qualquer grupo vinculado.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" variant="danger" isLoading={submitting} onClick={handleDelete}>
          {submitting ? 'Removendo…' : 'Remover'}
        </Button>
      </div>
    </div>
  )
}
