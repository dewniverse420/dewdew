# Firebase 看不到用户数据 — 一步步排查

按下面顺序做，每步做完再看下一步。多数情况会在前几步就找到原因。

---

## 第 1 步：确认你是在「线上站点」且「已登录」

- 用手机或电脑浏览器打开：**https://dewdew.dewniverse.me**（必须是线上地址，不是 localhost）。
- 若设置了「必须先登录」：从主站 https://www.dewniverse.me 登录后，再点进 Dewdew，或按提示在 dewdew 完成登录。
- **看页面右上角**：能看见邮箱或「已登录 / 退出」之类，才算已登录。  
  若一直卡在登录页或跳回主站登录，说明登录没成功，后面不会写 Firestore。

**自检**：右上角有登录状态吗？  
- 没有 → 先解决登录（第 3 步「授权域名」很可能没加 dewdew.dewniverse.me）。  
- 有 → 继续第 2 步。

---

## 第 2 步：在「已登录」状态下做一次会写数据的操作

Firestore 只有在你**写数据**后才会出现文档，只打开页面不操作是不会有的。

请任选其一做一次：

1. **新建一条待办**：底部点「+」→ 选待办 → 填标题、选个 DDL → 保存。  
2. **改财务设置**：底部进「财务」→ 点右上设置/齿轮（若有）或进入某一页能改「参考货币/展示货币」的地方 → 改一下并保存。

然后**等几秒**，再去做第 4 步看 Firestore。

**自检**：我刚刚在线上、已登录的 dewdew 里新建了待办或改了财务吗？  
- 没有 → 先做一次再去看 Firestore。  
- 有 → 继续第 3 步（同时可以去做第 4 步看数据）。

---

## 第 3 步：Firebase 控制台 — 授权域名里必须有 dewdew

如果域名没加，登录会失败，Firestore 就不会有该用户的数据。

1. 打开 [Firebase 控制台](https://console.firebase.google.com)，左上角选对项目（**dewniverse** / dewniverse-1895f）。
2. 左侧 **Build** → **Authentication**。
3. 打开 **Settings（设置）** 或 **Authorized domains（已授权的网域）** 标签。
4. 看列表里有没有 **`dewdew.dewniverse.me`**（注意是子域，没有 www）。
5. 如果没有：点「添加网域」，填 `dewdew.dewniverse.me`，保存。

**自检**：授权域名列表里有 `dewdew.dewniverse.me` 吗？  
- 没有 → 加上后再在 dewdew 重新登录，然后重做第 2 步。  
- 有 → 继续第 4 步。

---

## 第 4 步：Vercel 环境变量 — 名字和值都要对

线上站点只有拿到正确的 Firebase 配置才会连到你看到的那个 Firestore。

1. 打开 [Vercel](https://vercel.com) → 你的 **dewdew** 项目（不是主站项目）。
2. 顶部 **Settings** → **Environment Variables**。
3. 确认下面 6 个变量**都存在**且**名字一字不差**（包括 `VITE_` 前缀）：
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. 值要和主站（或 Firebase 控制台里同一项目）的完全一致。  
   若主站能正常用 Firebase，可直接从主站项目的 env 复制这 6 个值过来。
5. **改过任何变量后**：到 **Deployments**，对**最新一次部署**点 **⋯** → **Redeploy**，等部署完成再测。

**自检**：6 个变量都存在、名字正确、值跟主站一致，且改过后已经 Redeploy 过了吗？  
- 否 → 补全/改对并 Redeploy，再在线上登录、重做第 2 步。  
- 是 → 继续第 5 步。

---

## 第 5 步：在 Firestore 里找对位置

数据在「项目 → Firestore → 数据」里，且是按「用户 uid」放在 `users` 下面的。

1. Firebase 控制台 → 选**同一个项目**（dewniverse）。
2. 左侧 **Build** → **Firestore Database**（或「数据库和存储」→ Firestore）。
3. 点顶部的 **「数据」** 标签（不是「规则」或「索引」）。
4. 看根目录有没有一个集合叫 **`users`**。
   - 有：点开 **users** → 下面会有一个或多个文档，文档 ID 是一长串（用户 uid）。再点进某个文档，里面会有 **todos**、**goals**、**finance**、**settings** 等子集合或子文档。
   - 没有：说明还没有任何一次「已登录 + 写数据」成功过，做 **第 5b 步** 再决定往哪查。

**自检**：Firestore 数据里能看到 `users` 吗？点进去能看到子集合吗？  
- 看不到 users → 做下面第 5b 步，根据控制台提示判断原因。  
- 能看到 → 数据已经写进去了。

---

## 第 5b 步：看控制台里的 [dewdew] 提示（找不到数据时必做）

在**电脑浏览器**打开 **https://dewdew.dewniverse.me**，按 **F12** 打开开发者工具，切到 **Console（控制台）**，看有没有一行以 **`[dewdew]`** 开头的灰色提示：

| 看到的提示 | 说明 | 你该做啥 |
|------------|------|----------|
| **Firebase 已连接，用户 uid: xxx** | 线上已连 Firebase 且已登录 | 在页面里**新建一条待办并保存**（或改财务设置保存），等几秒后回 Firestore 刷新，应出现 `users` → 该 uid。若仍没有，看 Console 是否有红色报错。 |
| **Firebase 已配置但当前未登录** | 连了 Firebase 但没登录 | 先去主站登录再进 dewdew，或按你当前流程在 dewdew 登录，确保右上角有登录状态后再试写数据。 |
| **未检测到 Firebase 配置** | 线上没拿到 `VITE_FIREBASE_*` | 说明 Vercel 环境变量没生效：检查变量名是否一字不差、是否对 Production 生效、**改过后是否点了 Redeploy**。 |

做完 5b 再回到第 1～4 步或第 6 步继续排查。

---

## 第 6 步：看浏览器控制台有没有报错

在**线上** https://dewdew.dewniverse.me 操作时：

1. 按 **F12**（或右键 → 检查）打开开发者工具。
2. 切到 **Console（控制台）** 标签。
3. 清空一下日志，然后：登录（若未登录）→ 新建一条待办或改财务设置。
4. 看有没有**红色报错**，尤其是：
   - `auth/unauthorized-domain` → 授权域名没加或加错，回到第 3 步。
   - `permission-denied` 或 Firestore 相关错误 → 可能是规则或没登录，确认已登录且规则已按文档部署。
   - `Firebase: Error (auth/...)` → 认证问题，检查域名和登录方式。

把**完整报错文案**或截图记下来，若前面步骤都确认无误仍无数据，可据此再排查。

---

## 小结：最常见的三点

1. **没在「线上 + 已登录」时做写操作** → 先在 https://dewdew.dewniverse.me 登录，再新建待办或改财务。
2. **授权域名没有 `dewdew.dewniverse.me`** → 在 Authentication → 已授权的网域里添加。
3. **Vercel 环境变量没配或改完没 Redeploy** → 配齐 6 个 `VITE_FIREBASE_*`，保存后对最新部署点 Redeploy。

按 1 → 2 → 3 → 4 → 5 → 6 的顺序走一遍，一般就能在 Firestore 里看到用户数据；若某一步卡住，把现象或控制台报错发出来即可继续排查。
