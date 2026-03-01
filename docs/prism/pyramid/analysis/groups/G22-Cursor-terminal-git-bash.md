# G22: Windows 下 Cursor 终端必须切换为 Git Bash 以消除 AI Agent 生成 Unix 命令的执行障碍

> 默认 PowerShell 与 Unix 命令语法不兼容导致 AI 生成命令频繁失败，切换为 Git Bash 是保障开发体验与 Agent 执行率的必要配置。

## 包含的 Atoms

| 编号  | 来源                         | 内容摘要                                                                                          |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| CT-01 | cursor-terminal-config-guide | Windows 下 Cursor 默认终端为 PowerShell，与 Unix/Linux 命令（rm -rf, grep, export, &&）不兼容     |
| CT-02 | cursor-terminal-config-guide | 切换为 Git Bash 可获得类 Unix Shell 体验，大幅减少 AI Agent 生成命令时的执行失败                  |
| CT-03 | cursor-terminal-config-guide | 确认 Git Bash 安装位置：`Get-Command git`                                                         |
| CT-04 | cursor-terminal-config-guide | 推荐配置方法：Ctrl+Shift+P → Open User Settings (JSON) → 添加 terminalintegrated.profiles.windows |
| CT-05 | cursor-terminal-config-guide | settings.json 中路径反斜杠需双写（\\），如 `D:\\Program Files\\Git\\bin\\bash.exe`                |
| CT-06 | cursor-terminal-config-guide | 配置完成后需执行 `Developer: Reload Window` 重新加载窗口使设置生效                                |
| CT-07 | cursor-terminal-config-guide | settings.json 文件位置：Windows 为 `%APPDATA%\Cursor\User\settings.json`                          |
| CT-08 | cursor-terminal-config-guide | 切换后已打开的旧终端不会自动变更，需关闭后用 Ctrl+` 新建终端才生效                                |
| CT-09 | cursor-terminal-config-guide | Git Bash 中 Windows 特有命令（ipconfig, systeminfo）可用 `cmd //c 命令` 方式调用                  |
| CT-10 | cursor-terminal-config-guide | Git Bash 路径格式：Windows 盘符映射为 `/x/`，如 `D:\github` → `/d/github`                         |
| CT-11 | cursor-terminal-config-guide | AI Agent 可能独立于集成终端设置，可在 `.cursor/rules` 中添加规则要求使用 Git Bash 兼容语法        |
| CT-12 | cursor-terminal-config-guide | 回退方法：将 `terminal.integrated.defaultProfile.windows` 改为 `"PowerShell"` 并重新加载          |
| CT-13 | cursor-terminal-config-guide | 配置 openclaw 别名：在 `~/.bashrc` 中添加 `alias openclaw="pnpm --dir /d/... openclaw"`           |
| CT-14 | cursor-terminal-config-guide | ~/.bashrc 修改后需执行 `source ~/.bashrc` 立即生效，Git Bash 使用 Unix 风格路径                   |
| CT-15 | cursor-terminal-config-guide | 验证成功标志：终端提示符显示 `MINGW64` 而非 `PS`，且 `ls -la`、`grep`、`cat` 等命令可正常运行     |

## 组内逻辑顺序

遵循“问题背景 → 配置实施 → 细节处理 → 验证与回退”的操作流程顺序。首先说明 PowerShell 的不兼容性痛点，接着提供具体的 JSON 配置步骤和路径格式要求，然后补充别名配置和 Agent 规则调整等进阶用法，最后给出验证成功标准和回退方案。

=== GROUP: G23-OpenClaw-channel-plugin-architecture.md ===

# G23: OpenClaw 渠道插件架构通过“元数据声明 + 适配器实现 + 配置驱动”模式实现消息平台的标准化扩展

> 将消息接收、发送、状态管理等复杂逻辑拆解为标准化适配器接口，配合灵活的配置 schema，使得新增消息渠道只需实现最小核心集即可无缝集成。

## 包含的 Atoms

