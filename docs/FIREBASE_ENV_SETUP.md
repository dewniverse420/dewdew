# 用 Firebase 控制台拿到的配置填环境变量

Firebase 给你的是一段代码里的 `firebaseConfig` 对象，本项目用 **环境变量** 读取，避免把密钥写进代码或提交到 Git。

**方案 A（dewdew 独立部署）**：dewdew 与主站共用**同一 Firebase 项目**，所有 `VITE_FIREBASE_*` 的值需与主站一致，可从主站仓库的 `.env` 或 Firebase 控制台获取。

## 对应关系

| Firebase 代码里的 key | 本项目的环境变量名 |
|----------------------|--------------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

（`measurementId` 是 Analytics 用的，本应用暂未使用，可不填。）

## 在 dewdew 项目里怎么做

1. 复制根目录 **`.env.example`** 为 **`.env`**（本地开发）或 **`.env.local`** / **`.env.production`**（按需）。
2. 把各 `VITE_FIREBASE_*` 填成与主站相同的值（主站项目：`dewniverse-site`；或从 [Firebase 控制台](https://console.firebase.google.com) 同一项目内复制）。
3. **不要**把 `.env` / `.env.local` / `.env.production` 提交到 Git（`.gitignore` 已忽略）。
4. 若仓库曾误提交过包含真实密钥的文件，建议到 Firebase 控制台重新生成密钥，并更新本地与 Vercel 环境变量。

示例（方案 A，独立子域部署）：

```env
VITE_BASE_PATH=/
VITE_FIREBASE_API_KEY=你的apiKey
VITE_FIREBASE_AUTH_DOMAIN=你的authDomain
VITE_FIREBASE_PROJECT_ID=你的projectId
VITE_FIREBASE_STORAGE_BUCKET=你的storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=你的messagingSenderId
VITE_FIREBASE_APP_ID=你的appId
VITE_FIREBASE_REQUIRE_LOGIN=true
VITE_MAIN_SITE_LOGIN_URL=https://www.dewniverse.me/login
```

## 本地跑起来

填好 `.env` 后执行：

```bash
npm run dev
```

若配置正确，应用会连上 Firebase（登录、Firestore 会生效）。部署到 Vercel 时在项目 Settings → Environment Variables 中配置同名变量，值同主站，然后重新部署。
