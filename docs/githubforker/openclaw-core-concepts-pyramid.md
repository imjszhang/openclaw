# OpenClaw 核心概念：Channel、Account、Agent、Workspace、Session

> 文档日期：2026-02-13

---

## 核心结论（结论先行）

OpenClaw 通过 **Channel → Account → Agent → Workspace + Session** 五层抽象，实现多通道、多账户、多智能体的独立运作。消息路径为：**通道账户接收 → bindings 路由到 Agent → 在 Workspace 中执行、在 Session 中维护上下文 → 原路返回**。

---

## 1. 概念层级总览

### 1.1 金字塔结构

```
                    ┌─────────────────┐
                    │    Channel      │  在哪个平台
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Account      │  用哪个号
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     Agent        │  谁来处理
                    └────────┬────────┘
                    ┌────────┴────────┐
           ┌────────▼────────┐ ┌──────▼──────┐
           │   Workspace     │ │   Session   │
           │  Agent 的文件家  │ │  对话上下文  │
           └─────────────────┘ └─────────────┘
```

### 1.2 五概念一句话

| 概念          | 定义                                               |
| ------------- | -------------------------------------------------- |
| **Channel**   | 消息平台（WhatsApp、Telegram、Discord 等）         |
| **Account**   | 同一 Channel 下的一个登录实例（手机号、Bot Token） |
| **Agent**     | 一个「大脑」：Workspace + AgentDir + Sessions      |
| **Workspace** | Agent 的文件工作目录（人设、记忆、技能所在）       |
| **Session**   | 一段对话的上下文桶（历史 + token 计数）            |

---

## 2. 五概念详解

### 2.1 Channel（通道）

**是什么**：消息平台，如 `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`、`webchat`。

**作用**：定义消息来源和去向的平台。

**配置**：`channels.<channel>`。

---

### 2.2 Account（账户）

**是什么**：同一 Channel 下的一个登录实例。

**示例**：

- WhatsApp：一个手机号 = 一个 account
- Telegram：一个 Bot Token = 一个 account
- Discord：一个 Bot Token = 一个 account

**配置**：`channels.<channel>.accounts.<accountId>`

**默认**：省略 `accountId` 时使用 `default`。

**凭证存储**：

- WhatsApp：`~/.openclaw/credentials/whatsapp/<accountId>/`
- 环境变量 token 仅作用于 default 账户

---

### 2.3 Agent（智能体）

**是什么**：一个完全独立作用域的大脑，包含三部分：

| 组成部分  | 路径                                     | 作用                           |
| --------- | ---------------------------------------- | ------------------------------ |
| Workspace | `agents.list[].workspace`                | 文件工作目录、人设、记忆、技能 |
| AgentDir  | `~/.openclaw/agents/<agentId>/agent/`    | auth-profiles、模型配置        |
| Sessions  | `~/.openclaw/agents/<agentId>/sessions/` | 会话存储、转录                 |

**配置**：`agents.list[]`，每项有 `id`、`workspace`、`agentDir` 等。

**路由**：通过 `bindings` 将入站消息映射到不同 agent。

---

### 2.4 Workspace（工作区）

**是什么**：Agent 的**唯一工作目录**，是 Agent 的「家」。

**用途**：

- 文件工具（read、write、edit）的默认 cwd
- 注入到系统提示的上下文（AGENTS.md、SOUL.md 等）
- 记忆文件（MEMORY.md、memory/）
- 技能目录（skills/）
- Canvas UI 资源

**与 ~/.openclaw/ 的区分**：

| 位置         | 内容                             |
| ------------ | -------------------------------- |
| Workspace    | 人设、记忆、技能、用户可编辑文件 |
| ~/.openclaw/ | 配置、凭证、会话存储、全局技能   |

**典型目录结构**：

```
<workspace>/
├── AGENTS.md        # 操作指令、规则、优先级
├── SOUL.md          # 人设、语气、边界
├── USER.md          # 用户信息、称呼方式
├── IDENTITY.md      # Agent 名称、风格
├── TOOLS.md         # 工具使用说明
├── MEMORY.md        # 长期记忆（可选）
├── memory/          # 按日记忆 YYYY-MM-DD.md
├── skills/          # 该 workspace 专属技能
└── canvas/          # Canvas UI 资源
```

**重要**：Workspace 是默认 cwd，不是硬沙箱；需强隔离时启用 `sandbox`。

