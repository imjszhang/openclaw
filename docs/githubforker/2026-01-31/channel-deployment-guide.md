# OpenClaw 消息渠道部署指南

> 编写日期：2026-01-31  
> 更新日期：2026-02-08  
> 适用场景：WhatsApp、Telegram、Discord、飞书/Lark 等消息渠道的配置与部署

---

## 目录

1. [前提条件](#1-前提条件)
2. [渠道概览](#2-渠道概览)
3. [Telegram 部署](#3-telegram-部署)
4. [WhatsApp 部署](#4-whatsapp-部署)
5. [Discord 部署](#5-discord-部署)
6. [Signal 部署](#6-signal-部署)
7. [飞书/Lark 部署](#7-飞书lark-部署)
8. [其他渠道](#8-其他渠道)
9. [DM 策略与访问控制](#9-dm-策略与访问控制)
10. [状态检查与故障排除](#10-状态检查与故障排除)
11. [相关文档](#11-相关文档)

---

## 1. 前提条件

在配置消息渠道之前，需要先完成基础部署。参考 [Fork 管理与生产部署指南](./fork-management-guide.md)。

### 1.1 确认 Gateway 已配置

```bash
# 检查 Gateway 配置
pnpm openclaw config get gateway.mode
# 应返回: local

# 检查 Gateway Token（Dashboard 访问必需）
pnpm openclaw config get gateway.auth.token
```

### 1.2 确认 AI 模型已配置

```bash
# 检查模型状态
pnpm openclaw models status
```

如果未配置，运行：

```bash
pnpm openclaw onboard
```

### 1.3 确认 Gateway 已启动

```bash
# 检查健康状态
pnpm openclaw health

# 检查渠道状态
pnpm openclaw channels status
```

---

## 2. 渠道概览

### 2.1 支持的渠道

| 渠道          | 类型          | 难度          | 说明                                       |
| ------------- | ------------- | ------------- | ------------------------------------------ |
| **Telegram**  | Bot API       | ⭐ 最简单     | 只需 BotFather token                       |
| **WhatsApp**  | Web (Baileys) | ⭐⭐ 中等     | 需要扫码登录 + 真实手机号                  |
| **Discord**   | Bot API       | ⭐⭐ 中等     | 需要创建应用 + Bot                         |
| **Signal**    | signal-cli    | ⭐⭐⭐ 较复杂 | 需要安装 signal-cli                        |
| **飞书/Lark** | 开放平台 SDK  | ⭐⭐ 中等     | 需要创建自建应用，支持文档/知识库/云盘工具 |
| **Slack**     | Bolt SDK      | ⭐⭐ 中等     | 需要创建 Slack App                         |
| **iMessage**  | macOS 原生    | ⭐⭐⭐ 较复杂 | 仅限 macOS                                 |

### 2.2 推荐顺序

1. **Telegram** - 最快上手，功能完整
2. **飞书/Lark** - 企业场景首选，内置文档/知识库工具集成
3. **WhatsApp** - 最常用，但配置稍复杂
4. **Discord** - 适合技术社区

### 2.3 渠道可以同时运行

多个渠道可以同时启用，OpenClaw 会根据消息来源自动路由回复。

---

## 3. Telegram 部署

Telegram 是最简单的渠道，只需要一个 Bot Token。

### 3.1 创建 Bot（BotFather）

1. 在 Telegram 搜索 **@BotFather** 并开始对话
2. 发送 `/newbot`
3. 按提示输入：
   - Bot 显示名称（任意）
   - Bot 用户名（必须以 `bot` 结尾，如 `my_assistant_bot`）
4. 复制返回的 **Token**（格式如 `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 3.2 配置 Token

**方式 A：命令行配置（推荐）**

```bash
pnpm openclaw config set channels.telegram.botToken "你的token"
pnpm openclaw config set channels.telegram.enabled true
pnpm openclaw config set channels.telegram.dmPolicy pairing
```

**方式 B：直接编辑配置文件**

编辑 `~/.openclaw/openclaw.json`：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
      dmPolicy: "pairing",
    },
  },
}
```

### 3.3 重启 Gateway

```bash
pnpm openclaw gateway restart
```

### 3.4 测试连接

1. 在 Telegram 找到你的 Bot 并发送消息
2. 首次会收到**配对码**（pairing 模式）
3. 批准配对：

```bash
# 查看待配对列表
pnpm openclaw pairing list telegram

# 批准配对
pnpm openclaw pairing approve telegram <CODE>
```

### 3.5 可选配置

#### 使用 allowlist 代替 pairing

如果想跳过配对流程，可以使用 allowlist 模式：

```bash
# 设置为 allowlist 模式
pnpm openclaw config set channels.telegram.dmPolicy allowlist

# 添加允许的用户 ID
pnpm openclaw config set channels.telegram.allowFrom '["123456789"]'
```

**获取 Telegram 用户 ID：**

- 私聊 `@userinfobot` 或 `@getidsbot`
- 或查看 Gateway 日志：`pnpm openclaw logs --follow`

#### 群组配置

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: true }, // 所有群组需要 @提及
        "-1001234567890": { requireMention: false }, // 特定群组始终响应
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"], // 群组中允许的用户
    },
  },
}
```

### 3.6 完整配置示例

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
      dmPolicy: "allowlist",
      allowFrom: ["123456789"],
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
    },
  },
}
```

---

## 4. WhatsApp 部署

WhatsApp 使用 Web 协议（Baileys），需要扫码登录。

### 4.1 手机号要求

**重要**：WhatsApp 需要**真实手机号**，VoIP 和虚拟号码通常会被封禁。

**推荐方案：**

| 方案              | 说明              | 推荐度      |
| ----------------- | ----------------- | ----------- |
| 备用手机 + eSIM   | 专用号码，最稳定  | ✅ 推荐     |
| WhatsApp Business | 同一设备双号      | ✅ 推荐     |
| 个人号码          | 使用 selfChatMode | ⚠️ 临时方案 |

**号码获取建议：**

- 本地运营商 eSIM（最可靠）
- 预付费 SIM 卡（便宜，只需接收一次验证码）

**避免：** TextNow、Google Voice 等虚拟号码服务

### 4.2 配置 WhatsApp

**方式 A：allowlist 模式（推荐）**

```bash
pnpm openclaw config set channels.whatsapp.dmPolicy allowlist
pnpm openclaw config set channels.whatsapp.allowFrom '["+8613800138000"]'
```

**方式 B：pairing 模式**

```bash
pnpm openclaw config set channels.whatsapp.dmPolicy pairing
```

### 4.3 扫码登录

在 Gateway 运行的机器上执行：

```bash
pnpm openclaw channels login
```

然后在手机上：

1. 打开 WhatsApp → 设置
2. 已关联的设备 → 关联设备
3. 扫描终端显示的二维码

### 4.4 验证连接

```bash
# 检查登录状态
pnpm openclaw channels status

# 应显示 whatsapp: linked: true
```

### 4.5 个人号码模式（selfChatMode）

如果使用个人 WhatsApp 号码：

```json5
{
  channels: {
    whatsapp: {
      selfChatMode: true,
      dmPolicy: "allowlist",
      allowFrom: ["+8613800138000"],
    },
  },
}
```

**selfChatMode 特性：**

- 可以给自己发消息测试（WhatsApp 的「给自己发消息」功能）
- 回复会自动添加前缀区分

### 4.6 群组配置

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      groups: {
        "*": { requireMention: true },
      },
      groupAllowFrom: ["+8613800138000"],
    },
  },
}
```

### 4.7 完整配置示例

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+8613800138000"],
      selfChatMode: false,
      groupPolicy: "allowlist",
      groups: {
        "*": { requireMention: true },
      },
      sendReadReceipts: true,
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions",
      },
    },
  },
}
```

### 4.8 多账户配置

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        personal: {
          selfChatMode: true,
          allowFrom: ["+8613800138000"],
        },
        work: {
          allowFrom: ["+8613900139000", "+8613700137000"],
        },
      },
    },
  },
}
```

登录特定账户：

```bash
pnpm openclaw channels login --account personal
pnpm openclaw channels login --account work
```

---

## 5. Discord 部署

### 5.1 创建 Discord 应用

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 点击 **New Application**，输入名称
3. 左侧菜单选择 **Bot**
4. 点击 **Add Bot**
5. 复制 **Token**（点击 Reset Token 生成新的）

### 5.2 配置 Bot 权限

在 Bot 设置页面：

- 启用 **Message Content Intent**（必需，用于读取消息内容）
- 启用 **Server Members Intent**（可选，用于群组功能）

### 5.3 生成邀请链接

1. 左侧菜单选择 **OAuth2** → **URL Generator**
2. Scopes 选择：`bot`
3. Bot Permissions 选择：
   - Send Messages
   - Read Message History
   - Add Reactions
   - Use Slash Commands
4. 复制生成的 URL，在浏览器打开并添加到服务器

### 5.4 配置 OpenClaw

```bash
pnpm openclaw config set channels.discord.botToken "你的token"
pnpm openclaw config set channels.discord.enabled true
pnpm openclaw config set channels.discord.dmPolicy pairing
```

### 5.5 重启并测试

```bash
pnpm openclaw gateway restart

