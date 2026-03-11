# js-knowledge-prism Output Cron 可靠性优化

> 来源：[../../../../journal/2026-03-11/js-knowledge-prism-output-cron-reliability.md](../../../../journal/2026-03-11/js-knowledge-prism-output-cron-reliability.md)
> 缩写：OC

## Atoms

| 编号  | 类型 | 内容                                                                                                               | 原文定位                             |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| OC-01 | 事实 | v1.3.0 版本 output_all 存在无崩溃恢复、无失败重试、process 与 output 无通信三个可靠性短板                          | 背景                                 |
| OC-02 | 经验 | 借鉴 js-knowledge-collector 的 inbox/batch 轮转机制可实现生产消费分离与崩溃恢复                                    | 从 js-knowledge-collector 借鉴的模式 |
| OC-03 | 事实 | 生产消费分离模式在 prism 中体现为 process_all 追加 output-inbox.jsonl，output_all 原子重命名为 batch 消费          | 从 js-knowledge-collector 借鉴的模式 |
| OC-04 | 步骤 | 崩溃恢复通过每处理完一个 Key Line 更新 batch checkpoint 实现，重启后可跳过已完成项                                 | 从 js-knowledge-collector 借鉴的模式 |
| OC-05 | 事实 | 失败重试策略将失败项存入 registry，cron 自动重试不超过 3 次，超限后标记为永久失败                                  | 从 js-knowledge-collector 借鉴的模式 |
| OC-06 | 事实 | Inbox 信号格式仅包含 baseDir、变更原因和时间戳，不包含敏感信息，多次变更由消费端去重                               | 设计决策 > Inbox 信号格式            |
| OC-07 | 事实 | Batch 文件采用 JSON 格式而非 JSONL，包含每个 binding 的 KL 级处理状态，且同一时间只允许一个活跃 batch              | 设计决策 > Batch 生命周期            |
| OC-08 | 步骤 | output_all 启动时优先查找未完成的残留 batch 以实现断点续传，其次消费 inbox，再次重试失败 KL，最后降级为 mtime 检测 | 设计决策 > 三层工作来源优先级        |
| OC-09 | 事实 | KL 处理状态分为 done（成功）、retry（失败待重试）、permanently_failed（重试超 3 次需人工介入）三种                 | 设计决策 > 重试策略                  |
| OC-10 | 经验 | 单个 Key Line 失败不应中断同 binding 内其他 KL 或其他 binding 的处理，需实现失败隔离                               | 设计决策 > 重试策略                  |
| OC-11 | 事实 | Cron 表达式分钟字段上限为 59，直接生成大于 60 的步长（如\*/120）会导致非法表达式                                   | 附带修复 > Cron 表达式溢出           |
| OC-12 | 步骤 | 使用 minutesToCronExpr 函数将大于 60 分钟的间隔转换为小时粒度的 Cron 表达式（如 0 _/2 _ \* \*）                    | 附带修复 > Cron 表达式溢出           |
| OC-13 | 经验 | inbox/batch 轮转是通用的生产 - 消费隔离模式，适用于任何上游产出下游加工的异步场景                                  | 关键收获                             |
| OC-14 | 判断 | 逐步 checkpoint 比全部完成才写入的可靠性高一个数量级，代价仅为增加几次文件写入                                     | 关键收获                             |
| OC-15 | 判断 | 失败隔离配合有限重试（≤3 次）是平衡自动恢复能力与避免死循环风险的实用策略                                          | 关键收获                             |
