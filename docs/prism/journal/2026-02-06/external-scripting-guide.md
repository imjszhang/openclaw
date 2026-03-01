# OpenClaw 外部脚本调用接口指引

本文档梳理了 OpenClaw 暴露给外部脚本/程序的所有消息与 AI 调用接口。
目标：让你能像 cron 系统那样，从任意脚本触发 AI agent 运行、发送消息、调用工具。

---

## 目录

1. [接口总览](#接口总览)
2. [CLI 命令行接口](#cli-命令行接口)
   - [openclaw agent](#openclaw-agent)
   - [openclaw message send](#openclaw-message-send)
   - [openclaw cron](#openclaw-cron)
3. [HTTP API 接口](#http-api-接口)
   - [Webhooks (/hooks/\*)](#webhooks)
   - [OpenAI 兼容接口 (/v1/chat/completions)](#openai-兼容接口)
   - [OpenResponses 接口 (/v1/responses)](#openresponses-接口)
   - [Tools Invoke (/tools/invoke)](#tools-invoke)
4. [Gateway WebSocket RPC](#gateway-websocket-rpc)
5. [认证方式](#认证方式)
6. [Cron 系统内部原理（参考）](#cron-系统内部原理)
7. [实战示例](#实战示例)

---

## 接口总览

| 接口                        | 类型 | 路径/命令    | 认证         | 适用场景               |
| --------------------------- | ---- | ------------ | ------------ | ---------------------- |
| `openclaw agent`            | CLI  | 命令行       | 无需（本地） | 脚本触发 AI agent 运行 |
| `openclaw message send`     | CLI  | 命令行       | 无需（本地） | 脚本发送消息到频道     |
| `openclaw cron`             | CLI  | 命令行       | 无需（本地） | 管理定时任务           |
| `POST /hooks/wake`          | HTTP | Gateway 端口 | Hook token   | 唤醒主会话心跳         |
| `POST /hooks/agent`         | HTTP | Gateway 端口 | Hook token   | 触发隔离 agent 运行    |
| `POST /v1/chat/completions` | HTTP | Gateway 端口 | Gateway auth | OpenAI 兼容调用        |
| `POST /v1/responses`        | HTTP | Gateway 端口 | Gateway auth | OpenResponses 标准调用 |
| `POST /tools/invoke`        | HTTP | Gateway 端口 | Gateway auth | 直接调用 agent 工具    |
| WebSocket RPC               | WS   | Gateway 端口 | Gateway auth | 实时双向通信           |

---

## CLI 命令行接口

### openclaw agent

**用途**：从脚本运行一次 agent turn（AI 回合），最接近 cron 的 `agentTurn` 模式。

**源码**：`src/commands/agent.ts`、`src/cli/program/register.agent.ts`

```bash
openclaw agent \
  --message "你的提示词" \
  --agent <agentId>           # 指定 agent（如 main、ops）
  --to <E.164>                # 或用手机号定位会话
  --session-id <id>           # 或用 session id
  --thinking <level>          # off | minimal | low | medium | high
  --deliver                   # 将 agent 回复发送到频道
  --channel <channel>         # 投递频道：whatsapp | telegram | discord | slack 等
  --reply-to <target>         # 投递目标覆盖
  --reply-channel <channel>   # 投递频道覆盖
  --local                     # 本地嵌入运行（不走 Gateway）
  --timeout <seconds>         # 超时（默认 600s）
  --json                      # JSON 输出
```

**关键行为**：

- 默认通过 Gateway WebSocket RPC 发送请求（`agentViaGatewayCommand`）
- 加 `--local` 则本地嵌入运行（需要 API key 在环境变量中）
- `--deliver` 让 agent 回复自动投递到消息频道
- 支持 `--json` 输出，方便脚本解析结果

**示例**：

```bash
# 基础调用：让 main agent 处理一条消息
openclaw agent --agent main --message "总结今天的日志"

# 带投递：agent 回复发到 Slack
openclaw agent --agent ops --message "生成周报" \
  --deliver --reply-channel slack --reply-to "#reports"

# 本地运行 + JSON 输出（适合 CI/CD 管道）
openclaw agent --local --agent main --message "检查系统状态" --json

# 指定思考级别
openclaw agent --agent main --message "分析这个复杂问题" --thinking high
```

---

### openclaw message send

**用途**：直接向消息频道发送消息（不经过 AI），适合通知、告警。

**源码**：`src/commands/message.ts`、`src/cli/program/message/register.send.ts`

```bash
openclaw message send \
  --channel <whatsapp|telegram|discord|slack|signal|imessage|...> \
  --target <E.164|chat-id|channel-id> \
  --message "消息内容" \
  --media <path-or-url>       # 附件（图片/音频/视频/文档）
  --buttons <json>            # Telegram 内联键盘按钮
  --card <json>               # Adaptive Card（支持的频道）
  --reply-to <id>             # 回复某条消息
  --thread-id <id>            # 话题 ID（Telegram forum）
  --account <id>              # 账号 ID
  --gif-playback              # 视频作为 GIF 播放（WhatsApp）
  --silent                    # 静默发送（Telegram）
  --json                      # JSON 输出
  --dry-run                   # 模拟运行
```

**示例**：

```bash
# 发送文本到 WhatsApp
openclaw message send --channel whatsapp --target +15551234567 --message "部署完成"

# 发送带图片的消息到 Telegram
openclaw message send --channel telegram --target @mygroup \
  --message "监控截图" --media /tmp/screenshot.png

# 发送到 Slack 频道
openclaw message send --channel slack --target "channel:C1234567890" \
  --message "构建失败告警"

# 发送到 Discord
openclaw message send --channel discord --target "1234567890" \
  --message "新版本已发布"
```

---

### openclaw cron

**用途**：管理 Gateway 上的定时任务，定时触发 AI agent 运行。

**源码**：`src/cli/cron-cli.ts`、`src/cron/service/timer.ts`

```bash
# 添加定时任务
openclaw cron add \
  --name "任务名称" \
  --cron "0 7 * * *"           # cron 表达式
  --session isolated           # isolated（隔离会话）或 main（主会话）
  --message "提示词"           # agentTurn 的消息
  --announce                   # 将结果通知到频道
  --channel slack              # 通知频道
  --to "channel:C1234"         # 通知目标

# 列出任务
openclaw cron list

# 手动运行一次
openclaw cron run <jobId>

# 删除任务
openclaw cron remove <jobId>

# 查看状态
openclaw cron status
```

**两种会话模式**：

| 模式     | sessionTarget | payload.kind  | 说明                           |
| -------- | ------------- | ------------- | ------------------------------ |
| 主会话   | `main`        | `systemEvent` | 往主会话注入系统事件，触发心跳 |
| 隔离会话 | `isolated`    | `agentTurn`   | 独立会话运行 agent，互不干扰   |

---

## HTTP API 接口

Gateway 默认监听 `127.0.0.1:18789`（可配置），同一端口同时提供 HTTP 和 WebSocket。

### Webhooks

**用途**：最简单的 HTTP 触发接口，适合 shell 脚本、GitHub Actions、n8n、Zapier 等。

**前置配置**（`openclaw config set` 或编辑配置文件）：

```json5
{
  hooks: {
    enabled: true,
    token: "your-shared-secret",
  },
}
```

#### POST /hooks/wake

唤醒主会话并注入系统事件。

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer your-shared-secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "收到新邮件：来自张三，主题：项目更新",
    "mode": "now"
  }'
```

| 字段   | 必填 | 说明                                                   |
| ------ | ---- | ------------------------------------------------------ |
| `text` | 是   | 系统事件描述                                           |
| `mode` | 否   | `now`（立即触发心跳）或 `next-heartbeat`（等下次周期） |

**返回**：`200 { ok: true, mode: "now" }`

#### POST /hooks/agent

运行一次隔离 agent turn（**最推荐的外部脚本接口**）。

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer your-shared-secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "总结今天的 GitHub issue 列表",
    "name": "GitHub",
    "sessionKey": "hook:github:daily",
    "wakeMode": "now",
    "deliver": true,
    "channel": "slack",
    "to": "channel:C1234567890",
    "model": "anthropic/claude-sonnet-4-20250514",
    "thinking": "low",
    "timeoutSeconds": 120
  }'
```

| 字段             | 必填 | 说明                                                        |
| ---------------- | ---- | ----------------------------------------------------------- |
| `message`        | 是   | 发给 agent 的提示词                                         |
| `name`           | 否   | 人类可读名称，会出现在会话摘要中                            |
| `sessionKey`     | 否   | 会话标识，相同 key 可复用上下文（多轮对话）                 |
| `wakeMode`       | 否   | `now` 或 `next-heartbeat`                                   |
| `deliver`        | 否   | 是否投递 agent 回复到频道（默认 `true`）                    |
| `channel`        | 否   | 投递频道：`last`/`whatsapp`/`telegram`/`discord`/`slack` 等 |
| `to`             | 否   | 投递目标（手机号/chat ID/channel ID）                       |
| `model`          | 否   | 模型覆盖（如 `openai/gpt-4o`）                              |
| `thinking`       | 否   | 思考级别：`low`/`medium`/`high`                             |
| `timeoutSeconds` | 否   | 超时秒数                                                    |

**返回**：`202 { ok: true, runId: "uuid" }`（异步执行）

#### POST /hooks/\<name\>（自定义映射）

通过 `hooks.mappings` 配置，将任意 payload 转换为 wake 或 agent 动作。支持预设（如 `gmail`）和自定义 JS/TS 变换模块。

---

### OpenAI 兼容接口

**用途**：让任何支持 OpenAI API 的工具/库直接调用 OpenClaw agent。

**路径**：`POST /v1/chat/completions`

**源码**：`src/gateway/openai-http.ts`

```bash
curl -X POST http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer your-gateway-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw:main",
    "messages": [
      {"role": "user", "content": "列出今天的待办事项"}
    ],
    "stream": true
  }'
```

| 字段       | 说明                                                     |
| ---------- | -------------------------------------------------------- |
| `model`    | `openclaw:<agentId>` 或 `agent:<agentId>` 格式选择 agent |
| `messages` | 标准 OpenAI messages 数组                                |
| `stream`   | 支持 SSE 流式输出                                        |
| `user`     | 用于稳定会话标识                                         |

**自定义 Header**：

- `x-openclaw-agent-id`: 覆盖 agent ID
- `x-openclaw-session-key`: 指定会话 key

**适用场景**：Python openai SDK、LangChain、任何 OpenAI 兼容客户端。

```python
# Python 示例
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:18789/v1",
    api_key="your-gateway-token"
)

response = client.chat.completions.create(
    model="openclaw:main",
    messages=[{"role": "user", "content": "今日摘要"}]
)
print(response.choices[0].message.content)
```

---

### OpenResponses 接口

**用途**：遵循 [OpenResponses](https://www.open-responses.com/) 标准的接口，支持工具调用、文件/图片输入。

**路径**：`POST /v1/responses`

**源码**：`src/gateway/openresponses-http.ts`

**前置配置**：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: true },
      },
    },
  },
}
```

```bash
curl -X POST http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer your-gateway-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw:main",
    "input": "分析这个文件并生成报告",
    "stream": true
  }'
```

| 字段          | 说明                                            |
| ------------- | ----------------------------------------------- |
| `model`       | `openclaw:<agentId>`                            |
| `input`       | 字符串或 ItemParam 数组（支持文本、图片、文件） |
| `tools`       | 客户端工具定义（可选）                          |
| `tool_choice` | 工具选择策略                                    |
| `stream`      | 支持 SSE 流式                                   |
| `user`        | 会话用户标识                                    |

---

### Tools Invoke

**用途**：直接调用 agent 的内部工具（如 memory_search、sessions_list 等），绕过 AI 推理。

**路径**：`POST /tools/invoke`

**源码**：`src/gateway/tools-invoke-http.ts`

```bash
curl -X POST http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer your-gateway-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {},
    "sessionKey": "main",
    "dryRun": false
  }'
```

| 字段         | 必填 | 说明       |
| ------------ | ---- | ---------- |
| `tool`       | 是   | 工具名称   |
| `action`     | 否   | 动作类型   |
| `args`       | 否   | 工具参数   |
| `sessionKey` | 否   | 会话上下文 |
| `dryRun`     | 否   | 模拟运行   |

---

## Gateway WebSocket RPC

**用途**：实时双向通信，适合需要流式输出或复杂交互的集成。

**源码**：`src/gateway/call.ts`、`src/gateway/client.ts`

**协议**：JSON-RPC over WebSocket，默认端口 18789。

**可用方法**（部分列举）：

| 方法           | 说明                |
| -------------- | ------------------- |
| `agent`        | 运行 agent turn     |
| `agent.wait`   | 等待 agent 作业完成 |
| `send`         | 发送消息到频道      |
| `poll`         | 发送投票            |
| `wake`         | 触发心跳            |
| `system-event` | 注入系统事件        |
| `cron.add`     | 添加 cron 任务      |
| `cron.list`    | 列出 cron 任务      |
| `cron.run`     | 手动触发 cron 任务  |
| `cron.remove`  | 删除 cron 任务      |
| `chat.send`    | WebChat 发消息      |
| `chat.history` | 获取聊天历史        |
| `node.invoke`  | 调用 node 工具      |

**`agent` 方法参数**：

```json
{
  "method": "agent",
  "params": {
    "message": "你的提示词",
    "agentId": "main",
    "sessionKey": "custom:my-session",
    "thinking": "low",
    "deliver": true,
    "channel": "telegram",
    "to": "123456789",
    "idempotencyKey": "unique-request-id",
    "timeout": 120
  }
}
```

**`send` 方法参数**：

```json
{
  "method": "send",
  "params": {
    "to": "+15551234567",
    "message": "Hello from script",
    "channel": "whatsapp",
    "idempotencyKey": "unique-request-id"
  }
}
```

---

## 认证方式

### CLI 命令

本地运行不需要额外认证（agent 命令走 Gateway 时会自动使用本地配置的凭据）。

### Webhook (Hooks)

独立的 hook token，在配置中设置：

```json5
{ hooks: { enabled: true, token: "hook-secret-token" } }
```

请求时携带：

- `Authorization: Bearer <hook-token>`（推荐）
- `x-openclaw-token: <hook-token>`

### Gateway HTTP/WebSocket API

使用 Gateway 认证（token 或 password 模式）：

```json5
{
  gateway: {
    auth: {
      mode: "token", // 或 "password"
      token: "gateway-token", // 或 password: "gateway-pass"
    },
  },
}
```

请求时携带：

- `Authorization: Bearer <gateway-token>`

环境变量方式：

- `OPENCLAW_GATEWAY_TOKEN=<token>`
- `OPENCLAW_GATEWAY_PASSWORD=<password>`

---

## Cron 系统内部原理

理解 cron 如何调用 AI 有助于选择正确的外部接口。

**源码**：`src/cron/service/timer.ts`、`src/cron/isolated-agent/run.ts`

### 执行流程

```
定时触发 → executeJob()
  ├── sessionTarget: "main"
  │   └── enqueueSystemEvent(text) → 触发心跳 → 主会话处理
  └── sessionTarget: "isolated"
      └── runCronIsolatedAgentTurn(message) → runEmbeddedPiAgent()
          └── 独立会话运行 AI → 可选投递到频道
```

### Cron Job 数据结构

```typescript
{
  name: string;                    // 任务名称
  schedule: {
    kind: "at" | "every" | "cron", // 一次性 / 间隔 / cron 表达式
    at?: string,                   // ISO-8601 时间戳
    every?: number,                // 毫秒间隔
    cron?: string,                 // cron 表达式
    timezone?: string              // 时区
  };
  payload: {
    kind: "systemEvent" | "agentTurn",
    text?: string,                 // systemEvent 用
    message?: string,              // agentTurn 用
    model?: string,                // 模型覆盖
    thinking?: string,             // 思考级别
    timeoutSeconds?: number
  };
  sessionTarget: "main" | "isolated";
  delivery?: {
    mode: "announce" | "none",
    channel?: string,
    to?: string,
    bestEffort?: boolean
  };
  wakeMode?: "now" | "next-heartbeat";
  agentId?: string;
  enabled?: boolean;
  deleteAfterRun?: boolean;        // 运行后自动删除
}
```

---

## 实战示例

### 场景 1：GitHub Actions 触发 AI 代码审查

```bash
#!/bin/bash
# .github/scripts/ai-review.sh
curl -X POST http://your-gateway:18789/hooks/agent \
  -H 'Authorization: Bearer $HOOK_TOKEN' \
  -H 'Content-Type: application/json' \
  -d "{
    \"message\": \"审查这个 PR 的变更：$PR_DIFF\",
    \"name\": \"GitHub-Review\",
    \"sessionKey\": \"hook:github:pr-$PR_NUMBER\",
    \"deliver\": true,
    \"channel\": \"slack\",
    \"to\": \"channel:C-dev-reviews\",
    \"thinking\": \"medium\"
  }"
```

### 场景 2：Shell 脚本定期生成报告

```bash
#!/bin/bash
# daily-report.sh (配合 system crontab)
openclaw agent \
  --agent ops \
  --message "生成今日系统状态报告，包括：CPU、内存、磁盘使用率，最近的错误日志摘要" \
  --deliver \
  --reply-channel telegram \
  --reply-to "@admin_group" \
  --thinking low \
  --json > /tmp/report-result.json
```

### 场景 3：Python 脚本调用 AI 分析数据

```python
from openai import OpenAI
import json

client = OpenAI(
    base_url="http://127.0.0.1:18789/v1",
    api_key="your-gateway-token"
)

# 读取数据
with open("/tmp/metrics.json") as f:
    metrics = json.load(f)

response = client.chat.completions.create(
    model="openclaw:main",
    messages=[{
        "role": "user",
        "content": f"分析以下指标数据并给出优化建议：\n{json.dumps(metrics, indent=2)}"
    }]
)

# 将结果写入文件或发送通知
print(response.choices[0].message.content)
```

### 场景 4：监控告警自动处理

```bash
#!/bin/bash
# alert-handler.sh - 被监控系统调用时传入告警信息
ALERT_MSG="$1"

# 让 AI 分析告警并决定行动
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer $HOOK_TOKEN' \
  -H 'Content-Type: application/json' \
  -d "{
    \"message\": \"收到监控告警：$ALERT_MSG。请分析严重性并建议处理方案。\",
    \"name\": \"Monitor\",
    \"sessionKey\": \"hook:monitor:alerts\",
    \"deliver\": true,
    \"channel\": \"telegram\",
    \"thinking\": \"low\",
    \"timeoutSeconds\": 60
  }"
```

### 场景 5：通过 Gateway 注册 Cron 定时任务

```bash
# 添加每天早上 7 点的日报任务
openclaw cron add \
  --name "每日早报" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "整理过去 24 小时的重要更新，生成简报" \
  --announce \
  --channel slack \
  --to "channel:C-morning-brief"
```

### 场景 6：直接调用 Agent 工具

```bash
# 搜索记忆
curl -X POST http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer your-gateway-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "memory_search",
    "args": {"query": "项目截止日期"},
    "sessionKey": "main"
  }'
```

---

## 接口选择决策树

```
需要 AI 推理吗？
├── 是
│   ├── 一次性脚本/CI → openclaw agent 或 POST /hooks/agent
│   ├── 定期执行 → openclaw cron add 或系统 crontab + openclaw agent
│   ├── 已有 OpenAI SDK 集成 → POST /v1/chat/completions
│   ├── 需要工具调用/文件输入 → POST /v1/responses
│   └── 需要流式/实时交互 → WebSocket RPC agent 方法
└── 否
    ├── 发送纯消息 → openclaw message send 或 WebSocket send 方法
    ├── 唤醒主会话心跳 → POST /hooks/wake
    └── 调用特定工具 → POST /tools/invoke
```

---

## 注意事项

1. **Gateway 必须运行**：除了 `openclaw agent --local`，所有接口都需要 Gateway 在线。
2. **端口与绑定**：默认 `127.0.0.1:18789`；如需远程访问，调整 `gateway.bind` 并确保安全（Tailnet/VPN/反向代理）。
3. **幂等性**：WebSocket RPC 的 `send` 和 `agent` 方法需要 `idempotencyKey`，CLI 会自动生成。
4. **超时**：agent 默认 600s 超时，可通过 `--timeout` 或 `timeoutSeconds` 调整。
5. **投递**：`deliver: true` 会将 agent 回复发送到消息频道；不需要投递时设为 `false`。
6. **会话隔离**：使用不同的 `sessionKey` 可以保持独立上下文，相同 key 则复用多轮对话。
7. **安全**：hook token 和 gateway token 应分开管理；webhook 建议只在 loopback 或可信网络暴露。
