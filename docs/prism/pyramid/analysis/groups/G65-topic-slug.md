# G65: Knowledge Prism 的 Structure 刷新必须从“二元开关”演进为“策略化驱动”模式，以兼容论点型与时间序列型视角的差异化组织逻辑

> 原有的全量重生成机制会破坏日记型视角的时间序列结构，必须通过 `klStrategy` 枚举（synthesis/date-driven/manual）实现按视角特性的精细化控制。

## 包含的 Atoms

| 编号  | 来源                                   | 内容摘要                                                                                             |
| ----- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| JR-01 | js-knowledge-prism-klstrategy-refactor | 原有的 `refreshStructure` 是二元开关，全量重生成会破坏 P23 等日记型视角的 19 个时间序列 KL           |
| JR-02 | js-knowledge-prism-klstrategy-refactor | 不同视角的 KL 组织逻辑差异巨大，必须采用差异化的刷新策略                                             |
| JR-03 | js-knowledge-prism-klstrategy-refactor | `synthesis` 策略默认全量重生成 SCQA、KL 表格和 expand，适用于论点型视角                              |
| JR-04 | js-knowledge-prism-klstrategy-refactor | `date-driven` 策略保持 SCQA 不动，仅追加新日期 KL 并展开新 KL，适用于日记型视角                      |
| JR-05 | js-knowledge-prism-klstrategy-refactor | `manual` 策略完全不自动刷新，适用于需保留手工策划的场景                                              |
| JR-06 | js-knowledge-prism-klstrategy-refactor | date-driven 流程需扫描 journal 目录获取日期，对比已注册 KL，过滤出新日期                             |
| JR-07 | js-knowledge-prism-klstrategy-refactor | date-driven 流程需扫描 groups 文件找到包含对应 atom 缩写的 groups，无 groups 的日期将被跳过          |
| JR-08 | js-knowledge-prism-klstrategy-refactor | date-driven 流程利用 LLM 生成标题，追加 KL 行到 tree/README.md 并仅对新 KL 执行 expand               |
| JR-09 | js-knowledge-prism-klstrategy-refactor | 全自动链路包含两个 Cron 任务：60 分钟的 atoms 处理流程和 120 分钟的 structure 刷新与 output 生成流程 |
| JR-10 | js-knowledge-prism-klstrategy-refactor | 新增 `lib/date-driven-kl.mjs` 模块负责构建缩写映射、检测新日期、查找关联 groups 及追加 KL            |
| JR-11 | js-knowledge-prism-klstrategy-refactor | 将 `bind_output` 工具的 `refreshStructure` 参数替换为 `klStrategy` 枚举类型                          |
| JR-12 | js-knowledge-prism-klstrategy-refactor | 提取 `refreshByStrategy` 公共函数统一处理 batch path 和 mtime fallback path，消除约 90 行重复代码    |
| JR-13 | js-knowledge-prism-klstrategy-refactor | 决定不考虑向后兼容，直接替换字段，要求已有绑定重新调用 `bind_output` 设置新策略                      |
| JR-14 | js-knowledge-prism-klstrategy-refactor | 决定 date-driven 策略下 SCQA 不重生成，因为日记类视角的 SCQA 是人工策划的叙事弧线                    |
| JR-15 | js-knowledge-prism-klstrategy-refactor | 决定 date-driven 策略的日期来源必须同时满足"存在于 journal 目录"和"有对应的 groups 覆盖"两个条件     |
| JR-16 | js-knowledge-prism-klstrategy-refactor | 绑定日记型视角时需显式设置 `klStrategy="date-driven"`，论点型视角可省略该参数使用默认 synthesis      |

## 组内逻辑顺序

按“问题背景 (JR-01~02) → 策略定义与适用场景 (JR-03~05) → date-driven 核心算法流程 (JR-06~08) → 自动化链路与新模块实现 (JR-09~10) → API 重构与代码优化 (JR-11~12) → 关键设计决策与兼容性处理 (JR-13~15) → 使用指南 (JR-16)"的逻辑排列。
