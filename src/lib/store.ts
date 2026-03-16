import { getLocal, setLocal } from './storage'
import {
  initFirebase,
  isFirebaseConfigured,
  fetchTodos as firebaseFetchTodos,
  fetchGoals as firebaseFetchGoals,
  fetchQuickNotes as firebaseFetchQuickNotes,
  fetchFinance as firebaseFetchFinance,
  fetchContacts as firebaseFetchContacts,
  persistTodos as firebasePersistTodos,
  persistGoals as firebasePersistGoals,
  persistQuickNotes as firebasePersistQuickNotes,
  persistFinance as firebasePersistFinance,
  persistContacts as firebasePersistContacts,
} from './firebase'
import { getCategoryKey } from './finance'
import type { TodoItem, QuickNoteItem, Goal, FinanceEntry, Contact, FinanceSettings } from '../types'

const TODOS_KEY = 'todos'
const QUICKNOTES_KEY = 'quicknotes'
const GOALS_KEY = 'goals'
const FINANCE_KEY = 'finance'
const FINANCE_SETTINGS_KEY = 'finance-settings'
const CONTACTS_KEY = 'contacts'

const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  referenceCurrency: 'CNY',
  displayCurrency: 'CNY',
  refToDisplayRate: 1,
}

const BACKUP_VERSION = 2

/** 内存缓存 */
let _todos: TodoItem[] = []
let _goals: Goal[] = []
let _quicknotes: QuickNoteItem[] = []
let _finance: FinanceEntry[] = []
let _contacts: Contact[] = []
let _storeReady = false

/** 重置 store 状态（用于用户切换时清空内存并重新从 Firestore 拉取对应用户数据） */
export function resetStore(): void {
  _storeReady = false
  _todos = []
  _goals = []
  _quicknotes = []
  _finance = []
  _contacts = []
}

/** 初始化数据源：若已配置 Firebase 则从 Firestore 拉取，否则从 localStorage 拉取；并始终写入 localStorage 作本地备份 */
export async function initStore(): Promise<void> {
  if (_storeReady) return
  const useFirebase = isFirebaseConfigured()
  if (useFirebase) {
    const ok = await initFirebase()
    if (ok) {
      try {
        _todos = await firebaseFetchTodos()
        _goals = await firebaseFetchGoals()
        _quicknotes = await firebaseFetchQuickNotes()
        _finance = await firebaseFetchFinance()
        _contacts = await firebaseFetchContacts()
        setLocal(TODOS_KEY, _todos)
        setLocal(GOALS_KEY, _goals)
        setLocal(QUICKNOTES_KEY, _quicknotes)
        setLocal(FINANCE_KEY, _finance)
        setLocal(CONTACTS_KEY, _contacts)
      } catch {
        _todos = getLocal(TODOS_KEY, [])
        _goals = getLocal(GOALS_KEY, [])
        _quicknotes = getLocal(QUICKNOTES_KEY, [])
        _finance = getLocal(FINANCE_KEY, [])
        _contacts = getLocal(CONTACTS_KEY, [])
      }
    } else {
      _todos = getLocal(TODOS_KEY, [])
      _goals = getLocal(GOALS_KEY, [])
      _quicknotes = getLocal(QUICKNOTES_KEY, [])
      _finance = getLocal(FINANCE_KEY, [])
      _contacts = getLocal(CONTACTS_KEY, [])
    }
  } else {
    _todos = getLocal(TODOS_KEY, [])
    _goals = getLocal(GOALS_KEY, [])
    _quicknotes = getLocal(QUICKNOTES_KEY, [])
    _finance = getLocal(FINANCE_KEY, [])
    _contacts = getLocal(CONTACTS_KEY, [])
  }
  _storeReady = true
}

function syncToFirebase(): void {
  if (!isFirebaseConfigured()) return
  firebasePersistTodos(_todos).catch(() => {})
  firebasePersistGoals(_goals).catch(() => {})
  firebasePersistQuickNotes(_quicknotes).catch(() => {})
  firebasePersistFinance(_finance).catch(() => {})
  firebasePersistContacts(_contacts).catch(() => {})
}

/** 导出的备份数据结构 */
export interface BackupData {
  version: number
  exportedAt: string
  todos: TodoItem[]
  goals: Goal[]
  quicknotes: QuickNoteItem[]
  finance: FinanceEntry[]
  contacts: Contact[]
}

export function getTodos(): TodoItem[] {
  return _todos
}

export function setTodos(todos: TodoItem[]): void {
  _todos = todos
  setLocal(TODOS_KEY, todos)
  syncToFirebase()
}

