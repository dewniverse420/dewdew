import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import {
  getReminderEnabled,
  setReminderEnabled,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
} from '../lib/reminder'
import './ReminderSettings.css'

export default function ReminderSettings() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [enabled, setEnabled] = useState(getReminderEnabled)
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission())
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  const handleMasterOn = () => {
    setReminderEnabled(true)
    setEnabled(true)
  }

  const handleMasterOff = () => {
    setReminderEnabled(false)
    setEnabled(false)
  }

  const handleRequestPermission = async () => {
    const p = await requestNotificationPermission()
    setPermission(p)
  }

  return (
    <div className="reminder-settings" ref={panelRef}>
      <button
        type="button"
        className="reminder-settings-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('reminder.title')}
        aria-expanded={open}
      >
        <span className="reminder-settings-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="reminder-settings-panel">
          <button
            type="button"
            className="reminder-settings-close"
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
          >
            ×
          </button>
          <span className="reminder-settings-label">{t('reminder.title')}</span>
          <p className="reminder-settings-hint">{t('reminder.hint')}</p>
          {!isNotificationSupported() && (
            <p className="reminder-settings-unsupported">{t('reminder.unsupported')}</p>
          )}
          {isNotificationSupported() && permission !== 'granted' && (
            <button type="button" className="btn reminder-settings-permission" onClick={handleRequestPermission}>
              {permission === 'denied' ? t('reminder.permissionDenied') : t('reminder.enable')}
            </button>
          )}
          {isNotificationSupported() && (
            <>
              <span className="reminder-settings-label reminder-settings-label--top">{t('reminder.masterSwitch')}</span>
              <div className="reminder-settings-master">
                <button
                  type="button"
                  className={`btn reminder-master-btn ${enabled ? 'active' : ''}`}
                  onClick={handleMasterOn}
                >
                  {t('reminder.masterOn')}
                </button>
                <button
                  type="button"
                  className={`btn reminder-master-btn ${!enabled ? 'active' : ''}`}
                  onClick={handleMasterOff}
                >
                  {t('reminder.masterOff')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
