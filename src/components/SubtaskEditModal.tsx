import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../lib/i18n'
import type { Subtask } from '../types'
import './SubtaskEditModal.css'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface SubtaskEditModalProps {
  subtasks: Subtask[]
  onSave: (subtasks: Subtask[]) => void
  onClose: () => void
}

export default function SubtaskEditModal({ subtasks: initial, onSave, onClose }: SubtaskEditModalProps) {
  const { t } = useI18n()
  const [list, setList] = useState<Subtask[]>(() => initial.map((s) => ({ ...s })))
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousActiveRef.current = document.activeElement as HTMLElement | null
    const first = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return
      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('keydown', handleKeyDown)
      if (previousActiveRef.current?.focus) previousActiveRef.current.focus()
    }
  }, [onClose])

  const add = () => {
    setList((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: '', ddl: '', completed: false },
    ])
  }

  const update = (id: string, patch: Partial<Subtask>) => {
    setList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const remove = (id: string) => {
    setList((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSave = () => {
    onSave(list.filter((s) => s.title.trim() !== ''))
    onClose()
  }

  return (
    <div className="subtask-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="subtask-modal-title">
      <div ref={modalRef} className="subtask-modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="subtask-modal-title" className="subtask-modal-title">{t('createTodo.field.subtasks')}</h2>
        <div className="subtask-modal-list">
          {list.map((s) => (
            <div key={s.id} className="subtask-modal-row">
              <input
                type="text"
                className="input subtask-input"
                value={s.title}
                onChange={(e) => update(s.id, { title: e.target.value })}
                placeholder={t('createTodo.subtaskName')}
              />
              <input
                type="datetime-local"
                className="input subtask-ddl"
                value={s.ddl ? s.ddl.slice(0, 16) : ''}
                onChange={(e) => update(s.id, { ddl: e.target.value ? new Date(e.target.value).toISOString() : '' })}
              />
              <label className="subtask-done">
                <input
                  type="checkbox"
                  checked={s.completed}
                  onChange={(e) => update(s.id, { completed: e.target.checked })}
                />
                <span>{t('createTodo.subtaskCompleted')}</span>
              </label>
              <button type="button" className="btn btn-sm" onClick={() => remove(s.id)} aria-label={t('detail.delete')}>×</button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={add}>
            {t('createTodo.addSubtask')}
          </button>
        </div>
        <div className="subtask-modal-actions">
          <button type="button" className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  )
}
