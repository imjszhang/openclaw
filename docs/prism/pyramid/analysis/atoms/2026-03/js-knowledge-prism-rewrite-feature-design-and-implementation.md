# js-knowledge-prism 改写（Rewrite）功能：思路、设计与实现

> 来源：[../../../../journal/2026-03-12/js-knowledge-prism-rewrite-feature-design-and-implementation.md](../../../../journal/2026-03-12/js-knowledge-prism-rewrite-feature-design-and-implementation.md)
> 缩写：RW

## Atoms

| 编号  | 类型 | 内容                                                                                                                  | 原文定位                    |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| RW-01 | 判断 | 将风格改写规则嵌入生成阶段的 OUTPUT 模板会导致内容生成与风格转换职责混淆，且输入语义不对齐                            | 二、方案对比与决策 > 2.1    |
| RW-02 | 判断 | 采用独立改写功能（方案 B）可实现生成与改写的正交分离，支持同一产出复用多种风格且不破坏现有体系                        | 二、方案对比与决策 > 2.2    |
| RW-03 | 事实 | 改写定义存放于 `templates/outputs/rewrites/` 目录，知识库覆盖路径为 `outputs/_templates/rewrites/`                    | 三、方案 B 的细化问题 > 3.1 |
| RW-04 | 经验 | 改写输入采用混合模式：必传正文，若存在 refs 则自动加载源素材前 3000 字符作为可选上下文以提升丰富度                    | 三、方案 B 的细化问题 > 3.2 |
| RW-05 | 经验 | 改写结果存储于 `_rewrites/<style>/` 子目录以实现非破坏性存储，确保原文保留且多种风格可共存                            | 三、方案 B 的细化问题 > 3.3 |
| RW-06 | 事实 | 改写审校（Review）关注信息保留度（是否丢关键信息），区别于模板审校关注的生成质量（结构、风格一致性）                  | 三、方案 B 的细化问题 > 3.4 |
| RW-07 | 步骤 | 通过扩展 outputBinding 增加 `rewrites` 字段，在 `output_all` 生成后自动链式执行改写，无需新增定时任务                 | 三、方案 B 的细化问题 > 3.5 |
| RW-08 | 事实 | `prism-rewrite-author` 技能包含 `prism_scaffold_rewrite`（生成骨架）和 `prism_import_rewrite`（提取转换）两个 AI 工具 | 四、技能与创作支持 > 4.1    |
| RW-09 | 步骤 | 改写定义文件 Frontmatter 需包含 name、description、platform、preserveStructure 等字段，Body 须含 Rewrite Prompt       | 六、实现概要 > 6.1          |
| RW-10 | 步骤 | 核心流程包括加载改写定义、分离输入文件 Frontmatter、按需加载源素材上下文、填充变量调用 LLM、写入目标目录及可选审校    | 六、实现概要 > 6.2          |
| RW-11 | 事实 | 新建核心库文件 `lib/rewrite.mjs` 封装 loadRewrite、listRewrites、runRewrite 及 runRewriteBatch 方法                   | 五、完整开发计划 > 阶段 1   |
| RW-12 | 判断 | 生成是从结构化素材到文章的过程，改写是已有文章的风格转换，两者本质不同应分开实现                                      | 七、关键结论                |
