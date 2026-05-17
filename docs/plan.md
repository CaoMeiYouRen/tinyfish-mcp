# tinyfish-mcp 设计文档

## 一、项目概述

基于 [TinyFish 免费 API](https://docs.tinyfish.ai) 实现的 MCP（Model Context Protocol）服务，为 AI 助手提供实时网络搜索与网页内容获取能力。支持 **Stdio** 和 **HTTP** 两种传输方式接入。

### 核心目标

- 通过 MCP 协议暴露 `search` 和 `fetch` 两个工具，供 LLM 客户端（Claude Desktop、Cursor、Windsurf 等）调用
  - **search**：网络搜索，返回标题、摘要、URL 等结构化结果
  - **fetch**：根据 URL 抓取完整网页内容，以 Markdown / HTML 等格式返回
- Stdio 模式下作为本地进程运行，适合个人开发场景
- HTTP 模式下作为独立服务部署，适合团队共享或多客户端接入
- 使用 **zod** 对所有接口入参进行声明式校验

### 约束

- 初版聚焦 **Search + Fetch** 两个 API，不引入 Agent / Browser 等复杂 API
- 抽象层设计简洁，不引入过度的间接层或 DI 框架
- 测试覆盖率 >= 60%

---

## 二、整体架构

```
┌──────────────────────────────────────────────────────────┐
│                      LLM 客户端                           │
│              (Claude Desktop / Cursor / etc.)              │
└────────────┬──────────────────────────┬───────────────────┘
             │ MCP Stdio                │ MCP HTTP (SSE)
             ▼                          ▼
┌────────────────────────┐ ┌───────────────────────────────┐
│   Stdio Transport      │ │   HTTP Transport              │
│  (stdio-server)        │ │  (Hono + SSE)                 │
├────────────────────────┤ ├───────────────────────────────┤
│                        │ │  Auth Middleware              │
│                        │ │  Rate Limit Middleware        │
│                        │ │  Logger Middleware            │
├────────────────────────┤ ├───────────────────────────────┤
│              MCP Protocol Layer (Tool Handler)           │
├──────────────────────────────────────────────────────────┤
│  Zod Validation Layer  │  参数校验（search / fetch 入参）  │
├──────────────────────────────────────────────────────────┤
│  Search Service        │  Fetch Service   （抽象层）      │
├──────────────────────────────────────────────────────────┤
│  TinyFish Search Adapter  │  TinyFish Fetch Adapter       │
│          (@tiny-fish/sdk 封装)                            │
└──────────────────────────────────────────────────────────┘
```

### 分层说明

| 层 | 职责 | 关键模块 |
|---|---|---|
| Transport | 处理 MCP 协议传输（Stdio/HTTP SSE） | `src/transports/stdio.ts`, `src/transports/http.ts` |
| MCP Protocol | 注册 MCP 工具、处理请求路由 | `src/mcp/handler.ts`, `src/mcp/tools.ts` |
| Zod Validation | 对 MCP 工具入参进行声明式校验与类型推导 | `src/schemas/search.ts`, `src/schemas/fetch.ts` |
| Service | 搜索与抓取业务抽象，屏蔽底层 SDK 细节 | `src/services/search.ts`, `src/services/fetch.ts` |
| API Adapter | 封装 `@tiny-fish/sdk` 调用，处理认证和错误 | `src/adapters/tinyfish-search.ts`, `src/adapters/tinyfish-fetch.ts` |

---

## 三、目录结构

```
src/
├── index.ts                        # Stdio 入口（MCP stdio server）
├── app.ts                          # Hono 应用实例（HTTP 入口共用）
├── server.ts                       # HTTP 入口（Hono serve）
├── types.ts                        # 全局类型定义
├── env.ts                          # 环境变量
├── schemas/
│   ├── search.ts                   # search 参数 Zod Schema
│   └── fetch.ts                    # fetch 参数 Zod Schema
├── transports/
│   ├── stdio.ts                    # Stdio 传输层
│   └── http.ts                     # HTTP SSE 传输层
├── mcp/
│   ├── handler.ts                  # MCP 请求处理，工具注册与路由
│   └── tools.ts                    # MCP Tool 定义（search + fetch）
├── services/
│   ├── search.ts                   # 搜索服务抽象层
│   └── fetch.ts                    # 抓取服务抽象层
├── adapters/
│   ├── tinyfish-search.ts          # Search API 适配器
│   └── tinyfish-fetch.ts           # Fetch API 适配器
└── middlewares/
    ├── auth.ts                     # HTTP 鉴权中间件（Bearer Token）
    ├── rate-limit.ts               # 限流中间件
    ├── error.ts                    # 错误处理
    └── logger.ts                   # 日志

test/
├── schemas/
│   ├── search.test.ts
│   └── fetch.test.ts
├── services/
│   ├── search.test.ts
│   └── fetch.test.ts
├── adapters/
│   ├── tinyfish-search.test.ts
│   └── tinyfish-fetch.test.ts
├── mcp/
│   └── handler.test.ts
├── middlewares/
│   ├── auth.test.ts
│   └── rate-limit.test.ts
└── app.test.ts                     # 现有集成测试
```

---

## 四、核心模块设计

### 4.1 搜索服务层（`src/services/search.ts`）

在 `@tiny-fish/sdk` 之上增加一层薄抽象，目的是：
- 隔离 SDK 版本升级带来的类型/接口破坏性变更
- 为未来引入其他搜索 API 预留扩展点

设计原则：简单优先。使用 **基于接口 + 适配器** 的轻量模式，不引入 DI 容器。

```typescript
// 搜索请求参数（业务层通用类型）
export interface SearchParams {
  query: string
  page?: number       // 0–10
  location?: string   // 如 "US", "CN"
  language?: string   // 如 "en", "zh"
}

// 单条搜索结果
export interface SearchResult {
  position: number
  siteName: string
  title: string
  snippet: string
  url: string
}

// 搜索响应
export interface SearchResponse {
  query: string
  results: SearchResult[]
  totalResults: number
  page: number
}

// 搜索提供者接口
export interface SearchProvider {
  search(params: SearchParams): Promise<SearchResponse>
}

// 搜索服务（面向 MCP Tool 的上层调用入口）
export class SearchService {
  constructor(private provider: SearchProvider) {}

  async search(params: SearchParams): Promise<SearchResponse> {
    return this.provider.search(params)
  }
}
```

### 4.2 抓取服务层（`src/services/fetch.ts`）

```typescript
// 抓取请求参数
export interface FetchParams {
  urls: string[]        // 目标 URL 列表（1-10 个）
  format?: 'markdown' | 'html' | 'json'  // 返回格式，默认 markdown
  links?: boolean       // 是否提取页面内链接
  imageLinks?: boolean  // 是否提取图片链接
}

// 单条抓取结果
export interface FetchResult {
  url: string
  finalUrl: string
  title?: string
  description?: string
  language?: string
  author?: string
  publishedDate?: string
  text: string
  links?: string[]
  imageLinks?: string[]
  latencyMs?: number
  format: string
}

// 抓取错误（per-URL）
export interface FetchError {
  url: string
  error: string
  status?: number
}

// 抓取响应
export interface FetchResponse {
  results: FetchResult[]
  errors: FetchError[]
}

// 抓取提供者接口
export interface FetchProvider {
  fetch(params: FetchParams): Promise<FetchResponse>
}

// 抓取服务
export class FetchService {
  constructor(private provider: FetchProvider) {}

  async fetch(params: FetchParams): Promise<FetchResponse> {
    return this.provider.fetch(params)
  }
}
```

### 4.3 Zod 参数校验层（`src/schemas/`）

使用 `zod` 对 MCP 工具入参进行声明式校验与类型推导，**由 Schema 产出 TypeScript 类型**，避免手动同步类型与校验逻辑。

```typescript
// src/schemas/search.ts
import { z } from 'zod'

export const SearchParamsSchema = z.object({
  query: z.string().min(1, 'query 不能为空'),
  page: z.number().int().min(0).max(10).optional().default(0),
  location: z.string().max(10).optional(),
  language: z.string().max(10).optional(),
})

export type SearchParamsSchema = z.infer<typeof SearchParamsSchema>

// src/schemas/fetch.ts
import { z } from 'zod'

export const FetchParamsSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10),
  format: z.enum(['markdown', 'html', 'json']).optional().default('markdown'),
  links: z.boolean().optional().default(false),
  imageLinks: z.boolean().optional().default(false),
})

export type FetchParamsSchema = z.infer<typeof FetchParamsSchema>
```

校验流程：
1. MCP Tool Handler 收到 JSON-RPC 入参
2. 调用对应 Schema 的 `.parse()`（或 `.safeParse()`）进行校验
3. 校验通过时得到类型安全的参数对象
4. 校验失败时返回描述性错误给调用方

### 4.4 TinyFish 适配器

#### 4.4.1 Search 适配器（`src/adapters/tinyfish-search.ts`）

封装 `@tiny-fish/sdk` 的 Search API 调用，实现 `SearchProvider` 接口。

```typescript
export class TinyFishSearchAdapter implements SearchProvider {
  private client: TinyFish

  constructor(apiKey: string) {
    this.client = new TinyFish({ apiKey })
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    const response = await this.client.search.query({
      query: params.query,
      page: params.page,
      location: params.location,
      language: params.language,
    })
    return {
      query: response.query,
      results: response.results.map(r => ({
        position: r.position,
        siteName: r.site_name,
        title: r.title,
        snippet: r.snippet,
        url: r.url,
      })),
      totalResults: response.total_results,
      page: response.page ?? 0,
    }
  }
}
```

#### 4.4.2 Fetch 适配器（`src/adapters/tinyfish-fetch.ts`）

封装 `@tiny-fish/sdk` 的 Fetch API 调用，实现 `FetchProvider` 接口。

```typescript
export class TinyFishFetchAdapter implements FetchProvider {
  private client: TinyFish

  constructor(apiKey: string) {
    this.client = new TinyFish({ apiKey })
  }

  async fetch(params: FetchParams): Promise<FetchResponse> {
    const response = await this.client.fetch.getContents({
      urls: params.urls,
      format: params.format,
      links: params.links,
      image_links: params.imageLinks,
    })
    return {
      results: response.results.map(r => ({
        url: r.url,
        finalUrl: r.final_url,
        title: r.title,
        description: r.description,
        language: r.language,
        author: r.author,
        publishedDate: r.published_date,
        text: typeof r.text === 'string' ? r.text : JSON.stringify(r.text),
        links: r.links,
        imageLinks: r.image_links,
        latencyMs: r.latency_ms,
        format: r.format,
      })),
      errors: response.errors?.map(e => ({
        url: e.url,
        error: e.error,
        status: e.status,
      })) ?? [],
    }
  }
}
```

关键点：
- 适配器只依赖 `SearchProvider` / `FetchProvider` 接口，不暴露 SDK 类型给上层
- SDK 返回的字段命名（snake_case）在适配器层转换为业务层命名（camelCase）
- 多 Token 轮换策略（后续版本）在此层实现，对外透明

### 4.5 MCP 工具定义（`src/mcp/tools.ts`）

使用 `@modelcontextprotocol/sdk` 定义两个工具：

```typescript
export const SEARCH_TOOL = {
  name: "search",
  description: "通过 TinyFish 搜索API进行网络搜索，返回包含标题、URL、摘要的结构化结果",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "搜索关键词" },
      page: { type: "number", description: "分页页码 (0–10)，默认 0" },
      location: { type: "string", description: "地理位置代码，如 US、CN、GB 等" },
      language: { type: "string", description: "语言代码，如 en、zh、fr 等" },
    },
    required: ["query"],
  },
}

export const FETCH_TOOL = {
  name: "fetch",
  description: "通过 TinyFish Fetch API 获取指定 URL 的完整网页内容，支持 Markdown/HTML 等格式。可同时抓取最多 10 个 URL",
  inputSchema: {
    type: "object" as const,
    properties: {
      urls: { type: "array", items: { type: "string" }, description: "目标 URL 列表（1–10 个）" },
      format: { type: "string", enum: ["markdown", "html", "json"], description: "返回格式，默认 markdown" },
      links: { type: "boolean", description: "是否提取页面内链接，默认 false" },
      imageLinks: { type: "boolean", description: "是否提取图片链接，默认 false" },
    },
    required: ["urls"],
  },
}
```

### 4.6 MCP Handler（`src/mcp/handler.ts`）

统一注册工具并处理 Tool Call：

```typescript
export function createMcpServer(): McpServer {
  const searchService = new SearchService(new TinyFishSearchAdapter(apiKey))
  const fetchService = new FetchService(new TinyFishFetchAdapter(apiKey))

  const server = new McpServer({
    name: "tinyfish-mcp",
    version: "0.1.0",
  })

  server.registerTool(SEARCH_TOOL.name, SEARCH_TOOL, async (input) => {
    const params = SearchParamsSchema.parse(input)
    return searchService.search(params)
  })

  server.registerTool(FETCH_TOOL.name, FETCH_TOOL, async (input) => {
    const params = FetchParamsSchema.parse(input)
    return fetchService.fetch(params)
  })

  return server
}
```

### 4.7 Stdio 传输（`src/transports/stdio.ts`）

入口文件 `src/index.ts`：

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createMcpServer } from "../mcp/handler"

