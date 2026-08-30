import CopyField from './CopyField'

export default function InviteLinkResult({
  activationLink,
  expiresAt,
}: {
  activationLink: string
  expiresAt: string
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Convite criado. Como ainda não há envio de e-mail configurado, copie o link abaixo e
        entregue manualmente:
      </p>
      <CopyField value={activationLink} />
      <p className="text-xs text-slate-400">
        Expira em {new Date(expiresAt).toLocaleString('pt-BR')}
      </p>
    </div>
  )
}
