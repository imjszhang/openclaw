# G14: AI 模型与 Agent 配置需严格区分“提供商认证机制”与“多 Agent 路由逻辑”以实现灵活调度

> 复杂的模型生态要求明确 API Key 与 OAuth 订阅的认证边界，并通过多 Agent 实例隔离不同场景的上下文与权限。

## 包含的 Atoms

| 编号  | 来源                     | 内容摘要                                                                                          |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| MA-01 | model-agent-config-guide | OpenClaw 三个核心概念：Provider（提供商）、Model（具体模型）、Agent（完整助手实例）               |
| MA-02 | model-agent-config-guide | Claude Code CLI 不是 agent 类型，而是一种认证方式（通过 setup-token 使用 Claude 订阅）            |
| MA-03 | model-agent-config-guide | 内置提供商开箱即用只需 API 密钥：Anthropic、OpenAI、Google、OpenRouter、Groq 等 13+ 个            |
| MA-04 | model-agent-config-guide | 自定义配置提供商需在 models.providers 中添加：Moonshot、Kimi Code、Qwen Portal、Ollama 等         |
| MA-05 | model-agent-config-guide | 场景推荐：最强能力用 claude-opus-4-5，性价比用 claude-sonnet-4-5，中国访问用 Moonshot 或 Z.AI     |
| MA-06 | model-agent-config-guide | 认证方式分两种：API Key（简单稳定）和订阅认证（免 API 费用但 Token 需刷新）                       |
| MA-07 | model-agent-config-guide | 支持的订阅认证：Anthropic(setup-token)、OpenAI-Codex(OAuth)、Google/Qwen(插件 OAuth)              |
| MA-08 | model-agent-config-guide | Anthropic 订阅配置：`claude setup-token` → `models auth setup-token --provider anthropic`         |
| MA-09 | model-agent-config-guide | OpenAI ChatGPT 订阅配置：`models auth login --provider openai-codex`                              |
| MA-10 | model-agent-config-guide | Google/Qwen 插件认证：`plugins enable <插件名>` → `gateway restart` → `models auth login`         |
| MA-11 | model-agent-config-guide | OAuth tokens 会自动刷新，认证失败时重新运行 login 命令即可                                        |
| MA-12 | model-agent-config-guide | 环境变量配置优先级：进程环境变量 > 当前目录.env > ~/.openclaw/.env > 配置文件 env 块              |
| MA-13 | model-agent-config-guide | 推荐将 API 密钥放在~/.openclaw/.env 文件中，不要直接写在配置文件里（安全考虑）                    |
| MA-14 | model-agent-config-guide | Moonshot 文件配置：在~/.openclaw/.env 设置 MOONSHOT_API_KEY，在 openclaw.json 配置 providers      |
| MA-15 | model-agent-config-guide | 中国用户访问 Moonshot 应将 baseUrl 改为 https://api.moonshot.cn/v1                                |
| MA-16 | model-agent-config-guide | Moonshot 和 Kimi Code 是独立提供商，API Key 不能互换，模型引用格式不同                            |
| MA-17 | model-agent-config-guide | Kimi Code 配置：baseUrl 为 https://api.kimi.com/coding/v1，模型为 kimi-for-coding                 |
| MA-18 | model-agent-config-guide | Ollama 本地运行：`ollama pull llama3.3` → `config set agents.defaults.model.primary "ollama/..."` |
| MA-19 | model-agent-config-guide | 验证配置命令：`models list --all`、`models status`、`config get agents.defaults.model.primary`    |
| MA-20 | model-agent-config-guide | Agent 是完整 AI 助手实例，包含 Workspace、Sessions、Auth Profiles 三部分                          |
| MA-21 | model-agent-config-guide | 默认单 Agent 配置：id 为 main，工作空间在~/.openclaw/workspace/，会话在 agents/main/sessions/     |
| MA-22 | model-agent-config-guide | 多 Agent 用途：不同渠道用不同模型、不同联系人路由到不同 Agent、隔离工作空间和会话                 |
| MA-23 | model-agent-config-guide | 多 Agent 配置需在 agents.list 定义 Agent，在 bindings 配置渠道路由规则                            |
| MA-24 | model-agent-config-guide | 添加新 Agent 命令：`pnpm openclaw agents add <id> --workspace <路径>`                             |
| MA-25 | model-agent-config-guide | 环境变量优先级中，Gateway 作为服务运行时可能不继承 shell 环境变量，此时.env 文件特别有用          |

## 组内逻辑顺序

按照“核心概念定义 → 提供商与认证配置（API Key/OAuth/本地）→ 环境变量与安全最佳实践 → Agent 实例化与多 Agent 路由”的逻辑顺序排列。
