import {
  AlertTriangle,
  CalendarX,
  ChevronDown,
  ChevronUp,
  Mail,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { checkinApi, type CheckinHistoryEntry, type MissionaryProfile } from '../../lib/checkinApi'
import { BAND_COLORS, BAND_LABELS, DIMENSION_LABELS } from '../../lib/checkinLabels'
import { ApiError } from '../../lib/api'

const PRESETS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
] as const

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - (days - 1))
  return d.toISOString().slice(0, 10)
}

function formatDayLabel(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}

function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)
  const activePreset = PRESETS.find((p) => from === isoDaysAgo(p.days) && to === isoToday())

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
      {PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => onChange(isoDaysAgo(p.days), isoToday())}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activePreset?.label === p.label
              ? 'bg-brand-600 text-white'
              : 'bg-brand-50 text-slate-600 hover:bg-brand-100'
          }`}
        >
          {p.label}
        </button>
      ))}

      <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
        <input
          type="date"
          value={customFrom}
          max={customTo}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600"
        />
        <span className="text-slate-400">até</span>
        <input
          type="date"
          value={customTo}
          min={customFrom}
          max={isoToday()}
          onChange={(e) => setCustomTo(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600"
        />
        <button
          onClick={() => onChange(customFrom, customTo)}
          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
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
      <p className="text-slate-500">Score: {payload[0].value}</p>
    </div>
  )
}

function CheckinCard({
  checkin,
  defaultOpen,
  institutionId,
  onDeleted,
}: {
  checkin: CheckinHistoryEntry
  defaultOpen?: boolean
  institutionId: string
  onDeleted: (checkinId: string) => void
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const date = new Date(checkin.checkinDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  async function handleConfirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await checkinApi.deleteCheckin(institutionId, checkin.id)
      onDeleted(checkin.id)
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Não foi possível apagar o check-in.')
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 p-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className="text-sm font-medium text-slate-900">{date}</span>
          {checkin.hasCriticalAlert && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-200">
              <AlertTriangle size={12} />
              Alerta
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {checkin.overallBand && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${BAND_COLORS[checkin.overallBand].bg} ${BAND_COLORS[checkin.overallBand].text} ${BAND_COLORS[checkin.overallBand].ring}`}
            >
              {checkin.overallScore} · {BAND_LABELS[checkin.overallBand]}
            </span>
          )}

          {confirming ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Apagar?</span>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? '...' : 'Sim'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              title="Apagar check-in (a pessoa terá que refazer)"
              aria-label="Apagar check-in"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          )}

          <button onClick={() => setOpen((v) => !v)} aria-label={open ? 'Recolher' : 'Expandir'}>
            {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>
        </div>
      </div>

      {deleteError && <p className="px-4 pb-2 text-xs text-red-600">{deleteError}</p>}

      {open && (
        <div className="border-t border-brand-50 p-4">
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {checkin.dimensions.map((d) => (
              <div
                key={d.dimension}
                className={`rounded-xl p-2 text-center ring-1 ${BAND_COLORS[d.band].bg} ${BAND_COLORS[d.band].ring}`}
              >
                <p className="text-[11px] text-slate-500">{DIMENSION_LABELS[d.dimension]}</p>
                <p className={`text-base font-bold ${BAND_COLORS[d.band].text}`}>{d.value}</p>
              </div>
            ))}
          </div>

          <ol className="space-y-3">
            {checkin.answers
              .sort((a, b) => a.questionOrder - b.questionOrder)
              .map((a) => (
                <li key={a.questionOrder} className="text-sm">
                  <p className="text-slate-500">
                    {a.questionOrder}. {a.questionText}
                  </p>
                  <p className="mt-0.5 font-medium text-slate-900">
                    {a.selectedOption
                      ? `${a.selectedOption}) ${a.selectedOptionText}`
                      : a.textAnswer}
                  </p>
                </li>
              ))}
          </ol>
        </div>
      )}
    </div>
  )
}

