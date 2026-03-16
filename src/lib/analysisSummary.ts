import { getTodos, getGoals } from './store'
import { isTodoCompleted } from './todoCompletion'

/** 生成待办与完成情况的文本摘要，供 AI 分析 */
export function buildTodoSummary(lang: 'zh' | 'en'): string {
  const todos = getTodos()
  const goals = getGoals()
  const completed = todos.filter(isTodoCompleted)
  const pending = todos.filter((t) => !isTodoCompleted(t))

  if (lang === 'en') {
    let s = `# Todo summary\n\n`
    s += `Total: ${todos.length} | Completed: ${completed.length} | Pending: ${pending.length}\n\n`
    if (goals.length > 0) {
      s += `## Goals (${goals.length})\n`
      goals.slice(0, 20).forEach((g) => {
        s += `- ${g.title} (${g.type}${g.year ? ` ${g.year}` : ''}${g.month ? `/${g.month}` : ''})\n`
      })
      s += '\n'
    }
    s += `## Pending todos\n`
    pending.slice(0, 50).forEach((t) => {
      const ddl = t.ddl ? new Date(t.ddl).toLocaleString() : 'no DDL'
      s += `- [ ] ${t.title} | DDL: ${ddl} | importance: ${t.importance}${t.tags?.length ? ` | tags: ${t.tags.join(', ')}` : ''}\n`
    })
    s += `\n## Completed todos\n`
    completed.slice(0, 30).forEach((t) => {
      s += `- [x] ${t.title}\n`
    })
    return s
  }

  let s = `# 待办汇总\n\n`
  s += `共 ${todos.length} 项，已完成 ${completed.length} 项，未完成 ${pending.length} 项。\n\n`
  if (goals.length > 0) {
    s += `## 目标（${goals.length} 个）\n`
    goals.slice(0, 20).forEach((g) => {
      s += `- ${g.title}（${g.type}${g.year ? ` ${g.year}年` : ''}${g.month ? ` ${g.month}月` : ''}）\n`
    })
    s += '\n'
  }
  s += `## 未完成待办\n`
  pending.slice(0, 50).forEach((t) => {
    const ddl = t.ddl ? new Date(t.ddl).toLocaleString('zh-CN') : '无'
    s += `- [ ] ${t.title} | DDL: ${ddl} | 重要程度: ${t.importance}${t.tags?.length ? ` | 标签: ${t.tags.join('、')}` : ''}\n`
  })
  s += `\n## 已完成待办\n`
  completed.slice(0, 30).forEach((t) => {
    s += `- [x] ${t.title}\n`
  })
  return s
}