export function getGoals(): Goal[] {
  return _goals
}

export function setGoals(goals: Goal[]): void {
  _goals = goals
  setLocal(GOALS_KEY, goals)
  syncToFirebase()
}

export function getQuickNotes(): QuickNoteItem[] {
  return _quicknotes
}

export function setQuickNotes(notes: QuickNoteItem[]): void {
  _quicknotes = notes
  setLocal(QUICKNOTES_KEY, notes)
  syncToFirebase()
}

export function getFinanceEntries(): FinanceEntry[] {
  return _finance
}

export function setFinanceEntries(entries: FinanceEntry[]): void {
  _finance = entries
  setLocal(FINANCE_KEY, entries)
  syncToFirebase()
}

export function getFinanceSettings(): FinanceSettings {
  const parsed = getLocal<FinanceSettings>(FINANCE_SETTINGS_KEY, DEFAULT_FINANCE_SETTINGS)
  if (parsed.referenceCurrency && parsed.displayCurrency != null)
    return { ...DEFAULT_FINANCE_SETTINGS, ...parsed }
  return { ...DEFAULT_FINANCE_SETTINGS }
}

export function setFinanceSettings(s: FinanceSettings): void {
  setLocal(FINANCE_SETTINGS_KEY, s)
}

export function getContacts(): Contact[] {
  return _contacts
}

export function setContacts(contacts: Contact[]): void {
  _contacts = contacts
  setLocal(CONTACTS_KEY, contacts)
  syncToFirebase()
}

/** 导出当前所有数据为可备份的 JSON */
export function exportBackup(): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    todos: getTodos(),
    goals: getGoals(),
    quicknotes: getQuickNotes(),
    finance: getFinanceEntries(),
    contacts: getContacts(),
  }
}

/** 规范化单条收支条目，防止备份中的畸形数据导致崩溃或异常展示 */
function normalizeFinanceEntry(raw: unknown): FinanceEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const type = o.type === 'income' || o.type === 'expense' ? o.type : 'expense'
  const amount = typeof o.amount === 'number' && Number.isFinite(o.amount) && o.amount > 0 ? o.amount : 0
  if (amount === 0) return null
  const id = typeof o.id === 'string' && o.id ? o.id : crypto.randomUUID()
  const categoryRaw = typeof o.category === 'string' ? String(o.category).slice(0, 200) : ''
  const category = getCategoryKey(categoryRaw || (type === 'income' ? 'other_income' : 'other_expense'))
  const date = typeof o.date === 'string' ? String(o.date).slice(0, 10) : new Date().toISOString().slice(0, 10)
  const note = typeof o.note === 'string' ? String(o.note).slice(0, 2000) : ''
  const account = typeof o.account === 'string' ? String(o.account).slice(0, 100) : undefined
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
  const currency = typeof o.currency === 'string' ? String(o.currency).slice(0, 10) : undefined
  const rateToRef = typeof o.rateToRef === 'number' && Number.isFinite(o.rateToRef) && o.rateToRef > 0 ? o.rateToRef : 1
  return {
    id,
    type,
    amount,
    category,
    date,
    note,
    account: account || undefined,
    createdAt,
    currency: currency || undefined,
    rateToRef: rateToRef === 1 ? undefined : rateToRef,
  }
}

/** 从备份数据恢复，覆盖当前本地数据（会同步到 Firestore（若已配置）） */
export function importBackup(data: unknown): { ok: true } | { ok: false; error: string } {
  try {
    const d = data as BackupData
    if (!d || typeof d !== 'object') return { ok: false, error: '无效的备份格式' }
    const todos = Array.isArray(d.todos) ? d.todos : []
    const goals = Array.isArray(d.goals) ? d.goals : []
    const quicknotes = Array.isArray(d.quicknotes) ? d.quicknotes : []
    const financeRaw = Array.isArray((d as any).finance) ? (d as any).finance : []
    const finance: FinanceEntry[] = financeRaw.map(normalizeFinanceEntry).filter((e: FinanceEntry | null): e is FinanceEntry => e != null)
    const contacts = Array.isArray((d as any).contacts) ? (d as any).contacts : []
    setTodos(todos)
    setGoals(goals)
    setQuickNotes(quicknotes)
    setFinanceEntries(finance)
    setContacts(contacts)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '导入失败' }
  }
}

/** 从所有待办中收集不重复的标签 */
export function getAllTags(todos: TodoItem[]): string[] {
  const set = new Set<string>()
  todos.forEach((t) => t.tags.forEach((tag) => set.add(tag)))
  return Array.from(set).sort()
}