| 编号  | 来源                 | 内容摘要                                                                                                 |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| CC-01 | custom-channel-guide | Channel 是 OpenClaw 中消息来源和目标的抽象，代表一种消息平台（如 Telegram、WhatsApp、Discord 等）        |
| CC-02 | custom-channel-guide | Channel 插件需处理五大职责：消息接收、消息发送、配置管理、状态检查、访问控制                             |
| CC-03 | custom-channel-guide | 实现方式分两种：核心 Channel（内置源码）和插件 Channel（extensions 目录），推荐插件方式                  |
| CC-04 | custom-channel-guide | 个人/团队内部使用、开源贡献、实验性功能验证均推荐插件方式，官方主流平台用核心方式                        |
| CC-05 | custom-channel-guide | 标准插件目录结构：index.ts 入口、openclaw.plugin.json 清单、package.json 配置、src/源码目录              |
| CC-06 | custom-channel-guide | openclaw.plugin.json 必需字段：id（插件标识）、channels（注册 Channel ID 列表）、configSchema            |
| CC-07 | custom-channel-guide | package.json 中 openclaw 必须用 peerDependencies 而非 dependencies，运行时依赖放 dependencies            |
| CC-08 | custom-channel-guide | ChannelPlugin 主类型包含 id、meta、capabilities、defaults、reload 及 19 个可选/必需适配器                |
| CC-09 | custom-channel-guide | ChannelMeta 元数据包含 id、label、selectionLabel、docsPath、blurb、order、aliases 等 14 个字段           |
| CC-10 | custom-channel-guide | ChannelCapabilities 能力声明包含 chatTypes、polls、reactions、edit、unsend、reply、media 等              |
| CC-11 | custom-channel-guide | config 适配器是唯一必须实现的适配器，负责 listAccountIds、resolveAccount 等配置管理                      |
| CC-12 | custom-channel-guide | config 适配器实现示例：listAccountIds 从 cfg.channels.mychannel.accounts 提取键名                        |
| CC-13 | custom-channel-guide | outbound 适配器 deliveryMode 分三种：direct（直接）、gateway（通过网关）、hybrid（混合）                 |
| CC-14 | custom-channel-guide | outbound 适配器推荐实现 sendText 和 sendMedia 方法，返回 OutboundDeliveryResult                          |
| CC-15 | custom-channel-guide | security 适配器处理 DM 策略（resolveDmPolicy）和收集安全警告（collectWarnings）                          |
| CC-16 | custom-channel-guide | gateway 适配器负责 startAccount（启动监听）、stopAccount（停止）、loginWithQrStart/Wait（扫码）          |
| CC-17 | custom-channel-guide | gateway 适配器 startAccount 需处理 abortSignal 监听中断，调用 setStatus 更新状态                         |
| CC-18 | custom-channel-guide | status 适配器提供 defaultRuntime、buildChannelSummary、probeAccount、auditAccount 等状态检查             |
| CC-19 | custom-channel-guide | pairing 适配器需实现 idLabel（CLI 提示用）、normalizeAllowEntry、notifyApproval（通知配对批准）          |
| CC-20 | custom-channel-guide | 其他可选适配器共 13 个：onboarding、groups、mentions、threading、streaming、messaging 等                 |
| CC-21 | custom-channel-guide | 最小实现只需 meta、capabilities、config（listAccountIds、resolveAccount、isConfigured）、outbound        |
| CC-22 | custom-channel-guide | 参考现有实现复杂度：Telegram/Discord 简单（Bot API）、WhatsApp/Signal 中等、Matrix 复杂                  |
| CC-23 | custom-channel-guide | 基础配置位于 channels.<id>，支持 enabled、token、dmPolicy、allowFrom 等字段                              |
| CC-24 | custom-channel-guide | 多账户配置通过 channels.<id>.accounts 实现，每个账户可覆盖顶层配置                                       |
| CC-25 | custom-channel-guide | DM 策略四种：pairing（需批准）、allowlist（白名单）、open（公开）、disabled（禁用）                      |
| CC-26 | custom-channel-guide | 插件发现顺序（高到低）：配置 paths、工作区 extensions、全局 extensions、内置 extensions                  |
| CC-27 | custom-channel-guide | 启用内置插件命令：`pnpm openclaw plugins enable <id>` 或在配置 plugins.entries 中设置 enabled            |
| CC-28 | custom-channel-guide | 测试调试命令：plugins list/diagnose、channels status/probe、logs --follow、doctor、health                |
| CC-29 | custom-channel-guide | 插件未被发现检查四点：openclaw.plugin.json 存在、package.json 有 openclaw.extensions、权限、diagnose     |
| CC-30 | custom-channel-guide | 配对不工作检查三点：security.resolveDmPolicy 返回正确 policy、pairing.notifyApproval 实现、dmPolicy 配置 |

