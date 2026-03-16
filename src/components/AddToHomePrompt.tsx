import { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'

const DISMISS_KEY = 'pwa-add-to-home-dismissed'

export default function AddToHomePrompt() {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
    setStandalone(isStandalone)
    if (isStandalone) return
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (!dismissed) setShow(true)
    } catch {
      setShow(false)
    }
  }, [])

  const dismiss = () => {
    setShow(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
  }

  if (!show || standalone) return null

  return (
    <div className="add-to-home" role="banner">
      <span>{t('addToHome.message')}</span>
      <button type="button" onClick={dismiss} aria-label={t('addToHome.close')}>{t('addToHome.close')}</button>
    </div>
  )
}
