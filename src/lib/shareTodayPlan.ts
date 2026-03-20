import type { HabitItem, HabitReminder, TodoItem } from '../types'
import { isTodoCompleted } from './todoCompletion'

function habitOccKey(dayKeyLocal: string, reminder: HabitReminder): string {
  return `${dayKeyLocal}|${reminder.id}|${reminder.time}`
}

/** 与计划页一致的「今日」本地日筛选 */
function toDateKeyLocal(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getTodoTime(t: TodoItem): string {
  return t.ddl || t.createdAt
}

export function buildTodayPlanShareText(params: {
  dayKeyLocal: string
  todos: TodoItem[]
  habits: HabitItem[]
  lang: 'zh' | 'en'
  locale: string
}): string {
  const { dayKeyLocal, todos, habits, lang, locale } = params
  const dayLabel = new Date(dayKeyLocal + 'T12:00:00').toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: lang === 'zh' ? 'long' : 'short',
  })

  const todayTodos = todos.filter((t) => toDateKeyLocal(getTodoTime(t)) === dayKeyLocal)
  const done = todayTodos.filter((t) => isTodoCompleted(t)).length
  const total = todayTodos.length
  const percent = total ? Math.round((done / total) * 100) : 0

  const lines: string[] = []
  if (lang === 'zh') {
    lines.push(`【今日计划】${dayLabel}`)
    lines.push(`进度：${done}/${total}（${percent}%）`)
    lines.push('')
  } else {
    lines.push(`[Today's plan] ${dayLabel}`)
    lines.push(`Progress: ${done}/${total} (${percent}%)`)
    lines.push('')
  }

  if (todayTodos.length === 0 && habits.length === 0) {
    return lines.join('\n').trimEnd()
  }

  if (todayTodos.length > 0) {
    lines.push(lang === 'zh' ? '── 计划 ──' : '── Tasks ──')
    todayTodos.forEach((t) => {
      const mark = isTodoCompleted(t) ? '☑' : '☐'
      const timeStr = t.ddl
        ? new Date(t.ddl).toLocaleString(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : ''
      const title = (t.title || (lang === 'zh' ? '（无标题）' : '(No title)')).trim()
      lines.push(timeStr ? `${mark} ${title} · ${timeStr}` : `${mark} ${title}`)
    })
    lines.push('')
  }

  const occs = getHabitOccurrencesForShare(habits, dayKeyLocal)
  if (occs.length > 0) {
    lines.push(lang === 'zh' ? '── 习惯 ──' : '── Habits ──')
    occs.forEach(({ habit, reminder, timeIso }) => {
      const checked = Boolean(habit.checks?.[habitOccKey(dayKeyLocal, reminder)])
      const mark = checked ? '☑' : '☐'
      const timeStr = new Date(timeIso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      lines.push(`${mark} ${habit.title} · ${timeStr}`)
    })
  }

  lines.push('')
  lines.push(lang === 'zh' ? '— 来自 Dewdew —' : '— From Dewdew —')
  return lines.join('\n').trimEnd()
}

function getLocalWeekdayFromDayKey(dayKeyLocal: string): number {
  const d = new Date(dayKeyLocal + 'T12:00:00')
  const js = d.getDay()
  return js === 0 ? 7 : js
}

function parseTimeHM(time: string): { h: number; m: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time)
  if (!m) return null
  const h = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(mm) || h < 0 || h > 23 || mm < 0 || mm > 59) return null
  return { h, m: mm }
}

function getHabitOccurrencesForShare(habits: HabitItem[], dayKeyLocal: string) {
  const weekday = getLocalWeekdayFromDayKey(dayKeyLocal)
  const [y, mo, da] = dayKeyLocal.split('-').map((x) => Number(x))
  if (!y || !mo || !da) return []
  const out: { habit: HabitItem; reminder: HabitReminder; timeIso: string }[] = []
  habits.forEach((habit) => {
    ;(habit.reminders ?? []).forEach((r) => {
      const hm = parseTimeHM(r.time)
      if (!hm) return
      const match =
        r.repeat === 'everyday' ? true : r.repeat === 'weekly' ? (r.weekdays ?? []).includes(weekday) : false
      if (!match) return
      const d = new Date(y, mo - 1, da, hm.h, hm.m, 0, 0)
      out.push({ habit, reminder: r, timeIso: d.toISOString() })
    })
  })
  return out.sort((a, b) => new Date(a.timeIso).getTime() - new Date(b.timeIso).getTime())
}

export async function shareOrCopyTodayPlan(text: string, title: string): Promise<'shared' | 'copied' | 'empty' | 'cancelled'> {
  const trimmed = text.trim()
  if (!trimmed) return 'empty'

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: trimmed })
      return 'shared'
    } catch (e: unknown) {
      const err = e as { name?: string }
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(trimmed)
      return 'copied'
    }
  } catch {
    // fall through
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = trimmed
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return 'copied'
  } catch {
    return 'empty'
  }
}
