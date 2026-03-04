# OpenClaw Main 分支合并升级总结

> 来源：[../../../../journal/2026-03-04/merge-main-upgrade-summary.md](../../../../journal/2026-03-04/merge-main-upgrade-summary.md)
> 缩写：MU

## Atoms

| 编号  | 类型 | 内容                                                                                                 | 原文定位                       |
| ----- | ---- | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| MU-01 | 事实 | 本次合并将 origin/main (a95a0be13) 合并到 githubforker 分支，涵盖约 2184 个上游提交                  | 文档头部                       |
| MU-02 | 步骤 | 解决 pnpm-lock.yaml 冲突时需保留 fork 特有的 extensions/js-knowledge-prism 块及 devDependencies 格式 | 冲突解决                       |
| MU-03 | 经验 | 当合并涉及文件数超过系统参数列表限制时，git commit 需使用 --no-verify 跳过 pre-commit hook           | 提交                           |
| MU-04 | 事实 | Fork 核心改动包括 PowerShell 7 优先探测、resolvePowerShellPath 导出及 getShellConfig 支持 overrides  | Fork 核心改动验证              |
| MU-05 | 事实 | Telegram 论坛群组支持 per-topic agent 路由，实现群内多 Agent 隔离                                    | 新功能 > 渠道                  |
| MU-06 | 事实 | 工具输出截断策略改为 head+tail 模式，防止错误信息被完全丢失                                          | 新功能 > 工具与 Agent          |
| MU-07 | 事实 | ACP (Agent Control Plane) dispatch 模式在本次升级中默认启用                                          | 新功能 > 工具与 Agent          |
| MU-08 | 事实 | Memory 模块新增 Ollama 本地向量嵌入提供商支持                                                        | 新功能 > 模型与 Provider       |
| MU-09 | 事实 | Host 模式 exec 前会清理继承的基础环境变量 (sanitizeHostBaseEnv) 以防止敏感变量泄漏                   | 安全加固 > 执行安全            |
| MU-10 | 事实 | Gateway 默认安全响应头新增 Permissions-Policy 以限制摄像头、麦克风等权限                             | 安全加固 > Gateway 与网络      |
| MU-11 | 事实 | 修复了 sessions_spawn attachment schema 校验过严导致 llama.cpp GBNF 溢出的问题                       | Bug 修复 > Gateway / Session   |
| MU-12 | 事实 | Plugin SDK 重构将 bundled plugin 迁移至新 channel subpaths 路径方案                                  | 重要架构变化 > Plugin SDK 重构 |
| MU-13 | 判断 | 本轮升级无新增 Breaking Change，但需关注 Node v22.12+ 的强制版本要求                                 | Breaking Changes               |
| MU-14 | 事实 | Discord 音频依赖移除 opus 包，改用内部 ffmpeg 路径                                                   | Breaking Changes               |
| MU-15 | 事实 | 2026.3.2 版本 Onboarding 新本地安装默认 tools.profile 设为 messaging，不再默认开启 coding 工具       | 官方 CHANGELOG > 2026.3.2      |
| MU-16 | 事实 | Plugin SDK 移除 api.registerHttpHandler，必须改用 api.registerHttpRoute 注册 HTTP 路由               | 官方 CHANGELOG > 2026.3.2      |
| MU-17 | 步骤 | Zalo Personal plugin 升级后需执行 openclaw channels login --channel zalouser 刷新 session            | 官方 CHANGELOG > 2026.3.2      |
| MU-18 | 事实 | 新增 pdf 一级工具，原生支持 Anthropic/Google PDF provider                                            | 官方 CHANGELOG > 2026.3.2      |
| MU-19 | 事实 | channels.telegram.streaming 默认值从 off 改为 partial，新部署开箱即用流式预览                        | 官方 CHANGELOG > 2026.3.2      |
| MU-20 | 事实 | 新增 openclaw config validate 命令，支持在 gateway 启动前验证配置文件                                | 官方 CHANGELOG > 2026.3.2      |
