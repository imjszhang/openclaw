# G09: 代码库规模化演进的重构模式：共享 helper 去重 + 类型提取到独立模块

> 当代码库膨胀到一定规模，去重和类型提取是降低维护成本的两大核心手段——前者减少横向重复，后者将隐式约束显式化并支持多级配置覆盖。

## 包含的 Atoms

| 编号  | 来源                          | 内容摘要                                                                |
| ----- | ----------------------------- | ----------------------------------------------------------------------- |
| MU-10 | merge-main-upgrade-summary    | 100+ refactor 提交：提取共享 helpers，集中化日志迁移到子系统 logger     |
| MU-11 | merge-main-upgrade-summary    | 类型提取：内联 schema → 独立模块，配置支持 agent 级覆盖                 |
| MV-12 | merge-main-upgrade-summary-v2 | Telegram bot-message-context 拆分为子模块 + conversation-route 等新文件 |
| MV-13 | merge-main-upgrade-summary-v2 | Plugin SDK scoped imports 全面完成，bundled plugin 迁移到子路径         |
| MV-18 | merge-main-upgrade-summary-v2 | 714 个提交中 refactor 占 154 个（21.6%），项目处于密集代码质量提升阶段  |

## 组内逻辑顺序

程度顺序：先宏观去重（跨模块提取共享 helpers，MU-10），再微观类型提取（模块内 schema 独立化 + 配置分层，MU-11），再到大型模块拆分重构（Telegram 子模块化 MV-12，Plugin SDK 路径迁移 MV-13），最后是规模化趋势指标（MV-18）。从广度到深度再到趋势。
