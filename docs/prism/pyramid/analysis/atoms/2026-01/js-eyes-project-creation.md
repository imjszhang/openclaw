# JS Eyes：浏览器自动化插件的创建

> 来源：[../../../../journal/2026-01-19/js-eyes-project-creation.md](../../../../journal/2026-01-19/js-eyes-project-creation.md)
> 缩写：EP

## Atoms

| 编号  | 类型 | 内容                                                                                                                  | 原文定位                   |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| EP-01 | 判断 | 主流 Agent 框架缺乏轻量级实时浏览器连接方案，现有工具（Puppeteer/Playwright）需独立启动进程而非复用用户当前浏览器     | 项目动机                   |
| EP-02 | 事实 | JS Eyes 采用“浏览器主动连接 Agent"的逆向架构，通过扩展+WebSocket 实现 Agent 对用户正在使用的浏览器的实时访问          | 项目动机                   |
| EP-03 | 事实 | 系统由浏览器扩展、WebSocket 服务器（Node.js）、Agent 插件三层组件构成，通过双向 WebSocket 链路解耦浏览器与 Agent 框架 | 核心架构                   |
| EP-04 | 事实 | Chrome 和 Edge 使用 Manifest V3，Firefox 使用 Manifest V2，两者功能对等但后台脚本生命周期和权限声明实现细节不同       | 浏览器扩展设计             |
| EP-05 | 事实 | 浏览器扩展具备实时通信、标签页同步、远程控制、Cookie 管理及断线后指数退避重连五大核心能力                             | 浏览器扩展设计             |
| EP-06 | 步骤 | 获取跨域内容需通过 Content Script 注入方式实现                                                                        | 首版功能 > 内容获取        |
| EP-07 | 事实 | v1.1.0 版本在创建当日发布，完成了双平台扩展、WebSocket 通信及标签页管理、内容获取、脚本执行等核心功能闭环             | 首版功能                   |
| EP-08 | 事实 | 项目结构包含 chrome-extension、firefox-extension、server、clients、openclaw-plugin、skills 及 CLI 工具链等目录        | 项目结构                   |
| EP-09 | 经验 | 项目演化路径遵循“核心功能→安全认证→连接稳定性→构建工具链→多服务器适配”的迭代逻辑                                      | 版本演化                   |
| EP-10 | 事实 | v1.2.0 引入 HMAC-SHA256 认证，v1.3.x 系列专注于速率限制、重连防抖、熔断器及心跳机制等稳定性增强                       | 版本演化                   |
| EP-11 | 事实 | OpenClaw 插件注册了 9 个 AI 工具，涵盖标签页管理、HTML 获取、脚本执行、Cookie 读取及技能发现与安装                    | OpenClaw 插件化 > AI 工具  |
| EP-12 | 步骤 | 插件配置默认监听 localhost:18080，加载时自动启动服务器，请求超时设为 60 秒，技能注册表指向 js-eyes.com/skills.json    | OpenClaw 插件化 > 插件配置 |
| EP-13 | 事实 | 扩展技能（Extension Skills）是构建在基础自动化之上的高层能力，表现为可单独安装的独立 OpenClaw 插件                    | 扩展技能系统               |
| EP-14 | 步骤 | 技能安装流程为：Agent 调用 discover_skills 查询注册表，再调用 install_skill 下载解压并自动注册为新插件                | 扩展技能系统               |
| EP-15 | 步骤 | 支持通过 curl 管道执行 install.sh (Linux/macOS) 或 PowerShell 变量赋值执行 install.ps1 (Windows) 一键安装特定技能     | 扩展技能系统               |
