import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { isFirebaseConfigured, getFirebaseAuth, signOut } from '../lib/firebase'
import './AuthStatus.css'

export default function AuthStatus() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const auth = getFirebaseAuth()
  const user = auth?.currentUser

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  if (!isFirebaseConfigured() || !user) return null

  const email = user.email || user.uid.slice(0, 8) + '…'

  return (
    <div className="auth-status" ref={panelRef}>
      <button
        type="button"
        className="auth-status-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('auth.accountLabel')}
        aria-expanded={open}
      >
        <span className="auth-status-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="auth-status-panel">
          <button
            type="button"
            className="auth-status-close"
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
          >
            ×
          </button>
          <p className="auth-status-email-wrap">
            <span className="auth-status-label">{t('auth.loggedInAs')}</span>
            <span className="auth-status-email" title={user.email || undefined}>{email}</span>
          </p>
          <button
            type="button"
            className="btn auth-status-logout"
            onClick={() => {
              signOut()
              setOpen(false)
            }}
          >
            {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
