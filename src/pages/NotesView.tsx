import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getQuickNotes } from '../lib/store'
import type { QuickNoteItem } from '../types'
import './NotesView.css'

function formatDay(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

function getNoteTime(n: QuickNoteItem): string {
  return n.time || n.createdAt
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10)
}

/** 随记封面图：优先 coverAttachmentId，否则第一张图片 */
function getCoverImageUrl(n: QuickNoteItem): string | null {
  const list = n.attachments?.filter((a) => a.type.startsWith('image/')) ?? []
  if (list.length === 0) return null
  if (n.coverAttachmentId) {
    const cover = list.find((a) => a.id === n.coverAttachmentId)
    if (cover) return cover.dataUrl
  }
  return list[0].dataUrl
}

export default function NotesView() {
  const { t, lang } = useI18n()
  const locale = lang === 'zh' ? 'zh-CN' : 'en'
  const notes = getQuickNotes()

  const sorted = useMemo(
    () => [...notes].sort((a, b) => new Date(getNoteTime(a)).getTime() - new Date(getNoteTime(b)).getTime()),
    [notes]
  )

  const byDay = useMemo(() => {
    const map = new Map<string, QuickNoteItem[]>()
    sorted.forEach((n) => {
      const day = toDateKey(getNoteTime(n))
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(n)
    })
    return map
  }, [sorted])
  const dayKeys = useMemo(() => Array.from(byDay.keys()).sort(), [byDay])

  if (notes.length === 0) {
    return (
      <section className="page notes-page">
        <h2 className="page-heading">{t('notes.heading')}</h2>
        <p className="notes-desc">{t('notes.desc')}</p>
        <p className="empty-hint">{t('notes.empty')}</p>
      </section>
    )
  }

  return (
    <section className="page notes-page">
      <h2 className="page-heading">{t('notes.heading')}</h2>
      <p className="notes-desc">{t('notes.desc')}</p>
      <div className="notes-axis-wrap">
        <div className="notes-axis-line" aria-hidden />
        <div className="notes-axis-content">
          {dayKeys.map((day) => (
            <div key={day} className="notes-axis-day">
              <div className="notes-axis-dot" />
              <div className="notes-axis-day-body">
                <h3 className="notes-axis-day-title">{formatDay(day + 'T12:00:00', locale)}</h3>
                <ul className="notes-axis-event-list">
                  {byDay.get(day)!.map((n) => {
                    const coverUrl = getCoverImageUrl(n)
                    return (
                      <li key={n.id}>
                        <Link to={`/item/quicknote/${n.id}`} className="notes-axis-event">
                          <span className="notes-axis-event-cover">
                            {coverUrl ? (
                              <img src={coverUrl} alt="" />
                            ) : (
                              <span className="notes-axis-event-cover-placeholder" aria-hidden />
                            )}
                          </span>
                          <span className="notes-axis-event-body">
                            <span className="notes-axis-event-time">{formatTime(getNoteTime(n), locale)}</span>
                            <span className="notes-axis-event-preview">
                              {(n.content?.slice(0, 50) || t('notes.noContent')) + (n.content?.length > 50 ? '…' : '')}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
