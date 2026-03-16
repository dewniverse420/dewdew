import type { TodoItem, Subtask } from '../types'

/** 子任务完成进度 */
export function getSubtaskProgress(subtasks: Subtask[] | undefined): { done: number; total: number; percent: number } {
  if (!subtasks || subtasks.length === 0) return { done: 0, total: 0, percent: 0 }
  const done = subtasks.filter((s) => s.completed).length
  const total = subtasks.length
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

/** 待办是否视为已完成：有子任务时看是否 100%，否则看 completed 字段 */
export function isTodoCompleted(todo: TodoItem): boolean {
  const st = todo.subtasks
  if (st && st.length > 0) {
    const { done, total } = getSubtaskProgress(st)
    return total > 0 && done === total
  }
  return todo.completed === true
}
