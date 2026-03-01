# OpenClaw Agent Token 使用监控工具分析

> 来源：[../../../../journal/2026-02-14/agent-token-usage-monitoring-analysis.md](../../../../journal/2026-02-14/agent-token-usage-monitoring-analysis.md)
> 缩写：TM

## Atoms

| 编号  | 类型 | 内容                                                                                                                          | 原文定位               |
| ----- | ---- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| TM-01 | 事实 | `/status` 命令显示当前会话模型、上下文用量、最近 input/output tokens 及预估成本（API key 模式）                               | 1. 聊天内命令          |
| TM-02 | 步骤 | `/usage off\|tokens\|full` 设置每次回复后附加用量页脚，`full` 模式包含预估成本                                                | 1. 聊天内命令          |
| TM-03 | 事实 | `/usage cost` 命令基于会话日志进行本地成本汇总分析                                                                            | 1. 聊天内命令          |
| TM-04 | 步骤 | `openclaw status --usage` 查看模型提供商（Claude/OpenAI 等）的用量配额快照                                                    | 2. CLI 命令            |
| TM-05 | 事实 | Web UI 仪表板 (`ui/src/ui/views/usage.ts`) 支持按日/会话、累计/每轮、类型拆分的 token 与成本时间序列                          | 3. Web UI 使用量仪表板 |
| TM-06 | 事实 | OpenTelemetry 扩展导出四类指标：`openclaw.tokens`、`openclaw.cost.usd`、`openclaw.run.duration_ms`、`openclaw.context.tokens` | 4. OpenTelemetry 扩展  |
| TM-07 | 步骤 | 启用 OTLP 导出需在配置中开启 `diagnostics.enabled` 和 `diagnostics.otel.enabled` 并配置 endpoint                              | 4. OpenTelemetry 扩展  |
| TM-08 | 事实 | 数据来源为 Session Store (`sessions.json`) 的 token 字段和 Session Transcripts (JSONL) 的 `usage` 字段                        | 5. 数据来源与存储      |
| TM-09 | 事实 | `model.usage` 诊断事件包含 input/output/cache/cost/duration/context 等完整指标，由 diagnostics-otel 消费                      | 6. 诊断事件系统        |
| TM-10 | 判断 | 项目已具备完整监控能力：实时查看 (`/status`)、历史分析 (Web UI)、CLI 诊断、可观测性 (OTLP) 四大维度                           | 7. 总结                |
