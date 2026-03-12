# js-knowledge-prism 改写（Rewrite）功能：思路、设计与实现

> 日期：2026-03-12
> 项目：js-knowledge-prism
> 类型：架构设计 + 完整实现
> 来源：Cursor Agent 对话

---

## 一、问题提出

用户希望将类似 `wenyan-cli/prompts/rewrite-wechat-kzk-style.md` 这样的「卡兹克风格」改写提示词，整合进 js-knowledge-prism 体系。核心问题是：

**方案 A**：将其转换为自定义 OUTPUT 模板  
**方案 B**：作为已 output 内容的后处理改写功能

用户要求给思路，不执行、不写代码。

---

## 二、方案对比与决策

### 2.1 方案 A：转换为 OUTPUT 模板

把改写规则嵌入「生成阶段」的 System Prompt / Unit Prompt，使 LLM 从 pyramid 素材直接产出卡兹克风格文章。

**优点**：一次生成到位，少一次 LLM 调用  
**缺点**：

- 改写提示词关注的是「已有文章的节奏、语气、叙事结构」——输入是完整文章，不是碎片化素材
- OUTPUT 模板的输入是 journal/groups/KL 等结构化片段，两者语义不对齐
- 强行塞入会混淆「内容生成」与「风格转换」两种职责

### 2.2 方案 B：独立改写功能

在 output 已生成之后，增加一个「改写」步骤，输入是完整文章，输出是风格转换后的新版本。

**优点**：

- 职责单一：生成 vs 改写正交分离
- 可复用：同一产出可用多种改写风格（公众号、知乎、推文等）
- 不破坏现有 template 体系
- 改写定义可独立演进

**决策**：采用方案 B，并进一步细化为**独立改写概念**（方案 B2），不塞入 template 内部。

---

## 三、方案 B 的细化问题

在选定方案 B 后，需要回答若干实现问题。

### 3.1 改写定义存放位置

| 选项                  | 说明                                           |
| --------------------- | ---------------------------------------------- |
| 放在 `prompts/` 下    | 与 output 模板混在一起，易混淆                 |
| 新建 `rewrites/` 目录 | 独立资源类型，与 components/types/prompts 平级 |

**决策**：新建 `templates/outputs/rewrites/`，知识库覆盖路径为 `outputs/_templates/rewrites/`。

### 3.2 改写输入

| 选项              | 说明                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 2a. 仅正文        | `runRewrite` 只接收生成后的 Markdown 正文                                                                                  |
| 2b. 正文 + 源素材 | 额外传入 journal、groups 等作为上下文                                                                                      |
| 2c. 混合          | 正文必传；若有 refs（骨架系统写入的引用路径），自动加载 journal/groups 作为可选的 `{{source_context}}`（截取前 3000 字符） |

**决策**：2c。灵活性最高：无 refs 时纯正文改写，有 refs 时可利用源素材做更丰富的改写。

### 3.3 改写结果存放

| 选项                        | 说明                     |
| --------------------------- | ------------------------ |
| 覆盖原文件                  | 丢失原文，不可逆         |
| 同名备份                    | 需维护备份逻辑           |
| `_rewrites/<style>/` 子目录 | 原文保留，多种风格可共存 |

**决策**：`_rewrites/<style>/`。非破坏性，多风格并存。

### 3.4 审校（Review）语义

- **模板的 Review Prompt**：关注生成内容的「质量」（素材忠实、结构、风格一致性）
- **改写的 Review Prompt**：关注改写后的「信息保留度」（是否丢关键信息、曲解原意）

**决策**：改写定义可声明可选 `# Review Prompt`，与模板审校区分语义。

### 3.5 与 Cron 的集成

| 选项               | 说明                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| 单独 cron          | 需新增定时任务，逻辑分散                                                                          |
| 扩展 outputBinding | 在 `bind_output` 中增加 `rewrites: ["kzk-wechat"]`，output_all 生成后自动对本次新生成文件执行改写 |

**决策**：扩展 outputBinding。无需新 cron，复用现有 output_all 流程，生成后链式改写。

---

## 四、技能与创作支持

用户提出：还需要**技能便于自定义新的改写**，以及 **openclaw-plugin 里自动化 cron 的配置**。

### 4.1 prism-rewrite-author 技能

参照 `prism-template-author` 的设计：

