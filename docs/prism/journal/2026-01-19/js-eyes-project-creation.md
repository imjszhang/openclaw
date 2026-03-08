# JS Eyes：浏览器自动化插件的创建

> 编写日期：2026-01-19
> 记录 JS Eyes 项目的创建——一个通过 WebSocket 为 AI Agent 提供浏览器自动化能力的浏览器扩展。

---

## 目录

1. [项目动机](#1-项目动机)
2. [核心架构](#2-核心架构)
3. [浏览器扩展设计](#3-浏览器扩展设计)
4. [首版功能](#4-首版功能)
5. [项目结构](#5-项目结构)
6. [当日进展](#6-当日进展)
7. [版本演化](#7-版本演化)
8. [OpenClaw 插件化](#8-openclaw-插件化)
9. [扩展技能系统](#9-扩展技能系统)

---

## 1. 项目动机

AI Agent 在实际工作流中经常需要与浏览器交互——获取网页内容、管理标签页、执行脚本、读取 Cookie。但主流 Agent 框架缺少一种**轻量级、实时的浏览器连接方案**。

已有的方案（如 Puppeteer、Playwright）是"程序控制浏览器"，需要启动独立的浏览器进程。而很多场景下，用户**已经在使用浏览器**，需要的是让 Agent 能"看到"和"操作"当前浏览器中的内容。

JS Eyes 的设计思路是反过来：不是 Agent 启动浏览器，而是**浏览器主动连接 Agent**。通过浏览器扩展 + WebSocket，在用户正常使用浏览器的同时，Agent 获得实时的浏览器访问能力。

## 2. 核心架构

三组件通过 WebSocket 构成双向通信链路：

```
Browser Extension  <── WebSocket ──>  JS-Eyes Server  <── WebSocket ──>  AI Agent
 (Chrome/Edge/FF)                     (Node.js)                         (OpenClaw Plugin)
```

| 组件                 | 职责                                              |
| -------------------- | ------------------------------------------------- |
| **浏览器扩展**       | 运行在用户浏览器中，监听标签页变化，执行远程指令  |
| **WebSocket 服务器** | 中间层，桥接浏览器扩展和 Agent，管理连接和路由    |
| **Agent 插件**       | 注册 AI 工具，让 Agent 能以自然语言调用浏览器能力 |

这种三层架构的优势在于解耦——浏览器扩展不需要知道 Agent 框架是什么，Agent 也不需要关心浏览器是 Chrome 还是 Firefox。

## 3. 浏览器扩展设计

同时支持三种主流浏览器，采用不同的 Manifest 版本：

| 浏览器  | 版本要求 | Manifest |
| ------- | -------- | -------- |
| Chrome  | 88+      | V3       |
| Edge    | 88+      | V3       |
| Firefox | 58+      | V2       |

Chrome/Edge 共用同一套 Manifest V3 代码（`chrome-extension/`），Firefox 使用独立的 V2 实现（`firefox-extension/`）。两套扩展功能对等，但 Manifest 差异导致后台脚本生命周期、权限声明等实现细节不同。

扩展的核心能力：

- **实时 WebSocket 通信**：与服务器保持持久连接
- **标签页同步**：自动追踪所有打开的标签页信息（URL、标题、ID）
- **远程控制**：接收并执行来自 Agent 的指令（打开/关闭标签页、获取 HTML、执行脚本等）
- **Cookie 管理**：读取和同步页面 Cookie
- **自动重连**：断线后指数退避重连

## 4. 首版功能

v1.1.0（创建日当天发布）包含完整的核心功能闭环：

### 4.1 标签页管理

- 获取所有打开标签页的列表（ID、URL、标题）
- 远程打开指定 URL（新标签页或复用已有标签页）
- 远程关闭指定标签页

### 4.2 内容获取

- 获取指定标签页的完整 HTML 内容
- 支持跨域内容获取（通过 Content Script 注入）

### 4.3 脚本执行

- 在指定标签页中执行任意 JavaScript 代码
- 返回执行结果（包括 DOM 查询、数据提取等）

### 4.4 Cookie 访问

- 获取指定标签页域名下的所有 Cookie
- 后续版本（v1.3.1）增加了按域名查询 Cookie 的能力

## 5. 项目结构

```
JS-Eyes/
├── chrome-extension/         # Chrome/Edge 扩展（Manifest V3）
│   ├── manifest.json
│   ├── background.js         # Service Worker
│   ├── content.js            # Content Script
│   └── popup/                # 扩展弹出面板
├── firefox-extension/        # Firefox 扩展（Manifest V2）
│   ├── manifest.json
│   ├── background.js         # Background Script
│   ├── content.js
│   └── popup/
├── server/                   # WebSocket 服务器
│   ├── index.js              # 入口，HTTP + WebSocket 单端口
│   └── ws-handler.js         # WebSocket 消息路由
├── clients/                  # 客户端 SDK
│   └── js-eyes-client.js     # Node.js WebSocket 客户端
├── openclaw-plugin/          # OpenClaw 插件
│   ├── openclaw.plugin.json  # 插件清单
│   ├── index.mjs             # 注册 AI 工具 + 服务 + CLI
│   └── package.json
├── skills/                   # 扩展技能
│   └── js-search-x/          # X.com 搜索技能
├── cli/                      # CLI 工具链
│   └── cli.js                # build, bump, commit, sync, release
├── src/                      # 项目官网源码
├── docs/                     # 官网构建产物（GitHub Pages）
├── test/                     # 单元测试
├── SKILL.md                  # ClawHub 技能发布清单
└── install.sh / install.ps1  # 一键安装脚本
```

## 6. 当日进展

2026-01-19 是项目的创建日。主要里程碑：

| 时间  | 进展                                                                   |
| ----- | ---------------------------------------------------------------------- |
| 12:49 | Initial commit——项目初始化                                             |
| 17:18 | 版本升级到 v1.1.0，Chrome 和 Firefox 扩展同步更新，README 添加下载说明 |
| 17:26 | README 文档完善，统一版本号标注                                        |

创建日即完成了 Chrome 扩展（Manifest V3）和 Firefox 扩展（Manifest V2）的双平台实现、WebSocket 通信核心、标签页管理、内容获取、脚本执行等核心功能，并在当天发布了 v1.1.0 版本。

## 7. 版本演化

从创建到目前（2026-03-08），项目已积累 **55 次提交**，经历了多个重要版本：

| 版本   | 日期       | 主要变更                                         |
| ------ | ---------- | ------------------------------------------------ |
| v1.1.0 | 2026-01-19 | 首版——双平台扩展、核心自动化功能                 |
| v1.2.0 | 2026-01-26 | HMAC-SHA256 认证、安全配置                       |
| v1.3.0 | 2026-01-31 | 稳定性增强——速率限制、请求去重、队列管理         |
| v1.3.1 | 2026-02-04 | 按域名查询 Cookie                                |
| v1.3.2 | 2026-02-06 | 重构类名、改进重连机制（抖动防惊群）             |
| v1.3.3 | 2026-02-08 | 统一构建流程——单一 Node.js 脚本替代 6 个平台脚本 |
| v1.3.4 | 2026-02-09 | 连接孤儿防护、Socket 清理                        |
| v1.3.5 | 2026-02-11 | 健康检查、熔断器、SSE 降级、心跳机制             |
| v1.4.0 | 2026-02-24 | 服务器能力自动发现、统一 URL 入口、多服务器适配  |

演化路径清晰：**核心功能 → 安全认证 → 连接稳定性 → 构建工具链 → 多服务器适配**。

## 8. OpenClaw 插件化

JS Eyes 在 `openclaw-plugin/` 子目录中实现了完整的 OpenClaw 插件，注册了三类能力：

### 后台服务

插件加载时自动启动内置 WebSocket 服务器，插件卸载时自动停止。

### AI 工具（9 个）

| 工具                      | 功能                         |
| ------------------------- | ---------------------------- |
| `js_eyes_get_tabs`        | 列出所有打开的标签页         |
| `js_eyes_list_clients`    | 列出已连接的浏览器扩展客户端 |
| `js_eyes_open_url`        | 打开指定 URL                 |
| `js_eyes_close_tab`       | 关闭指定标签页               |
| `js_eyes_get_html`        | 获取标签页完整 HTML          |
| `js_eyes_execute_script`  | 在标签页中执行 JavaScript    |
| `js_eyes_get_cookies`     | 获取标签页域名的 Cookie      |
| `js_eyes_discover_skills` | 查询可用的扩展技能           |
| `js_eyes_install_skill`   | 下载并安装扩展技能           |

### CLI 命令

```bash
openclaw js-eyes status          # 查看服务器状态和连接信息
openclaw js-eyes tabs            # 列出所有标签页
openclaw js-eyes server start    # 手动启动服务器
openclaw js-eyes server stop     # 手动停止服务器
```

### 插件配置

| 选项                | 默认值                              | 说明                     |
| ------------------- | ----------------------------------- | ------------------------ |
| `serverHost`        | `"localhost"`                       | 服务器监听地址           |
| `serverPort`        | `18080`                             | 服务器端口               |
| `autoStartServer`   | `true`                              | 插件加载时自动启动服务器 |
| `requestTimeout`    | `60`                                | 请求超时（秒）           |
| `skillsRegistryUrl` | `"https://js-eyes.com/skills.json"` | 扩展技能注册表 URL       |

## 9. 扩展技能系统

v1.4.0 引入了**扩展技能（Extension Skills）**概念——在基础浏览器自动化之上构建高层能力。每个扩展技能是独立的 OpenClaw 插件，可单独安装。

目前已有一个扩展技能：

| 技能                                                   | 功能           | 提供的工具                                                          |
| ------------------------------------------------------ | -------------- | ------------------------------------------------------------------- |
| [js-search-x](https://js-eyes.com/skills/js-search-x/) | X.com 内容抓取 | `x_search_tweets`, `x_get_profile`, `x_get_post`, `x_get_home_feed` |

技能发现和安装流程：

1. Agent 调用 `js_eyes_discover_skills` 查询注册表
2. Agent 调用 `js_eyes_install_skill` 下载、解压、安装依赖
3. 新技能自动注册为独立的 OpenClaw 插件

也支持一键安装脚本：

```bash
# Linux / macOS
curl -fsSL https://js-eyes.com/install.sh | bash -s -- js-search-x

# Windows PowerShell
$env:JS_EYES_SKILL="js-search-x"; irm https://js-eyes.com/install.ps1 | iex
```

---

## 相关链接

- GitHub：<https://github.com/imjszhang/js-eyes>
- 项目官网：<https://js-eyes.com>
- ClawHub 页面：<https://clawhub.ai/skills/js-eyes>

## 相关文档

| 文档                                    | 日期       | 内容                                    |
| --------------------------------------- | ---------- | --------------------------------------- |
| `js-eyes-openclaw-plugin-guide.md`      | 2026-02-25 | JS-Eyes OpenClaw 插件使用指南           |
| `clawhub-publish-guide.md`              | 2026-02-25 | ClawHub 技能发布指南（以 JS-Eyes 为例） |
| `browser-relay-guide.md`                | 2026-02-11 | 浏览器中继配置指南                      |
| `js-eyes-install-script-fix.md`         | 2026-02-28 | 安装脚本修复记录                        |
| `js-eyes-agent-first-transformation.md` | 2026-02-26 | JS-Eyes Agent-First 架构转型            |
