# G63: 知识棱镜的改写功能必须采用"生成与风格正交分离"架构，通过独立定义文件与链式执行实现非破坏性多风格产出

> 将风格改写从生成模板中剥离，作为独立的后置处理阶段，既能保持核心生成逻辑的纯净，又能支持同一内容复用多种风格而不破坏原文。

## 包含的 Atoms

| 编号  | 来源                                                         | 内容摘要                                                                                                              |
| ----- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| RW-01 | js-knowledge-prism-rewrite-feature-design-and-implementation | 将风格改写规则嵌入生成阶段的 OUTPUT 模板会导致内容生成与风格转换职责混淆，且输入语义不对齐                            |
| RW-02 | js-knowledge-prism-rewrite-feature-design-and-implementation | 采用独立改写功能（方案 B）可实现生成与改写的正交分离，支持同一产出复用多种风格且不破坏现有体系                        |
| RW-03 | js-knowledge-prism-rewrite-feature-design-and-implementation | 改写定义存放于 `templates/outputs/rewrites/` 目录，知识库覆盖路径为 `outputs/_templates/rewrites/`                    |
| RW-04 | js-knowledge-prism-rewrite-feature-design-and-implementation | 改写输入采用混合模式：必传正文，若存在 refs 则自动加载源素材前 3000 字符作为可选上下文以提升丰富度                    |
| RW-05 | js-knowledge-prism-rewrite-feature-design-and-implementation | 改写结果存储于 `_rewrites/<style>/` 子目录以实现非破坏性存储，确保原文保留且多种风格可共存                            |
| RW-06 | js-knowledge-prism-rewrite-feature-design-and-implementation | 改写审校（Review）关注信息保留度（是否丢关键信息），区别于模板审校关注的生成质量（结构、风格一致性）                  |
| RW-07 | js-knowledge-prism-rewrite-feature-design-and-implementation | 通过扩展 outputBinding 增加 `rewrites` 字段，在 `output_all` 生成后自动链式执行改写，无需新增定时任务                 |
| RW-08 | js-knowledge-prism-rewrite-feature-design-and-implementation | `prism-rewrite-author` 技能包含 `prism_scaffold_rewrite`（生成骨架）和 `prism_import_rewrite`（提取转换）两个 AI 工具 |
| RW-09 | js-knowledge-prism-rewrite-feature-design-and-implementation | 改写定义文件 Frontmatter 需包含 name、description、platform、preserveStructure 等字段，Body 须含 Rewrite Prompt       |
| RW-10 | js-knowledge-prism-rewrite-feature-design-and-implementation | 核心流程包括加载改写定义、分离输入文件 Frontmatter、按需加载源素材上下文、填充变量调用 LLM、写入目标目录及可选审校    |
| RW-11 | js-knowledge-prism-rewrite-feature-design-and-implementation | 新建核心库文件 `lib/rewrite.mjs` 封装 loadRewrite、listRewrites、runRewrite 及 runRewriteBatch 方法                   |
| RW-12 | js-knowledge-prism-rewrite-feature-design-and-implementation | 生成是从结构化素材到文章的过程，改写是已有文章的风格转换，两者本质不同应分开实现                                      |

## 组内逻辑顺序

遵循"架构决策 (RW-01, RW-02, RW-12) -> 目录与存储规范 (RW-03, RW-05) -> 数据结构与输入定义 (RW-04, RW-09) -> 执行流程与集成 (RW-07, RW-10) -> 核心库实现 (RW-11) -> 配套技能工具 (RW-08) -> 质量保障 (RW-06)"的逻辑顺序。
