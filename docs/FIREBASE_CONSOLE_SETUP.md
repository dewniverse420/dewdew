# Firebase 控制台设置指南

在浏览器中打开 [Firebase 控制台](https://console.firebase.google.com/)，按下面步骤完成设置，使 Dewniverse 主站与个人助手（/app/personaltool/）能共用登录与 Firestore。

---

## 一、创建或选择项目

1. 登录 [Firebase 控制台](https://console.firebase.google.com/)。
2. 若还没有项目：点击「添加项目」，按提示输入项目名称（例如 `dewniverse`），是否需要 Analytics 按需选择，完成创建。
3. 若已有项目：直接选中该项目，后续步骤都在该项目内完成。

---

## 二、添加 Web 应用并获取配置

1. 在项目概览页，点击「</> 网页」或「添加应用」→ 选择「Web」。
2. 注册应用：填写「应用昵称」（例如 `Dewniverse Web`），可选「Firebase Hosting」。
3. 点击「注册应用」后，会看到一段配置代码，包含：
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
4. **复制这 6 个值**，用于：
   - Dewniverse 主站的 `.env`（变量名：`VITE_FIREBASE_API_KEY` 等）
   - Personal Tool 的 `.env.production`（同上）
   两边的值必须完全一致，才能共用登录态。

若之前已经添加过 Web 应用：
- 点击左上角齿轮 **「项目设置」** → **「常规」** → 在「你的应用」里找到该 Web 应用，即可看到并复制上述配置。

---

## 三、启用 Authentication 并添加授权网域

1. 左侧菜单进入 **「Build」→「Authentication」**。
2. 首次使用点击「开始使用」。
3. **登录方式**：
   - 在「Sign-in method」里点击「Email/密码」→ 开启「启用」→ 保存。
   - 若需要 Google 登录：点击「Google」→ 启用并按要求填写项目支持邮箱等。
4. **已授权的网域**：
   - 在 Authentication 页中切换到「设置」或「Authorized domains」。
   - 确认列表中有：
     - **`www.dewniverse.me`**
     - **`dewniverse.me`**
   - 若没有：点击「添加网域」，分别添加这两个。
   - 本地调试可保留 `localhost`。

这样主站和 https://www.dewniverse.me/app/personaltool/ 才能正常使用 Firebase 登录。

---

## 四、创建 Firestore 并设置安全规则

1. 左侧菜单进入 **「Build」→「Firestore Database」**。
2. 若尚未创建数据库：点击「创建数据库」→ 选择「以生产模式启动」（规则稍后配）→ 选一个区域（如 `asia-east1`）→ 完成。
3. **规则**：
   - 在 Firestore 页中打开「规则」标签。
   - 将规则替换为下面内容（与 Personal Tool 的 `users/{userId}/...` 结构一致）：

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

4. 点击「发布」。  
这样每个用户只能读写自己 `users/{userId}/...` 下的数据。

---

## 五、核对与主站、Personal Tool 的配置一致

| 位置 | 要做的事 |
|------|----------|
| **Firebase 控制台** | 已授权 `www.dewniverse.me`、`dewniverse.me`；Email/密码已启用；Firestore 规则已发布。 |
| **Dewniverse 主站** | `.env` 中 6 个 `VITE_FIREBASE_*` 与上面「二」中复制的值一致。 |
| **Personal Tool** | `.env.production` 中 6 个 `VITE_FIREBASE_*` 与上面「二」中复制的值一致，且 `VITE_BASE_PATH=/app/personaltool/`。 |

两边环境变量一致 + 授权网域正确，主站与 /app/personaltool/ 即可共用登录并正常读写 Firestore。

---

## 六、自检清单

- [ ] Firebase 项目已创建/选中。
- [ ] Web 应用已添加，6 个配置值已复制到主站和 Personal Tool 的 .env。
- [ ] Authentication 已启用 Email/密码（及可选 Google）。
- [ ] 已授权网域：`www.dewniverse.me`、`dewniverse.me`。
- [ ] Firestore 已创建，规则已改为上述 `users/{userId}/...` 并发布。
- [ ] 主站与 Personal Tool 的 `VITE_FIREBASE_*` 完全一致。

完成以上步骤后，在 Firebase 侧的设置即告完成；对接与代码实现请按「复制到 Dewniverse 窗口」的说明在主站项目中完成。
