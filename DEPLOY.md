# 把数据存到 Firebase 并发布到自己的 .me 网址

## 一、数据存到 Google Firebase（Firestore）

### 1. 创建 Firebase 项目

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)
2. 点击「添加项目」→ 输入项目名称（如 `my-assistant`）→ 按提示完成创建

### 2. 启用 Firestore 数据库

1. 在项目概览左侧选 **「构建」→「Firestore Database」**
2. 点击「创建数据库」
3. 选择「在测试模式下启动」（开发时可先这样，见下方安全规则再收紧）
4. 选一个就近的 Cloud Firestore 位置（如 `asia-east1`），创建

### 3. 启用匿名登录（用于无需账号的读写）

1. 左侧选 **「构建」→「Authentication」**
2. 点击「开始使用」→ 在「登录方式」里找到「匿名」
3. 启用「匿名」并保存

### 4. 注册 Web 应用并拿到配置

1. 在项目概览（齿轮旁）点击「项目设置」
2. 在「您的应用」里点击「</>」图标添加 Web 应用
3. 填一个应用昵称，可不勾选 Firebase Hosting（后面用命令行再配）
4. 注册后会出现一段 `firebaseConfig`，复制其中各字段

### 5. 在项目里配置环境变量

1. 在项目根目录复制一份环境变量示例：
   ```bash
   cp .env.example .env
   ```
2. 用记事本或编辑器打开 `.env`，把 Firebase 控制台里的配置填进去，例如：
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=你的项目.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=你的项目ID
   VITE_FIREBASE_STORAGE_BUCKET=你的项目.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc...
   ```
3. 保存后，本地运行 `npm run dev` 或构建 `npm run build` 时，应用会连 Firestore，数据会存到线上

### 6. （推荐）设置 Firestore 安全规则

本应用数据按用户存在 `users/{userId}/todos`、`users/{userId}/goals` 等子集合下。在 Firestore 的「规则」里可改成仅已登录用户可读写自己的数据，例如：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{collection}/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

（匿名登录时也有 `request.auth.uid`，每个匿名用户独立空间。）发布前建议把「测试模式」关掉，只用上述规则。

---

## 二、把网站发布到自己的 .me 网址（Firebase Hosting + 自定义域名）

### 1. 安装 Firebase CLI

```bash
npm install -g firebase-tools
```

登录：

```bash
firebase login
```

### 2. 在项目里初始化 Hosting

在项目根目录（与 `package.json` 同级）执行：

```bash
firebase init hosting
```

- 若问「Use an existing project」，选你刚建的 Firebase 项目
- 若问「What do you want to use as your public directory?」填 **`dist`**（Vite 默认输出目录）
- 若问「Configure as a single-page app?」选 **Yes**
- 若问「Set up automatic builds with GitHub?」可按需选 No，先用手动部署

完成后会生成 `firebase.json` 和 `.firebaserc`。

### 3. 构建并部署

```bash
npm run build
firebase deploy
```

部署成功后，Firebase 会给你一个默认地址，例如：  
`https://你的项目.web.app` 或 `https://你的项目.firebaseapp.com`。

### 4. 绑定你自己的 .me 域名

