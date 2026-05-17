# AGENTS.md

## 项目概述
一个基于 TinyFish 免费搜索 API 的 MCP（Model Context Protocol）服务，为 AI 助手提供实时网络搜索能力。支持通过 Stdio 和 HTTP 两种标准协议进行便捷集成，方便开发者将搜索功能接入到各类 AI 应用中。

## 角色与目标
- 本文件用于约束 AI 代理与协作者在当前项目中的默认行为。
- 任何更具体的项目规范、目录说明、设计决策或工作流要求，应以项目内的 README、开发规范、设计文档和配置文件为准。
- 当下文内容与项目实际实现冲突时，以代码、配置和项目规范文档中的事实为准。

## 技术栈
- 主要语言: typescript
- 运行时: nodejs


- 包管理器: npm

## 仓库信息
- 仓库地址: https://github.com/CaoMeiYouRen/tinyfish-mcp
- 项目文档: https://github.com/CaoMeiYouRen/tinyfish-mcp#readme
- Issue 地址: https://github.com/CaoMeiYouRen/tinyfish-mcp/issues
- 贡献指南: https://github.com/CaoMeiYouRen/tinyfish-mcp/blob/master/CONTRIBUTING.md


## 项目结构
> 以下目录为模板默认结构；具体项目可在生成后按实际情况增删。

```
src/           # 源代码
tests/         # 测试文件
playground/    # 本地调试或演示代码（如有）
docs/          # 文档与规范（如有）
```

## 常用命令
- 安装依赖: `npm install`
- 启动开发环境: `npm run dev`
- 运行测试: `npm run test`
- 构建项目: `npm run build`
- 代码检查: `npm run lint`
- 启动生产或本地预览: `npm run start`
- 生成提交: `npm run commit`

## 编码与协作约定
- 优先遵循项目现有代码风格、目录约定和命名规范，不要擅自引入新的体系。
- 使用与项目一致的语言特性和类型策略；如果项目启用了 TypeScript，则保持类型检查可通过。
- 变更应尽量保持最小范围，避免顺手重构无关模块。
- 需要新增或调整依赖时，优先确认项目已有方案是否已覆盖。
- 提交信息遵循 Conventional Commits 规范。

## 质量门禁

- 测试框架: Vitest
- 目标覆盖率: >= 80%

- 代码变更后，按项目实际可用命令完成 lint、typecheck、test 等必要校验。
- 如果某项校验在当前项目中不存在，应在说明中明确标注，而不是假定其存在。

## 安全与避免事项
- 不要硬编码 API Key、Token、密码或其他敏感信息。
- 不要直接修改构建产物、发布产物或生成目录中的文件。
- 不要跳过 TypeScript 类型检查或项目规定的静态检查。
- 不要使用 `var` 声明变量，优先使用 `const` 和 `let`。
- 对环境变量、密钥文件和部署配置的修改应格外谨慎。

## 可选补充
- 如果项目存在更细的 AI 规则、目录约定或角色分工，可在此处继续补充，但不要与项目事实相冲突。
- 如果项目已经定义了更强的安全、测试或发布流程，本文件应只保留入口级约束。
