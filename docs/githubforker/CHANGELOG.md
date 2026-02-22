# 架构变更日志

记录知识库**架构**（目录结构、方法论、工作流程）的变更。日常内容写入不记录在此。

版本规则见 [README — 版本管理](README.md#版本管理)。

## V1.2.0 — 2026-02-23

完善 outputs 层架构：建立视角→产出的转化规约，分离 INDEX，产出首个基于 pyramid 视角的内容。

### 变更

- 新增 `outputs/INDEX.md`：产出层的内容注册表，与 structure/INDEX.md 风格一致
- 重写 `outputs/README.md`：新增 mermaid 转化路径图、产出目录命名规则、新建产出流程；产出总览表移至 INDEX.md
- 新增 `outputs/methodology/`：基于 P01-knowledge-org-methodology 视角的首个产出（引言 + 三章），每章/每节结论先行
- 移除 `outputs/tutorial/`：无 pyramid 视角支撑，待将来有对应视角后重建
- 更新 `INDEX.md`：产出条目从 tutorial（待关联）改为 methodology（首版完成）

### 设计依据

outputs 层是三层架构的最后一环。本次变更明确了从 pyramid/structure/ 视角到面向读者产出的完整转化路径（SCQA→引言、Key Line→章节、子论点→小节），使三层架构首次端到端贯通。

---

## V1.1.0 — 2026-02-22

将 README 中的动态内容（索引表、变更日志）拆分到独立的 INDEX.md 文件，README 仅保留架构说明和模板等稳定内容。

### 变更

- 新增 `INDEX.md` 角色：各目录的内容注册表，随日常写入更新
- `githubforker/README.md` → 移除 journal 条目列表和 outputs 状态表，新增 `INDEX.md`
- `pyramid/analysis/groups/README.md` → 移除分组总览表和变更日志，新增 `INDEX.md`
- `pyramid/structure/README.md` → 移除视角总览表和变更日志，新增 `INDEX.md`
- README 定位明确为**架构文档**（仅在架构变更时修改），INDEX 定位为**内容注册表**（随内容写入更新）
- 更新 `pyramid/README.md` 中对 groups 和 structure 的交叉引用

### 设计依据

遵循架构自身原则 G05：增长型产物（索引表、变更日志）与固定型产物（方法论、模板）应使用不同的组织方式。

---

## V1.0.0 — 2026-02-22

初始架构，确立三层知识体系和金字塔拆解方法论。

### 架构

- 三层目录结构：`journal/`（原始素材）→ `pyramid/`（结构化拆解）→ `outputs/`（面向读者的产出）
- journal 按日期组织（`YYYY-MM-DD/`），每日可含多篇笔记
- outputs 与 pyramid 视角一一对应，视角的 tree 结构决定产出的章节组织

### 方法论

- 金字塔拆解分两阶段：自下而上（analysis：atoms → groups → synthesis）、自上而下（structure：SCQA → tree → validation）
- analysis 阶段所有视角共享，structure 阶段按视角独立
- atoms 按月分子目录（`YYYY-MM/`），支持增量拆解

### 工作流

- 增量拆解流程：新 journal → 提取 atoms → 审视 groups → 检查 synthesis → 检查各视角 → 追加修订记录
- 新建视角流程：通过 `_template/` 模板创建
- 新建产出流程：确认视角完成 → 创建产出目录 → 按 tree 结构组织内容
