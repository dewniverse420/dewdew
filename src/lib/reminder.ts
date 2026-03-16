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
 * 检查待办 DDL：按每条待办的 reminderBeforeMinutes 在进入对应窗口且未发过时发送系统通知。
 * 仅当总开关开启且通知权限为 granted 时执行。
 */
export function checkAndNotify(lang: 'zh' | 'en'): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  if (!getReminderEnabled()) return

  const todos = getTodos()
  const now = Date.now()
  const sent = getSentMap()
  let changed = false

  for (const todo of todos) {
    const ddl = todo.ddl?.trim()
    if (!ddl) continue
    const ddlTime = new Date(ddl).getTime()
    const minutesList = todo.reminderBeforeMinutes ?? []
    if (minutesList.length === 0) continue

    for (const minutes of minutesList) {
      if (minutes <= 0) continue
      const windowMs = minutes * 60 * 1000
      const windowStart = ddlTime - windowMs
      if (ddlTime < now) {
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

      const title = lang === 'zh' ? '待办即将到期' : 'Todo due soon'
      const body = todo.title || (lang === 'zh' ? '无标题' : 'No title')
      try {
        new Notification(title, {
          body,
          icon: `${import.meta.env.BASE_URL}logo.png`,
          tag: `todo-${todo.id}-${minutes}-${ddl}`,
        })
        sent[key] = true
        changed = true
      } catch {
        // ignore
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
        new Notification(title, {
          body,
          icon: `${import.meta.env.BASE_URL}logo.png`,
          tag: `birthday-${c.id}-${year}-${offset}`,
        })
        sent[key] = true
        changed = true
      } catch {
        // ignore
      }
    }
  }

  if (changed) setLocal(BIRTHDAY_SENT_KEY, sent)
}
