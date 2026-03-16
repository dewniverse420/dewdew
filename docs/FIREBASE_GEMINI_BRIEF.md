# 发给 Firebase 里 Gemini 的说明（复制整段使用）

下面这段话是给 **Firebase 控制台里集成的 Gemini AI** 用的。你可以整段复制到 Firebase 的 Gemini 对话里，让它根据你的项目帮你完成或检查设置。

---

## 可复制内容（直接粘贴给 Gemini）

```
我的项目是一个网站，主站域名是 https://www.dewniverse.me/，还有一个子应用（个人助手 PWA）部署在同一域名下的 https://www.dewniverse.me/app/personaltool/。主站和这个子应用要共用同一套用户登录与云端数据，所以都使用当前这个 Firebase 项目。

请你帮我在当前 Firebase 项目里完成或确认这些设置：

1) Authentication（身份验证）  
   - 启用「Email/密码」登录方式（如已有则确认已开启）。  
   - 在「已授权的网域」里确保有：www.dewniverse.me 和 dewniverse.me。没有的话请告诉我如何添加。这样主站和 /app/personaltool/ 才能正常弹出登录和保持登录态。

2) Firestore Database（云数据库）  
   - 如果还没有 Firestore 数据库，请指导我创建（区域可优先选离亚洲近的，例如 asia-east1）。  
   - 在 Firestore 的「规则」里，需要按用户隔离数据：只允许已登录用户读写自己 uid 下的数据。结构是 users/{userId}/... ，即：match /users/{userId}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == userId; }。请帮我确认或写出完整的 rules_version 2 规则并说明在哪里粘贴、发布。

3) 项目配置（Web 应用）  
   - 我的主站和子应用都是 Web 前端，需要同一套配置（apiKey、authDomain、projectId、storageBucket、messagingSenderId、appId）。请告诉我在哪里可以看到这 6 个值，以及如何安全地在前端项目里使用（例如用环境变量，不要提交密钥到公开仓库）。

4) 若项目里有 Gemini 相关能力  
   - 若当前项目已集成或可集成 Gemini，请说明在这个「网站 + 子应用共用登录与 Firestore」的架构下，Gemini 可以怎样配合使用（例如仅限已登录用户、或读写 Firestore 时的注意事项），并给出简单建议。

请按 1～4 逐项说明或带我操作，用当前 Firebase 项目即可。
```

---

复制上面引号内的整段（从「我的项目是一个网站」到「用当前 Firebase 项目即可」）粘贴到 Firebase 里的 Gemini 对话即可。若 Gemini 问项目名称或域名，直接说「主站是 https://www.dewniverse.me/，子应用是 https://www.dewniverse.me/app/personaltool/」即可。
