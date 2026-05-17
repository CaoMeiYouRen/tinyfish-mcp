<h1 align="center">tinyfish-mcp </h1>
<p>
  <img alt="Version" src="https://img.shields.io/github/package-json/v/CaoMeiYouRen/tinyfish-mcp.svg" />
  <a href="https://hub.docker.com/r/caomeiyouren/tinyfish-mcp" target="_blank">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/caomeiyouren/tinyfish-mcp">
  </a>
  <a href="https://app.codecov.io/gh/CaoMeiYouRen/tinyfish-mcp" target="_blank">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/CaoMeiYouRen/tinyfish-mcp">
  </a>
  <a href="https://github.com/CaoMeiYouRen/tinyfish-mcp/actions?query=workflow%3ARelease" target="_blank">
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/CaoMeiYouRen/tinyfish-mcp/release.yml?branch=master">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-blue.svg" />
  <a href="https://github.com/CaoMeiYouRen/tinyfish-mcp#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/tinyfish-mcp/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/tinyfish-mcp/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/CaoMeiYouRen/tinyfish-mcp?color=yellow" />
  </a>
</p>


> 一个基于 TinyFish 免费搜索 API 的 MCP（Model Context Protocol）服务，为 AI 助手提供实时网络搜索与网页内容获取能力。支持 **Stdio** 和 **HTTP** 两种传输方式接入。

## 功能

- **网络搜索** — 通过 `search` 工具进行关键词搜索，返回标题、摘要、URL 等结构化结果
- **网页内容抓取** — 通过 `fetch` 工具获取指定 URL 的完整网页内容（Markdown / HTML / JSON）
- **双协议支持** — Stdio 模式（本地进程）和 HTTP 模式（远程服务）均可
- **鉴权保护** — HTTP 模式下支持 Bearer Token 鉴权，可配置多个 Token
- **速率限制** — HTTP 模式下内置限流保护，防止接口滥用
- **多云部署** — 支持 Docker、Vercel、Cloudflare Workers 等多种部署方式

## 可用工具

| 工具名 | 描述 |
|---|---|
| `search` | 网络搜索，返回结构化结果（标题、URL、摘要） |
| `fetch` | 获取指定 URL 的完整网页内容，支持 Markdown/HTML/JSON 格式 |

## 快速开始

### 准备

1. 前往 [agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys) 获取 API Key
2. 设置环境变量 `TINYFISH_API_KEY`

### Stdio 模式（推荐用于个人开发）

在 MCP 客户端（Claude Desktop / Cursor / Windsurf 等）配置文件中添加：

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

### HTTP 模式（推荐用于团队共享）

```bash
# 1. 创建 .env 文件
cat > .env << EOF
TINYFISH_API_KEY=<your-api-key>
AUTH_TOKEN=<your-auth-token>
EOF

# 2. 启动服务
npx -y tinyfish-mcp-server
# 服务运行在 http://localhost:3000
```

在 MCP 客户端中配置：

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

## 环境变量

| 变量名 | 说明 | 默认值 | 适用模式 |
|---|---|---|---|
| `TINYFISH_API_KEY` | TinyFish API Key（必填） | — | 通用 |
| `AUTH_TOKEN` | 鉴权 Token | — | HTTP |
| `AUTH_TOKENS` | 多 Token（逗号分隔） | — | HTTP |
| `AUTH_ENABLED` | 鉴权开关 | `true` | HTTP |
| `RATE_LIMIT_ENABLED` | 限流开关 | `true` | HTTP |
| `RATE_LIMIT_WINDOW` | 限流窗口（ms） | `60000` | HTTP |
| `RATE_LIMIT_MAX` | 窗口内最大请求数 | `30` | HTTP |
| `PORT` | HTTP 端口 | `3000` | HTTP |

## 文档

- [部署指南](./docs/deployment.md) — Docker / Vercel / Cloudflare Workers 部署
- [使用指南](./docs/usage.md) — 详细配置与 MCP 客户端接入
- [设计文档](./docs/plan.md) — 架构设计与技术方案

## 🛠️ 开发

### 依赖要求

- node >=20

### 常用命令

```sh
pnpm install       # 安装依赖
pnpm run dev       # 开发模式
pnpm run build     # 编译
pnpm run typecheck # 类型检查
pnpm run lint      # 代码检查
pnpm run test      # 运行测试
```

## 👤 作者


**CaoMeiYouRen**

-   Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)
-   GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 🤝 贡献

欢迎 贡献、提问或提出新功能！<br />如有问题请查看 [issues page](https://github.com/CaoMeiYouRen/tinyfish-mcp/issues). <br/>贡献或提出新功能可以查看[contributing guide](https://github.com/CaoMeiYouRen/tinyfish-mcp/blob/master/CONTRIBUTING.md).

## 💰 支持

如果觉得这个项目有用的话请给一颗⭐️，非常感谢

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://oss.cmyr.dev/images/202306192324870.png" width="312px" height="78px" alt="在爱发电支持我">
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/tinyfish-mcp&type=Date)](https://star-history.com/#CaoMeiYouRen/tinyfish-mcp&Date)

## 📝 License

Copyright © 2026 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).<br />
This project is [MIT](https://github.com/CaoMeiYouRen/tinyfish-mcp/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_

