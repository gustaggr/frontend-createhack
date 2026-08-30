import type { QuestionDimension, ScoreBand, Trend } from './checkinApi'

export const DIMENSION_LABELS: Record<QuestionDimension, string> = {
  PHYSICAL: 'Físico',
  EMOTIONAL: 'Emocional',
  SPIRITUAL: 'Espiritual',
  MINISTRY: 'Ministerial',
  RELATIONAL: 'Relacional',
}

export const BAND_LABELS: Record<ScoreBand, string> = {
  STABLE: 'Estável',
  ATTENTION: 'Atenção',
  PRIORITY: 'Prioridade de cuidado',
}

export const BAND_COLORS: Record<ScoreBand, { bg: string; text: string; ring: string }> = {
  STABLE: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  ATTENTION: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  PRIORITY: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
}

/** Hex das mesmas cores de status usadas em BAND_COLORS, pra uso em gráficos SVG. */
export const BAND_HEX: Record<ScoreBand, string> = {
  STABLE: '#059669',
  ATTENTION: '#D97706',
  PRIORITY: '#DC2626',
}

export const TREND_LABELS: Record<Trend, string> = {
  IMPROVING: 'Melhorando',
  STABLE: 'Estável',
  WORSENING: 'Piorando',
}