async function main() {
  const server = createMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main()
```

### 4.8 HTTP 传输（`src/transports/http.ts`）

基于 Hono + SSE 实现 MCP HTTP 传输：

- **认证**：通过 `Authorization: Bearer <token>` 头进行鉴权
- **限流**：基于 IP 或 Token 级别的速率限制

```typescript
// src/server.ts
import { serve } from "@hono/node-server"
import app from "./app"
import { PORT } from "./env"

serve({ fetch: app.fetch, port: PORT })
```

`src/app.ts` 中挂载 MCP 路由：

```typescript
// /mcp 路由 — MCP HTTP SSE 端点
app.get("/mcp/sse", authMiddleware, rateLimitMiddleware, mcpSseHandler)
app.post("/mcp/message", authMiddleware, rateLimitMiddleware, mcpMessageHandler)
```

### 4.9 鉴权中间件（`src/middlewares/auth.ts`）

用于 HTTP 模式下的接口鉴权：

```typescript
// 配置方式（环境变量）：
// AUTH_TOKEN=<your-token>           # 单 Token
// AUTH_TOKENS=token1,token2,token3  # 多 Token（逗号分隔）

// 中间件逻辑：
// 1. 检查 Authorization 头是否存在
// 2. 提取 Bearer token
// 3. 与配置的 token 列表比对
// 4. 不匹配则返回 401
```

- Stdio 模式下不启用鉴权（本地进程访问）
- 可通过环境变量 `AUTH_ENABLED=false` 关闭鉴权（开发/调试用）

### 4.10 限流中间件（`src/middlewares/rate-limit.ts`）

用于 HTTP 模式下的速率限制，防止接口被滥用：

```typescript
// 配置方式（环境变量）：
// RATE_LIMIT_ENABLED=true          # 是否开启限流
// RATE_LIMIT_WINDOW=60000          # 时间窗口（毫秒），默认 1 分钟
// RATE_LIMIT_MAX=30                # 窗口内最大请求数，默认 30

// 中间件逻辑：
// 1. 基于 IP 或 Token 作为限流 key
// 2. 使用内存 Map + 滑动窗口算法计数
// 3. 超出限制返回 429 Too Many Requests
```

- Stdio 模式下不启用限流
- 使用内存存储，不依赖 Redis 等外部服务（初版简化）

---

## 五、数据流

### Stdio 模式 — search

```
LLM Client
  │ JSON-RPC (stdin/stdout) → callTool("search", {query: "..."})
  ▼
MCP Handler
  │ Zod: SearchParamsSchema.parse(input)
  ▼
SearchService.search()
  │
  ▼
TinyFishSearchAdapter.search()
  │ HTTP GET https://api.search.tinyfish.ai
  │ X-API-Key: <apiKey>
  ▼
@tiny-fish/sdk
  │
  ▼
原始结果 → 适配器映射（snake_case → camelCase）→ SearchResponse
  │ JSON-RPC Response
  ▼
LLM Client
```

### Stdio 模式 — fetch

```
LLM Client
  │ JSON-RPC → callTool("fetch", {urls: [...], format: "markdown"})
  ▼
MCP Handler
  │ Zod: FetchParamsSchema.parse(input)
  ▼
FetchService.fetch()
  │
  ▼
TinyFishFetchAdapter.fetch()
  │ HTTP POST https://api.fetch.tinyfish.ai
  │ X-API-Key: <apiKey>
  ▼
@tiny-fish/sdk
  │
  ▼
原始结果 → 适配器映射 → FetchResponse（含 results + errors）
  │ JSON-RPC Response
  ▼
LLM Client
```

### HTTP 模式

流程与 Stdio 相同，仅在入口增加 Auth + Rate Limit 中间件：

```
LLM Client
  │ HTTP POST /mcp/message (JSON-RPC)
  ▼
Auth Middleware    → 401 (未授权)
  ▼
Rate Limit Middleware → 429 (超限)
  ▼
MCP Handler → Zod 校验 → Service → Adapter → SDK → 结果返回
```

---

## 六、配置项

### 环境变量

| 变量名 | 说明 | 默认值 | 适用模式 |
|---|---|---|---|
| `TINYFISH_API_KEY` | TinyFish API Key（必填） | — | Stdio + HTTP |
| `AUTH_ENABLED` | HTTP 鉴权开关 | `true` | HTTP |
| `AUTH_TOKEN` | 鉴权 Token（单 Token 场景） | — | HTTP |
| `AUTH_TOKENS` | 鉴权 Tokens（逗号分隔，多 Token） | — | HTTP |
| `RATE_LIMIT_ENABLED` | 限流开关 | `true` | HTTP |
| `RATE_LIMIT_WINDOW` | 限流时间窗口（ms） | `60000` | HTTP |
| `RATE_LIMIT_MAX` | 窗口内最大请求数 | `30` | HTTP |
| `PORT` | HTTP 服务端口 | `3000` | HTTP |
| `MAX_BODY_SIZE` | 请求体最大大小 | `104857600` (100MB) | HTTP |

### TinyFish API 速率限制（参考）

| 计划 | Search（请求/分钟） | Fetch（URL/分钟） |
|---|---|---|
| Free | 30 | 150 |
| Pay As You Go | 30 | 150 |
| Starter | 60 | 300 |
| Pro | 120 | 600 |

---

## 七、后续版本规划（v1+）

以下功能不在初版范围，但架构设计中已预留扩展空间：

### 7.1 多 Token 轮换

- 配置多个 `TINYFISH_API_KEY`，轮换或加权分发
- 提高有效并发量和容错能力
- 在适配器层或一个 `TokenRotator` 层实现
- 配置格式：`TINYFISH_API_KEYS=key1,key2,key3`

### 7.2 搜索结果缓存

- 对相同 query + location + language 的请求在 TTL 内返回缓存结果
- 减少 API 调用量，降低超限风险

### 7.3 搜索统计与监控

- 记录各 Token 调用次数/成功率/响应时间
- 接入日志聚合

---

## 八、测试策略

### 技术栈

- **框架**：Vitest（已有配置）
- **Mock**：`vi.mock()` / `vi.fn()`
- **HTTP 测试**：`app.request()`（Hono 内置）

### 测试分层

| 层 | 测试内容 | 目标文件 |
|---|---|---|
| 单元测试 - Zod Schema | 验证 Schema 对合法/非法入参的校验行为 | `test/schemas/search.test.ts`, `test/schemas/fetch.test.ts` |
| 单元测试 - Adapter | Mock SDK，验证参数映射和响应转换（snake_case→camelCase） | `test/adapters/tinyfish-search.test.ts`, `test/adapters/tinyfish-fetch.test.ts` |
| 单元测试 - Service | Mock Provider，验证 Service 代理行为 | `test/services/search.test.ts`, `test/services/fetch.test.ts` |
| 单元测试 - Middleware | 验证 Auth/限流中间件的判断逻辑 | `test/middlewares/auth.test.ts`, `test/middlewares/rate-limit.test.ts` |
| 集成测试 - MCP | 通过 MCP Server request 验证工具调用流程 | `test/mcp/handler.test.ts` |
| 集成测试 - HTTP | 通过 `app.request()` 验证完整 HTTP 链路 | `test/app.test.ts`（已有） |

### 测试覆盖率目标

- 总体覆盖率 >= 60%
- 核心模块（service / adapter / middleware / schemas）覆盖率 >= 80%

### 关键测试用例

#### Zod Schema

- `SearchParamsSchema` 校验：合法参数通过、缺少 `query` 失败、`page` 超出范围失败
- `FetchParamsSchema` 校验：合法参数通过、`urls` 为空失败、`urls` 超过 10 个失败、无效 URL 格式失败、`format` 非法值失败

#### SearchService / FetchService

- 正常返回结果
- Provider 异常时应转换为业务层错误

#### TinyFishSearchAdapter

- 验证请求参数正确传递给 SDK
- 验证响应字段从 snake_case 映射到 camelCase
- 验证 SDK 错误被正确捕获和转换

#### TinyFishFetchAdapter

- 验证请求参数正确传递给 SDK
- 验证响应字段映射（`final_url` → `finalUrl`、`latency_ms` → `latencyMs` 等）
- 验证 `errors[]` 字段正确透传
- `text` 为 object（JSON 格式时）正确序列化为 string

#### Auth Middleware

- 无 Authorization 头返回 401
- 无效 Token 返回 401
- 有效 Token 放行请求
- `AUTH_ENABLED=false` 时跳过鉴权

#### Rate Limit Middleware

- 窗口内未超限正常放行
- 窗口内超限返回 429
- 窗口重置后可继续请求
- `RATE_LIMIT_ENABLED=false` 时跳过限流

---

## 九、构建与部署

### 构建

使用 `tsdown` 进行构建（已配置）：

```bash
npm run build    # 构建所有入口
npm run dev      # 开发模式
```

构建入口（`tsdown.config.ts` 已配置）：
- `src/index.ts` → `dist/index.mjs`（Stdio 入口）
- `src/server.ts`（新）→ `dist/server.mjs`（HTTP 入口）
- `src/vercel.ts` → `dist/vercel.mjs`（Vercel 部署）
- `src/bun.ts` → `dist/bun.mjs`（Bun 运行时）
- `src/cloudflare-workers.ts` → `dist/cloudflare-workers.mjs`（Cloudflare Workers）

### 质量门禁

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint --fix
npm run test       # vitest run
```

### 部署方式

| 部署方式 | 文件 | 说明 |
|---|---|---|
| npx 直接运行 | `dist/index.mjs` | Stdio 模式，配置到 MCP client |
| Docker | `Dockerfile` | HTTP 模式，容器化部署 |
| Vercel | `dist/vercel.mjs` | Serverless HTTP 部署 |
| Cloudflare Workers | `dist/cloudflare-workers.mjs` | Edge 部署 |

### Stdio 模式下客户端配置示例

```json
{
  "mcpServers": {
    "tinyfish-search": {
      "command": "npx",
      "args": ["tinyfish-mcp"],
      "env": {
        "TINYFISH_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

### HTTP 模式下客户端配置示例

```json
{
  "mcpServers": {
    "tinyfish-search": {
      "url": "http://localhost:3000/mcp/sse",
      "headers": {
        "Authorization": "Bearer <your-auth-token>"
      }
    }
  }
}
```

---

## 十、依赖

### 运行时依赖

| 包名 | 用途 |
|---|---|
| `@modelcontextprotocol/sdk` | MCP 协议 SDK（需新增） |
| `@tiny-fish/sdk` | TinyFish API 客户端（已有） |
| `zod` | 参数校验与类型推导（需新增） |
| `hono` | HTTP 框架（已有） |
| `@hono/node-server` | Node.js HTTP 服务（已有） |
| `dotenv` | 环境变量加载（已有） |
| `winston` | 日志（已有） |

### 开发依赖

| 包名 | 用途 |
|---|---|
| `vitest` | 测试框架 |
| `typescript` | 类型检查 |
| `eslint` + `eslint-config-cmyr` | 代码检查 |
| `tsdown` | 构建工具 |

---

## 十一、风险与预案

| 风险 | 影响 | 预案 |
|---|---|---|
| `@tiny-fish/sdk` 接口变更 | 适配器需调整 | 适配器隔离层已屏蔽直接影响范围 |
| Search / Fetch API 限流 | 服务降级 | 限流中间件 + 后续多 Token 轮换 |
| MCP SDK 版本不兼容 | 客户端连接失败 | 锁定 MCP SDK 版本，跟进协议变更 |
| Fetch API 110s 后端超时 | 长时间等待 | MCP handler 内设置合理的 client-side 超时（150s），并通过 `errors[]` 透传超时信息 |
