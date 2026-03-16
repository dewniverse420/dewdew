import { useI18n } from '../lib/i18n'
import { isFirebaseConfigured, getFirebaseAuth, signOut } from '../lib/firebase'
import './AuthStatus.css'

export default function AuthStatus() {
  const { t } = useI18n()
  const auth = getFirebaseAuth()
  const user = auth?.currentUser
  if (!isFirebaseConfigured() || !user) return null
  const email = user.email || user.uid.slice(0, 8) + '…'
  return (
    <div className="auth-status">
      <span className="auth-status-email" title={user.email || undefined}>
        {t('auth.loggedInAs')}{email}
      </span>
      <button
        type="button"
        className="btn auth-status-logout"
        onClick={() => signOut()}
      >
        {t('auth.logout')}
      </button>
    </div>
  )
}
