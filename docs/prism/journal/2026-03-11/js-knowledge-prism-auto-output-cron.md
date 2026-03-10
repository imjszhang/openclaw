# js-knowledge-prism 全链路自动产出 Cron Job

> 文档日期：2026-03-11
>
> 来源：Cursor Agent 对话 — js-knowledge-prism 项目开发
>
> 相关：[js-knowledge-prism-3d-graph-upgrade.md](../2026-03-10/js-knowledge-prism-3d-graph-upgrade.md)

---

## 背景

js-knowledge-prism 的知识处理链路分三段：

1. **journal → synthesis**：由已有的 `prism-auto-process` cron 自动处理（每 60 分钟）
2. **synthesis → structure**：需要运行 `fill_perspective`（SCQA + Key Lines）和 `expand_kl`，此前只能手动或 AI 对话触发
3. **structure → output**：需要运行 `runOutput`，此前也只能手动触发

用户希望实现全链路自动化——从笔记写入到成品文章生成，无需人工干预。

## 设计决策

### 独立 vs 整合

针对 structure 刷新（第 2 段）和 output 生成（第 3 段）的自动化，讨论了两种方案：

| 方案                 | 描述                                                | 结论                           |
| -------------------- | --------------------------------------------------- | ------------------------------ |
| 独立系统             | 3 个 cron + 3 套 binding + 3 套管理 Tool            | 配置负担重，有时序同步问题     |
| **整合方案**（采用） | 2 个 cron，structure 刷新作为 output_all 的 Phase 1 | 配置简洁，无时序问题，去重自然 |

核心理由：structure 刷新的唯一目的是为 output 生成做准备，两者有天然的上下游依赖关系，拆开只会引入时序同步问题。

### 变化检测策略

采用 mtime 双层检测：

- **Phase 1**：比较 `synthesis.md` + `groups/` 的 mtime 与 `lastStructureRefreshAt` → 驱动 structure 刷新
- **Phase 2**：比较 `structure/<perspective>/` 的 mtime 与 `lastOutputAt` → 驱动 output 生成

## 实现清单

### 1. Output 自动生成基础设施

#### Registry 扩展

在 `registry.json` 的 base 条目中新增 `outputBindings` 数组：

```json
{
  "outputBindings": [
    {
      "perspectiveDir": "P01-practice-diary",
      "template": "practice-diary",
      "enabled": true,
      "refreshStructure": true,
      "lastStructureRefreshAt": null,
      "lastOutputAt": null,
      "lastOutputSummary": null
    }
  ]
}
```

#### 新增 AI Tools（3 个）

| 工具                                   | 功能                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| `knowledge_prism_bind_output`          | 绑定视角+模板的自动产出配置，含 `refreshStructure` 开关 |
| `knowledge_prism_list_output_bindings` | 列出所有产出绑定及状态                                  |
| `knowledge_prism_output_all`           | 批量生成所有已绑定产出（两阶段执行）                    |

#### 新增 CLI 命令

- `prism setup-output-cron`：一键配置 `prism-auto-output` 定时任务（默认 120 分钟）

#### 配置 Schema

`openclaw.plugin.json` 的 cron 对象新增 `outputInterval` 属性。

### 2. Structure 自动刷新（整合到 output_all）

`knowledge_prism_output_all` 升级为两阶段执行：

**Phase 1 — Structure 刷新**（按 perspective 去重）：

- 检查 `refreshStructure` 开关
- 对比 synthesis.md + groups/ 的 mtime 与 `lastStructureRefreshAt`
- 有变化时依次运行：
  - `runFillPerspective(stage="scqa")`
  - `runFillPerspective(stage="keyline")`
  - `runExpandKl` 逐条展开所有 Key Lines
- 更新所有同 perspective 绑定的 `lastStructureRefreshAt`

**Phase 2 — Output 生成**（现有逻辑增强）：

- 对比 structure 目录 mtime 与 `lastOutputAt`
- 有变化时调用 `runOutput(mode="generate")`
- 更新 `lastOutputAt` 和 `lastOutputSummary`

### 3. 边界处理

| 场景                                  | 处理                                             |
| ------------------------------------- | ------------------------------------------------ |
| synthesis.md 不存在                   | 跳过 structure 刷新，仍尝试 output 生成          |
| fill_perspective / expand_kl 单步失败 | 记录 error，不中断后续步骤                       |
| 同一 perspective 被多个 binding 引用  | Set 去重，只刷新一次                             |
| `force` 默认 false                    | 已有非骨架 output 文件不被覆盖                   |
| `refreshStructure=false`              | 跳过自动刷新，直接检测 structure 变化生成 output |

## 改动文件汇总

| 文件                                              | 改动                                                                                                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw-plugin/index.mjs`                       | 新增 import（readdirSync、statSync、parseKeyLineTable），扩展 register 数据结构，新增 3 个 AI Tool，新增 CLI 命令，output_all 升级两阶段 |
| `openclaw-plugin/openclaw.plugin.json`            | cron schema 新增 outputInterval                                                                                                          |
| `openclaw-plugin/skills/prism-processor/SKILL.md` | 新增产出绑定管理和定时产出流程章节                                                                                                       |
| `SKILL.md`                                        | 版本号 1.3.0，新增 3 个工具、1 个 CLI 命令、cron 配置项                                                                                  |
| `README.md`                                       | 新增 CLI 命令和 AI 工具条目                                                                                                              |
| `CHANGELOG.md`                                    | 新增 1.3.0 版本记录                                                                                                                      |
| `RELEASE_NOTES.md`                                | 升级为 v1.3.0 全链路自动化                                                                                                               |

## 架构总览

```
cron 1: prism-auto-process (每 60 min)
  └→ knowledge_prism_process_all
     └→ journal → atoms → groups → synthesis

cron 2: prism-auto-output (每 120 min)
  └→ knowledge_prism_output_all
     ├→ Phase 1: synthesis/groups 变化 → 刷新 structure (SCQA + KL)
     └→ Phase 2: structure 变化 → 生成 output
```

用户只需：

1. `openclaw prism register <dir>` — 注册知识库
2. `knowledge_prism_bind_output(perspectiveDir, template)` — 绑定产出
3. `openclaw prism setup-cron` + `openclaw prism setup-output-cron` — 配置定时任务

之后全链路自动运行，无需手动干预。
