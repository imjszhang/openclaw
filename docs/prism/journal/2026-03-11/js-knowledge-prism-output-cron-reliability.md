# js-knowledge-prism Output Cron 可靠性优化

> 文档日期：2026-03-11
>
> 来源：Cursor Agent 对话 — js-knowledge-prism 项目开发
>
> 相关：[js-knowledge-prism-auto-output-cron.md](./js-knowledge-prism-auto-output-cron.md)

---

## 背景

v1.3.0 实现了全链路自动化（process → structure refresh → output），但 `output_all` 存在三个可靠性短板：

1. **无崩溃恢复**：进程中断后所有工作丢失，下次重头开始
2. **无失败重试**：单个 Key Line 输出失败会中断整个 binding，且不会自动重试
3. **process / output 无通信**：`output_all` 靠 mtime 扫描全量判断变化，无法精确知道哪些 base 有新内容

参考了 `js-knowledge-collector` 项目的 inbox/batch 轮转机制，对 output cron 进行了可靠性升级。

## 从 js-knowledge-collector 借鉴的模式

| 模式         | collector 中的实现                                            | prism 中的适配                                                                            |
| ------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 生产消费分离 | `inbox.jsonl`（只追加）→ `batch-*.jsonl`（原子 rename，只读） | `output-inbox.jsonl`（process_all 追加）→ `output-batch-*.json`（output_all rename 消费） |
| 崩溃恢复     | 未完成的 batch 文件下次启动自动恢复                           | 每处理完一个 KL 更新 batch checkpoint，重启跳过已完成项                                   |
| 失败重试     | 失败项带 retryCount 回写 inbox，最终标记 permanently_failed   | `failedKLs` 存入 registry，cron 自动重试 ≤3 次，超限标记                                  |
| 归档         | `archive/` 目录保留历史 batch                                 | `output-archive/` 目录保留历史 batch                                                      |

## 设计决策

### Inbox 信号格式

`process_all` 在 synthesis 或 groups 有变化时追加一行 JSON 到 `output-inbox.jsonl`：

```json
{ "baseDir": "d:/path/to/base", "reason": "synthesis_updated", "ts": "2026-03-11T02:00:00+08:00" }
```

只记录 baseDir + 原因 + 时间戳，不含任何敏感信息。多次变更追加多行，由消费端去重。

### Batch 生命周期

```
output-inbox.jsonl  ──(atomic rename)──→  output-batch-<ts>.json
                                              │
                                    ┌─────────┴─────────┐
                                    │  逐 KL 处理       │
                                    │  每步更新 checkpoint│
                                    └─────────┬─────────┘
                                              │
                                    output-archive/<ts>.json
```

- 同一时间只有一个活跃 batch（`maxConcurrentRuns: 1` 保证）
- batch 文件是 JSON（而非 JSONL），包含每个 binding 的 KL 级处理状态
- 归档后的 batch 文件不再被读取，仅作审计用途

### 三层工作来源优先级

`output_all` 启动时按以下优先级查找待处理工作：

1. **现有 batch**：上次崩溃残留的未完成 batch → 断点续传
2. **inbox 轮转**：inbox 非空 → rename 为新 batch → 开始处理
3. **失败重试**：registry 中有 `failedKLs` 且 retryCount < 3 → 构建重试 batch
4. **mtime fallback**：以上均无 → 降级为 mtime 变化检测（兼容手动触发和旧版行为）

### 重试策略

| 状态                 | 含义                                       |
| -------------------- | ------------------------------------------ |
| `done`               | KL 输出成功                                |
| `retry`              | 本次失败，retryCount++，下次 cron 自动重试 |
| `permanently_failed` | retryCount ≥ 3，不再自动重试，需人工介入   |

失败的 KL 不中断同 binding 内其他 KL 的处理，也不中断其他 binding。

## 附带修复

### Cron 表达式溢出

`setup-cron` 和 `setup-output-cron` 原来直接生成 `*/<minutes> * * * *`，当 minutes > 60 时产生非法表达式（如 `*/120`）。

提取 `minutesToCronExpr` 工具函数统一处理：

```javascript
function minutesToCronExpr(minutes) {
  if (minutes <= 60) return `*/${minutes} * * * *`;
  if (minutes % 60 === 0) return `0 */${minutes / 60} * * *`;
  return `0 */${Math.max(1, Math.floor(minutes / 60))} * * *`;
}
```

## 改动文件汇总

| 文件                                              | 改动                                                                                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw-plugin/index.mjs`                       | 新增 `minutesToCronExpr`；`process_all` 追加 inbox 信号；`output_all` 重写为 inbox/batch 轮转 + 崩溃恢复 + 重试；新增 10+ 辅助函数（inbox/batch 读写、轮转、归档） |
| `openclaw-plugin/skills/prism-processor/SKILL.md` | 版本 1.2.0，新增文件布局、output 流程细节、并发安全说明                                                                                                            |
| `SKILL.md`                                        | 版本 1.4.0，更新工具描述，新增 runtime 文件到目录结构                                                                                                              |
| `RELEASE_NOTES.md`                                | 新增 v1.4.0 发布说明，v1.3.0 折叠                                                                                                                                  |
| `SECURITY.md`                                     | 新增 runtime work files 安全说明章节                                                                                                                               |
| `README.md`                                       | 更新 `process_all` 和 `output_all` 工具描述                                                                                                                        |

## 架构总览（v1.4.0）

```
cron 1: prism-auto-process (每 60 min)
  └→ knowledge_prism_process_all
     ├→ journal → atoms → groups → synthesis
     └→ 有变化时追加信号到 output-inbox.jsonl

cron 2: prism-auto-output (每 120 min)
  └→ knowledge_prism_output_all
     ├→ 优先恢复未完成 batch / 消费 inbox / 重试失败 KL
     ├→ Phase 1: structure 刷新 (SCQA + KL + expand)
     ├→ Phase 2: output 生成（逐 KL，每步 checkpoint）
     └→ 完成后归档 batch
```

## 关键收获

1. **inbox/batch 轮转**是通用的生产-消费隔离模式，适用于任何"上游产出 → 下游加工"的异步场景
2. **逐步 checkpoint** 比"全部完成才写入"可靠性高一个数量级，代价只是多几次文件写入
3. **失败隔离**（单 KL 失败不影响整体）+ **有限重试**（≤3 次后放弃）是平衡自动恢复与避免死循环的实用策略
4. Cron 表达式的分钟字段上限是 59，超过 60 分钟需要转换为小时粒度
