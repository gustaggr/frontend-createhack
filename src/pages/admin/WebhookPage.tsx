import { useEffect, useState } from 'react'

import { adminApi, type WebhookConfig } from '../../lib/adminApi'
import WebhookSettings from './WebhookSettings'

export default function WebhookPage() {
  const [configs, setConfigs] = useState<WebhookConfig[] | undefined>(undefined)

  function load() {
    adminApi.listWebhookConfigs().then(setConfigs).catch(() => setConfigs([]))
  }

  useEffect(load, [])

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Webhook</h1>
        <p className="mt-1 text-sm font-medium text-white/80">
          Cada evento tem sua própria URL — configure uma automação (n8n, Zapier, Make…) separada
          para cada um.
        </p>
      </div>

      {configs !== undefined && <WebhookSettings configs={configs} onUpdated={load} />}
    </>
  )
}
