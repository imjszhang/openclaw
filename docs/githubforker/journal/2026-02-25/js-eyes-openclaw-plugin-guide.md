# JS-Eyes OpenClaw 插件使用指南

> 编写日期：2026-02-25
> 让 AI Agent 拥有浏览器操控能力——安装、配置与实战

---

## 目录

1. [这是什么：一句话理解 JS-Eyes](#1-这是什么一句话理解-js-eyes)
2. [整体架构：三层通信链路](#2-整体架构三层通信链路)
3. [安装与配置：四步上线](#3-安装与配置四步上线)
4. [七个 AI 工具详解](#4-七个-ai-工具详解)
5. [CLI 命令：终端侧运维](#5-cli-命令终端侧运维)
6. [实战场景](#6-实战场景)
7. [多浏览器协同](#7-多浏览器协同)
8. [故障排查](#8-故障排查)
9. [与 OpenClaw 内置浏览器控制的区别](#9-与-openclaw-内置浏览器控制的区别)
10. [相关文档](#10-相关文档)

---

## 1. 这是什么：一句话理解 JS-Eyes

**JS-Eyes** 是一个浏览器扩展，通过 WebSocket 为 AI Agent 框架提供远程浏览器控制能力。它的 OpenClaw 插件（ID: `js-eyes`）将这些能力封装为 Agent 可直接调用的工具，让你在对话中就能让 Agent 打开页面、提取内容、执行脚本、管理 Cookie。

项目地址：[github.com/imjszhang/js-eyes](https://github.com/imjszhang/js-eyes)
版本：1.4.0 · MIT 许可证 · 作者 [@imjszhang](https://x.com/imjszhang)

---

## 2. 整体架构：三层通信链路

```
┌──────────────────────┐     WebSocket      ┌──────────────────────┐     内部调用     ┌──────────────────┐
│   浏览器扩展          │ ◄──────────────── │   JS-Eyes Server     │ ◄────────────── │   OpenClaw Agent │
│   (Chrome/Edge/FF)   │ ────────────────► │   (内置/独立)         │ ────────────────►│   (AI 工具调用)   │
│                      │   标签页同步/操作   │   HTTP:18080         │   BrowserAutomation│                  │
│   - 标签页管理        │   脚本执行/HTML获取 │   WS:18080           │   Client 类       │   7 个注册工具    │
│   - Content Script   │                    │                      │                    │   3 组 CLI 命令   │
│   - Cookie 读取      │                    │                      │                    │   1 个后台服务    │
└──────────────────────┘                    └──────────────────────┘                    └──────────────────┘
```

关键设计：

- **单端口复用**——HTTP 和 WebSocket 共用 18080 端口，浏览器扩展只需填一个地址
- **自动能力探测**——扩展通过 `/api/browser/config` 自动发现服务器类型和能力
- **插件内嵌服务器**——OpenClaw 启动时自动拉起 JS-Eyes Server，无需手动启动独立进程

---

## 3. 安装与配置：四步上线

### 第一步：安装浏览器扩展

从 [GitHub Releases](https://github.com/imjszhang/js-eyes/releases/latest) 下载：

| 浏览器        | 文件                         | 安装方式                                                    |
| ------------- | ---------------------------- | ----------------------------------------------------------- |
| Chrome / Edge | `js-eyes-chrome-v1.4.0.zip`  | 解压 → `chrome://extensions/` → 开发者模式 → 加载已解压     |
| Firefox       | `js-eyes-firefox-v1.4.0.xpi` | 直接拖入浏览器窗口，或 `about:debugging` → 临时载入附加组件 |

### 第二步：配置 OpenClaw 加载插件

编辑 `~/.openclaw/openclaw.json`（JSON5 格式），添加插件路径和配置：

```json5
{
  plugins: {
    load: {
      paths: [
        // 指向 JS-Eyes 项目中的 openclaw-plugin 子目录
        "D:/github/my/JS-Eyes/openclaw-plugin",
      ],
    },
    entries: {
      "js-eyes": {
        enabled: true,
        config: {
          serverHost: "localhost", // 服务器监听地址
          serverPort: 18080, // 服务器端口
          autoStartServer: true, // 随 OpenClaw 自动启动服务器
          requestTimeout: 60, // 单次操作超时（秒）
        },
      },
    },
  },
}
```

也可以用 `--link` 方式安装，效果相同：

```bash
openclaw plugins install --link D:/github/my/JS-Eyes/openclaw-plugin
```

### 第三步：启动 OpenClaw Gateway

```bash
openclaw gateway
```

控制台应出现：`[js-eyes] Server started on ws://localhost:18080`——说明内置服务器已随插件自动启动。

### 第四步：连接浏览器扩展

1. 点击浏览器工具栏的 JS-Eyes 图标
2. 输入服务器地址：`http://localhost:18080`
3. 点击 **Connect**
4. 状态指示器变绿 → 连接成功

至此，Agent 已经可以通过工具调用控制你的浏览器。

---

## 4. 七个 AI 工具详解

插件注册了 7 个工具，全部标记为 `optional: true`（创建失败不会阻断插件加载）。

### js_eyes_get_tabs — 获取标签页列表

获取所有已连接浏览器的标签页信息，包含 ID、标题、URL 和活跃状态。

| 参数     | 类型   | 必需 | 说明                                           |
| -------- | ------ | ---- | ---------------------------------------------- |
| `target` | string | 否   | 目标浏览器的 clientId 或名称（省略则返回全部） |

返回示例：

```
## Chrome (client-abc123)
  - [42] GitHub - imjszhang/js-eyes [ACTIVE]
    https://github.com/imjszhang/js-eyes
  - [38] Google
    https://www.google.com
```

### js_eyes_list_clients — 列出已连接的浏览器

查看当前有哪些浏览器扩展连接到了服务器。

无参数。返回示例：

```
- Chrome (clientId: abc123, tabs: 5)
- Firefox (clientId: def456, tabs: 3)
```

### js_eyes_open_url — 打开 URL

| 参数       | 类型   | 必需 | 说明                                  |
| ---------- | ------ | ---- | ------------------------------------- |
| `url`      | string | 是   | 要打开的 URL                          |
| `tabId`    | number | 否   | 已有标签页 ID（传入则在该标签页导航） |
| `windowId` | number | 否   | 窗口 ID（新开标签页时可指定窗口）     |
| `target`   | string | 否   | 目标浏览器                            |

返回打开后的标签页 ID。

### js_eyes_close_tab — 关闭标签页

| 参数     | 类型   | 必需 | 说明           |
| -------- | ------ | ---- | -------------- |
| `tabId`  | number | 是   | 要关闭的标签页 |
| `target` | string | 否   | 目标浏览器     |

### js_eyes_get_html — 获取页面 HTML

| 参数     | 类型   | 必需 | 说明       |
| -------- | ------ | ---- | ---------- |
| `tabId`  | number | 是   | 标签页 ID  |
| `target` | string | 否   | 目标浏览器 |

返回该标签页的完整 HTML 字符串。

### js_eyes_execute_script — 执行 JavaScript

| 参数     | 类型   | 必需 | 说明                     |
| -------- | ------ | ---- | ------------------------ |
| `tabId`  | number | 是   | 标签页 ID                |
| `code`   | string | 是   | 要执行的 JavaScript 代码 |
| `target` | string | 否   | 目标浏览器               |

返回脚本执行结果（字符串或 JSON）。

### js_eyes_get_cookies — 获取 Cookie

| 参数     | 类型   | 必需 | 说明       |
| -------- | ------ | ---- | ---------- |
| `tabId`  | number | 是   | 标签页 ID  |
| `target` | string | 否   | 目标浏览器 |

返回该标签页对应域名的所有 Cookie（JSON 数组）。

---

## 5. CLI 命令：终端侧运维

插件注册了 `js-eyes` 命令组，用于终端侧的状态查看和服务器管理。

### 状态查看

```bash
openclaw js-eyes status
```

输出示例：

```
=== JS-Eyes Server Status ===
  运行时间: 3600s
  浏览器扩展: 1 个
    - Chrome (client-abc123), 5 个标签页
  自动化客户端: 0 个
  标签页总数: 5
  待处理请求: 0
```

### 标签页列表

```bash
openclaw js-eyes tabs
```

输出格式与 `js_eyes_get_tabs` 工具相同，但直接在终端打印。

### 服务器管理

```bash
openclaw js-eyes server start   # 手动启动（autoStartServer=false 时使用）
openclaw js-eyes server stop    # 手动停止
```

---

## 6. 实战场景

### 场景一：批量提取页面数据

对话中告诉 Agent：

> "帮我打开这 5 个产品页面，提取每个页面的标题和价格。"

Agent 的执行流程：

1. 调用 `js_eyes_open_url` 依次打开 5 个 URL
2. 对每个返回的 tabId 调用 `js_eyes_execute_script`，注入提取代码：
   ```javascript
   JSON.stringify({
     title: document.querySelector("h1")?.textContent,
     price: document.querySelector(".price")?.textContent,
   });
   ```
3. 收集结果并整理返回

### 场景二：跨站登录状态检查

> "检查一下我在 GitHub、Gmail、Twitter 上是否还处于登录状态。"

Agent 的执行流程：

1. 调用 `js_eyes_get_tabs` 查看已有标签页
2. 对目标站点调用 `js_eyes_get_cookies`，检查认证相关的 Cookie 是否存在且未过期

### 场景三：页面内容辅助分析

> "帮我获取当前标签页的 HTML，分析一下页面结构。"

Agent 的执行流程：

1. 调用 `js_eyes_get_tabs` 找到活跃标签页的 ID
2. 调用 `js_eyes_get_html` 获取完整 HTML
3. 分析 DOM 结构并给出建议

### 场景四：自动化表单填写

> "帮我在这个注册页面上填写以下信息：用户名 test123，邮箱 test@example.com。"

Agent 调用 `js_eyes_execute_script` 注入填写代码：

```javascript
document.querySelector("#username").value = "test123";
document.querySelector("#email").value = "test@example.com";
document.querySelector("#username").dispatchEvent(new Event("input", { bubbles: true }));
document.querySelector("#email").dispatchEvent(new Event("input", { bubbles: true }));
("填写完成");
```

---

## 7. 多浏览器协同

当 Chrome 和 Firefox 同时安装并连接了 JS-Eyes 扩展时，所有工具都支持 `target` 参数来指定操作目标。

```
target 参数值          含义
────────────────────  ──────────────────
省略                  服务端选择第一个可用扩展
"chrome"              指定 Chrome 浏览器
"firefox"             指定 Firefox 浏览器
"client-abc123"       指定具体的 clientId
```

用法示例：先用 `js_eyes_list_clients` 查看连接情况，再用 `target` 精确控制。

注意：`js_eyes_get_tabs` 和 `js_eyes_list_clients` 始终返回所有浏览器的数据，`target` 对这两个查询工具无效。

---

## 8. 故障排查

### 连接不上服务器

| 症状                           | 排查方向                                                            |
| ------------------------------ | ------------------------------------------------------------------- | ---------------- |
| 扩展显示 "Disconnected"        | 确认 OpenClaw Gateway 正在运行且日志中有 `[js-eyes] Server started` |
| 服务器启动失败                 | 检查 18080 端口是否被占用（`netstat -ano                            | findstr 18080`） |
| `openclaw js-eyes status` 报错 | 确认 `serverHost` 和 `serverPort` 配置与浏览器扩展中填写的一致      |

### 工具调用无响应

| 症状                     | 排查方向                                                       |
| ------------------------ | -------------------------------------------------------------- |
| 工具超时                 | 增大 `requestTimeout` 值；检查页面是否在加载中                 |
| 返回"没有浏览器扩展连接" | 确认扩展已安装并显示绿色连接状态；检查扩展中填写的地址是否正确 |
| 脚本执行失败             | 确认标签页 ID 有效（先用 `js_eyes_get_tabs` 查看）             |

### Agent 调用了内置 browser 工具而非 JS-Eyes

**症状**：在对话中让 Agent "查看浏览器标签页"，返回结果被 `<<<EXTERNAL_UNTRUSTED_CONTENT>>>` 包裹，`Source: Browser`，且 `tabs` 为空数组。

**原因**：OpenClaw 内置了一套基于 CDP 的 `browser` 工具。Agent 收到浏览器相关指令时，可能优先选择内置工具而非 JS-Eyes 插件工具。内置 browser 启动的是独立 Chromium 实例，与用户实际使用的浏览器无关，因此返回空。

**解决方案**：在 Agent 的 workspace 下编辑 `TOOLS.md`，添加明确指引，告知 Agent 必须使用 `js_eyes_*` 系列工具操作浏览器：

```markdown
## JS-Eyes 浏览器控制

当用户要求操作浏览器（查看标签页、打开页面、获取内容、执行脚本、读取 Cookie 等）时，
**必须使用 js*eyes*\* 系列工具**，而非内置的 browser 工具。
JS-Eyes 直接控制用户正在使用的真实浏览器（Firefox/Chrome），
而内置 browser 工具启动的是独立的 Chromium 实例。

可用工具：

- `js_eyes_get_tabs` — 获取所有标签页列表
- `js_eyes_list_clients` — 列出已连接的浏览器
- `js_eyes_open_url` — 打开 URL
- `js_eyes_close_tab` — 关闭指定标签页
- `js_eyes_get_html` — 获取标签页完整 HTML
- `js_eyes_execute_script` — 在标签页中执行 JavaScript
- `js_eyes_get_cookies` — 获取标签页的 Cookies
```

多 Agent 环境下，每个 Agent 的 workspace 都有独立的 `TOOLS.md`，需要分别添加。例如：

- `D:/.openclaw/workspace/TOOLS.md`（main Agent）
- `D:/.openclaw/workspace-xiaofei/TOOLS.md`（xiaofei Agent）

### Windows 特有问题

插件内置了 Windows 平台的 `windowsHide` 补丁——OpenClaw 在 Windows 上执行 `child_process.spawn` / `execFile` 时会弹出 CMD 窗口，插件通过猴子补丁将 `windowsHide` 默认设为 `true`，消除弹窗。这个补丁在非 Windows 平台上自动跳过。

---

## 9. 与 OpenClaw 内置浏览器控制的区别

OpenClaw 自身也有浏览器控制能力（通过 Chrome/Chromium + CDP），两者定位不同：

| 维度         | OpenClaw 内置浏览器      | JS-Eyes 插件                     |
| ------------ | ------------------------ | -------------------------------- |
| 控制方式     | Chrome DevTools Protocol | WebSocket + 浏览器扩展           |
| 浏览器要求   | 需启动 Chromium 实例     | 用户日常使用的任意浏览器         |
| 会话复用     | 独立浏览器实例           | 复用用户已登录的浏览器会话       |
| Cookie 访问  | 仅限启动的实例           | 访问用户浏览器中真实的 Cookie    |
| 多浏览器支持 | 仅 Chromium              | Chrome + Edge + Firefox 同时支持 |
| 适用场景     | 沙箱化的自动化任务       | 需要利用用户已有登录态的任务     |

简言之：需要干净沙箱用内置浏览器，需要真实登录态用 JS-Eyes。

---

## 10. 相关文档

| 文档                   | 位置                                           | 内容                     |
| ---------------------- | ---------------------------------------------- | ------------------------ |
| JS-Eyes 项目中文文档   | `JS-Eyes/docs/README_CN.md`                    | 完整功能和安装说明       |
| Node.js 客户端 API     | `JS-Eyes/clients/README.md`                    | BrowserAutomation 类 API |
| 插件源码               | `JS-Eyes/openclaw-plugin/index.mjs`            | 工具注册实现             |
| 插件清单               | `JS-Eyes/openclaw-plugin/openclaw.plugin.json` | 配置 Schema 定义         |
| OpenClaw 插件创建指引  | `plugin-creation-guide.md`（本目录）           | 插件系统深度分析         |
| 从笔记到插件的演化历程 | `from-notes-to-plugin.md`（本目录）            | 需求驱动的工具演化       |
