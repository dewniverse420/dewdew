# GitHub 仓库创建与首次推送（方案 A）

dewdew 按方案 A 独立部署，需要**独立 Git 仓库**，再在 Vercel 上单独建项目并绑定域名 `dewdew.dewniverse.me`。本节说明如何在 GitHub 创建仓库并完成首次推送。

## 一、在 GitHub 上创建仓库

1. 登录 [GitHub](https://github.com)，点击右上角 **+** → **New repository**。
2. 填写：
   - **Repository name**：例如 `dewdew` 或 `dewniverse-dewdew`（与主站仓库区分即可）。
   - **Description**：可选，如「Dewdew - 独立前端，方案 A 子域部署」。
   - **Public** 即可（私有也可，Vercel 均支持）。
   - **不要**勾选 “Add a README / .gitignore / license”（本地已有代码，避免冲突）。
3. 点击 **Create repository**。创建后会看到 “…or push an existing repository from the command line” 的说明，记下仓库 URL，例如：
   - `https://github.com/你的用户名/dewdew.git`
   - 或 SSH：`git@github.com:你的用户名/dewdew.git`

## 二、本地已有 Git 时（已有 commit）

若 `e:\dewdew` 已经是 Git 仓库且有过提交：

```powershell
cd e:\dewdew
git remote add origin https://github.com/你的用户名/dewdew.git
# 若默认分支不是 main，可：git branch -M main
git push -u origin main
```

若主分支叫 `master`，把上面最后一行的 `main` 改成 `master`，或在 GitHub 仓库设置里把默认分支改为 `main` 后再 push。

## 三、本地还没有 Git 时（首次初始化）

若当前目录还没有 `git init` 过：

```powershell
cd e:\dewdew
git init
git add .
git commit -m "Initial commit: dewdew standalone (Plan A)"
git branch -M main
git remote add origin https://github.com/你的用户名/dewdew.git
git push -u origin main
```

注意：`.env`、`.env.local`、`node_modules`、`dist/` 等已在 `.gitignore` 中，不会被提交。

## 四、推送后建议

- 在 GitHub 仓库 **Settings → General** 中可设置默认分支、描述等。
- 接下来在 **Vercel** 新建项目并导入该 GitHub 仓库，配置构建（如 `npm run build`、输出目录 `dist`）和域名 `dewdew.dewniverse.me`，并在 Vercel 环境变量中配置与主站一致的 `VITE_FIREBASE_*`。详见主站文档 **DEWDEW_DEPLOY_AND_FIREBASE.md** 或本仓库部署相关说明。

完成以上步骤即完成「在 GitHub 创建 dewdew 独立仓库并首次推送」，为方案 A 的 Vercel 独立部署做好准备。
