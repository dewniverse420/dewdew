# 在 dewniverse.me 域名下部署个人助手 + Firebase 配置

个人助手以**子路径**形式挂在 https://www.dewniverse.me/ 下：**`https://www.dewniverse.me/app/personaltool/`**（为日后其他 app 预留 `/app/` 下空间），网站只做跳转/入口。

---

## 一、网站只做「跳转/入口」

在 **Dewniverse 网站项目**（另一个 Cursor 窗口）里：

1. 在导航或合适位置加一个入口，例如：
   - 文案：「个人助手」/「My Assistant」/「Personal Tool」
   - 链接：**`https://www.dewniverse.me/app/personaltool/`**

2. 用普通 `<a href="https://www.dewniverse.me/app/personaltool/">` 或你站点现有的路由/按钮即可，**不需要**把本仓库的代码合进 Dewniverse，只做跳转。

3. 若希望从新标签页打开：`<a href="https://www.dewniverse.me/app/personaltool/" target="_blank" rel="noopener">`。

---

## 二、本仓库（Personal Tool）支持子路径部署

本应用通过环境变量 **`VITE_BASE_PATH`** 指定部署子路径。生产环境使用 **`/app/personaltool/`**。

- **本地开发**（默认根路径）：
  ```bash
  npm run dev
  ```
  访问 http://localhost:5173/

- **构建到 dewniverse.me/app/personaltool/**：
  ```bash
  # Windows PowerShell
  $env:VITE_BASE_PATH="/app/personaltool/"; npm run build

  # Linux / macOS
  VITE_BASE_PATH=/app/personaltool/ npm run build
  ```
  构建产物在 `dist/`，需放到主站的 **`/app/personaltool/`** 路径下（见下一节）。

---

## 三、把构建产物挂到同一域名下（/app/personaltool/）

主站 https://www.dewniverse.me/ 与 `/app/personaltool/*` 需在同一域名下。根据托管方式选一种。

### 方式 A：Vercel

1. 本仓库单独建一个 Vercel 项目（或与 Dewniverse 同 monorepo）。
2. **Build Command**：`VITE_BASE_PATH=/app/personaltool/ npm run build`
3. **Output Directory**：`dist`
4. 在主站项目的 `vercel.json` 里添加 rewrite，把 `/app/personaltool` 指到该部署：
   ```json
   {
     "rewrites": [
       { "source": "/app/personaltool/:path*", "destination": "https://你的-tool-项目.vercel.app/app/personaltool/:path*" }
     ]
   }
   ```

### 方式 B：Netlify

1. 本仓库构建：`VITE_BASE_PATH=/app/personaltool/ npm run build`，得到 `dist/`。
2. 把 `dist/` 内容放到主站仓库目录（如 `public/app/personaltool/`），部署后即 `https://www.dewniverse.me/app/personaltool/`。

### 方式 C：自有服务器（Nginx）

1. 本仓库执行：`VITE_BASE_PATH=/app/personaltool/ npm run build`。
2. 将 `dist/` 上传到服务器，例如 `/var/www/dewniverse/app/personaltool/`。
3. Nginx 示例：
   ```nginx
   location /app/personaltool/ {
     alias /var/www/dewniverse/app/personaltool/;
     try_files $uri $uri/ /app/personaltool/index.html;
   }
   ```
4. 重载 Nginx。访问 https://www.dewniverse.me/app/personaltool/ 即打开个人助手。

---

## 四、在此基础上配置 Firebase（下一步）

### 1. Firebase 项目与 Auth 域名

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)，选择或新建项目。
2. **Authentication → Sign-in method**：启用 **Email/Password**（或 Google 等）。
3. **Authentication → 设置 → 已授权的网域** 中新增：
   - `www.dewniverse.me`
   - `dewniverse.me`（若会跳转或重定向到带 www，也建议加上）

这样在 https://www.dewniverse.me/app/personaltool/ 及主站使用 Firebase 登录才会被允许。

### 2. 获取 Web 应用配置

1. 在项目中 **项目设置 → 常规 → 你的应用**，添加 Web 应用（若尚未添加）。
2. 记下：`apiKey`、`authDomain`、`projectId`、`storageBucket`、`messagingSenderId`、`appId`。

### 3. 本仓库环境变量

在 **Personal Tool** 项目根目录建 `.env.production`（不要提交到 Git）：

```env
VITE_BASE_PATH=/app/personaltool/
VITE_FIREBASE_API_KEY=你的apiKey
VITE_FIREBASE_AUTH_DOMAIN=你的项目.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=你的项目ID
VITE_FIREBASE_STORAGE_BUCKET=你的项目.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=数字
VITE_FIREBASE_APP_ID=你的appId
# 与主站统一登录：设为 true 时未登录会显示登录门控，与主站共享登录态
VITE_FIREBASE_REQUIRE_LOGIN=true
# 门控页「前往主站登录」跳转地址（可选）
VITE_MAIN_SITE_LOGIN_URL=https://www.dewniverse.me/
```

构建时用：

```bash
npm run build
```

这样会同时带上 `/app/personaltool/` 和 Firebase 配置。

### 4. Firestore 安全规则

在 **Firestore Database → 规则** 中，按用户隔离数据（与当前代码中 `users/{userId}/...` 一致）：

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

发布规则后，只有已登录且 `uid` 匹配的用户能读写自己的数据。

### 5. 部署后自检

1. 打开 https://www.dewniverse.me/app/personaltool/，确认页面和路由正常。
2. 在应用内做一次**注册/登录**，确认无“未授权网域”等错误。
3. 新建一条待办或收支，刷新页面，确认数据仍在（说明 Firestore 读写正常）。

---

## 五、流程小结

| 步骤 | 在哪里做 | 做什么 |
|------|----------|--------|
| 1 | Dewniverse 网站 | 加链接到 `https://www.dewniverse.me/app/personaltool/`，仅做跳转/入口。 |
| 2 | Personal Tool 本仓库 | 用 `VITE_BASE_PATH=/app/personaltool/` 构建，把 `dist/` 放到主站 `/app/personaltool/` 路径。 |
| 3 | Firebase 控制台 | 授权 `www.dewniverse.me`、`dewniverse.me`；配好 Firestore 规则。 |
| 4 | Personal Tool 本仓库 | 配置 `.env.production` 的 `VITE_FIREBASE_*` 与 `VITE_BASE_PATH`，再次构建并部署。 |

这样，全部在 https://www.dewniverse.me/ 下；个人助手在 `/app/personaltool/`，日后可在同一域名下增加其他 app（如 `/app/otherapp/`）。
