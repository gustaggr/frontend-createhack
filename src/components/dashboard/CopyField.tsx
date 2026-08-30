import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponível — o valor continua selecionável manualmente
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full truncate bg-transparent text-xs text-slate-700 outline-none"
      />
      <button
        onClick={handleCopy}
        type="button"
        className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
