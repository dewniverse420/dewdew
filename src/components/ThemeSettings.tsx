import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../lib/i18n'

const THEME_KEY = 'app-theme'

export type ThemeId = 'cyan' | 'pink' | 'blue' | 'red' | 'orange' | 'purple' | 'black'

const THEMES: { id: ThemeId; label: string; color: string }[] = [
  { id: 'cyan', label: '青', color: '#0891b2' },
  { id: 'pink', label: '粉', color: '#ec4899' },
  { id: 'blue', label: '蓝', color: '#2563eb' },
  { id: 'red', label: '红', color: '#dc2626' },
  { id: 'orange', label: '橙', color: '#ea580c' },
  { id: 'purple', label: '紫', color: '#7c3aed' },
  { id: 'black', label: '黑', color: '#171717' },
]

function getStoredTheme(): ThemeId {
  try {
    const v = localStorage.getItem(THEME_KEY) as ThemeId | null
    if (v && THEMES.some((t) => t.id === v)) return v
  } catch {}
  return 'cyan'
}

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id)
  document.documentElement.style.removeProperty('--color-primary')
  document.documentElement.style.removeProperty('--color-primary-hover')
  document.documentElement.style.removeProperty('--color-primary-light')
  document.documentElement.style.removeProperty('--color-accent')
  document.documentElement.style.removeProperty('--color-accent-light')
}

export default function ThemeSettings() {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  return (
    <div className="theme-settings" ref={panelRef}>
      <button
        type="button"
        className="theme-settings-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('a11y.themeSettings')}
        aria-expanded={open}
      >
        <span className="theme-settings-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M12 2l8 10-8 10-8-10 8-10z" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="theme-settings-panel">
          <button
            type="button"
            className="theme-settings-close"
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
          >
            ×
          </button>
          <span className="theme-settings-label">{t('settings.theme')}</span>
          <div className="theme-settings-options">
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`theme-settings-option ${theme === item.id ? 'active' : ''}`}
                onClick={() => {
                  setTheme(item.id)
                  setOpen(false)
                }}
                title={item.label}
                aria-label={item.label}
                style={{ ['--option-color' as string]: item.color }}
              />
            ))}
          </div>
          <span className="theme-settings-label theme-settings-label--top">{t('settings.language')}</span>
          <div className="theme-settings-lang">
            <button
              type="button"
              className={`theme-settings-lang-btn ${lang === 'zh' ? 'active' : ''}`}
              onClick={() => setLang('zh')}
            >
              {t('settings.lang.zh')}
            </button>
            <button
              type="button"
              className={`theme-settings-lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              {t('settings.lang.en')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
