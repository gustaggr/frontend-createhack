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
    <div className="mx-auto flex max-w-2xl flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* CTA do quest do dia */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F97316] via-[#EA580C] to-[#C2410C] p-6 text-white shadow-xl shadow-[#F97316]/20 border border-white/20 backdrop-blur-xl">
        <Sparkles className="absolute -right-6 -top-6 h-32 w-32 text-white/10 rotate-12" />
        <div className="relative z-10">
          {answeredToday ? (
            <>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-xl backdrop-blur-md">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
                <p className="text-xl font-black tracking-tight">Quest concluído!</p>
              </div>
              <p className="mt-2 text-sm text-white/90 font-medium">Volte amanhã para continuar sua sequência.</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black leading-tight tracking-tight">
                Já respondeu
                <br />o seu quest hoje?
              </p>
              <button
                onClick={() => navigate('/quest')}
                className="mt-5 rounded-full bg-white px-6 py-2.5 text-sm font-black text-[#F97316] shadow-lg hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Responder agora
              </button>
            </>
          )}

          <div className="mt-6 flex items-center justify-between bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Flame size={18} className="text-yellow-300" />
              {streak?.currentStreak ?? 0} dias seguidos
            </div>
            {streak && <WeekProgress last7Days={streak.last7Days} />}
          </div>
        </div>
      </div>

      {/* Score do dia */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-slate-800 tracking-tight ml-2">Score Diário</h2>
        {!answeredToday ? (
          <div className="rounded-3xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 text-center text-sm font-bold text-slate-400 shadow-sm">
            Responda o quest de hoje para ver seu score.
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className={`rounded-3xl p-5 shadow-lg ${BAND_COLORS[checkin.overallBand].bg} ${BAND_COLORS[checkin.overallBand].ring} border border-white/50 backdrop-blur-md relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl pointer-events-none" />
              <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-1">Geral</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{checkin.overallScore}</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/50 ${BAND_COLORS[checkin.overallBand].text}`}>
                  {BAND_LABELS[checkin.overallBand]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {checkin.dimensions.map((d) => (
                <div
                  key={d.dimension}
                  className={`rounded-2xl p-4 shadow-sm ${BAND_COLORS[d.band].bg} ${BAND_COLORS[d.band].ring} border border-white/50 backdrop-blur-sm transition-transform hover:-translate-y-0.5`}
                >
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">{DIMENSION_LABELS[d.dimension]}</p>
                  <p className={`text-2xl font-black tracking-tight ${BAND_COLORS[d.band].text}`}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Versículo do dia */}
      {verse && (
        <div className="rounded-3xl bg-gradient-to-br from-[#059669] to-[#047857] p-6 text-white shadow-lg shadow-emerald-900/10 relative overflow-hidden mb-6">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-emerald-100 mb-3">
            <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
              <BookOpen size={14} />
            </div>
            Versículo do dia
          </div>
          <p className="text-lg font-medium leading-relaxed text-white relative z-10">"{verse.text}"</p>
          <p className="mt-3 text-xs font-bold text-emerald-200 relative z-10">{verse.reference}</p>
        </div>
      )}
    </div>
  )
}
