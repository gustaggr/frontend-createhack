import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { CustomSelect } from '../../components/ui/CustomSelect'
import { adminApi, type Role } from '../../lib/adminApi'
import { ApiError } from '../../lib/api'

export const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200'

interface InviteFormProps {
  institutionId: string
  role: Extract<Role, 'INSTITUTION_ADMIN' | 'LEADER' | 'MISSIONARY'>
  groupOptions?: { id: string; name: string }[]
  /** Quando informado, pula o seletor de grupo e convida direto para este grupo. */
  fixedGroupId?: string
  onCreated: (result: { activationLink: string; expiresAt: string }) => void
}

export function InviteForm({
  institutionId,
  role,
  groupOptions,
  fixedGroupId,
  onCreated,
}: InviteFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [groupId, setGroupId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await adminApi.createInvite(institutionId, {
        email,
        fullName,
        role,
        groupId: role === 'MISSIONARY' ? (fixedGroupId ?? groupId) : undefined,
      })
      onCreated(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o convite.')
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
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      {role === 'MISSIONARY' && !fixedGroupId && (
        <div>
          <CustomSelect
            label="Grupo"
            value={groupOptions?.find((g) => g.id === groupId)?.name ?? ''}
            onChange={(name) => {
              const group = groupOptions?.find((g) => g.name === name)
              setGroupId(group?.id ?? '')
            }}
            options={groupOptions?.map((g) => g.name) ?? []}
            placeholder="Selecione um grupo"
          />
          {groupOptions?.length === 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Crie um grupo primeiro para poder convidar membros.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pt-2">
        <Button type="submit" isLoading={submitting} className="w-full">
          {submitting ? 'Convidando…' : 'Enviar convite'}
        </Button>
      </div>
    </form>
  )
}