## 组内逻辑顺序

采用“概念定义 → 架构设计 → 核心实现 → 配置管理 → 运维调试”的结构顺序。先定义 Channel 抽象和职责，再阐述插件化架构和目录规范，接着深入讲解各类适配器（config/outbound/gateway 等）的实现细节，随后说明配置文件结构和 DM 策略，最后提供插件发现机制、调试命令及故障排查指南。

=== GROUP: G24-OpenClaw-extension-development-system.md ===

# G24: OpenClaw 扩展系统基于“统一注册 API+ 分层发现机制 + 生命周期钩子”构建全类型插件生态

> 通过标准化的 Plugin API 注册工具和钩子，配合优先级明确的发现机制和严格的类型验证，实现了从 Channel 到 Tool 再到 Service 的全方位可扩展性。

## 包含的 Atoms

| 编号  | 来源                        | 内容摘要                                                                                          |
| ----- | --------------------------- | ------------------------------------------------------------------------------------------------- |
| ED-01 | extension-development-guide | OpenClaw 扩展系统基于四大核心概念：发现机制、清单注册、运行时加载（jiti）、Plugin API 统一注册    |
| ED-02 | extension-development-guide | 扩展发现顺序（优先级高到低）：config 配置 paths、workspace 工作区、global 全局、bundled 内置      |
| ED-03 | extension-development-guide | 支持五种扩展类型：Channel（消息渠道）、Provider（AI 认证）、Tool（Agent 工具）、Memory、Service   |
| ED-04 | extension-development-guide | 最小扩展示例：创建 index.ts 定义 plugin 对象（id/name/description/configSchema/register 函数）    |
| ED-05 | extension-development-guide | openclaw.plugin.json 必需字段：id（唯一标识），可选 kind/channels/uiHints/configSchema            |
| ED-06 | extension-development-guide | package.json 必需字段：name/version/type="module"，openclaw.extensions 指定入口文件               |
| ED-07 | extension-development-guide | uiHints 配置选项包含：label（显示标签）、help（帮助文本）、advanced（高级）、sensitive（敏感）    |
| ED-08 | extension-development-guide | OpenClawPluginApi 提供 registerTool/Hook/HttpHandler/Route/Channel/Provider/Cli/Service/Command   |
| ED-09 | extension-development-guide | Logger 接口方法：api.logger.info/warn/error/debug（可选）                                         |
| ED-10 | extension-development-guide | PluginRuntime 提供版本、配置加载、媒体检测、TTS、各渠道相关函数等核心功能访问                     |
| ED-11 | extension-development-guide | 注册工具使用 TypeBox 定义 parameters schema，execute 函数返回 content 和 details                  |
| ED-12 | extension-development-guide | 工具选项 name/names 可设别名，optional=true 在缺少依赖时不报错                                    |
| ED-13 | extension-development-guide | 渠道插件需实现 meta 元数据和多个适配器：config/auth/messaging/status/gateway 等                   |
| ED-14 | extension-development-guide | 注册 Provider 需定义 id/label/docsPath/aliases/envVars 和 auth 流程（api_key 或 oauth）           |
| ED-15 | extension-development-guide | 注册 CLI 命令使用 api.registerCli，通过 program.command 定义子命令和选项                          |
| ED-16 | extension-development-guide | 注册 Gateway 方法使用 api.registerGatewayMethod("命名空间。方法", handler)，通过 respond 返回结果 |
| ED-17 | extension-development-guide | 注册 HTTP 路由两种方式：registerHttpRoute（推荐）或 registerHttpHandler（通用处理器）             |
| ED-18 | extension-development-guide | 注册服务使用 api.registerService，实现 start 和 stop 生命周期函数管理后台服务                     |
| ED-19 | extension-development-guide | 注册自定义命令使用 api.registerCommand，可设 name/description/acceptsArgs/requireAuth/handler     |
| ED-20 | extension-development-guide | 生命周期钩子共 14 个：before_agent_start、agent_end、message_received/sending/sent 等             |
| ED-21 | extension-development-guide | before_agent_start 可注入上下文（prependContext），message_sending 可修改内容或取消发送           |
| ED-22 | extension-development-guide | before_tool_call 可修改参数或阻止调用（block+blockReason），tool_result_persist 可修改消息        |
| ED-23 | extension-development-guide | 配置验证推荐使用 Zod 进行运行时验证，确保类型安全                                                 |
| ED-24 | extension-development-guide | 错误处理应捕获异常返回 details 包含错误信息，使用 logger.error 记录                               |
| ED-25 | extension-development-guide | 重型资源使用延迟初始化模式（ensureClient 函数），避免启动时加载                                   |
| ED-26 | extension-development-guide | 使用 Service 生命周期管理资源清理，在 stop 函数中关闭连接/释放资源                                |
| ED-27 | extension-development-guide | Tool Schema 避免使用 Type.Union，字符串枚举用 stringEnum，可选用 Type.Optional 而非\              |
| ED-28 | extension-development-guide | 调试命令：plugins list（查看已加载）、plugins validate（验证配置）、pnpm test（运行测试）         |
| ED-29 | extension-development-guide | 参考现有扩展源码学习：telegram（简单渠道）、twitch（复杂渠道）、voice-call（完整功能）            |
| ED-30 | extension-development-guide | 发布扩展：确保 package.json 正确→添加 README→运行测试→npm publish，用户通过 loadPaths 配置加载    |

