import type { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'

export interface DashboardStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColorClass: string
  iconBgClass: string
  change?: string | number
  isPositive?: boolean
  progress?: number
  progressColorClass?: string
  footerText?: string
}

export function DashboardStatCard({
  title,
  value,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  change,
  isPositive,
  progress,
  progressColorClass = 'bg-slate-700',
  footerText,
}: DashboardStatCardProps) {
  return (
    <Card className="shadow-sm border border-slate-100 flex flex-col justify-between p-5">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-full ${iconBgClass} ${iconColorClass}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
              isPositive ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
            }`}
          >
            {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}
            {change}%
          </div>
        )}
      </div>

      <div>
        <p className="text-slate-700 text-[11px] font-semibold mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
      </div>

      {(progress !== undefined || footerText) && (
        <div className="mt-5">
          {progress !== undefined && (
            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${progress > 0 ? progressColorClass : 'bg-transparent'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {footerText && (
            <p className={`text-xs font-medium text-slate-400 ${progress !== undefined ? 'mt-3' : ''}`}>
              {footerText}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
