# JS Cursor Agent：Cursor CLI ACP 运行时封装的创建

> 日期：2026-03-18
> 项目：js-cursor-agent
> 类型：架构设计 + 完整实现
> 来源：Cursor Agent 对话
> 位置：`d:\github\My\js-cursor-agent`

---

## 目录

1. [问题起源](#1-问题起源)
2. [分析过程](#2-分析过程)
3. [方向选择](#3-方向选择)
4. [架构设计](#4-架构设计)
5. [技术决策](#5-技术决策)
6. [四阶段实现](#6-四阶段实现)
7. [项目结构](#7-项目结构)
8. [关键代码设计](#8-关键代码设计)
9. [后续演化](#9-后续演化)

---

## 1. 问题起源

起因是希望了解 OpenClaw 项目中 ACP（Agent Client Protocol）相关功能的实现，最终目标是**将 Cursor 的命令行工具与 OpenClaw 的 ACP 系统结合**。

具体来说：Cursor IDE 提供了 `agent acp` 命令行入口，它是一个 ACP Server，通过 stdio 上的 JSON-RPC 2.0（NDJSON）与外部客户端通信。问题是：怎么让 OpenClaw 能驱动这个 Cursor agent？

---

## 2. 分析过程

### 2.1 OpenClaw ACP 系统分析

首先对 OpenClaw 的 ACP 系统做了全面分析，发现它有两种模式：

| 模式            | 说明                                                         | 入口           |
| --------------- | ------------------------------------------------------------ | -------------- |
| **ACP Bridge**  | OpenClaw 自身作为 ACP Server，暴露给外部 IDE 调用            | `openclaw acp` |
| **ACP Runtime** | OpenClaw 驱动外部编码工具（harness agents），作为 ACP 客户端 | `acpx` 插件    |

我们的需求属于第二种——让 OpenClaw 作为客户端，驱动 Cursor agent。

### 2.2 现有 acpx 插件的模式

OpenClaw 已有的 `acpx` 插件是默认的 ACP Runtime 后端，它包装了 `acpx` CLI 来启动各种 harness agent（Codex、Claude、Pi 等）。关键特征：

- **短命令模式**：每次操作 spawn 一个新进程，执行完退出
- 通过 `ACPX_BUILTIN_AGENT_COMMANDS` 字典映射 agent ID 到 CLI 命令

### 2.3 Cursor agent acp 的特殊性

Cursor 的 `agent acp` 有根本不同的进程模型：

- **长驻进程**：启动后保持运行，通过 stdin/stdout 持续通信
- **有状态会话**：同一进程内可以创建多个 session，session 间可切换模式
- **权限交互**：运行时会通过 `session/request_permission` 请求工具使用权限
- **扩展方法**：支持 `cursor/ask_question`、`cursor/create_plan` 等 Cursor 特有方法

这使得简单地往 `acpx` 里加一个 agent command 配置**不可行**——需要一个专门的长驻进程管理方案。

---

## 3. 方向选择

### 方向一：配置进 acpx（放弃）

直接在 acpx 的 agent command 字典里加 Cursor 条目。问题：acpx 是短命令模式，与 Cursor 长驻进程模型不兼容。

### 方向二：独立 OpenClaw 插件（采纳）

创建一个专门的 OpenClaw ACP Runtime 后端插件，实现 `AcpRuntime` 接口，内部管理 Cursor agent 的长驻进程。

### 进一步：多入口架构（最终方案）

参考已有的 `js-knowledge-flomo` 项目模式，不仅做 OpenClaw 插件，而是：

- **一套核心逻辑**（`core/`）零 OpenClaw 依赖
- **三种消费入口**：独立 CLI、MCP Server、OpenClaw 插件

这样项目不绑死 OpenClaw，独立 CLI 和 MCP Server 都能独立使用。项目命名跟随 `js-` 品牌词前缀。

---

## 4. 架构设计

### 4.1 分层架构

```
┌─────────────┐   ┌──────────────┐   ┌──────────────────┐
│  cli/cli.js │   │ mcp-server/  │   │ openclaw-plugin/  │
│  独立 CLI   │   │  MCP Server  │   │  OpenClaw 插件    │
└──────┬──────┘   └──────┬───────┘   └────────┬─────────┘
       │                 │                     │
       └─────────────────┼─────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   core/acp-client   │  高层 ACP 操作
              │     (零外部依赖)    │
              └──────────┬──────────┘
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
  ┌────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐
  │ process  │    │   jsonrpc   │    │   auth    │
  │ manager  │    │  transport  │    │permissions│
  │ (进程池) │    │ (JSON-RPC)  │    │extensions │
  └──────────┘    └─────────────┘    └───────────┘
```

### 4.2 核心设计原则

1. **core/ 层零 OpenClaw 依赖**：可被三种入口共享
2. **OpenClaw 插件层是薄适配器**：仅做 AcpRuntime 接口桥接
3. **长驻进程池**：每个 ACP 会话映射一个 Cursor agent 进程，自动复用、空闲回收
4. **权限自动审批**：非交互式环境下自动处理 Cursor 的工具权限请求

---

## 5. 技术决策

| 决策         | 选择                                   | 理由                                                                                                  |
| ------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **语言**     | 纯 JavaScript (.js / .mjs)             | 与 js-knowledge-flomo 一致，不引入 TypeScript                                                         |
| **依赖**     | `dotenv` + `@modelcontextprotocol/sdk` | core/ 零外部依赖；MCP Server 仅加 SDK                                                                 |
| **JSON-RPC** | 自实现                                 | 不依赖 @agentclientprotocol/sdk，用 readline + JSON.parse 直接实现（参考 Cursor 官方 minimal client） |
| **进程模型** | 长驻进程 + 进程池                      | 与 acpx 短命令模式根本不同，适配 Cursor agent acp                                                     |
| **认证**     | 三种方式                               | --api-key / --auth-token / 依赖 agent login 预认证                                                    |
| **权限策略** | 三档                                   | approve-all / approve-reads / deny-all                                                                |

---

## 6. 四阶段实现

### Phase 1：核心层 + 独立 CLI

实现了 7 个核心模块和完整的 CLI 入口：

| 文件                        | 职责                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `core/config.js`            | 统一配置解析（env > .env > 默认值），8 个配置项                                           |
| `core/jsonrpc.js`           | JSON-RPC 2.0 传输层，管理请求-响应配对、通知分发、服务端请求处理                          |
| `core/process-manager.js`   | Cursor agent 进程池，支持 getOrSpawn/kill/killAll/list，空闲计时回收                      |
| `core/acp-client.js`        | 高层 ACP 操作：createSession / prompt(AsyncGenerator) / cancel / setMode / close / doctor |
| `core/auth.js`              | 认证参数解析 + `agent --version` 状态检测                                                 |
| `core/permissions.js`       | 三种权限自动审批策略，处理 `session/request_permission`                                   |
| `core/cursor-extensions.js` | Cursor 扩展方法基础处理（ask_question/create_plan/update_todos 等）                       |
| `cli/cli.js`                | 8 个命令的完整 CLI，手写 arg parser + switch 分发                                         |
| `cli/lib/formatters.js`     | stdout/stderr 输出工具                                                                    |

验证：全部语法检查通过，`node cli/cli.js help` 正常输出。

### Phase 2：MCP Server

| 文件                                | 职责                                                            |
| ----------------------------------- | --------------------------------------------------------------- |
| `mcp-server/index.mjs`              | stdio + HTTP (`--http --port`) 双模式入口                       |
| `mcp-server/tools/session-tools.js` | cursor_session_new / cursor_session_list / cursor_session_close |
| `mcp-server/tools/prompt-tools.js`  | cursor_prompt / cursor_cancel                                   |
| `mcp-server/tools/config-tools.js`  | cursor_set_mode / cursor_doctor                                 |

共 6 个 MCP 工具，其他 IDE（Claude Desktop 等）可通过 MCP 配置调用。

### Phase 3：OpenClaw 插件

| 文件                                           | 职责                                                 |
| ---------------------------------------------- | ---------------------------------------------------- |
| `openclaw-plugin/openclaw.plugin.json`         | 插件清单 + configSchema + uiHints                    |
| `openclaw-plugin/index.mjs`                    | CursorRuntime 类实现 AcpRuntime 接口 + register 入口 |
| `openclaw-plugin/skills/cursor-agent/SKILL.md` | OpenClaw 技能文档                                    |

CursorRuntime 实现的 AcpRuntime 接口方法：

```
ensureSession(input) → client.createSession → AcpRuntimeHandle
runTurn(input)       → client.prompt (AsyncGenerator) → AcpRuntimeEvent yield
cancel(input)        → client.cancel
close(input)         → client.close
setMode(input)       → client.setMode
doctor()             → client.doctor → AcpRuntimeDoctorReport
getCapabilities()    → { controls: ["session/set_mode"] }
getStatus(input)     → session alive/dead 状态
```

同时注册了 CLI 子命令（`openclaw cursor doctor/sessions`）和诊断工具（`cursor_doctor`）。

### Phase 4：Web UI + 文档

- `src/index.html`：暗色主题状态面板，实时显示 Health / Active Sessions / Configuration
- `SKILL.md`：项目顶层使用文档
- `README.md`：完整项目文档

---

## 7. 项目结构

```
js-cursor-agent/                      (24 文件)
├── package.json                      # 项目配置
├── .env.example                      # 环境变量模板
├── .gitignore
├── README.md                         # 完整项目文档
├── SKILL.md                          # 使用/排错文档
├── core/                             # 核心层（零外部依赖）
│   ├── config.js                     # 统一配置解析
│   ├── jsonrpc.js                    # JSON-RPC 2.0 传输层
│   ├── process-manager.js            # Cursor agent 进程池
│   ├── acp-client.js                 # 高层 ACP 操作封装
│   ├── auth.js                       # 认证管理
│   ├── permissions.js                # 权限审批策略
│   └── cursor-extensions.js          # Cursor 扩展方法
├── cli/                              # 独立 CLI
│   ├── cli.js                        # 8 个命令的完整入口
│   └── lib/
│       └── formatters.js             # 输出工具
├── mcp-server/                       # MCP Server
│   ├── index.mjs                     # stdio + HTTP 双模式
│   └── tools/
│       ├── session-tools.js          # 会话管理（3 个工具）
│       ├── prompt-tools.js           # Prompt 交互（2 个工具）
│       └── config-tools.js           # 配置诊断（2 个工具）
├── openclaw-plugin/                  # OpenClaw 插件
│   ├── package.json
│   ├── openclaw.plugin.json          # 插件清单 + configSchema
│   ├── index.mjs                     # CursorRuntime + register
│   └── skills/
│       └── cursor-agent/
│           └── SKILL.md
└── src/
    └── index.html                    # Web 状态面板
```

---

## 8. 关键代码设计

### 8.1 JsonRpcTransport — 双向通信复用器

核心的传输层，管理 child process stdin/stdout 上的 JSON-RPC 2.0 通信：

- **出站请求**：自增 id + pending Map + timeout，`send(method, params)` 返回 Promise
- **入站响应**：按 id 匹配 pending entry，resolve/reject
- **服务端请求**：Cursor 发来的带 id 的 method 调用（如权限请求），通过 `onRequest` 注册 handler 自动 respond
- **通知**：无 id 的单向消息（如 `session/update` 流式事件），通过 `onNotification` 注册多个 handler

### 8.2 ProcessManager — 长驻进程池

与 acpx 短命令模式的根本区别：

```
acpx 模式：    spawn → 执行 → exit    (每次操作新进程)
cursor 模式：  spawn → 保持运行 → 复用 → 空闲回收  (长驻进程池)
```

关键特性：

- 按 sessionKey 查找/复用已有进程
- maxConcurrent 并发限制（默认 4），超出时驱逐最老的
- 每分钟扫描一次空闲进程（idleTtlMinutes 默认 30 分钟）
- 进程退出/崩溃自动清理 Map
- spawn 时自动注入 auth 参数、权限 handler、Cursor 扩展方法 handler

### 8.3 CursorAcpClient.prompt() — AsyncGenerator 流式输出

prompt 方法设计为 AsyncGenerator，在等待 Cursor 响应的同时 yield 流式事件：

1. 注册 `session/update` notification handler，将更新推入队列
2. 发送 `session/prompt` 请求（阻塞等待完成）
3. 期间从队列中 yield 事件（text_delta / tool_call / status）
4. prompt 响应返回后 yield `{ type: "done" }`
5. 支持 AbortSignal 取消

### 8.4 CursorRuntime — OpenClaw AcpRuntime 薄适配器

整个 OpenClaw 插件的核心只是一个接口桥接类：

- `ensureSession` → `client.createSession` → 包装为 `AcpRuntimeHandle`
- `runTurn` → `client.prompt` → 翻译 event 类型到 `AcpRuntimeEvent` 格式
- `cancel/close/setMode/doctor` → 直接委托

不包含任何业务逻辑，所有智能都在 core/ 层。

---

## 9. 后续演化

### 近期可改进

1. **Cursor 扩展方法丰富化**：`cursor/ask_question` 可转发到 OpenClaw 聊天让用户选择
2. **HTTP 状态 API**：Web 面板目前需要 `/api/status` 端点，可在 MCP Server HTTP 模式中提供
3. **多进程会话复用**：当前一个 session 对应一个进程，可优化为同进程内多 session

### 长期方向

1. **与 acpx 共存**：用户可同时配置 acpx + cursor 两个 ACP Runtime 后端
2. **权限策略细化**：按工具名称/路径设置细粒度权限规则
3. **会话持久化**：session binding 到 OpenClaw channel/thread，实现跨重启恢复
4. **npm 发布**：作为 `@imjszhang/js-cursor-agent` 发布到 npm

---

## 总结

js-cursor-agent 的核心价值在于**解决了 Cursor agent acp 长驻进程模型与 OpenClaw ACP Runtime 之间的适配问题**。通过分层架构（core → CLI / MCP / OpenClaw plugin），它既是一个独立可用的 Cursor agent 封装工具，也是 OpenClaw 的 ACP Runtime 后端——这使得用户可以在 OpenClaw 聊天中通过 `/acp spawn cursor` 直接驱动 Cursor IDE 进行代码操作。