## 组内逻辑顺序

按照“系统概览 → 开发规范 → API 注册详解 → 高级特性 → 最佳实践”的逻辑展开。首先介绍核心概念和发现机制，接着定义清单文件和 package.json 规范，然后详细列举各类注册 API（Tool/Provider/Service/Hook 等），随后探讨生命周期钩子、类型验证和资源管理等高级话题，最后给出调试、参考源码及发布流程。

=== GROUP: G25-OpenClaw-external-scripting-integration.md ===

# G25: OpenClaw 外部集成需根据“自动化场景需求”在 CLI、HTTP API 与 WebSocket RPC 间进行差异化选型

> 针对 CI/CD、定时任务、远程调用等不同场景，提供从命令行直调到 OpenAI 兼容接口的多层次集成方案，确保脚本调用的灵活性与安全性。

## 包含的 Atoms

| 编号  | 来源                     | 内容摘要                                                                                                                                    |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ES-01 | external-scripting-guide | OpenClaw 暴露给外部脚本的接口包括：CLI 命令、HTTP API (Webhooks/OpenAI 兼容/OpenResponses/Tools)、WebSocket RPC                             |
| ES-02 | external-scripting-guide | `openclaw agent` 命令用于触发 AI agent 运行，支持 `--message`、`--deliver`、`--thinking`、`--local` 等参数                                  |
| ES-03 | external-scripting-guide | `openclaw agent --local` 本地嵌入运行不走 Gateway，适合 CI/CD 管道配合 `--json` 输出                                                        |
| ES-04 | external-scripting-guide | `openclaw message send` 直接向频道发送消息（不经过 AI），支持 `--media` 附件、`--buttons`、`--card` 等                                      |
| ES-05 | external-scripting-guide | `openclaw cron` 管理定时任务，支持两种会话模式：main(systemEvent 注入心跳) 和 isolated(agentTurn 独立运行)                                  |
| ES-06 | external-scripting-guide | Webhooks 需前置配置 `hooks.enabled=true` 和 `token`，请求时携带 `Authorization: Bearer <token>`                                             |
| ES-07 | external-scripting-guide | `POST /hooks/wake` 唤醒主会话注入系统事件，`text` 为事件描述，`mode` 可选 now 或 next-heartbeat                                             |
| ES-08 | external-scripting-guide | `POST /hooks/agent` 运行隔离 agent turn（推荐外部脚本接口），支持 `sessionKey` 复用上下文、`deliver` 投递                                   |
| ES-09 | external-scripting-guide | OpenAI 兼容接口 `POST /v1/chat/completions` 支持标准 messages 数组、SSE 流式，model 格式为 `openclaw:<agentId>`                             |
| ES-10 | external-scripting-guide | Python openai SDK 可直接调用 OpenClaw，只需设置 `base_url` 和 `api_key`，支持 `x-openclaw-agent-id` 头                                      |
| ES-11 | external-scripting-guide | OpenResponses 接口 `POST /v1/responses` 遵循 OpenResponses 标准，支持工具调用、文件/图片输入                                                |
| ES-12 | external-scripting-guide | `POST /tools/invoke` 直接调用 agent 内部工具（如 memory_search），绕过 AI 推理，需 `tool` 参数                                              |
| ES-13 | external-scripting-guide | Gateway WebSocket RPC 使用 JSON-RPC 协议，默认端口 18789，可用方法包括 agent、send、wake、cron.\* 等                                        |
| ES-14 | external-scripting-guide | WebSocket `agent` 和 `send` 方法需要 `idempotencyKey` 防止重复执行，CLI 会自动生成                                                          |
| ES-15 | external-scripting-guide | 认证方式分三种：CLI 本地无需认证、Webhooks 用 hook token、HTTP/WS 用 Gateway token 或 password                                              |
| ES-16 | external-scripting-guide | Cron 执行流程：sessionTarget=main 时 enqueueSystemEvent 触发心跳，isolated 时 runEmbeddedPiAgent 独立运行                                   |
| ES-17 | external-scripting-guide | Cron Job 数据结构包含：schedule(kind: at/every/cron)、payload(kind: systemEvent/agentTurn)、sessionTarget、delivery                         |
| ES-18 | external-scripting-guide | 接口选择决策树：需要 AI 推理且一次性脚本用 `openclaw agent` 或 `/hooks/agent`，定期用 `cron add`，已有 OpenAI SDK 用 `/v1/chat/completions` |
| ES-19 | external-scripting-guide | 实战场景：GitHub Actions 触发代码审查用 `/hooks/agent`，Shell 定期报告用 `openclaw agent`，Python 分析用 OpenAI SDK                         |
| ES-20 | external-scripting-guide | 注意事项：Gateway 必须运行（除 --local），默认端口 127.0.0.1:18789，超时默认 600s，`deliver:true` 投递回复到频道                            |
| ES-21 | external-scripting-guide | 会话隔离：使用不同 `sessionKey` 保持独立上下文，相同 key 复用多轮对话                                                                       |
| ES-22 | external-scripting-guide | 安全建议：hook token 和 gateway token 分开管理，webhook 建议只在 loopback 或可信网络暴露                                                    |

