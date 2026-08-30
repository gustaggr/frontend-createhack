import { BookOpen, CheckCircle2, Flame, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkinApi, type StreakInfo, type TodayCheckin, type VerseOfTheDay } from '../lib/checkinApi'
import { BAND_COLORS, BAND_LABELS, DIMENSION_LABELS } from '../lib/checkinLabels'

const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function WeekProgress({ last7Days }: { last7Days: boolean[] }) {
  const todayWeekday = new Date().getDay()
  return (
    <div className="flex items-center gap-1.5">
      {last7Days.map((answered, i) => {
        const weekday = (todayWeekday - (6 - i) + 7) % 7
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-white/70">{WEEKDAY_LETTERS[weekday]}</span>
            <div
              className={`h-2 w-2 rounded-full ${answered ? 'bg-white' : 'bg-white/30'}`}
              aria-label={answered ? 'Respondido' : 'Não respondido'}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function MissionaryHome() {
  const navigate = useNavigate()
  const [checkin, setCheckin] = useState<TodayCheckin | null>(null)
  const [streak, setStreak] = useState<StreakInfo | null>(null)
  const [verse, setVerse] = useState<VerseOfTheDay | null>(null)

  useEffect(() => {
    checkinApi.getToday().then(setCheckin).catch(() => {})
    checkinApi.getStreak().then(setStreak).catch(() => {})
    checkinApi.getVerseOfTheDay().then(setVerse).catch(() => {})
  }, [])

  const answeredToday = checkin?.status === 'COMPLETED'

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* CTA do quest do dia */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 p-6 text-white shadow-lg shadow-brand-200">
        <Sparkles className="absolute -right-4 -top-4 h-28 w-28 text-white/10" />
        {answeredToday ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={22} />
              <p className="text-lg font-bold">Quest de hoje concluído!</p>
            </div>
            <p className="mt-1 text-sm text-white/85">Volte amanhã para continuar sua sequência.</p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold leading-snug">
              Já respondeu
              <br />o seu quest do dia?
            </p>
            <button
              onClick={() => navigate('/quest')}
              className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Responda agora
            </button>
          </>
        )}

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-medium text-white/90">
            <Flame size={16} />
            {streak?.currentStreak ?? 0} dia(s) seguidos
          </div>
          {streak && <WeekProgress last7Days={streak.last7Days} />}
        </div>
      </div>

      {/* Score do dia */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Score diário</h2>
        {!answeredToday ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-slate-400">
            Responda o quest de hoje para ver seu score.
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className={`rounded-2xl p-5 shadow-sm ring-1 ${BAND_COLORS[checkin.overallBand].bg} ${BAND_COLORS[checkin.overallBand].ring}`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Geral</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">{checkin.overallScore}</span>
                <span className={`text-sm font-semibold ${BAND_COLORS[checkin.overallBand].text}`}>
                  {BAND_LABELS[checkin.overallBand]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {checkin.dimensions.map((d) => (
                <div
                  key={d.dimension}
                  className={`rounded-xl p-3 ring-1 ${BAND_COLORS[d.band].bg} ${BAND_COLORS[d.band].ring}`}
                >
                  <p className="text-xs text-slate-500">{DIMENSION_LABELS[d.dimension]}</p>
                  <p className={`text-xl font-bold ${BAND_COLORS[d.band].text}`}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Versículo do dia */}
      {verse && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <BookOpen size={14} />
            Versículo do dia
          </div>
          <p className="mt-3 text-base font-medium leading-snug">{verse.text}</p>
          <p className="mt-2 text-sm text-white/80">{verse.reference}</p>
        </div>
      )}
    </div>
  )
}
