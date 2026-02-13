# OpenClaw Agent Token 使用监控工具分析

> 文档日期：2026-02-14

> 本文档整理自对 OpenClaw 项目代码库的检索分析，汇总项目中已有的 Agent token 使用监控能力。

---

## 1. 聊天内命令（TUI / Web TUI / 各渠道）

| 命令                       | 作用                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `/status`                  | 当前会话模型、上下文用量、最近一次回复的 input/output tokens、**预估成本**（API key 时） |
| `/usage off\|tokens\|full` | 每次回复后附加使用量页脚：`tokens` 只显示 token 数，`full` 包含预估成本                  |
| `/usage cost`              | 基于 OpenClaw 会话日志的本地成本汇总                                                     |

---

## 2. CLI 命令

| 命令                      | 作用                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `openclaw status`         | 渠道健康 + 会话摘要，包含各会话 token 用量（agent 有上报时） |
| `openclaw status --usage` | 模型提供商的用量/配额快照（如 Claude、OpenAI 等）            |
| `openclaw status --all`   | 完整诊断，包含会话和用量信息                                 |

---

## 3. Web UI 使用量仪表板

- **路径**：`ui/src/ui/views/usage.ts`
- **功能**：Token 使用量仪表板，支持：
  - 按日/按会话的 token 与成本时间序列
  - 累计 / 每轮模式
  - 按类型（input/output/cache）拆分
  - 会话排序（按 token、成本、最近、消息数、错误数）

---

## 4. OpenTelemetry 扩展（`@openclaw/diagnostics-otel`）

- **路径**：`extensions/diagnostics-otel/`
- **功能**：将 agent 的 token 使用导出到 OpenTelemetry，可接入 Prometheus、Grafana 等：
  - `openclaw.tokens`：按类型（input/output/cache_read/cache_write/prompt/total）的 token 计数
  - `openclaw.cost.usd`：预估成本
  - `openclaw.run.duration_ms`：单次运行耗时
  - `openclaw.context.tokens`：上下文窗口限制与使用量

- **启用**：在配置中开启 `diagnostics.enabled` 和 `diagnostics.otel.enabled`，并配置 OTLP endpoint。

---

## 5. 数据来源与存储

- **Session Store**（`~/.openclaw/agents/<agentId>/sessions/sessions.json`）：每个会话的 `inputTokens`、`outputTokens`、`totalTokens`、`compactionCount` 等
- **Session Transcripts**（JSONL）：每条 assistant 消息的 `usage` 字段
- **`session-cost-usage.ts`**：从 transcript 解析 usage，聚合为日/会话维度的 token 与成本统计

---

## 6. 诊断事件系统

- `emitDiagnosticEvent({ type: "model.usage", ... })`：在 agent 每次运行后发出 `model.usage` 事件
- 事件包含：`input`、`output`、`cacheRead`、`cacheWrite`、`promptTokens`、`total`、`costUsd`、`durationMs`、`context.limit`、`context.used`
- 由 `diagnostics-otel` 扩展消费并导出到 OTLP

---

## 7. 总结

项目已具备较完整的 token 监控能力：

1. **实时查看**：`/status`、`/usage tokens|full`
2. **历史分析**：Web UI 使用量仪表板、`/usage cost`
3. **CLI 诊断**：`openclaw status`、`openclaw status --usage`
4. **可观测性**：`@openclaw/diagnostics-otel` 扩展，可接入 Prometheus/Grafana 等

如需更细粒度的监控（如按 agent、按渠道的 token 限流或告警），可在现有 `model.usage` 事件和 `diagnostics-otel` 之上扩展。

---

## 8. 相关文档链接

- [Token Use and Costs](https://docs.openclaw.ai/reference/token-use)
- [API Usage and Costs](https://docs.openclaw.ai/reference/api-usage-costs)
- [Usage Tracking](https://docs.openclaw.ai/concepts/usage-tracking)
