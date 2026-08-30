import { api } from './api'

export type QuestionDimension = 'PHYSICAL' | 'EMOTIONAL' | 'SPIRITUAL' | 'MINISTRY' | 'RELATIONAL'
export type QuestionType = 'SCORED_CHOICE' | 'UNSCORED_CHOICE' | 'OPEN_TEXT'
export type ScoreBand = 'STABLE' | 'ATTENTION' | 'PRIORITY'
export type Trend = 'IMPROVING' | 'STABLE' | 'WORSENING'

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface TodayQuestion {
  id: string
  order: number
  type: QuestionType
  dimension: QuestionDimension | null
  text: string
  options: QuestionOption[] | null
  dependsOnOrder: number | null
  skipWhenOption: string | null
}

export interface DimensionScoreResult {
  dimension: QuestionDimension
  value: number
  band: ScoreBand
}

export type TodayCheckin =
  | { status: 'PENDING'; questions: TodayQuestion[] }
  | {
      status: 'COMPLETED'
      overallScore: number
      overallBand: ScoreBand
      hasCriticalAlert: boolean
      dimensions: DimensionScoreResult[]
    }

export interface SubmitResult {
  overallScore: number
  overallBand: ScoreBand
  dimensions: DimensionScoreResult[]
  hasCriticalAlert: boolean
  criticalSupport: { title: string; message: string } | null
}

export interface StreakInfo {
  currentStreak: number
  last7Days: boolean[]
}

export interface VerseOfTheDay {
  reference: string
  text: string
}

export interface GroupCheckinStatus {
  missionaryId: string
  fullName: string
  answeredToday: boolean
  overallScore?: number
  overallBand?: ScoreBand
  hasCriticalAlert?: boolean
  dimensions?: DimensionScoreResult[]
  trend?: Trend
}

export interface CareEventRecord {
  id: string
  reason: string
  severity: 'ATTENTION' | 'CRITICAL'
  status: 'OPEN' | 'CLOSED'
  createdAt: string
  closedAt: string | null
  closingNote: string | null
}

export interface AnsweredQuestion {
  questionOrder: number
  questionText: string
  dimension: QuestionDimension | null
  selectedOption: 'A' | 'B' | 'C' | 'D' | null
  selectedOptionText: string | null
  textAnswer: string | null
}

export interface CheckinHistoryEntry {
  id: string
  checkinDate: string
  overallScore: number | null
  overallBand: ScoreBand | null
  hasCriticalAlert: boolean
  dimensions: DimensionScoreResult[]
  answers: AnsweredQuestion[]
}

export type DayStatus = 'ANSWERED' | 'MISSING' | 'CRITICAL'

export interface DayInRange {
  date: string
  status: DayStatus
}

export interface ProfileAverages {
  overallAvg: number | null
  dimensions: { dimension: QuestionDimension; avg: number }[]
}

export interface MissionaryProfile {
  missionary: { id: string; fullName: string; preferredName: string | null; email: string; phone: string | null }
  group: { id: string; name: string; leaderNames: string[] } | null
  range: { from: string; to: string }
  averages: ProfileAverages
  daysInRange: DayInRange[]
  blankDaysCount: number
  blankDates: string[]
  careEvents: CareEventRecord[]
  checkins: CheckinHistoryEntry[]
}

export interface OverviewTrendPoint {
  date: string
  avgScore: number | null
}

export interface OverviewAttentionItem {
  missionaryId: string
  institutionId: string
  fullName: string
  reason: string
  severity: 'ATTENTION' | 'CRITICAL'
}

export interface DashboardOverview {
  trend: OverviewTrendPoint[]
  todayAnsweredCount: number
  totalMissionaries: number
  bandDistributionToday: Record<ScoreBand, number>
  openCareEvents: number
  criticalOpenCareEvents: number
  needsAttention: OverviewAttentionItem[]
}

export const checkinApi = {
  getToday: () => api.get<TodayCheckin>('/checkins/today'),
  submitAnswers: (answers: { questionId: string; selectedOption?: string; textAnswer?: string }[]) =>
    api.post<SubmitResult>('/checkins/today/answers', { answers }),
  getStreak: () => api.get<StreakInfo>('/checkins/streak'),
  getVerseOfTheDay: () => api.get<VerseOfTheDay>('/verse-of-the-day'),
  getGroupCheckinsToday: (institutionId: string, groupId: string) =>
    api.get<GroupCheckinStatus[]>(
      `/institutions/${institutionId}/groups/${groupId}/checkins-today`,
    ),
  getMissionaryProfile: (
    institutionId: string,
    missionaryId: string,
    range?: { from?: string; to?: string },
  ) => {
    const params = new URLSearchParams()
    if (range?.from) params.set('from', range.from)
    if (range?.to) params.set('to', range.to)
    const qs = params.toString()
    return api.get<MissionaryProfile>(
      `/institutions/${institutionId}/missionaries/${missionaryId}/profile${qs ? `?${qs}` : ''}`,
    )
  },
  deleteCheckin: (institutionId: string, checkinId: string) =>
    api.delete<{ success: boolean }>(`/institutions/${institutionId}/checkins/${checkinId}`),
  getLeaderOverview: () => api.get<DashboardOverview>('/dashboard/leader-overview'),
  getInstitutionOverview: (institutionId: string) =>
    api.get<DashboardOverview>(`/institutions/${institutionId}/dashboard-overview`),
  getPlatformOverview: () => api.get<DashboardOverview>('/dashboard/platform-overview'),
}
