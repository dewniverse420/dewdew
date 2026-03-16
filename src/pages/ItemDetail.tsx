import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getTodos, setTodos, getGoals, getQuickNotes, setQuickNotes } from '../lib/store'
import { getSubtaskProgress, isTodoCompleted } from '../lib/todoCompletion'
import ReflectionModal from '../components/ReflectionModal'
import type { TodoItem, QuickNoteItem } from '../types'
import './ItemDetail.css'

export default function ItemDetail() {
  const { t, lang } = useI18n()
  const { type, id } = useParams<{ type: 'todo' | 'quicknote'; id: string }>()
  const navigate = useNavigate()
  const locale = lang === 'zh' ? 'zh-CN' : 'en'
  const [showReflectionModal, setShowReflectionModal] = useState(false)

  if (!type || !id) {
    navigate('/todos')
    return null
  }

  if (type === 'todo') {
    const todos = getTodos()
    const goals = getGoals()
    const item = todos.find((todosItem) => todosItem.id === id) as TodoItem | undefined
    if (!item) {
      navigate('/todos')
      return null
    }
    const goal = item.goalId ? goals.find((g) => g.id === item.goalId) : null
    const ySuffix = t('createGoal.yearSuffix')
    const mSuffix = t('createGoal.monthSuffix')
    const goalLabel = goal
      ? goal.type === 'year' && goal.year
        ? `${goal.title}（${goal.year}${ySuffix}）`
        : goal.type === 'month' && goal.year != null && goal.month != null
          ? `${goal.title}（${goal.year}${ySuffix}${goal.month}${mSuffix}）`
          : goal.title
      : t('detail.dash')
    const remove = () => {
      setTodos(todos.filter((todo) => todo.id !== id))
      navigate('/todos')
    }
    const completed = isTodoCompleted(item)
    const hasSubtasks = item.subtasks && item.subtasks.length > 0
    const progress = getSubtaskProgress(item.subtasks)
    const updateItem = (patch: Partial<TodoItem>) => {
      setTodos(todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)))
    }
    const handleSaveReflection = (text: string) => {
      updateItem({ completed: true, completionReflection: text })
      setShowReflectionModal(false)
    }
    const dash = t('detail.dash')
    return (
      <section className="page item-detail">
        <div className="detail-header">
          <button type="button" className="btn" onClick={() => navigate(-1)}>{t('detail.back')}</button>
          <span className="detail-type">{t('detail.type.todo')}</span>
          {completed && <span className="detail-badge detail-badge--completed">{t('todo.completed')}</span>}
        </div>
        <h1 className="detail-title">{item.title}</h1>
        {hasSubtasks && (
          <p className="detail-subtask-progress">
            {progress.done}/{progress.total} {t('createTodo.field.subtasks')} · {progress.percent}%
          </p>
        )}
        <dl className="detail-meta">
          <dt>{t('detail.meta.goal')}</dt>
          <dd>{goalLabel}</dd>
          <dt>{t('detail.meta.ddl')}</dt>
          <dd>{item.ddl ? new Date(item.ddl).toLocaleString(locale) : dash}</dd>
          <dt>{t('detail.meta.importance')}</dt>
          <dd>{item.importance}</dd>
          <dt>{t('detail.meta.tags')}</dt>
          <dd>{item.tags.length ? item.tags.join('、') : dash}</dd>
          <dt>{t('detail.meta.location')}</dt>
          <dd>{item.location || dash}</dd>
          <dt>{t('detail.meta.people')}</dt>
          <dd>{item.relatedPeople.length ? item.relatedPeople.join('、') : dash}</dd>
          <dt>{t('detail.meta.createdAt')}</dt>
          <dd>{new Date(item.createdAt).toLocaleString(locale)}</dd>
        </dl>
        {item.description && (
          <div className="detail-block">
            <h3>{t('detail.block.desc')}</h3>
            <p className="detail-description">{item.description}</p>
          </div>
        )}
        {item.subtasks && item.subtasks.length > 0 && (
          <div className="detail-block">
            <h3>{t('detail.block.subtasks')}</h3>
            <ul className="detail-subtasks">
              {item.subtasks.map((s) => (
                <li key={s.id} className={`detail-subtask ${s.completed ? 'detail-subtask--done' : ''}`}>
                  <span className="detail-subtask-title">{s.title}</span>
                  {s.ddl && <span className="detail-subtask-ddl">{new Date(s.ddl).toLocaleString(locale)}</span>}
                  <span className="detail-subtask-status">{s.completed ? '✓' : '○'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {item.completionReflection && (
          <div className="detail-block">
            <h3>{t('detail.block.reflection')}</h3>
            <p className="detail-reflection">{item.completionReflection}</p>
          </div>
        )}
        {item.attachments.length > 0 && (
          <div className="detail-block">
            <h3>{t('detail.block.attachments')}</h3>
            <div className="detail-attachments">
              {item.attachments.map((a) =>
                a.type.startsWith('image/') ? (
                  <img key={a.id} src={a.dataUrl} alt={a.name} className="detail-attach-img" />
                ) : (
                  <a key={a.id} href={a.dataUrl} download={a.name} className="detail-attach-file">📎 {a.name}</a>
                )
              )}
            </div>
          </div>
        )}
        <div className="detail-actions">
          <button type="button" className="btn" onClick={() => navigate(`/edit/todo/${id}`)}>
            {t('detail.edit')}
          </button>
          {!hasSubtasks && (
            item.completed ? (
              <button type="button" className="btn" onClick={() => updateItem({ completed: false, completionReflection: undefined })}>
                {t('todo.markIncomplete')}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => setShowReflectionModal(true)}>
                {t('todo.markComplete')}
              </button>
            )
          )}
          <button type="button" className="btn danger" onClick={remove}>{t('detail.delete')}</button>
        </div>
        {showReflectionModal && (
          <ReflectionModal
            todoTitle={item.title}
            initialText={item.completionReflection ?? ''}
            onSave={handleSaveReflection}
            onClose={() => setShowReflectionModal(false)}
          />
        )}
      </section>
    )
  }

  const notes = getQuickNotes()
  const item = notes.find((n) => n.id === id) as QuickNoteItem | undefined
  if (!item) {
    navigate('/notes')
    return null
  }
  const remove = () => {
    setQuickNotes(notes.filter((n) => n.id !== id))
    navigate('/notes')
  }
  const dash = t('detail.dash')
  return (
    <section className="page item-detail">
      <div className="detail-header">
        <button type="button" className="btn" onClick={() => navigate(-1)}>{t('detail.back')}</button>
        <span className="detail-type">{t('detail.type.note')}</span>
      </div>
      {item.source && <p className="detail-source">{t('detail.source')}：{item.source}</p>}
      <div className="detail-content">{item.content || dash}</div>
      <dl className="detail-meta">
        <dt>{t('detail.meta.time')}</dt>
        <dd>{new Date(item.time || item.createdAt).toLocaleString(locale)}</dd>
        <dt>{t('detail.meta.location')}</dt>
        <dd>{item.location || dash}</dd>
        <dt>{t('detail.meta.createdAt')}</dt>
        <dd>{new Date(item.createdAt).toLocaleString(locale)}</dd>
      </dl>
      {item.attachments.length > 0 && (
        <div className="detail-block">
          <h3>{t('detail.block.attachments')}</h3>
          <div className="detail-attachments">
            {item.attachments.map((a) =>
              a.type.startsWith('image/') ? (
                <img key={a.id} src={a.dataUrl} alt={a.name} className="detail-attach-img" />
              ) : (
                <a key={a.id} href={a.dataUrl} download={a.name} className="detail-attach-file">📎 {a.name}</a>
              )
            )}
          </div>
        </div>
      )}
      <div className="detail-actions">
        <button type="button" className="btn" onClick={() => navigate(`/edit/quicknote/${id}`)}>
          {t('detail.edit')}
        </button>
        <button type="button" className="btn danger" onClick={remove}>{t('detail.delete')}</button>
      </div>
    </section>
  )
}
