# memory-core 研究与改造日志

> 记录日期：2026-02-28  
> 范围：OpenClaw 记忆体系调研、`memory-core` 使用评估、`~/.openclaw` 运行侧改造落地（不涉及仓库主代码功能改动）

---

## 1. 背景与目标

本次工作的起点是两个问题：

1. 当前项目到底有哪些“长期记忆方案”，它们的边界与触发方式是什么；
2. 在现有运行环境中，如何把 `memory-core` 从“可用”提升到“稳定可用、可复盘、可治理”。

工作目标最终明确为：建立一套可执行的闭环——写入、检索、清理。

---

## 2. 调研过程（按问题推进）

### 2.1 全量插件识别

先盘点 `extensions/` 下插件，再聚焦记忆相关插件。结论是记忆插件有两类：

- `memory-core`
- `memory-lancedb`

### 2.2 两类记忆插件定位

- `memory-core`：偏“内置记忆工具接入层”，提供 `memory_search`/`memory_get` 与 `memory` CLI。
- `memory-lancedb`：偏“完整长期记忆系统”，包含向量存储、召回、自动捕获/自动注入等能力。

### 2.3 共同作用可行性

确认两者可并存，但不共享同一套数据语义。若同时启用，工具面更宽，但也可能造成策略分散。

### 2.4 当前本地配置核查（`~/.openclaw`）

核查结果：

- 记忆槽位已指向 `memory-core`
- `memory-core` 已启用
- 未见 `memory-lancedb` 被选为 memory slot

结论：本地 `memory-core` 使用方式本身正确。

### 2.5 触发方式与“保存”行为澄清

关键澄清：

- `memory-core` 不做“记忆条目语义写入”（不是 `memory_store`）。
- 它的“保存”本质是索引同步与更新：会话预热、搜索触发、文件变更监听、手动索引、可选定时同步。

### 2.6 cron / heartbeat 与记忆关系

核查 `~/.openclaw/cron/jobs.json` 与 `HEARTBEAT.md` 后确认：

- 现有 cron 与 heartbeat 任务未显式调用 `memory_search`/`memory_get` 命令；
- heartbeat 流程本身是健康检查导向，不承担记忆沉淀职责。

### 2.7 `workflow.py heartbeat` 是否写记忆

沿 `workflow.py -> HeartbeatUseCase -> MoltbookHeartbeat` 路径核查后确认：

- heartbeat 不写 `memory/*.md`；
- 仅更新状态与执行日志（state / execution log），不做长期记忆文档写入。

---

## 3. 决策与执行计划

围绕 `memory-core` 制定并确认 4 个阶段：

1. 记忆模型定标：分层边界、字段模板、标签集、写入门槛；
2. 写入闭环建设：新增独立 memory digest 任务；
3. 检索策略收敛：先搜后答规则 + 高频 query 模板；
4. 周期治理：周清理 + 三项指标复盘。

核心原则：

- heartbeat 保持只读；
- 记忆写入由独立任务统一处理；
- 不把历史记忆当实时状态来源。

---

## 4. 已完成改造（运行侧）

以下改造发生在 `~/.openclaw` 运行环境，不在仓库主功能代码中：

### 4.1 记忆规范与模板

- 强化 `MEMORY.md` 的分层与写入门槛规范；
- 新增每日模板：`memory/_TEMPLATE.md`。

### 4.2 检索策略文档

- 新增 `memory/RETRIEVAL.md`：
  - 定义先搜后答场景；
  - 固化高频检索 query 模板；
  - 统一检索输出行为。

### 4.3 周治理文档

- 新增 `memory/WEEKLY_REVIEW.md`：
  - 明确每周固定动作；
  - 固化命中率、噪声率、可行动率三指标。

### 4.4 独立沉淀脚本与调度

- 新增 `scripts/memory_digest.py`，从执行日志抽取高价值事件并写入 `memory/YYYY-MM-DD.md`；
- 新增 `scripts/memory_weekly_review.py`，按周生成治理复盘文档；
- 在 cron 中新增：
  - `Moltbook Memory Digest`（日级）
  - `Moltbook Memory Weekly Review`（周级）

### 4.5 Heartbeat 侧检索规范补充

- 在 `HEARTBEAT.md` 增加 memory-core 检索顺序说明：
  - 历史问题先搜后答；
  - 实时问题优先实时检查。

---

## 5. 结果评估

阶段性结果：

- 记忆职责边界从“混合”变为“清晰”；
- heartbeat 与记忆沉淀解耦完成；
- 记忆写入入口统一，不再依赖临时人工记录；
- 检索规则与治理机制形成文档化标准。

当前状态从“插件启用”升级为“流程可运行、可维护、可迭代”。

---

## 6. 遗留风险与后续建议

仍需持续跟踪的风险：

1. 日志抽取过量导致记忆噪声上升；
2. 业务文案与实际 cron 配置不一致，导致 heartbeat 误报；
3. 检索命中率受写入质量影响，需周复盘驱动优化。

建议后续动作：

- 连续 2 周跟踪三项指标（命中率/噪声率/可行动率）；
- 对高频失败场景补充“固定 query”与标签细化；
- 对 heartbeat 文档中的“预期任务清单”与真实 cron 定期对齐。

---

## 7. 本次工作的关键结论

`memory-core` 的价值不在“自动写一切”，而在“高质量索引 + 高质量输入源”。  
只要把写入门槛、写入入口、检索策略和周治理四件事固定下来，`memory-core` 就能稳定支撑长期记忆场景。
