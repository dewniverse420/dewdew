# Dewniverse 主站：统一登录与路由保护

主站（https://www.dewniverse.me/）与个人助手（/app/）**同一域名**，可共用 **Firebase Auth** 的登录态，用户只需登录一次。

---

## 一、同一域名下登录态为何能共享

- Firebase Auth 在 Web 里默认按 **同源（origin）** 持久化：`https://www.dewniverse.me` 与 `https://www.dewniverse.me/app/` 是同一 origin。
- 主站和 /app/ 使用**同一 Firebase 项目、同一套配置**（apiKey、authDomain、projectId 等）时，任一端登录或登出，另一端会读到同一状态。
- 因此：在主站登录后，用户点「个人助手」进入 /app/，**无需再次登录**；在 /app/ 登出后，主站也会视为未登录（若主站同样根据 `auth.currentUser` 做判断）。

---

## 二、主站需要做的事（Dewniverse 项目里）

### 1. 接入同一 Firebase 项目

- 在 Dewniverse 项目中安装 Firebase（若尚未安装）：
  ```bash
  npm install firebase
  ```
- 使用与 dewdew **完全相同的** Firebase Web 配置（同一项目下的同一 Web 应用），例如：
  ```js
  // 例如 src/lib/firebase.js 或 config/firebase.js
  import { initializeApp } from 'firebase/app'
  import { getAuth } from 'firebase/auth'

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,      // 与 Tool 相同
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  const app = initializeApp(config)
  export const auth = getAuth(app)
  ```
- 主站构建/运行时的环境变量名与 dewdew 一致（如 `VITE_FIREBASE_*`），值来自同一 Firebase 项目。

### 2. 订阅登录态（追踪状态、避免反复登录）

- 用 `onAuthStateChanged` 把「当前是否登录」同步到主站状态，用于：
  - 显示「已登录：xxx@email.com」或「登录 / 注册」
  - 决定是否展示私密/高级功能、是否允许进入需登录的页面
- 示例（React）：
  ```js
  import { onAuthStateChanged } from 'firebase/auth'
  import { auth } from './lib/firebase'

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)  // 存到 state/context，全站可用
    })
    return () => unsub()
  }, [])
  ```
- 这样用户在主站登录后，状态会一直保持；跳转到 /app/ 再回来，主站仍能读到同一 `user`，无需再登。

### 3. 需要登录才可访问的页面（路由保护）

- 对「私密 / 高级」路由做保护：若 `currentUser === null`，则重定向到登录页或首页。
- 示例（React Router）：
  ```js
  function ProtectedRoute({ children }) {
    const [user, setUser] = useState(auth.currentUser)
    useEffect(() => {
      const unsub = onAuthStateChanged(auth, setUser)
      return () => unsub()
    }, [])
    if (user === undefined) return <Loading />
    if (user === null) return <Navigate to="/login" replace />
    return children
  }

  // 路由配置
  <Route path="/orbit" element={<ProtectedRoute><OrbitPage /></ProtectedRoute>} />
  <Route path="/login" element={<LoginPage />} />
  ```
- 登录页内用 `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`（或 Google 等）登录；登录成功后跳转到原目标页或首页即可。

### 4. 主站登录页与「个人助手」入口

- 登录页：主站自己提供（例如 `/login`），表单提交时调 Firebase `signInWithEmailAndPassword` 或注册接口。
- 「个人助手」入口：普通链接即可，例如：
  ```html
  <a href="/app/personaltool/">个人助手</a>
  ```
  或
  ```html
  <a href="https://www.dewniverse.me/app/personaltool/">个人助手</a>
  ```
- 用户在主站登录后点该链接，进入 /app/personaltool/ 时 Personal Tool 会读到同一登录态，不再弹出登录门控（在 Tool 中已配置 `VITE_FIREBASE_REQUIRE_LOGIN=true` 时）。

---

## 三、dewdew（本仓库）侧已配合的配置

- **需登录模式**：构建时设置 `VITE_FIREBASE_REQUIRE_LOGIN=true`，则 /app/ 内未登录会显示「请登录」门控（可跳主站登录或在本页登录）。
- **登录态同步**：dewdew 内使用同一 Firebase 配置并订阅 `onAuthStateChanged`，与主站共享同一 Auth 实例的持久化状态。
- **主站登录 URL**：可在 dewdew 的 `.env` 中设置 `VITE_MAIN_SITE_LOGIN_URL=https://www.dewniverse.me/login`（或你的主站登录路径），门控页「前往主站登录」会跳转到该地址。个人助手访问地址为 **https://www.dewniverse.me/app/personaltool/**。

这样即可实现：**主站与 /app/ 统一登录、追踪登录状态、需登录的页面受保护，且用户不用反复登录**。