---

### 2.5 Session（会话）

**是什么**：一段对话的上下文桶。

**用途**：

- 存储历史
- 控制并发（同一 session 串行）
- token 统计、compaction

**SessionKey 示例**：

- DM：`agent:home:whatsapp:dm:+15551234567`
- 群：`agent:home:whatsapp:group:120363...@g.us`
- 主会话：`agent:home:main`

**配置**：`session.dmScope` 控制 DM 如何分桶：

- `main`：所有 DM 共享
- `per-peer`：按发送者隔离
- `per-channel-peer`：按通道 + 发送者隔离
- `per-account-channel-peer`：按账户 + 通道 + 发送者隔离

---

## 3. 路由与绑定

### 3.1 Bindings 匹配顺序

1. `match.peer`（精确 DM/群）
2. `match.guildId`（Discord）
3. `match.teamId`（Slack）
4. `match.accountId`（精确 account）
5. `match.accountId: "*"`（该 channel 任意 account）
6. 默认 agent

### 3.2 消息流转

```
用户发消息到 WhatsApp 个人号
        │
        ▼
Channel: whatsapp + Account: personal
        │
        ▼  bindings 路由
        │
Agent: home
        │
        ├── Workspace: 加载 AGENTS.md、SOUL.md 等
        │
        └── Session: 加载历史、推理、工具调用（cwd = workspace）
        │
        ▼  按 deliveryContext 原路返回
    回复从 WhatsApp 个人号发出
```

---

## 4. 多实例独立运作

### 4.1 隔离机制概览

| 层级        | 隔离方式                                     |
| ----------- | -------------------------------------------- |
| **Agent**   | 独立 workspace、agentDir、sessions 目录      |
| **Session** | sessionKey + 文件锁 + session lane 串行      |
| **Channel** | 各 channel 独立 monitor                      |
| **Account** | 独立凭证目录、bindings 中 accountId 参与路由 |

### 4.2 典型场景

**场景 A：单通道、多账户、多 Agent**

```
Channel: whatsapp
Accounts: personal → Agent: home
          biz      → Agent: work
```

**场景 B：多通道、单账户、多 Agent**

```
whatsapp  → Agent: chat（日常）
telegram  → Agent: opus（深度工作）
```

**场景 C：同一通道、同一账户、按联系人分 Agent**

```
whatsapp, Account: personal
  peer +15551230001 → Agent: alex
  peer +15551230002 → Agent: mia
```

### 4.3 并发控制

- **全局**：`CommandLane.Main` 的 `maxConcurrent`
- **按 Session**：`session:<sessionKey>` lane（同一 session 串行）
- **按文件**：`acquireSessionWriteLock` 保护 JSONL 写入
- **Session Store**：`withSessionStoreLock` 保护 sessions.json

---

## 5. 配置与路径速查

### 5.1 关键配置项

| 配置项                        | 作用                                              |
| ----------------------------- | ------------------------------------------------- |
| `channels.<channel>.accounts` | 定义该通道下有哪些账户                            |
| `agents.list`                 | 定义有哪些 agent                                  |
| `bindings`                    | 将 (channel, accountId, peer, ...) 映射到 agentId |
| `session.dmScope`             | 控制 DM 如何划分 session                          |

### 5.2 存储路径

```
~/.openclaw/
├── openclaw.json              # 全局配置
├── credentials/
│   └── whatsapp/
│       ├── default/            # accountId = default 的凭证
│       ├── personal/
│       └── biz/
└── agents/
    └── <agentId>/
        ├── agent/              # auth、模型配置
        └── sessions/           # 会话
            ├── sessions.json
            └── <sessionId>.jsonl
```

Workspace 默认：`~/.openclaw/workspace` 或 `~/.openclaw/workspace-<agentId>`。

---

## 6. 实施要点

### 6.1 多用户 DM 安全

若 Agent 接收**多人** DM，建议设置 `session.dmScope: "per-channel-peer"` 或 `per-account-channel-peer`，避免上下文泄露。

### 6.2 多账户路由

每个 `accountId` 可通过 bindings 路由到不同 agent，实现「一个服务器托管多个手机号而不混合会话」。

### 6.3 Workspace 备份

建议将 workspace 放入**私有 git 仓库**备份，不提交 `~/.openclaw/` 下的配置和凭证。

### 6.4 多 Agent 注意事项

