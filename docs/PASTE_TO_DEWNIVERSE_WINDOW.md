# 复制到 Dewniverse 网站窗口的指导说明

**使用方式**：打开 **Dewniverse 主站项目** 的 Cursor 对话，将下面整段「自然语言描述」复制粘贴进去，让该窗口的助手根据描述完成对接实现。

---

## 可复制的自然语言描述（整段复制到 Dewniverse 窗口）

```
我的主站是 https://www.dewniverse.me/（Dewniverse）。我还有一个个人助手应用部署在同一域名下的子路径：https://www.dewniverse.me/app/personaltool/。两个项目是分开的代码仓库，主站只负责入口和跳转。

请你在本项目中完成以下对接，使主站与个人助手共用同一套登录状态，用户在主站登录后进入 /app/personaltool/ 时无需再次登录。

1) 入口链接  
在导航或合适位置（例如和「Get Help」、Orbit、Trajectory 等一起）增加一个「个人助手」入口，链接地址为：https://www.dewniverse.me/app/personaltool/ 或 /app/personaltool/。用普通 <a> 或你们现有的路由/按钮即可，新标签打开或本页跳转都可以。

2) 接入 Firebase  
安装 firebase 依赖（如未安装）。新建一个 Firebase 配置文件（例如 src/lib/firebase.js 或 config/firebase.js），初始化 app 并导出 getAuth() 得到的 auth 实例。配置项使用环境变量：VITE_FIREBASE_API_KEY、VITE_FIREBASE_AUTH_DOMAIN、VITE_FIREBASE_PROJECT_ID、VITE_FIREBASE_STORAGE_BUCKET、VITE_FIREBASE_MESSAGING_SENDER_ID、VITE_FIREBASE_APP_ID。这些变量的值我会在 Firebase 控制台拿到后填到 .env，与个人助手应用使用同一个 Firebase 项目。

3) 追踪登录状态  
在根组件或全局 Layout 里用 onAuthStateChanged(auth, callback) 订阅登录态变化，把当前用户（user 或 null）存到 state 或 context，供全站使用。这样用户在主站登录后，再打开 /app/personaltool/ 会共享同一登录态，不用重复登录。

4) 需要登录才能访问的页面（可选）  
如果某些页面（例如 Orbit、Trajectory、Missions 等）需要登录后才可访问，请根据上面的登录状态做路由保护：未登录时重定向到登录页或首页。并提供一个登录页（例如 /login），表单里用 Firebase 的 signInWithEmailAndPassword 和 createUserWithEmailAndPassword 完成登录和注册。

5) 环境变量说明  
请在项目根目录添加 .env.example（若没有），其中列出上述 VITE_FIREBASE_* 变量名及说明，并注明「与个人助手共用同一 Firebase 项目，值从 Firebase 控制台获取」。实际值我会填到 .env，不要提交到 Git。

请按以上 1～5 在本项目中实现或修改相应文件，保证主站能正确跳转到 /app/personaltool/，且与个人助手共用 Firebase 登录态。
```

---

## 你复制后需要补充的信息

把上面整段发到 Dewniverse 窗口后，如果助手问你「具体放在哪个文件 / 哪个菜单」，你可以补充说明，例如：

- 「入口链接放在顶部导航栏右侧」或「放在 Get Help 下拉里」
- 「登录页路径用 /login」
- 「需要登录的页面是：Orbit、Trajectory、Missions」（按你实际路由名说）

这样对应窗口就能在正确位置完成对接。
