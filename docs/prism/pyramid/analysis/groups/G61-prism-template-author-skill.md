# G61: 模板创建技能需采用“决策引导 + 确定性 Scaffold+ 渐进式披露”策略以降低多层知识门槛

> 针对模板创建涉及多层知识导致的高门槛问题，应设计专用技能通过四问映射配置，利用纯确定性工具保证结构正确性，并将创意内容填充留给 Agent 完成。

## 包含的 Atoms

| 编号  | 来源                                           | 内容摘要                                                                                                        |
| ----- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| PT-01 | js-knowledge-prism-prism-template-author-skill | 模板创建涉及多层知识导致新用户门槛高，适合设计专用技能进行引导而非仅提供 CLI 工具                               |
| PT-02 | js-knowledge-prism-prism-template-author-skill | Prompt 编写属于创意任务，LLM 的核心价值在于生成内容质量而非仅生成空骨架                                         |
| PT-03 | js-knowledge-prism-prism-template-author-skill | prism-template-author 技能采用三层结构：决策引导（SKILL.md）、Schema 参考（schema-reference.md）、Scaffold 工具 |
| PT-04 | js-knowledge-prism-prism-template-author-skill | 决策引导通过四个关键问题（产出形态、写作风格、生成复杂度、质量审校）映射到具体的 split、type 和组件配置         |
| PT-05 | js-knowledge-prism-prism-template-author-skill | prism_scaffold_template 工具负责校验模板名、合并默认值、生成 frontmatter 及区段占位，不涉及 LLM 调用            |
| PT-06 | js-knowledge-prism-prism-template-author-skill | prism_scaffold_component 工具用于在 components 目录下生成 persona 或 style 等组件的占位文件                     |
| PT-07 | js-knowledge-prism-prism-template-author-skill | 采用渐进式披露策略，将主技能文件控制在 130 行以内，详细 schema 放在附件中供 Agent 按需查阅                      |
| PT-08 | js-knowledge-prism-prism-template-author-skill | Scaffold 工具应设计为纯确定性逻辑，仅保证结构正确性，将内容填充留给 Agent 根据技能引导完成                      |
| PT-09 | js-knowledge-prism-prism-template-author-skill | 模板和组件文件优先写入知识库 outputs/\_templates/目录，若不存在则写入项目内置目录                               |
| PT-10 | js-knowledge-prism-prism-template-author-skill | 使用 prism_scaffold_template 时需传入 name、split、type、stages 等参数以生成包含 frontmatter 的模板文件         |
| PT-11 | js-knowledge-prism-prism-template-author-skill | 可通过 npx js-knowledge-prism output 命令配合 --dry-run 参数验证新生成的模板是否正确                            |
| PT-12 | js-knowledge-prism-prism-template-author-skill | 该技能目录结构包含 SKILL.md、schema-reference.md、package.json 及 openclaw-plugin 子目录                        |

## 组内逻辑顺序

按照“问题背景与核心价值 (PT-01~02) -> 技能架构设计 (PT-03~04) -> 核心工具逻辑与策略 (PT-05~08) -> 文件路径与参数规范 (PT-09~10) -> 验证与目录结构 (PT-11~12)"的结构顺序排列。
