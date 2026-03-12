# js-knowledge-prism: prism-template-author 技能开发

> 来源：[../../../../journal/2026-03-12/js-knowledge-prism-prism-template-author-skill.md](../../../../journal/2026-03-12/js-knowledge-prism-prism-template-author-skill.md)
> 缩写：PT

## Atoms

| 编号  | 类型 | 内容                                                                                                            | 原文定位                                 |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| PT-01 | 判断 | 模板创建涉及多层知识导致新用户门槛高，适合设计专用技能进行引导而非仅提供 CLI 工具                               | 背景                                     |
| PT-02 | 判断 | Prompt 编写属于创意任务，LLM 的核心价值在于生成内容质量而非仅生成空骨架                                         | 设计思路 > 为什么技能比纯 CLI 工具更合适 |
| PT-03 | 事实 | prism-template-author 技能采用三层结构：决策引导（SKILL.md）、Schema 参考（schema-reference.md）、Scaffold 工具 | 设计思路 > 三层结构                      |
| PT-04 | 事实 | 决策引导通过四个关键问题（产出形态、写作风格、生成复杂度、质量审校）映射到具体的 split、type 和组件配置         | 实现内容 > 决策引导                      |
| PT-05 | 事实 | prism_scaffold_template 工具负责校验模板名、合并默认值、生成 frontmatter 及区段占位，不涉及 LLM 调用            | 实现内容 > Scaffold 工具                 |
| PT-06 | 事实 | prism_scaffold_component 工具用于在 components 目录下生成 persona 或 style 等组件的占位文件                     | 实现内容 > Scaffold 工具                 |
| PT-07 | 经验 | 采用渐进式披露策略，将主技能文件控制在 130 行以内，详细 schema 放在附件中供 Agent 按需查阅                      | 关键决策                                 |
| PT-08 | 判断 | Scaffold 工具应设计为纯确定性逻辑，仅保证结构正确性，将内容填充留给 Agent 根据技能引导完成                      | 关键决策                                 |
| PT-09 | 步骤 | 模板和组件文件优先写入知识库 outputs/\_templates/目录，若不存在则写入项目内置目录                               | 关键决策 > 本地优先                      |
| PT-10 | 步骤 | 使用 prism_scaffold_template 时需传入 name、split、type、stages 等参数以生成包含 frontmatter 的模板文件         | 使用方式                                 |
| PT-11 | 步骤 | 可通过 npx js-knowledge-prism output 命令配合 --dry-run 参数验证新生成的模板是否正确                            | 使用方式                                 |
| PT-12 | 事实 | 该技能目录结构包含 SKILL.md、schema-reference.md、package.json 及 openclaw-plugin 子目录                        | 实现内容 > 新增文件                      |
