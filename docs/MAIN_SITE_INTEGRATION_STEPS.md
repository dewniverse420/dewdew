# 在主网站（Dewniverse）窗口里的对接步骤

以下步骤请在 **Dewniverse 主站项目** 的 Cursor 窗口里完成，使主站与个人助手（https://www.dewniverse.me/app/personaltool/，即 dewdew 应用）成功对接，并完成 Firebase 部署。

---

## 第一步：在主站加「个人助手」入口

1. 打开 Dewniverse 项目里负责导航/菜单的文件（例如顶部导航、侧栏或「Get Help」附近）。
2. 增加一个链接，指向个人助手（**同一域名、子路径**）：
   - 链接地址：**`https://www.dewniverse.me/app/personaltool/`** 或 **`/app/personaltool/`**（同站用相对路径亦可）
   - 文案示例：`个人助手` / `dewdew` / `My Assistant`
3. 示例（按你实际用的框架改）：
   ```html
   <a href="/app/personaltool/">个人助手</a>
   ```
   若希望新标签打开：
   ```html
   <a href="/app/personaltool/" target="_blank" rel="noopener">个人助手</a>
   ```

这样主站只做跳转/入口，不包含 dewdew 的代码。

---

## 第二步：在主站接入 Firebase（与 dewdew 同一项目）

1. **安装 Firebase**（若尚未安装）：
   ```bash
   npm install firebase
   ```

2. **新建 Firebase 配置文件**（例如 `src/lib/firebase.js` 或 `config/firebase.js`），使用与 dewdew **完全相同的** Firebase 项目配置：
   ```js
   import { initializeApp } from 'firebase/app'
   import { getAuth } from 'firebase/auth'

   const config = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID,
   }

   const app = initializeApp(config)
   export const auth = getAuth(app)
   ```

3. **在主站项目根目录建 `.env` 或 `.env.production`**（不要提交到 Git），填入与 dewdew 相同的值：
   ```env
   VITE_FIREBASE_API_KEY=你的apiKey
   VITE_FIREBASE_AUTH_DOMAIN=你的项目.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=你的项目ID
   VITE_FIREBASE_STORAGE_BUCKET=你的项目.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=数字
   VITE_FIREBASE_APP_ID=你的appId
   ```
   这些值来自 Firebase 控制台 → 项目设置 → 常规 → 你的 Web 应用。

---

## 第三步：在主站追踪登录状态（避免用户反复登录）

1. 在主站里用 **`onAuthStateChanged`** 把当前用户存到 state 或 context，供全站使用（例如决定是否展示私密/高级功能、是否显示「已登录」）。
2. 示例（React，可按你现有结构改成 context 或 store）：
   ```js
   import { onAuthStateChanged } from 'firebase/auth'
   import { auth } from './lib/firebase'  // 上一步的 auth

   // 在根组件或 Layout 的 useEffect 里：
   useEffect(() => {
     const unsub = onAuthStateChanged(auth, (user) => {
       setCurrentUser(user)  // 存到 state 或 context
     })
     return () => unsub()
   }, [])
   ```
3. 这样用户在主站登录后，再点「个人助手」进入 `/app/personaltool/` 时，会**自动已登录**（同一域名、同一 Firebase，登录态共享）。

---

## 第四步：（可选）需要登录才可访问的页面

若主站有「私密 / 高级」页面（如 Orbit、Trajectory 等）需要登录后才能访问：

1. 根据上一步的 `currentUser` 做路由保护：当 `currentUser === null` 时重定向到登录页或首页。
2. 示例（React Router）：
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

   // 路由里使用
   <Route path="/orbit" element={<ProtectedRoute><OrbitPage /></ProtectedRoute>} />
   ```
3. 主站需有一个**登录页**（例如 `/login`），表单里调用：
   ```js
   import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
   import { auth } from './lib/firebase'
   // 登录：signInWithEmailAndPassword(auth, email, password)
   // 注册：createUserWithEmailAndPassword(auth, email, password)
   ```

---

## 第五步：在 Firebase 控制台完成部署配置

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)，选择你的项目（与主站、Personal Tool 共用的那个）。

2. **Authentication → Sign-in method**  
   - 启用 **Email/密码**（以及如需 Google 等）。

3. **Authentication → 设置 → 已授权的网域**  
   - 确保存在：
     - `www.dewniverse.me`
     - `dewniverse.me`
   - 这样主站和 `https://www.dewniverse.me/app/personaltool/` 都能正常登录。

4. **Firestore Database → 规则**  
   - 粘贴并发布以下规则（与 Personal Tool 的 `users/{userId}/...` 结构一致）：
   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. **项目设置 → 常规 → 你的应用**  
   - 确认 Web 应用的 apiKey、authDomain、projectId 等与主站和 Personal Tool 的 `.env` 一致。

---

## 第六步：部署主站与 Personal Tool，使两页成功对接

1. **主站**  
   - 按你现有方式部署 Dewniverse（Vercel / Netlify / 自建等），确保环境变量 `VITE_FIREBASE_*` 已配置。

2. **Personal Tool（在 Personal Tool 仓库 / 本仓库）**  
   - 构建时指定子路径：
     ```bash
     VITE_BASE_PATH=/app/personaltool/ npm run build
     ```
   - 将 `dist/` 部署到主站同一域名下的 **`/app/personaltool/`** 路径（参见本仓库内 `docs/DEPLOY_UNDER_DEWNIVERSE_AND_FIREBASE.md` 的 Vercel / Netlify / Nginx 做法）。
   - Personal Tool 的 `.env.production` 需包含：
     - `VITE_BASE_PATH=/app/personaltool/`
     - 与主站相同的 `VITE_FIREBASE_*`
     - 可选：`VITE_FIREBASE_REQUIRE_LOGIN=true`、`VITE_MAIN_SITE_LOGIN_URL=https://www.dewniverse.me/`（或你的主站登录页 URL）

3. **自检**  
   - 打开 https://www.dewniverse.me/ ，点击「个人助手」应跳转到 https://www.dewniverse.me/app/personaltool/ 且页面正常。  
   - 在主站或 Personal Tool 任一处登录，再在另一处刷新，应显示已登录（无需再次输入账号密码）。  
   - 在 Personal Tool 里新建一条数据，刷新后仍存在，说明 Firestore 读写正常。

---

## 小结（主站窗口里要做的）

| 顺序 | 操作 |
|------|------|
| 1 | 主站加链接：`/app/personaltool/`（个人助手入口） |
| 2 | 主站接 Firebase：同一配置 + `.env` 的 `VITE_FIREBASE_*` |
| 3 | 主站用 `onAuthStateChanged` 追踪登录状态 |
| 4 | （可选）需登录页面用 `ProtectedRoute` + 登录页 |
| 5 | Firebase 控制台：授权域名、Firestore 规则 |
| 6 | 部署主站；Personal Tool 用 `VITE_BASE_PATH=/app/personaltool/` 构建并部署到 `/app/personaltool/` |

按以上顺序在主网站窗口里完成，即可实现主站与 https://www.dewniverse.me/app/personaltool/ 的成功对接，并完成 Firebase 部署。
