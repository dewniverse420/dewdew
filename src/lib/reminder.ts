import { getLocal, setLocal } from './storage'
import { getTodos, getContacts } from './store'

const REMINDER_ENABLED_KEY = 'reminder-enabled'
const REMINDER_SENT_KEY = 'reminder-sent'
const BIRTHDAY_SENT_KEY = 'reminder-birthday-sent'

/** 总开关：是否启用提醒 */
export function getReminderEnabled(): boolean {
  return getLocal<boolean>(REMINDER_ENABLED_KEY, false)
}

export function setReminderEnabled(on: boolean): void {
  setLocal(REMINDER_ENABLED_KEY, on)
}

/** 每条待办可选的提前时间（分钟），用于创建/编辑待办时的多选 */
export const REMINDER_PRESETS = [
  { value: 60, labelKey: 'reminder.before1h' },
  { value: 720, labelKey: 'reminder.before12h' },
  { value: 1440, labelKey: 'reminder.before1d' },
  { value: 4320, labelKey: 'reminder.before3d' },
  { value: 10080, labelKey: 'reminder.before1w' },
  { value: 20160, labelKey: 'reminder.before2w' },
] as const

function getSentMap(): Record<string, boolean> {
  return getLocal<Record<string, boolean>>(REMINDER_SENT_KEY, {})
}

function setSentMap(map: Record<string, boolean>): void {
  setLocal(REMINDER_SENT_KEY, map)
}

function sentKey(todoId: string, minutes: number, ddl: string): string {
  return `${todoId}:${minutes}:${ddl}`
}

/** 绝对地址图标（iOS 对相对路径 icon 支持差） */
function notificationIconUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const base = import.meta.env.BASE_URL || '/'
    return new URL('logo.png', `${window.location.origin}${base.endsWith('/') ? base : `${base}/`}`).href
  } catch {
    return undefined
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return Promise.resolve('denied')
  if (Notification.permission !== 'default') return Promise.resolve(Notification.permission)
  return Notification.requestPermission()
}

/**
 * 待办提醒：在「提前 N 分钟」的时间点之后、截止之前，任意时刻可补发一次。
 * 旧逻辑仅在提醒点后约 2 分钟内发送——在 iOS PWA / 后台挂起时定时器不跑，会整段错过；
 * 改为打开应用或回到前台时仍能收到未到期的提醒（每条提前量仍只提醒一次）。
 */
export function checkAndNotify(lang: 'zh' | 'en'): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  if (!getReminderEnabled()) return

  const todos = getTodos()
  const now = Date.now()
  const sent = getSentMap()
  let changed = false
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US'
  const iconUrl = notificationIconUrl()

  for (const todo of todos) {
    const ddl = todo.ddl?.trim()
    if (!ddl) continue
    const ddlTime = new Date(ddl).getTime()
    if (!Number.isFinite(ddlTime)) continue
    const minutesList = todo.reminderBeforeMinutes ?? []
    if (minutesList.length === 0) continue

    for (const minutes of minutesList) {
      if (minutes <= 0) continue
      const windowMs = minutes * 60 * 1000
      const windowStart = ddlTime - windowMs
      if (ddlTime <= now) {
        const key = sentKey(todo.id, minutes, ddl)
        if (sent[key]) {
          delete sent[key]
          changed = true
        }
        continue
      }
      if (now < windowStart) continue
      const key = sentKey(todo.id, minutes, ddl)
      if (sent[key]) continue

      const title = lang === 'zh' ? '计划提醒' : 'Plan reminder'
      const ddlFormatted = new Date(ddl).toLocaleString(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      const titlePart = todo.title?.trim() || (lang === 'zh' ? '无标题' : 'No title')
      const body = lang === 'zh' ? `${titlePart} · 截止 ${ddlFormatted}` : `${titlePart} · Due ${ddlFormatted}`
      try {
        const opts: NotificationOptions = { body, tag: `todo-${todo.id}-${minutes}-${ddl}` }
        if (iconUrl) opts.icon = iconUrl
        new Notification(title, opts)
        sent[key] = true
        changed = true
      } catch {
        try {
          new Notification(title, { body, tag: `todo-${todo.id}-${minutes}-${ddl}` })
          sent[key] = true
          changed = true
        } catch {
          // ignore
        }
      }
    }
  }

  if (changed) setSentMap(sent)
  checkBirthdayReminders(lang)
}

/** 生日提醒：默认提前一天和当天各提醒一次 */
function checkBirthdayReminders(lang: 'zh' | 'en'): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  if (!getReminderEnabled()) return

  const iconUrl = notificationIconUrl()
  const contacts = getContacts()
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  const year = today.getFullYear()
  const sent = getLocal<Record<string, boolean>>(BIRTHDAY_SENT_KEY, {})
  let changed = false

  for (const c of contacts) {
    const bd = c.birthday?.trim()
    if (!bd || bd.length < 5) continue
    const [, m, d] = bd.split('-').map(Number)
    if (!m || !d) continue
    const thisYearBday = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayBefore = new Date(year, m - 1, d - 1)
    const dayBeforeKey = dayBefore.toISOString().slice(0, 10)

    for (const { dateKey, offset } of [
      { dateKey: dayBeforeKey, offset: -1 },
      { dateKey: thisYearBday, offset: 0 },
    ]) {
      if (dateKey !== todayKey) continue
      const key = `${c.id}:${year}:${offset}`
      if (sent[key]) continue
      const title = lang === 'zh' ? '生日提醒' : 'Birthday reminder'
      const body = lang === 'zh' ? `${c.name} 的生日${offset === 0 ? '今天' : '明天'}到了` : `${c.name}'s birthday is ${offset === 0 ? 'today' : 'tomorrow'}`
      try {
        const opts: NotificationOptions = { body, tag: `birthday-${c.id}-${year}-${offset}` }
        if (iconUrl) opts.icon = iconUrl
        new Notification(title, opts)
        sent[key] = true
        changed = true
      } catch {
        try {
          new Notification(title, { body, tag: `birthday-${c.id}-${year}-${offset}` })
          sent[key] = true
          changed = true
        } catch {
          // ignore
        }
      }
    }
  }

  if (changed) setLocal(BIRTHDAY_SENT_KEY, sent)
}
