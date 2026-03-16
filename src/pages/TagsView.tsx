import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getTodos, getAllTags } from '../lib/store'
import './TagsView.css'

export default function TagsView() {
  const { t, lang } = useI18n()
  const locale = lang === 'zh' ? 'zh-CN' : 'en'
  const todos = getTodos()
  const allTags = useMemo(() => getAllTags(todos), [todos])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const filtered = selectedTag
    ? todos.filter((todo) => todo.tags.includes(selectedTag))
    : todos

  const sorted = [...filtered].sort((a, b) => new Date(a.ddl || a.createdAt).getTime() - new Date(b.ddl || b.createdAt).getTime())

  return (
    <section className="page tags-page">
      <h2 className="page-heading">{t('tags.heading')}</h2>
      <p className="tags-desc">{t('tags.desc')}</p>
      <div className="tags-layout">
        <aside className="tags-sidebar">
          <button
            type="button"
            className={`tag-filter-btn ${selectedTag === null ? 'active' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            {t('tags.all')}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
          {allTags.length === 0 && (
            <span className="tags-empty">{t('tags.empty')}</span>
          )}
        </aside>
        <div className="tags-main">
          {sorted.length === 0 ? (
            <p className="empty-hint">
              {selectedTag ? t('todos.empty.noTagTodo', { tag: selectedTag }) : t('todos.empty.noTodos')}
            </p>
          ) : (
            <ul className="tags-todo-list">
              {sorted.map((todo) => (
                <li key={todo.id}>
                  <Link to={`/item/todo/${todo.id}`} className="tags-todo-item">
                    <span className="tags-todo-title">{todo.title}</span>
                    <span className="tags-todo-meta">
                      {todo.ddl ? new Date(todo.ddl).toLocaleString(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('todos.todo.noDdl')}
                      {todo.tags.length > 0 && ` · ${todo.tags.join(lang === 'zh' ? '、' : ', ')}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
