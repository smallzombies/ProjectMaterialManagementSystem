# 部署说明

本项目为纯前端单页应用（React + Vite），使用 localStorage 作为演示数据存储，**无后端依赖**。部署时请务必使用「构建后的静态文件」，不要直接运行 `npm run dev`。

> 常见问题：`npm run dev` 是开发服务器，依赖常驻进程。进程停止后浏览器会报 `ERR_CONNECTION_REFUSED`，无法访问。生产部署请按本文档操作。

## 一、构建

在项目根目录执行：

```bash
npm install      # 首次需要
npm run build
```

构建成功后生成 `dist/` 目录，这就是可部署的静态产物（包含全部 HTML/JS/CSS 资源）。

## 二、部署方式（任选其一）

### 方式 A：本地预览（临时/演示）

```bash
npm run preview
```

默认访问地址：http://localhost:4173

> 注意：`preview` 同样依赖终端进程，关闭终端即不可访问。适合临时演示，不适合长期运行。

### 方式 B：Nginx（推荐，Linux 服务器）

将 `dist/` 目录上传到服务器，例如 `/var/www/material-manager`，Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/material-manager;
    index index.html;

    # 支持前端路由刷新（SPA history 路由）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

保存后执行 `nginx -s reload` 生效。

### 方式 C：Windows IIS

1. 将 `dist/` 目录复制到站点根目录（如 `C:\inetpub\wwwroot\material-manager`）。
2. IIS 新建网站，物理路径指向该目录，默认文档设为 `index.html`。
3. 打开 IIS「URL 重写」，添加入站规则：正则 `.*`，重写为 `/index.html`，否则刷新子路由页面会 404。

### 方式 D：任意静态托管

`dist/` 是纯静态文件，也可直接放到 GitHub Pages、腾讯云 COS、阿里云 OSS、Netlify 等静态托管平台。S3/OSS/COS 类平台请设置「默认首页为 index.html」，并开启「错误重定向到 index.html」以支持前端路由。

## 三、注意事项

- **部署 `dist/`，不是部署源码**。不要把 `src/` 当站点根目录。
- 若后端 API 地址后续变化，请在 `src` 中修改接口配置后重新 `npm run build`。
- 演示数据存于浏览器 localStorage，换浏览器/设备/清除缓存后会回到种子数据。
