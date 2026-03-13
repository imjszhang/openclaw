# G64: JS Eyes 项目必须采用“浏览器主动连接 + 逆向架构”模式以填补 Agent 框架在实时复用用户浏览器环境上的能力空白

> 主流 Agent 框架依赖独立进程启动浏览器，而 JS Eyes 通过扩展主动连接 WebSocket 服务器，实现了 Agent 对用户正在使用的浏览器的实时、低侵入访问与控制。

## 包含的 Atoms

| 编号  | 来源                     | 内容摘要                                                                                  |
| ----- | ------------------------ | ----------------------------------------------------------------------------------------- |
| EP-01 | js-eyes-project-creation | 主流 Agent 框架缺乏轻量级实时浏览器连接方案，现有工具需独立启动进程而非复用用户当前浏览器 |
| EP-02 | js-eyes-project-creation | JS Eyes 采用“浏览器主动连接 Agent"的逆向架构，通过扩展+WebSocket 实现实时访问             |
| EP-03 | js-eyes-project-creation | 系统由浏览器扩展、WebSocket 服务器、Agent 插件三层组件构成，通过双向 WebSocket 链路解耦   |
| EP-04 | js-eyes-project-creation | Chrome/Edge 使用 Manifest V3，Firefox 使用 Manifest V2，两者功能对等但实现细节不同        |
| EP-05 | js-eyes-project-creation | 浏览器扩展具备实时通信、标签页同步、远程控制、Cookie 管理及断线后指数退避重连五大核心能力 |
| EP-06 | js-eyes-project-creation | 获取跨域内容需通过 Content Script 注入方式实现                                            |
| EP-07 | js-eyes-project-creation | v1.1.0 版本完成双平台扩展、WebSocket 通信及标签页管理、内容获取、脚本执行等核心功能闭环   |
| EP-08 | js-eyes-project-creation | 项目结构包含 chrome-extension、firefox-extension、server、clients、openclaw-plugin 等目录 |
| EP-09 | js-eyes-project-creation | 项目演化路径遵循“核心功能→安全认证→连接稳定性→构建工具链→多服务器适配”的迭代逻辑          |
| EP-10 | js-eyes-project-creation | v1.2.0 引入 HMAC-SHA256 认证，v1.3.x 系列专注于速率限制、重连防抖、熔断器及心跳机制       |
| EP-11 | js-eyes-project-creation | OpenClaw 插件注册了 9 个 AI 工具，涵盖标签页管理、HTML 获取、脚本执行、Cookie 读取等      |
| EP-12 | js-eyes-project-creation | 插件配置默认监听 localhost:18080，加载时自动启动服务器，请求超时设为 60 秒                |
| EP-13 | js-eyes-project-creation | 扩展技能是构建在基础自动化之上的高层能力，表现为可单独安装的独立 OpenClaw 插件            |
| EP-14 | js-eyes-project-creation | 技能安装流程为：Agent 调用 discover_skills 查询注册表，再调用 install_skill 下载并注册    |
| EP-15 | js-eyes-project-creation | 支持通过 curl 管道或 PowerShell 变量赋值执行一键安装特定技能                              |

## 组内逻辑顺序

按“架构背景与痛点 (EP-01) → 核心架构设计 (EP-02~03) → 平台适配与能力细节 (EP-04~06) → 版本演进与项目结构 (EP-07~09) → 安全与稳定性增强 (EP-10) → OpenClaw 集成与工具链 (EP-11~12) → 技能生态与安装流程 (EP-13~15)"的逻辑排列。
