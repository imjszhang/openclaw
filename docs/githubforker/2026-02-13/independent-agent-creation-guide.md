# OpenClaw 独立 Agent 创建指引

> 文档日期：2026-02-13  
> 本文档介绍如何通过 CLI 或 RPC 创建一个完全独立的 Agent，包括前置条件、操作步骤及后续配置。

---

## 目录

1. [概述](#1-概述)
2. [两种创建入口](#2-两种创建入口)
3. [CLI 方式](#3-cli-方式)
4. [RPC 方式](#4-rpc-方式)
5. [创建后需完成的事项](#5-创建后需完成的事项)
6. [推荐操作流程](#6-推荐操作流程)
7. [注意事项](#7-注意事项)
8. [相关文档](#8-相关文档)

---

## 1. 概述

**独立 Agent** 是指 `agents.list` 中的一个完整条目，拥有自己的：

- **Workspace**：AGENTS.md、SOUL.md、TOOLS.md、IDENTITY.md 等文件所在目录
- **agentDir**：认证配置、模型注册等状态目录（默认 `~/.openclaw/agents/<agentId>/agent`）
- **sessions 目录**：会话历史（`~/.openclaw/agents/<agentId>/sessions`）

与**子 Agent**（`sessions_spawn` 创建的后台任务）不同，独立 Agent 是配置层面的新实体，需通过 CLI 或 RPC 创建。

---

## 2. 两种创建入口

| 入口                           | 适用场景                 | 说明                         |
| ------------------------------ | ------------------------ | ---------------------------- |
| **CLI：`openclaw agents add`** | 用户手动创建、脚本自动化 | 支持交互式向导和非交互式     |
| **RPC：`agents.create`**       | Web UI、自动化脚本       | Gateway 暴露的 JSON-RPC 方法 |

> **说明**：`agentId` 由 `name` 规范化得到（如 `"Work Agent"` → `work-agent`）。`main` 为保留 ID，不能创建名为 `main` 的 Agent。

---

## 3. CLI 方式

### 3.1 交互式（向导）

```bash
openclaw agents add [name]
```

- 不带 `--workspace` 时进入向导
- 向导会依次询问：名称、Workspace 目录、是否复制主 Agent 的 auth、是否配置模型、是否配置渠道和 bindings
- 自动完成：写入配置、创建 Workspace、创建 sessions 目录

**示例**：

```bash
# 启动向导，按提示输入
openclaw agents add work

# 或指定名称，进入向导
openclaw agents add "Work Agent"
```

### 3.2 非交互式（脚本/自动化）

```bash
openclaw agents add <name> --workspace <path> [--model <modelId>] [--bind channel:accountId] --non-interactive
```

- **必须**提供 `--workspace`
- 可选：`--model`、`--agent-dir`、`--bind`（可多次）
- 不会创建 auth，需之后单独配置或复制 `auth-profiles.json`

**示例**：

```bash
# 最小创建
openclaw agents add work --workspace ~/.openclaw/workspace-work --non-interactive

# 带模型和 bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work \
  --model anthropic/claude-sonnet-4-5 \
  --bind whatsapp:personal \
  --non-interactive
```

### 3.3 CLI 选项

| 选项                           | 说明                             |
| ------------------------------ | -------------------------------- |
| `--workspace <dir>`            | Workspace 目录（支持 `~` 路径）  |
| `--model <id>`                 | 该 Agent 使用的模型 ID           |
| `--agent-dir <dir>`            | Agent 状态目录（默认自动推导）   |
| `--bind <channel[:accountId]>` | 路由绑定，可重复                 |
| `--non-interactive`            | 禁用交互，必须配合 `--workspace` |
| `--json`                       | 输出 JSON 格式                   |

---

## 4. RPC 方式

**方法名**：`agents.create`

**适用场景**：Web UI、自动化脚本、远程调用 Gateway。

### 4.1 参数

| 参数        | 类型   | 必填 | 说明                       |
| ----------- | ------ | ---- | -------------------------- |
| `name`      | string | ✅   | Agent 名称                 |
| `workspace` | string | ✅   | Workspace 路径（支持 `~`） |
| `emoji`     | string | ❌   | 身份 emoji                 |
| `avatar`    | string | ❌   | 头像路径或 URL             |

### 4.2 与 CLI 的差异

- RPC **不**处理 auth、model、bindings
- 无交互式向导
- 适合 Web UI 或自动化脚本调用

### 4.3 调用示例

通过 Gateway 的 JSON-RPC 接口调用：

```json
{
  "jsonrpc": "2.0",
  "method": "agents.create",
  "params": {
    "name": "Work",
    "workspace": "~/.openclaw/workspace-work",
    "emoji": "💼"
  },
  "id": 1
}
```

### 4.4 返回结果

```json
{
  "ok": true,
  "agentId": "work",
  "name": "Work",
  "workspace": "/home/user/.openclaw/workspace-work"
}
```

---

## 5. 创建后需完成的事项

| 项目                   | 说明                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| **Workspace**          | CLI/RPC 会自动创建，并生成 AGENTS.md、SOUL.md、TOOLS.md、IDENTITY.md 等 |
| **agentDir**           | 默认 `~/.openclaw/agents/<agentId>/agent`，CLI 会创建                   |
| **sessions 目录**      | `~/.openclaw/agents/<agentId>/sessions`，CLI/RPC 都会创建               |
| **auth-profiles.json** | 需单独配置或从主 Agent 复制                                             |
| **model**              | 可在 `agents add` 时用 `--model`，或之后改配置                          |
| **bindings**           | 可在 `agents add` 时用 `--bind`，或之后改配置                           |

### 5.1 配置认证

若创建时未配置 auth，可：

1. **再次运行向导**：`openclaw agents add <id>`，若已存在会提示是否更新
2. **复制主 Agent 的 auth**：将 `~/.openclaw/agents/main/agent/auth-profiles.json` 复制到 `~/.openclaw/agents/<agentId>/agent/`
3. **手动配置**：参考 [model-agent-config-guide.md](../2026-01-31/model-agent-config-guide.md)

### 5.2 配置 bindings

在 `~/.openclaw/openclaw.json` 的 `bindings` 中增加条目，例如：

```json5
{
  bindings: [
    { agentId: "work", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "telegram" } },
  ],
}
```

---

## 6. 推荐操作流程

1. **准备 Workspace 路径**  
   例如：`~/.openclaw/workspace-work`（可不存在，命令会创建）

2. **执行创建**
   - 交互式：`openclaw agents add work`
   - 非交互式：`openclaw agents add work --workspace ~/.openclaw/workspace-work --non-interactive`

3. **配置认证**
   - 在向导中选「Configure model/auth」；或
   - 从主 Agent 复制 `auth-profiles.json` 到新 Agent 的 agentDir

4. **配置 bindings（如需路由）**
   - 在 `~/.openclaw/openclaw.json` 的 `bindings` 中增加；或
   - 在 `agents add` 时用 `--bind whatsapp:personal` 等

5. **验证**
   - `openclaw agents list --bindings` 查看 Agent 和 bindings

---

## 7. 注意事项

- **`main` 保留**：不能创建名为 `main` 的 Agent
- **agentId 规范化**：由 `name` 自动推导（如 `"Work Agent"` → `work-agent`）
- **agentDir 隔离**：每个 Agent 应有独立的 `agentDir`，避免 auth/session 冲突
- **skipBootstrap**：若配置了 `agents.defaults.skipBootstrap`，Workspace 不会自动生成 bootstrap 文件，需自行准备

---

## 8. 相关文档

- [openclaw-core-concepts-qa-and-usage.md](./openclaw-core-concepts-qa-and-usage.md)：子 Agent 与独立 Agent 的区别、Agent 创建限制
- [model-agent-config-guide.md](../2026-01-31/model-agent-config-guide.md)：多 Agent 配置、模型与认证
- [openclaw-core-concepts-pyramid.md](./openclaw-core-concepts-pyramid.md)：五层架构与概念
- 官方文档：[Multi-Agent Routing](https://docs.openclaw.ai/concepts/multi-agent)、[CLI agents](https://docs.openclaw.ai/cli/agents)
