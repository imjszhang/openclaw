# OpenClaw 浏览器插件（Browser Relay）连接与使用指南

> 编写日期：2026-02-11  
> 适用版本：openclaw@2026.2.x+  
> 适用场景：通过 Chrome 扩展让 AI 智能体控制你现有的浏览器标签页

---

## 目录

- [概述](#概述)
- [架构原理](#架构原理)
- [前置条件](#前置条件)
- [安装步骤](#安装步骤)
- [连接与附加标签页](#连接与附加标签页)
- [与 AI 智能体配合使用](#与-ai-智能体配合使用)
- [CLI 命令行操作](#cli-命令行操作)
- [配置参考](#配置参考)
- [远程 Gateway 场景](#远程-gateway-场景)
- [沙箱环境注意事项](#沙箱环境注意事项)
- [徽章状态与故障排查](#徽章状态与故障排查)
- [安全注意事项](#安全注意事项)

---

## 概述

OpenClaw Browser Relay 是一个 Chrome MV3 扩展，让 AI 智能体通过 Chrome DevTools Protocol (CDP) 直接控制你**现有的** Chrome 标签页，而不是启动一个单独的浏览器实例。

与 OpenClaw 托管浏览器 (managed browser) 的区别：

| 特性       | 托管浏览器 (`openclaw` profile) | 扩展中继 (`chrome` profile) |
| ---------- | ------------------------------- | --------------------------- |
| 浏览器实例 | 独立的 Chromium 实例            | 你日常使用的 Chrome         |
| 登录状态   | 空白（需重新登录）              | 继承你的登录态              |
| 隔离性     | 完全隔离                        | 共享你的浏览数据            |
| 适用场景   | 安全敏感任务                    | 需要利用已登录网站的任务    |

---

## 架构原理

系统由三个组件协同工作：

```
┌─────────────────────┐
│  AI 智能体 / CLI     │  (调用 browser 工具)
└──────────┬──────────┘
           │ HTTP API
           ▼
┌─────────────────────┐
│  浏览器控制服务       │  Gateway 内置，端口 18791
│  (Browser Control)   │
└──────────┬──────────┘
           │ WebSocket
           ▼
┌─────────────────────┐
│  本地中继服务器       │  loopback 端口 18792
│  (Relay Server)      │
└──────────┬──────────┘
           │ WebSocket (CDP)
           ▼
┌─────────────────────┐
│  Chrome 扩展          │  使用 chrome.debugger API
│  (Browser Relay)     │
└──────────┬──────────┘
           │ CDP 协议
           ▼
┌─────────────────────┐
│  你的 Chrome 标签页   │
└─────────────────────┘
```

**数据流**：智能体 → Gateway 控制服务 → 本地中继服务器 → Chrome 扩展 → 标签页

---

## 前置条件

1. **OpenClaw Gateway 正在运行**（macOS app 或 `openclaw gateway run`）
2. **Chrome / Edge / Brave** 浏览器（基于 Chromium）
3. **Node 22+** 和已安装的 OpenClaw CLI

验证 Gateway 运行状态：

```bash
openclaw channels status --probe
```

---

## 安装步骤

### 第 1 步：安装扩展文件

将扩展文件复制到本地稳定路径：

```bash
openclaw browser extension install
```

输出示例：

```
~/.openclaw/browser/chrome-extension
Copied to clipboard.
```

### 第 2 步：在 Chrome 中加载扩展

1. 打开 Chrome，地址栏输入 `chrome://extensions`
2. 右上角启用 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择上一步输出的目录（`~/.openclaw/browser/chrome-extension`）
5. 扩展加载成功后，将 **OpenClaw Browser Relay** 图标固定到工具栏

### 第 3 步：验证连接

点击工具栏上的扩展图标：

- 如果徽章显示 `ON`（红色）：连接成功
- 如果徽章显示 `!`（红色）：中继服务未运行，请确保 Gateway 已启动

### 更新扩展

升级 OpenClaw 后：

```bash
openclaw browser extension install    # 刷新文件
```

然后在 `chrome://extensions` 中点击扩展卡片上的 **重新加载** 按钮。

---

## 连接与附加标签页

扩展提供三种附加方式，灵活控制哪些标签页可被智能体操作。

### 方式一：单个标签页附加

1. 切换到你想让智能体控制的标签页
2. 点击工具栏上的 **OpenClaw Browser Relay** 图标
3. 徽章显示 `ON` 表示已附加
4. 再次点击图标可取消附加

### 方式二：一键附加当前窗口所有标签页

1. **右键** 工具栏上的扩展图标
2. 选择 **Attach all tabs in this window**
3. 当前窗口内所有普通网页标签页会被附加（`chrome://`、`chrome-extension://`、`edge://` 页面自动跳过）
4. 要取消全部附加：右键 → **Detach all tabs**

### 方式三：自动附加新标签页

当窗口内已有附加的标签页时：

- 按 `Cmd+T` / `Ctrl+T` 新建标签页 → **自动附加**
- 从 `chrome://newtab` 导航到普通网页 → **自动附加**
- 无需手动再次点击扩展图标

> **注意**：如果窗口内没有任何已附加的标签页，新标签页不会自动附加。需要先手动附加至少一个标签页，或使用"Attach all tabs"。

### 智能体能控制哪些标签页？

- 只能控制已附加（徽章 `ON`）的标签页
- 不会自动控制"你正在看的"标签页
- 要切换控制目标：切到其他标签页并点击扩展图标

---

## 与 AI 智能体配合使用

### 基本用法

在与 OpenClaw 智能体对话时，它会通过 `browser` 工具操作你的浏览器。确保：

1. Gateway 正在运行
2. 至少一个标签页已附加（徽章 `ON`）
3. 智能体使用 `profile="chrome"` 参数

### 智能体使用示例

智能体调用浏览器工具时：

```
// 截取页面快照
browser(action: "snapshot", profile: "chrome")

// 导航到指定网址
browser(action: "open", url: "https://example.com", profile: "chrome")

// 点击页面元素（使用快照中的 ref 编号）
browser(action: "click", ref: 12, profile: "chrome")

// 在输入框中输入文字
browser(action: "type", ref: 23, text: "hello", profile: "chrome")
```

### 提示智能体使用扩展中继

在对话中你可以这样说：

- "用我的 Chrome 浏览器打开 xxx 网站"
- "帮我在已打开的网页上操作"
- 智能体通常会自动识别并使用 `profile="chrome"`

如果智能体提示"没有已附加的标签页"，请检查：

1. 是否有标签页显示 `ON` 徽章
2. 如果没有，点击扩展图标附加当前标签页

---

## CLI 命令行操作

### 扩展管理

```bash
# 安装扩展到本地路径
openclaw browser extension install

# 查看已安装扩展的路径
openclaw browser extension path
```

### 浏览器操作（指定 chrome profile）

```bash
# 列出已附加的标签页
openclaw browser --browser-profile chrome tabs

# 查看浏览器状态
openclaw browser --browser-profile chrome status

# 截取页面快照
openclaw browser --browser-profile chrome snapshot

# 截屏
openclaw browser --browser-profile chrome screenshot

# 导航到网址
openclaw browser --browser-profile chrome navigate https://example.com

# 点击元素
openclaw browser --browser-profile chrome click 12

# 输入文字
openclaw browser --browser-profile chrome type 23 "hello world"
```

### Profile 管理

```bash
# 列出所有浏览器 profile
openclaw browser profiles

# 创建自定义扩展 profile
openclaw browser create-profile \
  --name my-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"

# 删除 profile
openclaw browser delete-profile --name my-chrome
```

所有 `openclaw browser` 命令都支持 `--browser-profile <name>` 参数来指定目标 profile。加 `--json` 可输出机器可读的 JSON 格式。

---

## 配置参考

### 默认端口

| 服务               | 默认端口 | 说明               |
| ------------------ | -------- | ------------------ |
| Gateway            | 18789    | `gateway.port`     |
| 浏览器控制服务     | 18791    | `gateway.port + 2` |
| 中继服务器 (Relay) | 18792    | `控制服务端口 + 1` |

> 如果修改了 `gateway.port`，浏览器相关端口会自动偏移。

### 配置文件示例

编辑 `~/.openclaw/openclaw.json`（或 `openclaw.json5`）：

```json5
{
  browser: {
    enabled: true, // 启用浏览器功能（默认 true）
    defaultProfile: "chrome", // 默认 profile（"chrome" 或 "openclaw"）

    profiles: {
      // 内置 chrome profile（扩展中继）— 通常无需手动配置
      chrome: {
        driver: "extension",
        cdpUrl: "http://127.0.0.1:18792",
        color: "#00AA00",
      },

      // 自定义扩展 profile（如使用不同端口）
      "my-chrome": {
        driver: "extension",
        cdpUrl: "http://127.0.0.1:19000",
        color: "#FF5A36",
      },
    },
  },
}
```

### 扩展选项页

右键扩展图标 → **选项**（或访问 `chrome://extensions` → 扩展详情 → 扩展程序选项），可以：

- 修改中继端口（默认 18792）
- 查看中继服务器是否可达

---

## 远程 Gateway 场景

### 本地 Gateway（Gateway 和 Chrome 在同一台机器）

无需额外配置。Gateway 自动启动控制服务和中继服务器，扩展连接到本地中继。

### 远程 Gateway（Gateway 运行在其他机器上）

如果 Gateway 运行在远程服务器（如 VPS），需要在 Chrome 所在机器上运行节点主机 (node host)：

```bash
# 在运行 Chrome 的机器上：
openclaw node start
```

Gateway 会代理浏览器操作到该节点。扩展 + 中继服务器保持在 Chrome 所在机器本地。

### 节点路由配置

```json5
{
  gateway: {
    nodes: {
      browser: {
        mode: "auto", // "auto" | "off" | "pin"
        node: "node-id-or-name", // 当 mode="pin" 时指定节点
      },
    },
  },
}
```

> 建议将 Gateway 和节点主机放在同一 Tailscale 网络中。

---

## 沙箱环境注意事项

如果智能体会话启用了沙箱隔离（`agents.defaults.sandbox.mode`），`browser` 工具默认会指向沙箱浏览器。扩展中继需要访问宿主机浏览器，因此需要额外配置。

### 方案一：使用非沙箱会话（最简单）

在非沙箱模式下运行智能体会话即可。

### 方案二：允许沙箱访问宿主机浏览器

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: {
          allowHostControl: true, // 允许沙箱会话控制宿主机浏览器
        },
      },
    },
  },
}
```

然后在调用工具时使用 `target="host"`。

调试沙箱配置：

```bash
openclaw sandbox explain
```

---

## 徽章状态与故障排查

### 徽章含义

| 徽章   | 颜色 | 含义                         |
| ------ | ---- | ---------------------------- |
| `ON`   | 红色 | 已附加，智能体可控制该标签页 |
| `…`    | 橙色 | 正在连接中继服务器           |
| `!`    | 红色 | 错误：中继服务器不可达       |
| 无徽章 | —    | 未附加                       |

### 常见问题

#### 1. 徽章显示 `!`（中继不可达）

**原因**：Gateway 未运行或端口不匹配。

**排查步骤**：

1. 确认 Gateway 正在运行（OpenClaw macOS app 或 `openclaw gateway run`）
2. 检查扩展选项页的端口配置（默认 18792）
3. 手动测试中继：
   ```bash
   curl -I http://127.0.0.1:18792/
   ```
4. 如果端口被占用，检查是否有旧进程：
   ```bash
   lsof -i :18792
   ```

#### 2. 智能体提示"没有已附加的标签页"

**原因**：没有标签页显示 `ON` 徽章。

**解决**：

- 点击扩展图标附加当前标签页
- 或右键 → "Attach all tabs in this window"

#### 3. 扩展无法附加某些标签页

**原因**：以下页面无法附加：

- `chrome://` 页面（如 chrome://settings）
- `chrome-extension://` 页面
- `edge://` 页面

**解决**：只能附加普通网页（http:// 或 https://）。

#### 4. 连接突然断开

**原因**：Gateway 重启或网络中断。

**解决**：

- 检查 Gateway 状态
- 点击扩展图标重新附加
- 查看 Chrome 扩展日志：`chrome://extensions` → 扩展详情 → "Service Worker" 链接

#### 5. 智能体操作了错误的标签页

**原因**：多个标签页都已附加时，智能体可能选择了非预期标签页。

**解决**：

- 取消不需要被控制的标签页的附加
- 在对话中明确告诉智能体要操作的网站/标签页

### 调试清单

1. 检查扩展选项页（端口、中继可达性）
2. 检查 Gateway 日志
3. 检查 Chrome 扩展 Service Worker 日志
4. 验证端口配置一致：扩展 ↔ Gateway
5. 手动测试中继端点：`curl http://127.0.0.1:18792/`

---

## 安全注意事项

Browser Relay 非常强大，但也意味着风险。请务必了解：

### 智能体能做什么

当标签页被附加后，智能体可以：

- 在该标签页中点击、输入、导航
- 读取页面内容（包括敏感信息）
- 访问该标签页的登录态（cookies、session）
- 在页面上下文中执行 JavaScript

### 建议

1. **使用专用 Chrome 配置文件**：不要在你的日常浏览配置文件中使用扩展中继，创建一个专门用于 AI 操作的 Chrome 配置文件
2. **最小化附加范围**：只附加需要被控制的标签页，不要盲目"Attach all"
3. **网络隔离**：中继服务器仅监听 loopback（127.0.0.1），不要暴露到外网
4. **Tailscale**：如果使用远程 Gateway，通过 Tailscale 连接，避免公网暴露
5. **及时取消附加**：操作完成后，点击图标或右键 → "Detach all tabs" 取消附加

### 中继服务器的安全机制

- 仅接受来自 `chrome-extension://` 来源的 WebSocket 连接
- CDP 端点需要内部认证令牌（`x-openclaw-relay-token`）
- 仅绑定 loopback 地址，拒绝非本地连接
- 每个中继服务器只允许一个扩展连接

---

## 快速参考卡

```
# 安装
openclaw browser extension install
# Chrome → chrome://extensions → 开发者模式 → 加载已解压的扩展程序

# 附加
点击扩展图标 → 单个标签页
右键扩展图标 → "Attach all tabs in this window" → 全部标签页
新标签页 → 自动附加（当窗口已有附加标签页时）

# 使用
openclaw browser --browser-profile chrome tabs      # 查看标签页
openclaw browser --browser-profile chrome snapshot   # 截取快照
openclaw browser --browser-profile chrome screenshot # 截屏

# 取消附加
点击扩展图标 → 取消单个
右键扩展图标 → "Detach all tabs" → 取消全部

# 故障排查
curl -I http://127.0.0.1:18792/                    # 测试中继
openclaw channels status --probe                     # 测试 Gateway
```
