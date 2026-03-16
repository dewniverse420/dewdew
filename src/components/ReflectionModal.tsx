import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../lib/i18n'
import './ReflectionModal.css'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface ReflectionModalProps {
  todoTitle: string
  initialText?: string
  onSave: (text: string) => void
  onClose: () => void
}

export default function ReflectionModal({ todoTitle, initialText = '', onSave, onClose }: ReflectionModalProps) {
  const { t } = useI18n()
  const [text, setText] = useState(initialText)
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

  const handleSubmit = () => {
    onSave(text.trim())
    onClose()
  }

  return (
    <div className="reflection-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="reflection-title">
      <div ref={modalRef} className="reflection-modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="reflection-title" className="reflection-modal-title">{t('todo.reflectionTitle')}</h2>
        <p className="reflection-modal-subtitle">{todoTitle}</p>
        <textarea
          className="reflection-modal-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('todo.reflectionPlaceholder')}
          rows={5}
          aria-label={t('todo.reflectionTitle')}
        />
        <div className="reflection-modal-actions">
          <button type="button" className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  )
}