# 检查状态
pnpm openclaw channels status
```

### 5.6 完整配置示例

```json5
{
  channels: {
    discord: {
      enabled: true,
      botToken: "MTIz...",
      dmPolicy: "allowlist",
      allowFrom: ["123456789012345678"], // Discord 用户 ID
      serverPolicy: "allowlist",
      servers: {
        "987654321098765432": {
          requireMention: true,
        },
      },
    },
  },
}
```

---

## 6. Signal 部署

Signal 需要安装 signal-cli。

### 6.1 安装 signal-cli

**macOS：**

```bash
brew install signal-cli
```

**Linux：**

```bash
# 下载最新版本
wget https://github.com/AsamK/signal-cli/releases/download/v0.13.0/signal-cli-0.13.0-Linux.tar.gz
tar -xf signal-cli-0.13.0-Linux.tar.gz
sudo mv signal-cli-0.13.0 /opt/signal-cli
sudo ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/signal-cli
```

### 6.2 注册/链接号码

**注册新号码：**

```bash
signal-cli -u +8613800138000 register
signal-cli -u +8613800138000 verify <验证码>
```

**链接到已有设备：**

```bash
signal-cli link -n "OpenClaw"
# 扫描生成的二维码
```

### 6.3 配置 OpenClaw

```json5
{
  channels: {
    signal: {
      enabled: true,
      number: "+8613800138000",
      dmPolicy: "allowlist",
      allowFrom: ["+8613900139000"],
    },
  },
}
```

---

## 7. 飞书/Lark 部署

飞书（Feishu）/ Lark 是企业消息渠道，通过飞书开放平台自建应用接入。该插件由社区维护（`@openclaw/feishu`），除基础消息功能外，还内置了文档、知识库、云盘等工具集成。

> **插件版本**：2026.2.6-3  
> **SDK 依赖**：`@larksuiteoapi/node-sdk` ^1.58.0

### 7.1 创建飞书自建应用

1. 访问 [飞书开放平台](https://open.feishu.cn)（国际版访问 [Lark Developer](https://open.larksuite.com)）
2. 点击 **创建应用** → 选择 **自建应用**
3. 填写应用名称和描述
4. 进入 **凭证与基础信息** 页面，复制 **App ID** 和 **App Secret**

### 7.2 配置应用权限

在飞书开放平台的应用管理页面，进入 **权限管理**，添加以下权限：

**必需权限（应用权限 / Tenant Scopes）：**

| 权限标识                                 | 说明                      |
| ---------------------------------------- | ------------------------- |
| `im:message`                             | 发送/接收消息             |
| `im:message:send_as_bot`                 | 以机器人身份发送消息      |
| `im:message:readonly`                    | 读取消息                  |
| `im:message.p2p_msg:readonly`            | 读取私聊消息              |
| `im:message.group_at_msg:readonly`       | 读取群组 @消息            |
| `im:chat`                                | 会话访问                  |
| `im:chat.members:bot_access`             | 访问会话成员              |
| `im:chat.access_event.bot_p2p_chat:read` | 机器人私聊事件            |
| `im:resource`                            | 下载消息资源（图片/文件） |
| `contact:user.employee_id:readonly`      | 读取用户信息              |

**可选权限（工具集成相关）：**

| 权限标识                              | 说明       | 对应工具  |
| ------------------------------------- | ---------- | --------- |
| `aily:file:read` / `aily:file:write`  | 文件读写   | 文档/云盘 |
| `application:application:self_manage` | 应用自管理 | 权限诊断  |
| `application:bot.menu:write`          | 机器人菜单 | 命令菜单  |

### 7.3 配置事件订阅

在应用管理页面，进入 **事件订阅**：

1. 选择连接方式：
   - **WebSocket（推荐）**：无需公网地址，长连接方式
   - **Webhook**：需要公网可访问的 URL

2. 添加事件：
   - `im.message.receive_v1` — 接收消息（**必需**）
   - `im.message.message_read_v1` — 已读回执（可选）
   - `im.chat.member.bot.added_v1` — 机器人被添加到群组（可选）
   - `im.chat.member.bot.deleted_v1` — 机器人被移出群组（可选）

3. 启用 **机器人** 能力（在「应用能力」中开启）

### 7.4 发布应用

- 如果是企业内部使用，将应用发布并审核通过
- 如果是测试阶段，可以将应用添加到测试群或创建测试版本

### 7.5 安装插件

```bash
pnpm openclaw install @openclaw/feishu
```

### 7.6 配置 OpenClaw

**方式 A：命令行配置（推荐）**

```bash
pnpm openclaw config set channels.feishu.appId "cli_xxxxxxxxxxxxxxxx"
pnpm openclaw config set channels.feishu.appSecret "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
pnpm openclaw config set channels.feishu.enabled true
pnpm openclaw config set channels.feishu.dmPolicy pairing
```

**方式 B：环境变量**

```bash
export FEISHU_APP_ID="cli_xxxxxxxxxxxxxxxx"
export FEISHU_APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**方式 C：直接编辑配置文件**

