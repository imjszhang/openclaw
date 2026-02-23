# OpenClaw 外部脚本调用接口指引

> 来源：[../../../../journal/2026-02-06/external-scripting-guide.md](../../../../journal/2026-02-06/external-scripting-guide.md)
> 缩写：ES

## Atoms

| 编号  | 类型 | 内容                                                                                                                                        | 原文定位                    |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| ES-01 | 事实 | OpenClaw 暴露给外部脚本的接口包括：CLI 命令、HTTP API (Webhooks/OpenAI 兼容/OpenResponses/Tools)、WebSocket RPC                             | 接口总览                    |
| ES-02 | 步骤 | `openclaw agent` 命令用于触发 AI agent 运行，支持 `--message`、`--deliver`、`--thinking`、`--local` 等参数                                  | openclaw agent              |
| ES-03 | 经验 | `openclaw agent --local` 本地嵌入运行不走 Gateway，适合 CI/CD 管道配合 `--json` 输出                                                        | openclaw agent 关键行为     |
| ES-04 | 步骤 | `openclaw message send` 直接向频道发送消息（不经过 AI），支持 `--media` 附件、`--buttons`、`--card` 等                                      | openclaw message send       |
| ES-05 | 事实 | `openclaw cron` 管理定时任务，支持两种会话模式：main(systemEvent 注入心跳) 和 isolated(agentTurn 独立运行)                                  | openclaw cron               |
| ES-06 | 步骤 | Webhooks 需前置配置 `hooks.enabled=true` 和 `token`，请求时携带 `Authorization: Bearer <token>`                                             | Webhooks 前置配置           |
| ES-07 | 步骤 | `POST /hooks/wake` 唤醒主会话注入系统事件，`text` 为事件描述，`mode` 可选 now 或 next-heartbeat                                             | POST /hooks/wake            |
| ES-08 | 步骤 | `POST /hooks/agent` 运行隔离 agent turn（推荐外部脚本接口），支持 `sessionKey` 复用上下文、`deliver` 投递                                   | POST /hooks/agent           |
| ES-09 | 事实 | OpenAI 兼容接口 `POST /v1/chat/completions` 支持标准 messages 数组、SSE 流式，model 格式为 `openclaw:<agentId>`                             | OpenAI 兼容接口             |
| ES-10 | 经验 | Python openai SDK 可直接调用 OpenClaw，只需设置 `base_url` 和 `api_key`，支持 `x-openclaw-agent-id` 头                                      | OpenAI 兼容接口 Python 示例 |
| ES-11 | 事实 | OpenResponses 接口 `POST /v1/responses` 遵循 OpenResponses 标准，支持工具调用、文件/图片输入                                                | OpenResponses 接口          |
| ES-12 | 步骤 | `POST /tools/invoke` 直接调用 agent 内部工具（如 memory_search），绕过 AI 推理，需 `tool` 参数                                              | Tools Invoke                |
| ES-13 | 事实 | Gateway WebSocket RPC 使用 JSON-RPC 协议，默认端口 18789，可用方法包括 agent、send、wake、cron.\* 等                                        | Gateway WebSocket RPC       |
| ES-14 | 经验 | WebSocket `agent` 和 `send` 方法需要 `idempotencyKey` 防止重复执行，CLI 会自动生成                                                          | 注意事项                    |
| ES-15 | 事实 | 认证方式分三种：CLI 本地无需认证、Webhooks 用 hook token、HTTP/WS 用 Gateway token 或 password                                              | 认证方式                    |
| ES-16 | 事实 | Cron 执行流程：sessionTarget=main 时 enqueueSystemEvent 触发心跳，isolated 时 runEmbeddedPiAgent 独立运行                                   | Cron 系统内部原理           |
| ES-17 | 事实 | Cron Job 数据结构包含：schedule(kind: at/every/cron)、payload(kind: systemEvent/agentTurn)、sessionTarget、delivery                         | Cron Job 数据结构           |
| ES-18 | 经验 | 接口选择决策树：需要 AI 推理且一次性脚本用 `openclaw agent` 或 `/hooks/agent`，定期用 `cron add`，已有 OpenAI SDK 用 `/v1/chat/completions` | 接口选择决策树              |
| ES-19 | 经验 | 实战场景：GitHub Actions 触发代码审查用 `/hooks/agent`，Shell 定期报告用 `openclaw agent`，Python 分析用 OpenAI SDK                         | 实战示例                    |
| ES-20 | 经验 | 注意事项：Gateway 必须运行（除 --local），默认端口 127.0.0.1:18789，超时默认 600s，`deliver:true` 投递回复到频道                            | 注意事项                    |
| ES-21 | 经验 | 会话隔离：使用不同 `sessionKey` 保持独立上下文，相同 key 复用多轮对话                                                                       | 注意事项                    |
| ES-22 | 判断 | 安全建议：hook token 和 gateway token 分开管理，webhook 建议只在 loopback 或可信网络暴露                                                    | 注意事项                    |
