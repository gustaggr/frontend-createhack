import { CheckCircle2, Webhook, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import CopyField from '../../components/dashboard/CopyField'
import { adminApi, type WebhookConfig } from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { inputClass } from './InviteForms'

const PAYLOAD_EXAMPLE = `{
  "link": "https://app.with.org/invite/<token>",
  "email": "pessoa@exemplo.com",
  "fullName": "Nome da pessoa",
  "role": "MISSIONARY",
  "expiresAt": "2026-09-06T03:57:47.770Z"
}`

export default function WebhookSettings({
  config,
  onUpdated,
}: {
  config: WebhookConfig | null
  onUpdated: () => void
}) {
  const [url, setUrl] = useState(config?.url ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const configured = !!config

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await adminApi.configureWebhook(url)
      setNewSecret(result.secret)
      onUpdated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o webhook.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-brand-600">
          <Webhook size={18} />
          <h2 className="font-semibold text-slate-900">Webhook de convite</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Toda vez que um convite (líder, membro ou admin, de qualquer instituição) é criado, o
          With envia um <code className="rounded bg-brand-50 px-1 py-0.5 text-xs">POST</code> para
          esta URL com o link de ativação. É uma configuração única da plataforma — use uma
          automação (n8n, Zapier, Make…) para rotear a entrega por e-mail, WhatsApp etc.
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm">
          {configured ? (
            <>
              <CheckCircle2 size={16} className="text-brand-600" />
              <span className="text-slate-700">
                Configurado — atualizado em {new Date(config!.updatedAt).toLocaleString('pt-BR')}
              </span>
            </>
          ) : (
            <>
              <XCircle size={16} className="text-slate-400" />
              <span className="text-slate-500">Nenhum webhook configurado ainda</span>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">URL do webhook</label>
            <input
              required
              type="url"
              placeholder="https://minha-automacao.com/webhooks/with"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Salvando…' : configured ? 'Salvar e gerar novo secret' : 'Configurar webhook'}
          </button>
        </form>
      </div>

      {newSecret && (
        <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="font-semibold text-slate-900">Secret gerado</h3>
          <p className="mt-1 text-sm text-slate-600">
            Copie agora — ele não fica disponível de novo depois desta tela. Use-o para validar a
            assinatura de cada chamada.
          </p>
          <div className="mt-3">
            <CopyField value={newSecret} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="font-semibold text-slate-900">Como validar a chamada</h3>
        <p className="mt-2 text-sm text-slate-600">
          Cada requisição chega com o header{' '}
          <code className="rounded bg-brand-50 px-1 py-0.5 text-xs">X-With-Signature</code>: o HMAC
          SHA-256 do corpo da requisição (JSON), assinado com o secret acima. Recalcule o HMAC do
          corpo recebido e compare com o header para confirmar que a chamada veio do With.
        </p>
        <p className="mt-3 text-sm text-slate-600">Corpo enviado:</p>
        <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
          {PAYLOAD_EXAMPLE}
        </pre>
      </div>
    </div>
  )
}
