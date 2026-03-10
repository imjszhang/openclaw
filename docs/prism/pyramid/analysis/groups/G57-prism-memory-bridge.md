# G57: Prism 记忆桥接需通过“层次筛选 + 增量同步 + 双源互补”策略实现高价值结构化知识的低成本接入

> 知识棱镜（Prism）通过筛选高价值层级、利用 mtime 增量同步及与 Collector 互补，构建了比原始笔记更高效的向量检索数据源。

## 包含的 Atoms

| 编号  | 来源                              | 内容摘要                                                                                                   |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| PB-01 | prism-memory-bridge               | js-knowledge-prism 是基于金字塔原理的知识蒸馏工具，数据源为多个注册的 Markdown 知识库                      |
| PB-02 | prism-memory-bridge               | Prism 与 Collector 的关键差异在于：多源文件读取、mtime 增量同步、筛选高价值层、前缀命名策略                |
| PB-03 | prism-memory-bridge               | 并非所有金字塔层次都适合向量检索，需筛选信息密度高且 chunk 友好的层次                                      |
| PB-04 | prism-memory-bridge               | Groups 层是最有价值的检索源，因包含凝练观点句和 atoms 列表，平均 1-5KB，完美匹配 embedding chunk 大小      |
| PB-05 | prism-memory-bridge               | Journal、atoms 表格、outputs 长文及 INDEX 目录因噪声大、结构易破坏或密度低，不适合送入向量检索             |
| PB-06 | prism-memory-bridge               | 数据流通过遍历 registry.json 中 enabled 的知识库，收集四类高价值文件并进行 mtime 增量检测                  |
| PB-07 | prism-memory-bridge               | 导出文件采用 `{kb-slug}-{filename}.md` 命名策略，其中 slugify 函数保留中文字符以确保可读性                 |
| PB-08 | prism-memory-bridge               | 新增 `lib/memory-sync.mjs` 模块负责解析注册表、遍历知识库、增量检测及清理已注销知识库文件                  |
| PB-09 | prism-memory-bridge               | CONTEXT.md 文件在导出时重命名为 `{kb-slug}-{perspective-slug}-context.md` 以区分不同视角                   |
| PB-10 | prism-memory-bridge               | 插件配置新增 `memorySyncEnabled`、`memorySyncDir` 和 `memorySyncIntervalMinutes` 三个控制项                |
| PB-11 | prism-memory-bridge               | 后台服务 `prism-memory-sync` 启动时执行全量同步，随后通过 setInterval 执行增量同步                         |
| PB-12 | prism-memory-bridge               | 在 process、register、unregister、agent_index 等工具钩子执行成功后触发 fire-and-forget 增量同步            |
| PB-13 | prism-memory-bridge               | CLI 命令 `openclaw prism sync` 支持增量同步、`--force` 全量重新导出及 `--dir` 自定义路径                   |
| PB-14 | prism-memory-bridge               | OpenClaw 配置中 `memorySearch.extraPaths` 为数组，可同时包含 collector 和 prism 两个导出目录               |
| PB-15 | prism-memory-bridge               | 首次全量同步 73 个高价值文件（40+ groups, 1 synthesis, 25+ CONTEXT, 1 SKILL）耗时约 0.6 秒                 |
| PB-16 | prism-memory-bridge               | Prism 比 Collector 更适合 memory_search，因为源文件即 Markdown 无需转换且 groups 信息密度极高              |
| PB-17 | prism-memory-bridge               | 纯文件复制场景下，使用文件系统 mtime 进行增量检测比计算 content hash 更高效                                |
| PB-18 | prism-memory-bridge               | 层次筛选能降低 80% 以上的文件数并避免低密度内容稀释检索质量，是提升检索价值的关键放大器                    |
| PB-19 | prism-memory-bridge               | 最终记忆系统由 collector（外部文章摘要）、prism（结构化洞察）和原生记忆（个人决策）三者互补构成            |
| MH-01 | memory-core-embedding-hardware-qa | 不开启向量检索时无法可靠关联插件记忆，因为新内容不会被索引                                                 |
| MH-02 | memory-core-embedding-hardware-qa | 当 `memorySearch.enabled` 设为 false 时，`memory_search` 和 `memory_get` 工具不会被创建                    |
| MH-03 | memory-core-embedding-hardware-qa | 若无可用 embedding provider，即使 enabled 为 true，`syncMemoryFiles` 和 `indexFile` 也不会执行任何索引操作 |
| MH-04 | memory-core-embedding-hardware-qa | `memory_search` 工具仅能检索已有 provider 时建立的旧索引，无法索引新加入的 `extraPaths`                    |
| MH-05 | memory-core-embedding-hardware-qa | 实现 `extraPaths` 桥接需同时满足 `memorySearch.enabled=true` 且配置至少一个可用的 embedding provider       |
| MH-06 | memory-core-embedding-hardware-qa | Ollama 方案适合已有 Ollama 环境的用户，需常驻运行 `nomic-embed-text` 模型                                  |
| MH-07 | memory-core-embedding-hardware-qa | node-llama-cpp 方案适合不想运行 Ollama 的用户，首次使用会自动下载约 0.6GB 的 EmbeddingGemma 模型           |
| MH-08 | memory-core-embedding-hardware-qa | 配置 Ollama provider 需执行 `ollama pull` 拉取模型并设置 `OLLAMA_API_KEY` 环境变量                         |
| MH-09 | memory-core-embedding-hardware-qa | 使用 node-llama-cpp 需运行 `pnpm approve-builds` 勾选该模块并执行 `pnpm rebuild` 进行重新编译              |
| MH-10 | memory-core-embedding-hardware-qa | 仅运行 Gateway 使用远程 API 的绝对最低硬件要求为 1 vCPU、1GB RAM 和约 500MB 磁盘空间                       |
| MH-11 | memory-core-embedding-hardware-qa | 树莓派 Zero 2 W 不推荐用于运行 Gateway，Pi 4 1GB 可运行但 Pi 5 或 Pi 4 4GB 体验更佳                        |
| MH-12 | memory-core-embedding-hardware-qa | 本地运行 EmbeddingGemma 300M 模型需约 0.6GB 内存，但建议分配 2GB RAM 以确保稳妥运行                        |
| MH-13 | memory-core-embedding-hardware-qa | 本地运行对话 LLM 建议配置 Mac Studio 或 24GB+ 显存 GPU，单卡方案需权衡负载与延迟                           |

## 组内逻辑顺序

1. **桥接设计与价值筛选 (PB-01 ~ PB-05)**：阐述 Prism 桥接的核心逻辑，明确为何只筛选 Groups 等高价值层级进行向量化。
2. **同步实现机制 (PB-06 ~ PB-13)**：详细描述增量同步的技术实现，包括文件命名、模块逻辑、触发钩子及 CLI 命令。
3. **配置与集成 (PB-14 ~ PB-19)**：说明如何在 OpenClaw 中配置双源目录，以及性能数据和最终的系统互补架构。
4. **前置条件与 Provider 选型 (MH-01 ~ MH-09)**：明确记忆检索生效的硬性条件（enabled + provider），并对比 Ollama 与 node-llama-cpp 两种方案的配置差异。
5. **硬件资源评估 (MH-10 ~ MH-13)**：提供从最低配置到推荐配置的硬件指南，确保用户根据设备能力选择合适的部署方案。
