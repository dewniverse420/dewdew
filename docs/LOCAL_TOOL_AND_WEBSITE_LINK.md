# 本地个人工具 与 线上网站 如何建立链接

## 你的疑惑

- **个人工具（dewdew）**：代码在本地电脑，是一个本地仓库。
- **个人网站（Dewniverse）**：是线上网址 https://www.dewniverse.me/。

这两者不是「两个网址互相连」，而是：**把个人工具「构建成网页文件」后，部署到你网站所在域名的某个路径下**，网站再通过一个**链接**打开这个路径。下面用最简方式说明。

---

## 核心关系（一句话）

**个人工具**先在你电脑上**打包成静态网页**，再把这些网页**上传/部署**到和你主站**同一个域名**下的子路径（例如 `/app/personaltool/`）；**个人网站**只负责在页面上放一个**指向这个路径的链接**。用户点链接就打开你部署好的工具 PWA。

---

## 分步理解

### 1. 个人工具（本地）→ 变成「一坨可部署的文件」

- 在你的电脑上，在 dewdew 项目里执行**构建**，例如：
  ```bash
  VITE_BASE_PATH=/app/personaltool/ npm run build
  ```
- 构建完成后，项目里会多出一个 **`dist/`** 文件夹，里面是**纯静态文件**（HTML、JS、CSS 等），没有源码、没有本地路径依赖，可以在任何支持静态托管的服务器上跑。
- 这一步做完，**个人工具**就从「本地代码」变成「一坨可以放到网上的文件」。

### 2. 把这坨文件放到「和主站同一个域名」的某个路径下

- 你的主站是 **https://www.dewniverse.me/**，由某台服务器或某个托管服务（如 Vercel、Netlify、你自己的 Nginx 等）提供。
- 你要做的是：把上面 **`dist/` 里的全部内容**，放到这台服务器/托管里，并让它们对应到网址：
  **https://www.dewniverse.me/app/personaltool/**
- 具体做法取决于你的主站是怎么部署的，例如：
  - **Vercel**：可以单独建一个项目专门部署 Personal Tool，然后在主站项目里用 rewrites 把 `/app/personaltool/*` 指过去；或者把 `dist/` 内容放到主站项目的 `public/app/personaltool/` 再一起部署。
  - **Netlify**：类似，把 `dist/` 内容放到主站站点的 `app/personaltool/` 目录下一起发布。
  - **自己的服务器（Nginx）**：把 `dist/` 上传到服务器某个目录（如 `/var/www/dewniverse/app/personaltool/`），在 Nginx 里配置 `location /app/personaltool/ { ... }` 指向这个目录。

这样之后，**任何人访问 https://www.dewniverse.me/app/personaltool/** 时，服务器返回的就是你从本地构建出来的那套 Personal Tool 页面（也就是你的工具 PWA）。

### 3. 个人网站如何「访问」工具 PWA

- 主站**不需要**去「读你电脑上的文件」。
- 主站只要在页面上放一个**超链接**，指向你部署好的地址即可，例如：
  ```html
  <a href="https://www.dewniverse.me/app/personaltool/">个人助手</a>
  ```
  或
  ```html
  <a href="/app/personaltool/">个人助手</a>
  ```
- 用户点击这个链接，浏览器会打开 **https://www.dewniverse.me/app/personaltool/**，也就是你从本地构建并部署上去的那套 PWA。  
所以：**个人网站是通过「链接到同一个域名下的子路径」来访问工具 PWA 的，不是直接访问你本地的文件。**

---

## 总结对照

| 东西           | 是什么                         | 和「链接」的关系 |
|----------------|--------------------------------|------------------|
| 个人工具（本地）| 你电脑上的代码仓库             | 你本地执行 build，得到 `dist/`。 |
| `dist/`        | 构建出的静态网页文件           | 把这些文件部署到服务器上某个路径。 |
| 主站服务器/托管 | 提供 https://www.dewniverse.me 的服务 | 同时提供 `/app/personaltool/` 路径，对应你部署的 `dist/` 内容。 |
| 个人网站页面   | 线上 https://www.dewniverse.me 的页面 | 页面上有一个链接，指向 `https://www.dewniverse.me/app/personaltool/`。 |
| 用户点「个人助手」| 浏览器请求 /app/personaltool/ | 服务器返回你部署的 PWA，用户就「访问到」了你的工具。 |

所以：**链接** = 主站上的一个指向 `/app/personaltool/` 的 URL；**两者如何构建链接** = 本地工具构建 → 部署到该 URL 对应的路径 → 主站放这个 URL 的链接。主站不访问你电脑，只访问同一域名下你部署好的那个路径。
