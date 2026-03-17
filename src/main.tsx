import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from './lib/i18n'
import {
  isFirebaseConfigured,
  isFirebaseRequireLogin,
  initFirebase,
  onAuthStateChanged,
} from './lib/firebase'
import type { User } from 'firebase/auth'
import { initStore, resetStore } from './lib/store'
import App from './App'
import LoadingScreen from './components/LoadingScreen'
import AuthGate from './components/AuthGate'
import './index.css'

const root = document.getElementById('root')!

function Bootstrap() {
  const [authState, setAuthState] = React.useState<{ resolved: boolean; user: User | null }>({
    resolved: !isFirebaseConfigured(),
    user: null,
  })
  const [storeReady, setStoreReady] = React.useState(false)
  const lastInitedUidRef = React.useRef<string | null | undefined>(undefined)

  React.useEffect(() => {
    if (!isFirebaseConfigured()) {
      initStore().then(() => setStoreReady(true))
      return
    }
    let unsub: (() => void) | undefined
    initFirebase().then((ok) => {
      if (!ok) {
        setAuthState((s) => ({ ...s, resolved: true }))
        initStore().then(() => setStoreReady(true))
        return
      }
      unsub = onAuthStateChanged((user) => setAuthState({ resolved: true, user }))
    })
    return () => unsub?.()
  }, [])

  React.useEffect(() => {
    if (!authState.resolved) return
    if (!isFirebaseConfigured()) return
    const needGate = isFirebaseRequireLogin() && !authState.user
    if (needGate) {
      setStoreReady(false)
      lastInitedUidRef.current = null
      return
    }
    const currentUid = authState.user?.uid ?? null
    if (currentUid !== lastInitedUidRef.current) {
      lastInitedUidRef.current = currentUid
      resetStore()
      initStore().then(() => setStoreReady(true))
    }
  }, [authState.resolved, authState.user])

  if (!authState.resolved || (!authState.user && isFirebaseConfigured() && isFirebaseRequireLogin() ? false : !storeReady)) {
    return (
      <I18nProvider>
        <LoadingScreen message="" />
      </I18nProvider>
    )
  }
  if (isFirebaseConfigured() && isFirebaseRequireLogin() && !authState.user) {
    return (
      <I18nProvider>
        <AuthGate />
      </I18nProvider>
    )
  }

  React.useEffect(() => {
    if (isFirebaseConfigured() && authState.user) {
      console.warn('[dewdew] Firebase 已连接，用户 uid:', authState.user.uid, '— 新建待办或改财务后数据会出现在 Firestore → users → 该 uid')
    } else if (isFirebaseConfigured()) {
      console.warn('[dewdew] Firebase 已配置但当前未登录，数据不会写入 Firestore')
    } else {
      console.warn('[dewdew] 未检测到 Firebase 配置（无 VITE_FIREBASE_*），数据仅存本地。Vercel 请检查 Environment Variables 并 Redeploy')
    }
  }, [authState.user])

  const basename = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, '') || ''
  return (
    <BrowserRouter basename={basename || undefined}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Bootstrap />
  </React.StrictMode>
)
