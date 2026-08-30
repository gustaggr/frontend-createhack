import { Building2, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { adminApi, type Institution } from '../../lib/adminApi'
import { ApiError } from '../../lib/api'

const STATUS_LABELS: Record<Institution['status'], string> = {
  ACTIVE: 'Ativa',
  SUSPENDED: 'Suspensa',
  INACTIVE: 'Inativa',
}

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200'

function CreateInstitutionForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [country, setCountry] = useState('BR')
  const [defaultLanguage, setDefaultLanguage] = useState('pt-BR')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminApi.createInstitution({ name, displayName, country, defaultLanguage, timezone, email })
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a instituição.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome legal</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome de exibição</label>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">País</label>
          <input required value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Idioma padrão</label>
          <input
            required
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Fuso horário</label>
        <input required value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">E-mail de contato</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pt-2">
        <Button type="submit" isLoading={submitting} className="w-full">
          {submitting ? 'Criando…' : 'Criar instituição'}
        </Button>
      </div>
    </form>
  )
}

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function load() {
    adminApi
      .listInstitutions()
      .then(setInstitutions)
      .catch(() => setError('Não foi possível carregar as instituições.'))
  }

  useEffect(load, [])

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Instituições</h1>
          <p className="mt-1 text-sm font-medium text-white/80">Igrejas e organizações que usam a plataforma.</p>
        </div>
        <Button variant="white" onClick={() => setModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Nova instituição
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
              <th className="px-4 py-3 font-medium">Instituição</th>
              <th className="px-4 py-3 font-medium">País</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {institutions?.map((inst) => (
              <tr key={inst.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Building2 size={16} />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{inst.displayName}</p>
                      <p className="text-xs text-slate-400">{inst.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{inst.country}</td>
                <td className="px-4 py-3 text-slate-600">{STATUS_LABELS[inst.status]}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/institutions/${inst.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                    Gerenciar
                  </Link>
                </td>
              </tr>
            ))}
            {institutions?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhuma instituição cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
      </div>

      {modalOpen && (
        <Modal title="Nova instituição" onClose={() => setModalOpen(false)}>
          <CreateInstitutionForm
            onCreated={() => {
              setModalOpen(false)
              load()
            }}
          />
        </Modal>
      )}
    </>
  )
}
