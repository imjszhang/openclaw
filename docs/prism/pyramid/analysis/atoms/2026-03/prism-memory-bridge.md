# Knowledge Prism 桥接 OpenClaw 记忆系统：设计与实现

> 来源：[../../../../journal/2026-03-09/prism-memory-bridge.md](../../../../journal/2026-03-09/prism-memory-bridge.md)
> 缩写：PB

## Atoms

| 编号  | 类型 | 内容                                                                                                  | 原文定位                                 |
| ----- | ---- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| PB-01 | 事实 | js-knowledge-prism 是基于金字塔原理的知识蒸馏工具，数据源为多个注册的 Markdown 知识库                 | 一、背景与动机                           |
| PB-02 | 事实 | Prism 与 Collector 的关键差异在于：多源文件读取、mtime 增量同步、筛选高价值层、前缀命名策略           | 一、背景与动机 > 与 collector 的关键差异 |
| PB-03 | 判断 | 并非所有金字塔层次都适合向量检索，需筛选信息密度高且 chunk 友好的层次                                 | 二、高价值内容筛选策略                   |
| PB-04 | 经验 | Groups 层是最有价值的检索源，因包含凝练观点句和 atoms 列表，平均 1-5KB，完美匹配 embedding chunk 大小 | 二、高价值内容筛选策略                   |
| PB-05 | 判断 | Journal、atoms 表格、outputs 长文及 INDEX 目录因噪声大、结构易破坏或密度低，不适合送入向量检索        | 二、高价值内容筛选策略                   |
| PB-06 | 步骤 | 数据流通过遍历 registry.json 中 enabled 的知识库，收集四类高价值文件并进行 mtime 增量检测             | 三、数据流设计                           |
| PB-07 | 步骤 | 导出文件采用 `{kb-slug}-{filename}.md` 命名策略，其中 slugify 函数保留中文字符以确保可读性            | 三、数据流设计                           |
| PB-08 | 事实 | 新增 `lib/memory-sync.mjs` 模块负责解析注册表、遍历知识库、增量检测及清理已注销知识库文件             | 四、改动范围与实现 > 4.1                 |
| PB-09 | 步骤 | CONTEXT.md 文件在导出时重命名为 `{kb-slug}-{perspective-slug}-context.md` 以区分不同视角              | 四、改动范围与实现 > 4.1                 |
| PB-10 | 事实 | 插件配置新增 `memorySyncEnabled`、`memorySyncDir` 和 `memorySyncIntervalMinutes` 三个控制项           | 四、改动范围与实现 > 4.2                 |
| PB-11 | 步骤 | 后台服务 `prism-memory-sync` 启动时执行全量同步，随后通过 setInterval 执行增量同步                    | 四、改动范围与实现 > 4.3(a)              |
| PB-12 | 经验 | 在 process、register、unregister、agent_index 等工具钩子执行成功后触发 fire-and-forget 增量同步       | 四、改动范围与实现 > 4.3(b)              |
| PB-13 | 步骤 | CLI 命令 `openclaw prism sync` 支持增量同步、`--force` 全量重新导出及 `--dir` 自定义路径              | 四、改动范围与实现 > 4.3(c)              |
| PB-14 | 事实 | OpenClaw 配置中 `memorySearch.extraPaths` 为数组，可同时包含 collector 和 prism 两个导出目录          | 四、改动范围与实现 > 4.4                 |
| PB-15 | 经验 | 首次全量同步 73 个高价值文件（40+ groups, 1 synthesis, 25+ CONTEXT, 1 SKILL）耗时约 0.6 秒            | 五、执行结果                             |
| PB-16 | 判断 | Prism 比 Collector 更适合 memory_search，因为源文件即 Markdown 无需转换且 groups 信息密度极高         | 七、关键认知                             |
| PB-17 | 经验 | 纯文件复制场景下，使用文件系统 mtime 进行增量检测比计算 content hash 更高效                           | 七、关键认知                             |
| PB-18 | 判断 | 层次筛选能降低 80% 以上的文件数并避免低密度内容稀释检索质量，是提升检索价值的关键放大器               | 七、关键认知                             |
| PB-19 | 事实 | 最终记忆系统由 collector（外部文章摘要）、prism（结构化洞察）和原生记忆（个人决策）三者互补构成       | 六、与 collector 桥接的协同效果          |
