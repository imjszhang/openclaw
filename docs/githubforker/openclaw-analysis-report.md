# OpenClaw 项目分析报告

> 分析日期：2026-01-31  
> OpenClaw 版本：2026.1.29

## 目录

1. [项目概述](#1-项目概述)
2. [部署逻辑](#2-部署逻辑)
3. [设备要求](#3-设备要求)
4. [核心组件](#4-核心组件)
5. [Agents 详细分析](#5-agents-详细分析)
6. [总结](#6-总结)

---

## 1. 项目概述

### 1.1 项目简介

OpenClaw 是一个**个人 AI 助手平台**，可以在用户自己的设备上运行。它通过用户已有的消息渠道（WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage、Microsoft Teams、WebChat 等）进行交互，支持语音和实时 Canvas 界面。

### 1.2 核心特性

- **本地优先 Gateway**：单一控制平面，管理会话、通道、工具和事件
- **多通道收件箱**：支持 13+ 消息通道
- **多代理路由**：路由到隔离的代理（工作区 + 每代理会话）
- **Voice Wake + Talk Mode**：macOS/iOS/Android 上的语音唤醒
- **Live Canvas**：代理驱动的可视化工作区（A2UI）
- **一流的工具支持**：浏览器、Canvas、节点、定时任务、会话工具
- **伴侣应用**：macOS 菜单栏应用 + iOS/Android 节点

### 1.3 技术栈

- **核心语言**：TypeScript (ESM)
- **运行时**：Node.js 22+
- **包管理**：pnpm（推荐）、npm、bun
- **原生应用**：Swift (macOS/iOS)、Kotlin (Android)
- **测试框架**：Vitest
- **代码规范**：Oxlint、Oxfmt

---

## 2. 部署逻辑

### 2.1 部署渠道概览

项目支持多个部署渠道：

| 渠道 | 目标 | 触发方式 |
|------|------|----------|
| NPM 包 | CLI 工具 | 手动发布 |
| macOS 应用 | Sparkle 自动更新 | 手动发布 |
| Docker 镜像 | GitHub Container Registry | 自动（push/tag）|
| 移动应用 | iOS/Android | CI 测试 |

### 2.2 NPM 包发布流程

```
版本更新 → 同步插件版本 → 构建 → 验证 → 发布 → GitHub Release
```

**关键步骤**：
1. 更新 `package.json` 版本号
2. 运行 `pnpm plugins:sync` 同步扩展包版本
3. 构建：`pnpm build`
4. 验证：`pnpm release:check`
5. 发布：`npm publish --access public`

**包内容控制**（`package.json` files 字段）：
- `dist/**` - 编译输出
- `docs/**` - 文档
- `extensions/**` - 插件
- `skills/**` - 技能
- 排除：`dist/OpenClaw.app`

### 2.3 macOS 应用发布流程

```
构建 → 签名 → 公证 → 打包 → Appcast → GitHub Release
```

**关键脚本**：
- `scripts/package-mac-app.sh` - 构建应用包
- `scripts/package-mac-dist.sh` - 创建发布用 zip/DMG
- `scripts/make_appcast.sh` - 生成 Sparkle 更新清单

**必要条件**：
- Developer ID Application 证书
- Sparkle 私钥（`SPARKLE_PRIVATE_KEY_FILE`）
- App Store Connect API 密钥（公证）
- `APP_BUILD` 必须是数字且单调递增

### 2.4 Docker 镜像发布流程

**触发条件**：
- 推送到 `main` 分支
- 创建 `v*` 标签

**构建流程**：
1. 并行构建 `linux/amd64` 和 `linux/arm64`
2. 推送到 GitHub Container Registry
3. 创建多平台 manifest

**Dockerfile 特点**：
- 基于 `node:22-bookworm`
- 安装 Bun（用于构建脚本）
- 以非 root 用户运行（安全加固）

### 2.5 CI/CD 工作流

```yaml
# 主要工作流
.github/workflows/ci.yml          # 主 CI（lint、test、build）
.github/workflows/docker-release.yml  # Docker 发布
.github/workflows/install-smoke.yml   # 安装测试
```

**CI 检查矩阵**：
- Node + Bun 双运行时测试
- Ubuntu + Windows + macOS 多平台
- lint、test、build、protocol、format

---

## 3. 设备要求

### 3.1 核心运行时要求

| 组件 | 要求 | 说明 |
|------|------|------|
| Node.js | ≥ 22 | 必需 |
| 架构 | 64 位 | ARM64 或 x86_64 |
| 包管理器 | npm/pnpm/bun | 推荐 pnpm |

### 3.2 硬件要求

#### 最小配置（基础 Gateway + 单通道）
- CPU：1 vCPU
- 内存：1GB RAM
- 存储：~500MB 磁盘空间

#### 推荐配置（多通道 + 浏览器自动化）
- CPU：1-2 vCPU
- 内存：2GB+ RAM
- 存储：16GB+

### 3.3 操作系统支持

| 平台 | 支持级别 | 说明 |
|------|----------|------|
| macOS | 完全支持 | Gateway + 原生菜单栏应用 |
| Linux | 完全支持 | 推荐 Ubuntu LTS |
| Windows | WSL2 | 推荐 Ubuntu-24.04 |
| iOS | 节点模式 | 配对设备 |
| Android | 节点模式 | 配对设备 |

### 3.4 Raspberry Pi 支持

| Pi 型号 | RAM | 状态 | 备注 |
|---------|-----|------|------|
| Pi 5 | 4GB/8GB | ✅ 最佳 | 推荐 |
| Pi 4 | 4GB | ✅ 良好 | 大多数用户首选 |
| Pi 4 | 2GB | ✅ 可用 | 需要 swap |
| Pi 4 | 1GB | ⚠️ 紧张 | 最小配置 |
| Pi 3B+ | 1GB | ⚠️ 慢 | 可用但性能差 |
| Pi Zero 2 W | 512MB | ❌ | 不推荐 |

---

## 4. 核心组件

### 4.1 架构概览

```
┌─────────────────────────────────────────┐
│         Channels (消息通道)              │
│  WhatsApp/Telegram/Slack/Discord/...    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Gateway (控制平面)               │
│  WebSocket Server (18789)               │
│  - 请求路由                              │
│  - 事件广播                              │
│  - 通道管理                              │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Agents │ │ Nodes  │ │  Web   │
│ (Pi)   │ │(设备)  │ │  UI    │
└────────┘ └────────┘ └────────┘
    │
    ▼
┌─────────────────────────┐
│    Tools & Automation    │
│  Browser/Canvas/Cron/... │
└─────────────────────────┘
```

### 4.2 核心组件列表

#### 4.2.1 Gateway（网关控制平面）

**位置**：`src/gateway/`

**职责**：
- WebSocket 服务器（默认端口 18789）
- 消息通道管理
- 请求路由和事件广播
- 协议验证（JSON Schema）
- HTTP 服务（Control UI、WebChat、Canvas Host）

**关键文件**：
- `server.impl.ts` - 主实现
- `server-runtime-state.ts` - 运行时状态
- `server-methods.ts` - RPC 方法处理

#### 4.2.2 Channels（消息通道系统）

**位置**：`src/channels/`, `src/whatsapp/`, `src/telegram/`, `src/discord/`, `src/slack/`, `src/signal/`, `src/imessage/`, `src/web/`

**支持的通道**：

| 通道 | 技术实现 | 类型 |
|------|----------|------|
| WhatsApp | Baileys | 内置 |
| Telegram | grammY | 内置 |
| Slack | Bolt | 内置 |
| Discord | @buape/carbon | 内置 |
| Signal | signal-cli | 内置 |
| iMessage | imsg CLI | 内置 |
| Google Chat | Chat API | 内置 |
| Microsoft Teams | Bot Framework | 扩展 |
| Matrix | matrix-sdk | 扩展 |
| Zalo | zalo-api | 扩展 |
| BlueBubbles | - | 扩展 |

#### 4.2.3 Sessions（会话管理系统）

**位置**：`src/sessions/`

**会话键类型**：
- `main`：所有直接聊天共享（默认）
- `per-peer`：按发送者隔离
- `per-channel-peer`：按通道 + 发送者隔离
- `per-account-channel-peer`：按账户 + 通道 + 发送者隔离

**存储位置**：
- 会话状态：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录记录：`~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

#### 4.2.4 Nodes（设备节点系统）

**位置**：`src/node-host/`, `apps/macos/`, `apps/ios/`, `apps/android/`

**节点能力**：

| 能力 | macOS | iOS | Android |
|------|-------|-----|---------|
| Canvas | ✅ | ✅ | ✅ |
| Camera | ✅ | ✅ | ✅ |
| Screen Record | ✅ | ✅ | ✅ |
| Voice Wake | ✅ | ✅ | - |
| Talk Mode | ✅ | ✅ | ✅ |
| system.run | ✅ | - | - |
| system.notify | ✅ | - | - |
| Location | ✅ | ✅ | ✅ |

#### 4.2.5 Tools（工具系统）

**工具组**：
- `group:runtime`：exec、bash、process
- `group:fs`：read、write、edit、apply_patch
- `group:sessions`：sessions_list、sessions_history、sessions_send、sessions_spawn
- `group:memory`：memory_search、memory_get
- `group:web`：web_search、web_fetch
- `group:ui`：browser、canvas
- `group:automation`：cron、gateway
- `group:messaging`：message
- `group:nodes`：nodes

#### 4.2.6 CLI（命令行界面）

**位置**：`src/cli/`, `src/commands/`

**主要命令**：
```bash
openclaw gateway      # Gateway 管理
openclaw agent        # 代理交互
openclaw send         # 发送消息
openclaw onboard      # 引导设置
openclaw doctor       # 诊断和修复
openclaw channels     # 通道管理
openclaw nodes        # 节点管理
openclaw config       # 配置管理
openclaw models       # 模型管理
```

#### 4.2.7 Web UI

**位置**：`src/web/`, `ui/`

**组件**：
- Control UI：Gateway 控制面板
- WebChat：聊天界面
- Dashboard：仪表板
- Canvas Host：Canvas/A2UI 服务器（端口 18793）

#### 4.2.8 Media Pipeline

**位置**：`src/media/`, `src/media-understanding/`

**功能**：
- 媒体获取和托管
- 图片/音频/视频处理
- 音频转录钩子
- 大小限制和临时文件管理

---

## 5. Agents 详细分析

### 5.1 Agent 运行时概述

**位置**：`src/agents/`

OpenClaw 运行一个基于 **p-mono** 的嵌入式代理运行时。会话管理、发现和工具连接由 OpenClaw 自己管理。

### 5.2 Agent 循环（Agent Loop）

Agent 循环是完整的代理运行流程：

```
输入 → 上下文组装 → 模型推理 → 工具执行 → 流式回复 → 持久化
```

#### 5.2.1 入口点

- Gateway RPC：`agent` 和 `agent.wait`
- CLI：`agent` 命令

#### 5.2.2 执行流程

1. **`agent` RPC**：
   - 验证参数
   - 解析会话（sessionKey/sessionId）
   - 持久化会话元数据
   - 返回 `{ runId, acceptedAt }`

2. **`agentCommand` 运行代理**：
   - 解析模型 + thinking/verbose 默认值
   - 加载技能快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 发出生命周期结束/错误事件

3. **`runEmbeddedPiAgent`**：
   - 通过每会话 + 全局队列序列化运行
   - 解析模型 + 认证配置文件
   - 订阅 pi 事件并流式传输助手/工具增量
   - 强制超时 → 如果超时则中止运行
   - 返回有效负载 + 使用元数据

4. **`subscribeEmbeddedPiSession` 桥接事件**：
   - 工具事件 → `stream: "tool"`
   - 助手增量 → `stream: "assistant"`
   - 生命周期事件 → `stream: "lifecycle"`

### 5.3 工作区（Workspace）

OpenClaw 使用单个代理工作区目录作为代理的唯一工作目录。

**默认位置**：`~/.openclaw/workspace`

**配置**：`agents.defaults.workspace`

### 5.4 引导文件（Bootstrap Files）

工作区中的用户可编辑文件：

| 文件 | 用途 |
|------|------|
| `AGENTS.md` | 操作指令 + "记忆" |
| `SOUL.md` | 人格、边界、语气 |
| `TOOLS.md` | 工具使用说明 |
| `BOOTSTRAP.md` | 首次运行仪式（完成后删除）|
| `IDENTITY.md` | 代理名称/风格/表情符号 |
| `USER.md` | 用户档案 + 偏好称呼 |

### 5.5 内置工具

#### 5.5.1 核心工具列表

| 工具 | 描述 |
|------|------|
| `read` | 读取文件内容 |
| `write` | 创建或覆盖文件 |
| `edit` | 精确编辑文件 |
| `apply_patch` | 应用多文件补丁 |
| `grep` | 搜索文件内容 |
| `find` | 按 glob 模式查找文件 |
| `ls` | 列出目录内容 |
| `exec` | 运行 shell 命令 |
| `process` | 管理后台 exec 会话 |
| `web_search` | Web 搜索（Brave API）|
| `web_fetch` | 获取 URL 内容 |
| `browser` | 控制 Web 浏览器 |
| `canvas` | Canvas 展示/评估/快照 |
| `nodes` | 节点列表/描述/通知/相机/屏幕 |
| `cron` | 管理定时任务 |
| `message` | 发送消息和通道操作 |
| `gateway` | 重启/配置/更新 Gateway |
| `sessions_list` | 列出其他会话 |
| `sessions_history` | 获取会话历史 |
| `sessions_send` | 发送消息到其他会话 |
| `sessions_spawn` | 生成子代理会话 |
| `session_status` | 显示会话状态 |
| `image` | 使用图像模型分析图像 |

#### 5.5.2 工具配置

**全局允许/拒绝**：
```json5
{
  tools: {
    allow: ["group:fs", "browser"],
    deny: ["exec"]
  }
}
```

**工具配置文件**：
- `minimal`：仅 `session_status`
- `coding`：`group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image`
- `messaging`：`group:messaging`、会话工具
- `full`：无限制

### 5.6 技能系统（Skills）

#### 5.6.1 技能位置和优先级

```
<workspace>/skills (最高) → ~/.openclaw/skills → bundled skills (最低)
```

#### 5.6.2 技能格式

```markdown
---
name: skill-name
description: Skill description
metadata: {"openclaw":{"requires":{"bins":["uv"],"env":["API_KEY"]}}}
---
<!-- 技能指令内容 -->
```

#### 5.6.3 技能门控

- `requires.bins`：必须在 PATH 中存在
- `requires.env`：环境变量必须存在或在配置中提供
- `requires.config`：配置路径必须为真值
- `os`：平台限制（darwin/linux/win32）

#### 5.6.4 ClawdHub 集成

```bash
clawdhub install <skill-slug>   # 安装技能
clawdhub update --all           # 更新所有技能
clawdhub sync --all             # 同步技能
```

### 5.7 模型管理

#### 5.7.1 模型选择顺序

1. **Primary** 模型：`agents.defaults.model.primary`
2. **Fallbacks**：`agents.defaults.model.fallbacks`（按顺序）
3. **Provider auth failover**：在移动到下一个模型之前在 provider 内部发生

#### 5.7.2 认证配置文件

**类型**：
- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`

**存储位置**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

#### 5.7.3 模型故障转移

**Auth Profile 轮换**：
- 显式配置：`auth.order[provider]`
- 配置的配置文件：`auth.profiles`
- 存储的配置文件

**冷却时间（Cooldowns）**：
- 1 分钟 → 5 分钟 → 25 分钟 → 1 小时（上限）

**计费禁用**：
- 起始：5 小时
- 上限：24 小时

### 5.8 会话管理

#### 5.8.1 会话键映射

| 场景 | 会话键格式 |
|------|-----------|
| 直接聊天（main）| `agent:<agentId>:<mainKey>` |
| per-peer | `agent:<agentId>:dm:<peerId>` |
| per-channel-peer | `agent:<agentId>:<channel>:dm:<peerId>` |
| 群组聊天 | `agent:<agentId>:<channel>:group:<id>` |

#### 5.8.2 会话修剪（Pruning）

- 在内存中修剪旧工具结果
- 不重写 JSONL 历史
- 每个请求执行

#### 5.8.3 会话压缩（Compaction）

- 将旧对话总结为紧凑摘要
- 持久化到 JSONL 历史
- 自动/手动触发（`/compact`）

### 5.9 队列和并发

- 运行按会话键序列化（会话通道）
- 可选通过全局通道
- 防止工具/会话竞争
- 保持会话历史一致

**队列模式**：
- `steer`：入站消息注入当前运行
- `followup`：消息保留直到当前回合结束
- `collect`：收集消息直到当前回合结束

### 5.10 流式处理

#### 5.10.1 流类型

- `lifecycle`：生命周期事件（start/end/error）
- `assistant`：助手增量
- `tool`：工具事件

#### 5.10.2 块流式处理

- 默认关闭：`agents.defaults.blockStreamingDefault: "off"`
- 边界：`agents.defaults.blockStreamingBreak`（text_end/message_end）
- 分块：`agents.defaults.blockStreamingChunk`（800-1200 字符）

### 5.11 钩子系统

#### 5.11.1 内部钩子（Gateway Hooks）

- `agent:bootstrap`：构建引导文件时运行
- 命令钩子：`/new`、`/reset`、`/stop` 等

#### 5.11.2 插件钩子

| 钩子 | 描述 |
|------|------|
| `before_agent_start` | 运行开始前注入上下文 |
| `agent_end` | 完成后检查最终消息列表 |
| `before_compaction` / `after_compaction` | 观察压缩周期 |
| `before_tool_call` / `after_tool_call` | 拦截工具参数/结果 |
| `tool_result_persist` | 转换工具结果 |
| `message_received` / `message_sending` / `message_sent` | 消息钩子 |
| `session_start` / `session_end` | 会话生命周期 |
| `gateway_start` / `gateway_stop` | Gateway 生命周期 |

### 5.12 沙箱模式

#### 5.12.1 配置

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",  // 仅非主会话
        docker: {
          image: "node:22-bookworm",
          setupCommand: "apt-get update && apt-get install -y <pkg>"
        }
      }
    }
  }
}
```

#### 5.12.2 沙箱工具策略

- **允许列表**：bash、process、read、write、edit、sessions_*
- **拒绝列表**：browser、canvas、nodes、cron、discord、gateway

### 5.13 超时设置

| 超时类型 | 默认值 | 配置 |
|----------|--------|------|
| agent.wait | 30s | `timeoutMs` 参数 |
| Agent 运行时 | 600s | `agents.defaults.timeoutSeconds` |

---

## 6. 总结

### 6.1 项目特点

1. **本地优先架构**：Gateway 作为单一控制平面，保持数据本地化
2. **多通道支持**：支持 13+ 消息通道，统一消息体验
3. **可扩展性**：插件系统支持扩展通道和工具
4. **跨平台**：支持 macOS、Linux、Windows(WSL2)、iOS、Android
5. **自动化友好**：丰富的工具集和定时任务支持

### 6.2 部署建议

| 场景 | 推荐配置 |
|------|---------|
| 个人使用（本地）| 2GB RAM，现代 CPU |
| 24/7 运行 | VPS 或专用设备 |
| 低成本自托管 | Raspberry Pi 4/5 (2GB+) |
| 云部署 | 1-2 vCPU，2GB RAM |

### 6.3 核心组件总结

| 组件 | 职责 |
|------|------|
| Gateway | WebSocket 控制平面 |
| Channels | 消息通道集成 |
| Agents | AI 代理运行时 |
| Sessions | 会话管理 |
| Nodes | 设备节点 |
| Tools | 工具和自动化 |
| Skills | 技能平台 |
| CLI/Web UI | 用户界面 |

### 6.4 关键文档链接

- 入门指南：https://docs.openclaw.ai/start/getting-started
- Gateway 运行手册：https://docs.openclaw.ai/gateway
- 配置参考：https://docs.openclaw.ai/gateway/configuration
- 安全指南：https://docs.openclaw.ai/gateway/security
- 工具文档：https://docs.openclaw.ai/tools
- 技能平台：https://docs.openclaw.ai/tools/skills

---

*报告生成日期：2026-01-31*
