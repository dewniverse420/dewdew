import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getTodos, setTodos, getAllTags, getGoals, getContacts } from '../lib/store'
import { getSubtaskProgress, isTodoCompleted } from '../lib/todoCompletion'
import ReflectionModal from '../components/ReflectionModal'
import type { TodoItem, Goal, Contact } from '../types'
import './TodosView.css'

type DisplayMode = 'today' | 'tags' | 'timeline' | 'goals'
type TimelineSubMode = 'axis' | 'calendar'
type CalendarLevel = 'month' | 'week' | 'day'

function formatDay(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatMonthShort(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

function getTodoTime(t: TodoItem): string {
  return t.ddl || t.createdAt
}

/** 待办紧迫度 0–1：越接近 DDL 越高，已过 DDL 为 1 */
function getTodoUrgency(t: TodoItem): number {
  const now = Date.now()
  const ddlTime = new Date(t.ddl || t.createdAt).getTime()
  if (ddlTime <= now) return 1
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return Math.max(0, 1 - (ddlTime - now) / sevenDaysMs)
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10)
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 本地日期 YYYY-MM-DD，用于「今日待办」等按本地日筛选 */
function todayKeyLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toDateKeyLocal(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 周一为 0，周日为 6 */
function getDayOfWeek(iso: string): number {
  const d = new Date(iso)
  return (d.getDay() + 6) % 7
}

function getMonthDays(year: number, month: number): (string | null)[] {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const daysInMonth = last.getDate()
  const startPad = getDayOfWeek(first.toISOString().slice(0, 10))
  const result: (string | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    result.push(
      new Date(year, month - 1, d).toISOString().slice(0, 10)
    )
  }
  return result
}

/** 某天所在周的周一 */
function getWeekStart(iso: string): string {
  const d = new Date(iso)
  const day = getDayOfWeek(iso)
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

function getWeekDates(weekStart: string): string[] {
  const result: string[] = []
  const d = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    result.push(new Date(d).toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return result
}

/** 某日（YYYY-MM-DD）生日的联系人：按生日月-日匹配 */
function getBirthdaysOnDay(dayKey: string, contacts: Contact[]): Contact[] {
  const md = dayKey.slice(5)
  return contacts.filter((c) => c.birthday && c.birthday.slice(5) === md)
}

function goalDisplayLabel(g: Goal, t: (k: string) => string, lang: string): string {
  if (g.type === 'year' && g.year) return `${g.title}（${g.year}${lang === 'zh' ? t('createGoal.yearSuffix') : ''}）`
  if (g.type === 'month' && g.year != null && g.month != null) {
    if (lang === 'zh') return `${g.title}（${g.year}${t('createGoal.yearSuffix')}${g.month}${t('createGoal.monthSuffix')}）`
    return `${g.title} (${g.month}/${g.year})`
  }
  return g.title
}

function TodoItemRow({
  todo,
  onToggleComplete,
  onToggleSubtask,
  children,
}: {
  todo: TodoItem
  onToggleComplete: (todo: TodoItem, completed: boolean) => void
  onToggleSubtask?: (todo: TodoItem, subtaskId: string, completed: boolean) => void
  children: React.ReactNode
}) {
  const { t, lang } = useI18n()
  const locale = lang === 'zh' ? 'zh-CN' : 'en'
  const completed = isTodoCompleted(todo)
  const progress = getSubtaskProgress(todo.subtasks)
  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0
  const urgency = getTodoUrgency(todo)
  return (
    <div className="todos-item-block">
      <div
        className={`todos-item-wrap ${completed ? 'todos-item--completed' : ''}`}
        style={{ ['--card-urgency' as string]: String(urgency) }}
      >
        {children}
        <span className="todos-item-right" onClick={(e) => e.preventDefault()}>
          {hasSubtasks ? (
            <span className="todos-item-percent">{progress.done}/{progress.total} {progress.percent}%</span>
          ) : (
            <button
              type="button"
              className="todos-item-check"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleComplete(todo, !todo.completed)
              }}
              aria-label={todo.completed ? t('todo.markIncomplete') : t('todo.markComplete')}
            >
              {todo.completed ? '✓' : '○'}
            </button>
          )}
        </span>
      </div>
      {hasSubtasks && todo.subtasks && (
        <ul className="todos-sublist" aria-label={t('createTodo.field.subtasks')}>
          {todo.subtasks.map((s) => (
            <li key={s.id} className={`todos-subitem ${s.completed ? 'todos-subitem--done' : ''}`}>
              <span className="todos-subitem-title">{s.title}</span>
              {s.ddl && <span className="todos-subitem-ddl">{new Date(s.ddl).toLocaleString(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
              <button
                type="button"
                className="todos-subitem-check"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleSubtask?.(todo, s.id, !s.completed)
                }}
                aria-label={s.completed ? t('todo.markIncomplete') : t('todo.markComplete')}
              >
                {s.completed ? '✓' : '○'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function TodosView() {
  const { t, lang } = useI18n()
  const locale = lang === 'zh' ? 'zh-CN' : 'en'
  const weekdayLabels = useMemo(
    () => [t('todos.weekday.1'), t('todos.weekday.2'), t('todos.weekday.3'), t('todos.weekday.4'), t('todos.weekday.5'), t('todos.weekday.6'), t('todos.weekday.7')],
    [t]
  )
  const [displayMode, setDisplayMode] = useState<DisplayMode>('today')
  const [timelineSubMode, setTimelineSubMode] = useState<TimelineSubMode>('axis')
  const [calendarViewLevel, setCalendarViewLevel] = useState<CalendarLevel>('month')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [calendarDate, setCalendarDate] = useState<string>(() => todayKey())
  const [hideCompleted, setHideCompleted] = useState(false)
  const [reflectionTodoId, setReflectionTodoId] = useState<string | null>(null)
  const [storeRevision, setStoreRevision] = useState(0)
  const todos = useMemo(() => getTodos(), [storeRevision])
  const goals = useMemo(() => getGoals(), [storeRevision])
  const contacts = useMemo(() => getContacts(), [storeRevision])
  const visibleTodos = hideCompleted ? todos.filter((t) => !isTodoCompleted(t)) : todos
  const allTags = useMemo(() => getAllTags(todos), [todos])

  const updateTodos = (fn: (prev: TodoItem[]) => TodoItem[]) => {
    const next = fn(getTodos())
    setTodos(next)
    setStoreRevision((r) => r + 1)
  }

  const handleToggleComplete = (todo: TodoItem, completed: boolean) => {
    if (completed) {
      setReflectionTodoId(todo.id)
    } else {
      updateTodos((list) =>
        list.map((item) => (item.id === todo.id ? { ...item, completed: false, completionReflection: undefined } : item))
      )
    }
  }

  const handleSaveReflection = (text: string) => {
    if (!reflectionTodoId) return
    updateTodos((list) =>
      list.map((item) => (item.id === reflectionTodoId ? { ...item, completed: true, completionReflection: text } : item))
    )
    setReflectionTodoId(null)
  }

  const handleToggleSubtask = (todo: TodoItem, subtaskId: string, completed: boolean) => {
    if (!todo.subtasks) return
    const next = todo.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed } : s))
    const allDone = next.length > 0 && next.every((s) => s.completed)
    updateTodos((list) => list.map((item) => (item.id === todo.id ? { ...item, subtasks: next } : item)))
    if (allDone) setReflectionTodoId(todo.id)
  }

  const goalsByType = useMemo(() => {
    const major: Goal[] = []
    const year: Goal[] = []
    const month: Goal[] = []
    const custom: Goal[] = []
    goals.forEach((g) => {
      if (g.type === 'major') major.push(g)
      else if (g.type === 'year') year.push(g)
      else if (g.type === 'month') month.push(g)
      else custom.push(g)
    })
    return { major, year, month, custom }
  }, [goals])

  const todosByGoalId = useMemo(() => {
    const map = new Map<string, TodoItem[]>()
    visibleTodos.forEach((item) => {
      const id = item.goalId ?? '__none__'
      if (!map.has(id)) map.set(id, [])
      map.get(id)!.push(item)
    })
    return map
  }, [visibleTodos])
  const ungroupedTodos = useMemo(() => (todosByGoalId.get('__none__') ?? []).sort((a, b) => new Date(getTodoTime(a)).getTime() - new Date(getTodoTime(b)).getTime()), [todosByGoalId])

  const filtered = selectedTag
    ? visibleTodos.filter((item) => item.tags.includes(selectedTag))
    : visibleTodos

  const sortedByTime = useMemo(
    () => [...filtered].sort((a, b) => new Date(getTodoTime(a)).getTime() - new Date(getTodoTime(b)).getTime()),
    [filtered]
  )

  const todayKeyLocalStr = todayKeyLocal()
  const todayTodos = useMemo(
    () =>
      [...visibleTodos]
        .filter((t) => toDateKeyLocal(getTodoTime(t)) === todayKeyLocalStr)
        .sort((a, b) => new Date(getTodoTime(a)).getTime() - new Date(getTodoTime(b)).getTime()),
    [visibleTodos, todayKeyLocalStr]
  )
  const todayCompleted = useMemo(() => todayTodos.filter((t) => isTodoCompleted(t)).length, [todayTodos])
  const todayTotal = todayTodos.length
  const todayPercent = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0

  const byDay = useMemo(() => {
    const map = new Map<string, TodoItem[]>()
    sortedByTime.forEach((t) => {
      const day = toDateKey(getTodoTime(t))
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(t)
    })
    return map
  }, [sortedByTime])
  const dayKeys = useMemo(() => Array.from(byDay.keys()).sort(), [byDay])

  const calendarTodos = useMemo(() => {
    return sortedByTime.filter((t) => toDateKey(getTodoTime(t)) === calendarDate)
  }, [sortedByTime, calendarDate])

  const [year, month] = useMemo(() => {
    const d = new Date(calendarDate)
    return [d.getFullYear(), d.getMonth() + 1]
  }, [calendarDate])

  const monthDays = useMemo(() => getMonthDays(year, month), [year, month])
  const maxMonthTodos = useMemo(() => {
    const dayKeys = monthDays.filter((d): d is string => d !== null)
    if (dayKeys.length === 0) return 1
    return Math.max(
      1,
      ...dayKeys.map((d) => (byDay.get(d)?.length ?? 0) + getBirthdaysOnDay(d, contacts).length)
    )
  }, [monthDays, byDay, contacts])
  const weekStart = useMemo(() => getWeekStart(calendarDate), [calendarDate])
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])

  const calendarPrevDay = () => {
    const d = new Date(calendarDate)
    d.setDate(d.getDate() - 1)
    setCalendarDate(d.toISOString().slice(0, 10))
  }
  const calendarNextDay = () => {
    const d = new Date(calendarDate)
    d.setDate(d.getDate() + 1)
    setCalendarDate(d.toISOString().slice(0, 10))
  }
  const calendarPrevMonth = () => {
    const d = new Date(calendarDate)
    d.setMonth(d.getMonth() - 1)
    setCalendarDate(d.toISOString().slice(0, 10))
  }
  const calendarNextMonth = () => {
    const d = new Date(calendarDate)
    d.setMonth(d.getMonth() + 1)
    setCalendarDate(d.toISOString().slice(0, 10))
  }
  const calendarPrevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setCalendarDate(d.toISOString().slice(0, 10))
  }
  const calendarNextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setCalendarDate(d.toISOString().slice(0, 10))
  }
  const calendarToToday = () => setCalendarDate(todayKey())

  const goToDay = (dayKey: string) => {
    setCalendarDate(dayKey)
    setCalendarViewLevel('day')
  }
  const goToWeek = () => {
    setCalendarViewLevel('week')
  }
  const goToMonth = () => {
    setCalendarViewLevel('month')
  }

  const HOUR_START = 6
  const HOUR_END = 24
  const SLOT_HEIGHT = 44

  function getEventTop(iso: string): number {
    const d = new Date(iso)
    const hours = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
    if (hours < HOUR_START) return 0
    if (hours >= HOUR_END) return (HOUR_END - HOUR_START) * SLOT_HEIGHT - SLOT_HEIGHT
    return (hours - HOUR_START) * SLOT_HEIGHT
  }

  const isToday = calendarDate === todayKey()

  const reflectionTodo = reflectionTodoId ? todos.find((item) => item.id === reflectionTodoId) : null

  return (
    <section className="page todos-page">
      <h2 className="page-heading">{t('todos.heading')}</h2>
      <label className="todos-hide-completed">
        <input
          type="checkbox"
          checked={hideCompleted}
          onChange={(e) => setHideCompleted(e.target.checked)}
        />
        <span>{t('todo.hideCompleted')}</span>
      </label>
      <div className="todos-mode-toggle">
        <button
          type="button"
          className={displayMode === 'today' ? 'active' : ''}
          onClick={() => setDisplayMode('today')}
        >
          {t('todos.byToday')}
        </button>
        <button
          type="button"
          className={displayMode === 'tags' ? 'active' : ''}
          onClick={() => setDisplayMode('tags')}
        >
          {t('todos.byTags')}
        </button>
        <button
          type="button"
          className={displayMode === 'timeline' ? 'active' : ''}
          onClick={() => setDisplayMode('timeline')}
        >
          {t('todos.byTimeline')}
        </button>
        <button
          type="button"
          className={displayMode === 'goals' ? 'active' : ''}
          onClick={() => setDisplayMode('goals')}
        >
          {t('todos.byGoals')}
        </button>
      </div>

      {displayMode === 'today' && (
        <div className="todos-today-wrap">
          <div className="todos-today-progress">
            <div className="todos-today-progress-bar" role="progressbar" aria-valuenow={todayPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="todos-today-progress-fill" style={{ width: `${todayPercent}%` }} />
            </div>
            <p className="todos-today-progress-text">
              {t('todos.today.progress', { done: String(todayCompleted), total: String(todayTotal), percent: String(todayPercent) })}
            </p>
          </div>
          {todayTodos.length === 0 ? (
            <p className="empty-hint">{t('todos.today.empty')}</p>
          ) : (
            <ul className="todos-list">
              {todayTodos.map((item) => (
                <li key={item.id}>
                    <TodoItemRow todo={item} onToggleComplete={handleToggleComplete} onToggleSubtask={handleToggleSubtask}>
                      <Link to={`/item/todo/${item.id}`} className="todos-item">
                        <span className="todos-item-title">{item.title}</span>
                        <span className="todos-item-meta">
                          <span className="todos-item-importance" title={t('createTodo.field.importance')}>{'!'.repeat(item.importance)}</span>
                          {item.ddl ? new Date(item.ddl).toLocaleString(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('todos.todo.noDdl')}
                          {item.tags.length > 0 && ` · ${item.tags.join('、')}`}
                        </span>
                      </Link>
                    </TodoItemRow>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {displayMode === 'goals' && (
        <div className="todos-goals-wrap">
          <div className="todos-goals-actions">
            <Link to="/create/goal" className="btn btn-primary">
              {t('todos.addGoal')}
            </Link>
          </div>
          {goals.length === 0 && todos.length === 0 ? (
            <p className="empty-hint">{t('todos.empty.noGoalOrTodo')}</p>
          ) : (
            <>
              {goals.length === 0 && (
                <p className="sub-hint">{t('todos.empty.noGoalHint')}</p>
              )}
              {(goalsByType.major.length > 0 || goalsByType.year.length > 0 || goalsByType.month.length > 0 || goalsByType.custom.length > 0) && (
                <div className="todos-goals-sections">
                  {(['major', 'year', 'month', 'custom'] as const).map((typeKey) => {
                    const list = goalsByType[typeKey]
                    if (list.length === 0) return null
                    const typeLabel = t(`createGoal.goalType.${typeKey}`)
                    return (
                      <div key={typeKey} className="todos-goals-section">
                        <h3 className="todos-goals-section-title">{typeLabel}</h3>
                        {list.map((goal) => {
                          const goalTodos = (todosByGoalId.get(goal.id) ?? []).sort((a, b) => new Date(getTodoTime(a)).getTime() - new Date(getTodoTime(b)).getTime())
                          return (
                            <div key={goal.id} className="todos-goals-block">
                              <h4 className="todos-goals-block-title">{goalDisplayLabel(goal, t, lang)}</h4>
                              {goalTodos.length === 0 ? (
                                <p className="todos-goals-empty">{t('todos.empty.goalEmpty')}</p>
                              ) : (
                                <ul className="todos-list">
                                  {goalTodos.map((item) => (
                                    <li key={item.id}>
                                        <TodoItemRow todo={item} onToggleComplete={handleToggleComplete} onToggleSubtask={handleToggleSubtask}>
                                          <Link to={`/item/todo/${item.id}`} className="todos-item">
                                            <span className="todos-item-title">{item.title}</span>
                                            <span className="todos-item-meta">
                                              <span className="todos-item-importance" title={t('createTodo.field.importance')}>{'!'.repeat(item.importance)}</span>
                                              {item.ddl ? new Date(item.ddl).toLocaleString(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('todos.todo.noDdl')}
                                              {item.tags.length > 0 && ` · ${item.tags.join('、')}`}
                                            </span>
                                          </Link>
                                        </TodoItemRow>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
              {ungroupedTodos.length > 0 && (
                <div className="todos-goals-section">
                  <h3 className="todos-goals-section-title">{t('todos.empty.ungrouped')}</h3>
                  <ul className="todos-list">
                    {ungroupedTodos.map((item) => (
                      <li key={item.id}>
                          <TodoItemRow todo={item} onToggleComplete={handleToggleComplete} onToggleSubtask={handleToggleSubtask}>
                            <Link to={`/item/todo/${item.id}`} className="todos-item">
                              <span className="todos-item-title">{item.title}</span>
                              <span className="todos-item-meta">
                                <span className="todos-item-importance" title={t('createTodo.field.importance')}>{'!'.repeat(item.importance)}</span>
                                {item.ddl ? new Date(item.ddl).toLocaleString(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('todos.todo.noDdl')}
                                {item.tags.length > 0 && ` · ${item.tags.join('、')}`}
                              </span>
                            </Link>
                          </TodoItemRow>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {displayMode === 'tags' && (
        <div className="todos-tags-layout">
          <aside className="todos-sidebar">
            <button
              type="button"
              className={`todos-tag-btn ${selectedTag === null ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              {t('todos.tags.all')}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`todos-tag-btn ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
            {allTags.length === 0 && (
              <span className="todos-tags-empty">{t('todos.tags.empty')}</span>
            )}
          </aside>
          <div className="todos-main">
            {sortedByTime.length === 0 ? (
              <p className="empty-hint">
                {selectedTag ? t('todos.empty.noTagTodo', { tag: selectedTag }) : t('todos.empty.noTodos')}
              </p>
            ) : (
              <ul className="todos-list">
                {sortedByTime.map((item) => (
                  <li key={item.id}>
                      <TodoItemRow todo={item} onToggleComplete={handleToggleComplete} onToggleSubtask={handleToggleSubtask}>
                        <Link to={`/item/todo/${item.id}`} className="todos-item">
                          <span className="todos-item-title">{item.title}</span>
                          <span className="todos-item-meta">
                            <span className="todos-item-importance" title={t('createTodo.field.importance')}>{'!'.repeat(item.importance)}</span>
                            {item.ddl ? new Date(item.ddl).toLocaleString(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('todos.todo.noDdl')}
                            {item.tags.length > 0 && ` · ${item.tags.join('、')}`}
                          </span>
                        </Link>
                      </TodoItemRow>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {displayMode === 'timeline' && (
        <>
          <div className="todos-timeline-sub-toggle">
            <button
              type="button"
              className={timelineSubMode === 'axis' ? 'active' : ''}
              onClick={() => setTimelineSubMode('axis')}
            >
              {t('todos.timeline.axis')}
            </button>
            <button
              type="button"
              className={timelineSubMode === 'calendar' ? 'active' : ''}
              onClick={() => setTimelineSubMode('calendar')}
            >
              {t('todos.calendar.calendar')}
            </button>
          </div>

          {timelineSubMode === 'axis' && (
            <>
              {sortedByTime.length === 0 ? (
                <p className="empty-hint">{t('todos.empty.noTodosCreate')}</p>
              ) : (
                <div className="todos-axis-wrap">
                  <div className="todos-axis-line" aria-hidden />
                  <div className="todos-axis-content">
                    {dayKeys.map((day) => (
                      <div key={day} className="todos-axis-day">
                        <div className="todos-axis-dot" />
                        <div className="todos-axis-day-body">
                          <h3 className="todos-axis-day-title">{formatDay(day + 'T12:00:00', locale)}</h3>
                          <ul className="todos-axis-event-list">
                            {byDay.get(day)!.map((item) => (
                              <li key={item.id}>
                                  <TodoItemRow todo={item} onToggleComplete={handleToggleComplete} onToggleSubtask={handleToggleSubtask}>
                                    <Link to={`/item/todo/${item.id}`} className="todos-axis-event">
                                      <span className="todos-axis-event-importance">{'!'.repeat(item.importance)}</span>
                                      <span className="todos-axis-event-time">{formatTime(getTodoTime(item), locale)}</span>
                                      <span className="todos-axis-event-title">{item.title}</span>
                                    </Link>
                                  </TodoItemRow>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {timelineSubMode === 'calendar' && (
            <div className="todos-calendar-wrap">
              {/* 层级导航：日 → 周 → 月 */}
              <div className="todos-calendar-breadcrumb">
                <button
                  type="button"
                  className={calendarViewLevel === 'month' ? 'active' : ''}
                  onClick={goToMonth}
                >
                  {t('todos.calendar.month')}
                </button>
                <span className="todos-calendar-breadcrumb-sep" />
                <button
                  type="button"
                  className={calendarViewLevel === 'week' ? 'active' : ''}
                  onClick={goToWeek}
                >
                  {t('todos.calendar.week')}
                </button>
                <span className="todos-calendar-breadcrumb-sep" />
                <button
                  type="button"
                  className={calendarViewLevel === 'day' ? 'active' : ''}
                  onClick={() => setCalendarViewLevel('day')}
                >
                  {t('todos.calendar.day')}
                </button>
                {calendarViewLevel !== 'month' && (
                  <button
                    type="button"
                    className="todos-calendar-back"
                    onClick={calendarViewLevel === 'day' ? goToWeek : goToMonth}
                    aria-label={t('todos.calendar.back')}
                  >
                    {t('todos.calendar.back')}
                  </button>
                )}
              </div>

              {/* 月视图 */}
              {calendarViewLevel === 'month' && (
                <>
                  <div className="todos-calendar-header">
                    <button type="button" className="todos-calendar-nav" onClick={calendarPrevMonth} aria-label={t('todos.calendar.prevMonth')}>
                      ‹
                    </button>
                    <span className="todos-calendar-month-title">{formatMonthShort(calendarDate + 'T12:00:00', locale)}</span>
                    <button type="button" className="todos-calendar-nav" onClick={calendarNextMonth} aria-label={t('todos.calendar.nextMonth')}>
                      ›
                    </button>
                  </div>
                  <div className="todos-calendar-month-grid">
                    {weekdayLabels.map((l) => (
                      <div key={l} className="todos-calendar-weekday-head">
                        {l}
                      </div>
                    ))}
                    {monthDays.map((dayKey, i) =>
                      dayKey === null ? (
                        <div key={`e-${i}`} className="todos-calendar-day-cell empty" />
                      ) : (() => {
                        const todoCount = byDay.get(dayKey)?.length ?? 0
                        const birthdayCount = getBirthdaysOnDay(dayKey, contacts).length
                        const dayCount = todoCount + birthdayCount
                        const dayIntensity = dayCount / maxMonthTodos
                        return (
                          <button
                            key={dayKey}
                            type="button"
                            className={`todos-calendar-day-cell ${dayKey === todayKey() ? 'today' : ''}`}
                            style={{ ['--day-intensity' as string]: String(dayIntensity) }}
                            onClick={() => goToDay(dayKey)}
                            title={dayCount > 0 ? (todoCount ? t('todos.calendar.todoCount', { n: String(todoCount) }) : '') + (birthdayCount ? (todoCount ? ' · ' : '') + t('todos.calendar.birthdayCount', { n: String(birthdayCount) }) : '') : undefined}
                          >
                            <span className="todos-calendar-day-cell-bg" aria-hidden />
                            <span className="todos-calendar-day-num">{new Date(dayKey).getDate()}</span>
                            {dayCount > 0 && (
                              <span className="todos-calendar-day-dots">
                                {Array.from({ length: Math.min(dayCount, 3) }).map((_, j) => (
                                  <span key={j} className="todos-calendar-day-dot" />
                                ))}
                              </span>
                            )}
                          </button>
                        )
                      })()
                    )}
                  </div>
                </>
              )}

              {/* 周视图 */}
              {calendarViewLevel === 'week' && (
                <>
                  <div className="todos-calendar-header">
                    <button type="button" className="todos-calendar-nav" onClick={calendarPrevWeek} aria-label={t('todos.calendar.prevWeek')}>
                      ‹
                    </button>
                    <span className="todos-calendar-week-title">
                      {new Date(weekStart + 'T12:00:00').toLocaleDateString(locale, { month: 'numeric', day: 'numeric' })} – {new Date(weekDates[6] + 'T12:00:00').toLocaleDateString(locale, { month: 'numeric', day: 'numeric' })}
                    </span>
                    <button type="button" className="todos-calendar-nav" onClick={calendarNextWeek} aria-label={t('todos.calendar.nextWeek')}>
                      ›
                    </button>
                  </div>
                  <div className="todos-calendar-week-grid">
                    {weekDates.map((dayKey) => (
                      <div key={dayKey} className="todos-calendar-week-day">
                        <button
                          type="button"
                          className={`todos-calendar-week-day-head ${dayKey === todayKey() ? 'today' : ''}`}
                          onClick={() => goToDay(dayKey)}
                        >
                          <span className="todos-calendar-week-day-num">{new Date(dayKey).getDate()}</span>
                          <span className="todos-calendar-week-day-weekday">
                            {weekdayLabels[getDayOfWeek(dayKey)]}
                          </span>
                          {dayKey === todayKey() && (
                            <span className="todos-calendar-today-badge">
                              {t('todos.calendar.todayShort')}
                            </span>
                          )}
                        </button>
                        <ul className="todos-calendar-week-events">
                          {getBirthdaysOnDay(dayKey, contacts).map((c) => (
                            <li key={`b-${c.id}`}>
                              <Link to={`/contact/${c.id}`} className="todos-calendar-week-event todos-calendar-birthday">
                                <span className="todos-calendar-week-event-title">🎂 {c.name} {t('todos.calendar.birthday')}</span>
                              </Link>
                            </li>
                          ))}
                          {(byDay.get(dayKey) ?? []).map((t) => (
                            <li key={t.id}>
                              <Link to={`/item/todo/${t.id}`} className="todos-calendar-week-event">
                                <span className="todos-calendar-week-event-importance">{'!'.repeat(t.importance)}</span>
                                <span className="todos-calendar-week-event-time">{formatTime(getTodoTime(t), locale)}</span>
                                <span className="todos-calendar-week-event-title">{t.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* 日视图 */}
              {calendarViewLevel === 'day' && (
                <>
                  <div className="todos-calendar-header">
                    <button type="button" className="todos-calendar-nav" onClick={calendarPrevDay} aria-label={t('todos.calendar.prevDay')}>
                      ‹
                    </button>
                    <button
                      type="button"
                      className={`todos-calendar-date ${isToday ? 'today' : ''}`}
                      onClick={calendarToToday}
                    >
                      {formatDay(calendarDate + 'T12:00:00', locale)}
                      {isToday && <span className="todos-calendar-today-badge">{t('todos.calendar.todayShort')}</span>}
                    </button>
                    <button type="button" className="todos-calendar-nav" onClick={calendarNextDay} aria-label={t('todos.calendar.nextDay')}>
                      ›
                    </button>
                  </div>
                  {(() => {
                    const dayBirthdays = getBirthdaysOnDay(calendarDate, contacts)
                    return (
                      <>
                        {dayBirthdays.length > 0 && (
                          <div className="todos-calendar-day-birthdays">
                            <span className="todos-calendar-day-birthdays-label">🎂 {t('todos.calendar.birthday')}</span>
                            <ul className="todos-calendar-day-birthdays-list">
                              {dayBirthdays.map((c) => (
                                <li key={c.id}>
                                  <Link to={`/contact/${c.id}`}>{c.name}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="todos-calendar-body">
                          <div className="todos-calendar-ruler">
                            {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i).map((h) => (
                              <div key={h} className="todos-calendar-ruler-slot" style={{ height: SLOT_HEIGHT }}>
                                {h}:00
                              </div>
                            ))}
                          </div>
                          <div
                            className="todos-calendar-grid"
                            style={{ height: (HOUR_END - HOUR_START) * SLOT_HEIGHT }}
                          >
                            {calendarTodos.map((t) => (
                              <Link
                                key={t.id}
                                to={`/item/todo/${t.id}`}
                                className="todos-calendar-event"
                                style={{
                                  top: getEventTop(getTodoTime(t)),
                                  height: SLOT_HEIGHT - 4,
                                }}
                              >
                                <span className="todos-calendar-event-importance">{'!'.repeat(t.importance)}</span>
                                <span className="todos-calendar-event-time">{formatTime(getTodoTime(t), locale)}</span>
                                <span className="todos-calendar-event-title">{t.title}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                        {calendarTodos.length === 0 && dayBirthdays.length === 0 && (
                          <p className="todos-calendar-empty">{t('todos.calendar.empty')}</p>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
            </div>
          )}
        </>
      )}
      {reflectionTodo && (
        <ReflectionModal
          todoTitle={reflectionTodo.title}
          initialText={reflectionTodo.completionReflection ?? ''}
          onSave={handleSaveReflection}
          onClose={() => setReflectionTodoId(null)}
        />
      )}
    </section>
  )
}
