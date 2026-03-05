# OpenClaw 权限配置完全指南

> 文档日期：2026-03-05
>
> 版本：`2026.3.3`
>
> 覆盖范围：exec 执行权限、工具可见性（allow/deny）、子代理权限继承、快速最大权限配置

---

## 目录

1. [为什么权限系统这么复杂](#1-为什么权限系统这么复杂)
2. [两层权限系统总览](#2-两层权限系统总览)
3. [Exec 执行权限详解](#3-exec-执行权限详解)
   - [三个核心参数](#三个核心参数)
   - [配置文件双轨制](#配置文件双轨制)
   - [优先级链与 minSecurity 陷阱](#优先级链与-minsecurity-陷阱)
   - [子代理的 exec 权限问题](#子代理的-exec-权限问题)
4. [工具可见性（allow/deny）详解](#4-工具可见性-allowdeny-详解)
   - [工具名完整列表](#工具名完整列表)
   - [工具组（group:）](#工具组-group)
   - [Profile 系统](#profile-系统)
   - [allow / alsoAllow / deny 优先级](#allow--alsoallow--deny-优先级)
   - [子代理工具限制](#子代理工具限制)
5. [配置示例：本地最大权限（快速上手）](#5-配置示例本地最大权限快速上手)
6. [配置示例：生产安全模式](#6-配置示例生产安全模式)
7. [常见问题排查](#7-常见问题排查)
   - [AI 说"没有 exec 工具"](#-ai-说没有-exec-工具或exec-工具不可用)
   - [子代理无法执行命令](#-子代理无法执行命令exec-denied)
   - [配置了 full 但还是被审批](#-配置了-securityfull-但命令还是被审批)
   - [allowlist 模式链式命令被拒](#-allowlist-模式下链式命令-被拒绝)
   - [Windows 上 `&&` 报错](#-windows-上--命令报错)
   - [Windows 上 safeBins 不生效](#-windows-上-safebins-不生效)
8. [配置字段速查表](#8-配置字段速查表)

---

## 1. 为什么权限系统这么复杂

OpenClaw 的权限系统分两个完全独立的维度：

| 维度              | 控制什么                                    | 配置在哪                                                           |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| **工具可见性**    | AI 能"看到"哪些工具，能调用哪些工具名       | `openclaw.json` → `tools.allow/deny`                               |
| **exec 执行权限** | AI 调用 exec 工具时，哪些命令实际被允许运行 | `openclaw.json` → `tools.exec` + `~/.openclaw/exec-approvals.json` |

两个维度**各自独立**，必须同时配置正确。经实测最常见的三个陷阱：

1. **`tools.allow` 里没有 `group:fs` 和 `group:runtime`**：`group:openclaw` 不含 `exec`/`read`/`write`/`edit`，漏加这两个组 AI 就"看不到"这些工具，直接说"没有 exec 工具"
2. **`exec-approvals.json` 的 `defaults` 留空 `{}`**：子代理 fallback 到硬编码默认 `security="deny"`，`minSecurity("full", "deny") = "deny"`，子代理一律无法执行命令
3. **只配了 `tools.exec.security=full`，忘了同步 `exec-approvals.json`**：AI "看到"了 exec 工具，但运行时被 exec-approvals 拒绝

---

## 2. 两层权限系统总览

```
用户消息 → Agent 决定调用 exec 工具
               │
               ▼
     ┌─── 层 1：工具可见性 ───┐
     │  AI 能调用 exec 吗？   │  ← openclaw.json tools.allow/deny
     │  (exec 在 allow 列表?) │
     └────────────────────────┘
               │ 是
               ▼
     ┌─── 层 2：exec 执行权限 ──────────────────────────────┐
     │  这条命令被允许执行吗？                               │
     │                                                       │
     │  resolveExecConfig()                                  │
     │    openclaw.json agents[id].tools.exec                │
     │    ?? openclaw.json tools.exec          → overrides   │
     │                   ↓                                   │
     │  resolveExecApprovals(agentId, overrides)             │
     │    exec-approvals.json agents[agentId]                │
     │    ?? agents["*"]                                     │
     │    ?? defaults                          → agent cfg   │
     │                   ↓                                   │
     │  hostSecurity = minSecurity(overrides, agent cfg)     │
     │  hostAsk      = maxAsk(overrides, agent cfg)          │
     │                   ↓                                   │
     │  deny → 抛出异常  /  full → 直接执行                  │
     │  allowlist → 检查 allowlist + safeBins                │
     └───────────────────────────────────────────────────────┘
```

---

## 3. Exec 执行权限详解

### 三个核心参数

#### `host` — 在哪里运行

| 值          | 说明                                   | 默认    |
| ----------- | -------------------------------------- | ------- |
| `"sandbox"` | Docker 沙箱中隔离运行                  | ✅ 默认 |
| `"gateway"` | Gateway 主机直接运行（本地部署常用）   | —       |
| `"node"`    | 远程 node 节点运行（需配 `exec.node`） | —       |

本地部署几乎总是用 `"gateway"`。

#### `security` — 安全级别

| 值            | 说明                                  | 默认              |
| ------------- | ------------------------------------- | ----------------- |
| `"deny"`      | 拒绝所有执行请求                      | ✅ **硬编码默认** |
| `"allowlist"` | 仅允许 allowlist 或 safeBins 中的命令 | —                 |
| `"full"`      | 允许所有命令，无任何过滤              | —                 |

**注意**：`"deny"` 是硬编码默认，不配置就是拒绝一切。

#### `ask` — 审批请求模式

| 值          | 说明                                     | 默认              |
| ----------- | ---------------------------------------- | ----------------- |
| `"on-miss"` | allowlist 模式下命令未命中时弹出审批请求 | ✅ **硬编码默认** |
| `"always"`  | 每次执行都请求审批                       | —                 |
| `"off"`     | 从不弹审批，直接执行或拒绝               | —                 |

---

### 配置文件双轨制

Exec 权限由**两个文件**共同决定，缺一不可：

#### 文件 1：`~/.openclaw/openclaw.json`（意图配置）

```json
{
  "tools": {
    "exec": {
      "host": "gateway",
      "security": "full",
      "ask": "off"
    }
  }
}
```

这是"声明我想要什么权限"。

#### 文件 2：`~/.openclaw/exec-approvals.json`（运行时审批配置）

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "<gateway 自动生成>"
  },
  "defaults": {
    "security": "full",
    "ask": "off"
  },
  "agents": {}
}
```

这是"运行时生效的权限上限"。**必须与 openclaw.json 保持一致**，否则 `minSecurity()` 会取两者中较严格的值。

---

### 优先级链与 minSecurity 陷阱

完整优先级链（从高到低）：

```
agents.list[id].tools.exec.*     ← per-agent 配置（最高优先级）
    ↓ fallback
tools.exec.*                     ← 全局配置（作为 overrides 传入）
    ↓ 与下面取 minSecurity/maxAsk
exec-approvals.json agents[id]   ← 该 agentId 的动态配置
    ↓ fallback
exec-approvals.json agents["*"]  ← 通配符配置（所有 agent 都受影响）
    ↓ fallback
exec-approvals.json defaults     ← 文件级全局默认
    ↓ fallback
硬编码默认：security="deny", ask="on-miss"
```

**关键机制：`minSecurity` 和 `maxAsk`**

```typescript
// 最终生效的 security 取两者中"更严格"的
hostSecurity = minSecurity(openclaw_json_security, exec_approvals_security);
// deny < allowlist < full

// 最终生效的 ask 取两者中"问得更多"的
hostAsk = maxAsk(openclaw_json_ask, exec_approvals_ask);
// off < on-miss < always
```

**典型陷阱示例：**

| openclaw.json | exec-approvals.json defaults | 最终生效    | 结果              |
| ------------- | ---------------------------- | ----------- | ----------------- |
| `full`        | `{}` (空)                    | `deny`      | ❌ 全部被拒绝     |
| `full`        | `full`                       | `full`      | ✅ 正常           |
| `full`        | `allowlist`                  | `allowlist` | ⚠️ 需要 allowlist |
| `allowlist`   | `full`                       | `allowlist` | ⚠️ 需要 allowlist |
| `off` (ask)   | `always` (ask)               | `always`    | ⚠️ 每次都审批     |

---

### 子代理的 exec 权限问题

**这是最常见的踩坑点。**

子代理（subagent）的 agentId 格式为 `agent:<id>:subagent:<uuid>`，在 `exec-approvals.json` 的 `agents` 里没有对应记录，因此 fallback 到 `defaults`。

**如果 `defaults` 是空对象 `{}`：**

```
defaults 空 → 使用硬编码默认 security="deny"
minSecurity("full", "deny") = "deny"
→ 子代理的所有 exec 请求被拒绝
```

**修复方法**：在 `exec-approvals.json` 的 `defaults` 中明确设置权限：

```json
{
  "defaults": {
    "security": "full",
    "ask": "off"
  }
}
```

或者用通配符给所有 agent（包括子代理）统一配置：

```json
{
  "agents": {
    "*": {
      "security": "full",
      "ask": "off"
    }
  }
}
```

---

### safeBins 机制（allowlist 模式的补充）

在 `security=allowlist` 模式下，以下工具无需 allowlist 条目即可执行（仅限 stdin 管道用法，不支持文件路径参数）：

**内置 safeBins（默认）：** `jq`, `cut`, `uniq`, `head`, `tail`, `tr`, `wc`

```json
{
  "tools": {
    "exec": {
      "security": "allowlist",
      "safeBins": ["jq", "cut", "uniq", "head", "tail", "tr", "wc"],
      "safeBinTrustedDirs": ["/usr/local/bin", "/opt/homebrew/bin"]
    }
  }
}
```

**限制**：仅限系统目录（`/bin`, `/usr/bin`）中的二进制默认受信任。自定义路径需通过 `safeBinTrustedDirs` 显式添加。

**Windows 注意**：safeBins 在 Windows 上始终不生效（PowerShell 解析规则不同）。

---

## 4. 工具可见性（allow/deny）详解

### 工具名完整列表

| 工具名             | 分组               | 说明                            |
| ------------------ | ------------------ | ------------------------------- |
| `read`             | `group:fs`         | 读取文件内容                    |
| `write`            | `group:fs`         | 创建/覆盖文件                   |
| `edit`             | `group:fs`         | 精确编辑文件                    |
| `apply_patch`      | `group:fs`         | 补丁式文件修改（OpenAI 模型用） |
| `exec`             | `group:runtime`    | 运行 shell 命令                 |
| `process`          | `group:runtime`    | 管理后台进程                    |
| `web_search`       | `group:web`        | 网页搜索                        |
| `web_fetch`        | `group:web`        | 抓取网页内容                    |
| `memory_search`    | `group:memory`     | 语义搜索记忆库                  |
| `memory_get`       | `group:memory`     | 读取记忆文件                    |
| `sessions_list`    | `group:sessions`   | 列出会话                        |
| `sessions_history` | `group:sessions`   | 查看会话历史                    |
| `sessions_send`    | `group:sessions`   | 发送消息到会话                  |
| `sessions_spawn`   | `group:sessions`   | 创建子 agent                    |
| `subagents`        | `group:sessions`   | 管理子 agent                    |
| `session_status`   | `group:sessions`   | 会话状态                        |
| `browser`          | `group:ui`         | 浏览器控制                      |
| `canvas`           | `group:ui`         | Canvas 控制                     |
| `message`          | `group:messaging`  | 发送消息                        |
| `cron`             | `group:automation` | 定时任务                        |
| `gateway`          | `group:automation` | 网关控制                        |
| `nodes`            | `group:nodes`      | 节点/设备管理                   |
| `agents_list`      | `group:agents`     | 列出 agent                      |
| `image`            | `group:media`      | 图像理解                        |
| `tts`              | `group:media`      | 文字转语音                      |

别名：`bash` = `exec`，`apply-patch` = `apply_patch`（配置中可互换）。

---

### 工具组（group:）

| 组名               | 包含工具                                                                                                                                                          | 说明                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `group:openclaw`   | web*search, web_fetch, memory_search, memory_get, sessions*\*, subagents, session_status, browser, canvas, message, cron, gateway, nodes, agents_list, image, tts | OpenClaw 特有工具。**⚠️ 不含 read/write/edit/exec**，文件和执行类工具需单独加 |
| `group:fs`         | read, write, edit, apply_patch                                                                                                                                    | 文件系统工具（读写编辑文件）                                                  |
| `group:runtime`    | exec, process                                                                                                                                                     | 执行时工具（运行命令、管理后台进程）                                          |
| `group:web`        | web_search, web_fetch                                                                                                                                             | 网络工具                                                                      |
| `group:memory`     | memory_search, memory_get                                                                                                                                         | 记忆工具                                                                      |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, subagents, session_status                                                                         | 会话工具                                                                      |
| `group:ui`         | browser, canvas                                                                                                                                                   | UI 工具                                                                       |
| `group:messaging`  | message                                                                                                                                                           | 消息工具                                                                      |
| `group:automation` | cron, gateway                                                                                                                                                     | 自动化工具                                                                    |
| `group:media`      | image, tts                                                                                                                                                        | 媒体工具                                                                      |
| `group:plugins`    | （动态，所有已加载插件工具）                                                                                                                                      | 插件工具                                                                      |

> **最常用的完整组合（覆盖所有常用功能）：**
>
> ```json
> "allow": ["group:openclaw", "group:plugins", "group:fs", "group:runtime"]
> ```

---

### Profile 系统

| Profile       | 包含工具                                                                                                                      | 适用场景                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `"minimal"`   | session_status                                                                                                                | 最小化，几乎什么都不能做 |
| `"coding"`    | read, write, edit, apply*patch, exec, process, memory_search, memory_get, sessions*\*, subagents, session_status, cron, image | 完整编码助手             |
| `"messaging"` | sessions_list, sessions_history, sessions_send, session_status, message                                                       | 纯消息类场景             |
| `"full"`      | **无限制**（空策略，等同于不过滤）                                                                                            | 完全放行                 |

使用方式：

```json
{
  "tools": {
    "profile": "coding"
  }
}
```

---

### allow / alsoAllow / deny 优先级

**过滤逻辑（按顺序）：**

```
1. deny 检查（优先级最高）
   → 命中 deny → 拒绝（无论 allow 怎么说）

2. allow 为空？
   → 是 → 允许（allow 为空 = 不限制）

3. allow 检查
   → 命中 allow → 允许
   → 未命中 → 拒绝

特殊规则：allow 包含 "exec" 时，apply_patch 自动被允许
```

**alsoAllow vs allow 的区别：**

- `allow`：**白名单模式**，只有列表中的工具通过，其余全被拒绝
- `alsoAllow`：**追加模式**，在现有 allow 基础上追加，不替换原有 allow

```json
// ❌ 错误用法：只想多开放一个工具，却覆盖了所有工具
"allow": ["group:openclaw", "group:plugins", "exec"]

// ✅ 正确用法：基础配置 + 追加 exec
"allow": ["group:openclaw", "group:plugins"],
"alsoAllow": ["exec", "read", "write", "edit"]
```

**Pipeline 执行顺序（多层叠加，每层都会收窄）：**

```
全局 profile → 全局 byProvider.profile
→ 全局 allow/deny → 全局 byProvider.allow/deny
→ per-agent allow/deny → per-agent byProvider.allow/deny
→ 群组策略 → sandbox 策略 → subagent 策略
```

每一步都在上一步的结果上继续过滤，**最严格的规则最终胜出**。

---

### 子代理工具限制

子代理有**固定的工具 deny 列表**，无论如何配置都生效：

#### 所有子代理始终被禁（`SUBAGENT_TOOL_DENY_ALWAYS`）

| 工具             | 原因                                         |
| ---------------- | -------------------------------------------- |
| `gateway`        | 系统级管理，子代理不应操作                   |
| `agents_list`    | 同上                                         |
| `whatsapp_login` | 交互式设置，非任务场景                       |
| `session_status` | 应由主 agent 协调                            |
| `cron`           | 调度控制应在主 agent                         |
| `memory_search`  | 记忆由主 agent 在 prompt 中传递              |
| `memory_get`     | 同上                                         |
| `sessions_send`  | 子代理通过 announce chain 通信，不直接发消息 |

#### 叶子子代理额外被禁（depth >= maxSpawnDepth）

| 工具               | 原因                 |
| ------------------ | -------------------- |
| `sessions_list`    | 叶子无需管理会话     |
| `sessions_history` | 同上                 |
| `sessions_spawn`   | 叶子不能再派生子代理 |

**豁免**：可以通过 `tools.subagents.tools.alsoAllow` 解除部分限制（如允许子代理调用 `sessions_send`）。

---

## 5. 配置示例：本地最大权限（快速上手）

> **适用场景**：本地个人部署，信任所有用户，不需要审批机制，追求零阻力使用体验。
>
> **⚠️ 安全提示**：仅适用于本地单人使用。多用户或暴露公网环境请使用安全模式。

### `~/.openclaw/openclaw.json` 关键段

> **`group:openclaw` 不含 `exec`/`read`/`write`/`edit`。** 必须显式加 `group:fs`（文件工具）和 `group:runtime`（exec 工具），否则 AI 会直接说"没有 exec 工具"。

```json
{
  "tools": {
    "allow": ["group:openclaw", "group:plugins", "group:fs", "group:runtime"],
    "exec": {
      "host": "gateway",
      "security": "full",
      "ask": "off"
    },
    "elevated": {
      "enabled": true,
      "allowFrom": { "*": ["*"] }
    },
    "agentToAgent": {
      "enabled": true,
      "allow": ["*"]
    },
    "sessions": {
      "visibility": "all"
    },
    "fs": {
      "workspaceOnly": false
    }
  }
}
```

### `~/.openclaw/exec-approvals.json`（必须同步配置！）

> **`socket.path` 和 `token` 不要手动修改**，保留 gateway 首次启动时自动生成的值。只需确保 `defaults` 段正确。

**Linux / macOS：**

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "<保留现有 token，不要修改>"
  },
  "defaults": {
    "security": "full",
    "ask": "off"
  },
  "agents": {}
}
```

**Windows（路径格式不同）：**

```json
{
  "version": 1,
  "socket": {
    "path": "C:\\Users\\YourName\\.openclaw\\exec-approvals.sock",
    "token": "<保留现有 token，不要修改>"
  },
  "defaults": {
    "security": "full",
    "ask": "off"
  },
  "agents": {}
}
```

**这两个文件必须同时配置**，缺一不可：

- `openclaw.json` 的 `tools.allow` 决定 AI 能"看到"哪些工具
- `openclaw.json` 的 `tools.exec` 声明想要的执行权限
- `exec-approvals.json` 的 `defaults` 是运行时权限上限，留空则子代理无法执行任何命令

### 验证配置正确

```bash
# 1. 检查全局 exec 配置
openclaw config get tools.exec
# 预期：{ "host": "gateway", "security": "full", "ask": "off" }

# 2. 检查工具可见性（allow 列表）
openclaw config get tools.allow
# 预期包含：group:openclaw, group:plugins, group:fs, group:runtime

# 3. 实测 exec 工具是否可用（embedded 模式快速验证）
openclaw agent --agent main --message "用exec工具运行：echo TEST_OK"
# 预期：AI 调用 exec，输出 TEST_OK

# 4. 实测子代理 exec 权限
openclaw agent --agent main --message "spawn一个子代理，让它用exec工具运行：echo SUBAGENT_OK"
# 预期：子代理成功执行并返回结果
```

---

## 6. 配置示例：生产安全模式

> **适用场景**：多用户环境，或有公网访问，需要审批机制控制命令执行。

### `~/.openclaw/openclaw.json` 关键段

```json
{
  "tools": {
    "allow": ["group:openclaw", "group:plugins", "read", "write", "edit"],
    "exec": {
      "host": "gateway",
      "security": "allowlist",
      "ask": "on-miss",
      "safeBins": ["jq", "cut", "uniq", "head", "tail", "tr", "wc"],
      "safeBinTrustedDirs": ["/usr/local/bin"],
      "backgroundMs": 10000,
      "timeoutSec": 300,
      "notifyOnExit": true
    },
    "elevated": {
      "enabled": true,
      "allowFrom": {
        "feishu": ["ou_your_user_id"]
      }
    }
  }
}
```

### `~/.openclaw/exec-approvals.json`

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "<保留现有 token>"
  },
  "defaults": {
    "security": "allowlist",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [
        { "id": "uuid-1", "pattern": "/usr/bin/git" },
        { "id": "uuid-2", "pattern": "/usr/local/bin/node" },
        { "id": "uuid-3", "pattern": "/usr/local/bin/npm" },
        { "id": "uuid-4", "pattern": "/usr/bin/python3" },
        { "id": "uuid-5", "pattern": "/usr/bin/make" },
        { "id": "uuid-6", "pattern": "/bin/ls" },
        { "id": "uuid-7", "pattern": "/bin/cat" },
        { "id": "uuid-8", "pattern": "/opt/**/node" }
      ]
    }
  }
}
```

---

## 7. 常见问题排查

### ❌ AI 说"没有 exec 工具"或"exec 工具不可用"

**症状**：AI 直接回复说没有执行命令的工具，不尝试调用 exec。

**原因**：`tools.allow` 里没有包含 `exec`（或 `group:runtime`）。`group:openclaw` **不包含** exec、read、write、edit，这四类工具需要单独加。

**修复**：在 `tools.allow` 里加 `group:fs` 和 `group:runtime`：

```json
{
  "tools": {
    "allow": ["group:openclaw", "group:plugins", "group:fs", "group:runtime"]
  }
}
```

---

### ❌ 子代理无法执行命令（exec denied）

**症状**：主 agent 能执行命令，子代理全部报 `exec denied`。

**原因**：`exec-approvals.json` 的 `defaults` 为空 `{}`，子代理 fallback 到硬编码默认 `security="deny"`，`minSecurity("full", "deny")` = `"deny"`。

**修复**：

```json
{
  "defaults": {
    "security": "full",
    "ask": "off"
  }
}
```

---

### ❌ 配置了 `security=full` 但命令还是被审批

**原因**：`exec-approvals.json` 中 `agents["main"].ask` 是 `"always"`，`maxAsk("off", "always")` = `"always"`。

**修复**：检查 `exec-approvals.json` 中是否有 agent 级别的 `ask` 配置覆盖了全局设置。

---

### ❌ allowlist 模式下链式命令（`&&`）被拒绝

**原因**：链式命令的每个命令段都需要独立命中 allowlist。`git status && ls` 需要 `git` 和 `ls` 都在 allowlist 中。

**修复**：在 allowlist 中添加所有命令，或切换到 `security=full`。

---

### ❌ Windows 上 `&&` 命令报错

**症状**：AI 尝试用 `cmd1 && cmd2` 的方式执行，PowerShell 报语法错误。

**原因**：Windows 默认 shell 是 PowerShell，不支持 `&&` 链式语法（PowerShell 用 `;` 或 `-and`）。

**修复**：不需要修改配置，提示 AI 用 PowerShell 兼容语法，或在 `tools.exec` 中指定 Git Bash：

```json
{
  "tools": {
    "exec": {
      "shell": "C:\\Program Files\\Git\\bin\\bash.exe",
      "shellArgs": ["-c"]
    }
  }
}
```

---

### ❌ Windows 上 safeBins 不生效

**原因**：safeBins 仅在非 Windows 平台上有效，PowerShell 的命令解析规则与 Unix shell 不同。

**修复**：Windows 上用 allowlist 模式需要在 allowlist 中明确列出每个命令路径（如 `C:\Windows\System32\git.exe`），或直接用 `security=full`。

---

## 8. 配置字段速查表

### `tools.exec`（openclaw.json）

| 字段                       | 类型                           | 默认                                                | 说明                                     |
| -------------------------- | ------------------------------ | --------------------------------------------------- | ---------------------------------------- |
| `host`                     | `"sandbox"｜"gateway"｜"node"` | `"sandbox"`                                         | 执行宿主                                 |
| `security`                 | `"deny"｜"allowlist"｜"full"`  | （由 exec-approvals.json 决定，硬编码 `"deny"`）    | 安全级别                                 |
| `ask`                      | `"off"｜"on-miss"｜"always"`   | （由 exec-approvals.json 决定，硬编码 `"on-miss"`） | 审批模式                                 |
| `node`                     | string                         | —                                                   | host=node 时的节点 ID                    |
| `shell`                    | string                         | Windows: PowerShell, Unix: $SHELL                   | 自定义 shell 路径                        |
| `shellArgs`                | string[]                       | 自动检测                                            | 自定义 shell 参数                        |
| `pathPrepend`              | string[]                       | —                                                   | 追加到 PATH 前面的目录                   |
| `safeBins`                 | string[]                       | `["jq","cut","uniq","head","tail","tr","wc"]`       | allowlist 模式下免审批的安全工具         |
| `safeBinTrustedDirs`       | string[]                       | `["/bin","/usr/bin"]`                               | safeBins 受信任的目录                    |
| `backgroundMs`             | number                         | —                                                   | 命令自动转后台的超时（ms）               |
| `timeoutSec`               | number                         | —                                                   | 命令自动 kill 的超时（秒）               |
| `notifyOnExit`             | boolean                        | `false`                                             | 后台命令结束时发送通知                   |
| `notifyOnExitEmptySuccess` | boolean                        | `false`                                             | 后台命令无输出成功时也通知               |
| `approvalRunningNoticeMs`  | number                         | `10000`                                             | 等待审批中命令运行超过此时长发通知（ms） |
| `cleanupMs`                | number                         | —                                                   | 已完成会话在内存中保留时长（ms）         |

### `exec-approvals.json` `defaults` 段

| 字段              | 类型                          | 默认        | 说明                                |
| ----------------- | ----------------------------- | ----------- | ----------------------------------- |
| `security`        | `"deny"｜"allowlist"｜"full"` | `"deny"`    | 所有 agent 的 security 上限         |
| `ask`             | `"off"｜"on-miss"｜"always"`  | `"on-miss"` | 所有 agent 的审批模式下限           |
| `askFallback`     | `"deny"｜"allowlist"｜"full"` | `"deny"`    | 审批超时/拒绝后的 fallback 安全级别 |
| `autoAllowSkills` | boolean                       | `false`     | 是否自动信任 skill 二进制           |

### `tools`（openclaw.json 工具可见性）

| 字段                        | 说明                                                  |
| --------------------------- | ----------------------------------------------------- |
| `allow`                     | 白名单，只有列表中的工具可见                          |
| `alsoAllow`                 | 追加白名单，不替换现有 allow                          |
| `deny`                      | 黑名单，优先于 allow                                  |
| `profile`                   | 预设 profile：`minimal/coding/messaging/full`         |
| `subagents.tools.allow`     | 子代理工具白名单                                      |
| `subagents.tools.deny`      | 子代理工具额外黑名单                                  |
| `subagents.tools.alsoAllow` | 子代理工具追加白名单（可解除 DENY_ALWAYS 中部分限制） |

---

_文档基于 OpenClaw `2026.3.3` 源码分析 + 实机测试生成（2026-03-05）。代码路径：`src/infra/exec-approvals.ts`、`src/agents/bash-tools.exec-host-shared.ts`、`src/agents/pi-tools.ts`、`src/agents/pi-tools.policy.ts`、`src/config/types.tools.ts`、`src/agents/tool-catalog.ts`。实测验证：主 agent exec ✅、子代理 exec ✅、Windows PowerShell 兼容 ✅。_