编辑 `~/.openclaw/openclaw.json`：

```json5
{
  channels: {
    feishu: {
      enabled: true,
      appId: "cli_xxxxxxxxxxxxxxxx",
      appSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      domain: "feishu", // "feishu" (中国区) 或 "lark" (国际版)
      connectionMode: "websocket", // "websocket" (推荐) 或 "webhook"
      dmPolicy: "pairing",
    },
  },
}
```

**方式 D：交互式引导**

```bash
pnpm openclaw onboard
# 选择 Feishu/Lark 渠道，按提示填写
```

### 7.7 域名选择

| 域名           | 值         | API 地址             | 适用             |
| -------------- | ---------- | -------------------- | ---------------- |
| 飞书（中国区） | `"feishu"` | `open.feishu.cn`     | 国内用户（默认） |
| Lark（国际版） | `"lark"`   | `open.larksuite.com` | 海外用户         |

```bash
# 切换到国际版 Lark
pnpm openclaw config set channels.feishu.domain lark
```

### 7.8 重启 Gateway 并测试

```bash
pnpm openclaw gateway restart

# 检查状态
pnpm openclaw channels status

# 深度探测（验证 API 连接）
pnpm openclaw channels status --probe
```

成功连接后，状态会显示机器人名称和 open_id。

### 7.9 测试连接

