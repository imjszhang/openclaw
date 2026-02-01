# OpenClaw 自定义 Channel 开发指南

> 编写日期：2026-02-01  
> 本文档详细介绍如何为 OpenClaw 开发自定义消息渠道（Channel）插件

---

## 目录

1. [概述](#1-概述)
2. [实现方式选择](#2-实现方式选择)
3. [插件目录结构](#3-插件目录结构)
4. [核心类型定义](#4-核心类型定义)
5. [必需适配器详解](#5-必需适配器详解)
6. [可选适配器详解](#6-可选适配器详解)
7. [完整实现示例](#7-完整实现示例)
8. [配置结构](#8-配置结构)
9. [插件发现与加载](#9-插件发现与加载)
10. [测试与调试](#10-测试与调试)
11. [常见问题](#11-常见问题)
12. [参考资源](#12-参考资源)

---

## 1. 概述

### 1.1 什么是 Channel

Channel（渠道）是 OpenClaw 中消息来源和目标的抽象。每个 Channel 代表一种消息平台，例如：

- **Telegram** - Bot API 消息机器人
- **WhatsApp** - Web 协议（Baileys）
- **Discord** - Bot API
- **Signal** - signal-cli
- **Matrix** - matrix-js-sdk

### 1.2 Channel 的职责

一个 Channel 插件需要处理以下职责：

| 职责 | 说明 |
|------|------|
| **消息接收** | 监听来自平台的消息，转发给 OpenClaw 处理 |
| **消息发送** | 将 OpenClaw 的回复发送到目标平台 |
| **配置管理** | 解析和验证 Channel 配置 |
| **状态检查** | 提供健康检查和诊断信息 |
| **访问控制** | 实现 DM 策略、群组策略等安全机制 |

### 1.3 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenClaw Gateway                        │
├─────────────────────────────────────────────────────────────┤
│                     Channel Manager                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Telegram │  │ WhatsApp │  │ Discord  │  │ MyChannel│    │
│  │  Plugin  │  │  Plugin  │  │  Plugin  │  │  Plugin  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
   Telegram API  WhatsApp Web   Discord API   Your API
```

---

## 2. 实现方式选择

### 2.1 两种实现方式

#### 方式 A：核心 Channel（Core Channel）

- **位置**：`src/telegram/`, `src/discord/` 等
- **特点**：内置在核心代码库中，随 OpenClaw 一起发布
- **适用**：官方支持的渠道
- **优点**：深度集成，性能最优
- **缺点**：需要修改核心代码，合并到主仓库

#### 方式 B：插件 Channel（Extension Plugin）⭐ 推荐

- **位置**：`extensions/` 目录或 `~/.openclaw/extensions/`
- **特点**：独立插件，可单独开发和分发
- **适用**：自定义渠道、第三方渠道、实验性渠道
- **优点**：独立开发、易于分发、无需修改核心代码
- **缺点**：无

### 2.2 选择建议

| 场景 | 推荐方式 |
|------|----------|
| 个人/团队内部使用 | 插件方式 |
| 开源社区贡献 | 插件方式（可后续合并） |
| 官方支持的主流平台 | 核心方式 |
| 实验性功能验证 | 插件方式 |

---

## 3. 插件目录结构

### 3.1 标准目录结构

```
extensions/my-channel/
├── index.ts                    # 插件入口文件
├── openclaw.plugin.json        # 插件清单（必需）
├── package.json                # 包配置
├── README.md                   # 说明文档
└── src/
    ├── channel.ts              # Channel 插件实现
    ├── runtime.ts              # 运行时依赖注入
    ├── config.ts               # 配置相关逻辑
    ├── monitor.ts              # 消息监听器
    └── types.ts                # 类型定义
```

### 3.2 插件清单 (`openclaw.plugin.json`)

```json
{
  "id": "mychannel",
  "channels": ["mychannel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 插件唯一标识符 |
| `channels` | string[] | 该插件注册的 Channel ID 列表 |
| `configSchema` | object | 插件配置的 JSON Schema |

### 3.3 包配置 (`package.json`)

```json
{
  "name": "@openclaw/my-channel",
  "version": "2026.2.1",
  "type": "module",
  "description": "OpenClaw custom channel plugin",
  "openclaw": {
    "extensions": ["./index.ts"]
  },
  "dependencies": {
    "my-platform-sdk": "^1.0.0"
  },
  "peerDependencies": {
    "openclaw": "*"
  }
}
```

**重要注意事项**：
- 使用 `peerDependencies` 而非 `dependencies` 引用 `openclaw`
- 运行时依赖放在 `dependencies`
- 开发依赖放在 `devDependencies`

---

## 4. 核心类型定义

### 4.1 ChannelPlugin 主类型

```typescript
type ChannelPlugin<ResolvedAccount = any> = {
  id: ChannelId;                      // Channel 唯一标识
  meta: ChannelMeta;                  // 元数据
  capabilities: ChannelCapabilities;  // 能力声明
  defaults?: {                        // 默认值
    queue?: { debounceMs?: number };
  };
  reload?: {                          // 热重载配置
    configPrefixes: string[];
    noopPrefixes?: string[];
  };
  
  // 必需适配器
  config: ChannelConfigAdapter<ResolvedAccount>;
  
  // 可选适配器
  onboarding?: ChannelOnboardingAdapter;
  configSchema?: ChannelConfigSchema;
  setup?: ChannelSetupAdapter;
  pairing?: ChannelPairingAdapter;
  security?: ChannelSecurityAdapter<ResolvedAccount>;
  groups?: ChannelGroupAdapter;
  mentions?: ChannelMentionAdapter;
  outbound?: ChannelOutboundAdapter;
  status?: ChannelStatusAdapter<ResolvedAccount>;
  gateway?: ChannelGatewayAdapter<ResolvedAccount>;
  auth?: ChannelAuthAdapter;
  elevated?: ChannelElevatedAdapter;
  commands?: ChannelCommandAdapter;
  streaming?: ChannelStreamingAdapter;
  threading?: ChannelThreadingAdapter;
  messaging?: ChannelMessagingAdapter;
  agentPrompt?: ChannelAgentPromptAdapter;
  directory?: ChannelDirectoryAdapter;
  resolver?: ChannelResolverAdapter;
  actions?: ChannelMessageActionAdapter;
  heartbeat?: ChannelHeartbeatAdapter;
  agentTools?: ChannelAgentToolFactory | ChannelAgentTool[];
};
```

### 4.2 ChannelMeta 元数据

```typescript
type ChannelMeta = {
  id: ChannelId;                    // Channel ID
  label: string;                    // 显示名称
  selectionLabel: string;           // 选择列表中的标签
  docsPath: string;                 // 文档路径
  docsLabel?: string;               // 文档标签
  blurb: string;                    // 简短描述
  order?: number;                   // 排序权重
  aliases?: string[];               // 别名
  selectionDocsPrefix?: string;     // 选择文档前缀
  selectionDocsOmitLabel?: boolean; // 是否省略标签
  selectionExtras?: string[];       // 额外选择项
  detailLabel?: string;             // 详细标签
  systemImage?: string;             // 系统图标名称
  showConfigured?: boolean;         // 是否显示配置状态
  quickstartAllowFrom?: boolean;    // 快速开始时允许配置 allowFrom
  forceAccountBinding?: boolean;    // 强制账户绑定
  preferOver?: string[];            // 优先于其他 Channel
};
```

### 4.3 ChannelCapabilities 能力声明

```typescript
type ChannelCapabilities = {
  chatTypes: Array<"direct" | "group" | "channel" | "thread">;
  polls?: boolean;           // 支持投票
  reactions?: boolean;       // 支持表情回应
  edit?: boolean;            // 支持编辑消息
  unsend?: boolean;          // 支持撤回消息
  reply?: boolean;           // 支持回复
  effects?: boolean;         // 支持消息效果
  groupManagement?: boolean; // 支持群组管理
  threads?: boolean;         // 支持线程
  media?: boolean;           // 支持媒体消息
  nativeCommands?: boolean;  // 支持原生命令
  blockStreaming?: boolean;  // 支持块流式响应
};
```

---

## 5. 必需适配器详解

### 5.1 config 适配器（必需）

配置适配器是唯一必须实现的适配器，用于管理 Channel 配置。

```typescript
type ChannelConfigAdapter<ResolvedAccount> = {
  // 必需：列出所有账户 ID
  listAccountIds: (cfg: OpenClawConfig) => string[];
  
  // 必需：解析账户配置
  resolveAccount: (cfg: OpenClawConfig, accountId?: string | null) => ResolvedAccount;
  
  // 可选：获取默认账户 ID
  defaultAccountId?: (cfg: OpenClawConfig) => string;
  
  // 可选：设置账户启用状态
  setAccountEnabled?: (params: {
    cfg: OpenClawConfig;
    accountId: string;
    enabled: boolean;
  }) => OpenClawConfig;
  
  // 可选：删除账户
  deleteAccount?: (params: {
    cfg: OpenClawConfig;
    accountId: string;
  }) => OpenClawConfig;
  
  // 可选：检查是否启用
  isEnabled?: (account: ResolvedAccount, cfg: OpenClawConfig) => boolean;
  
  // 可选：禁用原因
  disabledReason?: (account: ResolvedAccount, cfg: OpenClawConfig) => string;
  
  // 可选：检查是否已配置
  isConfigured?: (account: ResolvedAccount, cfg: OpenClawConfig) => boolean | Promise<boolean>;
  
  // 可选：未配置原因
  unconfiguredReason?: (account: ResolvedAccount, cfg: OpenClawConfig) => string;
  
  // 可选：描述账户
  describeAccount?: (account: ResolvedAccount, cfg: OpenClawConfig) => ChannelAccountSnapshot;
  
  // 可选：解析 allowFrom 列表
  resolveAllowFrom?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
  }) => string[] | undefined;
  
  // 可选：格式化 allowFrom 列表
  formatAllowFrom?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    allowFrom: Array<string | number>;
  }) => string[];
};
```

**实现示例**：

```typescript
const config: ChannelConfigAdapter<MyResolvedAccount> = {
  listAccountIds: (cfg) => {
    const accounts = cfg.channels?.mychannel?.accounts ?? {};
    return Object.keys(accounts).length > 0
      ? Object.keys(accounts)
      : ["default"];
  },
  
  resolveAccount: (cfg, accountId) => {
    const id = accountId ?? "default";
    const accountConfig = cfg.channels?.mychannel?.accounts?.[id];
    const baseConfig = cfg.channels?.mychannel;
    
    return {
      accountId: id,
      enabled: accountConfig?.enabled ?? baseConfig?.enabled ?? false,
      token: accountConfig?.token ?? baseConfig?.token,
      config: {
        dmPolicy: accountConfig?.dmPolicy ?? baseConfig?.dmPolicy ?? "pairing",
        allowFrom: accountConfig?.allowFrom ?? baseConfig?.allowFrom ?? [],
      },
    };
  },
  
  defaultAccountId: (cfg) => "default",
  
  isConfigured: (account) => Boolean(account.token?.trim()),
  
  describeAccount: (account) => ({
    accountId: account.accountId,
    enabled: account.enabled,
    configured: Boolean(account.token?.trim()),
  }),
};
```

### 5.2 outbound 适配器（推荐）

发送消息适配器，用于向平台发送消息。

```typescript
type ChannelOutboundAdapter = {
  // 必需：发送模式
  // - "direct": 直接发送（CLI/本地）
  // - "gateway": 通过 Gateway 发送
  // - "hybrid": 混合模式
  deliveryMode: "direct" | "gateway" | "hybrid";
  
  // 可选：文本分块器
  chunker?: ((text: string, limit: number) => string[]) | null;
  chunkerMode?: "text" | "markdown";
  textChunkLimit?: number;
  pollMaxOptions?: number;
  
  // 可选：解析发送目标
  resolveTarget?: (params: {
    cfg?: OpenClawConfig;
    to?: string;
    allowFrom?: string[];
    accountId?: string | null;
    mode?: ChannelOutboundTargetMode;
  }) => { ok: true; to: string } | { ok: false; error: Error };
  
  // 可选：发送完整 payload
  sendPayload?: (ctx: ChannelOutboundPayloadContext) => Promise<OutboundDeliveryResult>;
  
  // 推荐：发送文本消息
  sendText?: (ctx: ChannelOutboundContext) => Promise<OutboundDeliveryResult>;
  
  // 可选：发送媒体消息
  sendMedia?: (ctx: ChannelOutboundContext) => Promise<OutboundDeliveryResult>;
  
  // 可选：发送投票
  sendPoll?: (ctx: ChannelPollContext) => Promise<ChannelPollResult>;
};
```

**实现示例**：

```typescript
const outbound: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  textChunkLimit: 4000,
  
  sendText: async ({ to, text, accountId, replyToId }) => {
    try {
      const client = getMyPlatformClient(accountId);
      await client.sendMessage(to, text, { replyTo: replyToId });
      return { ok: true, channel: "mychannel" };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  },
  
  sendMedia: async ({ to, text, mediaUrl, accountId }) => {
    try {
      const client = getMyPlatformClient(accountId);
      await client.sendMedia(to, mediaUrl, { caption: text });
      return { ok: true, channel: "mychannel" };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  },
};
```

### 5.3 meta 元数据（推荐）

定义 Channel 的显示信息和行为。

```typescript
const meta: ChannelMeta = {
  id: "mychannel",
  label: "MyChannel",
  selectionLabel: "MyChannel (API)",
  docsPath: "/channels/mychannel",
  blurb: "My custom messaging channel for XYZ platform.",
  aliases: ["my", "mc"],
  order: 100,  // 数字越小越靠前
  quickstartAllowFrom: true,
};
```

### 5.4 capabilities 能力声明（推荐）

声明 Channel 支持的功能。

```typescript
const capabilities: ChannelCapabilities = {
  chatTypes: ["direct", "group"],
  reactions: true,
  threads: false,
  media: true,
  nativeCommands: true,
  blockStreaming: true,
};
```

---

## 6. 可选适配器详解

### 6.1 security 适配器

处理 DM 策略和访问控制。

```typescript
type ChannelSecurityAdapter<ResolvedAccount> = {
  // 解析 DM 策略
  resolveDmPolicy?: (ctx: ChannelSecurityContext<ResolvedAccount>) => ChannelSecurityDmPolicy;
  
  // 收集安全警告
  collectWarnings?: (ctx: ChannelSecurityContext<ResolvedAccount>) => string[];
};
```

**实现示例**：

```typescript
const security: ChannelSecurityAdapter<MyResolvedAccount> = {
  resolveDmPolicy: ({ cfg, accountId, account }) => ({
    policy: account.config.dmPolicy ?? "pairing",
    allowFrom: account.config.allowFrom ?? [],
    policyPath: `channels.mychannel.dmPolicy`,
    allowFromPath: "channels.mychannel.",
    approveHint: "pnpm openclaw pairing approve mychannel <CODE>",
    normalizeEntry: (raw) => raw.toLowerCase().trim(),
  }),
  
  collectWarnings: ({ account, cfg }) => {
    const warnings: string[] = [];
    if (account.config.dmPolicy === "open") {
      warnings.push("警告：dmPolicy 设置为 open，任何人都可以发送消息");
    }
    return warnings;
  },
};
```

### 6.2 gateway 适配器

处理 Gateway 中的启动/停止/登录。

```typescript
type ChannelGatewayAdapter<ResolvedAccount> = {
  // 启动账户监听
  startAccount?: (ctx: ChannelGatewayContext<ResolvedAccount>) => Promise<unknown>;
  
  // 停止账户监听
  stopAccount?: (ctx: ChannelGatewayContext<ResolvedAccount>) => Promise<void>;
  
  // 二维码登录开始
  loginWithQrStart?: (params: {
    accountId?: string;
    force?: boolean;
    timeoutMs?: number;
    verbose?: boolean;
  }) => Promise<ChannelLoginWithQrStartResult>;
  
  // 等待二维码扫描完成
  loginWithQrWait?: (params: {
    accountId?: string;
    timeoutMs?: number;
  }) => Promise<ChannelLoginWithQrWaitResult>;
  
  // 登出账户
  logoutAccount?: (ctx: ChannelLogoutContext<ResolvedAccount>) => Promise<ChannelLogoutResult>;
};
```

**实现示例**：

```typescript
const gateway: ChannelGatewayAdapter<MyResolvedAccount> = {
  startAccount: async ({ cfg, accountId, account, abortSignal, log, setStatus }) => {
    log?.info(`Starting mychannel account: ${accountId}`);
    
    const client = createMyPlatformClient({
      token: account.token,
      onMessage: async (message) => {
        // 处理收到的消息
        await handleIncomingMessage(message, cfg);
      },
    });
    
    // 监听中断信号
    abortSignal.addEventListener("abort", () => {
      client.disconnect();
    });
    
    await client.connect();
    
    setStatus({
      accountId,
      running: true,
      connected: true,
      lastStartAt: Date.now(),
    });
    
    return client;
  },
  
  stopAccount: async ({ accountId, log }) => {
    log?.info(`Stopping mychannel account: ${accountId}`);
    // 清理资源
  },
};
```

### 6.3 status 适配器

提供状态检查和诊断。

```typescript
type ChannelStatusAdapter<ResolvedAccount> = {
  // 默认运行时状态
  defaultRuntime?: ChannelAccountSnapshot;
  
  // 构建 Channel 摘要
  buildChannelSummary?: (params: {
    account: ResolvedAccount;
    cfg: OpenClawConfig;
    defaultAccountId: string;
    snapshot: ChannelAccountSnapshot;
  }) => Record<string, unknown> | Promise<Record<string, unknown>>;
  
  // 探测账户状态
  probeAccount?: (params: {
    account: ResolvedAccount;
    timeoutMs: number;
    cfg: OpenClawConfig;
  }) => Promise<unknown>;
  
  // 审计账户配置
  auditAccount?: (params: {
    account: ResolvedAccount;
    timeoutMs: number;
    cfg: OpenClawConfig;
    probe?: unknown;
  }) => Promise<unknown>;
  
  // 构建账户快照
  buildAccountSnapshot?: (params: {
    account: ResolvedAccount;
    cfg: OpenClawConfig;
    runtime?: ChannelAccountSnapshot;
    probe?: unknown;
    audit?: unknown;
  }) => ChannelAccountSnapshot | Promise<ChannelAccountSnapshot>;
  
  // 收集状态问题
  collectStatusIssues?: (accounts: ChannelAccountSnapshot[]) => ChannelStatusIssue[];
};
```

**实现示例**：

```typescript
const status: ChannelStatusAdapter<MyResolvedAccount> = {
  defaultRuntime: {
    accountId: "default",
    running: false,
    lastStartAt: null,
    lastStopAt: null,
    lastError: null,
  },
  
  probeAccount: async ({ account, timeoutMs }) => {
    try {
      const client = createMyPlatformClient({ token: account.token });
      const me = await client.getMe({ timeout: timeoutMs });
      return { ok: true, user: me };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  },
  
  buildAccountSnapshot: ({ account, runtime, probe }) => ({
    accountId: account.accountId,
    configured: Boolean(account.token?.trim()),
    enabled: account.enabled,
    running: runtime?.running ?? false,
    lastStartAt: runtime?.lastStartAt ?? null,
    lastError: runtime?.lastError ?? null,
    probe,
  }),
  
  collectStatusIssues: (accounts) => {
    const issues: ChannelStatusIssue[] = [];
    for (const account of accounts) {
      if (!account.configured) {
        issues.push({
          channel: "mychannel",
          accountId: account.accountId,
          kind: "config",
          message: "Token not configured",
          fix: "Set channels.mychannel.token in config",
        });
      }
    }
    return issues;
  },
};
```

### 6.4 pairing 适配器

处理配对流程。

```typescript
type ChannelPairingAdapter = {
  // ID 标签（用于 CLI 提示）
  idLabel: string;
  
  // 规范化 allowFrom 条目
  normalizeAllowEntry?: (entry: string) => string;
  
  // 通知配对批准
  notifyApproval?: (params: {
    cfg: OpenClawConfig;
    id: string;
    runtime?: RuntimeEnv;
  }) => Promise<void>;
};
```

**实现示例**：

```typescript
const pairing: ChannelPairingAdapter = {
  idLabel: "myChannelUserId",
  
  normalizeAllowEntry: (entry) => entry.toLowerCase().trim(),
  
  notifyApproval: async ({ cfg, id }) => {
    const client = getMyPlatformClient(cfg);
    await client.sendMessage(id, "✅ 配对已批准！现在可以开始对话了。");
  },
};
```

### 6.5 setup 适配器

处理设置向导。

```typescript
type ChannelSetupAdapter = {
  // 解析账户 ID
  resolveAccountId?: (params: {
    cfg: OpenClawConfig;
    accountId?: string;
  }) => string;
  
  // 应用账户名称
  applyAccountName?: (params: {
    cfg: OpenClawConfig;
    accountId: string;
    name?: string;
  }) => OpenClawConfig;
  
  // 应用账户配置
  applyAccountConfig: (params: {
    cfg: OpenClawConfig;
    accountId: string;
    input: ChannelSetupInput;
  }) => OpenClawConfig;
  
  // 验证输入
  validateInput?: (params: {
    cfg: OpenClawConfig;
    accountId: string;
    input: ChannelSetupInput;
  }) => string | null;
};
```

### 6.6 其他适配器

| 适配器 | 用途 |
|--------|------|
| `onboarding` | CLI 引导向导 |
| `groups` | 群组管理（requireMention、toolPolicy） |
| `mentions` | @提及处理 |
| `threading` | 线程支持 |
| `streaming` | 流式响应 |
| `messaging` | 消息规范化和目标解析 |
| `directory` | 联系人/群组目录 |
| `resolver` | 目标解析（用户名→ID） |
| `actions` | 消息操作（回复、转发、置顶等） |
| `heartbeat` | 心跳检测 |
| `commands` | 原生命令处理 |
| `auth` | 认证/登录流程 |
| `elevated` | 提升权限 |
| `agentTools` | 提供给 Agent 的工具 |
| `agentPrompt` | Agent 提示词定制 |

---

## 7. 完整实现示例

### 7.1 最小实现

```typescript
// extensions/mychannel/index.ts
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { myChannelPlugin } from "./src/channel.js";

const plugin = {
  id: "mychannel",
  name: "MyChannel",
  description: "My custom channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    api.registerChannel({ plugin: myChannelPlugin });
  },
};

export default plugin;
```

```typescript
// extensions/mychannel/src/channel.ts
import type { ChannelPlugin } from "openclaw/plugin-sdk";

type MyResolvedAccount = {
  accountId: string;
  enabled: boolean;
  token?: string;
  config: {
    dmPolicy: string;
    allowFrom: string[];
  };
};

export const myChannelPlugin: ChannelPlugin<MyResolvedAccount> = {
  id: "mychannel",
  
  meta: {
    id: "mychannel",
    label: "MyChannel",
    selectionLabel: "MyChannel (API)",
    docsPath: "/channels/mychannel",
    blurb: "My custom messaging channel.",
    aliases: ["my"],
  },
  
  capabilities: {
    chatTypes: ["direct"],
  },
  
  config: {
    listAccountIds: (cfg) => {
      const accounts = cfg.channels?.mychannel?.accounts ?? {};
      return Object.keys(accounts).length > 0
        ? Object.keys(accounts)
        : ["default"];
    },
    
    resolveAccount: (cfg, accountId) => {
      const id = accountId ?? "default";
      const base = cfg.channels?.mychannel;
      const account = base?.accounts?.[id];
      
      return {
        accountId: id,
        enabled: account?.enabled ?? base?.enabled ?? false,
        token: account?.token ?? base?.token,
        config: {
          dmPolicy: account?.dmPolicy ?? base?.dmPolicy ?? "pairing",
          allowFrom: account?.allowFrom ?? base?.allowFrom ?? [],
        },
      };
    },
    
    isConfigured: (account) => Boolean(account.token?.trim()),
    
    describeAccount: (account) => ({
      accountId: account.accountId,
      enabled: account.enabled,
      configured: Boolean(account.token?.trim()),
    }),
  },
  
  outbound: {
    deliveryMode: "direct",
    textChunkLimit: 4000,
    
    sendText: async ({ to, text }) => {
      // 实现发送逻辑
      console.log(`Sending to ${to}: ${text}`);
      return { ok: true, channel: "mychannel" };
    },
  },
};
```

### 7.2 完整功能实现

参考以下现有实现：

| Channel | 复杂度 | 特点 |
|---------|--------|------|
| `extensions/telegram/` | 简单 | Bot API，无需扫码 |
| `extensions/discord/` | 简单 | Bot API，无需扫码 |
| `extensions/whatsapp/` | 中等 | 需要扫码登录，多账户 |
| `extensions/matrix/` | 复杂 | 完整功能实现 |
| `extensions/signal/` | 中等 | 需要 signal-cli |

---

## 8. 配置结构

### 8.1 基础配置

Channel 配置位于 `channels.<id>`：

```json5
{
  "channels": {
    "mychannel": {
      "enabled": true,
      "token": "YOUR_TOKEN",
      "dmPolicy": "pairing",
      "allowFrom": ["user1", "user2"]
    }
  }
}
```

### 8.2 多账户配置

```json5
{
  "channels": {
    "mychannel": {
      "accounts": {
        "default": {
          "enabled": true,
          "token": "TOKEN_1",
          "dmPolicy": "allowlist",
          "allowFrom": ["user1"]
        },
        "work": {
          "enabled": true,
          "token": "TOKEN_2",
          "dmPolicy": "pairing"
        }
      }
    }
  }
}
```

### 8.3 群组配置

```json5
{
  "channels": {
    "mychannel": {
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["user1", "user2"],
      "groups": {
        "*": {
          "requireMention": true
        },
        "group-123": {
          "requireMention": false,
          "allowFrom": ["admin1"]
        }
      }
    }
  }
}
```

### 8.4 DM 策略选项

| 策略 | 说明 |
|------|------|
| `pairing` | 未知发送者收到配对码，需手动批准 |
| `allowlist` | 只允许 `allowFrom` 列表中的用户 |
| `open` | 允许所有人（需设置 `allowFrom: ["*"]`） |
| `disabled` | 禁用 DM |

---

## 9. 插件发现与加载

### 9.1 发现顺序

插件按以下顺序扫描（优先级从高到低）：

1. **配置路径**：`plugins.load.paths`
2. **工作区扩展**：`<workspace>/.openclaw/extensions/`
3. **全局扩展**：`~/.openclaw/extensions/`
4. **内置扩展**：`<openclaw>/extensions/`（需显式启用）

### 9.2 启用插件

内置插件默认禁用，需要显式启用：

```bash
# 启用内置插件
pnpm openclaw plugins enable mychannel

# 或在配置中启用
```

```json5
{
  "plugins": {
    "entries": {
      "mychannel": {
        "enabled": true
      }
    }
  }
}
```

### 9.3 加载自定义路径

```json5
{
  "plugins": {
    "load": {
      "paths": [
        "/path/to/my-channel-plugin",
        "~/my-plugins/another-channel.ts"
      ]
    }
  }
}
```

---

## 10. 测试与调试

### 10.1 检查插件加载

```bash
# 查看已加载的插件
pnpm openclaw plugins list

# 查看插件诊断信息
pnpm openclaw plugins diagnose
```

### 10.2 检查 Channel 状态

```bash
# 基础状态
pnpm openclaw channels status

# 深度检查（带探测）
pnpm openclaw channels status --probe

# 查看特定 Channel
pnpm openclaw channels status mychannel
```

### 10.3 查看日志

```bash
# 查看 Gateway 日志
pnpm openclaw logs --follow

# 查看详细日志
DEBUG=openclaw:* pnpm openclaw gateway run
```

### 10.4 测试发送

```bash
# 测试发送消息
pnpm openclaw message send --channel mychannel --to "user123" --text "Hello"
```

### 10.5 健康检查

```bash
# 运行诊断
pnpm openclaw doctor

# 健康检查
pnpm openclaw health
```

### 10.6 单元测试

```typescript
// extensions/mychannel/src/channel.test.ts
import { describe, it, expect } from "vitest";
import { myChannelPlugin } from "./channel.js";

describe("myChannelPlugin", () => {
  it("should resolve account correctly", () => {
    const cfg = {
      channels: {
        mychannel: {
          token: "test-token",
          enabled: true,
        },
      },
    };
    
    const account = myChannelPlugin.config.resolveAccount(cfg, "default");
    expect(account.token).toBe("test-token");
    expect(account.enabled).toBe(true);
  });
  
  it("should list account ids", () => {
    const cfg = {
      channels: {
        mychannel: {
          accounts: {
            account1: {},
            account2: {},
          },
        },
      },
    };
    
    const ids = myChannelPlugin.config.listAccountIds(cfg);
    expect(ids).toContain("account1");
    expect(ids).toContain("account2");
  });
});
```

---

## 11. 常见问题

### 11.1 插件未被发现

**问题**：插件目录正确但未加载

**解决方案**：
1. 确保有 `openclaw.plugin.json` 清单文件
2. 确保 `package.json` 中有 `openclaw.extensions` 字段
3. 检查文件权限
4. 运行 `pnpm openclaw plugins diagnose` 查看诊断信息

### 11.2 Channel 显示 "not configured"

**问题**：Channel 状态显示未配置

**解决方案**：
1. 确保 `config.isConfigured` 返回正确值
2. 检查必需的配置项是否已设置
3. 查看 `unconfiguredReason` 的返回值

### 11.3 消息发送失败

**问题**：`outbound.sendText` 返回错误

**解决方案**：
1. 检查 token/凭证是否有效
2. 检查网络连接
3. 查看 `lastError` 中的错误信息
4. 启用 verbose 日志排查

### 11.4 Gateway 启动失败

**问题**：`gateway.startAccount` 抛出异常

**解决方案**：
1. 检查 `abortSignal` 处理是否正确
2. 确保资源清理正确
3. 检查异步操作是否有未处理的 Promise

### 11.5 配对不工作

**问题**：用户发送消息后没有收到配对码

**解决方案**：
1. 确保 `security.resolveDmPolicy` 返回正确的 policy
2. 确保 `pairing.notifyApproval` 实现正确
3. 检查 `dmPolicy` 配置是否为 `pairing`

---

## 12. 参考资源

### 12.1 代码示例

| 文件 | 说明 |
|------|------|
| `extensions/telegram/src/channel.ts` | Telegram 实现（简单） |
| `extensions/discord/src/channel.ts` | Discord 实现（简单） |
| `extensions/whatsapp/src/channel.ts` | WhatsApp 实现（中等） |
| `extensions/matrix/src/channel.ts` | Matrix 实现（复杂） |

### 12.2 类型定义

| 文件 | 说明 |
|------|------|
| `src/channels/plugins/types.plugin.ts` | ChannelPlugin 主类型 |
| `src/channels/plugins/types.adapters.ts` | 适配器类型定义 |
| `src/channels/plugins/types.core.ts` | 核心类型定义 |

### 12.3 文档链接

- 插件开发指南：`docs/plugin.md`
- Channel 部署指南：`docs/githubforker/channel-deployment-guide.md`
- 测试指南：`docs/testing.md`

### 12.4 内部模块

| 模块 | 说明 |
|------|------|
| `src/channels/registry.ts` | Channel 注册表 |
| `src/channels/dock.ts` | Channel 对接层 |
| `src/plugins/loader.ts` | 插件加载器 |
| `src/plugins/discovery.ts` | 插件发现 |
| `src/gateway/server-channels.ts` | Gateway Channel 管理 |

---

*文档编写：2026-02-01*
