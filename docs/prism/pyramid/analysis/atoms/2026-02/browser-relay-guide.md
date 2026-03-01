# OpenClaw 浏览器插件（Browser Relay）连接与使用指南

> 来源：[../../../../journal/2026-02-11/browser-relay-guide.md](../../../../journal/2026-02-11/browser-relay-guide.md)
> 缩写：BR

## Atoms

| 编号  | 类型 | 内容                                                                                             | 原文定位                  |
| ----- | ---- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| BR-01 | 事实 | Browser Relay 是 Chrome MV3 扩展，让 AI 通过 CDP 控制现有标签页而非启动独立浏览器实例            | 概述                      |
| BR-02 | 判断 | 托管浏览器适合安全敏感任务（隔离），扩展中继适合利用已登录状态的任务（共享浏览数据）             | 概述                      |
| BR-03 | 事实 | 架构数据流：智能体→Gateway 控制服务 (18791)→本地中继服务器 (18792)→Chrome 扩展→标签页            | 架构原理                  |
| BR-04 | 步骤 | 安装步骤：`openclaw browser extension install` → Chrome 开发者模式加载 → 固定图标到工具栏        | 安装步骤                  |
| BR-05 | 经验 | 徽章红色 `ON` 表示连接成功，红色 `!` 表示中继服务未运行（需检查 Gateway）                        | 安装步骤                  |
| BR-06 | 步骤 | 三种附加方式：单个标签页点击图标、右键"Attach all tabs"一键附加当前窗口、新建标签页自动附加      | 连接与附加标签页          |
| BR-07 | 经验 | 自动附加前提：窗口内已有至少一个已附加标签页，否则新标签页不会自动附加                           | 连接与附加标签页          |
| BR-08 | 事实 | 智能体只能控制徽章显示 `ON` 的已附加标签页，无法自动控制用户正在看的标签页                       | 连接与附加标签页          |
| BR-09 | 步骤 | 智能体调用时必须使用 `profile="chrome"` 参数，支持 snapshot/open/click/type 等操作               | 与 AI 智能体配合使用      |
| BR-10 | 步骤 | CLI 命令：`openclaw browser --browser-profile chrome <tabs/snapshot/navigate/click/type>`        | CLI 命令行操作            |
| BR-11 | 事实 | 默认端口：Gateway 18789、浏览器控制服务 18791、中继服务器 18792，随 gateway.port 自动偏移        | 配置参考                  |
| BR-12 | 经验 | 远程 Gateway 场景需在 Chrome 所在机器运行 `openclaw node start`，Gateway 代理操作到节点          | 远程 Gateway 场景         |
| BR-13 | 经验 | 沙箱模式下需配置 `agents.defaults.sandbox.browser.allowHostControl: true` 才能访问宿主机浏览器   | 沙箱环境注意事项          |
| BR-14 | 事实 | 徽章状态含义：`ON`(已附加)、`…`(连接中)、`!`(中继不可达)、无徽章 (未附加)                        | 徽章状态与故障排查        |
| BR-15 | 经验 | 故障排查：徽章 `!` 时检查 Gateway 运行状态、端口配置、手动 `curl` 测试中继 18792 端口            | 徽章状态与故障排查        |
| BR-16 | 事实 | 无法附加的页面类型：`chrome://`、`chrome-extension://`、`edge://` 等内部页面                     | 徽章状态与故障排查        |
| BR-17 | 判断 | 安全建议：使用专用 Chrome 配置文件、最小化附加范围、中继仅监听 loopback、通过 Tailscale 连接远程 | 安全注意事项              |
| BR-18 | 事实 | 智能体附加后可执行：点击/输入/导航、读取页面内容、访问 cookies/session、执行 JavaScript          | 安全注意事项              |
| BR-19 | 经验 | 中继服务器安全机制：仅接受 `chrome-extension://` 来源、需要内部认证 token、仅绑定 loopback       | 安全注意事项              |
| BR-20 | 步骤 | 取消附加：点击图标取消单个、右键"Detach all tabs"取消全部，操作完成后应及时取消附加              | 连接与附加标签页/安全注意 |