export default function MissionaryProfilePage() {
  const { institutionId, missionaryId } = useParams<{ institutionId: string; missionaryId: string }>()
  const [range, setRange] = useState(() => ({ from: isoDaysAgo(30), to: isoToday() }))
  const [profile, setProfile] = useState<MissionaryProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAllBlankDates, setShowAllBlankDates] = useState(false)

  useEffect(() => {
    if (!institutionId || !missionaryId) return
    setError(null)
    checkinApi
      .getMissionaryProfile(institutionId, missionaryId, range)
      .then(setProfile)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o perfil.'),
      )
  }, [institutionId, missionaryId, range])

  if (!institutionId || !missionaryId) return null

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <Link to="/home" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Voltar
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) return null

  const scoreByDate = new Map(profile.checkins.map((c) => [c.checkinDate.slice(0, 10), c.overallScore]))
  const trendData = profile.daysInRange.map((d) => ({
    label: formatDayLabel(d.date),
    score: scoreByDate.get(d.date) ?? null,
  }))

  const blankDatesToShow = showAllBlankDates ? profile.blankDates : profile.blankDates.slice(0, 10)
  const missingRate =
    profile.daysInRange.length > 0
      ? Math.round((profile.blankDaysCount / profile.daysInRange.length) * 100)
      : 0

  return (
    <DashboardLayout>
      <div className="mb-5 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{profile.missionary.fullName}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Mail size={14} />
            {profile.missionary.email}
          </span>
          {profile.group && (
            <span className="inline-flex items-center gap-1.5">
              <UsersRound size={14} />
              {profile.group.name} · líder {profile.group.leaderName}
            </span>
          )}
        </div>
      </div>

      <div className="mb-5">
        <DateRangeFilter from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Score médio</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{profile.averages.overallAvg ?? '—'}</p>
        </div>
        {profile.averages.dimensions.map((d) => (
          <div key={d.dimension} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{DIMENSION_LABELS[d.dimension]}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{d.avg}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm lg:col-span-2 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Score no período</h2>
          <div className="mt-4 h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="profileTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EA580C" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#FED7AA', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#EA580C"
                  strokeWidth={2}
                  fill="url(#profileTrendFill)"
                  connectNulls={false}
                  dot={false}
                  activeDot={{ r: 4, fill: '#EA580C', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center gap-2 text-slate-900">
            <CalendarX size={18} className="text-amber-600" />
            <h2 className="text-base font-semibold">Dias sem check-in</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            <span className="text-lg font-bold text-slate-900">{profile.blankDaysCount}</span> de{' '}
            {profile.daysInRange.length} dias ({missingRate}%)
          </p>
          {profile.blankDates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {blankDatesToShow.map((d) => (
                <span key={d} className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  {formatDayLabel(d)}
                </span>
              ))}
              {profile.blankDates.length > 10 && !showAllBlankDates && (
                <button
                  onClick={() => setShowAllBlankDates(true)}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  +{profile.blankDates.length - 10} mais
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {profile.careEvents.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Eventos de cuidado</h2>
          <div className="space-y-2">
            {profile.careEvents.map((ce) => (
              <div key={ce.id} className="rounded-xl border border-brand-100 bg-white p-3 text-sm shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      ce.severity === 'CRITICAL' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {ce.severity === 'CRITICAL' ? 'Crítico' : 'Atenção'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(ce.createdAt).toLocaleString('pt-BR')}
                  </span>
                  <span className={ce.status === 'OPEN' ? 'text-amber-600' : 'text-slate-400'}>
                    {ce.status === 'OPEN' ? 'Aberto' : 'Encerrado'}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">{ce.reason}</p>
                {ce.closingNote && <p className="mt-1 text-xs text-slate-400">Nota: {ce.closingNote}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-base font-semibold text-slate-900">Histórico de check-ins</h2>
      <div className="space-y-3">
        {profile.checkins.map((c, i) => (
          <CheckinCard
            key={c.id}
            checkin={c}
            defaultOpen={i === 0}
            institutionId={institutionId}
            onDeleted={(checkinId) =>
              setProfile((prev) =>
                prev ? { ...prev, checkins: prev.checkins.filter((x) => x.id !== checkinId) } : prev,
              )
            }
          />
        ))}
        {profile.checkins.length === 0 && (
          <p className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-slate-400">
            Nenhum check-in neste período.
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
