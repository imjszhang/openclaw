# OpenClaw 项目分析报告

> 来源：[../../../../journal/2026-01-31/openclaw-analysis-report.md](../../../../journal/2026-01-31/openclaw-analysis-report.md)
> 缩写：AR

## Atoms

| 编号  | 类型 | 内容                                                                                              | 原文定位                |
| ----- | ---- | ------------------------------------------------------------------------------------------------- | ----------------------- |
| AR-01 | 事实 | OpenClaw 是个人 AI 助手平台，通过用户已有消息渠道（WhatsApp、Telegram 等）交互，支持语音和 Canvas | 1.1 项目简介            |
| AR-02 | 事实 | 核心特性包括：本地优先 Gateway、13+ 多通道、多代理路由、Voice Wake、Live Canvas、伴侣应用         | 1.2 核心特性            |
| AR-03 | 事实 | 技术栈：TypeScript(ESM)、Node.js 22+、pnpm 包管理、Swift/Kotlin 原生应用、Vitest 测试             | 1.3 技术栈              |
| AR-04 | 事实 | 部署渠道包括：NPM 包（手动）、macOS 应用（Sparkle 自动更新）、Docker 镜像（自动）、移动应用       | 2.1 部署渠道概览        |
| AR-05 | 步骤 | NPM 发布流程：更新版本号 → pnpm plugins:sync → pnpm build → pnpm release:check → npm publish      | 2.2 NPM 包发布流程      |
| AR-06 | 步骤 | macOS 应用发布：构建 → 签名 → 公证 → 打包 → Appcast → GitHub Release，需 Developer ID 证书        | 2.3 macOS 应用发布流程  |
| AR-07 | 事实 | Docker 镜像推送到 main 分支或 v\*标签时自动触发，构建 linux/amd64 和 linux/arm64 多平台           | 2.4 Docker 镜像发布流程 |
| AR-08 | 事实 | 最小配置：1 vCPU、1GB RAM、500MB 存储；推荐配置：1-2 vCPU、2GB+ RAM、16GB+ 存储                   | 3.2 硬件要求            |
| AR-09 | 判断 | Raspberry Pi 5/4(4GB) 最佳，Pi 4(2GB) 需 swap，Pi Zero 2 W(512MB) 不推荐                          | 3.4 Raspberry Pi 支持   |
| AR-10 | 事实 | 架构核心：Channels → Gateway(WebSocket 18789) → Agents/Nodes/Web UI → Tools                       | 4.1 架构概览            |
| AR-11 | 事实 | Gateway 职责：WebSocket 服务、通道管理、请求路由、事件广播、协议验证、HTTP 服务                   | 4.2.1 Gateway           |
| AR-12 | 事实 | 支持 13+ 通道：WhatsApp(Baileys)、Telegram(grammY)、Slack(Bolt)、Discord、Signal、iMessage 等     | 4.2.2 Channels          |
| AR-13 | 事实 | 会话键类型：main(默认共享)、per-peer、per-channel-peer、per-account-channel-peer                  | 4.2.3 Sessions          |
| AR-14 | 事实 | 节点能力：Canvas/Camera/Screen Record 全平台支持，system.run/notify 仅 macOS                      | 4.2.4 Nodes             |
| AR-15 | 事实 | 工具分组：runtime(exec/bash)、fs(read/write/edit)、sessions、memory、web、ui、automation、nodes   | 4.2.5 Tools             |
| AR-16 | 事实 | 主要 CLI 命令：gateway、agent、send、onboard、doctor、channels、nodes、config、models             | 4.2.6 CLI               |
| AR-17 | 事实 | Agent 循环流程：输入 → 上下文组装 → 模型推理 → 工具执行 → 流式回复 → 持久化                       | 5.2 Agent 循环          |
| AR-18 | 事实 | 工作区默认位置：~/.openclaw/workspace，包含 AGENTS.md、SOUL.md、TOOLS.md 等引导文件               | 5.3 工作区              |
| AR-19 | 事实 | 引导文件用途：AGENTS.md(指令)、SOUL.md(人格)、TOOLS.md(工具说明)、IDENTITY.md(代理身份)、USER.md  | 5.4 引导文件            |
| AR-20 | 事实 | 技能优先级：<workspace>/skills > ~/.openclaw/skills > bundled skills                              | 5.6.1 技能位置和优先级  |
| AR-21 | 事实 | 技能门控条件：requires.bins(命令存在)、requires.env(环境变量)、os(平台限制)                       | 5.6.3 技能门控          |
| AR-22 | 步骤 | 模型选择顺序：Primary → Fallbacks → Provider auth failover                                        | 5.7.1 模型选择顺序      |
| AR-23 | 事实 | 认证配置文件存储：~/.openclaw/agents/<agentId>/agent/auth-profiles.json，类型分 api_key 和 oauth  | 5.7.2 认证配置文件      |
| AR-24 | 经验 | 模型故障转移冷却时间：1 分钟→5 分钟→25 分钟→1 小时(上限)，计费禁用起始 5 小时上限 24 小时         | 5.7.3 模型故障转移      |
| AR-25 | 事实 | 会话键格式：直接聊天(agent:main)、per-peer(dm:peerId)、群组(group:id)                             | 5.8.1 会话键映射        |
| AR-26 | 事实 | 会话压缩(compaction) 将旧对话总结为紧凑摘要，可自动或手动(/compact) 触发                          | 5.8.3 会话压缩          |
| AR-27 | 事实 | 队列模式：steer(注入当前运行)、followup(保留至回合结束)、collect(收集至回合结束)                  | 5.9 队列和并发          |
| AR-28 | 事实 | 流类型：lifecycle(生命周期)、assistant(助手增量)、tool(工具事件)                                  | 5.10.1 流类型           |
| AR-29 | 事实 | 插件钩子包括：before_agent_start、agent_end、before/after_tool_call、message_received/sent 等     | 5.11.2 插件钩子         |
| AR-30 | 判断 | 沙箱模式推荐配置：mode=non-main，允许列表(bash/process/read/write)，拒绝列表(browser/canvas等)    | 5.12 沙箱模式           |
| AR-31 | 事实 | 超时设置：agent.wait 默认 30s，Agent 运行时默认 600s(agents.defaults.timeoutSeconds)              | 5.13 超时设置           |
| AR-32 | 判断 | 部署建议：个人使用 2GB RAM，24/7 用 VPS，低成本用 Pi 4/5(2GB+)，云部署 1-2 vCPU/2GB RAM           | 6.2 部署建议            |
