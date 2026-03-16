import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTodos, getQuickNotes } from '../lib/store'
import { getItemTime, isTodo } from '../types'
import type { TimelineItem } from '../types'
import './TimelineView.css'

type ViewMode = 'list' | 'calendar'

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function TimelineView() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const todos = getTodos()
  const quickNotes = getQuickNotes()

  const items: TimelineItem[] = useMemo(() => {
    const merged: TimelineItem[] = [...todos, ...quickNotes]
    return merged.sort((a, b) => new Date(getItemTime(a)).getTime() - new Date(getItemTime(b)).getTime())
  }, [todos, quickNotes])

  const byDay = useMemo(() => {
    const map = new Map<string, TimelineItem[]>()
    items.forEach((item) => {
      const t = getItemTime(item)
      const day = t.slice(0, 10)
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(item)
    })
    return map
  }, [items])

  const dayKeys = useMemo(() => Array.from(byDay.keys()).sort(), [byDay])

  if (items.length === 0) {
    return (
      <section className="page timeline-page">
        <h2 className="page-heading">时间轴</h2>
        <p className="empty-hint">暂无内容，创建待办或随记后会按时间显示在这里</p>
      </section>
    )
  }

  return (
    <section className="page timeline-page">
      <div className="page-heading-row">
        <h2 className="page-heading">时间轴</h2>
        <div className="timeline-view-toggle">
          <button
            type="button"
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            列表
          </button>
          <button
            type="button"
            className={viewMode === 'calendar' ? 'active' : ''}
            onClick={() => setViewMode('calendar')}
          >
            按日
          </button>
        </div>
      </div>
      <p className="timeline-desc">按时间展示待办与随记</p>

      {viewMode === 'list' && (
        <ul className="timeline-list">
          {items.map((item) => (
            <li key={item.id} className={`timeline-item timeline-item--${item.type}`}>
              <Link to={`/item/${item.type}/${item.id}`} className="timeline-item-inner">
                <span className="timeline-item-time">{formatTime(getItemTime(item))}</span>
                <span className="timeline-item-type">{item.type === 'todo' ? '待办' : '随记'}</span>
                <span className="timeline-item-title">
                  {isTodo(item) ? item.title : (item.content?.slice(0, 40) || '无内容') + (item.content?.length > 40 ? '…' : '')}
                </span>
                <span className="timeline-item-day">{formatDay(getItemTime(item))}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {viewMode === 'calendar' && (
        <div className="timeline-by-day">
          {dayKeys.map((day) => (
            <div key={day} className="timeline-day-block">
              <h3 className="timeline-day-title">{formatDay(day + 'T12:00:00')}</h3>
              <ul className="timeline-day-list">
                {byDay.get(day)!.map((item) => (
                  <li key={item.id}>
                    <Link to={`/item/${item.type}/${item.id}`} className="timeline-day-item">
                      <span className="timeline-day-type">{item.type === 'todo' ? '待办' : '随记'}</span>
                      <span className="timeline-day-label">
                        {isTodo(item) ? item.title : item.content?.slice(0, 50) || '无内容'}
                      </span>
                      <span className="timeline-day-time">{formatTime(getItemTime(item))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
