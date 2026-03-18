# G68: Cursor Agent 集成必须采用“零依赖核心层 + 长驻进程池 + 多入口适配”架构以解决短命令模型与有状态会话的冲突

> 直接在现有短命令插件中修补无法兼容 Cursor 的长驻有状态进程模型，必须通过剥离核心逻辑为独立无依赖模块，并构建具备自动回收与权限策略的进程池来支撑 CLI/MCP/Plugin 多场景复用。

## 包含的 Atoms

| 编号  | 来源                             | 内容摘要                                                                                                 |
| ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| JA-01 | js-cursor-agent-project-creation | Cursor IDE 的 `agent acp` 是一个基于 stdio JSON-RPC 2.0 (NDJSON) 通信的 ACP Server                       |
| JA-02 | js-cursor-agent-project-creation | OpenClaw ACP 系统包含 ACP Bridge（作为 Server）和 ACP Runtime（作为客户端驱动外部工具）两种模式          |
| JA-03 | js-cursor-agent-project-creation | 现有 acpx 插件的短命令模式（spawn-exec-exit）与 Cursor agent 的长驻有状态进程模型不兼容                  |
| JA-04 | js-cursor-agent-project-creation | Cursor agent 运行时会通过 `session/request_permission` 请求权限，且支持 `cursor/ask_question` 等特有方法 |
| JA-05 | js-cursor-agent-project-creation | 直接在 acpx 配置字典中添加 Cursor 条目不可行，必须创建独立的长驻进程管理方案                             |
| JA-06 | js-cursor-agent-project-creation | 采用“一套核心逻辑 + 三种消费入口（CLI/MCP/Plugin）”架构可避免项目绑死 OpenClaw                           |
| JA-07 | js-cursor-agent-project-creation | 核心层 (core/) 设计原则是零 OpenClaw 依赖，仅由插件层做薄适配器桥接                                      |
| JA-08 | js-cursor-agent-project-creation | 长驻进程池需实现按会话映射、自动复用、空闲回收及非交互式环境下的权限自动审批                             |
| JA-09 | js-cursor-agent-project-creation | 选择纯 JavaScript 而非 TypeScript 以保持与 js-knowledge-flomo 项目风格一致                               |
| JA-10 | js-cursor-agent-project-creation | JSON-RPC 传输层不依赖官方 SDK，而是用 readline + JSON.parse 自实现以减轻依赖                             |
| JA-11 | js-cursor-agent-project-creation | 权限策略分为 approve-all、approve-reads、deny-all 三档                                                   |
| JA-12 | js-cursor-agent-project-creation | core/process-manager.js 负责管理进程池，支持 getOrSpawn、kill、空闲计时回收等功能                        |
| JA-13 | js-cursor-agent-project-creation | core/acp-client.js 封装了 createSession、prompt(AsyncGenerator)、cancel、setMode 等高层操作              |
| JA-14 | js-cursor-agent-project-creation | MCP Server 提供 stdio 和 HTTP 双模式入口，包含会话管理、Prompt 交互、配置诊断共 6 个工具                 |
| JA-15 | js-cursor-agent-project-creation | OpenClaw 插件通过实现 `AcpRuntime` 接口（ensureSession, runTurn 等）桥接核心层                           |
| JA-16 | js-cursor-agent-project-creation | JsonRpcTransport 需同时处理出站请求（Promise）、入站响应、服务端请求（如权限）及无 ID 通知               |
| JA-17 | js-cursor-agent-project-creation | ProcessManager 需设置并发限制（默认 4），超出时驱逐最老进程，并每分钟扫描回收空闲超过 30 分钟的进程      |
| JA-18 | js-cursor-agent-project-creation | prompt 方法设计为 AsyncGenerator，在等待响应期间通过队列 yield 流式事件（text_delta/tool_call）          |
| JA-19 | js-cursor-agent-project-creation | OpenClaw 插件层（CursorRuntime）不应包含业务逻辑，所有智能应集中在 core 层                               |
| JA-20 | js-cursor-agent-project-creation | 后续演化可将会话持久化绑定到 OpenClaw channel/thread，以实现跨重启恢复                                   |

## 组内逻辑顺序

遵循“问题定义与架构决策 -> 核心层实现细节 -> 多入口适配方案 -> 运维与演化策略”的结构顺序。首先明确短命令模型与 Cursor 长驻模型的冲突（JA-03, JA-05），确立“核心层零依赖 + 多入口”架构（JA-06, JA-07）；接着详述核心层的进程池管理（JA-08, JA-12, JA-17）、客户端封装（JA-13, JA-18）及传输层实现（JA-01, JA-10, JA-16）；然后说明 MCP 与 OpenClaw 插件的具体适配方式（JA-14, JA-15, JA-19）；最后补充技术选型理由（JA-09）及未来持久化方向（JA-20）。
