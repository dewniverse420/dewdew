import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getQuickNotes, setQuickNotes } from '../lib/store'
import type { QuickNoteItem } from '../types'
import { isoToLocalDatetimeLocal } from '../lib/datetime'
import AttachmentField from '../components/AttachmentField'
import './CreateTodo.css'

export default function CreateQuickNote() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const now = new Date()
  const defaultTime = isoToLocalDatetimeLocal(now.toISOString())
  const existing = editId ? getQuickNotes().find((n) => n.id === editId) : undefined
  const [source, setSource] = useState(existing?.source ?? '')
  const [content, setContent] = useState(existing?.content ?? '')
  const [time, setTime] = useState(
    existing?.time ? isoToLocalDatetimeLocal(existing.time) : defaultTime
  )
  const [location, setLocation] = useState(existing?.location ?? '')
  const [link, setLink] = useState(existing?.link ?? '')
  const [attachments, setAttachments] = useState<QuickNoteItem['attachments']>(existing?.attachments ?? [])
  const [coverAttachmentId, setCoverAttachmentId] = useState<string | null>(existing?.coverAttachmentId ?? null)

  const submit = () => {
    const created = new Date().toISOString()
    if (editId && existing) {
      const updated: QuickNoteItem = {
        ...existing,
        source: source.trim(),
        content: content.trim(),
        time: time ? new Date(time).toISOString() : created,
        location: location.trim(),
        link: link.trim() || undefined,
        attachments,
        coverAttachmentId: coverAttachmentId || undefined,
      }
      const list = getQuickNotes()
      setQuickNotes(list.map((n) => (n.id === editId ? updated : n)))
      navigate(`/item/quicknote/${editId}`)
    } else {
      const item: QuickNoteItem = {
        id: crypto.randomUUID(),
        type: 'quicknote',
        source: source.trim(),
        content: content.trim(),
        time: time ? new Date(time).toISOString() : created,
        location: location.trim(),
        link: link.trim() || undefined,
        attachments,
        coverAttachmentId: coverAttachmentId || undefined,
        createdAt: created,
      }
      const list = getQuickNotes()
      setQuickNotes([item, ...list])
      navigate('/notes')
    }
  }

  return (
    <section className="page create-quicknote-page">
      <div className="page-heading-row">
        <h2 className="page-heading">{editId ? t('detail.edit') : t('createNote.heading')}</h2>
        <button type="button" className="btn btn-primary" onClick={submit}>
          {t('common.save')}
        </button>
      </div>
      <form className="form-block" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <label className="field">
          <span className="field-label">{t('createNote.field.source')}</span>
          <input
            type="text"
            className="input"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={t('createNote.sourcePlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createNote.field.content')}</span>
          <textarea
            className="input textarea"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('createNote.contentPlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createNote.field.time')}</span>
          <input
            type="datetime-local"
            className="input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createNote.field.location')}</span>
          <input
            type="text"
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('createNote.locationPlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createNote.field.link')}</span>
          <input
            type="url"
            className="input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={t('createNote.linkPlaceholder')}
          />
        </label>
        <div className="field">
          <span className="field-label">{t('createNote.field.attachments')}</span>
          <AttachmentField
            attachments={attachments}
            onChange={setAttachments}
            coverAttachmentId={coverAttachmentId}
            onCoverChange={setCoverAttachmentId}
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
