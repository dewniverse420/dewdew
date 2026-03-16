import { useState, useRef, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useI18n } from './lib/i18n'
import { recognizeTextFromImage, textToTodoPrefill } from './lib/ocr'
import Spinner from './components/Spinner'
import Create from './pages/Create'
import CreateTodo from './pages/CreateTodo'
import CreateGoal from './pages/CreateGoal'
import CreateQuickNote from './pages/CreateQuickNote'
import CreateFinance from './pages/CreateFinance'
import CreateContact from './pages/CreateContact'
import ItemDetail from './pages/ItemDetail'
import TodosView from './pages/TodosView'
import NotesView from './pages/NotesView'
import FinanceView from './pages/FinanceView'
import ContactsView from './pages/ContactsView'
import ContactDetail from './pages/ContactDetail'
import AddToHomePrompt from './components/AddToHomePrompt'
import ThemeSettings from './components/ThemeSettings'
import DataSettings from './components/DataSettings'
import AnalysisPanel from './components/AnalysisPanel'
import AuthStatus from './components/AuthStatus'
import ReminderSettings from './components/ReminderSettings'
import { checkAndNotify, getReminderEnabled, getNotificationPermission } from './lib/reminder'
import './App.css'
import './components/ThemeSettings.css'
import './components/DataSettings.css'
import './components/ReminderSettings.css'
import './components/AnalysisPanel.css'
import './pages/pages.css'
import './pages/Create.css'
import './pages/CreateTodo.css'
import './pages/ItemDetail.css'
import './pages/TodosView.css'
import './pages/NotesView.css'
import './pages/FinanceView.css'
import './pages/CreateFinance.css'
import './pages/ContactsView.css'
import './pages/CreateContact.css'
import './pages/ContactDetail.css'

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)

