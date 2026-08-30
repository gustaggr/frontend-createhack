import { AlertTriangle, CalendarCheck, HeartPulse, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { checkinApi, type DashboardOverview, type ScoreBand } from '../../lib/checkinApi'
import { BAND_HEX, BAND_LABELS } from '../../lib/checkinLabels'

function formatDayLabel(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number | null }>
  label?: string
}) {
  if (!active || !payload?.length || payload[0].value == null) return null
  return (
    <div className="rounded-lg border border-brand-100 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-slate-500">Score médio: {payload[0].value}</p>
    </div>
  )
}

const BAND_ORDER: ScoreBand[] = ['STABLE', 'ATTENTION', 'PRIORITY']

export type OverviewScope =
  | { kind: 'leader' }
  | { kind: 'institution'; institutionId: string }
  | { kind: 'platform' }

function fetchByScope(scope: OverviewScope): Promise<DashboardOverview> {
  switch (scope.kind) {
    case 'leader':
      return checkinApi.getLeaderOverview()
    case 'institution':
      return checkinApi.getInstitutionOverview(scope.institutionId)
    case 'platform':
      return checkinApi.getPlatformOverview()
  }
}

export default function OverviewDashboard({
  title,
  subtitle,
  scope,
}: {
  title: string
  subtitle?: string
  scope: OverviewScope
}) {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    fetchByScope(scope)
      .then(setData)
      .catch(() => setError('Não foi possível carregar os dados agora.'))
  }, [scope.kind, scope.kind === 'institution' ? scope.institutionId : undefined])

  if (error) {
    return <p className="rounded-2xl border border-brand-100 bg-white p-6 text-sm text-red-600">{error}</p>
  }
  if (!data) return null

  const trendData = data.trend.map((t) => ({ label: formatDayLabel(t.date), avgScore: t.avgScore }))
  const bandTotal = BAND_ORDER.reduce((sum, b) => sum + data.bandDistributionToday[b], 0);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3 xl:gap-6">
        <div className="flex flex-col gap-4 sm:gap-5 xl:col-span-2 xl:gap-6">
          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Tendência de score (14 dias)</h2>
            <div className="mt-4 h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overviewTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EA580C" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#EA580C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#FED7AA', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#EA580C"
                    strokeWidth={2}
                    fill="url(#overviewTrendFill)"
                    connectNulls={false}
                    dot={false}
                    activeDot={{ r: 5, fill: '#EA580C', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <CalendarCheck size={20} />
              </div>
              <p className="mt-3 text-sm text-slate-500">Responderam hoje</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {data.todayAnsweredCount}
                <span className="text-sm font-normal text-slate-400"> / {data.totalMissionaries}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <HeartPulse size={20} />
              </div>
              <p className="mt-3 text-sm text-slate-500">Eventos de cuidado abertos</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {data.openCareEvents}
                {data.criticalOpenCareEvents > 0 && (
                  <span className="text-sm font-normal text-red-600"> · {data.criticalOpenCareEvents} crítico(s)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:gap-5 xl:gap-6">
          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Situação hoje</h2>
            {bandTotal === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Ninguém respondeu hoje ainda.</p>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={BAND_ORDER.map((b) => ({ band: b, value: data.bandDistributionToday[b] }))}
                        dataKey="value"
                        nameKey="band"
                        innerRadius="68%"
                        outerRadius="100%"
                        paddingAngle={3}
                        cornerRadius={6}
                        stroke="none"
                      >
                        {BAND_ORDER.map((b) => (
                          <Cell key={b} fill={BAND_HEX[b]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <dl className="w-full space-y-2">
                  {BAND_ORDER.map((b) => (
                    <div key={b} className="flex items-center justify-between text-sm">
                      <dt className="flex items-center gap-2 text-slate-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: BAND_HEX[b] }}
                          aria-hidden
                        />
                        {BAND_LABELS[b]}
                      </dt>
                      <dd className="font-semibold text-slate-900">{data.bandDistributionToday[b]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-slate-900">
              <AlertTriangle size={18} className="text-amber-600" />
              <h2 className="text-base font-semibold">Precisa de atenção</h2>
            </div>
            <div className="mt-3 space-y-2">
              {data.needsAttention.map((item) => (
                <Link
                  key={item.missionaryId}
                  to={`/admin/institutions/${item.institutionId}/missionaries/${item.missionaryId}`}
                  className="flex items-center justify-between rounded-xl px-2 py-2 text-sm hover:bg-brand-50"
                >
                  <span className="font-medium text-slate-800">{item.fullName}</span>
                  <span
                    className={`text-xs font-medium ${item.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'}`}
                  >
                    {item.reason}
                  </span>
                </Link>
              ))}
              {data.needsAttention.length === 0 && (
                <p className="py-3 text-center text-sm text-slate-400">Tudo tranquilo por aqui.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-brand-100 bg-white p-4 text-sm text-slate-500 shadow-sm">
            <Users size={16} className="text-brand-600" />
            {data.totalMissionaries} missionário(s) acompanhado(s)
          </div>
        </div>
      </div>
    </div>
  )
}
