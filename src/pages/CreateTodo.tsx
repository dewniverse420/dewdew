import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getTodos, setTodos, getGoals } from '../lib/store'
import { REMINDER_PRESETS } from '../lib/reminder'
import {
  localDateStrFromDate,
  localEndOfDayIsoFromDateStr,
  localDateAndOptionalTimeToIso,
  parseIsoToDdlParts,
} from '../lib/datetime'
import type { TodoItem, Attachment } from '../types'
import type { Goal } from '../types'
import TagInput from '../components/TagInput'
import AttachmentField from '../components/AttachmentField'
import SubtaskEditModal from '../components/SubtaskEditModal'
import './CreateTodo.css'

const PRESET_VALUES = new Set<number>(REMINDER_PRESETS.map((p) => p.value))

function goalLabel(g: Goal, t: (k: string) => string): string {
  const typeLabel = t(`createGoal.goalType.${g.type}`)
  const ySuffix = t('createGoal.yearSuffix')
  const mSuffix = t('createGoal.monthSuffix')
  if (g.type === 'year' && g.year) return `${typeLabel} · ${g.year}${ySuffix} · ${g.title}`
  if (g.type === 'month' && g.year != null && g.month != null) return `${typeLabel} · ${g.year}${ySuffix} ${g.month}${mSuffix} · ${g.title}`
  return `${typeLabel} · ${g.title}`
}

export type TodoPrefilled = { title?: string; description?: string }
export type TodoCreateState = { prefilled?: TodoPrefilled; attachment?: Attachment }

const emptyTodo = (): Omit<TodoItem, 'id' | 'createdAt'> => ({
  type: 'todo',
  title: '',
  ddl: localEndOfDayIsoFromDateStr(localDateStrFromDate(new Date())),
  importance: 3,
  tags: [],
  goalId: undefined,
  description: '',
  location: '',
  link: '',
  relatedPeople: [],
  attachments: [],
  hasSubEvents: false,
  subEvents: [],
  subtasks: [],
  reminderBeforeMinutes: [],
})

function buildInitialCreateTodo(
  editId: string | undefined,
  locationState: TodoCreateState | undefined
): {
  form: Omit<TodoItem, 'id' | 'createdAt'>
  ddlDate: string
  useSpecificTime: boolean
  timeStr: string
} {
  const base = emptyTodo()
  const attachment = locationState?.attachment
  const attachments = attachment ? [attachment, ...base.attachments] : base.attachments
  if (editId) {
    const existing = getTodos().find((todo) => todo.id === editId) as TodoItem | undefined
    if (existing) {
      const parts = parseIsoToDdlParts(existing.ddl)
      return {
        form: {
          ...base,
          title: existing.title,
          ddl: existing.ddl,
          importance: existing.importance,
          tags: existing.tags,
          goalId: existing.goalId,
          description: existing.description,
          location: existing.location,
          link: existing.link ?? '',
          relatedPeople: existing.relatedPeople,
          attachments: existing.attachments,
          subtasks: existing.subtasks ?? [],
          reminderBeforeMinutes: existing.reminderBeforeMinutes ?? [],
        },
        ddlDate: parts.ddlDate,
        useSpecificTime: parts.useSpecificTime,
        timeStr: parts.timeStr,
      }
    }
  }
  const prefilled = locationState?.prefilled
  const ddl = base.ddl
  const parts = parseIsoToDdlParts(ddl)
  if (prefilled) {
    return {
      form: {
        ...base,
        title: prefilled.title ?? '',
        description: prefilled.description ?? '',
        attachments,
        ddl,
      },
      ddlDate: parts.ddlDate,
      useSpecificTime: parts.useSpecificTime,
      timeStr: parts.timeStr,
    }
  }
  return {
    form: { ...base, attachments },
    ddlDate: parts.ddlDate,
    useSpecificTime: parts.useSpecificTime,
    timeStr: parts.timeStr,
  }
}

