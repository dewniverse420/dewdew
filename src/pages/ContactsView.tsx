import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getContacts } from '../lib/store'
import type { Contact, ContactEvent } from '../types'
import './ContactsView.css'

function formatEventTime(iso: string, locale: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString(locale, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getEventFirstImage(ev: ContactEvent): string | null {
  const a = ev.attachments?.find((x) => x.type.startsWith('image/'))
  return a ? a.dataUrl : null
}

export default function ContactsView() {
  const { t, lang } = useI18n()
  const locale = lang === 'zh' ? 'zh-CN' : 'en'
  const contacts = getContacts()

  if (contacts.length === 0) {
    return (
      <section className="page contacts-page">
        <h2 className="page-heading">{t('contacts.heading')}</h2>
        <p className="contacts-empty">{t('contacts.empty')}</p>
      </section>
    )
  }

  return (
    <section className="page contacts-page">
      <h2 className="page-heading">{t('contacts.heading')}</h2>
      <div className="contacts-cards">
        {contacts.map((c) => (
          <div key={c.id} className="contacts-block">
            <Link to={`/contact/${c.id}`} className="contacts-namecard">
              <div className="contacts-namecard-head">
                <span className="contacts-namecard-avatar">
                  {c.avatarDataUrl ? (
                    <img src={c.avatarDataUrl} alt={c.name} />
                  ) : (
                    c.name.charAt(0)
                  )}
                </span>
                <div className="contacts-namecard-title">
                  <span className="contacts-namecard-name">{c.name}</span>
                  {c.company && <span className="contacts-namecard-company">{c.company}</span>}
                </div>
              </div>
              <div className="contacts-namecard-meta">
                {c.phone && (
                  <span className="contacts-namecard-row">
                    <span className="contacts-namecard-label">{t('contactDetail.phone')}</span>
                    <span className="contacts-namecard-value">{c.phone}</span>
                  </span>
                )}
                {c.email && (
                  <span className="contacts-namecard-row">
                    <span className="contacts-namecard-label">{t('contactDetail.email')}</span>
                    <span className="contacts-namecard-value">{c.email}</span>
                  </span>
                )}
                {c.note && (
                  <span className="contacts-namecard-row">
                    <span className="contacts-namecard-label">{t('contactDetail.note')}</span>
                    <span className="contacts-namecard-value contacts-namecard-note">{c.note}</span>
                  </span>
                )}
              </div>
            </Link>
            {c.events.length > 0 && (
              <div className="contacts-events-wrap">
                <span className="contacts-events-title">{t('createContact.events')}</span>
                <div className="contacts-event-cards">
                  {c.events.map((ev) => {
                    const img = getEventFirstImage(ev)
                    return (
                      <Link key={ev.id} to={`/contact/${c.id}`} className="contacts-event-card">
                        {img && (
                          <span className="contacts-event-card-thumb">
                            <img src={img} alt="" />
                          </span>
                        )}
                        <div className="contacts-event-card-body">
                          <p className="contacts-event-card-desc">{ev.description || '—'}</p>
                          {ev.time && (
                            <span className="contacts-event-card-meta">{formatEventTime(ev.time, locale)}</span>
                          )}
                          {ev.location && (
                            <span className="contacts-event-card-meta">{ev.location}</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
