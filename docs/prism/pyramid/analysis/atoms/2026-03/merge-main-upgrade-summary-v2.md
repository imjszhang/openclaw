# OpenClaw Main 分支合并升级总结（第三轮）

> 来源：[../../../../journal/2026-03-08/merge-main-upgrade-summary.md](../../../../journal/2026-03-08/merge-main-upgrade-summary.md)
> 缩写：MV

## Atoms

| 编号  | 类型 | 内容                                                                                                                                   | 原文定位                 |
| ----- | ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| MV-01 | 事实 | 本次合并将 origin/main (389647157) 合并到 githubforker 分支，涵盖约 714 个上游提交，零冲突                                             | 合并过程记录             |
| MV-02 | 经验 | 高频合并（4 天间隔）将冲突数从 1 降到 0，验证"小步快走"策略在 fork 管理中的收益                                                        | 与上次合并的对比         |
| MV-03 | 判断 | fork 与 main 的实际代码差异已收窄为 15 个文件 949 行（排除 docs/prism 和 extensions），Telegram HTML 和 Moonshot Kimi 定制被上游吸收   | Fork 核心改动验证        |
| MV-04 | 事实 | 新增 ContextEngine 插件接口，完整生命周期钩子覆盖 bootstrap→ingest→assemble→compact→afterTurn→subagent，支持第三方替换 compaction 策略 | 新功能 > 核心架构        |
| MV-05 | 事实 | ACP 持久化渠道绑定使 Discord/Telegram 的 thread/topic 绑定存储持久化，重启后路由保持                                                   | 新功能 > 核心架构        |
| MV-06 | 事实 | Docker 多阶段构建重构 + `OPENCLAW_VARIANT=slim` 支持最小化运行时镜像                                                                   | 新功能 > 核心架构        |
| MV-07 | 事实 | Google Gemini 3.1 Flash-Lite 和 OpenAI GPT-5.4 获得全链路支持                                                                          | 新功能 > 模型与 Provider |
| MV-08 | 事实 | 2026.3.7 唯一 Breaking Change：当 token 和 password 同时配置时必须显式指定 `gateway.auth.mode`                                         | Breaking Changes         |
| MV-09 | 事实 | Config loadConfig 改为 fail-closed，配置验证/读取错误不再静默回退到宽松默认值                                                          | 安全加固 > 配置安全      |
| MV-10 | 事实 | system.run 审批链加固：dispatch-wrapper 边界阻断 env 包装栈、PowerShell -EncodedCommand 识别、shell 注释尾部不持久化                   | 安全加固 > 执行安全      |
| MV-11 | 事实 | outbound 投递引入两阶段 ACK 标记（.json → .delivered → unlink）防止崩溃窗口重放                                                        | 安全加固 > Gateway       |
| MV-12 | 事实 | Telegram 经历大规模重构：bot-message-context 拆分为子模块，新增 conversation-route、lane-delivery-state、thread-bindings 等            | 重要架构变化             |
| MV-13 | 事实 | Plugin SDK scoped imports 全面完成，bundled plugin 迁移到 `openclaw/plugin-sdk/core` 等子路径                                          | 重要架构变化             |
| MV-14 | 事实 | Telegram DM draft streaming 全链路重构涵盖 preview 边界、最终投递可靠性、重复消息抑制多个维度                                          | Bug 修复 > Telegram      |
| MV-15 | 事实 | Discord 大量修复包括 DM session-key 规范化、native slash auth、inbound 非阻塞 dispatch、voice decoder 移除 native opus                 | Bug 修复 > Discord       |
| MV-16 | 事实 | Memory/QMD 修复涵盖 search 结果解码、collection 冲突恢复、duplicate-document 恢复、SQLite busy_timeout 重应用                          | Bug 修复 > Memory        |
| MV-17 | 经验 | 上轮 MU-13 判断"无新增 Breaking Change"在本轮需修正——2026.3.7 引入了 gateway.auth.mode 强制要求                                        | 与上次合并的对比         |
| MV-18 | 事实 | fix 类型占 714 个提交中的 296 个（41.5%），refactor 占 154 个（21.6%），说明项目处于密集稳定化和代码质量提升阶段                       | 提交类型分布             |
| MV-19 | 事实 | LINE 渠道经历 auth/media/routing 大规模合成修复，跨越多个 PR 整合                                                                      | Bug 修复 > LINE          |
| MV-20 | 事实 | Mattermost 新增交互按钮和 model picker，从基础渠道升级为功能更完整的集成                                                               | 新功能 > 渠道            |
