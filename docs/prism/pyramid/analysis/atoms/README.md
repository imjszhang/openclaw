# 信息单元（Atoms）

从每篇 journal 原始文档中提取的独立知识点。每个 atom 是不可再拆的最小信息单元。

## 编号规则

每个 atom 使用 `[缩写]-[序号]` 格式编号：

- 缩写：取自 journal 文件名的简写（见下方映射表）
- 序号：两位数字，从 01 开始递增
- 示例：`AR-01` 表示 openclaw-analysis-report 的第 1 个信息单元

## 缩写映射表

新增 journal 时，在此表追加一行即可。

| 缩写 | journal 文件名                                               | 月份    |
| ---- | ------------------------------------------------------------ | ------- |
| AR   | openclaw-analysis-report                                     | 2026-01 |
| FM   | fork-management-guide                                        | 2026-01 |
| CD   | channel-deployment-guide                                     | 2026-01 |
| MA   | model-agent-config-guide                                     | 2026-01 |
| OD   | openclaw-doctor-guide                                        | 2026-01 |
| TC   | tinycore-feasibility-report                                  | 2026-01 |
| CC   | custom-channel-guide                                         | 2026-02 |
| ED   | extension-development-guide                                  | 2026-02 |
| SG   | skills-guide                                                 | 2026-02 |
| CR   | cron-config-guide                                            | 2026-02 |
| AE   | agent-evolution-guide                                        | 2026-02 |
| ES   | external-scripting-guide                                     | 2026-02 |
| CT   | cursor-terminal-config-guide                                 | 2026-02 |
| WP   | wecom-plugin-deployment-guide                                | 2026-02 |
| BR   | browser-relay-guide                                          | 2026-02 |
| CP   | openclaw-core-concepts-pyramid                               | 2026-02 |
| CQ   | openclaw-core-concepts-qa-and-usage                          | 2026-02 |
| IA   | independent-agent-creation-guide                             | 2026-02 |
| TM   | agent-token-usage-monitoring-analysis                        | 2026-02 |
| MU   | merge-main-upgrade-summary                                   | 2026-02 |
| KA   | knowledge-base-architecture-design                           | 2026-02 |
| FN   | from-notes-to-plugin                                         | 2026-02 |
| JE   | js-eyes-openclaw-plugin-guide                                | 2026-02 |
| PG   | openclaw-permissions-guide                                   | 2026-03 |
| LC   | link-collector-skill-dev                                     | 2026-03 |
| SP   | openclaw-security-permissions-guide                          | 2026-03 |
| KC   | js-knowledge-collector-plugin-dev                            | 2026-03 |
| AU   | agent-first-architecture-upgrade                             | 2026-03 |
| RC   | multi-base-registry-and-cron                                 | 2026-03 |
| KP   | knowledge-prism-introduction                                 | 2026-02 |
| PC   | plugin-creation-guide                                        | 2026-02 |
| UP   | using-knowledge-prism-plugin                                 | 2026-02 |
| CH   | clawhub-publish-guide                                        | 2026-02 |
| AF   | js-eyes-agent-first-transformation                           | 2026-02 |
| SD   | skill-discovery-system-design-and-implementation             | 2026-02 |
| OP   | workspace-path-openclaw-state-dir-mismatch                   | 2026-02 |
| EX   | exec-approvals-curl-pipe-bash-blocked                        | 2026-02 |
| PS   | permission-settings-guide                                    | 2026-02 |
| JS   | js-eyes-install-script-fix                                   | 2026-02 |
| MC   | memory-core-research-and-implementation-log                  | 2026-02 |
| GV   | gateway-upgrade-verification                                 | 2026-03 |
| JC   | js-clawhub-project-creation                                  | 2026-02 |
| JK   | js-knowledge-collector-project-creation                      | 2026-03 |
| CB   | clawhub-blog-auto-sync-cron                                  | 2026-03 |
| JU   | js-clawhub-openclaw-plugin-upgrade                           | 2026-03 |
| JP   | js-knowledge-prism-project-creation                          | 2026-02 |
| KB   | knowledge-memory-bridge                                      | 2026-03 |
| PB   | prism-memory-bridge                                          | 2026-03 |
| MH   | memory-core-embedding-hardware-qa                            | 2026-03 |
| JG   | js-knowledge-prism-3d-graph-upgrade                          | 2026-03 |
| JO   | js-knowledge-prism-auto-output-cron                          | 2026-03 |
| OC   | js-knowledge-prism-output-cron-reliability                   | 2026-03 |
| PT   | js-knowledge-prism-prism-template-author-skill               | 2026-03 |
| JD   | js-knowledge-prism-draft-fix-process-today                   | 2026-03 |
| RW   | js-knowledge-prism-rewrite-feature-design-and-implementation | 2026-03 |
| EP   | js-eyes-project-creation                                     | 2026-01 |
| JR   | js-knowledge-prism-klstrategy-refactor                       | 2026-03 |
| OM   | merge-main-resolve-by-main                                   | 2026-03 |
| OS   | openclaw-security-architecture-guide                         | 2026-03 |
| JA   | js-cursor-agent-project-creation                             | 2026-03 |
| FK   | feishu-knowledge-base-monetization                           | 2026-03 |
| JV   | js-vi-system-project-creation                                | 2026-03 |
| JW   | js-vi-system-wechat-official-account-cover                   | 2026-03 |

> 注：以下缩写来自 js-knowledge-prism 仓库合并，与本库已有缩写存在复用：
>
> - `KP`（knowledge-prism-introduction）：本库 2026-02 已有同名 journal，合并的 2026-03 版本使用相同缩写
> - `AF`（agent-first-architecture）：本库 2026-02 已将 AF 分配给 js-eyes-agent-first-transformation，合并的 2026-03 版本中 agent-first-architecture 也使用 AF，两者通过月份目录区分

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

| 编号  | 类型                | 内容               | 原文定位         |
| ----- | ------------------- | ------------------ | ---------------- |
| XX-01 | 事实/步骤/经验/判断 | 信息单元的简明描述 | 章节名或行号范围 |
| XX-02 | ...                 | ...                | ...              |
```