## 组内逻辑顺序

遵循“接口全景 → 具体用法 → 认证安全 → 场景决策”的逻辑。首先罗列所有可用接口类型，接着详细讲解 CLI 参数、Webhooks 端点、OpenAI 兼容接口及 WebSocket 协议的具体用法，然后说明认证机制和会话隔离策略，最后通过决策树和实战场景指导用户如何根据需求选择合适的集成方式。

=== GROUP: G26-OpenClaw-independent-agent-lifecycle.md ===

# G26: 独立 Agent 创建需严格区分"CLI 交互式引导”与"RPC 自动化构建”两种模式以适配不同管理场景

> 独立 Agent 作为拥有完整 Workspace 和会话隔离的配置实体，其创建流程必须明确区分人工配置的向导模式与脚本调用的非交互模式，确保资源隔离与配置完整性。

## 包含的 Atoms

| 编号  | 来源                             | 内容摘要                                                                                                 |
| ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| IA-01 | independent-agent-creation-guide | 独立 Agent 是 agents.list 中的完整条目，拥有独立的 Workspace、agentDir 和 sessions 目录                  |
| IA-02 | independent-agent-creation-guide | 独立 Agent 与子 Agent（sessions_spawn 创建）不同，是配置层面的新实体，需通过 CLI 或 RPC 创建             |
| IA-03 | independent-agent-creation-guide | 独立 Agent 的 Workspace 包含 AGENTS.md、SOUL.md、TOOLS.md、IDENTITY.md 等文件                            |
| IA-04 | independent-agent-creation-guide | 独立 Agent 的 agentDir 默认位于 ~/.openclaw/agents/<agentId>/agent                                       |
| IA-05 | independent-agent-creation-guide | 独立 Agent 的 sessions 目录位于 ~/.openclaw/agents/<agentId>/sessions                                    |
| IA-06 | independent-agent-creation-guide | 创建独立 Agent 有两种入口：CLI（openclaw agents add）和 RPC（agents.create）                             |
| IA-07 | independent-agent-creation-guide | agentId 由 name 规范化得到（如 "Work Agent" → work-agent），main 为保留 ID 不能创建                      |
| IA-08 | independent-agent-creation-guide | CLI 交互式创建：运行 openclaw agents add [name]，向导会询问名称、Workspace、auth、模型、渠道绑定         |
| IA-09 | independent-agent-creation-guide | CLI 非交互式创建：必须提供 --workspace，可选 --model、--agent-dir、--bind，需加 --non-interactive        |
| IA-10 | independent-agent-creation-guide | CLI 非交互式模式不会创建 auth，需之后单独配置或复制 auth-profiles.json                                   |
| IA-11 | independent-agent-creation-guide | CLI 选项 --workspace 支持 ~ 路径，--bind 可重复使用                                                      |
| IA-12 | independent-agent-creation-guide | RPC 方法 agents.create 适用于 Web UI、自动化脚本、远程调用 Gateway                                       |
| IA-13 | independent-agent-creation-guide | RPC 参数 name 和 workspace 必填，emoji 和 avatar 可选                                                    |
| IA-14 | independent-agent-creation-guide | RPC 不处理 auth、model、bindings，无交互式向导，适合 Web UI 或自动化脚本调用                             |
| IA-15 | independent-agent-creation-guide | 创建后 auth 配置三种方式：再次运行向导、从主 Agent 复制 auth-profiles.json、手动配置                     |
| IA-16 | independent-agent-creation-guide | 配置 bindings 需在 openclaw.json 的 bindings 数组中添加条目，指定 agentId 和 match 条件                  |
| IA-17 | independent-agent-creation-guide | 推荐操作流程：准备 Workspace 路径 → 执行创建 → 配置认证 → 配置 bindings → 用 agents list --bindings 验证 |
| IA-18 | independent-agent-creation-guide | main 是保留 ID，不能创建名为 main 的 Agent                                                               |
| IA-19 | independent-agent-creation-guide | 每个 Agent 应有独立的 agentDir，避免 auth/session 冲突                                                   |
| IA-20 | independent-agent-creation-guide | 若配置了 agents.defaults.skipBootstrap，Workspace 不会自动生成 bootstrap 文件，需自行准备                |

