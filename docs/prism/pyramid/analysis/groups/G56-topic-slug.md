# G56: OpenClaw 记忆桥接需采用"Markdown 摘要导出 + 增量时间戳同步"策略以低成本接入向量检索

> 通过导出高密度摘要层 Markdown 并利用 extraPaths 配置，配合基于时间戳的增量同步机制，是实现外部知识库与 OpenClaw 记忆系统最低成本、最高效集成的核心路径。

## 包含的 Atoms

| 编号  | 来源                    | 内容摘要                                                                                                      |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| KB-01 | knowledge-memory-bridge | OpenClaw 上下文引擎是可插拔框架，通过 bootstrap、ingest、assemble 等接口控制模型推理时的可见内容              |
| KB-02 | knowledge-memory-bridge | OpenClaw 记忆系统由持久化 Markdown 文件（MEMORY.md 及每日记忆）和 SQLite+Embedding 向量索引组成               |
| KB-03 | knowledge-memory-bridge | 上下文引擎与记忆系统的协作机制包括：Bootstrap 注入 Project Context、工具调用按需拉取、压缩前自动刷新持久化    |
| KB-04 | knowledge-memory-bridge | 整合优化分为五个层次，P0 层（导出 Markdown+extraPaths 桥接）具有最低成本和立竿见影的价值                      |
| KB-05 | knowledge-memory-bridge | P0 方案核心流程为：SQLite 知识库增量导出 Markdown 文件，配置 memorySearch.extraPaths 指向导出目录             |
| KB-06 | knowledge-memory-bridge | 实现增量同步需维护.sync-state.json 记录每篇文章 updated 时间戳，仅重写更新或新增的文章并清理已删除文件        |
| KB-07 | knowledge-memory-bridge | 导出文件应仅包含摘要层（标题 + 推荐理由 + 摘要 + 详细摘要），避免全文导致的 chunk 噪声和信息密度稀释          |
| KB-08 | knowledge-memory-bridge | 后台服务注册复用 api.registerService()，启动时全量同步后设定时钟增量同步，工具钩子成功后 fire-and-forget 触发 |
| KB-09 | knowledge-memory-bridge | OpenClaw 配置需在 agents.defaults.memorySearch 中设置 extraPaths 数组以接入外部知识目录                       |
| KB-10 | knowledge-memory-bridge | OpenClaw 的 extraPaths 是最低成本集成点，只需输出 Markdown 到指定目录并配置一行即可接入向量检索能力           |
| KB-11 | knowledge-memory-bridge | 增量同步基于 updated 时间戳对比至关重要，可避免随知识库增长带来的不必要文件 I/O 和 embedding 重建             |
| KB-12 | knowledge-memory-bridge | 对于~400 tokens 的检索 chunk 粒度，文章摘要层通常正好构成 1-3 个 chunk，检索命中率优于全文                    |
| KB-13 | knowledge-memory-bridge | 在工具钩子中触发同步任务应采用 fire-and-forget 策略（不 await），避免阻塞主工具返回且隔离失败风险             |

## 组内逻辑顺序

逻辑顺序为：架构背景与机制（KB-01~KB-03） -> 核心策略选择（KB-04~KB-05, KB-09~KB-10） -> 具体实现细节（数据内容 KB-07, KB-12; 同步逻辑 KB-06, KB-11; 服务注册与触发 KB-08, KB-13）。
