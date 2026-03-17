import { useParams, useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getContacts, setContacts } from '../lib/store'
import './ContactDetail.css'

export default function ContactDetail() {
  const { t, lang } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const locale = lang === 'zh' ? 'zh-CN' : 'en'
  const contacts = getContacts()
  const contact = id ? contacts.find((c) => c.id === id) : null

  if (!contact) {
    navigate('/contacts')
    return null
  }

  const remove = () => {
    if (!window.confirm(t('contact.deleteConfirm'))) return
    setContacts(contacts.filter((c) => c.id !== id))
    navigate('/contacts')
  }

  const dash = '—'

  return (
    <section className="page contact-detail-page">
      <div className="contact-detail-header">
        <button type="button" className="btn" onClick={() => navigate('/contacts')}>{t('detail.back')}</button>
        <button type="button" className="btn" onClick={() => navigate(`/edit/contact/${id}`)}>
          {t('detail.edit')}
        </button>
        <button type="button" className="btn danger" onClick={remove}>
          {t('detail.delete')}
        </button>
      </div>
      <div className="contact-detail-hero">
        <span className="contact-detail-avatar">
          {contact.avatarDataUrl ? (
            <img src={contact.avatarDataUrl} alt={contact.name} />
          ) : (
            contact.name.charAt(0)
          )}
        </span>
        <h1 className="contact-detail-name">{contact.name}</h1>
      </div>
      <dl className="contact-detail-meta">
        {contact.phone && (
          <>
            <dt>{t('contactDetail.phone')}</dt>
            <dd>{contact.phone}</dd>
          </>
        )}
        {contact.email && (
          <>
            <dt>{t('contactDetail.email')}</dt>
            <dd>{contact.email}</dd>
          </>
        )}
        {contact.company && (
          <>
            <dt>{t('contactDetail.company')}</dt>
            <dd>{contact.company}</dd>
          </>
        )}
        {contact.note && (
          <>
            <dt>{t('contactDetail.note')}</dt>
            <dd>{contact.note}</dd>
          </>
        )}
        {contact.birthday && (
          <>
            <dt>{t('contactDetail.birthday')}</dt>
            <dd>{new Date(contact.birthday + 'T12:00:00').toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
          </>
        )}
      </dl>

      {contact.events.length > 0 && (
        <div className="contact-detail-events">
          <h2 className="contact-detail-events-title">{t('createContact.events')}</h2>
          <ul className="contact-events-list">
            {contact.events.map((ev) => (
              <li key={ev.id} className="contact-event-detail">
                <p className="contact-event-desc">{ev.description || dash}</p>
                {ev.time && (
                  <p className="contact-event-meta">
                    {t('contactEvent.time')}: {new Date(ev.time).toLocaleString(locale)}
                  </p>
                )}
                {ev.location && (
                  <p className="contact-event-meta">
                    {t('contactEvent.location')}: {ev.location}
                  </p>
                )}
                {ev.attachments.length > 0 && (
                  <div className="contact-event-photos">
                    {ev.attachments.map((a) =>
                      a.type.startsWith('image/') ? (
                        <img key={a.id} src={a.dataUrl} alt={a.name} className="contact-event-photo" />
                      ) : (
                        <a key={a.id} href={a.dataUrl} download={a.name} className="contact-event-file">📎 {a.name}</a>
                      )
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
