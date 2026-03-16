import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import {
  getFirebaseAuth,
  signInWithEmail,
  signUpWithEmail,
  isFirebaseConfigured,
} from '../lib/firebase'
import './AuthGate.css'

const MAIN_SITE_LOGIN_URL =
  import.meta.env.VITE_MAIN_SITE_LOGIN_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin.replace(/\/app\/?$/, '')}/` : 'https://www.dewniverse.me/')

export default function AuthGate() {
  const { t, lang } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFirebaseConfigured() || !getFirebaseAuth()) return
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password)
      } else {
        await signInWithEmail(email.trim(), password)
      }
    } catch (err: any) {
      setError(err?.message || t('auth.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-gate">
      <div className="auth-gate-card">
        <h1 className="auth-gate-title">{t('auth.gateTitle')}</h1>
        <p className="auth-gate-hint">{t('auth.gateHint')}</p>
        <a
          href={MAIN_SITE_LOGIN_URL}
          className="auth-gate-main-link"
        >
          {t('auth.goToMainLogin')}
        </a>
        <p className="auth-gate-divider">{t('auth.orLoginHere')}</p>
        <form className="auth-gate-form" onSubmit={handleSubmit}>
          <label className="auth-gate-field">
            <span className="auth-gate-label">{t('auth.email')}</span>
            <input
              type="email"
              className="input auth-gate-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="auth-gate-field">
            <span className="auth-gate-label">{t('auth.password')}</span>
            <input
              type="password"
              className="input auth-gate-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
            />
          </label>
          {error && <p className="auth-gate-error" role="alert">{error}</p>}
          <div className="auth-gate-actions">
            <button
              type="submit"
              className="btn btn-primary auth-gate-btn"
              disabled={loading}
            >
              {loading ? (lang === 'zh' ? '提交中…' : 'Submitting…') : (isSignUp ? t('auth.signUp') : t('auth.login'))}
            </button>
            <button
              type="button"
              className="btn auth-gate-switch"
              onClick={() => { setIsSignUp((v) => !v); setError('') }}
            >
              {isSignUp ? (lang === 'zh' ? '已有账号？登录' : 'Have an account? Sign in') : (lang === 'zh' ? '没有账号？注册' : 'No account? Sign up')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
