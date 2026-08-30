import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'

const CONSENT_VERSION = 'v1'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Administrador da plataforma',
  INSTITUTION_ADMIN: 'Administrador da instituição',
  LEADER: 'Líder',
  MISSIONARY: 'Missionário(a)',
  FAMILY: 'Familiar',
}

interface InvitePreview {
  fullName: string
  email: string
  role: string
  institutionName: string
  leaderName: string | null
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
  expiresAt: string
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [acceptedVisibility, setAcceptedVisibility] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api
      .get<InvitePreview>(`/invites/${token}`)
      .then(setInvite)
      .catch(() => setLoadError('Este convite não foi encontrado.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      await api.post(`/invites/${token}/accept`, {
        password,
        consents: [
          { type: 'TERMS_OF_USE', version: CONSENT_VERSION },
          { type: 'PRIVACY_POLICY', version: CONSENT_VERSION },
          { type: 'DATA_VISIBILITY', version: CONSENT_VERSION },
        ],
      })
      await refresh()
      navigate('/home', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Não foi possível concluir a ativação. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <p className="text-sm text-brand-700">Carregando convite…</p>
      </div>
    )
  }

  if (loadError || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Convite indisponível</h1>
          <p className="mt-2 text-sm text-slate-600">{loadError ?? 'Convite não encontrado.'}</p>
          <Link to="/login" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  if (invite.status !== 'PENDING') {
    const messages: Record<string, string> = {
      ACCEPTED: 'Este convite já foi utilizado. Faça login normalmente.',
      EXPIRED: 'Este convite expirou. Peça para gerarem um novo.',
      REVOKED: 'Este convite foi revogado.',
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Convite indisponível</h1>
          <p className="mt-2 text-sm text-slate-600">{messages[invite.status]}</p>
          <Link to="/login" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  const canSubmit =
    password.length >= 8 && acceptedTerms && acceptedPrivacy && acceptedVisibility && !submitting

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
            W
          </div>
          <h1 className="text-xl font-bold text-slate-900">Bem-vindo(a), {invite.fullName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Você foi convidado(a) como <strong>{ROLE_LABELS[invite.role] ?? invite.role}</strong>{' '}
            em <strong>{invite.institutionName}</strong>
            {invite.leaderName ? (
              <>
                , sob a liderança de <strong>{invite.leaderName}</strong>
              </>
            ) : null}
            .
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Crie sua senha
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="rounded-xl bg-brand-50 p-3 text-xs text-slate-600">
              Antes de continuar, é importante você saber: seus check-ins e histórico ficam
              visíveis para a liderança conforme a política de cada pergunta — algumas respostas
              podem ser compartilhadas, outras usadas só no cálculo do seu indicador, e situações
              de risco seguem um protocolo próprio. Isto não substitui acompanhamento
              médico, psicológico ou pastoral, nem serviços de emergência.
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              Li e aceito os Termos de Uso.
            </label>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              Li e aceito a Política de Privacidade.
            </label>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={acceptedVisibility}
                onChange={(e) => setAcceptedVisibility(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              Entendo quem poderá visualizar meus dados, conforme explicado acima.
            </label>

            {submitError && (
              <p role="alert" className="text-sm text-red-600">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-brand-600 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Ativando…' : 'Ativar minha conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
