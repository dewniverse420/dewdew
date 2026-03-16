import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getContacts, setContacts } from '../lib/store'
import type { Contact, ContactEvent } from '../types'
import AttachmentField from '../components/AttachmentField'
import './CreateContact.css'

const emptyEvent = (): ContactEvent => ({
  id: crypto.randomUUID(),
  description: '',
  time: '',
  location: '',
  attachments: [],
  createdAt: new Date().toISOString(),
})

export default function CreateContact() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const existing = editId ? getContacts().find((c) => c.id === editId) : undefined
  const [name, setName] = useState(existing?.name ?? '')
  const [avatar, setAvatar] = useState<string | null>(existing?.avatarDataUrl ?? null)
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [company, setCompany] = useState(existing?.company ?? '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [birthday, setBirthday] = useState(existing?.birthday ?? '')
  const [events, setEvents] = useState<ContactEvent[]>(existing?.events ?? [])

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const addEvent = () => {
    setEvents((prev) => [...prev, emptyEvent()])
  }

  const updateEvent = (id: string, patch: Partial<ContactEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const submit = () => {
    const n = name.trim()
    if (!n) return
    const now = new Date().toISOString()
    const list = getContacts()
    if (editId && existing) {
      const updated: Contact = {
        ...existing,
        name: n,
        avatarDataUrl: avatar || undefined,
        phone: phone.trim(),
        email: email.trim(),
        company: company.trim(),
        note: note.trim(),
        birthday: birthday.trim() || undefined,
        events: events.map((e) => ({
          ...e,
          id: e.id || crypto.randomUUID(),
          createdAt: e.createdAt || now,
        })),
      }
      setContacts(list.map((c) => (c.id === editId ? updated : c)))
      navigate(`/contact/${editId}`)
    } else {
      const contact: Contact = {
        id: crypto.randomUUID(),
        name: n,
        avatarDataUrl: avatar || undefined,
        phone: phone.trim(),
        email: email.trim(),
        company: company.trim(),
        note: note.trim(),
        birthday: birthday.trim() || undefined,
        events: events.map((e) => ({
          ...e,
          id: e.id || crypto.randomUUID(),
          createdAt: e.createdAt || now,
        })),
        createdAt: now,
      }
      setContacts([contact, ...list])
      navigate('/contacts')
    }
  }

  return (
    <section className="page create-contact-page">
      <div className="page-heading-row">
        <h2 className="page-heading">{editId ? t('detail.edit') : t('createContact.heading')}</h2>
        <button type="button" className="btn btn-primary" onClick={submit}>
          {t('common.save')}
        </button>
      </div>
      <form className="form-block" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div className="contact-avatar-field">
          <div className="contact-avatar-preview">
            {avatar ? (
              <img src={avatar} alt={name || 'avatar'} />
            ) : (
              <span>{name ? name.charAt(0) : '?'}</span>
            )}
          </div>
          <label className="btn contact-avatar-upload">
            {t('createContact.avatar')}
            <input type="file" accept="image/*" hidden onChange={onAvatarChange} />
          </label>
        </div>
        <label className="field">
          <span className="field-label">{t('createContact.name')}</span>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('createContact.namePlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createContact.phone')}</span>
          <input
            type="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('createContact.phonePlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createContact.email')}</span>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('createContact.emailPlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createContact.company')}</span>
          <input
            type="text"
            className="input"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={t('createContact.companyPlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createContact.note')}</span>
          <input
            type="text"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('createContact.notePlaceholder')}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createContact.birthday')}</span>
          <input
            type="date"
            className="input"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </label>

        <div className="contact-events-block">
          <div className="contact-events-header">
            <span className="field-label">{t('createContact.events')}</span>
            <button type="button" className="btn btn-secondary" onClick={addEvent}>
              {t('createContact.addEvent')}
            </button>
          </div>
          {events.map((ev) => (
            <div key={ev.id} className="contact-event-card">
              <div className="contact-event-row">
                <span className="field-label">{t('contactEvent.desc')}</span>
                <button type="button" className="btn btn-sm" onClick={() => removeEvent(ev.id)}>×</button>
              </div>
              <input
                type="text"
                className="input"
                value={ev.description}
                onChange={(e) => updateEvent(ev.id, { description: e.target.value })}
                placeholder={t('contactEvent.descPlaceholder')}
              />
              <label className="field">
                <span className="field-label">{t('contactEvent.time')}</span>
                <input
                  type="datetime-local"
                  className="input"
                  value={ev.time ? ev.time.slice(0, 16) : ''}
                  onChange={(e) => updateEvent(ev.id, { time: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                />
              </label>
              <label className="field">
                <span className="field-label">{t('contactEvent.location')}</span>
                <input
                  type="text"
                  className="input"
                  value={ev.location}
                  onChange={(e) => updateEvent(ev.id, { location: e.target.value })}
                  placeholder={t('contactEvent.locationPlaceholder')}
                />
              </label>
              <div className="field">
                <span className="field-label">{t('contactEvent.photos')}</span>
                <AttachmentField
                  attachments={ev.attachments}
                  onChange={(attachments) => updateEvent(ev.id, { attachments })}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate(-1)}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </section>
  )
}