1. 在 [Firebase 控制台](https://console.firebase.google.com/) 打开你的项目
2. 左侧选 **「Hosting」**
3. 点击「添加自定义域名」
4. 输入你的 .me 域名（例如 `www.yourname.me` 或 `yourname.me`）
5. 按提示去你的域名注册商（如 Namecheap、Cloudflare、阿里云等）添加 DNS 记录：
   - 类型一般为 **A** 或 **CNAME**
   - Firebase 会给出具体主机名和目标地址，照抄即可
6. 验证通过后，Firebase 会自动为你的域名申请 SSL，过一会儿即可用 `https://你的域名.me` 访问

注意：`.env` 里的 Firebase 配置会在 `npm run build` 时打进前端代码，部署到 Hosting 后，访问你的 .me 网址时就会用同一套配置，数据会存到同一个 Firestore，实现「数据在线上 + 网站在自己域名」。

---

## 三、流程小结

| 步骤 | 做什么 |
|------|--------|
| 1 | Firebase 建项目 → 开 Firestore、开匿名登录 → 拿 Web 配置 |
| 2 | 项目里 `.env` 填好 `VITE_FIREBASE_*` → 本地/线上都用 Firestore |
| 3 | `firebase init hosting` → 公共目录选 `dist` |
| 4 | `npm run build` → `firebase deploy` |
| 5 | Hosting 里「添加自定义域名」→ 在域名商配 DNS → 用你的 .me 访问 |

这样：**数据在 Google Firestore，网站在你的 .me 网址**。

---

## 四、与主站统一登录、数据按用户存

若希望「用户在你的个人网站上登录后，在本应用里创建的内容都存到该用户自己的 Firebase 空间」：

1. 在 `.env` 中设置：
   ```
   VITE_FIREBASE_REQUIRE_LOGIN=true
   VITE_MAIN_SITE_LOGIN_URL=https://你的主站登录页地址/
   ```
2. 在 Firebase 控制台 **Authentication** 中启用「邮箱/密码」或「Google」等登录方式（与主站一致）。
3. 主站与本应用若在同一主域名下（如 `www.dewniverse.me` 与 `www.dewniverse.me/app/personaltool/`），登录态可共享；用户在主站登录后，打开本应用即已登录，无需再输账号密码。
4. 本应用会按 **当前登录用户 UID** 读写 Firestore：`users/{userId}/todos`、`users/{userId}/goals`、`quicknotes`、`finance`、`contacts`。切换账号或重新登录后，会自动拉取对应用户的数据。

---

## 五、发布到子路径（如 /app/personaltool/）

若应用部署在个人站点的子路径（例如 `https://你的域名.me/app/personaltool/`）：

1. 在 `.env` 中设置：
   ```
   VITE_BASE_PATH=/app/personaltool/
   ```
2. 构建：`npm run build`（产物中资源路径会带 `/app/personaltool/`）。
3. **Firebase Hosting**：若整站只有这一个 SPA，可把 `dist` 内容部署到 Hosting 根，并在 `firebase.json` 的 `rewrites` 里保留 `"source": "**", "destination": "/index.html"`；同时需保证访问入口是 `https://你的域名.me/app/personaltool/`（即你的主站或 CDN 把该路径指到 Hosting 或同一套静态资源）。
4. 若主站和本应用不在同一 Hosting 项目，常见做法是：主站把 `/app/personaltool/**` 反向代理到 Firebase Hosting 的对应路径，或把本应用的 `dist` 部署到主站服务器的 `/app/personaltool/` 目录。

---

## 六、功能验证清单

发布后建议逐项自测：

| 功能 | 如何验证 |
|------|----------|
| **拍照/图片识别** | 底部导航点击相机图标 →「上传图片」或「拍照」→ 选一张含文字的图片 → 应出现「识别中…」→ 成功后跳转到创建待办，标题/描述已预填；失败时显示「图片识别失败…」提示。 |
| **语音识别** | 底部导航点击麦克风图标 → 允许麦克风权限 → 说一句话 → 结束后跳转到创建待办，内容为识别文字（中文/英文随当前语言设置）。不支持时提示「请使用 Chrome 或 Edge」。 |
| **发布到个人网站** | 执行 `npm run build` 与 `firebase deploy`（或部署到自己的服务器），用浏览器访问你的 .me 或子路径，能正常打开应用并操作。 |
| **登录后数据存 Firebase** | 配置 `VITE_FIREBASE_*` 与（可选）`VITE_FIREBASE_REQUIRE_LOGIN=true`，在主站或本应用登录 → 创建待办/目标/随记/收支/联系人 → 在 Firebase 控制台 Firestore 中查看 `users/{你的 UID}/todos` 等集合应有对应数据；换账号登录后应看到该账号的数据。 |
