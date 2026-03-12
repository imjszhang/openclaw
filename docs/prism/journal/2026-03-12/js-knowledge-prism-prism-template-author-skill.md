# js-knowledge-prism: prism-template-author 技能开发

> 日期：2026-03-12
> 项目：js-knowledge-prism
> 类型：扩展技能 + 实现
> 来源：Cursor Agent 对话

---

## 背景

产出模板（`templates/outputs/prompts/`）创建需要掌握 frontmatter、区段结构、变量表、组件引用等多层知识，新用户上手门槛高。用户提出：是否考虑设计一个技能来引导模板创建？

## 设计思路

### 为什么技能比纯 CLI 工具更合适

- **Prompt 编写是创意任务**：LLM 参与最有价值的是 prompt 内容本身，而非仅生成空骨架
- **决策引导**：技能可携带 schema 参考 + 决策树，Agent 根据用户意图动态推荐 split、type、组件
- **范例引用**：技能可引用现有模板（如 practice-diary.md）作为活示例
- **Scaffold 工具辅助**：轻量 scaffold 解决结构正确性，Agent 解决内容质量

### 三层结构

1. **决策引导（SKILL.md 主体）**：四个关键问题 → split / persona+style / pipeline / review 的决策矩阵
2. **Schema 参考（schema-reference.md 附件）**：完整 frontmatter 字段表、变量表（按 split 分组）、区段规范、内置组件/类型清单
3. **Scaffold 工具**：`prism_scaffold_template` 和 `prism_scaffold_component` 两个 AI 工具，纯确定性，不调用 LLM

## 实现内容

### 新增文件

```
skills/prism-template-author/
├── SKILL.md                    # 主技能（~130 行）
│   ├── 决策引导：4 个问题 → 决策矩阵
│   ├── 创建工作流：Scaffold → Fill → Verify 三步走
│   └── 参考链接：指向 schema-reference.md
├── schema-reference.md         # 完整参考表（~200 行）
│   ├── Frontmatter 字段表（8 字段）
│   ├── 变量表（7 种策略 × 各自变量）
│   ├── 区段规范（5 种区段）
│   ├── 内置组件/类型清单
│   └── 范例模板引用
├── package.json
└── openclaw-plugin/
    ├── openclaw.plugin.json
    └── index.mjs               # 两个 AI 工具实现
```

### 决策引导（Q1–Q4）

| 问题          | 映射                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 产出形态   | 每个 KL 一篇 → per-kl / diary；整个视角一篇 → per-perspective / blog；每个 Group 一篇 → per-group；跨视角 → cross-perspective；从 analysis → analysis |
| Q2 写作风格   | 叙事复盘 → blogger + narrative；结构化教程 → 新建 teacher + tutorial；学术报告 → 新建 analyst + formal                                                |
| Q3 生成复杂度 | 一步生成 → 单段 prompt；多阶段 → stages + # Stage: 区段                                                                                               |
| Q4 质量审校   | 需要 → # Review Prompt + {{@include review/base.md}}                                                                                                  |

### Scaffold 工具

**prism_scaffold_template**：

- 参数：name（必填）、split、type、fileNaming、stages、pauseAfter、review、skeleton、source、baseDir
- 逻辑：校验模板名不重复、type 存在；合并 type 默认值；生成 frontmatter + 区段占位；预填 constraints.md 和 review/base.md
- 输出：文件路径 + 下一步提示

**prism_scaffold_component**：

- 参数：name（必填，如 persona/teacher.md）、content（可选）、baseDir
- 逻辑：在 components/ 下生成占位文件
- 输出：文件路径 + 引用说明

### 修改文件

- **README.md**：新增「扩展技能」章节，列出 prism-output-blog 和 prism-template-author

## 关键决策

1. **Progressive Disclosure**：SKILL.md 控制在 130 行，详细 schema 放在 schema-reference.md，Agent 按需查阅
2. **Scaffold 纯确定性**：不调用 LLM，只负责结构正确性；prompt 内容由 Agent 根据技能引导填写
3. **遵循 prism-output-blog 模式**：目录结构、openclaw-plugin 注册方式一致
4. **本地优先**：模板和组件优先写入知识库 `outputs/_templates/`（若存在），否则写入项目内置目录

## 使用方式

```bash
# 1. 启用技能后，Agent 根据用户需求调用 scaffold
prism_scaffold_template({
  name: "tutorial",
  split: "per-perspective",
  type: "blog",
  stages: ["outline", "draft", "polish"],
  review: true
})

# 2. 如需新组件
prism_scaffold_component({ name: "persona/teacher.md" })
prism_scaffold_component({ name: "style/tutorial.md" })

# 3. 验证模板
npx js-knowledge-prism output --perspective <dir> --template tutorial --dry-run
```

## 对话与执行摘要

1. **用户提问**：思考怎么添加新的 templates/outputs 模板？是不是考虑设计一个技能？先说思路，不要执行
2. **回复**：提出技能优于纯 CLI 工具的理由，以及 prism-template-author 技能的三层设计（决策引导 + schema 参考 + scaffold 工具）
3. **用户**：做吧，先制定开发计划
4. **制定计划**：CreatePlan 生成完整开发计划（SKILL.md、schema-reference.md、scaffold 工具、plugin 元数据、README 更新）
5. **执行**：按 todo 顺序完成全部 5 项，创建 6 个文件，修改 1 个文件
