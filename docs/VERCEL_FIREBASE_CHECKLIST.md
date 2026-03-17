# dewdew 线上 Firebase 连接检查清单

Vercel 已配置 Firebase 环境变量后，若 Firestore 仍无数据，按下面逐项排查。

---

## 一、Firestore 是否需要预先建集合？

**不需要。** Firestore 会在**首次写入时自动创建**集合和文档，无需在控制台里手动建 `users`、`todos` 等。

数据会在你**在线上站点登录并执行会写库的操作**后出现，结构为：

- `users`（集合）→ `<用户 uid>`（文档）→ `todos` / `goals` / `quicknotes` / `finance` / `contacts`（子集合）、`settings`（子集合）→ `finance`（文档）

只要应用能连上 Firebase 且用户已登录，第一次新建待办或改财务设置时就会自动创建上述路径。

---

## 二、Vercel 环境变量（必查）

在 Vercel → 你的 **dewdew** 项目 → **Settings** → **Environment Variables** 中确认：

| 变量名 | 说明 |
|--------|------|
| `VITE_FIREBASE_API_KEY` | 必填，与主站一致 |
| `VITE_FIREBASE_AUTH_DOMAIN` | 必填，如 `dewniverse-1895f.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | 必填，如 `dewniverse-1895f` |
| `VITE_FIREBASE_STORAGE_BUCKET` | 必填，如 `dewniverse-1895f.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 必填 |
| `VITE_FIREBASE_APP_ID` | 必填 |
| `VITE_FIREBASE_REQUIRE_LOGIN` | 方案 A 建议设为 `true` |
| `VITE_MAIN_SITE_LOGIN_URL` | 方案 A 建议 `https://www.dewniverse.me/login` |

注意：

- 变量名必须**一字不差**（含 `VITE_` 前缀），否则 Vite 构建时拿不到。
- 配置或修改后，到 **Deployments** 对最新部署点 **Redeploy**，否则线上仍用旧环境。

---

## 三、Firebase 控制台：授权域名

1. 打开 [Firebase 控制台](https://console.firebase.google.com) → 项目 **dewniverse**（或你实际用的项目）。
2. **Build** → **Authentication** → **Settings**（或「设置」）→ **Authorized domains**（已授权的网域）。
3. 确认列表中有 **`dewdew.dewniverse.me`**（子域要单独加，和 `www.dewniverse.me` 不同）。
4. 若无，点「添加网域」填入 `dewdew.dewniverse.me` 并保存。

未在此列表的域名无法完成登录，也就不会有 `users/<uid>` 下的数据。

---

## 四、如何验证“已连上”

1. 浏览器打开 **https://dewdew.dewniverse.me**（或你当前线上地址）。
2. 从主站登录后再跳转到 dewdew，或在 dewdew 完成登录（确保页面显示已登录状态）。
3. 在 dewdew 里做**会写 Firestore 的操作**，例如：
   - 新建一条待办并保存，或  
   - 进入「财务」→ 修改参考货币/展示货币并保存。
4. 打开 Firebase 控制台 → **Firestore Database** → **数据**，刷新后应看到：
   - 根集合 **users** → 点开 → 一个文档 ID 为你的用户 uid → 其下有 `todos`、`finance`、`settings` 等。

若仍无数据，在浏览器按 F12 → **Console**，看是否有 Firebase 报错（如 `auth/unauthorized-domain`、`permission-denied`），便于进一步定位。

---

## 五、常见原因小结

| 现象 | 可能原因 |
|------|----------|
| Firestore 一直为空 | 1) 未在**线上、已登录**状态下新建/修改过数据；2) Vercel 环境变量未配或配错；3) 配了变量但未 Redeploy |
| 登录失败或跳主站后回不来 | 授权域名未包含 `dewdew.dewniverse.me` |
| 本地有数据、线上没有 | 线上 Vercel 缺少 `VITE_FIREBASE_*` 或与主站不一致；或未 Redeploy |

按上述清单检查后，Firestore 仍无数据时，可把浏览器 Console 里的报错贴出来再排查。
