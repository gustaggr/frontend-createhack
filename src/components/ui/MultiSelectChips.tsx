import { Check } from 'lucide-react'

export interface MultiSelectOption {
  id: string
  label: string
}

export function MultiSelectChips({
  label,
  options,
  selectedIds,
  onChange,
  emptyHint,
}: {
  label?: string
  options: MultiSelectOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  emptyHint?: string
}) {
  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-300 divide-y divide-slate-100">
        {options.map((opt) => {
          const checked = selectedIds.includes(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className={checked ? 'font-medium text-slate-900' : 'text-slate-600'}>{opt.label}</span>
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                }`}
              >
                {checked && <Check size={12} />}
              </span>
            </button>
          )
        })}
        {options.length === 0 && (
          <p className="px-3 py-2 text-xs text-slate-400">{emptyHint ?? 'Nenhuma opção disponível.'}</p>
        )}
      </div>
    </div>
  )
}