export default function CreateTodo() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const { id: editId } = useParams<{ id: string }>()
  const goals = getGoals()
  const initial = buildInitialCreateTodo(editId, location.state as TodoCreateState | undefined)
  const [form, setForm] = useState(initial.form)
  const [ddlDate, setDdlDate] = useState(initial.ddlDate)
  const [useSpecificTime, setUseSpecificTime] = useState(initial.useSpecificTime)
  const [timeStr, setTimeStr] = useState(initial.timeStr)

  useEffect(() => {
    const iso = useSpecificTime ? localDateAndOptionalTimeToIso(ddlDate, timeStr) : localEndOfDayIsoFromDateStr(ddlDate)
    setForm((f) => (f.ddl === iso ? f : { ...f, ddl: iso }))
  }, [ddlDate, useSpecificTime, timeStr])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const peopleStr = form.relatedPeople.join('、')
  const setPeople = (s: string) => {
    set(
      'relatedPeople',
      s
        .split(/[、,，\s]+/)
        .map((x) => x.trim())
        .filter(Boolean)
    )
  }

  const subtasks = form.subtasks ?? []
  const [showSubtaskModal, setShowSubtaskModal] = useState(false)
  const reminderMinutes = form.reminderBeforeMinutes ?? []
  const [customValue, setCustomValue] = useState('')
  const [customUnit, setCustomUnit] = useState<'min' | 'hour' | 'day' | 'month' | 'year'>('min')

  const toggleReminder = (minutes: number) => {
    const minuteSet = new Set(reminderMinutes)
    if (minuteSet.has(minutes)) minuteSet.delete(minutes)
    else minuteSet.add(minutes)
    set('reminderBeforeMinutes', Array.from(minuteSet).sort((a, b) => a - b))
  }

  const clearReminders = () => {
    set('reminderBeforeMinutes', [])
  }

  const toMinutes = (val: number, unit: 'min' | 'hour' | 'day' | 'month' | 'year') => {
    if (unit === 'min') return val
    if (unit === 'hour') return val * 60
    if (unit === 'day') return val * 24 * 60
    if (unit === 'month') return val * 30 * 24 * 60
    return val * 365 * 24 * 60 // year
  }

  const addCustomReminder = () => {
    const n = parseInt(customValue, 10)
    if (!Number.isFinite(n) || n <= 0) return
    const minutes = toMinutes(n, customUnit)
    const minuteSet = new Set(reminderMinutes)
    minuteSet.add(minutes)
    set('reminderBeforeMinutes', Array.from(minuteSet).sort((a, b) => a - b))
    setCustomValue('')
  }

  const removeReminder = (minutes: number) => {
    set('reminderBeforeMinutes', reminderMinutes.filter((m) => m !== minutes))
  }

  const customOnly = reminderMinutes.filter((m) => !PRESET_VALUES.has(m))

  const submit = () => {
    const title = form.title.trim()
    if (!title) return
    const now = new Date().toISOString()
    const list = getTodos()
    if (editId) {
      const existing = list.find((todo) => todo.id === editId)
      if (!existing) { navigate('/todos'); return }
      const updated: TodoItem = {
        ...existing,
        ...form,
        title,
        ddl: form.ddl || localEndOfDayIsoFromDateStr(localDateStrFromDate(new Date())),
        link: (form.link ?? '').trim() || undefined,
        subtasks: subtasks.filter((s) => s.title.trim() !== ''),
        hasSubEvents: (form.subtasks?.length ?? 0) > 0,
      }
      setTodos(list.map((todo) => (todo.id === editId ? updated : todo)))
      navigate(`/item/todo/${editId}`)
    } else {
      const item: TodoItem = {
        ...form,
        id: crypto.randomUUID(),
        createdAt: now,
        title,
        ddl: form.ddl || localEndOfDayIsoFromDateStr(localDateStrFromDate(new Date())),
        link: (form.link ?? '').trim() || undefined,
        subtasks: subtasks.filter((s) => s.title.trim() !== ''),
        hasSubEvents: (form.subtasks?.length ?? 0) > 0,
      }
      setTodos([item, ...list])
      navigate('/todos')
    }
  }

  return (
    <section className="page create-todo-page">
      <div className="page-heading-row">
        <h2 className="page-heading">{editId ? t('detail.edit') : t('createTodo.heading')}</h2>
        <button type="button" className="btn btn-primary" onClick={submit}>
          {t('common.save')}
        </button>
      </div>
      <form className="form-block" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <label className="field">
          <span className="field-label">{t('createTodo.field.title')}</span>
          <input
            type="text"
            className="input"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={t('createTodo.titlePlaceholder')}
          />
        </label>
        <div className="field">
          <span className="field-label">{t('createTodo.field.ddl')}</span>
          <div className="create-todo-ddl-row">
            <input
              type="date"
              className="input create-todo-ddl-date"
              value={ddlDate}
              onChange={(e) => setDdlDate(e.target.value)}
              required
            />
            <label className="create-todo-ddl-time-toggle">
              <input
                type="checkbox"
                checked={useSpecificTime}
                onChange={(e) => {
                  const on = e.target.checked
                  setUseSpecificTime(on)
                  if (on) setTimeStr((s) => s || '09:00')
                }}
              />
              <span>{t('createTodo.ddl.specificTime')}</span>
            </label>
          </div>
          {useSpecificTime && (
            <input
              type="time"
              className="input create-todo-ddl-time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
            />
          )}
          {!useSpecificTime && (
            <p className="sub-hint create-todo-ddl-hint">{t('createTodo.ddl.endOfDayHint')}</p>
          )}
        </div>
        <div className="field">
          <span className="field-label">{t('reminder.todoLabel')}</span>
          <div className="reminder-todo-options">
            <button type="button" className="btn reminder-todo-btn" onClick={clearReminders}>
              {t('reminder.off')}
            </button>
            {REMINDER_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`btn reminder-todo-btn ${reminderMinutes.includes(p.value) ? 'active' : ''}`}
                onClick={() => toggleReminder(p.value)}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
          <div className="reminder-todo-custom-block">
            <span className="reminder-todo-custom-label">{t('reminder.custom')}</span>
            <div className="reminder-todo-custom">
              <input
                type="number"
                className="input reminder-todo-custom-input"
                min={1}
                placeholder="0"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomReminder())}
              />
              <select
                className="input reminder-todo-custom-unit"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value as 'min' | 'hour' | 'day' | 'month' | 'year')}
                aria-label={t('reminder.custom')}
              >
                <option value="min">{t('reminder.unitMin')}</option>
                <option value="hour">{t('reminder.unitHour')}</option>
                <option value="day">{t('reminder.unitDay')}</option>
                <option value="month">{t('reminder.unitMonth')}</option>
                <option value="year">{t('reminder.unitYear')}</option>
              </select>
              <button type="button" className="btn reminder-todo-btn" onClick={addCustomReminder}>
                {t('reminder.addCustom')}
              </button>
            </div>
            {customOnly.length > 0 && (
              <div className="reminder-todo-custom-list">
                {customOnly.map((m) => (
                  <span key={m} className="reminder-todo-custom-tag">
                    {m} {t('reminder.customMinutes')}
                    <button type="button" className="reminder-todo-custom-remove" onClick={() => removeReminder(m)} aria-label={t('common.close')}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <label className="field">
          <span className="field-label">{t('createTodo.field.importance')}</span>
          <select
            className="input"
            value={form.importance}
            onChange={(e) => set('importance', Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} - {n <= 2 ? t('createTodo.importance.low') : n === 3 ? t('createTodo.importance.mid') : t('createTodo.importance.high')}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">{t('createTodo.field.goal')}</span>
          <select
            className="input"
            value={form.goalId ?? ''}
            onChange={(e) => set('goalId', e.target.value || undefined)}
          >
            <option value="">{t('createTodo.goalNone')}</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>{goalLabel(g, t)}</option>
            ))}
          </select>
          {goals.length === 0 && (
            <span className="sub-hint">{t('createTodo.goalHint')}</span>
          )}
        </label>
        <div className="field">
          <span className="field-label">{t('createTodo.field.tags')}</span>
          <TagInput value={form.tags} onChange={(tags) => set('tags', tags)} placeholder={t('createTodo.tagsPlaceholder')} removeAriaLabel={t('common.remove')} />
        </div>
        <label className="field">
          <span className="field-label">{t('createTodo.field.description')}</span>
          <textarea
            className="input textarea"
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder={t('createTodo.descriptionPlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createTodo.field.location')}</span>
          <input
            type="text"
            className="input"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder={t('createTodo.locationPlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createTodo.field.link')}</span>
          <input
            type="url"
            className="input"
            value={form.link ?? ''}
            onChange={(e) => set('link', e.target.value)}
            placeholder={t('createTodo.linkPlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createTodo.field.people')}</span>
          <input
            type="text"
            className="input"
            value={peopleStr}
            onChange={(e) => setPeople(e.target.value)}
            placeholder={t('createTodo.peoplePlaceholder')}
          />
        </label>
        <div className="field">
          <span className="field-label">{t('createTodo.field.subtasks')}</span>
          <button
            type="button"
            className="btn btn-secondary btn-subtask-trigger"
            onClick={() => setShowSubtaskModal(true)}
          >
            {subtasks.length > 0
              ? `${t('createTodo.field.subtasks')}（${t('createTodo.subtasksAdded', { n: String(subtasks.filter((s) => s.title.trim()).length) })}）`
              : t('createTodo.field.subtasks') + ' · ' + t('createTodo.addSubtask')}
          </button>
          {showSubtaskModal && (
            <SubtaskEditModal
              subtasks={subtasks}
              onSave={(next) => set('subtasks', next)}
              onClose={() => setShowSubtaskModal(false)}
            />
          )}
        </div>
        <div className="field">
          <span className="field-label">{t('createTodo.field.attachments')}</span>
          <AttachmentField
            attachments={form.attachments}
            onChange={(attachments) => set('attachments', attachments)}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate(-1)}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </section>
  )
}
