# 知识库桥接 OpenClaw 记忆系统：分析、设计与实现

> 来源：[../../../../journal/2026-03-09/knowledge-memory-bridge.md](../../../../journal/2026-03-09/knowledge-memory-bridge.md)
> 缩写：KB

## Atoms

| 编号  | 类型 | 内容                                                                                                          | 原文定位                  |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------- | ------------------------- |
| KB-01 | 事实 | OpenClaw 上下文引擎是可插拔框架，通过 bootstrap、ingest、assemble 等接口控制模型推理时的可见内容              | 一、起点 > 1.1 上下文引擎 |
| KB-02 | 事实 | OpenClaw 记忆系统由持久化 Markdown 文件（MEMORY.md 及每日记忆）和 SQLite+Embedding 向量索引组成               | 一、起点 > 1.2 记忆系统   |
| KB-03 | 事实 | 上下文引擎与记忆系统的协作机制包括：Bootstrap 注入 Project Context、工具调用按需拉取、压缩前自动刷新持久化    | 一、起点 > 1.3 两者的关系 |
| KB-04 | 判断 | 整合优化分为五个层次，P0 层（导出 Markdown+extraPaths 桥接）具有最低成本和立竿见影的价值                      | 二、整合优化思路          |
| KB-05 | 步骤 | P0 方案核心流程为：SQLite 知识库增量导出 Markdown 文件，配置 memorySearch.extraPaths 指向导出目录             | 三、P0 方案设计 > 3.1     |
| KB-06 | 步骤 | 实现增量同步需维护.sync-state.json 记录每篇文章 updated 时间戳，仅重写更新或新增的文章并清理已删除文件        | 三、P0 方案设计 > 3.2     |
| KB-07 | 经验 | 导出文件应仅包含摘要层（标题 + 推荐理由 + 摘要 + 详细摘要），避免全文导致的 chunk 噪声和信息密度稀释          | 四、实现细节 > 4.2        |
| KB-08 | 步骤 | 后台服务注册复用 api.registerService()，启动时全量同步后设定时钟增量同步，工具钩子成功后 fire-and-forget 触发 | 四、实现细节 > 4.3        |
| KB-09 | 事实 | OpenClaw 配置需在 agents.defaults.memorySearch 中设置 extraPaths 数组以接入外部知识目录                       | 四、实现细节 > 4.4        |
| KB-10 | 经验 | OpenClaw 的 extraPaths 是最低成本集成点，只需输出 Markdown 到指定目录并配置一行即可接入向量检索能力           | 七、关键认知              |
| KB-11 | 经验 | 增量同步基于 updated 时间戳对比至关重要，可避免随知识库增长带来的不必要文件 I/O 和 embedding 重建             | 七、关键认知              |
| KB-12 | 经验 | 对于~400 tokens 的检索 chunk 粒度，文章摘要层通常正好构成 1-3 个 chunk，检索命中率优于全文                    | 七、关键认知              |
| KB-13 | 经验 | 在工具钩子中触发同步任务应采用 fire-and-forget 策略（不 await），避免阻塞主工具返回且隔离失败风险             | 七、关键认知              |
