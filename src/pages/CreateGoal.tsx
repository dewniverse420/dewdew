import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getGoals, setGoals } from '../lib/store'
import type { Goal, GoalType } from '../types'
import './CreateTodo.css'

export default function CreateGoal() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [type, setType] = useState<GoalType>('major')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)

  const submit = () => {
    const t = title.trim()
    if (!t) return
    const now = new Date().toISOString()
    const goal: Goal = {
      id: crypto.randomUUID(),
      type,
      title: t,
      createdAt: now,
    }
    if (type === 'year') goal.year = year
    if (type === 'month') {
      goal.year = year
      goal.month = month
    }
    /* custom 仅用 title，无 year/month */
    const list = getGoals()
    setGoals([goal, ...list])
    navigate('/todos')
  }

  const goalTypes: GoalType[] = ['major', 'year', 'month', 'custom']

  return (
    <section className="page create-todo-page">
      <div className="page-heading-row">
        <h2 className="page-heading">{t('createGoal.heading')}</h2>
        <button type="button" className="btn btn-primary" onClick={submit}>
          {t('common.save')}
        </button>
      </div>
      <form className="form-block" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <label className="field">
          <span className="field-label">{t('createGoal.field.type')}</span>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as GoalType)}
          >
            {goalTypes.map((k) => (
              <option key={k} value={k}>{t(`createGoal.goalType.${k}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">{t('createGoal.field.title')}</span>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('createGoal.titlePlaceholder')}
          />
        </label>
        {type === 'year' && (
          <label className="field">
            <span className="field-label">{t('createGoal.field.year')}</span>
            <input
              type="number"
              className="input"
              min={2020}
              max={2030}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
        )}
        {type === 'month' && (
          <>
            <label className="field">
              <span className="field-label">{t('createGoal.field.year')}</span>
              <input
                type="number"
                className="input"
                min={2020}
                max={2030}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </label>
            <label className="field">
              <span className="field-label">{t('createGoal.field.month')}</span>
              <select
                className="input"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m} {t('createGoal.monthSuffix')}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate(-1)}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </section>
  )
}
