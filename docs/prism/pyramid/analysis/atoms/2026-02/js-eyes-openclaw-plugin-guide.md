# JS-Eyes OpenClaw 插件使用指南

> 来源：[../../../../journal/2026-02-25/js-eyes-openclaw-plugin-guide.md](../../../../journal/2026-02-25/js-eyes-openclaw-plugin-guide.md)
> 缩写：JE

## Atoms

| 编号  | 类型 | 内容                                                                                                       | 原文定位                            |
| ----- | ---- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------- |
| JE-01 | 事实 | JS-Eyes 是通过 WebSocket 为 AI Agent 提供远程浏览器控制能力的浏览器扩展                                    | 1. 这是什么：一句话理解 JS-Eyes     |
| JE-02 | 事实 | OpenClaw 插件将 JS-Eyes 能力封装为 7 个工具，支持对话中控制浏览器打开页面、提取内容、执行脚本和管理 Cookie | 1. 这是什么：一句话理解 JS-Eyes     |
| JE-03 | 事实 | 系统架构包含浏览器扩展、JS-Eyes Server（HTTP/WS 18080 端口）和 OpenClaw Agent 三层通信链路                 | 2. 整体架构：三层通信链路           |
| JE-04 | 事实 | 设计采用单端口复用策略，HTTP 和 WebSocket 共用 18080 端口以简化扩展配置                                    | 2. 整体架构：三层通信链路           |
| JE-05 | 事实 | 扩展通过 `/api/browser/config` 接口自动探测服务器类型和能力                                                | 2. 整体架构：三层通信链路           |
| JE-06 | 经验 | OpenClaw 启动时会自动拉起内置的 JS-Eyes Server，无需手动启动独立进程                                       | 2. 整体架构：三层通信链路           |
| JE-07 | 步骤 | Chrome/Edge 安装需解压 zip 包后在 `chrome://extensions/`开启开发者模式加载                                 | 3. 安装与配置：四步上线             |
| JE-08 | 步骤 | Firefox 安装可直接拖入 xpi 文件或通过 `about:debugging`临时载入附加组件                                    | 3. 安装与配置：四步上线             |
| JE-09 | 步骤 | 需在 `~/.openclaw/openclaw.json` 中配置插件路径及 serverHost、serverPort、autoStartServer 等参数           | 3. 安装与配置：四步上线             |
| JE-10 | 步骤 | 连接扩展时需输入服务器地址 `http://localhost:18080`并点击 Connect，状态变绿即成功                          | 3. 安装与配置：四步上线             |
| JE-11 | 事实 | 插件注册的 7 个 AI 工具均标记为 `optional: true`，创建失败不会阻断插件加载                                 | 4. 七个 AI 工具详解                 |
| JE-12 | 事实 | `js_eyes_get_tabs` 工具用于获取已连接浏览器的标签页 ID、标题、URL 和活跃状态                               | 4. 七个 AI 工具详解                 |
| JE-13 | 事实 | `js_eyes_open_url` 工具支持指定 tabId 在现有标签页导航或指定 windowId 在新窗口打开                         | 4. 七个 AI 工具详解                 |
| JE-14 | 事实 | `js_eyes_execute_script` 工具可注入 JS 代码并返回执行结果（字符串或 JSON）                                 | 4. 七个 AI 工具详解                 |
| JE-15 | 事实 | `js_eyes_get_cookies` 工具返回指定标签页对应域名的所有 Cookie（JSON 数组）                                 | 4. 七个 AI 工具详解                 |
| JE-16 | 步骤 | 终端可通过 `openclaw js-eyes status` 查看服务器运行时间、连接扩展数及标签页总数                            | 5. CLI 命令：终端侧运维             |
| JE-17 | 步骤 | 当 `autoStartServer` 设为 false 时，需手动执行 `openclaw js-eyes server start` 启动服务器                  | 5. CLI 命令：终端侧运维             |
| JE-18 | 经验 | 批量提取数据时，Agent 应先调用 `open_url` 再对返回的 tabId 注入提取脚本并收集结果                          | 6. 实战场景                         |
| JE-19 | 经验 | 检查登录状态时，Agent 需调用 `get_cookies` 检查认证相关 Cookie 是否存在且未过期                            | 6. 实战场景                         |
| JE-20 | 经验 | 自动化表单填写后需手动 dispatch 'input' 事件以触发框架的响应逻辑                                           | 6. 实战场景                         |
| JE-21 | 事实 | 多浏览器协同下，`target` 参数可指定 "chrome"、"firefox" 或具体 clientId 来控制操作目标                     | 7. 多浏览器协同                     |
| JE-22 | 判断 | `target` 参数对 `js_eyes_get_tabs` 和 `js_eyes_list_clients` 这两个查询工具无效，始终返回全部数据          | 7. 多浏览器协同                     |
| JE-23 | 经验 | 若扩展显示 "Disconnected"，需确认 OpenClaw Gateway 正在运行且日志包含 Server started 信息                  | 8. 故障排查                         |
| JE-24 | 经验 | 服务器启动失败通常因 18080 端口被占用，可用 `netstat -ano                                                  | findstr 18080` 排查                 | 8. 故障排查 |
| JE-25 | 经验 | Windows 平台插件内置了 `windowsHide` 猴子补丁，默认隐藏执行子进程时弹出的 CMD 窗口                         | 8. 故障排查                         |
| JE-26 | 判断 | OpenClaw 内置浏览器适用于沙箱化自动化任务，而 JS-Eyes 适用于需利用用户已有登录态的任务                     | 9. 与 OpenClaw 内置浏览器控制的区别 |
| JE-27 | 事实 | OpenClaw 内置浏览器基于 CDP 协议需启动 Chromium 实例，而 JS-Eyes 基于 WebSocket 复用用户日常浏览器         | 9. 与 OpenClaw 内置浏览器控制的区别 |
| JE-28 | 事实 | JS-Eyes 支持 Chrome、Edge 和 Firefox 多浏览器同时连接，内置浏览器仅支持 Chromium                           | 9. 与 OpenClaw 内置浏览器控制的区别 |
