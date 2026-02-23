# OpenClaw AI 模型与 Agent 配置指南

> 来源：[../../../../journal/2026-01-31/model-agent-config-guide.md](../../../../journal/2026-01-31/model-agent-config-guide.md)
> 缩写：MA

## Atoms

| 编号  | 类型 | 内容                                                                                              | 原文定位             |
| ----- | ---- | ------------------------------------------------------------------------------------------------- | -------------------- |
| MA-01 | 事实 | OpenClaw 三个核心概念：Provider（提供商）、Model（具体模型）、Agent（完整助手实例）               | 1. 核心概念          |
| MA-02 | 事实 | Claude Code CLI 不是 agent 类型，而是一种认证方式（通过 setup-token 使用 Claude 订阅）            | 1. 核心概念          |
| MA-03 | 事实 | 内置提供商开箱即用只需 API 密钥：Anthropic、OpenAI、Google、OpenRouter、Groq 等 13+ 个            | 2.1 内置提供商       |
| MA-04 | 事实 | 自定义配置提供商需在 models.providers 中添加：Moonshot、Kimi Code、Qwen Portal、Ollama 等         | 2.2 自定义配置提供商 |
| MA-05 | 判断 | 场景推荐：最强能力用 claude-opus-4-5，性价比用 claude-sonnet-4-5，中国访问用 Moonshot 或 Z.AI     | 2.3 场景推荐         |
| MA-06 | 事实 | 认证方式分两种：API Key（简单稳定）和订阅认证（免 API 费用但 Token 需刷新）                       | 3.1 认证类型对比     |
| MA-07 | 事实 | 支持的订阅认证：Anthropic(setup-token)、OpenAI-Codex(OAuth)、Google/Qwen(插件 OAuth)              | 3.2 支持的订阅认证   |
| MA-08 | 步骤 | Anthropic 订阅配置：`claude setup-token` → `models auth setup-token --provider anthropic`         | 3.3 订阅认证配置示例 |
| MA-09 | 步骤 | OpenAI ChatGPT 订阅配置：`models auth login --provider openai-codex`                              | 3.3 订阅认证配置示例 |
| MA-10 | 步骤 | Google/Qwen 插件认证：`plugins enable <插件名>` → `gateway restart` → `models auth login`         | 3.3 订阅认证配置示例 |
| MA-11 | 经验 | OAuth tokens 会自动刷新，认证失败时重新运行 login 命令即可                                        | 3.4 Token 刷新       |
| MA-12 | 事实 | 环境变量配置优先级：进程环境变量 > 当前目录.env > ~/.openclaw/.env > 配置文件 env 块              | 3.5 环境变量配置方式 |
| MA-13 | 经验 | 推荐将 API 密钥放在~/.openclaw/.env 文件中，不要直接写在配置文件里（安全考虑）                    | 3.5 环境变量配置方式 |
| MA-14 | 步骤 | Moonshot 文件配置：在~/.openclaw/.env 设置 MOONSHOT_API_KEY，在 openclaw.json 配置 providers      | 4.4 方式 B：文件配置 |
| MA-15 | 经验 | 中国用户访问 Moonshot 应将 baseUrl 改为 https://api.moonshot.cn/v1                                | 4.4 步骤 3           |
| MA-16 | 事实 | Moonshot 和 Kimi Code 是独立提供商，API Key 不能互换，模型引用格式不同                            | 4.4 Kimi Code        |
| MA-17 | 步骤 | Kimi Code 配置：baseUrl 为 https://api.kimi.com/coding/v1，模型为 kimi-for-coding                 | 4.4 Kimi Code        |
| MA-18 | 步骤 | Ollama 本地运行：`ollama pull llama3.3` → `config set agents.defaults.model.primary "ollama/..."` | 4.5 Ollama           |
| MA-19 | 步骤 | 验证配置命令：`models list --all`、`models status`、`config get agents.defaults.model.primary`    | 4.6 验证配置         |
| MA-20 | 事实 | Agent 是完整 AI 助手实例，包含 Workspace、Sessions、Auth Profiles 三部分                          | 5.1 什么是 Agent     |
| MA-21 | 事实 | 默认单 Agent 配置：id 为 main，工作空间在~/.openclaw/workspace/，会话在 agents/main/sessions/     | 5.2 单 Agent 配置    |
| MA-22 | 事实 | 多 Agent 用途：不同渠道用不同模型、不同联系人路由到不同 Agent、隔离工作空间和会话                 | 6.1 多 Agent 的用途  |
| MA-23 | 步骤 | 多 Agent 配置需在 agents.list 定义 Agent，在 bindings 配置渠道路由规则                            | 6.2 示例配置         |
| MA-24 | 步骤 | 添加新 Agent 命令：`pnpm openclaw agents add <id> --workspace <路径>`                             | 6.3 添加新 Agent     |
| MA-25 | 经验 | 环境变量优先级中，Gateway 作为服务运行时可能不继承 shell 环境变量，此时.env 文件特别有用          | 3.5 注意事项         |
