# OpenClaw 消息渠道部署指南

> 编写日期：2026-01-31  
> 适用场景：WhatsApp、Telegram、Discord 等消息渠道的配置与部署

---

## 目录

1. [前提条件](#1-前提条件)
2. [渠道概览](#2-渠道概览)
3. [Telegram 部署](#3-telegram-部署)
4. [WhatsApp 部署](#4-whatsapp-部署)
5. [Discord 部署](#5-discord-部署)
6. [Signal 部署](#6-signal-部署)
7. [其他渠道](#7-其他渠道)
8. [DM 策略与访问控制](#8-dm-策略与访问控制)
9. [状态检查与故障排除](#9-状态检查与故障排除)
10. [相关文档](#10-相关文档)

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

| 渠道 | 类型 | 难度 | 说明 |
|------|------|------|------|
| **Telegram** | Bot API | ⭐ 最简单 | 只需 BotFather token |
| **WhatsApp** | Web (Baileys) | ⭐⭐ 中等 | 需要扫码登录 + 真实手机号 |
| **Discord** | Bot API | ⭐⭐ 中等 | 需要创建应用 + Bot |
| **Signal** | signal-cli | ⭐⭐⭐ 较复杂 | 需要安装 signal-cli |
| **Slack** | Bolt SDK | ⭐⭐ 中等 | 需要创建 Slack App |
| **iMessage** | macOS 原生 | ⭐⭐⭐ 较复杂 | 仅限 macOS |

### 2.2 推荐顺序

1. **Telegram** - 最快上手，功能完整
2. **WhatsApp** - 最常用，但配置稍复杂
3. **Discord** - 适合技术社区

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
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
      "dmPolicy": "pairing"
    }
  }
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
  "channels": {
    "telegram": {
      "groups": {
        "*": { "requireMention": true },  // 所有群组需要 @提及
        "-1001234567890": { "requireMention": false }  // 特定群组始终响应
      },
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["123456789"]  // 群组中允许的用户
    }
  }
}
```

### 3.6 完整配置示例

```json5
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
      "dmPolicy": "allowlist",
      "allowFrom": ["123456789"],
      "groups": {
        "*": { "requireMention": true }
      },
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["123456789"]
    }
  }
}
```

---

## 4. WhatsApp 部署

WhatsApp 使用 Web 协议（Baileys），需要扫码登录。

### 4.1 手机号要求

**重要**：WhatsApp 需要**真实手机号**，VoIP 和虚拟号码通常会被封禁。

**推荐方案：**

| 方案 | 说明 | 推荐度 |
|------|------|--------|
| 备用手机 + eSIM | 专用号码，最稳定 | ✅ 推荐 |
| WhatsApp Business | 同一设备双号 | ✅ 推荐 |
| 个人号码 | 使用 selfChatMode | ⚠️ 临时方案 |

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
  "channels": {
    "whatsapp": {
      "selfChatMode": true,
      "dmPolicy": "allowlist",
      "allowFrom": ["+8613800138000"]
    }
  }
}
```

**selfChatMode 特性：**

- 可以给自己发消息测试（WhatsApp 的「给自己发消息」功能）
- 回复会自动添加前缀区分

### 4.6 群组配置

```json5
{
  "channels": {
    "whatsapp": {
      "groupPolicy": "allowlist",  // open | allowlist | disabled
      "groups": {
        "*": { "requireMention": true }
      },
      "groupAllowFrom": ["+8613800138000"]
    }
  }
}
```

### 4.7 完整配置示例

```json5
{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+8613800138000"],
      "selfChatMode": false,
      "groupPolicy": "allowlist",
      "groups": {
        "*": { "requireMention": true }
      },
      "sendReadReceipts": true,
      "ackReaction": {
        "emoji": "👀",
        "direct": true,
        "group": "mentions"
      }
    }
  }
}
```

### 4.8 多账户配置

```json5
{
  "channels": {
    "whatsapp": {
      "accounts": {
        "personal": {
          "selfChatMode": true,
          "allowFrom": ["+8613800138000"]
        },
        "work": {
          "allowFrom": ["+8613900139000", "+8613700137000"]
        }
      }
    }
  }
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
  "channels": {
    "discord": {
      "enabled": true,
      "botToken": "MTIz...",
      "dmPolicy": "allowlist",
      "allowFrom": ["123456789012345678"],  // Discord 用户 ID
      "serverPolicy": "allowlist",
      "servers": {
        "987654321098765432": {
          "requireMention": true
        }
      }
    }
  }
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
  "channels": {
    "signal": {
      "enabled": true,
      "number": "+8613800138000",
      "dmPolicy": "allowlist",
      "allowFrom": ["+8613900139000"]
    }
  }
}
```

---

## 7. 其他渠道

### 7.1 Slack

需要创建 Slack App 并配置 OAuth：

```json5
{
  "channels": {
    "slack": {
      "enabled": true,
      "botToken": "xoxb-...",
      "appToken": "xapp-...",
      "signingSecret": "..."
    }
  }
}
```

### 7.2 iMessage（仅 macOS）

```json5
{
  "channels": {
    "imessage": {
      "enabled": true,
      "dmPolicy": "allowlist",
      "allowFrom": ["+8613800138000"]
    }
  }
}
```

### 7.3 插件渠道

以下渠道作为插件提供（需单独安装）：

- **Microsoft Teams** - `extensions/msteams`
- **Matrix** - `extensions/matrix`
- **LINE** - `extensions/line`
- **Zalo** - `extensions/zalo`

---

## 8. DM 策略与访问控制

### 8.1 DM 策略选项

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `pairing` | 未知发送者收到配对码，需手动批准 | 默认，安全 |
| `allowlist` | 只允许 `allowFrom` 列表中的用户 | 已知用户群 |
| `open` | 允许所有人（需 `allowFrom: ["*"]`） | 公开服务 |
| `disabled` | 禁用 DM | 仅使用群组 |

### 8.2 配对流程（pairing）

```bash
# 查看所有渠道的待配对请求
pnpm openclaw pairing list

# 查看特定渠道
pnpm openclaw pairing list telegram
pnpm openclaw pairing list whatsapp

# 批准配对
pnpm openclaw pairing approve telegram <CODE>
pnpm openclaw pairing approve whatsapp <CODE>
```

配对码有效期：**1 小时**

### 8.3 allowFrom 格式

| 渠道 | 格式 | 示例 |
|------|------|------|
| Telegram | 用户 ID 或 @用户名 | `"123456789"` 或 `"@username"` |
| WhatsApp | E.164 手机号 | `"+8613800138000"` |
| Discord | 用户 ID | `"123456789012345678"` |
| Signal | E.164 手机号 | `"+8613800138000"` |

### 8.4 群组策略

```json5
{
  "channels": {
    "telegram": {
      "groupPolicy": "allowlist",  // open | allowlist | disabled
      "groupAllowFrom": ["123456789"],  // 群组中允许的用户
      "groups": {
        "*": { "requireMention": true },  // 默认需要 @提及
        "-1001234567890": {
          "requireMention": false,  // 特定群组始终响应
          "allowFrom": ["123456789"]  // 群组级别的允许列表
        }
      }
    }
  }
}
```

---

## 9. 状态检查与故障排除

### 9.1 状态检查命令

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

### 9.2 常见问题

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

### 9.3 日志位置

- Gateway 日志：`~/.openclaw/logs/gateway.log`
- 临时日志：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

---

## 10. 相关文档

### 官方文档

- WhatsApp: https://docs.openclaw.ai/channels/whatsapp
- Telegram: https://docs.openclaw.ai/channels/telegram
- Discord: https://docs.openclaw.ai/channels/discord
- Signal: https://docs.openclaw.ai/channels/signal
- 所有渠道: https://docs.openclaw.ai/channels
- 故障排除: https://docs.openclaw.ai/channels/troubleshooting

### 本地文档

- [Fork 管理与生产部署指南](./fork-management-guide.md)
- [AI 模型与 Agent 配置指南](./model-agent-config-guide.md)
- [openclaw doctor 诊断指南](./openclaw-doctor-guide.md)

---

*文档编写：2026-01-31*
