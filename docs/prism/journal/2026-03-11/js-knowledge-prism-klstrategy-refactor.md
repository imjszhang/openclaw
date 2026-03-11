# Knowledge Prism: klStrategy 策略化 Structure 刷新

> 日期：2026-03-11
> 项目：js-knowledge-prism
> 类型：架构优化 + 实现

## 背景

在自动 output 系统中，`refreshStructure: boolean` 是一个二元开关——要么全量重生成 SCQA + Key Lines + expand（会破坏 P23 的 19 个日期 KL），要么完全不刷新。不同视角的 KL 组织方式差异很大，需要差异化的刷新策略。

### 视角差异分析

| 视角         | KL 数量 | 组织逻辑                   | 全量重生成的风险      |
| ------------ | ------- | -------------------------- | --------------------- |
| P01 (方法论) | 3       | 结构顺序（问题→方案→保障） | 安全，2-5 个论点型 KL |
| P24 (架构)   | 2       | 论点驱动                   | 安全                  |
| P23 (日记)   | 19      | 时间序列，每天一个 KL      | **会毁掉** 19 个 KL   |
| P25 (公众号) | 8       | 叙事递进，跨引用 P23 KL    | 需保留手工策划        |

核心矛盾：`fill-perspective.mjs` 的 `keyline` stage 硬编码了"从 synthesis 生成 2-5 个 KL"的策略，只适用于少量论点型视角。

## 方案设计

### 用 `klStrategy` 替代 `refreshStructure`

定义三种策略：

| klStrategy         | SCQA       | KL 表格      | expand  | 适用              |
| ------------------ | ---------- | ------------ | ------- | ----------------- |
| `synthesis` (默认) | 全量重生成 | 全量重生成   | 全部 KL | P01, P24 等论点型 |
| `date-driven`      | 不动       | 仅追加新日期 | 仅新 KL | P23 等日记/日志型 |
| `manual`           | 不动       | 不动         | 不动    | P25 等手工策划型  |

### date-driven 策略流程

1. 扫描 `journal/` 日期目录，获取所有日期
2. 解析 `tree/README.md` 已注册 KL 日期
3. 对比得到新日期列表
4. 检查 `atoms/README.md` 缩写映射表，过滤出有已处理 atoms 的日期
5. 扫描 groups 文件，找到包含对应 atom 缩写的 groups
6. 无 groups 的日期跳过
7. LLM 生成"第 N 天：主题"标题
8. 追加 KL 行到 `tree/README.md`
9. 仅对新 KL 执行 `expand-kl`

### 全自动链路

配置好后，整个 journal → output 链路全自动：

1. 用户写日记 → `journal/YYYY-MM-DD/*.md`
2. Cron 1 (`prism-auto-process`，60 min)：检测新 journal → atoms → groups → synthesis → 写入 output-inbox 信号
3. Cron 2 (`prism-auto-output`，120 min)：读取 inbox → Phase 1 structure 刷新（date-driven: 追加新 KL）→ Phase 2 output 生成

## 实现变更

### 新增文件

- **`lib/date-driven-kl.mjs`**：date-driven 策略核心模块
  - `buildAbbrevToGroupsMap(groupsDir)` — 扫描 group 文件，构建 atom 缩写 → group ID 映射
  - `detectNewDates(paths, perspectiveDir)` — 对比 journal 日期 vs 已注册 KL，返回有 atoms 的新日期
  - `findGroupsForDate(abbrevToGroups, atomAbbrevs)` — 根据 atom 缩写查找关联 groups
  - `appendDateKls(opts)` — LLM 生成标题，追加 KL 行到 tree/README.md

### 修改文件

- **`openclaw-plugin/index.mjs`**：
  - `bind_output` 工具参数 `refreshStructure: boolean` 替换为 `klStrategy: "synthesis" | "date-driven" | "manual"`
  - 新增 `refreshByStrategy()` 公共函数，统一策略分派
  - batch path 和 mtime fallback path 两处 structure 刷新逻辑均改为调用 `refreshByStrategy()`，消除约 90 行重复代码
  - 列出绑定时显示 `[klStrategy: xxx]`
- **`README.md`** / **`SKILL.md`**：工具表格描述更新
- **`openclaw-plugin/skills/prism-processor/SKILL.md`**：绑定示例、参数说明、Phase 1 流程、安全保护更新
- **`CHANGELOG.md`**：新增 v1.4.0 条目
- **`RELEASE_NOTES.md`**：新增 v1.5.0 头部

### 不变的部分

- `lib/output.mjs` — output 生成逻辑不变
- `lib/expand-kl.mjs` — KL 展开逻辑不变
- `lib/fill-perspective.mjs` — synthesis 策略逻辑不变
- `lib/utils.mjs` — `parseAbbrevTable` 和 `parseKeyLineTable` 已满足需求

## 关键决策

1. **不考虑向后兼容**：直接替换 `refreshStructure` 字段，已有绑定需重新调用 `bind_output` 设置 `klStrategy`
2. **仅实现三种策略**：`synthesis` / `date-driven` / `manual`，`incremental`（持续增长型）留后续迭代
3. **date-driven 日期来源**：扫描 journal 目录 + 检查 groups 覆盖，只为有 groups 的已处理日期创建 KL
4. **SCQA 不动**：date-driven 策略下 SCQA 不重生成，因为日记类视角的 SCQA 是人工策划的叙事弧线
5. **代码去重**：batch path 和 mtime fallback path 的重复刷新逻辑提取为 `refreshByStrategy` 公共函数

## 使用方式

```bash
# 绑定日记型视角（date-driven）
knowledge_prism_bind_output(
  perspectiveDir="P23-practice-diary",
  template="practice-diary",
  klStrategy="date-driven"
)

# 绑定论点型视角（默认 synthesis）
knowledge_prism_bind_output(
  perspectiveDir="P01-knowledge-org-methodology",
  template="methodology"
)

# 绑定手工策划型视角
knowledge_prism_bind_output(
  perspectiveDir="P25-yangxia-series",
  template="yangxia-series",
  klStrategy="manual"
)
```