## 组内逻辑顺序

按照“概念定义 → 目录结构 → 创建方式对比 → 后续配置 → 注意事项”的顺序组织。首先明确独立 Agent 的定义及其与子 Agent 的区别，接着介绍其文件系统结构，然后对比 CLI 交互/非交互与 RPC 三种创建方式的差异，随后说明创建后的 Auth 和 Bindings 配置步骤，最后列出保留 ID 限制和目录隔离等关键注意事项。

=== INDEX_ROWS ===
| G22 | Windows 下 Cursor 终端必须切换为 Git Bash 以消除 AI Agent 生成 Unix 命令的执行障碍 | 15 | 2026-02 |
| G23 | OpenClaw 渠道插件架构通过“元数据声明 + 适配器实现 + 配置驱动”模式实现消息平台的标准化扩展 | 30 | 2026-02 |
| G24 | OpenClaw 扩展系统基于“统一注册 API+ 分层发现机制 + 生命周期钩子”构建全类型插件生态 | 30 | 2026-02 |
| G25 | OpenClaw 外部集成需根据“自动化场景需求”在 CLI、HTTP API 与 WebSocket RPC 间进行差异化选型 | 22 | 2026-02 |
| G26 | 独立 Agent 创建需严格区分"CLI 交互式引导”与"RPC 自动化构建”两种模式以适配不同管理场景 | 20 | 2026-02 |