function App() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const captureInputRef = useRef<HTMLInputElement>(null)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaMessage, setMediaMessage] = useState('')
  const [showCameraMenu, setShowCameraMenu] = useState(false)
  const cameraWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showCameraMenu) return
    const close = (e: MouseEvent) => {
      if (cameraWrapRef.current && !cameraWrapRef.current.contains(e.target as Node))
        setShowCameraMenu(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showCameraMenu])

  useEffect(() => {
    if (getNotificationPermission() !== 'granted' || !getReminderEnabled()) return
    checkAndNotify(lang)
    const id = setInterval(() => checkAndNotify(lang), 60 * 1000)
    return () => clearInterval(id)
  }, [lang])

  const openUpload = () => {
    setShowCameraMenu(false)
    fileInputRef.current?.click()
  }

  const openCapture = () => {
    setShowCameraMenu(false)
    captureInputRef.current?.click()
  }

  const processImageFile = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  const handleOcrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setMediaMessage(t('ocr.recognizing'))
    setMediaLoading(true)
    try {
      const [text, dataUrl] = await Promise.all([
        recognizeTextFromImage(file),
        processImageFile(file),
      ])
      const { title, description } = textToTodoPrefill(text)
      const attachment = {
        id: crypto.randomUUID(),
        name: file.name || 'image.jpg',
        type: file.type,
        dataUrl,
      }
      navigate('/create/todo', { state: { prefilled: { title, description }, attachment } })
    } catch {
      setMediaMessage(t('ocr.error'))
      setTimeout(() => setMediaLoading(false), 1500)
      return
    }
    setMediaLoading(false)
  }

  const handleVoiceClick = () => {
    if (!SpeechRecognitionAPI) {
      alert(t('ocr.voiceUnsupported'))
      return
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    setMediaMessage(t('ocr.speakHint'))
    setMediaLoading(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      const title = transcript.slice(0, 200)
      const description = transcript.length > 200 ? transcript.slice(200) : ''
      setMediaLoading(false)
      navigate('/create/todo', { state: { prefilled: { title, description } } })
    }
    recognition.onerror = () => {
      setMediaMessage(t('ocr.voiceError'))
      setMediaLoading(false)
    }
    recognition.onend = () => setMediaLoading(false)
    recognition.start()
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">{t('a11y.skipToContent')}</a>
      <AddToHomePrompt />
      <header className="app-header">
        <div className="container app-header-inner">
          <div className="app-brand-wrap">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              className="app-logo"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="app-brand">
              <h1 className="app-title">{t('app.title')}</h1>
              <p className="app-tagline">{t('app.tagline')}</p>
            </div>
          </div>
          <div className="app-header-actions">
            <AuthStatus />
            <ReminderSettings />
            <AnalysisPanel />
            <DataSettings />
            <ThemeSettings />
          </div>
        </div>
      </header>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={handleOcrFile}
      />
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        onChange={handleOcrFile}
      />
      {mediaLoading && (
        <div className="app-loading-overlay" role="status" aria-live="polite" aria-describedby="app-loading-message">
          <Spinner size="large" />
          <p id="app-loading-message" className="app-loading-text">{mediaMessage}</p>
        </div>
      )}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/todos" replace />} />
            <Route path="/todos" element={<TodosView />} />
            <Route path="/create" element={<Create />} />
            <Route path="/create/todo" element={<CreateTodo />} />
            <Route path="/create/goal" element={<CreateGoal />} />
            <Route path="/create/quicknote" element={<CreateQuickNote />} />
            <Route path="/create/finance" element={<CreateFinance />} />
            <Route path="/create/contact" element={<CreateContact />} />
            <Route path="/edit/todo/:id" element={<CreateTodo />} />
            <Route path="/edit/quicknote/:id" element={<CreateQuickNote />} />
            <Route path="/edit/contact/:id" element={<CreateContact />} />
            <Route path="/edit/finance/:id" element={<CreateFinance />} />
            <Route path="/notes" element={<NotesView />} />
            <Route path="/finance" element={<FinanceView />} />
            <Route path="/contacts" element={<ContactsView />} />
            <Route path="/contact/:id" element={<ContactDetail />} />
            <Route path="/item/:type/:id" element={<ItemDetail />} />
          </Routes>
        </div>
      </main>
      <nav className="bottom-nav" aria-label={t('nav.mainAriaLabel')}>
        <div className="container nav-inner">
          <NavLink to="/todos" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-label">{t('nav.todos')}</span>
          </NavLink>
          <NavLink to="/notes" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-label">{t('nav.notes')}</span>
          </NavLink>
          <div className="nav-camera-wrap" ref={cameraWrapRef}>
            <button
              type="button"
              className="nav-item nav-item--icon"
              onClick={() => setShowCameraMenu((v) => !v)}
              disabled={mediaLoading}
              aria-label={t('ocr.fromImage')}
              aria-haspopup="true"
              aria-expanded={showCameraMenu}
            >
              <span className="nav-icon-circle" aria-hidden>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6-10h-1.2l-1.2-1.5c-.2-.2-.4-.3-.7-.3H9.1c-.3 0-.5.1-.7.3L7.2 5H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H6V7h1.5l1.2-1.5h6.6l1.2 1.5H18v10z" />
                </svg>
              </span>
            </button>
            {showCameraMenu && (
              <div className="nav-camera-menu" role="menu" aria-label={t('ocr.fromImage')}>
                <button type="button" role="menuitem" className="nav-camera-menu-item" onClick={openUpload}>
                  {t('ocr.uploadImage')}
                </button>
                <button type="button" role="menuitem" className="nav-camera-menu-item" onClick={openCapture}>
                  {t('ocr.takePhoto')}
                </button>
              </div>
            )}
          </div>
          <NavLink
            to="/create"
            className={({ isActive }) => `nav-item nav-item--plus ${isActive ? 'active' : ''}`}
            aria-label={t('nav.create')}
          >
            <span className="nav-plus">+</span>
          </NavLink>
          <button
            type="button"
            className="nav-item nav-item--icon"
            onClick={handleVoiceClick}
            disabled={mediaLoading}
            aria-label={t('ocr.fromVoice')}
          >
            <span className="nav-icon-circle" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
              </svg>
            </span>
          </button>
          <NavLink to="/finance" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-label">{t('nav.finance')}</span>
          </NavLink>
          <NavLink to="/contacts" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-label">{t('nav.contacts')}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}

export default App
