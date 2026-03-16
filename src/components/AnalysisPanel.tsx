import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { buildTodoSummary } from '../lib/analysisSummary'
import './AnalysisPanel.css'

const AI_API_URL_KEY = 'ai-analysis-api-url'
const AI_API_KEY_KEY = 'ai-analysis-api-key'

export default function AnalysisPanel() {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem(AI_API_URL_KEY) || '')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(AI_API_KEY_KEY) || '')
  const panelRef = useRef<HTMLDivElement>(null)

  const summary = buildTodoSummary(lang)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  const saveApiConfig = () => {
    try {
      if (apiUrl) localStorage.setItem(AI_API_URL_KEY, apiUrl)
      if (apiKey) localStorage.setItem(AI_API_KEY_KEY, apiKey)
    } catch {}
  }

  const handleAnalyze = async () => {
    const url = apiUrl || (import.meta as any).env?.VITE_AI_API_URL
    const key = apiKey || (import.meta as any).env?.VITE_AI_API_KEY
    if (!url || !key) {
      setError(lang === 'zh' ? '请先填写 API 地址和 API Key' : 'Please set API URL and API Key')
      return
    }
    setError('')
    setResult('')
    setLoading(true)
    saveApiConfig()
    const systemPrompt = lang === 'zh'
      ? '你是一个时间管理与效率助手。根据用户提供的待办数据与完成情况，给出简洁的总结、优先级建议与可执行的改进建议。'
      : 'You are a productivity assistant. Based on the user\'s todo list and completion data, give a concise summary, priority suggestions, and actionable advice.'
    const userPrompt = lang === 'zh'
      ? `请分析以下待办数据并给出总结与建议：\n\n${summary}`
      : `Analyze this todo data and give summary and suggestions:\n\n${summary}`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 800,
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || res.statusText)
      }
      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? ''
      setResult(content)
    } catch (e: any) {
      setError(e?.message || (lang === 'zh' ? '请求失败' : 'Request failed'))
    } finally {
      setLoading(false)
    }
  }

  const copySummary = () => {
    navigator.clipboard.writeText(summary).then(() => {
      if (lang === 'zh') alert('已复制到剪贴板')
      else alert('Copied to clipboard')
    })
  }

  return (
    <div className="analysis-panel" ref={panelRef}>
      <button
        type="button"
        className="analysis-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('analysis.open')}
        aria-expanded={open}
        title={t('analysis.open')}
      >
        <span className="analysis-trigger-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <line x1="6" y1="18" x2="6" y2="12" />
            <line x1="12" y1="18" x2="12" y2="8" />
            <line x1="18" y1="18" x2="18" y2="4" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="analysis-dropdown">
          <div className="analysis-dropdown-header">
            <span className="analysis-dropdown-title">{t('analysis.title')}</span>
            <button type="button" className="analysis-close" onClick={() => setOpen(false)} aria-label={t('common.cancel')}>×</button>
          </div>
          <p className="analysis-summary-label">{t('analysis.summaryLabel')}</p>
          <div className="analysis-summary-box">
            <pre className="analysis-summary-text">{summary || (lang === 'zh' ? '暂无待办数据' : 'No todo data')}</pre>
          </div>
          <div className="analysis-actions">
            <button type="button" className="btn btn-secondary" onClick={copySummary}>{t('analysis.copy')}</button>
          </div>
          <label className="analysis-field">
            <span>{lang === 'zh' ? 'API 地址（可选，可填代理）' : 'API URL (optional)'}</span>
            <input
              type="text"
              className="input"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.openai.com/v1/chat/completions"
            />
          </label>
          <label className="analysis-field">
            <span>{lang === 'zh' ? 'API Key' : 'API Key'}</span>
            <input
              type="password"
              className="input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </label>
          <button
            type="button"
            className="btn btn-primary analysis-analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? t('analysis.analyzing') : t('analysis.analyze')}
          </button>
          {error && <p className="analysis-error">{error}</p>}
          {result && (
            <div className="analysis-result">
              <p className="analysis-result-label">{t('analysis.resultLabel')}</p>
              <div className="analysis-result-box">
                <pre className="analysis-result-text">{result}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
