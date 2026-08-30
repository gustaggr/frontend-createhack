import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface ModalProps {
  /** Controla exibição explícita; quando omitido, o modal assume que já deve estar aberto ao ser montado (uso via render condicional `{cond && <Modal ...>}`). */
  isOpen?: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ isOpen = true, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  const [rendered, setRendered] = useState(isOpen)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setRendered(true)
      const id = requestAnimationFrame(() => setVisible(true))
      document.body.style.overflow = 'hidden'
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    document.body.style.overflow = 'unset'
    const timeout = setTimeout(() => setRendered(false), 150)
    return () => clearTimeout(timeout)
  }, [isOpen])

  useEffect(() => () => {
    document.body.style.overflow = 'unset'
  }, [])

  if (!rendered || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-stretch sm:items-center justify-center sm:p-6">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-150 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`relative w-full h-full sm:h-auto ${maxWidth} bg-white sm:rounded-3xl shadow-2xl overflow-visible flex flex-col sm:max-h-[90vh] transition-all duration-150 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sm:rounded-t-3xl shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 custom-scrollbar sm:rounded-b-3xl overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
