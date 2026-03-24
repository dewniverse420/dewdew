import type { TodoItem, Subtask } from '../types'
import { isTodoCompleted } from './todoCompletion'

function toDateKeyLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayKeyLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getTodoDueTime(t: TodoItem): string {
  return t.ddl || t.createdAt
}

/**
 * 将本地日历上的「日」逐日 +1，直到本地日期 >= todayKeyLocal，保持同一本地时刻。
 * 用于未完成且已逾期的待办：自动续到「下一天同一时间」，多日未打开则连续顺延直到不早于今天。
 */
function advanceIsoUntilLocalDayNotBefore(iso: string, todayKey: string): string {
  let d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  let key = toDateKeyLocal(d.toISOString())
  while (key && key < todayKey) {
    d.setDate(d.getDate() + 1)
    key = toDateKeyLocal(d.toISOString())
  }
  return d.toISOString()
}

function rollSubtasks(subtasks: Subtask[] | undefined, todayKey: string): { subtasks: Subtask[] | undefined; changed: boolean } {
  if (!subtasks?.length) return { subtasks, changed: false }
  let changed = false
  const next = subtasks.map((s) => {
    if (s.completed || !s.ddl) return s
    const sk = toDateKeyLocal(s.ddl)
    if (!sk || sk >= todayKey) return s
    changed = true
    return { ...s, ddl: advanceIsoUntilLocalDayNotBefore(s.ddl, todayKey) }
  })
  return { subtasks: changed ? next : subtasks, changed }
}

function rollTodoRecursive(t: TodoItem, todayKey: string): { todo: TodoItem; changed: boolean } {
  if (isTodoCompleted(t)) return { todo: t, changed: false }

  let changed = false
  let ddl = t.ddl
  const dueKey = toDateKeyLocal(getTodoDueTime(t))
  if (dueKey && dueKey < todayKey) {
    ddl = advanceIsoUntilLocalDayNotBefore(t.ddl, todayKey)
    changed = true
  }

  const st = rollSubtasks(t.subtasks, todayKey)
  if (st.changed) {
    changed = true
  }

  let subEvents = t.subEvents
  if (t.subEvents?.length) {
    const mapped = t.subEvents.map((se) => rollTodoRecursive(se, todayKey))
    if (mapped.some((x) => x.changed)) {
      changed = true
      subEvents = mapped.map((x) => x.todo)
    }
  }

  if (!changed) return { todo: t, changed: false }
  return {
    todo: {
      ...t,
      ddl,
      subtasks: st.subtasks ?? t.subtasks,
      subEvents,
    },
    changed: true,
  }
}

/**
 * 未完成且截止日期（本地日）早于今天的待办：将 ddl（及未完成的子任务 ddl、嵌套子事件）顺延至「今天或之后」的同一本地时刻。
 */
export function applyOverdueTodoRollover(todos: TodoItem[]): { next: TodoItem[]; changed: boolean } {
  const todayKey = todayKeyLocal()
  let changed = false
  const next = todos.map((t) => {
    const r = rollTodoRecursive(t, todayKey)
    if (r.changed) changed = true
    return r.todo
  })
  return { next, changed }
}
