# 部署指南 (Deployment Guide)

本项目的部署方式取决于你希望如何处理 **Gemini API 的访问代理**。由于本项目目前默认使用本地的 Antigravity 代理 (`http://127.0.0.1:8045`)，单纯部署前端页面到公网（如 Vercel）可能导致无法连接 API，除非你同时也部署了代理服务或修改为直连模式。

以下是三种常见的部署方案：

## 方案一：静态托管 (推荐用于演示/公网访问)
**适用于**：Vercel, Netlify, GitHub Pages
**注意**：此方案要求 API 地址必须是公网可访问的，或者将代码修改为直接调用 Google Gemini API（无代理模式）。

### 1. 修改配置
如果你没有公网部署的代理服务器，建议修改 `services/geminiService.ts`，使用 Google 官方 SDK 直接在前端调用（注意：这会暴露 API Key，仅限个人项目），或搭建一个公网反向代理。

### 2. 构建项目
在项目根目录运行：
```bash
npm run build
```
这将生成 `build` 目录，里面包含了所有静态文件。

### 3. 上传部署
*   **Vercel (最简单)**: 安装 Vercel CLI (`npm i -g vercel`) 然后运行 `vercel`，或者将代码推送到 GitHub 并连接 Vercel。
    *   记得在 Vercel 后台设置环境变量 `VITE_GEMINI_API_KEY`。
*   **Netlify**: 拖拽 `build` 文件夹到 Netlify 用于部署。

---

## 方案二：Docker 容器化部署 (推荐用于私有化部署)
**适用于**：自建服务器, 群晖, 云服务器 (AWS/阿里云)
**优势**：可以将前端和环境打包在一起，稳定可靠。

### 1. 创建 Dockerfile
在项目根目录创建名为 `Dockerfile` 的文件：

```dockerfile
# 阶段 1: 构建
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 阶段 2: 服务 (Nginx)
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
# 如果需要 React Router 路由支持 (刷新不 404)，需要自定义 nginx.conf
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 构建并运行
```bash
# 构建镜像
docker build -t ai-legal-marketing .

# 运行容器
docker run -d -p 8080:80 ai-legal-marketing
```
访问 `http://localhost:8080` 即可见到部署后的应用。

---

## 方案三：局域网/本地预览
**适用于**：办公室内部演示，无需公网。

1.  确保你的电脑和同事在同一 WiFi 下。
2.  运行命令：
    ```bash
    npm run dev -- --host
    ```
    (注意 `vite.config.ts` 中已配置 `server.host: true`，直接 `npm run dev` 应该也可以)
3.  终端会显示 `Network: http://192.168.x.x:5173/`。
4.  将该地址发给同事即可访问。
    *   **关键点**：同事的电脑必须也能访问你的 `http://127.0.0.1:8045` 代理。如果代理只监听 localhost，这一步会失败。你需要配置代理监听 `0.0.0.0`，并将前端代码中的 `VITE_ANTIGRAVITY_BASE_URL` 改为你的局域网 IP (如 `http://192.168.1.5:8045`)。

## 环境变量配置
无论哪种方式，请确保在生产环境设置了以下环境变量：
*   `VITE_GEMINI_API_KEY`: 你的 Google Gemini API Key
*   `VITE_ANTIGRAVITY_BASE_URL`: (可选) 如果你的代理地址不是默认的 localhost:8045。
