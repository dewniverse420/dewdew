import { getLocal, setLocal } from './storage'

const DAILY_COMPLETION_KEY = 'daily-completion'

export type DailyCompletionRecord = {
  done: number
  total: number
  percent: number
  updatedAt: string
}

export type DailyCompletionMap = Record<string, DailyCompletionRecord>

export function getDailyCompletionMap(): DailyCompletionMap {
  return getLocal<DailyCompletionMap>(DAILY_COMPLETION_KEY, {})
}

export function setDailyCompletion(dayKeyLocal: string, record: DailyCompletionRecord): void {
  const map = getDailyCompletionMap()
  map[dayKeyLocal] = record
  setLocal(DAILY_COMPLETION_KEY, map)
}

