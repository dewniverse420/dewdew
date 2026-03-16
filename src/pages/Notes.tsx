import { useState, useEffect } from 'react'
import { getLocal, setLocal } from '../lib/storage'

export interface NoteItem {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'notes'

export default function Notes() {
  const [notes, setNotes] = useState<NoteItem[]>(() => getLocal(STORAGE_KEY, []))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    setLocal(STORAGE_KEY, notes)
  }, [notes])

  const selected = notes.find((n) => n.id === selectedId)

  const openEditor = (note?: NoteItem) => {
    if (note) {
      setSelectedId(note.id)
      setEditTitle(note.title)
      setEditContent(note.content)
    } else {
      const now = new Date().toISOString()
      const newNote: NoteItem = {
        id: crypto.randomUUID(),
        title: '',
        content: '',
        createdAt: now,
        updatedAt: now,
      }
      setNotes((prev) => [newNote, ...prev])
      setSelectedId(newNote.id)
      setEditTitle('')
      setEditContent('')
    }
  }

  const save = () => {
    if (!selectedId) return
    const now = new Date().toISOString()
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, title: editTitle.trim() || '无标题', content: editContent, updatedAt: now }
          : n
      )
    )
    setSelectedId(null)
  }

  const remove = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const closeEditor = () => {
    if (selected && (editTitle !== selected.title || editContent !== selected.content)) {
      save()
    } else if (selected && !selected.title && !selected.content) {
      remove(selected.id)
    }
    setSelectedId(null)
  }

  if (selectedId && selected) {
    return (
      <section className="page">
        <div className="note-editor-header">
          <button type="button" className="btn" onClick={closeEditor}>
            返回
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            保存
          </button>
        </div>
        <input
          type="text"
          className="input note-title-input"
          placeholder="标题"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
        />
        <textarea
          className="input note-content-input"
          placeholder="内容…"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={12}
        />
      </section>
    )
  }

  return (
    <section className="page">
      <div className="page-heading-row">
        <h2 className="page-heading">记事</h2>
        <button type="button" className="btn btn-primary" onClick={() => openEditor()}>
          新建
        </button>
      </div>
      <ul className="note-list">
        {notes.map((n) => (
          <li key={n.id} className="note-item" onClick={() => openEditor(n)}>
            <strong>{n.title || '无标题'}</strong>
            <p className="note-preview">{n.content ? `${n.content.slice(0, 60)}${n.content.length > 60 ? '…' : ''}` : '暂无内容'}</p>
            <span className="note-meta">
              {new Date(n.updatedAt).toLocaleDateString('zh-CN')}
            </span>
          </li>
        ))}
      </ul>
      {notes.length === 0 && (
        <p className="empty-hint">暂无记事，点击「新建」添加</p>
      )}
    </section>
  )
}