1. 在飞书中找到你的机器人并发起私聊
2. 首次发送消息，会收到 **配对码**（pairing 模式）
3. 批准配对：

```bash
# 查看待配对列表
pnpm openclaw pairing list feishu

# 批准配对
pnpm openclaw pairing approve feishu <CODE>
```

### 7.10 使用 allowlist 代替 pairing

```bash
# 设置为 allowlist 模式
pnpm openclaw config set channels.feishu.dmPolicy allowlist

# 添加允许的用户 open_id
pnpm openclaw config set channels.feishu.allowFrom '["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]'
```

**获取用户 open_id：**

- 在飞书管理后台查看用户信息
- 通过飞书开放平台 API 查询
- 或查看 Gateway 日志：`pnpm openclaw logs --follow`

### 7.11 群组配置

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist", // "open" | "allowlist" | "disabled"
      requireMention: true, // 群组中需要 @机器人（默认 true）
      groupAllowFrom: ["oc_xxxxx"], // 允许的群组 chat_id
      groups: {
        "*": { requireMention: true }, // 所有群组默认需要 @提及
        oc_xxxxxxxx: {
          requireMention: false, // 特定群组始终响应
          allowFrom: ["ou_xxxxx"], // 群组级别的用户白名单
          systemPrompt: "你是一个技术助手", // 群组专用系统提示
          skills: ["code-review"], // 群组专用技能
          enabled: true,
        },
      },
    },
  },
}
```

### 7.12 消息渲染模式

飞书支持三种消息渲染模式，通过 `renderMode` 配置：

| 模式     | 值       | 说明                                     |
| -------- | -------- | ---------------------------------------- |
| 自动检测 | `"auto"` | 检测到代码块或表格时自动使用卡片（默认） |
| 纯文本   | `"raw"`  | 始终发送纯文本消息                       |
| 卡片     | `"card"` | 始终使用交互式卡片发送                   |

```bash
pnpm openclaw config set channels.feishu.renderMode auto
```

### 7.13 工具集成配置

飞书插件内置了企业工具集成，可以让 AI 直接操作飞书文档、知识库和云盘：

| 工具                       | 配置项         | 默认    | 说明                           |
| -------------------------- | -------------- | ------- | ------------------------------ |
| 文档 (`feishu_doc`)        | `tools.doc`    | `true`  | 读写、创建、编辑飞书文档       |
| 知识库 (`feishu_wiki`)     | `tools.wiki`   | `true`  | 浏览和管理知识空间（依赖 doc） |
| 云盘 (`feishu_drive`)      | `tools.drive`  | `true`  | 文件夹和文件管理               |
| 权限 (`feishu_perm`)       | `tools.perm`   | `false` | 管理文档协作者权限（敏感操作） |
| 权限诊断 (`feishu_scopes`) | `tools.scopes` | `true`  | 检查应用权限配置               |

```json5
{
  channels: {
    feishu: {
      tools: {
        doc: true,
        wiki: true,
        drive: true,
        perm: false, // 权限管理默认关闭，按需开启
        scopes: true,
      },
    },
  },
}
```

> **注意**：`wiki` 依赖 `doc`（知识库内容通过文档工具编辑）。`perm` 工具涉及敏感的权限操作，默认关闭。

### 7.14 多账户配置

如果需要运行多个飞书机器人（例如不同部门或不同域名）：

```json5
{
  channels: {
    feishu: {
      // 顶层配置作为默认值
      domain: "feishu",
      dmPolicy: "pairing",
      accounts: {
        internal: {
          name: "内部助手",
          appId: "cli_aaaaaaaaaaaa",
          appSecret: "secret_aaa",
          domain: "feishu",
          dmPolicy: "allowlist",
          allowFrom: ["ou_xxxxx"],
        },
        international: {
          name: "Global Bot",
          appId: "cli_bbbbbbbbbbbb",
          appSecret: "secret_bbb",
          domain: "lark",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

每个 account 可以覆盖顶层的任意配置项，未设置的字段自动继承顶层配置。

### 7.15 完整配置示例

```json5
{
  channels: {
    feishu: {
      enabled: true,
      appId: "cli_xxxxxxxxxxxxxxxx",
      appSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      domain: "feishu",
      connectionMode: "websocket",
      dmPolicy: "allowlist",
      allowFrom: ["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxxxxxxx"],
      requireMention: true,
      groups: {
        "*": { requireMention: true },
      },
      renderMode: "auto",
      mediaMaxMb: 30,
      tools: {
        doc: true,
        wiki: true,
        drive: true,
        perm: false,
        scopes: true,
      },
    },
  },
}
```

### 7.16 支持的消息类型

**接收（入站）：**

| 类型      | 说明                     |
| --------- | ------------------------ |
| `text`    | 纯文本消息               |
| `post`    | 富文本消息（含嵌入图片） |
| `image`   | 图片                     |
| `file`    | 文件                     |
| `audio`   | 音频                     |
| `video`   | 视频                     |
| `sticker` | 表情贴纸                 |

**发送（出站）：**

| 类型           | 说明                         |
| -------------- | ---------------------------- |
| 富文本（post） | 支持 Markdown 的消息         |
| 交互式卡片     | 带有 Markdown 渲染的卡片消息 |
| 图片/文件      | 通过上传后发送               |

---

## 8. 其他渠道

### 8.1 Slack

需要创建 Slack App 并配置 OAuth：

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      signingSecret: "...",
    },
  },
}
```

### 8.2 iMessage（仅 macOS）

```json5
{
  channels: {
    imessage: {
      enabled: true,
      dmPolicy: "allowlist",
      allowFrom: ["+8613800138000"],
    },
  },
}
```

### 8.3 插件渠道

以下渠道作为插件提供（需单独安装）：

- **飞书/Lark** - `@openclaw/feishu`（详见[第 7 节](#7-飞书lark-部署)）
- **Microsoft Teams** - `extensions/msteams`
- **Matrix** - `extensions/matrix`
- **LINE** - `extensions/line`
- **Zalo** - `extensions/zalo`

---

## 9. DM 策略与访问控制

### 9.1 DM 策略选项

| 策略        | 说明                                | 适用场景   |
| ----------- | ----------------------------------- | ---------- |
| `pairing`   | 未知发送者收到配对码，需手动批准    | 默认，安全 |
| `allowlist` | 只允许 `allowFrom` 列表中的用户     | 已知用户群 |
| `open`      | 允许所有人（需 `allowFrom: ["*"]`） | 公开服务   |
| `disabled`  | 禁用 DM                             | 仅使用群组 |

### 9.2 配对流程（pairing）

```bash
# 查看所有渠道的待配对请求
pnpm openclaw pairing list

# 查看特定渠道
pnpm openclaw pairing list telegram
pnpm openclaw pairing list whatsapp
pnpm openclaw pairing list feishu

# 批准配对
pnpm openclaw pairing approve telegram <CODE>
pnpm openclaw pairing approve whatsapp <CODE>
pnpm openclaw pairing approve feishu <CODE>
```

配对码有效期：**1 小时**

### 9.3 allowFrom 格式

| 渠道      | 格式               | 示例                                    |
| --------- | ------------------ | --------------------------------------- |
| Telegram  | 用户 ID 或 @用户名 | `"123456789"` 或 `"@username"`          |
| WhatsApp  | E.164 手机号       | `"+8613800138000"`                      |
| Discord   | 用户 ID            | `"123456789012345678"`                  |
| Signal    | E.164 手机号       | `"+8613800138000"`                      |
| 飞书/Lark | 用户 open_id       | `"ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"` |

### 9.4 群组策略

```json5
{
  channels: {
    telegram: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      groupAllowFrom: ["123456789"], // 群组中允许的用户
      groups: {
        "*": { requireMention: true }, // 默认需要 @提及
        "-1001234567890": {
          requireMention: false, // 特定群组始终响应
          allowFrom: ["123456789"], // 群组级别的允许列表
        },
      },
    },
  },
}
```

---

## 10. 状态检查与故障排除

### 10.1 状态检查命令

```bash
# 基础状态
pnpm openclaw channels status

# 深度检查（带探测）
pnpm openclaw channels status --probe

# 查看日志
pnpm openclaw logs --follow

# 健康检查
pnpm openclaw health

# 诊断
pnpm openclaw doctor
```

### 10.2 常见问题

#### WhatsApp: "Not linked"

```bash
# 重新扫码登录
pnpm openclaw channels login
```

#### WhatsApp: "Linked but disconnected"

```bash
# 运行诊断
pnpm openclaw doctor

# 或重启 Gateway
pnpm openclaw gateway restart
```

#### Telegram: Bot 没有响应

1. 检查 token 是否正确
2. 检查 Privacy Mode（群组消息）：
   - BotFather → `/setprivacy` → Disable
   - 需要移除并重新添加 Bot 到群组

#### Telegram: 群组消息收不到

- 确认已禁用 Privacy Mode
- 或将 Bot 设为群组管理员

#### 飞书/Lark: 机器人没有响应

1. 检查 App ID 和 App Secret 是否正确
2. 检查应用是否已发布或处于测试状态
3. 确认已开启 **机器人** 能力
4. 确认已添加 `im.message.receive_v1` 事件订阅
5. 检查连接方式：WebSocket 模式下无需公网地址

```bash
# 检查连接状态
pnpm openclaw channels status --probe

# 查看详细日志
pnpm openclaw logs --follow
```

#### 飞书/Lark: API 权限错误

如果日志中出现权限相关错误：

1. 检查应用权限是否已全部申请并审批通过
2. 运行权限诊断：

```bash
# 如果启用了 scopes 工具，可以在对话中让 AI 检查权限
# 或在飞书开放平台查看应用的权限状态
```

3. 确保应用已添加到目标群组（群组消息场景）

#### 飞书/Lark: 群组消息收不到

- 确认机器人已添加到群组
- 确认 `groupPolicy` 不是 `disabled`
- 如果使用 `allowlist` 模式，确认群组 `chat_id` 在 `groupAllowFrom` 中
- 默认需要 @机器人（`requireMention: true`），检查是否正确 @提及

#### 飞书/Lark: 卡片消息显示异常

- 检查 `renderMode` 设置，尝试切换为 `"raw"` 排除卡片渲染问题
- 某些 Markdown 语法在飞书卡片中可能不完全支持

#### 网络问题（IPv6）

某些服务器 IPv6 路由有问题：

```bash
# 检查 DNS
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

可以在 `/etc/hosts` 中强制使用 IPv4：

```
149.154.167.220 api.telegram.org
```

### 10.3 日志位置

- Gateway 日志：`~/.openclaw/logs/gateway.log`
- 临时日志：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

---

## 11. 相关文档

### 官方文档

- WhatsApp: https://docs.openclaw.ai/channels/whatsapp
- Telegram: https://docs.openclaw.ai/channels/telegram
- Discord: https://docs.openclaw.ai/channels/discord
- Signal: https://docs.openclaw.ai/channels/signal
- 飞书/Lark: https://docs.openclaw.ai/channels/feishu
- 所有渠道: https://docs.openclaw.ai/channels
- 故障排除: https://docs.openclaw.ai/channels/troubleshooting

### 飞书开放平台

- 飞书开放平台（中国区）: https://open.feishu.cn
- Lark Developer（国际版）: https://open.larksuite.com
- 飞书开放平台文档: https://open.feishu.cn/document

### 本地文档

- [Fork 管理与生产部署指南](./fork-management-guide.md)
- [AI 模型与 Agent 配置指南](./model-agent-config-guide.md)
- [openclaw doctor 诊断指南](./openclaw-doctor-guide.md)

---

_文档编写：2026-01-31 | 更新：2026-02-08（新增飞书/Lark 渠道部署指南）_
