# G60: Output Cron 可靠性优化需采用"inbox/batch 轮转 + 逐步 Checkpoint + 失败隔离”架构以消除单点故障

> 借鉴知识收集器的生产消费分离模式，通过断点续传、有限重试和状态持久化，将脆弱的定时任务升级为高可用的异步处理流水线。

## 包含的 Atoms

| 编号  | 来源                                       | 内容摘要                                                                                                           |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| OC-01 | js-knowledge-prism-output-cron-reliability | v1.3.0 版本 output_all 存在无崩溃恢复、无失败重试、process 与 output 无通信三个可靠性短板                          |
| OC-02 | js-knowledge-prism-output-cron-reliability | 借鉴 js-knowledge-collector 的 inbox/batch 轮转机制可实现生产消费分离与崩溃恢复                                    |
| OC-03 | js-knowledge-prism-output-cron-reliability | 生产消费分离模式在 prism 中体现为 process_all 追加 output-inbox.jsonl，output_all 原子重命名为 batch 消费          |
| OC-04 | js-knowledge-prism-output-cron-reliability | 崩溃恢复通过每处理完一个 Key Line 更新 batch checkpoint 实现，重启后可跳过已完成项                                 |
| OC-05 | js-knowledge-prism-output-cron-reliability | 失败重试策略将失败项存入 registry，cron 自动重试不超过 3 次，超限后标记为永久失败                                  |
| OC-06 | js-knowledge-prism-output-cron-reliability | Inbox 信号格式仅包含 baseDir、变更原因和时间戳，不包含敏感信息，多次变更由消费端去重                               |
| OC-07 | js-knowledge-prism-output-cron-reliability | Batch 文件采用 JSON 格式而非 JSONL，包含每个 binding 的 KL 级处理状态，且同一时间只允许一个活跃 batch              |
| OC-08 | js-knowledge-prism-output-cron-reliability | output_all 启动时优先查找未完成的残留 batch 以实现断点续传，其次消费 inbox，再次重试失败 KL，最后降级为 mtime 检测 |
| OC-09 | js-knowledge-prism-output-cron-reliability | KL 处理状态分为 done（成功）、retry（失败待重试）、permanently_failed（重试超 3 次需人工介入）三种                 |
| OC-10 | js-knowledge-prism-output-cron-reliability | 单个 Key Line 失败不应中断同 binding 内其他 KL 或其他 binding 的处理，需实现失败隔离                               |
| OC-11 | js-knowledge-prism-output-cron-reliability | Cron 表达式分钟字段上限为 59，直接生成大于 60 的步长（如\*/120）会导致非法表达式                                   |
| OC-12 | js-knowledge-prism-output-cron-reliability | 使用 minutesToCronExpr 函数将大于 60 分钟的间隔转换为小时粒度的 Cron 表达式（如 0 _/2 _ \* \*）                    |
| OC-13 | js-knowledge-prism-output-cron-reliability | inbox/batch 轮转是通用的生产 - 消费隔离模式，适用于任何上游产出下游加工的异步场景                                  |
| OC-14 | js-knowledge-prism-output-cron-reliability | 逐步 checkpoint 比全部完成才写入的可靠性高一个数量级，代价仅为增加几次文件写入                                     |
| OC-15 | js-knowledge-prism-output-cron-reliability | 失败隔离配合有限重试（≤3 次）是平衡自动恢复能力与避免死循环风险的实用策略                                          |

## 组内逻辑顺序

1. **问题诊断** (OC-01): 指出 v1.3.0 版本的三大可靠性短板。
2. **架构设计** (OC-02, OC-03, OC-13): 引入 inbox/batch 生产消费分离模式及其通用性。
3. **核心机制实现**:
   - **断点续传** (OC-04, OC-08, OC-14): 逐步 checkpoint 与启动时的优先级逻辑。
   - **状态管理** (OC-06, OC-07, OC-09): Inbox 信号格式、Batch 文件结构及 KL 状态定义。
   - **异常处理** (OC-05, OC-10, OC-15): 失败隔离、有限重试策略及永久失败标记。
4. **辅助工具** (OC-11, OC-12): 解决 Cron 表达式分钟数限制的转换函数。
