import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  children,
  className = '',
}: {
  title?: string
  subtitle?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-6 ${className}`}>
      {children ? (
        children
      ) : (
        <>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </>
      )}
    </div>
  )
}
