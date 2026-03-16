import { useState, useEffect } from 'react'
import { getLocal, setLocal } from '../lib/storage'
import { useI18n } from '../lib/i18n'

export interface ScheduleEvent {
  id: string
  title: string
  start: string
  end: string
  createdAt: string
}

const STORAGE_KEY = 'schedule'

export default function Schedule() {
  const { t } = useI18n()
  const [events, setEvents] = useState<ScheduleEvent[]>(() => getLocal(STORAGE_KEY, []))
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  useEffect(() => {
    setLocal(STORAGE_KEY, events)
  }, [events])

  const add = () => {
    const t = title.trim()
    if (!t || !start) return
    const s = start.slice(0, 16)
    const e = end ? end.slice(0, 16) : s
    setEvents((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: t, start: s, end: e, createdAt: new Date().toISOString() },
    ])
    setTitle('')
    setStart('')
    setEnd('')
  }

  const remove = (id: string) => {
    setEvents((prev) => prev.filter((i) => i.id !== id))
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  return (
    <section className="page">
      <h2 className="page-heading">日程规划</h2>
      <div className="schedule-form form-grid">
        <input
          type="text"
          className="input"
          placeholder="事件标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="label">
          开始
          <input
            type="datetime-local"
            className="input"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="label">
          结束
          <input
            type="datetime-local"
            className="input"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={add}>
          添加日程
        </button>
      </div>
      <ul className="event-list">
        {sorted.map((ev) => (
          <li key={ev.id} className="event-item">
            <div>
              <strong>{ev.title}</strong>
              <div className="event-time">
                {formatDate(ev.start)} — {formatDate(ev.end)}
              </div>
            </div>
            <button type="button" className="btn-icon" onClick={() => remove(ev.id)} aria-label={t('a11y.delete')}>
              ×
            </button>
          </li>
        ))}
      </ul>
      {events.length === 0 && (
        <p className="empty-hint">暂无日程，添加一条试试</p>
      )}
    </section>
  )
}
