import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getTodos, setTodos, getGoals } from '../lib/store'
import { REMINDER_PRESETS } from '../lib/reminder'
import type { TodoItem, Subtask, Attachment } from '../types'
import type { Goal } from '../types'
import TagInput from '../components/TagInput'
import AttachmentField from '../components/AttachmentField'
import SubtaskEditModal from '../components/SubtaskEditModal'
import './CreateTodo.css'

const PRESET_VALUES = new Set(REMINDER_PRESETS.map((p) => p.value))

function goalLabel(g: Goal, t: (k: string) => string): string {
  const typeLabel = t(`createGoal.goalType.${g.type}`)
  const ySuffix = t('createGoal.yearSuffix')
  const mSuffix = t('createGoal.monthSuffix')
  if (g.type === 'year' && g.year) return `${typeLabel} · ${g.year}${ySuffix} · ${g.title}`
  if (g.type === 'month' && g.year != null && g.month != null) return `${typeLabel} · ${g.year}${ySuffix} ${g.month}${mSuffix} · ${g.title}`
  return `${typeLabel} · ${g.title}`
}

const emptyTodo = (): Omit<TodoItem, 'id' | 'createdAt'> => ({
  type: 'todo',
  title: '',
  ddl: '',
  importance: 3,
  tags: [],
  goalId: undefined,
  description: '',
  location: '',
  relatedPeople: [],
  attachments: [],
  hasSubEvents: false,
  subEvents: [],
  subtasks: [],
  reminderBeforeMinutes: [],
})

export type TodoPrefilled = { title?: string; description?: string }
export type TodoCreateState = { prefilled?: TodoPrefilled; attachment?: Attachment }

export default function CreateTodo() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const { id: editId } = useParams<{ id: string }>()
  const goals = getGoals()
  const [form, setForm] = useState(() => {
    const state = location.state as TodoCreateState | undefined
    const prefilled = state?.prefilled
    const attachment = state?.attachment
    const base = emptyTodo()
    const attachments = attachment ? [attachment, ...base.attachments] : base.attachments
    if (editId) {
      const existing = getTodos().find((todo) => todo.id === editId) as TodoItem | undefined
      if (existing) {
        return {
          ...base,
          title: existing.title,
          ddl: existing.ddl,
          importance: existing.importance,
          tags: existing.tags,
          goalId: existing.goalId,
          description: existing.description,
          location: existing.location,
          relatedPeople: existing.relatedPeople,
          attachments: existing.attachments,
          subtasks: existing.subtasks ?? [],
          reminderBeforeMinutes: existing.reminderBeforeMinutes ?? [],
        }
      }
    }
    if (prefilled)
      return {
        ...base,
        title: prefilled.title ?? '',
        description: prefilled.description ?? '',
        attachments,
      }
    return { ...base, attachments }
  })


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
  const [customMinutesInput, setCustomMinutesInput] = useState('')

  const toggleReminder = (minutes: number) => {
    const set = new Set(reminderMinutes)
    if (set.has(minutes)) set.delete(minutes)
    else set.add(minutes)
    set('reminderBeforeMinutes', Array.from(set).sort((a, b) => a - b))
  }

  const clearReminders = () => {
    set('reminderBeforeMinutes', [])
  }

  const addCustomReminder = () => {
    const n = parseInt(customMinutesInput, 10)
    if (!Number.isFinite(n) || n <= 0) return
    const set = new Set(reminderMinutes)
    set.add(n)
    set('reminderBeforeMinutes', Array.from(set).sort((a, b) => a - b))
    setCustomMinutesInput('')
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
        ddl: form.ddl || now,
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
        ddl: form.ddl || now,
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
        <label className="field">
          <span className="field-label">{t('createTodo.field.ddl')}</span>
          <input
            type="datetime-local"
            className="input"
            value={form.ddl ? form.ddl.slice(0, 16) : ''}
            onChange={(e) => set('ddl', e.target.value ? new Date(e.target.value).toISOString() : '')}
          />
        </label>
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
            <div className="reminder-todo-custom">
              <input
                type="number"
                className="input reminder-todo-custom-input"
                min={1}
                placeholder={t('reminder.customMinutes')}
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomReminder())}
              />
              <button type="button" className="btn reminder-todo-btn" onClick={addCustomReminder}>
                {t('reminder.custom')}
              </button>
            </div>
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
