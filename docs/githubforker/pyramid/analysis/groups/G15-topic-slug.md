# G15: 项目架构与运行机理揭示了“本地优先网关”作为核心枢纽连接多渠道与多工具的设计哲学

> 理解从渠道接入到工具执行的全链路数据流、会话隔离机制及资源约束，是进行高级定制和故障排查的前提。

## 包含的 Atoms

| 编号  | 来源                     | 内容摘要                                                                                          |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| AR-01 | openclaw-analysis-report | OpenClaw 是个人 AI 助手平台，通过用户已有消息渠道（WhatsApp、Telegram 等）交互，支持语音和 Canvas |
| AR-02 | openclaw-analysis-report | 核心特性包括：本地优先 Gateway、13+ 多通道、多代理路由、Voice Wake、Live Canvas、伴侣应用         |
| AR-03 | openclaw-analysis-report | 技术栈：TypeScript(ESM)、Node.js 22+、pnpm 包管理、Swift/Kotlin 原生应用、Vitest 测试             |
| AR-04 | openclaw-analysis-report | 部署渠道包括：NPM 包（手动）、macOS 应用（Sparkle 自动更新）、Docker 镜像（自动）、移动应用       |
| AR-05 | openclaw-analysis-report | NPM 发布流程：更新版本号 → pnpm plugins:sync → pnpm build → pnpm release:check → npm publish      |
| AR-06 | openclaw-analysis-report | macOS 应用发布：构建 → 签名 → 公证 → 打包 → Appcast → GitHub Release，需 Developer ID 证书        |
| AR-07 | openclaw-analysis-report | Docker 镜像推送到 main 分支或 v\*标签时自动触发，构建 linux/amd64 和 linux/arm64 多平台           |
| AR-08 | openclaw-analysis-report | 最小配置：1 vCPU、1GB RAM、500MB 存储；推荐配置：1-2 vCPU、2GB+ RAM、16GB+ 存储                   |
| AR-09 | openclaw-analysis-report | Raspberry Pi 5/4(4GB) 最佳，Pi 4(2GB) 需 swap，Pi Zero 2 W(512MB) 不推荐                          |
| AR-10 | openclaw-analysis-report | 架构核心：Channels → Gateway(WebSocket 18789) → Agents/Nodes/Web UI → Tools                       |
| AR-11 | openclaw-analysis-report | Gateway 职责：WebSocket 服务、通道管理、请求路由、事件广播、协议验证、HTTP 服务                   |
| AR-12 | openclaw-analysis-report | 支持 13+ 通道：WhatsApp(Baileys)、Telegram(grammY)、Slack(Bolt)、Discord、Signal、iMessage 等     |
| AR-13 | openclaw-analysis-report | 会话键类型：main(默认共享)、per-peer、per-channel-peer、per-account-channel-peer                  |
| AR-14 | openclaw-analysis-report | 节点能力：Canvas/Camera/Screen Record 全平台支持，system.run/notify 仅 macOS                      |
| AR-15 | openclaw-analysis-report | 工具分组：runtime(exec/bash)、fs(read/write/edit)、sessions、memory、web、ui、automation、nodes   |
| AR-16 | openclaw-analysis-report | 主要 CLI 命令：gateway、agent、send、onboard、doctor、channels、nodes、config、models             |
| AR-17 | openclaw-analysis-report | Agent 循环流程：输入 → 上下文组装 → 模型推理 → 工具执行 → 流式回复 → 持久化                       |
| AR-18 | openclaw-analysis-report | 工作区默认位置：~/.openclaw/workspace，包含 AGENTS.md、SOUL.md、TOOLS.md 等引导文件               |
| AR-19 | openclaw-analysis-report | 引导文件用途：AGENTS.md(指令)、SOUL.md(人格)、TOOLS.md(工具说明)、IDENTITY.md(代理身份)、USER.md  |
| AR-20 | openclaw-analysis-report | 技能优先级：<workspace>/skills > ~/.openclaw/skills > bundled skills                              |
| AR-21 | openclaw-analysis-report | 技能门控条件：requires.bins(命令存在)、requires.env(环境变量)、os(平台限制)                       |
| AR-22 | openclaw-analysis-report | 模型选择顺序：Primary → Fallbacks → Provider auth failover                                        |
| AR-23 | openclaw-analysis-report | 认证配置文件存储：~/.openclaw/agents/<agentId>/agent/auth-profiles.json，类型分 api_key 和 oauth  |
| AR-24 | openclaw-analysis-report | 模型故障转移冷却时间：1 分钟→5 分钟→25 分钟→1 小时 (上限)，计费禁用起始 5 小时上限 24 小时        |
| AR-25 | openclaw-analysis-report | 会话键格式：直接聊天 (agent:main)、per-peer(dm:peerId)、群组 (group:id)                           |
| AR-26 | openclaw-analysis-report | 会话压缩 (compaction) 将旧对话总结为紧凑摘要，可自动或手动 (/compact) 触发                        |
| AR-27 | openclaw-analysis-report | 队列模式：steer(注入当前运行)、followup(保留至回合结束)、collect(收集至回合结束)                  |
| AR-28 | openclaw-analysis-report | 流类型：lifecycle(生命周期)、assistant(助手增量)、tool(工具事件)                                  |
| AR-29 | openclaw-analysis-report | 插件钩子包括：before_agent_start、agent_end、before/after_tool_call、message_received/sent 等     |
| AR-30 | openclaw-analysis-report | 沙箱模式推荐配置：mode=non-main，允许列表 (bash/process/read/write)，拒绝列表 (browser/canvas 等) |
| AR-31 | openclaw-analysis-report | 超时设置：agent.wait 默认 30s，Agent 运行时默认 600s(agents.defaults.timeoutSeconds)              |
| AR-32 | openclaw-analysis-report | 部署建议：个人使用 2GB RAM，24/7 用 VPS，低成本用 Pi 4/5(2GB+)，云部署 1-2 vCPU/2GB RAM           |

## 组内逻辑顺序

按照“项目概览与部署 → 核心架构与 Gateway 职责 → 数据流与会话机制 → 工具/技能/插件扩展体系 → 运行时参数与资源规划”的结构顺序排列。
