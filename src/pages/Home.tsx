import { Link } from 'react-router-dom'
import { getTodos, getQuickNotes } from '../lib/store'
import { getItemTime } from '../types'
import type { TimelineItem } from '../types'
import './Home.css'

export default function Home() {
  const todos = getTodos()
  const quickNotes = getQuickNotes()
  const recent: TimelineItem[] = ([...todos, ...quickNotes] as TimelineItem[])
    .sort((a, b) => new Date(getItemTime(b)).getTime() - new Date(getItemTime(a)).getTime())
    .slice(0, 8)

  return (
    <section className="page home-page">
      <h2 className="page-heading">创建</h2>
      <p className="home-desc">选择要创建的内容类型</p>
      <div className="create-cards">
        <Link to="/create/todo" className="create-card create-card--todo">
          <span className="create-card-icon">📋</span>
          <div className="create-card-body">
            <span className="create-card-label">待办</span>
            <span className="create-card-hint">事件名称、DDL、重要程度、标签、描述、地点、人员、附件、子事件</span>
          </div>
        </Link>
        <Link to="/create/quicknote" className="create-card create-card--quicknote">
          <span className="create-card-icon">✏️</span>
          <div className="create-card-body">
            <span className="create-card-label">随记</span>
            <span className="create-card-hint">来源、个人思考、时间、地点、附件</span>
          </div>
        </Link>
      </div>
      {recent.length > 0 && (
        <>
          <h3 className="home-recent-title">最近</h3>
          <ul className="recent-list">
            {recent.map((item) => (
              <li key={item.id}>
                <Link to={`/item/${item.type}/${item.id}`} className="recent-item">
                  <span className="recent-type">{item.type === 'todo' ? '待办' : '随记'}</span>
                  <span className="recent-title">
                    {item.type === 'todo' ? item.title : (item.content?.slice(0, 30) || '无内容') + '…'}
                  </span>
                  <span className="recent-time">
                    {new Date(getItemTime(item)).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
