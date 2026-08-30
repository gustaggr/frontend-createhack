import { AlertTriangle, CheckCircle2, UserPlus, Webhook, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import CopyField from '../../components/dashboard/CopyField'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { adminApi, type WebhookConfig, type WebhookEventType } from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { inputClass } from './InviteForms'

interface WebhookEventDoc {
  event: WebhookEventType
  icon: typeof UserPlus
  title: string
  description: string
  urlPlaceholder: string
  payloadExample: string
}

const WEBHOOK_EVENTS: WebhookEventDoc[] = [
  {
    event: 'INVITE_CREATED',
    icon: UserPlus,
    title: 'Convite criado',
    description:
      'Disparado sempre que um convite (líder, membro ou admin, de qualquer instituição) é criado ou reenviado — contém o link de ativação.',
    urlPlaceholder: 'https://minha-automacao.com/webhooks/convite',
    payloadExample: `{
  "event": "invite.created",
  "link": "https://app.with.org/invite/<token>",
  "email": "pessoa@exemplo.com",
  "fullName": "Nome da pessoa",
  "role": "MISSIONARY",
  "expiresAt": "2026-09-06T03:57:47.770Z"
}`,
  },
  {
    event: 'SCORE_ALERT',
    icon: AlertTriangle,
    title: 'Alerta de score baixo',
    description:
      'Disparado quando o score geral do check-in diário de um missionário fica abaixo de 60 — traz o nome, as esferas avaliadas, a preocupação imediata e o telefone do líder pra mandar a mensagem. Se o missionário tiver mais de um líder ativo, um deles é sorteado. Use uma URL separada da de convite para rotear esse alerta pro time de cuidado.',
    urlPlaceholder: 'https://minha-automacao.com/webhooks/alerta-de-score',
    payloadExample: `{
  "event": "score.alert",
  "missionaryId": "uuid",
  "institutionId": "uuid",
  "fullName": "Nome do missionário",
  "preferredName": "Apelido ou null",
  "overallScore": 52,
  "spheres": [
    { "dimension": "EMOTIONAL", "value": 30, "band": "PRIORITY" },
    { "dimension": "PHYSICAL", "value": 55, "band": "ATTENTION" }
  ],
  "concern": "Score geral em 52 (abaixo de 60). Esfera(s) em prioridade de cuidado: emocional. O líder deve procurar este missionário hoje.",
  "groupName": "Grupo Norte",
  "leaderName": "Nome do líder",
  "leaderPhone": "+55 11 91234-5678",
  "leaderEmail": "lider@exemplo.com",
  "checkinDate": "2026-08-30"
}`,
  },
]

function WebhookEventCard({
  doc,
  config,
  onUpdated,
}: {
  doc: WebhookEventDoc
  config: WebhookConfig | undefined
  onUpdated: () => void
}) {
  const [url, setUrl] = useState(config?.url ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const configured = !!config?.url

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await adminApi.configureWebhook(doc.event, url)
      setNewSecret(result.secret)
      onUpdated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o webhook.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 text-brand-600">
        <doc.icon size={18} />
        <h2 className="font-semibold text-slate-900">{doc.title}</h2>
        <code className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{doc.event}</code>
      </div>
      <p className="mt-2 text-sm text-slate-600">{doc.description}</p>

      <div className="mt-4 flex items-center gap-2 text-sm">
        {configured ? (
          <>
            <CheckCircle2 size={16} className="text-brand-600" />
            <span className="text-slate-700">
              Configurado — atualizado em {new Date(config!.updatedAt as string).toLocaleString('pt-BR')}
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
            placeholder={doc.urlPlaceholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" isLoading={submitting}>
          {submitting ? 'Salvando…' : configured ? 'Salvar e gerar novo secret' : 'Configurar webhook'}
        </Button>
      </form>

      {newSecret && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900 text-sm">Secret gerado</h3>
          <p className="mt-1 text-sm text-slate-600">
            Copie agora — ele não fica disponível de novo depois desta tela. Use-o para validar a
            assinatura de cada chamada deste evento.
          </p>
          <div className="mt-3">
            <CopyField value={newSecret} />
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-slate-600">Corpo enviado:</p>
      <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
        {doc.payloadExample}
      </pre>
    </Card>
  )
}

export default function WebhookSettings({
  configs,
  onUpdated,
}: {
  configs: WebhookConfig[]
  onUpdated: () => void
}) {
  const configByEvent = new Map(configs.map((c) => [c.event, c]))

  return (
    <div className="max-w-2xl space-y-5">
      <Card className="shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 text-brand-600">
          <Webhook size={18} />
          <h2 className="font-semibold text-slate-900">Como validar a chamada</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Cada requisição chega com o header{' '}
          <code className="rounded bg-brand-50 px-1 py-0.5 text-xs">X-With-Signature</code>: o HMAC
          SHA-256 do corpo da requisição (JSON), assinado com o secret do evento correspondente.
          Recalcule o HMAC do corpo recebido e compare com o header para confirmar que a chamada
          veio do With.
        </p>
      </Card>

      {WEBHOOK_EVENTS.map((doc) => (
        <WebhookEventCard
          key={doc.event}
          doc={doc}
          config={configByEvent.get(doc.event)}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  )
}
