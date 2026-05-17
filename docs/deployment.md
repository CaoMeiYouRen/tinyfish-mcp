# 部署指南

tinyfish-mcp 支持多种部署方式，可根据需求选择。

## 部署方式概览

| 方式 | 适用场景 | 协议支持 |
|---|---|---|
| npx 直接运行 | 个人开发，Stdio 模式 | Stdio |
| Node.js 服务 | 自建服务器，团队共享 | HTTP |
| Docker | 容器化部署 | HTTP |
| Vercel | Serverless 部署 | HTTP |
| Cloudflare Workers | Edge 边缘部署 | HTTP |

---

## 一、npx 直运行（Stdio 模式）

无需安装，直接在 MCP 客户端配置中使用：

```json
{
  "mcpServers": {
    "tinyfish-search": {
      "command": "npx",
      "args": ["-y", "tinyfish-mcp"],
      "env": {
        "TINYFISH_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

首次运行会自动下载包，后续使用缓存。

---

## 二、Node.js 服务部署（HTTP 模式）

### 2.1 从源码运行

```bash
git clone https://github.com/CaoMeiYouRen/tinyfish-mcp.git
cd tinyfish-mcp
pnpm install
pnpm run build

# 配置环境变量
export TINYFISH_API_KEY=<your-api-key>
export AUTH_TOKEN=<your-auth-token>

# 启动 HTTP 服务
node dist/server.mjs
```

### 2.2 使用 PM2 守护

```bash
npm install -g pm2
pm2 start dist/server.mjs --name tinyfish-mcp
pm2 save
pm2 startup
```

---

## 三、Docker 部署

### 3.1 docker-compose（推荐）

```yaml
# docker-compose.yml
services:
  tinyfish-mcp:
    image: caomeiyouren/tinyfish-mcp
    container_name: tinyfish-mcp
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      TINYFISH_API_KEY: <your-api-key>
      AUTH_TOKEN: <your-auth-token>
      PORT: 3000
    volumes:
      - ./logs:/app/logs
```

```bash
docker-compose up -d
```

### 3.2 Docker CLI

```bash
docker run -d \
  --name tinyfish-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TINYFISH_API_KEY=<your-api-key> \
  -e AUTH_TOKEN=<your-auth-token> \
  caomeiyouren/tinyfish-mcp
```

### 3.3 自行构建

```bash
docker build -t tinyfish-mcp .
docker run -d -p 3000:3000 -e TINYFISH_API_KEY=<your-api-key> tinyfish-mcp
```

容器化部署后，MCP 客户端配置：

```json
{
  "mcpServers": {
    "tinyfish-search": {
      "url": "http://<host>:3000/mcp",
      "headers": {
        "Authorization": "Bearer <your-auth-token>"
      }
    }
  }
}
```

---

## 四、Vercel 部署

### 4.1 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CaoMeiYouRen/tinyfish-mcp)

### 4.2 手动部署

```bash
npm install -g vercel
vercel login
vercel
```

按提示完成部署后，在 Vercel Dashboard 中设置环境变量：

- `TINYFISH_API_KEY`
- `AUTH_TOKEN`

### 4.3 CLI 部署并设置环境变量

```bash
vercel --prod \
  -e TINYFISH_API_KEY=<your-api-key> \
  -e AUTH_TOKEN=<your-auth-token>
```

部署完成后 MCP 客户端配置：

```json
{
  "mcpServers": {
    "tinyfish-search": {
      "url": "https://<your-project>.vercel.app/mcp",
      "headers": {
        "Authorization": "Bearer <your-auth-token>"
      }
    }
  }
}
```

---

## 五、Cloudflare Workers 部署

### 5.1 准备工作

```bash
npm install -g wrangler
wrangler login
```

### 5.2 部署

```bash
# 编译 Cloudflare Workers 入口
pnpm run build

# 设置环境变量（secret）
wrangler secret put TINYFISH_API_KEY
wrangler secret put AUTH_TOKEN

# 部署
pnpm run deploy:wrangler
```

或使用自定义域名：

```bash
wrangler deploy --routes "mcp.example.com/*"
```

---

## 六、Nginx 反向代理

如需将服务暴露到公网，推荐使用 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name mcp.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
        proxy_buffering off;
    }
}
```

> MCP SSE 连接需要长连接支持，务必设置 `proxy_read_timeout` 和 `proxy_buffering off`。
