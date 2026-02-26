# 信息单元（Atoms）

从每篇 journal 原始文档中提取的独立知识点。每个 atom 是不可再拆的最小信息单元。

## 编号规则

每个 atom 使用 `[缩写]-[序号]` 格式编号：

- 缩写：取自 journal 文件名的简写（见下方映射表）
- 序号：两位数字，从 01 开始递增
- 示例：`AR-01` 表示 openclaw-analysis-report 的第 1 个信息单元

## 缩写映射表

新增 journal 时，在此表追加一行即可。

| 缩写 | journal 文件名                        | 月份    |
| ---- | ------------------------------------- | ------- |
| AR   | openclaw-analysis-report              | 2026-01 |
| FM   | fork-management-guide                 | 2026-01 |
| CD   | channel-deployment-guide              | 2026-01 |
| MA   | model-agent-config-guide              | 2026-01 |
| OD   | openclaw-doctor-guide                 | 2026-01 |
| TC   | tinycore-feasibility-report           | 2026-01 |
| CC   | custom-channel-guide                  | 2026-02 |
| ED   | extension-development-guide           | 2026-02 |
| SG   | skills-guide                          | 2026-02 |
| CR   | cron-config-guide                     | 2026-02 |
| AE   | agent-evolution-guide                 | 2026-02 |
| ES   | external-scripting-guide              | 2026-02 |
| CT   | cursor-terminal-config-guide          | 2026-02 |
| WP   | wecom-plugin-deployment-guide         | 2026-02 |
| BR   | browser-relay-guide                   | 2026-02 |
| CP   | openclaw-core-concepts-pyramid        | 2026-02 |
| CQ   | openclaw-core-concepts-qa-and-usage   | 2026-02 |
| IA   | independent-agent-creation-guide      | 2026-02 |
| TM   | agent-token-usage-monitoring-analysis | 2026-02 |
| MU   | merge-main-upgrade-summary            | 2026-02 |
| KA   | knowledge-base-architecture-design    | 2026-02 |
| FN   | from-notes-to-plugin                  | 2026-02 |
| JE   | js-eyes-openclaw-plugin-guide         | 2026-02 |

## 按月分目录约定

atoms 文件按 journal 创建日期的 `YYYY-MM` 部分归入子目录：

- journal `2026-01-31/xxx.md` → atoms `2026-01/xxx.md`
- journal `2026-02-08/xxx.md` → atoms `2026-02/xxx.md`

新增月份时创建新的子目录即可。

## 信息单元分类

每个 atom 标注以下四种类型之一：

| 类型 | 说明                                 | 示例                                                                     |
| ---- | ------------------------------------ | ------------------------------------------------------------------------ |
| 事实 | 客观存在的概念、定义、架构描述       | "OpenClaw 采用五层抽象：Channel → Account → Agent → Workspace → Session" |
| 步骤 | 具体的操作方法、命令、配置过程       | "使用 `openclaw config set gateway.mode local` 设置本地模式"             |
| 经验 | 踩坑记录、最佳实践、非显而易见的发现 | "WeCom 插件的运行时依赖必须放在 dependencies 而非 devDependencies"       |
| 判断 | 主观评估、可行性结论、取舍决策       | "Tiny Core Linux 不适合部署 OpenClaw，资源限制过大"                      |

## Atom 文件模板

每个 atoms 文件遵循以下结构：

```markdown
# [journal 标题]

> 来源：[../../journal/YYYY-MM-DD/xxx.md](相对路径链接)

## Atoms

| 编号  | 类型                                             | 内容               | 原文定位         |
| ----- | ------------------------------------------------ | ------------------ | ---------------- |
| XX-01 | 事实/步骤/经验/判断                              | 信息单元的简明描述 | 章节名或行号范围 |
| XX-02 | ...                                              | ...                | ...              |
| KP    | knowledge-prism-introduction                     | 2026-02            |
| PC    | plugin-creation-guide                            | 2026-02            |
| UP    | using-knowledge-prism-plugin                     | 2026-02            |
| CH    | clawhub-publish-guide                            | 2026-02            |
| AF    | js-eyes-agent-first-transformation               | 2026-02            |
| SD    | skill-discovery-system-design-and-implementation | 2026-02            |
| OP    | workspace-path-openclaw-state-dir-mismatch       | 2026-02            |
| EX    | exec-approvals-curl-pipe-bash-blocked            | 2026-02            |
```