- **SKILL.md**：引导式决策流程（目标平台、语气风格、结构改造程度、是否含审校）
- **AI 工具**：
  - `prism_scaffold_rewrite` — 生成改写定义骨架到 `_templates/rewrites/`
  - `prism_import_rewrite` — 从已有提示词文件提取并转换为标准改写定义格式

### 4.2 Cron 配置

不改动 cron 配置本身。改写作为 `output_all` 的后置步骤：

- `binding.rewrites` 非空时，对本次 `status === "generated"` 的文件逐个调用 `runRewrite`
- 记录 `lastRewriteAt` 到 binding
- 结果摘要包含改写统计

---

## 五、完整开发计划（6 阶段）

### 阶段 1：引擎核心

- 新建 `lib/rewrite.mjs`：`loadRewrite`、`listRewrites`、`runRewrite`、`runRewriteBatch`
- 新建 `templates/outputs/rewrites/kzk-wechat.md` — 将 wenyan-cli 的卡兹克提示词转换为标准改写定义

### 阶段 2：CLI 集成

- `bin/cli.mjs` 新增 `rewrite` 子命令
- `lib/output.mjs` 新增 `--rewrite <style>` 参数，生成后自动链式改写

### 阶段 3：模板文档

- `templates/outputs/README.md` 增加 rewrites 架构、目录、CLI
- `schema-reference.md` 增加 Rewrite 定义 Schema

### 阶段 4：OpenClaw 插件

- 新增 AI 工具：`knowledge_prism_rewrite`、`knowledge_prism_list_rewrites`
- `bind_output` 扩展 `rewrites: string[]`，`output_all` 生成后自动改写
- `loadConfigBindings` / `mergeBindings` 支持 rewrites
- CLI `prism rewrite` 子命令

### 阶段 5：prism-rewrite-author 技能

- 新建 `skills/prism-rewrite-author/`：SKILL.md、openclaw-plugin、schema-reference

### 阶段 6：文档更新

- README、SKILL.md、RELEASE_NOTES、SECURITY、CHANGELOG

---

## 六、实现概要

### 6.1 改写定义格式

```
templates/outputs/rewrites/
  kzk-wechat.md   # 卡兹克风格
  <name>.md       # 其他改写
```

Frontmatter：`name`、`description`、`platform`、`preserveStructure`、`preserveLinks`、`preserveFrontmatter`

Body 区段：

- `# Rewrite Prompt`（必需）— 使用 `{{article_content}}`、`{{source_context}}`
- `# Review Prompt`（可选）— 使用 `{{rewritten_content}}`、`{{article_content}}`

### 6.2 核心流程

1. `loadRewrite(name, baseDir)`：查找本地 `_templates/rewrites/` 或内置 `rewrites/`，解析 frontmatter + `resolveIncludes` + 区段
2. 读取 input 文件，分离 frontmatter 与 body
3. 若有 `refs`，加载 journal/groups 作为 `source_context`（截断 3000 字符）
4. 填充变量，调用 LLM 改写
5. 写入 `_rewrites/<style>/<filename>.md`
6. 可选执行改写审校

### 6.3 新建/修改文件清单

**新建**：

- `lib/rewrite.mjs`
- `templates/outputs/rewrites/kzk-wechat.md`
- `skills/prism-rewrite-author/` 整目录

**修改**：

- `bin/cli.mjs`
- `lib/output.mjs`
- `openclaw-plugin/index.mjs`
- `templates/outputs/README.md`
- `skills/prism-template-author/schema-reference.md`
- `README.md`
- `SKILL.md`
- `RELEASE_NOTES.md`
- `SECURITY.md`
- `CHANGELOG.md`

---

## 七、关键结论

1. **生成 vs 改写**：生成是从结构化素材到文章；改写是已有文章的风格/语气/叙事转换。两者正交，应分开实现。
2. **资源定位**：rewrites 作为独立资源类型，与 components、types、prompts 并列。
3. **非破坏性存储**：`_rewrites/<style>/` 保留原文，支持多风格并存。
4. **Cron 集成**：通过扩展 outputBinding 的 `rewrites` 字段，在 `output_all` 中链式执行，无需新定时任务。
5. **技能对称**：`prism-rewrite-author` 与 `prism-template-author` 对应，提供 scaffold 与 import 工具，降低创作门槛。
