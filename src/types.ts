/** 附件：待办与随记共用 */
export interface Attachment {
  id: string
  name: string
  type: string
  dataUrl: string
}

/** 目标类型：大目标、年目标、月目标、自定义 */
export type GoalType = 'major' | 'year' | 'month' | 'custom'

/** 目标（用于归类待办） */
export interface Goal {
  id: string
  type: GoalType
  title: string
  /** 年目标：年份，如 2025 */
  year?: number
  /** 月目标：月份 1–12 */
  month?: number
  createdAt: string
}

/** 子任务（名称、DDL、完成状态） */
export interface Subtask {
  id: string
  title: string
  ddl?: string
  completed: boolean
}

/** 待办（事件） */
export interface TodoItem {
  id: string
  type: 'todo'
  title: string
  ddl: string
  importance: 1 | 2 | 3 | 4 | 5
  tags: string[]
  goalId?: string
  description: string
  location: string
  relatedPeople: string[]
  attachments: Attachment[]
  hasSubEvents: boolean
  subEvents: TodoItem[]
  /** 子任务列表 */
  subtasks?: Subtask[]
  /** 是否已完成（无子任务时用；有子任务时可由进度推断） */
  completed?: boolean
  /** 完成时的自我反思与总结 */
  completionReflection?: string
  /** 提前多少分钟推送提醒（可多选），如 [60, 720] 表示提前1小时和12小时各提醒一次 */
  reminderBeforeMinutes?: number[]
  createdAt: string
}

/** 随记 */
export interface QuickNoteItem {
  id: string
  type: 'quicknote'
  source: string
  content: string
  time: string
  location: string
  attachments: Attachment[]
  /** 指定某张图片为封面（列表/时间轴展示用）；未设则用第一张图片 */
  coverAttachmentId?: string
  createdAt: string
}

/** 收支类型 */
export type FinanceType = 'income' | 'expense'

/** 收支条目 */
export interface FinanceEntry {
  id: string
  type: FinanceType
  /** 金额（原币种） */
  amount: number
  /** 币种 ISO 代码；旧数据缺省视为参考货币 */
  currency?: string
  /** 当日汇率：1 单位本币 = rateToRef 单位参考货币；旧数据缺省为 1 */
  rateToRef?: number
  /** 分类 */
  category: string
  /** 交易日期 ISO */
  date: string
  note: string
  account?: string
  createdAt: string
}

/** 收支展示与参考货币设置 */
export interface FinanceSettings {
  /** 参考货币（用于存储汇率） */
  referenceCurrency: string
  /** 展示用的目标货币 */
  displayCurrency: string
  /** 1 单位参考货币 = refToDisplayRate 单位展示货币 */
  refToDisplayRate: number
}

/** 联系人下的特殊事件 */
export interface ContactEvent {
  id: string
  description: string
  time: string
  location: string
  attachments: Attachment[]
  createdAt: string
}

/** 联系人 */
export interface Contact {
  id: string
  name: string
  phone: string
  email: string
  company: string
  note: string
  /** 头像图片（Base64 DataURL） */
  avatarDataUrl?: string
  /** 生日，格式 YYYY-MM-DD，用于日历展示与提前提醒 */
  birthday?: string
  events: ContactEvent[]
  createdAt: string
}

export type TimelineItem = TodoItem | QuickNoteItem

export function isTodo(item: TimelineItem): item is TodoItem {
  return item.type === 'todo'
}

export function isQuickNote(item: TimelineItem): item is QuickNoteItem {
  return item.type === 'quicknote'
}

/** 获取用于时间轴排序的时间 */
export function getItemTime(item: TimelineItem): string {
  if (isTodo(item)) return item.ddl
  return item.time || item.createdAt
}
