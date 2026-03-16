import { useState, useEffect } from 'react'
import { getLocal, setLocal } from '../lib/storage'
import { useI18n } from '../lib/i18n'

export interface MemoItem {
  id: string
  content: string
  pinned: boolean
  createdAt: string
}

const STORAGE_KEY = 'memos'

export default function Memos() {
  const { t } = useI18n()
  const [memos, setMemos] = useState<MemoItem[]>(() => getLocal(STORAGE_KEY, []))
  const [input, setInput] = useState('')

  useEffect(() => {
    setLocal(STORAGE_KEY, memos)
  }, [memos])

  const add = () => {
    const c = input.trim()
    if (!c) return
    setMemos((prev) => [
      { id: crypto.randomUUID(), content: c, pinned: false, createdAt: new Date().toISOString() },
      ...prev,
    ])
    setInput('')
  }

  const togglePin = (id: string) => {
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)))
  }

  const remove = (id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id))
  }

  const sorted = [...memos].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <section className="page">
      <h2 className="page-heading">备忘</h2>
      <div className="memo-form">
        <input
          type="text"
          className="input"
          placeholder="快速记一笔…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className="btn btn-primary" onClick={add}>
          添加
        </button>
      </div>
      <ul className="memo-list">
        {sorted.map((m) => (
          <li key={m.id} className={`memo-item ${m.pinned ? 'pinned' : ''}`}>
            <span className="memo-content">{m.content}</span>
            <div className="memo-actions">
              <button
                type="button"
                className="btn-icon"
                onClick={() => togglePin(m.id)}
                aria-label={m.pinned ? t('a11y.unpin') : t('a11y.pin')}
                title={m.pinned ? t('a11y.unpin') : t('a11y.pin')}
              >
                📌
              </button>
              <button type="button" className="btn-icon" onClick={() => remove(m.id)} aria-label={t('a11y.delete')}>
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
      {memos.length === 0 && (
        <p className="empty-hint">暂无备忘，在上方快速记一笔</p>
      )}
    </section>
  )
}
