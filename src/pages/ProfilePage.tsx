import { Mail, Phone, User as UserIcon, Pencil, Check, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth, type UserRoleContext } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'
import { inputClass } from './admin/InviteForms'

const ROLE_LABELS: Record<UserRoleContext['role'], string> = {
  SUPER_ADMIN: 'Administrador da plataforma',
  INSTITUTION_ADMIN: 'Administrador da instituição',
  LEADER: 'Líder',
  MISSIONARY: 'Missionário(a)',
  FAMILY: 'Familiar',
}

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  
  // Form State
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [preferredName, setPreferredName] = useState(user?.preferredName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!user) return null

  const displayName = user.preferredName ?? user.fullName
  const initial = displayName.charAt(0).toUpperCase()

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (newPassword && !currentPassword) {
      setError('Você deve informar a senha atual para definir uma nova.')
      return
    }

    setSubmitting(true)
    try {
      await api.patch('/auth/me', {
        fullName: fullName !== user?.fullName ? fullName : undefined,
        preferredName: preferredName !== (user?.preferredName || '') ? preferredName : undefined,
        phone: phone !== (user?.phone || '') ? phone : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      })
      await refresh()
      setIsEditing(false)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao atualizar perfil.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setIsEditing(false)
    setFullName(user?.fullName || '')
    setPreferredName(user?.preferredName || '')
    setPhone(user?.phone || '')
    setCurrentPassword('')
    setNewPassword('')
    setError(null)
  }

  return (
    <>
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 lg:text-white tracking-tight">Meu perfil</h1>
          {!isEditing && (
            <Button variant="white" onClick={() => setIsEditing(true)}>
              <Pencil size={16} className="mr-2" />
              Editar
            </Button>
          )}
        </div>

        <Card className="shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
              {initial}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{user.fullName}</p>
              {user.preferredName && (
                <p className="text-sm text-slate-500">Prefere ser chamado(a) de {user.preferredName}</p>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="mt-6 space-y-4 border-t border-slate-100 pt-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nome completo</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome de preferência <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} className={inputClass} />
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

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Trocar Senha</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Senha Atual</label>
                    <input 
                      type="password" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      className={inputClass} 
                      placeholder="Somente se for trocar a senha"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Nova Senha</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className={inputClass}
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X size={16} className="mr-2" /> Cancelar
                </Button>
                <Button type="submit" isLoading={submitting}>
                  <Check size={16} className="mr-2" /> {submitting ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail size={16} className="text-brand-600" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone size={16} className="text-brand-600" />
                    {user.phone}
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <UserIcon size={14} />
                  Papéis
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <span
                      key={role.id}
                      className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700"
                    >
                      {ROLE_LABELS[role.role]}
                      {role.institutionName ? ` · ${role.institutionName}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
