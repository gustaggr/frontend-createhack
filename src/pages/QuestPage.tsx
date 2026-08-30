import { CheckCircle2, HeartHandshake, Phone } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  checkinApi,
  type QuestionOption,
  type SubmitResult,
  type TodayQuestion,
  type VerseOfTheDay,
} from '../lib/checkinApi'
import { BAND_COLORS, BAND_LABELS, DIMENSION_LABELS } from '../lib/checkinLabels'
import { ApiError } from '../lib/api'

type Phase = 'loading' | 'already-done' | 'quiz' | 'submitting' | 'critical' | 'result' | 'error'

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 py-8">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}

function OptionButton({
  option,
  selected,
  onSelect,
}: {
  option: QuestionOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
        selected
          ? 'border-brand-500 bg-brand-50'
          : 'border-slate-200 bg-white hover:border-brand-200'
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {option.label}
      </span>
      <span className="text-sm text-slate-700">{option.text}</span>
    </button>
  )
}

export default function QuestPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<TodayQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [verse, setVerse] = useState<VerseOfTheDay | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkinApi.getVerseOfTheDay().then(setVerse).catch(() => {})
    checkinApi
      .getToday()
      .then((today) => {
        if (today.status === 'COMPLETED') {
          setPhase('already-done')
        } else {
          setQuestions(today.questions)
          setPhase('quiz')
        }
      })
      .catch(() => setPhase('error'))
  }, [])

  // Perguntas condicionais (ex.: "como foi seu devocional") somem da lista
  // quando a resposta da pergunta da qual dependem for o gatilho de pular.
  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (q.dependsOnOrder == null) return true
      const dependency = questions.find((d) => d.order === q.dependsOnOrder)
      if (!dependency) return true
      return answers[dependency.id] !== q.skipWhenOption
    })
  }, [questions, answers])

  const currentQuestion = visibleQuestions[currentIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const isLastQuestion = currentIndex === visibleQuestions.length - 1
  const isOpenText = currentQuestion?.type === 'OPEN_TEXT'
  const canAdvance = isOpenText ? !!currentAnswer?.trim() : !!currentAnswer

  function selectOption(label: string) {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: label }))
  }

  function setTextAnswer(value: string) {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }

  async function handleNext() {
    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1)
      return
    }

    setPhase('submitting')
    setError(null)
    try {
      const payload = visibleQuestions.map((q) =>
        q.type === 'OPEN_TEXT'
          ? { questionId: q.id, textAnswer: answers[q.id] }
          : { questionId: q.id, selectedOption: answers[q.id] },
      )
      const submitResult = await checkinApi.submitAnswers(payload)
      setResult(submitResult)
      setPhase(submitResult.hasCriticalAlert ? 'critical' : 'result')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar suas respostas.')
      setPhase('quiz')
    }
  }

  if (phase === 'loading') {
    return (
      <Shell>
        <p className="text-center text-sm text-brand-700">Carregando seu quest de hoje…</p>
      </Shell>
    )
  }

  if (phase === 'error') {
    return (
      <Shell>
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-red-600">Não foi possível carregar o quest de hoje.</p>
          <Link to="/home" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Voltar
          </Link>
        </div>
      </Shell>
    )
  }

  if (phase === 'already-done') {
    return (
      <Shell>
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-brand-600" size={32} />
          <h1 className="mt-3 text-lg font-semibold text-slate-900">
            Você já respondeu o quest de hoje!
          </h1>
          <p className="mt-1 text-sm text-slate-500">Volte amanhã para continuar sua sequência.</p>
          <button
            onClick={() => navigate('/home')}
            className="mt-4 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Voltar para o início
          </button>
        </div>
      </Shell>
    )
  }

  if (phase === 'critical' && result) {
    return (
      <Shell>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-600">
            <HeartHandshake size={22} />
            <h1 className="text-lg font-bold">{result.criticalSupport?.title}</h1>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {result.criticalSupport?.message}
          </p>
          <div className="mt-5 space-y-2">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700">
              <Phone size={16} />
              Preciso conversar agora
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full rounded-xl bg-slate-100 py-3 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  if (phase === 'result' && result) {
    return (
      <Shell>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Seu score de hoje</p>
            <p className="text-5xl font-bold text-slate-900">{result.overallScore}</p>
            <p className={`mt-1 text-sm font-semibold ${BAND_COLORS[result.overallBand].text}`}>
              {BAND_LABELS[result.overallBand]}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {result.dimensions.map((d) => (
              <div
                key={d.dimension}
                className={`rounded-xl p-3 text-center ring-1 ${BAND_COLORS[d.band].bg} ${BAND_COLORS[d.band].ring}`}
              >
                <p className="text-xs text-slate-500">{DIMENSION_LABELS[d.dimension]}</p>
                <p className={`text-lg font-bold ${BAND_COLORS[d.band].text}`}>{d.value}</p>
              </div>
            ))}
          </div>

          {verse && (
            <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="italic">"{verse.text}"</p>
              <p className="mt-1 text-xs font-medium text-emerald-600">{verse.reference}</p>
            </div>
          )}

          <button
            onClick={() => navigate('/home')}
            className="mt-5 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Voltar para o início
          </button>
        </div>
      </Shell>
    )
  }

  if (!currentQuestion) return null

  return (
    <Shell>
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            Pergunta {currentIndex + 1} de {visibleQuestions.length}
          </span>
          {currentQuestion.dimension && <span>{DIMENSION_LABELS[currentQuestion.dimension]}</span>}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${((currentIndex + 1) / visibleQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">{currentQuestion.text}</h1>

        {isOpenText ? (
          <textarea
            value={currentAnswer ?? ''}
            onChange={(e) => setTextAnswer(e.target.value)}
            rows={5}
            placeholder="Escreva aqui..."
            className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        ) : (
          <div className="mt-4 space-y-2">
            {currentQuestion.options?.map((option) => (
              <OptionButton
                key={option.label}
                option={option}
                selected={currentAnswer === option.label}
                onSelect={() => selectOption(option.label)}
              />
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleNext}
          disabled={!canAdvance || phase === 'submitting'}
          className="mt-5 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {phase === 'submitting' ? 'Enviando…' : isLastQuestion ? 'Ver resultado' : 'Próxima'}
        </button>
      </div>
    </Shell>
  )
}
