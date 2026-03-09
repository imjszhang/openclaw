# Memory-Core、Embedding 与硬件：问答与结论

> 来源：[../../../../journal/2026-03-10/memory-core-embedding-hardware-qa.md](../../../../journal/2026-03-10/memory-core-embedding-hardware-qa.md)
> 缩写：MH

## Atoms

| 编号  | 类型 | 内容                                                                                                       | 原文定位                               |
| ----- | ---- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| MH-01 | 判断 | 不开启向量检索时无法可靠关联插件记忆，因为新内容不会被索引                                                 | 一、不开启向量检索时能否关联插件记忆？ |
| MH-02 | 事实 | 当 `memorySearch.enabled` 设为 false 时，`memory_search` 和 `memory_get` 工具不会被创建                    | 1.1 两种「不开启」的情形               |
| MH-03 | 事实 | 若无可用 embedding provider，即使 enabled 为 true，`syncMemoryFiles` 和 `indexFile` 也不会执行任何索引操作 | 1.2 机制说明                           |
| MH-04 | 经验 | `memory_search` 工具仅能检索已有 provider 时建立的旧索引，无法索引新加入的 `extraPaths`                    | 1.2 机制说明                           |
| MH-05 | 步骤 | 实现 `extraPaths` 桥接需同时满足 `memorySearch.enabled=true` 且配置至少一个可用的 embedding provider       | 1.3 实现桥接的前提                     |
| MH-06 | 经验 | Ollama 方案适合已有 Ollama 环境的用户，需常驻运行 `nomic-embed-text` 模型                                  | 2.1 方案对比                           |
| MH-07 | 经验 | node-llama-cpp 方案适合不想运行 Ollama 的用户，首次使用会自动下载约 0.6GB 的 EmbeddingGemma 模型           | 2.1 方案对比                           |
| MH-08 | 步骤 | 配置 Ollama provider 需执行 `ollama pull` 拉取模型并设置 `OLLAMA_API_KEY` 环境变量                         | 2.2 Ollama 配置（首选）                |
| MH-09 | 步骤 | 使用 node-llama-cpp 需运行 `pnpm approve-builds` 勾选该模块并执行 `pnpm rebuild` 进行重新编译              | 2.3 node-llama-cpp 配置                |
| MH-10 | 事实 | 仅运行 Gateway 使用远程 API 的绝对最低硬件要求为 1 vCPU、1GB RAM 和约 500MB 磁盘空间                       | 3.1 分层要求                           |
| MH-11 | 经验 | 树莓派 Zero 2 W 不推荐用于运行 Gateway，Pi 4 1GB 可运行但 Pi 5 或 Pi 4 4GB 体验更佳                        | 3.2 Gateway 基准                       |
| MH-12 | 事实 | 本地运行 EmbeddingGemma 300M 模型需约 0.6GB 内存，但建议分配 2GB RAM 以确保稳妥运行                        | 3.3 本地 Embedding                     |
| MH-13 | 判断 | 本地运行对话 LLM 建议配置 Mac Studio 或 24GB+ 显存 GPU，单卡方案需权衡负载与延迟                           | 3.4 本地对话 LLM                       |
