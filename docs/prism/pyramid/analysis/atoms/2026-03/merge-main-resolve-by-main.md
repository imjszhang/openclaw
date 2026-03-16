# OpenClaw Main 分支合并：本轮更新内容

> 来源：[../../../../journal/2026-03-17/merge-main-resolve-by-main.md](../../../../journal/2026-03-17/merge-main-resolve-by-main.md)
> 缩写：OM

## Atoms

| 编号  | 类型 | 内容                                                                                            | 原文定位              |
| ----- | ---- | ----------------------------------------------------------------------------------------------- | --------------------- |
| OM-01 | 事实 | 本次合并将 origin/main (4649f82b77) 合入 githubforker，涉及约 143 个上游提交和 4300 个文件变更  | 文档头部              |
| OM-02 | 事实 | 合并后仓库版本为 2026.3.14，对应 CHANGELOG 中的 Unreleased 段落，尚未发布正式版本号             | 版本说明              |
| OM-03 | 事实 | 新增 /btw 侧边提问命令，可在不改变会话上下文前提下获取简短回答，支持 TUI 关闭与外部渠道显式回复 | 1.1 命令与交互        |
| OM-04 | 经验 | 当 Skills 提示超过 maxSkillsPromptChars 限制时，系统会自动回退为紧凑目录以保留所有已注册 skills | 1.1 命令与交互        |
| OM-05 | 事实 | Sandbox 后端支持插拔架构，新增 OpenShell 后端提供 mirror 与 remote 模式，不再仅依赖 Docker      | 1.2 Sandbox 与运行时  |
| OM-06 | 事实 | 新增核心 SSH Sandbox 后端，支持基于 secret 的 key、证书与 known_hosts 配置                      | 1.2 Sandbox 与运行时  |
| OM-07 | 事实 | 插件 Bundle 支持 Codex、Claude、Cursor 的发现安装，并将 bundle skills 映射为 OpenClaw skills    | 1.3 插件与 Provider   |
| OM-08 | 事实 | OpenRouter、GitHub Copilot 等 Provider 逻辑已迁入捆绑插件，包含动态模型回退与 cache-TTL 策略    | 1.3 插件与 Provider   |
| OM-09 | 事实 | MiniMax API 与 OAuth 插件已合并为默认开启的单一 minimax 插件，旧配置 ID 保持兼容                | 1.3 插件与 Provider   |
| OM-10 | 步骤 | 可通过 openclaw update --tag main 或安装器 --version main 参数直接从 GitHub main 分支安装       | 1.4 安装与更新        |
| OM-11 | 事实 | 健康监控支持按渠道和账号覆盖配置，保留 gateway.channelHealthCheckMinutes=0 的全局禁用路径       | 1.5 Gateway 与健康    |
| OM-12 | 经验 | Gateway 可配置将完整渠道插件加载推迟到 listen 之后，以减轻启动负载                              | 1.5 Gateway 与健康    |
| OM-13 | 事实 | Android 端 onboarding 及后续流程现已支持系统感知的深色主题                                      | 1.6 移动端            |
| OM-14 | 事实 | Android 节点侧新增 callLog.search 功能，需接入 Call Log 权限以查询近期通话                      | 1.6 移动端            |
| OM-15 | 事实 | Feishu 渠道支持结构化审批卡片及流式思考 token 以 blockquote 形式展示                            | 1.7 渠道              |
| OM-16 | 事实 | Telegram 渠道新增 channels.telegram.silentErrorReplies 配置，默认关闭以控制错误回复静默发送     | 1.7 渠道              |
| OM-17 | 事实 | 移除旧 channel shim 目录，渠道相关导入现在直接指向扩展实现                                      | 1.7 渠道              |
| OM-18 | 事实 | Firecrawl 作为搜索提供商通过捆绑插件支持，提供 firecrawl_search 与 firecrawl_scrape 工具        | 1.8 浏览器与 MCP      |
| OM-19 | 事实 | Chrome DevTools MCP 现支持连接 Brave、Edge 等 Chromium 浏览器的 userDataDir                     | 1.8 浏览器与 MCP      |
| OM-20 | 判断 | 移除旧版 Chrome 扩展中继路径及相关驱动配置属于 Breaking Change，需迁移本机 browser 配置         | 2. Breaking Change    |
| OM-21 | 步骤 | 本机 browser 配置需运行 openclaw doctor --fix 迁移到 existing-session 或 user 模式              | 2. Breaking Change    |
| OM-22 | 经验 | Gateway 冷启动改为从编译后的 dist/extensions 加载插件，使 WhatsApp 类启动时间降至秒级           | 3.1 Gateway/启动/插件 |
| OM-23 | 事实 | 插件 context engine 注册现在强制与所有者绑定，防止伪造特权或覆盖已有 engine id                  | 3.1 Gateway/启动/插件 |
| OM-24 | 事实 | Webhook 路由固定到启动时注册表，确保插件注册表变更后渠道 webhook 仍可用                         | 3.1 Gateway/启动/插件 |
| OM-25 | 事实 | 设备配对 token 旋转失败时拒绝处理并泛化公开信息，内部原因仅记录日志以增强安全性                 | 3.2 安全与策略        |
| OM-26 | 事实 | Mattermost、Google Chat 等入站策略收紧发送方校验，Twitch 显式空 allowlist 视为全部拒绝          | 3.2 安全与策略        |
| OM-27 | 事实 | ACP 审批使用规范工具身份，存在冲突提示时采取 fail closed 策略，变更内部 action 需 admin 范围    | 3.2 安全与策略        |
| OM-28 | 经验 | Compaction 进行中可延长一次 run deadline，超时或取消时中止底层 SDK compaction 避免会话卡住      | 3.3 Agent/模型/工具   |
| OM-29 | 事实 | OpenAI 兼容 tool call 对重复 tool_call_id 进行去重处理，避免后端返回 HTTP 400 错误              | 3.3 Agent/模型/工具   |
| OM-30 | 事实 | 非原生 OpenAI-completions 默认省略 tool 定义中的 strict 字段，除非用户显式启用                  | 3.3 Agent/模型/工具   |
| OM-31 | 事实 | Slack 渠道保留 channelData.slack.blocks 以确保 Block Kit 按钮在 DM 与预览中正确渲染             | 3.4 渠道与 UI         |
| OM-32 | 事实 | WhatsApp 重连后增加新近度过滤与 protobuf Long 时间戳处理，修复 Baileys 515 配对重启问题         | 3.4 渠道与 UI         |
| OM-33 | 事实 | Control UI 会话下拉恢复可读标签，多 gateway 下存储 key 按 base path 隔离并迁移旧 key            | 3.4 渠道与 UI         |
| OM-34 | 事实 | Google 鉴权在 Node 25 环境下使用原生 fetch 且不注入 globalThis.window，确保代理与 mTLS 设置传递 | 3.5 其他修复          |
| OM-35 | 事实 | 捆绑插件默认优先级高于自动发现的全局插件，显式安装的插件在 duplicate-id 时胜出                  | 3.5 其他修复          |
| OM-36 | 事实 | 本次合并共 7 个冲突文件，全部采用 Main 分支版本解决                                             | 4.本轮合并过程        |
| OM-37 | 步骤 | 提交合并时使用 git commit --no-verify 跳过 pre-commit 钩子，因参数列表过长导致钩子未执行        | 4.本轮合并过程        |
