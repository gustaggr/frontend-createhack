import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { adminApi, type WebhookConfig } from '../../lib/adminApi'
import WebhookSettings from './WebhookSettings'

export default function WebhookPage() {
  const [config, setConfig] = useState<WebhookConfig | null | undefined>(undefined)

  function load() {
    adminApi.getWebhookConfig().then(setConfig).catch(() => setConfig(null))
  }

  useEffect(load, [])

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Webhook</h1>
        <p className="text-sm text-slate-500">
          Configuração única da plataforma para o envio de links de convite.
        </p>
      </div>

      {config !== undefined && <WebhookSettings config={config} onUpdated={load} />}
    </DashboardLayout>
  )
}
