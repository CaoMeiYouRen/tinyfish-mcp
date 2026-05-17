# 使用指南

## MCP 工具说明

tinyfish-mcp 提供两个 MCP 工具：

### search — 网络搜索

根据关键词搜索网络，返回包含标题、摘要、URL 的结构化结果。

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `query` | `string` | 是 | 搜索关键词 |
| `page` | `number` | 否 | 分页页码（0–10），默认 0 |
| `location` | `string` | 否 | 地理位置代码，如 US、CN、GB |
| `language` | `string` | 否 | 语言代码，如 en、zh、fr |

**返回示例：**

```json
{
  "query": "web automation tools",
  "results": [
    {
      "position": 1,
      "siteName": "tinyfish.ai",
      "title": "TinyFish — AI Web Automation Platform",
      "snippet": "Automate any website with natural language...",
      "url": "https://tinyfish.ai"
    }
  ],
  "totalResults": 10,
  "page": 0
}
```

### fetch — 网页内容抓取

获取指定 URL 的完整网页内容，以 Markdown/HTML/JSON 格式返回。最多支持同时抓取 10 个 URL。

**输入参数：**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `urls` | `string[]` | 是 | 目标 URL 列表（1–10 个） |
| `format` | `string` | 否 | 返回格式：`markdown`（默认）、`html`、`json` |
| `links` | `boolean` | 否 | 是否提取页面内链接，默认 false |
| `imageLinks` | `boolean` | 否 | 是否提取图片链接，默认 false |

**返回示例：**

```json
{
  "results": [
    {
      "url": "https://example.com",
      "finalUrl": "https://example.com/",
      "title": "Example Domain",
      "language": "en",
      "text": "# Example Domain\n\n...",
      "format": "markdown"
    }
  ],
  "errors": []
}
```

---

## MCP 客户端配置

### Claude Desktop

**Windows** (`%APPDATA%\Claude\claude_desktop_config.json`)：

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

HTTP 模式：

```json
{
  "mcpServers": {
    "tinyfish-search": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer <your-auth-token>"
      }
    }
  }
}
```

### Cursor

在 Cursor 设置 → MCP 中添加：

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

### Windsurf

**Windows** (`%USERPROFILE%\.codeium\windsurf\mcp_config.json`)：

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

### Claude Code（CLI）

```bash
claude mcp add --transport stdio tinyfish-search \
  -- npx -y tinyfish-mcp
```

HTTP 模式：

```bash
claude mcp add --transport http tinyfish-search \
  http://localhost:3000/mcp
```

---

## 鉴权配置

### 单 Token 模式

```bash
export AUTH_TOKEN=my-secret-token
```

客户端请求需携带：

```
Authorization: Bearer my-secret-token
```

### 多 Token 模式

```bash
export AUTH_TOKENS=token1,token2,token3
```

每个 Token 均可独立鉴权通过，适合多用户或多客户端场景。

### 关闭鉴权

```bash
export AUTH_ENABLED=false
```

> 仅在开发或内网环境下使用，公网部署务必开启鉴权。

---

## 限流配置

默认限流策略：**每 60 秒最多 30 个请求**（基于 IP 或 Token）。

可通过环境变量调整：

```bash
# 每秒最多 5 个请求（窗口 1000ms）
RATE_LIMIT_WINDOW=1000
RATE_LIMIT_MAX=5

# 关闭限流
RATE_LIMIT_ENABLED=false
```

---

## 搜索技巧

### 限定站点搜索

通过 `site:` 操作符限定搜索范围：

```
site:github.com tinyfish mcp
```

### 排除站点

通过 `-site:` 排除不需要的站点：

```
recipe ideas -site:facebook.com -site:youtube.com
```

### 地域与语言

```json
{
  "query": "best restaurants",
  "location": "FR",
  "language": "fr"
}
```

### 搜索 + 抓取联动

先搜索获取 URL，再抓取完整内容：

1. 使用 `search` 工具搜索关键词，获取结果 URL
2. 使用 `fetch` 工具抓取目标 URL 的完整内容

这是 AI 助手的典型工作流，tinyfish-mcp 的 `search` + `fetch` 两个工具天然支持。

---

## 故障排查

### Stdio 模式：工具不显示

1. 确认 MCP 客户端已重启
2. 检查 `TINYFISH_API_KEY` 是否正确
3. 查看客户端日志确认连接状态

### Stdio 模式：报 Permission denied

某些系统需要 Node.js 的完整路径：

```json
{
  "mcpServers": {
    "tinyfish-search": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/node_modules/.bin/tinyfish-mcp"],
      "env": {
        "TINYFISH_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

### HTTP 模式：连接失败

1. 确认服务已启动：`curl http://localhost:3000/mcp`
2. 确认 Auth Token 正确
3. 检查防火墙/安全组是否放行端口
4. SSE 连接需要 HTTP/1.1 长连接支持