- 切勿在 agent 间复用 `agentDir`（会导致 auth/session 冲突）
- 共享凭证需手动复制 `auth-profiles.json`
- Skills：workspace 的 `skills/` 优先于 `~/.openclaw/skills`

---

## 7. 扩展相关概念

与五核心概念紧密相关、理解系统全貌时需了解的概念。

### 7.1 运行环境层

| 概念        | 定义                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Gateway** | 单一控制平面，管理所有通道连接、WebSocket 服务（默认 18789）、请求路由、事件广播。一个主机一个 Gateway。                       |
| **Node**    | 配对设备（macOS/iOS/Android/headless），通过 WebSocket 连接 Gateway，声明 `role: node`，提供 canvas、camera、location 等能力。 |

### 7.2 消息与路由层

| 概念                | 定义                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------- |
| **Peer**            | 对话中的对方，`{ kind: "direct"                                                                       | "group" | "channel", id }`。用于 bindings 匹配和 sessionKey 构建。 |
| **DeliveryContext** | 出站路由上下文，`{ channel, to, accountId, threadId? }`。回复按此原路返回到对应通道、账户、会话。     |
| **Bindings**        | 路由规则数组，将 `(channel, accountId, peer, guildId, teamId)` 映射到 `agentId`。                     |
| **Broadcast**       | 广播组：同一 peer 的消息可触发多个 agent 同时处理（parallel/sequential），每个 agent 有独立 session。 |

### 7.3 上下文与记忆层

| 概念           | 定义                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Context**    | 模型单次运行看到的全部内容：系统提示（含 workspace 注入）+ 对话历史 + 工具调用结果。受 context window 限制。 |
| **Memory**     | 持久化记忆，存于 workspace 的 `MEMORY.md` 和 `memory/YYYY-MM-DD.md`。模型通过 memory 工具读写。              |
| **Compaction** | 上下文压缩：当 token 接近上限时，将旧对话摘要为紧凑条目以腾出窗口空间。                                      |

### 7.4 能力与队列层

| 概念           | 定义                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| **Skills**     | 可注入的扩展能力，来源：workspace `skills/`、`~/.openclaw/skills`、bundled。workspace 优先。              |
| **Queue Mode** | 入站消息排队策略：`collect`（合并为一次 followup）、`steer`（注入当前运行）、`followup`（排队下一轮）等。 |
| **Lane**       | 命令队列通道：`main`（主对话）、`cron`、`subagent`、`session:<sessionKey>`。同一 session 的 lane 串行。   |

### 7.5 安全与配对层

| 概念        | 定义                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| **Pairing** | 显式审批：DM pairing（谁可私聊）、Node pairing（哪些设备可连接 Gateway）。 |
| **Sandbox** | 可选隔离：Agent 在容器/沙箱中执行，限制文件访问和工具权限。                |

---

## 附录：概念对照表

### A. 五核心概念

| 概念      | 配置路径                           | 存储位置                      |
| --------- | ---------------------------------- | ----------------------------- |
| Channel   | `channels.<channel>`               | -                             |
| Account   | `channels.<channel>.accounts.<id>` | `credentials/<channel>/<id>/` |
| Agent     | `agents.list[]`                    | `agents/<agentId>/`           |
| Workspace | `agents.list[].workspace`          | 用户指定路径                  |
| Session   | `session.*`                        | `agents/<agentId>/sessions/`  |

### B. 扩展概念速查

| 概念            | 配置/入口                                              |
| --------------- | ------------------------------------------------------ |
| Gateway         | `openclaw gateway`，端口 18789                         |
| Node            | `role: node` 连接，设备配对                            |
| Peer            | bindings `match.peer`，sessionKey 构建                 |
| DeliveryContext | 出站时由 session 的 lastChannel/lastTo 等推导          |
| Broadcast       | `broadcast.<peerId>: [agentIds]`，`broadcast.strategy` |
| Context         | `/context list`、`/context detail` 查看                |
| Memory          | workspace 下 `MEMORY.md`、`memory/`                    |
| Compaction      | `session.reset`、`agents.defaults.compaction`          |
| Skills          | `workspace/skills/`、`~/.openclaw/skills`              |
| Queue           | `messages.queue.mode`、`/queue <mode>`                 |
| Lane            | `CommandLane.Main`、`session:<key>`                    |
| Pairing         | `openclaw pairing list/approve`                        |
| Sandbox         | `agents.list[].sandbox`                                |
