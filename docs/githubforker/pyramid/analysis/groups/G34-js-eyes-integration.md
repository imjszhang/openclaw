# G34: JS-Eyes 通过 WebSocket 复用用户浏览器环境，填补了内置沙箱浏览器在“带登录态交互”场景的能力空白

> JS-Eyes 扩展与 OpenClaw 的深度集成，实现了 AI Agent 对用户日常浏览器（Chrome/Edge/Firefox）的无损控制，解决了内置浏览器无法继承用户会话状态的痛点。

## 包含的 Atoms

| 编号  | 来源                          | 内容摘要                                                                                                   |
| ----- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| JE-01 | js-eyes-openclaw-plugin-guide | JS-Eyes 是通过 WebSocket 为 AI Agent 提供远程浏览器控制能力的浏览器扩展                                    |
| JE-02 | js-eyes-openclaw-plugin-guide | OpenClaw 插件将 JS-Eyes 能力封装为 7 个工具，支持对话中控制浏览器打开页面、提取内容、执行脚本和管理 Cookie |
| JE-03 | js-eyes-openclaw-plugin-guide | 系统架构包含浏览器扩展、JS-Eyes Server（HTTP/WS 18080 端口）和 OpenClaw Agent 三层通信链路                 |
| JE-04 | js-eyes-openclaw-plugin-guide | 设计采用单端口复用策略，HTTP 和 WebSocket 共用 18080 端口以简化扩展配置                                    |
| JE-05 | js-eyes-openclaw-plugin-guide | 扩展通过 `/api/browser/config` 接口自动探测服务器类型和能力                                                |
| JE-06 | js-eyes-openclaw-plugin-guide | OpenClaw 启动时会自动拉起内置的 JS-Eyes Server，无需手动启动独立进程                                       |
| JE-07 | js-eyes-openclaw-plugin-guide | Chrome/Edge 安装需解压 zip 包后在 `chrome://extensions/`开启开发者模式加载                                 |
| JE-08 | js-eyes-openclaw-plugin-guide | Firefox 安装可直接拖入 xpi 文件或通过 `about:debugging`临时载入附加组件                                    |
| JE-09 | js-eyes-openclaw-plugin-guide | 需在 `~/.openclaw/openclaw.json` 中配置插件路径及 serverHost、serverPort、autoStartServer 等参数           |
| JE-10 | js-eyes-openclaw-plugin-guide | 连接扩展时需输入服务器地址 `http://localhost:18080`并点击 Connect，状态变绿即成功                          |
| JE-11 | js-eyes-openclaw-plugin-guide | 插件注册的 7 个 AI 工具均标记为 `optional: true`，创建失败不会阻断插件加载                                 |
| JE-12 | js-eyes-openclaw-plugin-guide | `js_eyes_get_tabs` 工具用于获取已连接浏览器的标签页 ID、标题、URL 和活跃状态                               |
| JE-13 | js-eyes-openclaw-plugin-guide | `js_eyes_open_url` 工具支持指定 tabId 在现有标签页导航或指定 windowId 在新窗口打开                         |
| JE-14 | js-eyes-openclaw-plugin-guide | `js_eyes_execute_script` 工具可注入 JS 代码并返回执行结果（字符串或 JSON）                                 |
| JE-15 | js-eyes-openclaw-plugin-guide | `js_eyes_get_cookies` 工具返回指定标签页对应域名的所有 Cookie（JSON 数组）                                 |
| JE-16 | js-eyes-openclaw-plugin-guide | 终端可通过 `openclaw js-eyes status` 查看服务器运行时间、连接扩展数及标签页总数                            |
| JE-17 | js-eyes-openclaw-plugin-guide | 当 `autoStartServer` 设为 false 时，需手动执行 `openclaw js-eyes server start` 启动服务器                  |
| JE-18 | js-eyes-openclaw-plugin-guide | 批量提取数据时，Agent 应先调用 `open_url` 再对返回的 tabId 注入提取脚本并收集结果                          |
| JE-19 | js-eyes-openclaw-plugin-guide | 检查登录状态时，Agent 需调用 `get_cookies` 检查认证相关 Cookie 是否存在且未过期                            |
| JE-20 | js-eyes-openclaw-plugin-guide | 自动化表单填写后需手动 dispatch 'input' 事件以触发框架的响应逻辑                                           |
| JE-21 | js-eyes-openclaw-plugin-guide | 多浏览器协同下，`target` 参数可指定 "chrome"、"firefox" 或具体 clientId 来控制操作目标                     |
| JE-22 | js-eyes-openclaw-plugin-guide | `target` 参数对 `js_eyes_get_tabs` 和 `js_eyes_list_clients` 这两个查询工具无效，始终返回全部数据          |
| JE-23 | js-eyes-openclaw-plugin-guide | 若扩展显示 "Disconnected"，需确认 OpenClaw Gateway 正在运行且日志包含 Server started 信息                  |
| JE-24 | js-eyes-openclaw-plugin-guide | 服务器启动失败通常因 18080 端口被占用，可用 `netstat -ano` 排查                                            |
| JE-25 | js-eyes-openclaw-plugin-guide | Windows 平台插件内置了 `windowsHide` 猴子补丁，默认隐藏执行子进程时弹出的 CMD 窗口                         |
| JE-26 | js-eyes-openclaw-plugin-guide | OpenClaw 内置浏览器适用于沙箱化自动化任务，而 JS-Eyes 适用于需利用用户已有登录态的任务                     |
| JE-27 | js-eyes-openclaw-plugin-guide | OpenClaw 内置浏览器基于 CDP 协议需启动 Chromium 实例，而 JS-Eyes 基于 WebSocket 复用用户日常浏览器         |
| JE-28 | js-eyes-openclaw-plugin-guide | JS-Eyes 支持 Chrome、Edge 和 Firefox 多浏览器同时连接，内置浏览器仅支持 Chromium                           |

## 组内逻辑顺序

遵循“架构原理 -> 安装配置 -> 工具能力 -> 实战模式 -> 故障排查 -> 场景对比”的逻辑结构。首先阐述 JS-Eyes 的三层架构与设计理念（JE-01~JE-06），接着说明多浏览器的安装与配置文件细节（JE-07~JE-10），随后详细列出 7 个核心工具的功能与参数行为（JE-11~JE-15, JE-21~JE-22），进而提供批量提取、登录检查等典型 Agent 工作流模式（JE-16~JE-20），最后涵盖常见故障诊断（JE-23~JE-25）及与内置浏览器的核心差异对比（JE-26~JE-28）。
