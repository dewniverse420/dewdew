import { useState, useEffect } from 'react'
import { getLocal, setLocal } from '../lib/storage'
import { useI18n } from '../lib/i18n'

export interface TodoItem {
  id: string
  title: string
  done: boolean
  createdAt: string
}

const STORAGE_KEY = 'todos'

export default function Todos() {
  const { t } = useI18n()
  const [items, setItems] = useState<TodoItem[]>(() => getLocal(STORAGE_KEY, []))
  const [input, setInput] = useState('')

  useEffect(() => {
    setLocal(STORAGE_KEY, items)
  }, [items])

  const add = () => {
    const t = input.trim()
    if (!t) return
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: t, done: false, createdAt: new Date().toISOString() },
    ])
    setInput('')
  }

  const toggle = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  }

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <section className="page">
      <h2 className="page-heading">待办事项</h2>
      <div className="todo-form">
        <input
          type="text"
          className="input"
          placeholder="添加待办…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className="btn btn-primary" onClick={add}>
          添加
        </button>
      </div>
      <ul className="todo-list">
        {items.map((item) => (
          <li key={item.id} className={`todo-item ${item.done ? 'done' : ''}`}>
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggle(item.id)}
              aria-label={`${t('a11y.complete')}：${item.title}`}
            />
            <span className="todo-title">{item.title}</span>
            <button type="button" className="btn-icon" onClick={() => remove(item.id)} aria-label={t('a11y.delete')}>
              ×
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="empty-hint">暂无待办，在上方添加一条吧</p>
      )}
    </section>
  )
}
