import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import './Create.css'

export default function Create() {
  const { t } = useI18n()

  return (
    <section className="page create-page">
      <h2 className="page-heading">{t('create.heading')}</h2>
      <p className="create-desc">{t('create.desc')}</p>
      <div className="create-cards">
        <Link to="/create/goal" className="create-card create-card--goal">
          <span className="create-card-icon">🎯</span>
          <div className="create-card-body">
            <span className="create-card-label">{t('create.goal')}</span>
            <span className="create-card-hint">{t('create.goal.hint')}</span>
          </div>
        </Link>
        <Link to="/create/todo" className="create-card create-card--todo">
          <span className="create-card-icon">📋</span>
          <div className="create-card-body">
            <span className="create-card-label">{t('create.todo')}</span>
            <span className="create-card-hint">{t('create.todo.hint')}</span>
          </div>
        </Link>
        <Link to="/create/habit" className="create-card create-card--habit">
          <span className="create-card-icon">🔁</span>
          <div className="create-card-body">
            <span className="create-card-label">{t('create.habit')}</span>
            <span className="create-card-hint">{t('create.habit.hint')}</span>
          </div>
        </Link>
        <Link to="/create/quicknote" className="create-card create-card--quicknote">
          <span className="create-card-icon">✏️</span>
          <div className="create-card-body">
            <span className="create-card-label">{t('create.quicknote')}</span>
            <span className="create-card-hint">{t('create.quicknote.hint')}</span>
          </div>
        </Link>
        <Link to="/create/finance" className="create-card create-card--finance">
          <span className="create-card-icon">💰</span>
          <div className="create-card-body">
            <span className="create-card-label">{t('create.finance')}</span>
            <span className="create-card-hint">{t('create.finance.hint')}</span>
          </div>
        </Link>
        <Link to="/create/contact" className="create-card create-card--contact">
          <span className="create-card-icon">👤</span>
          <div className="create-card-body">
            <span className="create-card-label">{t('create.contact')}</span>
            <span className="create-card-hint">{t('create.contact.hint')}</span>
          </div>
        </Link>
      </div>
    </section>
  )
}
