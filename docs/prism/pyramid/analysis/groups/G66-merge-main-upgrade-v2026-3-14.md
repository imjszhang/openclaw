# G66: 大规模上游合并需遵循"全量同步 - 冲突主分支优先 - 安装器直连"策略以保障版本演进与功能完整性

> 本次合并标志着从 Docker 依赖向插拔式 Sandbox 架构的转型，并通过捆绑插件机制统一了 Provider 与技能发现路径。

## 包含的 Atoms

| 编号  | 来源                       | 内容摘要                                                                                |
| ----- | -------------------------- | --------------------------------------------------------------------------------------- |
| OM-01 | merge-main-resolve-by-main | 合入 origin/main (4649f82b77)，涉及 143 个上游提交和 4300 个文件变更                    |
| OM-02 | merge-main-resolve-by-main | 合并后版本为 2026.3.14 (Unreleased)，尚未发布正式版本号                                 |
| OM-03 | merge-main-resolve-by-main | 新增 /btw 侧边提问命令，支持 TUI 关闭与外部渠道显式回复，不改变会话上下文               |
| OM-04 | merge-main-resolve-by-main | Skills 提示超限自动回退为紧凑目录，确保所有已注册 skills 可见                           |
| OM-05 | merge-main-resolve-by-main | Sandbox 后端支持插拔架构，新增 OpenShell (mirror/remote) 模式，不再仅依赖 Docker        |
| OM-06 | merge-main-resolve-by-main | 新增核心 SSH Sandbox 后端，支持基于 secret 的 key、证书与 known_hosts 配置              |
| OM-07 | merge-main-resolve-by-main | 插件 Bundle 支持 Codex/Claude/Cursor 发现安装，映射 bundle skills 为 OpenClaw skills    |
| OM-08 | merge-main-resolve-by-main | OpenRouter/GitHub Copilot 等 Provider 逻辑迁入捆绑插件，含动态回退与 cache-TTL          |
| OM-09 | merge-main-resolve-by-main | MiniMax API 与 OAuth 插件合并为默认开启的单一 minimax 插件，旧配置 ID 兼容              |
| OM-10 | merge-main-resolve-by-main | 支持通过 `openclaw update --tag main` 或安装器参数直接从 GitHub main 分支安装           |
| OM-11 | merge-main-resolve-by-main | 健康监控支持按渠道/账号覆盖配置，保留全局禁用路径 (gateway.channelHealthCheckMinutes=0) |
| OM-12 | merge-main-resolve-by-main | Gateway 可配置推迟完整渠道插件加载至 listen 之后，减轻启动负载                          |
| OM-13 | merge-main-resolve-by-main | Android 端 onboarding 及后续流程支持系统感知的深色主题                                  |
| OM-14 | merge-main-resolve-by-main | Android 节点侧新增 callLog.search 功能，需接入 Call Log 权限                            |
| OM-15 | merge-main-resolve-by-main | Feishu 渠道支持结构化审批卡片及流式思考 token 以 blockquote 形式展示                    |
| OM-16 | merge-main-resolve-by-main | Telegram 渠道新增 channels.telegram.silentErrorReplies 配置，默认关闭                   |
| OM-17 | merge-main-resolve-by-main | 移除旧 channel shim 目录，渠道导入直接指向扩展实现                                      |
| OM-18 | merge-main-resolve-by-main | Firecrawl 作为搜索提供商通过捆绑插件支持，提供 search 与 scrape 工具                    |
| OM-19 | merge-main-resolve-by-main | Chrome DevTools MCP 支持连接 Brave/Edge 等 Chromium 浏览器的 userDataDir                |
| OM-20 | merge-main-resolve-by-main | 移除旧版 Chrome 扩展中继路径 (Breaking Change)，需迁移本机 browser 配置                 |
| OM-21 | merge-main-resolve-by-main | 本机 browser 配置需运行 `openclaw doctor --fix` 迁移到 existing-session 或 user 模式    |
| OM-22 | merge-main-resolve-by-main | Gateway 冷启动改为从编译后的 dist/extensions 加载插件，WhatsApp 启动降至秒级            |
| OM-23 | merge-main-resolve-by-main | 插件 context engine 注册强制与所有者绑定，防止伪造特权或覆盖 engine id                  |
| OM-24 | merge-main-resolve-by-main | Webhook 路由固定到启动时注册表，确保插件变更后渠道 webhook 仍可用                       |
| OM-25 | merge-main-resolve-by-main | 设备配对 token 旋转失败时拒绝处理并泛化公开信息，内部原因仅记录日志                     |
| OM-26 | merge-main-resolve-by-main | Mattermost/Google Chat 收紧发送方校验，Twitch 显式空 allowlist 视为全部拒绝             |
| OM-27 | merge-main-resolve-by-main | ACP 审批使用规范工具身份，冲突时 fail closed，变更内部 action 需 admin 范围             |
| OM-28 | merge-main-resolve-by-main | Compaction 进行中可延长 run deadline，超时/取消时中止底层 SDK compaction                |
| OM-29 | merge-main-resolve-by-main | OpenAI 兼容 tool call 对重复 tool_call_id 去重，避免后端 HTTP 400 错误                  |
| OM-30 | merge-main-resolve-by-main | 非原生 OpenAI-completions 默认省略 tool 定义中的 strict 字段                            |
| OM-31 | merge-main-resolve-by-main | Slack 渠道保留 channelData.slack.blocks 以确保 Block Kit 按钮正确渲染                   |
| OM-32 | merge-main-resolve-by-main | WhatsApp 重连后增加新近度过滤与 protobuf Long 时间戳处理，修复 Baileys 515 问题         |
| OM-33 | merge-main-resolve-by-main | Control UI 会话下拉恢复可读标签，多 gateway 下存储 key 按 base path 隔离                |
| OM-34 | merge-main-resolve-by-main | Google 鉴权在 Node 25 下使用原生 fetch 且不注入 globalThis.window，确保代理/mTLS 传递   |
| OM-35 | merge-main-resolve-by-main | 捆绑插件默认优先级高于自动发现的全局插件，显式安装在 duplicate-id 时胜出                |
| OM-36 | merge-main-resolve-by-main | 本次合并共 7 个冲突文件，全部采用 Main 分支版本解决                                     |
| OM-37 | merge-main-resolve-by-main | 提交合并时使用 `git commit --no-verify` 跳过 pre-commit 钩子，因参数列表过长            |

## 组内逻辑顺序

按“合并概况与版本 -> 核心架构变更 (Sandbox/Plugin) -> 安装与部署流程 -> 渠道与功能增强 -> 安全与稳定性修复 -> 冲突解决策略”的结构顺序排列。
