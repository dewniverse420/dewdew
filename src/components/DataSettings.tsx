import { useState, useRef, useEffect } from 'react'
import { exportBackup, importBackup } from '../lib/store'
import { useI18n } from '../lib/i18n'
import './DataSettings.css'

export default function DataSettings() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  const handleExport = () => {
    const data = exportBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `personal-assistant-backup-${data.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ type: 'ok', text: t('data.exportOk') })
    setTimeout(() => setMessage(null), 2000)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const data = JSON.parse(text)
        if (!window.confirm(t('data.importConfirm'))) return
        const result = importBackup(data)
        if (result.ok) {
          setMessage({ type: 'ok', text: t('data.importOk') })
          setTimeout(() => window.location.reload(), 1200)
        } else {
          setMessage({ type: 'err', text: result.error })
        }
      } catch {
        setMessage({ type: 'err', text: t('data.invalidFile') })
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div className="data-settings" ref={panelRef}>
      <button
        type="button"
        className="data-settings-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('a11y.dataSettings')}
        aria-expanded={open}
      >
        <span className="data-settings-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="data-settings-file-input"
        aria-hidden
        onChange={onFileChange}
      />
      {open && (
        <div className="data-settings-panel glass">
          <button
            type="button"
            className="data-settings-close"
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
          >
            ×
          </button>
          <span className="data-settings-label">{t('settings.data')}</span>
          <p className="data-settings-hint">{t('settings.data.hint')}</p>
          <div className="data-settings-actions">
            <button type="button" className="btn btn-primary data-settings-btn" onClick={handleExport}>
              {t('settings.export')}
            </button>
            <button type="button" className="btn data-settings-btn" onClick={handleImport}>
              {t('settings.import')}
            </button>
          </div>
          {message && (
            <p className={`data-settings-message ${message.type === 'err' ? 'error' : ''}`}>
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
