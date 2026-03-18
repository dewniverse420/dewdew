import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getHabits, setHabits, getGoals } from '../lib/store'
import type { Attachment, Goal, HabitItem, HabitReminder, HabitRepeat } from '../types'
import TagInput from '../components/TagInput'
import AttachmentField from '../components/AttachmentField'
import './CreateHabit.css'

function goalLabel(g: Goal, t: (k: string) => string): string {
  const typeLabel = t(`createGoal.goalType.${g.type}`)
  const ySuffix = t('createGoal.yearSuffix')
  const mSuffix = t('createGoal.monthSuffix')
  if (g.type === 'year' && g.year) return `${typeLabel} · ${g.year}${ySuffix} · ${g.title}`
  if (g.type === 'month' && g.year != null && g.month != null) return `${typeLabel} · ${g.year}${ySuffix} ${g.month}${mSuffix} · ${g.title}`
  return `${typeLabel} · ${g.title}`
}

const emptyHabit = (): Omit<HabitItem, 'id' | 'createdAt'> => ({
  type: 'habit',
  title: '',
  reminders: [
    {
      id: crypto.randomUUID(),
      repeat: 'everyday',
      time: '08:00',
    },
  ],
  checks: {},
  tags: [],
  goalId: undefined,
  description: '',
  location: '',
  link: '',
  relatedPeople: [],
  attachments: [],
})

function normalizeWeekdays(xs: number[] | undefined): number[] {
  if (!xs) return []
  const set = new Set(xs.filter((n) => Number.isFinite(n) && n >= 1 && n <= 7))
  return Array.from(set).sort((a, b) => a - b)
}

function ensureHabitReminder(r: HabitReminder): HabitReminder {
  const repeat: HabitRepeat = r.repeat === 'weekly' ? 'weekly' : 'everyday'
  const time = typeof r.time === 'string' && /^\d{2}:\d{2}$/.test(r.time) ? r.time : '08:00'
  if (repeat === 'weekly') return { ...r, repeat, time, weekdays: normalizeWeekdays(r.weekdays) }
  return { ...r, repeat, time, weekdays: undefined }
}

export type HabitCreateState = { attachment?: Attachment }

export default function CreateHabit() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const goals = getGoals()

  const [form, setForm] = useState(() => {
    const base = emptyHabit()
    if (editId) {
      const existing = getHabits().find((h) => h.id === editId)
      if (existing) {
        return {
          ...base,
          title: existing.title,
          reminders: (existing.reminders ?? []).map(ensureHabitReminder),
          checks: existing.checks ?? {},
          tags: existing.tags ?? [],
          goalId: existing.goalId,
          description: existing.description ?? '',
          location: existing.location ?? '',
          link: existing.link ?? '',
          relatedPeople: existing.relatedPeople ?? [],
          attachments: existing.attachments ?? [],
        }
      }
    }
    return base
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

  const weekdayOptions = useMemo(
    () => [
      { n: 1, label: t('todos.weekday.1') },
      { n: 2, label: t('todos.weekday.2') },
      { n: 3, label: t('todos.weekday.3') },
      { n: 4, label: t('todos.weekday.4') },
      { n: 5, label: t('todos.weekday.5') },
      { n: 6, label: t('todos.weekday.6') },
      { n: 7, label: t('todos.weekday.7') },
    ],
    [t]
  )

  const updateReminder = (id: string, patch: Partial<HabitReminder>) => {
    set(
      'reminders',
      form.reminders.map((r) => (r.id === id ? ensureHabitReminder({ ...r, ...patch }) : r))
    )
  }

  const addReminder = () => {
    const r: HabitReminder = { id: crypto.randomUUID(), repeat: 'everyday', time: '08:00' }
    set('reminders', [...form.reminders, r])
  }

  const removeReminder = (id: string) => {
    const next = form.reminders.filter((r) => r.id !== id)
    set('reminders', next.length ? next : emptyHabit().reminders)
  }

  const submit = () => {
    const title = form.title.trim()
    if (!title) return
    const now = new Date().toISOString()
    const list = getHabits()
    const payload = {
      ...form,
      title,
      reminders: (form.reminders ?? []).map(ensureHabitReminder),
      link: (form.link ?? '').trim() || undefined,
      tags: form.tags ?? [],
      relatedPeople: form.relatedPeople ?? [],
      attachments: form.attachments ?? [],
    }
    if (editId) {
      const existing = list.find((h) => h.id === editId)
      if (!existing) {
        navigate('/todos')
        return
      }
      const updated: HabitItem = { ...existing, ...payload }
      setHabits(list.map((h) => (h.id === editId ? updated : h)))
      navigate(`/item/habit/${editId}`)
    } else {
      const item: HabitItem = { ...payload, id: crypto.randomUUID(), createdAt: now, type: 'habit' }
      setHabits([item, ...list])
      navigate('/todos')
    }
  }

  return (
    <section className="page create-habit-page">
      <div className="page-heading-row">
        <h2 className="page-heading">{editId ? t('detail.edit') : t('createHabit.heading')}</h2>
        <button type="button" className="btn btn-primary" onClick={submit}>
          {t('common.save')}
        </button>
      </div>
      <form className="form-block" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <label className="field">
          <span className="field-label">{t('createHabit.field.title')}</span>
          <input
            type="text"
            className="input"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={t('createHabit.titlePlaceholder')}
          />
        </label>

        <div className="field">
          <div className="field-label-row">
            <span className="field-label">{t('createHabit.field.reminders')}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addReminder}>
              + {t('createHabit.reminder.add')}
            </button>
          </div>
          <div className="habit-reminders">
            {form.reminders.map((r) => (
              <div key={r.id} className="habit-reminder-row">
                <select
                  className="input habit-repeat"
                  value={r.repeat}
                  onChange={(e) => updateReminder(r.id, { repeat: e.target.value as HabitRepeat })}
                  aria-label={t('createHabit.reminder.repeat')}
                >
                  <option value="everyday">{t('createHabit.repeat.everyday')}</option>
                  <option value="weekly">{t('createHabit.repeat.weekly')}</option>
                </select>

                <input
                  type="time"
                  className="input habit-time"
                  value={r.time}
                  onChange={(e) => updateReminder(r.id, { time: e.target.value })}
                  aria-label={t('createHabit.reminder.time')}
                />

                <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeReminder(r.id)} aria-label={t('common.remove')}>
                  ×
                </button>

                {r.repeat === 'weekly' && (
                  <div className="habit-weekdays">
                    {weekdayOptions.map((w) => {
                      const checked = (r.weekdays ?? []).includes(w.n)
                      return (
                        <label key={w.n} className={`habit-weekday ${checked ? 'active' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const cur = new Set(r.weekdays ?? [])
                              if (e.target.checked) cur.add(w.n)
                              else cur.delete(w.n)
                              updateReminder(r.id, { weekdays: Array.from(cur) })
                            }}
                          />
                          <span>{w.label}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <span className="sub-hint">{t('createHabit.reminder.hint')}</span>
        </div>

        <label className="field">
          <span className="field-label">{t('createHabit.field.goal')}</span>
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

