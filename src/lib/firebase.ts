/**
 * Firebase 初始化与 Firestore 读写
 * 仅在配置了 VITE_FIREBASE_* 环境变量时启用；支持匿名登录或正式登录（邮箱/Google 等）。
 * 数据按用户存：users/{userId}/todos、users/{userId}/finance 等（JSON 形态）。
 */

import { initializeApp } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type User,
  type Unsubscribe,
} from 'firebase/auth'
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import type { TodoItem, QuickNoteItem, Goal, FinanceEntry, Contact } from '../types'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const isConfigured =
  typeof config.apiKey === 'string' &&
  config.apiKey.length > 0 &&
  typeof config.projectId === 'string' &&
  config.projectId.length > 0

let app: FirebaseApp | null = null
let db: ReturnType<typeof getFirestore> | null = null
let auth: Auth | null = null

export function isFirebaseConfigured(): boolean {
  return isConfigured
}

/** 为 true 时不做匿名登录，未登录用户需先登录才能使用（与主站统一登录态） */
export function isFirebaseRequireLogin(): boolean {
  return import.meta.env.VITE_FIREBASE_REQUIRE_LOGIN === 'true' || import.meta.env.VITE_FIREBASE_REQUIRE_LOGIN === '1'
}

/** 订阅登录态变化（主站登录后跳转到 /app/ 会同步；同一域名下状态共享） */
export function onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) return () => {}
  return firebaseOnAuthStateChanged(auth, callback)
}

/** 当前登录用户的 UID，未登录或未初始化时为 null */
export function getCurrentUserId(): string | null {
  return auth?.currentUser?.uid ?? null
}

/** 获取 Auth 实例，用于在应用内做登录/注册 UI */
export function getFirebaseAuth(): Auth | null {
  return auth ?? null
}

/** 邮箱+密码登录（绑定自己网站时用正式账号） */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  if (!auth) throw new Error('Firebase not initialized')
  await signInWithEmailAndPassword(auth, email, password)
}

/** 邮箱+密码注册 */
export async function signUpWithEmail(email: string, password: string): Promise<void> {
  if (!auth) throw new Error('Firebase not initialized')
  await createUserWithEmailAndPassword(auth, email, password)
}

/** 登出 */
export async function signOut(): Promise<void> {
  if (!auth) return
  await firebaseSignOut(auth)
}

/**
 * 初始化 Firebase。
 * 若配置了 VITE_FIREBASE_REQUIRE_LOGIN=true：不做匿名登录，未登录时需在主站或本页登录（与主站共享登录态）。
 * 否则：无用户时匿名登录，兼容旧行为。
 */
export async function initFirebase(): Promise<boolean> {
  if (!isConfigured) return false
  try {
    app = initializeApp(config)
    auth = getAuth(app)
    const requireLogin = isFirebaseRequireLogin()
    if (!requireLogin && !auth.currentUser) await signInAnonymously(auth)
    db = getFirestore(app)
    return true
  } catch {
    return false
  }
}

function getUserCol(collectionName: string) {
  const uid = getCurrentUserId()
  if (!db || !uid) return null
  return collection(db, 'users', uid, collectionName)
}

/** 从 Firestore 拉取全部待办 */
export async function fetchTodos(): Promise<TodoItem[]> {
  const col = getUserCol('todos')
  if (!col) return []
  const snap = await getDocs(col)
  return snap.docs.map((d) => d.data() as TodoItem)
}

/** 从 Firestore 拉取全部目标 */
export async function fetchGoals(): Promise<Goal[]> {
  const col = getUserCol('goals')
  if (!col) return []
  const snap = await getDocs(col)
  return snap.docs.map((d) => d.data() as Goal)
}

/** 从 Firestore 拉取全部随记 */
export async function fetchQuickNotes(): Promise<QuickNoteItem[]> {
  const col = getUserCol('quicknotes')
  if (!col) return []
  const snap = await getDocs(col)
  return snap.docs.map((d) => d.data() as QuickNoteItem)
}

/** 从 Firestore 拉取全部收支（按用户，JSON 形态） */
export async function fetchFinance(): Promise<FinanceEntry[]> {
  const col = getUserCol('finance')
  if (!col) return []
  const snap = await getDocs(col)
  return snap.docs.map((d) => d.data() as FinanceEntry)
}

/** 从 Firestore 拉取全部联系人 */
export async function fetchContacts(): Promise<Contact[]> {
  const col = getUserCol('contacts')
  if (!col) return []
  const snap = await getDocs(col)
  return snap.docs.map((d) => d.data() as Contact)
}

/** 将待办列表同步到 Firestore */
export async function persistTodos(todos: TodoItem[]): Promise<void> {
  const col = getUserCol('todos')
  if (!col) return
  const snap = await getDocs(col)
  const currentIds = new Set(todos.map((t) => t.id))
  const toDelete = snap.docs.filter((d) => !currentIds.has(d.id))
  await Promise.all([
    ...todos.map((t) => setDoc(doc(col, t.id), t)),
    ...toDelete.map((d) => deleteDoc(d.ref)),
  ])
}

/** 将目标列表同步到 Firestore */
export async function persistGoals(goals: Goal[]): Promise<void> {
  const col = getUserCol('goals')
  if (!col) return
  const snap = await getDocs(col)
  const currentIds = new Set(goals.map((g) => g.id))
  const toDelete = snap.docs.filter((d) => !currentIds.has(d.id))
  await Promise.all([
    ...goals.map((g) => setDoc(doc(col, g.id), g)),
    ...toDelete.map((d) => deleteDoc(d.ref)),
  ])
}

/** 将随记列表同步到 Firestore */
export async function persistQuickNotes(notes: QuickNoteItem[]): Promise<void> {
  const col = getUserCol('quicknotes')
  if (!col) return
  const snap = await getDocs(col)
  const currentIds = new Set(notes.map((n) => n.id))
  const toDelete = snap.docs.filter((d) => !currentIds.has(d.id))
  await Promise.all([
    ...notes.map((n) => setDoc(doc(col, n.id), n)),
    ...toDelete.map((d) => deleteDoc(d.ref)),
  ])
}

/** 将收支列表同步到 Firestore（按条存，前端仍为 JSON 数组形态） */
export async function persistFinance(entries: FinanceEntry[]): Promise<void> {
  const col = getUserCol('finance')
  if (!col) return
  const snap = await getDocs(col)
  const currentIds = new Set(entries.map((e) => e.id))
  const toDelete = snap.docs.filter((d) => !currentIds.has(d.id))
  await Promise.all([
    ...entries.map((e) => setDoc(doc(col, e.id), e)),
    ...toDelete.map((d) => deleteDoc(d.ref)),
  ])
}

/** 将联系人列表同步到 Firestore */
export async function persistContacts(contacts: Contact[]): Promise<void> {
  const col = getUserCol('contacts')
  if (!col) return
  const snap = await getDocs(col)
  const currentIds = new Set(contacts.map((c) => c.id))
  const toDelete = snap.docs.filter((d) => !currentIds.has(d.id))
  await Promise.all([
    ...contacts.map((c) => setDoc(doc(col, c.id), c)),
    ...toDelete.map((d) => deleteDoc(d.ref)),
  ])
}
