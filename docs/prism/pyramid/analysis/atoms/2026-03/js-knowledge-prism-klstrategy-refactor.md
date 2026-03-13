# Knowledge Prism: klStrategy 策略化 Structure 刷新

> 来源：[../../../../journal/2026-03-11/js-knowledge-prism-klstrategy-refactor.md](../../../../journal/2026-03-11/js-knowledge-prism-klstrategy-refactor.md)
> 缩写：JR

## Atoms

| 编号  | 类型 | 内容                                                                                                  | 原文定位                        |
| ----- | ---- | ----------------------------------------------------------------------------------------------------- | ------------------------------- |
| JR-01 | 事实 | 原有的 `refreshStructure` 是二元开关，全量重生成会破坏 P23 等日记型视角的 19 个时间序列 KL            | 背景                            |
| JR-02 | 判断 | 不同视角的 KL 组织逻辑差异巨大（论点型 vs 时间序列型 vs 叙事型），必须采用差异化的刷新策略            | 视角差异分析                    |
| JR-03 | 事实 | `synthesis` 策略默认全量重生成 SCQA、KL 表格和 expand，适用于 P01/P24 等少量论点型视角                | 方案设计 > 用 klStrategy 替代   |
| JR-04 | 事实 | `date-driven` 策略保持 SCQA 不动，仅追加新日期 KL 并展开新 KL，适用于 P23 等日记型视角                | 方案设计 > 用 klStrategy 替代   |
| JR-05 | 事实 | `manual` 策略完全不自动刷新 SCQA、KL 和 expand，适用于 P25 等需保留手工策划的场景                     | 方案设计 > 用 klStrategy 替代   |
| JR-06 | 步骤 | date-driven 流程需扫描 journal 目录获取日期，对比已注册 KL，并过滤出有已处理 atoms 的新日期           | 方案设计 > date-driven 策略流程 |
| JR-07 | 步骤 | date-driven 流程需扫描 groups 文件找到包含对应 atom 缩写的 groups，无 groups 的日期将被跳过           | 方案设计 > date-driven 策略流程 |
| JR-08 | 步骤 | date-driven 流程利用 LLM 生成"第 N 天：主题"标题，追加 KL 行到 tree/README.md 并仅对新 KL 执行 expand | 方案设计 > date-driven 策略流程 |
| JR-09 | 事实 | 全自动链路包含两个 Cron 任务：60 分钟的 atoms 处理流程和 120 分钟的 structure 刷新与 output 生成流程  | 方案设计 > 全自动链路           |
| JR-10 | 事实 | 新增 `lib/date-driven-kl.mjs` 模块负责构建缩写映射、检测新日期、查找关联 groups 及追加 KL             | 实现变更 > 新增文件             |
| JR-11 | 步骤 | 将 `bind_output` 工具的 `refreshStructure` 参数替换为 `klStrategy` 枚举类型                           | 实现变更 > 修改文件             |
| JR-12 | 经验 | 提取 `refreshByStrategy` 公共函数统一处理 batch path 和 mtime fallback path，消除了约 90 行重复代码   | 实现变更 > 修改文件             |
| JR-13 | 判断 | 决定不考虑向后兼容，直接替换字段，要求已有绑定重新调用 `bind_output` 设置新策略                       | 关键决策                        |
| JR-14 | 判断 | 决定 date-driven 策略下 SCQA 不重生成，因为日记类视角的 SCQA 是人工策划的叙事弧线                     | 关键决策                        |
| JR-15 | 判断 | 决定 date-driven 策略的日期来源必须同时满足"存在于 journal 目录"和"有对应的 groups 覆盖"两个条件      | 关键决策                        |
| JR-16 | 步骤 | 绑定日记型视角时需显式设置 `klStrategy="date-driven"`，论点型视角可省略该参数使用默认 synthesis       | 使用方式                        |
