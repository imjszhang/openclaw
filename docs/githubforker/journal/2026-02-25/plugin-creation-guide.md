# OpenClaw 插件创建完全指引

> 编写日期：2026-02-25
> 基于源码深度分析，覆盖从机制原理到动手创建的全流程

---

## 目录

1. [插件系统全景](#1-插件系统全景)
2. [核心概念：两层架构](#2-核心概念两层架构)
3. [插件的一生：从发现到运行](#3-插件的一生从发现到运行)
4. [动手创建：五步走](#4-动手创建五步走)
5. [十大注册能力详解](#5-十大注册能力详解)
6. [Hook 系统：22 个生命周期切面](#6-hook-系统22-个生命周期切面)
7. [六种插件类型对照](#7-六种插件类型对照)
8. [配置体系](#8-配置体系)
9. [启用状态判定规则](#9-启用状态判定规则)
10. [安全机制](#10-安全机制)
11. [调试与运维](#11-调试与运维)
12. [实战参考：内置插件索引](#12-实战参考内置插件索引)

---

## 1. 插件系统全景

OpenClaw 的插件系统允许在不修改核心代码的前提下扩展几乎所有能力——消息通道、AI 工具、模型提供商、CLI 命令、HTTP 端点、后台服务、生命周期钩子、自定义斜杠命令。

整个系统由四个核心模块协作：

```
┌─────────────────────────────────────────────────────┐
│                   loader.ts                         │
│  协调全流程：发现 → 校验 → 加载 → 注册 → 缓存     │
├──────────┬──────────┬───────────┬───────────────────┤
│discovery │manifest- │ registry  │   config-state    │
│  .ts     │registry  │   .ts     │      .ts          │
│ 扫描目录 │  .ts     │ 收集注册  │  启用/禁用决策    │
│ 产出候选 │ 清单索引 │ 工厂 API  │  优先级裁决       │
└──────────┴──────────┴───────────┴───────────────────┘
```

关键技术选择：

- 动态加载器使用 **jiti**，直接加载 TypeScript，无需预编译
- 配置验证使用 **JSON Schema**，兼容 Zod 等运行时校验库
- 类型系统通过 **Plugin SDK**（`openclaw/plugin-sdk`）对外暴露，与内部实现隔离

---

## 2. 核心概念：两层架构

```
┌────────────────────────────────────────┐
│  Plugin SDK（编译时 · 稳定 · 可发布）  │   ← 插件开发者依赖这一层
│  openclaw/plugin-sdk                   │
│  类型定义 + 辅助函数 + Schema 工具     │
├────────────────────────────────────────┤
│  Plugin Runtime（运行时 · 注入）       │   ← 通过 api.runtime 访问
│  版本信息 / 配置读写 / 媒体检测       │
│  通道特定函数 / TTS / 日志传输         │
└────────────────────────────────────────┘
```

**开发者规则**：插件只能导入 `openclaw/plugin-sdk`，不能直接导入 `src/**` 内部模块。运行时能力全部通过 `api.runtime` 获取。

SDK 导出内容概览（`src/plugin-sdk/index.ts`）：

| 类别          | 示例导出                                               |
| ------------- | ------------------------------------------------------ |
| 核心类型      | `OpenClawPluginApi`, `PluginRuntime`, `AnyAgentTool`   |
| 通道类型      | `ChannelPlugin`, `ChannelMeta`, `ChannelCapabilities`  |
| Provider 类型 | `ProviderAuthContext`, `ProviderAuthResult`            |
| Gateway 类型  | `GatewayRequestHandler`, `RespondFn`                   |
| 配置 Schema   | `emptyPluginConfigSchema`, `buildChannelConfigSchema`  |
| 工具辅助      | `stringEnum`, `optionalStringEnum`, `createActionGate` |
| Webhook       | `normalizeWebhookPath`, `registerWebhookTarget`        |
| 文件锁        | `acquireFileLock`, `withFileLock`                      |
| 通道辅助      | 各通道的 account 解析、normalize、status 等            |

---

## 3. 插件的一生：从发现到运行

### 3.1 发现阶段

系统按优先级扫描四个来源目录：

| 优先级 | 来源      | 路径                             | 说明         |
| ------ | --------- | -------------------------------- | ------------ |
| 1      | config    | `plugins.load.paths`             | 用户显式指定 |
| 2      | workspace | `.openclaw/extensions/`          | 项目级扩展   |
| 3      | global    | `~/.config/openclaw/extensions/` | 全局扩展     |
| 4      | bundled   | `extensions/`                    | 内置扩展     |

每个目录下的发现逻辑：

1. 扫描子目录，查找 `openclaw.plugin.json` → 包目录插件
2. 扫描顶层文件（`.ts`、`.js`、`.mts`、`.cts`、`.mjs`、`.cjs`）→ 单文件插件
3. 扫描 `package.json` 中的 `openclaw.extensions` 字段 → npm 包插件

每个候选产出一个 `PluginCandidate` 对象，包含 `idHint`、`source`（入口文件路径）、`rootDir`、`origin`。

### 3.2 加载阶段

`loadOpenClawPlugins()` 驱动完整流程：

```
applyTestPluginDefaults()     测试环境默认禁用插件
         ↓
normalizePluginsConfig()      规范化配置结构
         ↓
检查 registryCache            命中则直接返回
         ↓
createPluginRuntime()         创建 Runtime 实例
createPluginRegistry()        创建 Registry + API 工厂
         ↓
discoverOpenClawPlugins()     发现候选
loadPluginManifestRegistry()  加载清单索引
         ↓
━━━ 对每个候选执行 ━━━━━━━━━━━━━━━━
│ ① 验证清单存在                    │
│ ② 检查 ID 冲突                    │
│ ③ resolveEnableState() 判定启用   │
│ ④ resolveMemorySlotDecision()     │
│ ⑤ 安全检查（路径逃逸/权限）      │
│ ⑥ validatePluginConfig() 校验配置 │
│ ⑦ jiti() 动态加载模块             │
│ ⑧ resolvePluginModuleExport()     │
│ ⑨ 调用 register() 或 activate()  │
│ ⑩ 记录到 Registry                │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ↓
initializeGlobalHookRunner()  初始化 Hook 运行器
缓存 Registry
```

### 3.3 模块导出解析

`resolvePluginModuleExport()` 处理三种导出形式：

```typescript
// 形式 A：函数导出
export default function register(api: OpenClawPluginApi) { ... }

// 形式 B：对象导出（register）
export default {
  id: "my-plugin",
  register(api: OpenClawPluginApi) { ... }
}

// 形式 C：对象导出（activate，等效 register）
export default {
  id: "my-plugin",
  activate(api: OpenClawPluginApi) { ... }
}
```

如果模块有 `default` 属性会先解包（`{ default: ... }` → `...`）。

### 3.4 运行阶段

`register()` 被调用后，插件通过 `api.registerXxx()` 方法将自身能力注册到 Registry。之后核心系统在需要时从 Registry 取用：

- Agent 启动时解析可用工具
- 消息到达时触发 Hook 链
- Gateway 启动时拉起 Service
- HTTP 请求到达时匹配路由

---

## 4. 动手创建：五步走

### 第一步：创建目录和清单

```
extensions/my-awesome-plugin/
├── openclaw.plugin.json     ← 必需
├── index.ts                 ← 入口
└── package.json             ← 推荐
```

**openclaw.plugin.json**（最小版）：

```json
{
  "id": "my-awesome-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

**openclaw.plugin.json**（完整版）：

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "description": "Does awesome things",
  "version": "1.0.0",
  "kind": "memory",
  "channels": ["my-channel"],
  "providers": ["my-provider"],
  "skills": ["my-skill"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" },
      "maxRetries": { "type": "number", "default": 3 }
    },
    "required": ["apiKey"]
  },
  "uiHints": {
    "apiKey": {
      "label": "API 密钥",
      "sensitive": true,
      "placeholder": "sk-..."
    },
    "maxRetries": {
      "label": "最大重试次数",
      "advanced": true,
      "help": "失败后自动重试的次数"
    }
  }
}
```

清单字段说明：

| 字段           | 必需 | 说明                                                         |
| -------------- | ---- | ------------------------------------------------------------ |
| `id`           | 是   | 全局唯一标识符                                               |
| `configSchema` | 推荐 | JSON Schema，用于配置校验                                    |
| `name`         | 否   | 显示名称                                                     |
| `description`  | 否   | 描述                                                         |
| `version`      | 否   | 语义版本号                                                   |
| `kind`         | 否   | 目前仅 `"memory"` 有特殊含义（槽位机制）                     |
| `channels`     | 否   | 注册的通道 ID 列表                                           |
| `providers`    | 否   | 注册的 Provider ID 列表                                      |
| `uiHints`      | 否   | UI 配置提示（label、sensitive、advanced、placeholder、help） |

### 第二步：创建 package.json

```json
{
  "name": "@openclaw/my-awesome-plugin",
  "version": "1.0.0",
  "type": "module",
  "devDependencies": {
    "openclaw": "workspace:*"
  },
  "openclaw": {
    "extensions": ["./index.ts"]
  }
}
```

### 第三步：编写入口文件

```typescript
// extensions/my-awesome-plugin/index.ts
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export default function register(api: OpenClawPluginApi) {
  api.logger.info("my-awesome-plugin loaded");

  // 在这里注册你的功能...
}
```

或使用对象导出获得更完整的元数据控制：

```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

export default {
  id: "my-awesome-plugin",
  name: "My Awesome Plugin",
  version: "1.0.0",
  configSchema: emptyPluginConfigSchema(),

  register(api: OpenClawPluginApi) {
    const config = api.pluginConfig;
    api.logger.info(`loaded with config: ${JSON.stringify(config)}`);
  },
};
```

### 第四步：注册功能

在 `register()` 中调用 `api.registerXxx()` 注册能力（详见第 5 节）。

### 第五步：启用插件

在配置文件中启用：

```yaml
# ~/.openclaw/config.yaml
plugins:
  entries:
    my-awesome-plugin:
      enabled: true
      config:
        apiKey: "sk-xxx"
        maxRetries: 5
```

或者将插件放到自动发现路径下（workspace/global/bundled），非 bundled 来源的插件默认启用。

---

## 5. 十大注册能力详解

`OpenClawPluginApi` 提供十种注册方法。以下是完整清单和典型用法。

### 5.1 registerTool — AI 工具

Agent 可以调用的工具函数。

```typescript
import { Type } from "@sinclair/typebox";
import { stringEnum } from "openclaw/plugin-sdk";

// 静态工具
api.registerTool(
  {
    name: "search_web",
    description: "Search the web for information",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      limit: Type.Optional(Type.Number({ description: "Max results" })),
    }),
    async execute(toolCallId, params) {
      const { query, limit = 10 } = params as { query: string; limit?: number };
      const results = await doSearch(query, limit);
      return {
        content: [{ type: "text", text: JSON.stringify(results) }],
      };
    },
  },
  { name: "search_web", optional: true },
);

// 工厂工具（根据上下文动态创建）
api.registerTool(
  (ctx) => {
    if (!ctx.config?.myFeatureEnabled) return null;
    return { name: "dynamic_tool" /* ... */ };
  },
  { name: "dynamic_tool" },
);
```

选项说明：

- `name` / `names`：工具名称，可指定多个别名
- `optional`：为 `true` 时，工具创建失败不阻断插件加载

### 5.2 registerChannel — 消息通道

注册完整的消息平台集成。这是最复杂的注册类型，需要实现 `ChannelPlugin` 接口的多个适配器。

```typescript
api.registerChannel({ plugin: myChannelPlugin });
// 或同时注册 dock
api.registerChannel({ plugin: myChannelPlugin, dock: myDock });
```

### 5.3 registerProvider — 模型提供商

注册 AI 模型的认证流程和配置。

```typescript
api.registerProvider({
  id: "my-provider",
  label: "My AI Provider",
  aliases: ["myp"],
  envVars: ["MY_PROVIDER_API_KEY"],
  auth: [
    {
      id: "api_key",
      label: "API Key",
      kind: "api_key",
      async run(ctx) {
        const key = await ctx.prompter.text({ message: "Enter API key:" });
        return {
          profiles: [
            {
              profileId: `my-provider:${String(key).slice(0, 8)}`,
              credential: { type: "api_key", provider: "my-provider", apiKey: String(key) },
            },
          ],
          defaultModel: "my-provider/default",
        };
      },
    },
  ],
});
```

认证类型：`"api_key"` | `"oauth"` | `"token"` | `"device_code"` | `"custom"`

### 5.4 registerHook / on — 生命周期钩子

两种注册方式，`on()` 提供完整的类型推导。

```typescript
// 传统方式
api.registerHook("message_received", handler, { name: "my-logger" });

// 类型安全方式（推荐）
api.on(
  "before_tool_call",
  async (event, ctx) => {
    if (event.toolName === "dangerous_tool") {
      return { block: true, blockReason: "Blocked by policy" };
    }
  },
  { priority: 10 },
);
```

### 5.5 registerCommand — 自定义斜杠命令

绕过 LLM 直接处理的快捷命令。优先级高于内置命令和 Agent 调用。

```typescript
api.registerCommand({
  name: "status",
  description: "Show plugin status",
  acceptsArgs: false,
  requireAuth: true,
  async handler(ctx) {
    return { text: `Plugin running on ${ctx.channel}` };
  },
});
```

`PluginCommandContext` 包含：`senderId`、`channel`、`channelId`、`isAuthorizedSender`、`args`、`commandBody`、`config`、`from`、`to`、`accountId`、`messageThreadId`。

### 5.6 registerHttpRoute — HTTP 路由

为 Webhook 等场景注册 HTTP 端点。

```typescript
api.registerHttpRoute({
  path: "/my-plugin/webhook",
  async handler(req, res) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  },
});
```

### 5.7 registerHttpHandler — 通用 HTTP 处理器

更灵活的 HTTP 处理，通过返回 `true`/`false` 控制是否消费请求。

```typescript
api.registerHttpHandler(async (req, res) => {
  if (req.url?.startsWith("/my-plugin/")) {
    // 处理请求
    return true;
  }
  return false;
});
```

### 5.8 registerGatewayMethod — Gateway RPC 方法

注册 Gateway JSON-RPC 方法。

```typescript
api.registerGatewayMethod("myPlugin.getData", async ({ params, respond }) => {
  const data = await fetchData(params);
  respond(true, { data });
});
```

### 5.9 registerCli — CLI 命令

基于 Commander.js 注册 CLI 子命令。

```typescript
api.registerCli(
  ({ program, config, logger }) => {
    program
      .command("my-plugin-cmd")
      .description("Do something")
      .argument("<input>", "Input value")
      .action(async (input) => {
        logger.info(`Processing: ${input}`);
      });
  },
  { commands: ["my-plugin-cmd"] },
);
```

### 5.10 registerService — 后台服务

Gateway 启动时拉起、关闭时销毁的后台服务。

```typescript
api.registerService({
  id: "my-background-worker",
  async start(ctx) {
    ctx.logger.info("Starting background worker...");
  },
  async stop(ctx) {
    ctx.logger.info("Stopping background worker...");
  },
});
```

`OpenClawPluginServiceContext` 包含：`config`、`workspaceDir`、`stateDir`、`logger`。

---

## 6. Hook 系统：22 个生命周期切面

Hook 是插件感知和干预核心行为的主要途径。分为**只读 Hook**（仅观察）和**可写 Hook**（可通过返回值修改行为）。

### 完整 Hook 列表

#### Agent 流程

| Hook                   | 时机                 | 可写 | 事件 / 返回值要点                           |
| ---------------------- | -------------------- | ---- | ------------------------------------------- |
| `before_model_resolve` | 模型选择前           | 是   | 可返回 `modelOverride` / `providerOverride` |
| `before_prompt_build`  | 提示构建前           | 是   | 可返回 `systemPrompt` / `prependContext`    |
| `before_agent_start`   | Agent 启动前（兼容） | 是   | 合并以上两者的返回值                        |
| `llm_input`            | LLM 请求发出前       | 否   | 含 provider、model、prompt、historyMessages |
| `llm_output`           | LLM 响应返回后       | 否   | 含 assistantTexts、usage 统计               |
| `agent_end`            | Agent 运行结束       | 否   | 含 messages、success、durationMs            |

#### 消息流程

| Hook                   | 时机              | 可写 | 事件 / 返回值要点                         |
| ---------------------- | ----------------- | ---- | ----------------------------------------- |
| `message_received`     | 收到用户消息      | 否   | from、content、metadata                   |
| `message_sending`      | 回复发出前        | 是   | 可修改 `content` 或设置 `cancel: true`    |
| `message_sent`         | 回复发出后        | 否   | success、error                            |
| `before_message_write` | 消息写入 JSONL 前 | 是   | 可 `block: true` 阻止写入，或修改 message |

#### 工具调用

| Hook                  | 时机         | 可写 | 事件 / 返回值要点                                 |
| --------------------- | ------------ | ---- | ------------------------------------------------- |
| `before_tool_call`    | 工具执行前   | 是   | 可修改 `params`，或 `block: true` + `blockReason` |
| `after_tool_call`     | 工具执行后   | 否   | 含 result、error、durationMs                      |
| `tool_result_persist` | 结果持久化前 | 是   | 可修改即将写入的 message                          |

#### 会话与压缩

| Hook                | 时机                | 可写 | 事件 / 返回值要点              |
| ------------------- | ------------------- | ---- | ------------------------------ |
| `session_start`     | 会话开始            | 否   | sessionId、resumedFrom         |
| `session_end`       | 会话结束            | 否   | messageCount、durationMs       |
| `before_compaction` | 压缩开始前          | 否   | messageCount、sessionFile 路径 |
| `after_compaction`  | 压缩完成后          | 否   | compactedCount                 |
| `before_reset`      | /new 或 /reset 触发 | 否   | sessionFile、reason            |

#### 子 Agent

| Hook                       | 时机                      | 可写 | 事件 / 返回值要点             |
| -------------------------- | ------------------------- | ---- | ----------------------------- |
| `subagent_spawning`        | 子 Agent 即将创建         | 是   | 可返回 `status: "error"` 阻止 |
| `subagent_delivery_target` | 确定子 Agent 消息投递目标 | 是   | 可覆盖 origin                 |
| `subagent_spawned`         | 子 Agent 已创建           | 否   | runId、childSessionKey        |
| `subagent_ended`           | 子 Agent 结束             | 否   | outcome、error                |

#### Gateway

| Hook            | 时机         | 可写 |
| --------------- | ------------ | ---- |
| `gateway_start` | Gateway 启动 | 否   |
| `gateway_stop`  | Gateway 停止 | 否   |

### Hook 上下文类型

每种 Hook 携带专属上下文对象：

- `PluginHookAgentContext`：agentId、sessionKey、sessionId、workspaceDir、messageProvider
- `PluginHookMessageContext`：channelId、accountId、conversationId
- `PluginHookToolContext`：agentId、sessionKey、toolName
- `PluginHookSessionContext`：agentId、sessionId
- `PluginHookSubagentContext`：runId、childSessionKey、requesterSessionKey
- `PluginHookGatewayContext`：port

---

## 7. 六种插件类型对照

| 类型              | 核心注册方法       | 清单 kind  | 复杂度 | 典型场景             |
| ----------------- | ------------------ | ---------- | ------ | -------------------- |
| **工具插件**      | `registerTool`     | —          | 低     | 给 Agent 添加新能力  |
| **通道插件**      | `registerChannel`  | —          | 高     | 接入新消息平台       |
| **Provider 插件** | `registerProvider` | —          | 中     | 接入新 AI 模型提供商 |
| **Memory 插件**   | `registerTool`     | `"memory"` | 中     | 自定义记忆存储后端   |
| **服务插件**      | `registerService`  | —          | 低     | 后台守护进程         |
| **命令插件**      | `registerCommand`  | —          | 低     | 快捷斜杠命令         |

一个插件可以同时注册多种类型的能力——例如 `voice-call` 同时注册了工具、CLI 命令、Gateway 方法、HTTP 端点和服务。

---

## 8. 配置体系

### 8.1 全局配置中的插件节

```yaml
plugins:
  enabled: true # 全局开关
  allow: ["telegram", "my-plugin"] # 白名单（空 = 全部允许）
  deny: ["dangerous-plugin"] # 黑名单
  load:
    paths: # 额外加载路径
      - /home/user/my-plugins
  slots:
    memory: "memory-lancedb" # Memory 插件槽位（"none" = 禁用）
  entries:
    my-awesome-plugin:
      enabled: true
      config: # 插件专属配置，须匹配 configSchema
        apiKey: "sk-xxx"
  installs: # 安装追踪（npm install 自动写入）
    my-npm-plugin:
      installPath: "/path/to/install"
      npmSpec: "my-npm-plugin@1.0.0"
      integrity: "sha512-..."
```

### 8.2 配置验证

清单中的 `configSchema` 是 JSON Schema 格式。加载时通过 `validateJsonSchemaValue()` 验证 `entries.<id>.config` 是否匹配。校验失败会阻止插件加载。

插件也可在运行时通过 `configSchema` 对象的 `safeParse`（Zod）或 `validate`（自定义）进行二次验证。

### 8.3 UI Hints

`uiHints` 指导 UI 层如何渲染配置表单：

```typescript
type PluginConfigUiHint = {
  label?: string; // 显示标签
  help?: string; // 帮助文本
  advanced?: boolean; // 是否折叠到"高级"区域
  sensitive?: boolean; // 敏感字段（密码输入框）
  placeholder?: string; // 占位提示
};
```

---

## 9. 启用状态判定规则

源码位于 `config-state.ts` 的 `resolveEnableState()`，优先级从高到低：

```
①  plugins.enabled === false           → 禁用（"plugins disabled"）
②  id 在 deny 列表中                   → 禁用（"blocked by denylist"）
③  allow 列表非空 且 id 不在列表中     → 禁用（"not in allowlist"）
④  id === slots.memory 的选中值        → 启用
⑤  entries[id].enabled === true        → 启用
⑥  entries[id].enabled === false       → 禁用（"disabled in config"）
⑦  origin === "bundled" 且在默认列表   → 启用
⑧  origin === "bundled" 但不在默认列表 → 禁用（"bundled, disabled by default"）
⑨  其他                                → 启用
```

默认启用的内置插件（`BUNDLED_ENABLED_BY_DEFAULT`）：

- `device-pair`
- `phone-control`
- `talk-voice`

Memory 插件有额外的槽位竞争机制（`resolveMemorySlotDecision`）：同一时刻只有一个 memory 插件被选中。

---

## 10. 安全机制

### 路径逃逸检测

入口文件的真实路径（经 realpath 解析后）必须在插件根目录内。防止符号链接指向系统文件。

### 文件权限检查（非 Windows）

- 检查文件 stat 是否可读
- 拒绝世界可写路径（`mode & 0o002`）
- 验证文件所有者与当前进程 UID 一致

### 来源追踪

非 bundled 插件加载时，系统检查其是否在 `plugins.installs` 或 `plugins.load.paths` 中有记录。未追踪的插件会触发警告日志。

### 白名单/黑名单

`plugins.allow` 为空时，系统会对所有非 bundled 的已发现插件发出安全警告，建议配置显式白名单。

---

## 11. 调试与运维

### 查看插件状态

```bash
openclaw plugins list        # 列出已加载插件
openclaw plugins validate    # 验证插件配置
```

### 安装/更新/卸载

```bash
openclaw plugins install <npm-package-or-path>
openclaw plugins update <plugin-id>
openclaw plugins uninstall <plugin-id>
```

### 日志

```typescript
// 插件内使用
api.logger.info("message");
api.logger.warn("message");
api.logger.error("message");
api.logger.debug?.("message"); // debug 可能未启用
```

全局日志级别通过配置控制：

```yaml
logging:
  level: debug
```

### 测试环境

Vitest 环境下，插件系统默认禁用（`applyTestPluginDefaults`）。需在测试中显式配置 `plugins.enabled: true` 才能加载插件。

---

## 12. 实战参考：内置插件索引

当前项目内置 37 个扩展，按类型分类：

### 通道插件

| 插件 ID             | 平台            | 复杂度参考           |
| ------------------- | --------------- | -------------------- |
| `telegram`          | Telegram        | 中等                 |
| `discord`           | Discord         | 高                   |
| `whatsapp`          | WhatsApp        | 高                   |
| `slack`             | Slack           | 高                   |
| `signal`            | Signal          | 中等                 |
| `matrix`            | Matrix          | 中等                 |
| `msteams`           | Microsoft Teams | 中等                 |
| `twitch`            | Twitch          | 中等（好的入门参考） |
| `irc`               | IRC             | 中等                 |
| `feishu`            | 飞书            | 中等                 |
| `line`              | LINE            | 中等                 |
| `zalo` / `zalouser` | Zalo            | 中等                 |
| `nostr`             | Nostr           | 低                   |
| `imessage`          | iMessage        | 高                   |
| `bluebubbles`       | BlueBubbles     | 中等                 |
| `googlechat`        | Google Chat     | 中等                 |
| `synology-chat`     | Synology Chat   | 低                   |
| `tlon`              | Tlon            | 低                   |
| `nextcloud-talk`    | Nextcloud Talk  | 低                   |
| `mattermost`        | Mattermost      | 中等                 |
| `lobster`           | Lobster         | 低                   |

### 工具/功能插件

| 插件 ID            | 功能               |
| ------------------ | ------------------ |
| `llm-task`         | LLM 子任务调用     |
| `voice-call`       | 语音通话           |
| `talk-voice`       | TTS 语音           |
| `phone-control`    | 电话控制           |
| `open-prose`       | 长文写作           |
| `thread-ownership` | 线程所有权管理     |
| `device-pair`      | 设备配对           |
| `diagnostics-otel` | OpenTelemetry 诊断 |
| `copilot-proxy`    | Copilot 代理       |

### Memory 插件

| 插件 ID          | 后端             |
| ---------------- | ---------------- |
| `memory-core`    | 内置记忆         |
| `memory-lancedb` | LanceDB 向量存储 |

### Provider 插件

| 插件 ID                   | 提供商     |
| ------------------------- | ---------- |
| `google-antigravity-auth` | Google     |
| `google-gemini-cli-auth`  | Gemini CLI |
| `minimax-portal-auth`     | MiniMax    |
| `qwen-portal-auth`        | Qwen       |

### 推荐学习路径

1. **入门** → `extensions/llm-task/`：最简单的工具插件
2. **进阶** → `extensions/twitch/`：结构清晰的通道插件
3. **高级** → `extensions/voice-call/`：综合使用工具、CLI、Gateway、HTTP、Service
4. **Provider** → `extensions/google-antigravity-auth/`：完整的 OAuth 认证流程

---

## 附：API 速查卡

```
api.id                          插件 ID
api.name                        插件名称
api.config                      全局 OpenClaw 配置
api.pluginConfig                本插件专属配置
api.runtime                     运行时工具集
api.logger                      日志器
api.resolvePath(input)          解析相对路径

api.registerTool(tool, opts?)              注册 AI 工具
api.registerChannel(registration)          注册消息通道
api.registerProvider(provider)             注册模型提供商
api.registerHook(events, handler, opts?)   注册 Hook（传统）
api.on(hookName, handler, opts?)           注册 Hook（类型安全）
api.registerCommand(command)               注册斜杠命令
api.registerHttpRoute({ path, handler })   注册 HTTP 路由
api.registerHttpHandler(handler)           注册 HTTP 处理器
api.registerGatewayMethod(method, handler) 注册 Gateway 方法
api.registerCli(registrar, opts?)          注册 CLI 命令
api.registerService(service)               注册后台服务
```
