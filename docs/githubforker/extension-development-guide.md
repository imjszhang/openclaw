# OpenClaw 扩展开发指南

本指南详细介绍如何为 OpenClaw 开发自定义扩展（插件）。扩展系统允许你在不修改核心代码的情况下添加新功能，包括消息渠道、AI 工具、CLI 命令、HTTP 端点、生命周期钩子等。

## 目录

- [扩展架构概述](#扩展架构概述)
- [扩展类型](#扩展类型)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [配置文件详解](#配置文件详解)
- [Plugin API 详解](#plugin-api-详解)
- [扩展能力](#扩展能力)
- [生命周期钩子](#生命周期钩子)
- [最佳实践](#最佳实践)
- [示例扩展](#示例扩展)

## 扩展架构概述

OpenClaw 的扩展系统基于以下核心概念：

1. **发现机制**：系统自动扫描多个位置查找扩展
2. **清单注册**：通过 `openclaw.plugin.json` 声明扩展元数据
3. **运行时加载**：使用 jiti 动态加载 TypeScript/JavaScript 模块
4. **Plugin API**：提供统一的 API 注册各类功能

### 扩展发现顺序

扩展按以下优先级顺序加载（先发现的优先）：

1. **config** - 配置文件中 `plugins.loadPaths` 指定的路径
2. **workspace** - 工作区 `.openclaw/extensions/` 目录
3. **global** - 全局 `~/.openclaw/extensions/` 目录
4. **bundled** - 内置扩展（`extensions/` 目录）

## 扩展类型

OpenClaw 支持多种扩展类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| **Channel** | 消息渠道（Telegram、Discord 等） | `telegram`, `twitch`, `matrix` |
| **Provider** | AI 模型提供商（认证流程） | `google-antigravity-auth` |
| **Tool** | AI Agent 可调用的工具 | `llm-task`, `voice-call` |
| **Memory** | 长期记忆存储 | `memory-lancedb` |
| **Service** | 后台服务 | `diagnostics-otel` |

## 快速开始

### 最小扩展示例

创建一个简单的工具扩展：

```typescript
// extensions/my-plugin/index.ts
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

const plugin = {
  id: "my-plugin",
  name: "My Plugin",
  description: "A simple example plugin",
  configSchema: emptyPluginConfigSchema(),
  
  register(api: OpenClawPluginApi) {
    api.logger.info("my-plugin: loaded successfully");
    
    // 注册一个简单工具
    api.registerTool({
      name: "hello_world",
      description: "Says hello",
      parameters: { type: "object", properties: {} },
      async execute() {
        return {
          content: [{ type: "text", text: "Hello from my plugin!" }],
        };
      },
    });
  },
};

export default plugin;
```

### 配置清单

```json
// extensions/my-plugin/openclaw.plugin.json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

### package.json

```json
// extensions/my-plugin/package.json
{
  "name": "@openclaw/my-plugin",
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

## 目录结构

推荐的扩展目录结构：

```
extensions/my-plugin/
├── index.ts                 # 主入口文件
├── openclaw.plugin.json     # 插件清单（必需）
├── package.json             # NPM 包配置
├── README.md                # 文档
├── CHANGELOG.md             # 变更日志
└── src/                     # 源代码目录
    ├── channel.ts           # 渠道实现
    ├── runtime.ts           # 运行时状态
    ├── config.ts            # 配置解析
    └── *.test.ts            # 测试文件
```

## 配置文件详解

### openclaw.plugin.json

插件清单文件定义扩展的元数据和配置模式：

```json
{
  "id": "my-plugin",
  "kind": "memory",
  "channels": ["my-channel"],
  "uiHints": {
    "apiKey": {
      "label": "API Key",
      "sensitive": true,
      "placeholder": "sk-...",
      "help": "Your API key for authentication"
    },
    "advanced.timeout": {
      "label": "Timeout (ms)",
      "advanced": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" },
      "enabled": { "type": "boolean" },
      "advanced": {
        "type": "object",
        "properties": {
          "timeout": { "type": "number" }
        }
      }
    },
    "required": ["apiKey"]
  }
}
```

**字段说明：**

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识符（必需） |
| `kind` | 扩展类型，如 `"memory"` |
| `channels` | 注册的渠道 ID 列表 |
| `uiHints` | UI 配置提示（标签、敏感字段等） |
| `configSchema` | JSON Schema 配置验证 |

### uiHints 选项

```typescript
type PluginConfigUiHint = {
  label?: string;      // 显示标签
  help?: string;       // 帮助文本
  advanced?: boolean;  // 是否为高级选项
  sensitive?: boolean; // 是否为敏感信息（密码、密钥）
  placeholder?: string; // 输入占位符
};
```

## Plugin API 详解

### OpenClawPluginApi 接口

`register` 函数接收的 API 对象提供以下功能：

```typescript
type OpenClawPluginApi = {
  // 基本信息
  id: string;
  name: string;
  version?: string;
  description?: string;
  source: string;
  
  // 配置
  config: OpenClawConfig;        // 全局配置
  pluginConfig?: Record<string, unknown>; // 插件专属配置
  
  // 运行时
  runtime: PluginRuntime;        // 运行时工具集
  logger: PluginLogger;          // 日志记录器
  
  // 注册方法
  registerTool(tool, opts?): void;
  registerHook(events, handler, opts?): void;
  registerHttpHandler(handler): void;
  registerHttpRoute(params): void;
  registerChannel(registration): void;
  registerProvider(provider): void;
  registerGatewayMethod(method, handler): void;
  registerCli(registrar, opts?): void;
  registerService(service): void;
  registerCommand(command): void;
  
  // 工具函数
  resolvePath(input: string): string;
  
  // 类型安全钩子
  on<K extends PluginHookName>(hookName, handler, opts?): void;
};
```

### Logger 接口

```typescript
api.logger.info("Information message");
api.logger.warn("Warning message");
api.logger.error("Error message");
api.logger.debug?.("Debug message");  // debug 是可选的
```

### PluginRuntime

运行时提供访问核心功能的接口：

```typescript
api.runtime.version;                    // OpenClaw 版本
api.runtime.config.loadConfig();        // 加载配置
api.runtime.media.detectMime(buffer);   // 检测 MIME 类型
api.runtime.tts.textToSpeechTelephony(); // TTS 功能
api.runtime.channel.discord.*;          // Discord 相关函数
api.runtime.channel.telegram.*;         // Telegram 相关函数
// ... 更多
```

## 扩展能力

### 1. 注册工具（Tool）

工具是 AI Agent 可以调用的功能：

```typescript
import { Type } from "@sinclair/typebox";
import { stringEnum } from "openclaw/plugin-sdk";

api.registerTool(
  {
    name: "my_tool",
    label: "My Tool",
    description: "Does something useful",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      limit: Type.Optional(Type.Number({ description: "Max results" })),
      category: Type.Optional(stringEnum(["a", "b", "c"])),
    }),
    async execute(toolCallId, params) {
      const { query, limit = 10 } = params as { query: string; limit?: number };
      
      // 执行工具逻辑
      const results = await doSomething(query, limit);
      
      return {
        content: [{ type: "text", text: `Found ${results.length} items` }],
        details: { count: results.length, results },
      };
    },
  },
  { name: "my_tool", optional: true }
);
```

**工具选项：**

- `name` / `names`: 工具名称（可多个别名）
- `optional`: 是否可选（缺少依赖时不报错）

### 2. 注册渠道（Channel）

消息渠道处理特定平台的消息收发：

```typescript
import type { ChannelPlugin } from "openclaw/plugin-sdk";

const myChannelPlugin: ChannelPlugin = {
  id: "my-channel",
  meta: {
    label: "My Channel",
    shortLabel: "MC",
    defaultEnabled: false,
    features: {
      polls: false,
      reactions: true,
      media: { audio: true, images: true },
    },
  },
  
  // 各种适配器
  configAdapter: { /* 配置适配 */ },
  authAdapter: { /* 认证适配 */ },
  messagingAdapter: { /* 消息发送 */ },
  statusAdapter: { /* 状态检查 */ },
  gatewayAdapter: { /* 网关处理 */ },
  // ...
};

api.registerChannel({ plugin: myChannelPlugin });
```

### 3. 注册 Provider（AI 提供商）

Provider 处理 AI 模型的认证和配置：

```typescript
api.registerProvider({
  id: "my-provider",
  label: "My AI Provider",
  docsPath: "/providers/my-provider",
  aliases: ["myp"],
  envVars: ["MY_PROVIDER_API_KEY"],
  
  auth: [
    {
      id: "api_key",
      label: "API Key",
      kind: "api_key",
      async run(ctx) {
        const key = await ctx.prompter.text({
          message: "Enter your API key:",
        });
        
        return {
          profiles: [
            {
              profileId: `my-provider:${key.slice(0, 8)}`,
              credential: {
                type: "api_key",
                provider: "my-provider",
                apiKey: String(key),
              },
            },
          ],
          defaultModel: "my-provider/default-model",
        };
      },
    },
    {
      id: "oauth",
      label: "OAuth Login",
      kind: "oauth",
      async run(ctx) {
        // OAuth 流程实现
        // 使用 ctx.oauth.createVpsAwareHandlers() 等
      },
    },
  ],
});
```

### 4. 注册 CLI 命令

添加自定义 CLI 命令：

```typescript
api.registerCli(
  ({ program, config, logger }) => {
    const cmd = program
      .command("myplugin")
      .description("My plugin commands");
    
    cmd
      .command("status")
      .description("Show status")
      .action(async () => {
        console.log("Plugin is running!");
      });
    
    cmd
      .command("do-something")
      .argument("<input>", "Input value")
      .option("--verbose", "Verbose output")
      .action(async (input, opts) => {
        if (opts.verbose) {
          logger.info(`Processing: ${input}`);
        }
        // 执行操作
      });
  },
  { commands: ["myplugin"] }
);
```

### 5. 注册 Gateway 方法

添加 Gateway RPC 方法：

```typescript
api.registerGatewayMethod("myplugin.action", async ({ params, respond }) => {
  try {
    const result = await doSomething(params);
    respond(true, { data: result });
  } catch (err) {
    respond(false, { error: err instanceof Error ? err.message : String(err) });
  }
});
```

### 6. 注册 HTTP 路由

添加 HTTP 端点（用于 Webhook 等）：

```typescript
// 方式 1: 路由处理器（推荐）
api.registerHttpRoute({
  path: "/myplugin/webhook",
  async handler(req, res) {
    const body = await parseBody(req);
    // 处理 webhook
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  },
});

// 方式 2: 通用处理器
api.registerHttpHandler(async (req, res) => {
  if (req.url?.startsWith("/myplugin/")) {
    // 处理请求
    return true; // 返回 true 表示已处理
  }
  return false; // 返回 false 继续下一个处理器
});
```

### 7. 注册服务

后台服务在 Gateway 启动时运行：

```typescript
api.registerService({
  id: "my-service",
  async start(ctx) {
    ctx.logger.info("My service starting...");
    // 初始化逻辑
  },
  async stop(ctx) {
    ctx.logger.info("My service stopping...");
    // 清理逻辑
  },
});
```

### 8. 注册自定义命令

绕过 LLM 的快捷命令：

```typescript
api.registerCommand({
  name: "toggle",
  description: "Toggle a feature on/off",
  acceptsArgs: true,
  requireAuth: true, // 默认为 true
  async handler(ctx) {
    const feature = ctx.args?.trim();
    if (!feature) {
      return { text: "Usage: /toggle <feature>" };
    }
    
    // 处理命令
    return { text: `Toggled ${feature}` };
  },
});
```

## 生命周期钩子

使用类型安全的 `api.on()` 注册钩子：

### 可用钩子

| 钩子名称 | 触发时机 | 可修改返回值 |
|---------|---------|-------------|
| `before_agent_start` | Agent 开始前 | 是（注入上下文） |
| `agent_end` | Agent 结束后 | 否 |
| `before_compaction` | 压缩前 | 否 |
| `after_compaction` | 压缩后 | 否 |
| `message_received` | 收到消息时 | 否 |
| `message_sending` | 发送消息前 | 是（修改/取消） |
| `message_sent` | 消息发送后 | 否 |
| `before_tool_call` | 工具调用前 | 是（修改参数/阻止） |
| `after_tool_call` | 工具调用后 | 否 |
| `tool_result_persist` | 工具结果持久化前 | 是（修改消息） |
| `session_start` | 会话开始 | 否 |
| `session_end` | 会话结束 | 否 |
| `gateway_start` | Gateway 启动 | 否 |
| `gateway_stop` | Gateway 停止 | 否 |

### 示例：自动记忆注入

```typescript
// 在 Agent 开始前注入相关记忆
api.on("before_agent_start", async (event, ctx) => {
  if (!event.prompt || event.prompt.length < 5) return;
  
  const memories = await searchMemories(event.prompt);
  if (memories.length === 0) return;
  
  const context = memories
    .map((m) => `- ${m.text}`)
    .join("\n");
  
  return {
    prependContext: `<relevant-memories>\n${context}\n</relevant-memories>`,
  };
});

// 在 Agent 结束后自动捕获重要信息
api.on("agent_end", async (event, ctx) => {
  if (!event.success) return;
  
  // 分析消息并存储重要信息
  for (const msg of event.messages) {
    if (shouldCapture(msg)) {
      await storeMemory(msg);
    }
  }
});
```

### 示例：消息过滤

```typescript
api.on("message_sending", async (event, ctx) => {
  // 检查敏感内容
  if (containsSensitiveData(event.content)) {
    return {
      content: redactSensitiveData(event.content),
    };
  }
  
  // 取消发送
  if (shouldBlock(event.content)) {
    return { cancel: true };
  }
});
```

### 示例：工具调用拦截

```typescript
api.on("before_tool_call", async (event, ctx) => {
  // 记录工具调用
  api.logger.info(`Tool call: ${event.toolName}`);
  
  // 修改参数
  if (event.toolName === "search" && !event.params.limit) {
    return {
      params: { ...event.params, limit: 10 },
    };
  }
  
  // 阻止危险操作
  if (event.toolName === "delete" && !ctx.agentId) {
    return {
      block: true,
      blockReason: "Delete operations require authenticated agent",
    };
  }
});
```

## 最佳实践

### 1. 配置验证

始终使用 `configSchema` 验证配置：

```typescript
// 使用 Zod 进行运行时验证
import { z } from "zod";

const MyConfigSchema = z.object({
  apiKey: z.string().min(1),
  enabled: z.boolean().default(true),
  maxRetries: z.number().min(0).max(10).default(3),
});

register(api) {
  const config = MyConfigSchema.parse(api.pluginConfig);
  // 类型安全的 config
}
```

### 2. 错误处理

优雅处理错误，提供有用的错误信息：

```typescript
try {
  const result = await riskyOperation();
  return { content: [{ type: "text", text: result }] };
} catch (err) {
  api.logger.error(`Operation failed: ${String(err)}`);
  return {
    content: [{ type: "text", text: "Operation failed" }],
    details: { error: err instanceof Error ? err.message : String(err) },
  };
}
```

### 3. 延迟初始化

对于重型资源，使用延迟初始化：

```typescript
let client: HeavyClient | null = null;

const ensureClient = async () => {
  if (!client) {
    client = await createHeavyClient(config);
  }
  return client;
};

// 只在需要时初始化
api.registerTool({
  name: "heavy_operation",
  async execute() {
    const c = await ensureClient();
    return c.doSomething();
  },
});
```

### 4. 清理资源

使用 Service 生命周期管理资源：

```typescript
let connections: Connection[] = [];

api.registerService({
  id: "connection-pool",
  start: async () => {
    connections = await createPool(5);
  },
  stop: async () => {
    await Promise.all(connections.map((c) => c.close()));
    connections = [];
  },
});
```

### 5. 类型安全

使用 TypeScript 严格类型：

```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";

// 使用 Type 构建参数 schema
const params = Type.Object({
  query: Type.String(),
  options: Type.Optional(
    Type.Object({
      limit: Type.Number(),
    })
  ),
});

// 工具返回类型
type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  details?: unknown;
};
```

### 6. 避免 Tool Schema 问题

```typescript
// 错误：不要使用 Type.Union
const BadSchema = Type.Union([Type.String(), Type.Number()]);

// 正确：使用 stringEnum 处理字符串枚举
import { stringEnum, optionalStringEnum } from "openclaw/plugin-sdk";

const GoodSchema = Type.Object({
  category: stringEnum(["a", "b", "c"]),
  optionalCategory: optionalStringEnum(["x", "y"]),
});

// 正确：使用 Type.Optional 而不是 | null
const AlsoGood = Type.Object({
  value: Type.Optional(Type.String()),
});
```

## 示例扩展

### 简单工具扩展

参考 `extensions/llm-task/`：

```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export default function register(api: OpenClawPluginApi) {
  api.registerTool(createLlmTaskTool(api), { optional: true });
}
```

### 渠道扩展

参考 `extensions/telegram/`：

```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { telegramPlugin } from "./src/channel.js";
import { setTelegramRuntime } from "./src/runtime.js";

const plugin = {
  id: "telegram",
  name: "Telegram",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setTelegramRuntime(api.runtime);
    api.registerChannel({ plugin: telegramPlugin });
  },
};

export default plugin;
```

### 完整功能扩展

参考 `extensions/voice-call/` 或 `extensions/memory-lancedb/`，它们展示了：

- 工具注册
- CLI 命令
- Gateway 方法
- HTTP 端点
- 服务生命周期
- 配置验证
- 生命周期钩子

## 调试与测试

### 查看已加载的扩展

```bash
openclaw plugins list
```

### 验证扩展配置

```bash
openclaw plugins validate
```

### 运行扩展测试

```bash
# 在扩展目录运行测试
cd extensions/my-plugin
pnpm test
```

### 调试日志

在配置中启用详细日志：

```yaml
# ~/.openclaw/config.yaml
logging:
  level: debug
```

## 发布扩展

1. 确保 `package.json` 配置正确
2. 添加必要的文档（README.md）
3. 运行测试确保质量
4. 发布到 npm（如需要）

```bash
cd extensions/my-plugin
npm publish --access public
```

用户可以通过配置加载外部扩展：

```yaml
# ~/.openclaw/config.yaml
plugins:
  loadPaths:
    - /path/to/my-plugin
```

---

更多信息请参考现有扩展的源代码，特别是：

- `extensions/telegram/` - 简单渠道示例
- `extensions/twitch/` - 复杂渠道示例
- `extensions/voice-call/` - 完整功能示例
- `extensions/memory-lancedb/` - 内存插件示例
- `extensions/google-antigravity-auth/` - Provider 示例
