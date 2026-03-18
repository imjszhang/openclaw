# JS Cursor Agent：Cursor CLI ACP 运行时封装的创建

> 来源：[../../../../journal/2026-03-18/js-cursor-agent-project-creation.md](../../../../journal/2026-03-18/js-cursor-agent-project-creation.md)
> 缩写：JA

## Atoms

| 编号  | 类型 | 内容                                                                                                     | 原文定位                      |
| ----- | ---- | -------------------------------------------------------------------------------------------------------- | ----------------------------- |
| JA-01 | 事实 | Cursor IDE 的 `agent acp` 是一个基于 stdio JSON-RPC 2.0 (NDJSON) 通信的 ACP Server                       | 1. 问题起源                   |
| JA-02 | 事实 | OpenClaw ACP 系统包含 ACP Bridge（作为 Server）和 ACP Runtime（作为客户端驱动外部工具）两种模式          | 2.1 OpenClaw ACP 系统分析     |
| JA-03 | 判断 | 现有 acpx 插件的短命令模式（spawn-exec-exit）与 Cursor agent 的长驻有状态进程模型不兼容                  | 2.3 Cursor agent acp 的特殊性 |
| JA-04 | 经验 | Cursor agent 运行时会通过 `session/request_permission` 请求权限，且支持 `cursor/ask_question` 等特有方法 | 2.3 Cursor agent acp 的特殊性 |
| JA-05 | 判断 | 直接在 acpx 配置字典中添加 Cursor 条目不可行，必须创建独立的长驻进程管理方案                             | 3. 方向选择                   |
| JA-06 | 经验 | 采用“一套核心逻辑 + 三种消费入口（CLI/MCP/Plugin）”架构可避免项目绑死 OpenClaw                           | 3. 方向选择                   |
| JA-07 | 事实 | 核心层 (core/) 设计原则是零 OpenClaw 依赖，仅由插件层做薄适配器桥接                                      | 4.2 核心设计原则              |
| JA-08 | 经验 | 长驻进程池需实现按会话映射、自动复用、空闲回收及非交互式环境下的权限自动审批                             | 4.2 核心设计原则              |
| JA-09 | 判断 | 选择纯 JavaScript 而非 TypeScript 以保持与 js-knowledge-flomo 项目风格一致                               | 5. 技术决策                   |
| JA-10 | 经验 | JSON-RPC 传输层不依赖官方 SDK，而是用 readline + JSON.parse 自实现以减轻依赖                             | 5. 技术决策                   |
| JA-11 | 事实 | 权限策略分为 approve-all、approve-reads、deny-all 三档                                                   | 5. 技术决策                   |
| JA-12 | 事实 | core/process-manager.js 负责管理进程池，支持 getOrSpawn、kill、空闲计时回收等功能                        | 6. 四阶段实现                 |
| JA-13 | 事实 | core/acp-client.js 封装了 createSession、prompt(AsyncGenerator)、cancel、setMode 等高层操作              | 6. 四阶段实现                 |
| JA-14 | 事实 | MCP Server 提供 stdio 和 HTTP 双模式入口，包含会话管理、Prompt 交互、配置诊断共 6 个工具                 | 6. 四阶段实现                 |
| JA-15 | 事实 | OpenClaw 插件通过实现 `AcpRuntime` 接口（ensureSession, runTurn 等）桥接核心层                           | 6. 四阶段实现                 |
| JA-16 | 经验 | JsonRpcTransport 需同时处理出站请求（Promise）、入站响应、服务端请求（如权限）及无 ID 通知               | 8.1 JsonRpcTransport          |
| JA-17 | 经验 | ProcessManager 需设置并发限制（默认 4），超出时驱逐最老进程，并每分钟扫描回收空闲超过 30 分钟的进程      | 8.2 ProcessManager            |
| JA-18 | 经验 | prompt 方法设计为 AsyncGenerator，在等待响应期间通过队列 yield 流式事件（text_delta/tool_call）          | 8.3 CursorAcpClient.prompt    |
| JA-19 | 判断 | OpenClaw 插件层（CursorRuntime）不应包含业务逻辑，所有智能应集中在 core 层                               | 8.4 CursorRuntime             |
| JA-20 | 经验 | 后续演化可将会话持久化绑定到 OpenClaw channel/thread，以实现跨重启恢复                                   | 9. 后续演化                   |
