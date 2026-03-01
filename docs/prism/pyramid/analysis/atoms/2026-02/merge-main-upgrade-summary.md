# OpenClaw Main 分支合并升级总结

> 来源：[../../../../journal/2026-02-22/merge-main-upgrade-summary.md](../../../../journal/2026-02-22/merge-main-upgrade-summary.md)
> 缩写：MU

## Atoms

| 编号  | 类型 | 内容                                                                                                                                             | 原文定位               |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| MU-01 | 事实 | 本次合并涵盖 origin/main 约 3600+ 提交，横跨安全加固、功能新增、架构重构、测试优化和性能改进五大领域                                             | 文档头部               |
| MU-02 | 事实 | 路径遍历/符号链接防护覆盖四个攻击面：archive 提取（zip 符号链接逃逸）、avatar 上传、control UI 静态资源、sandbox 临时媒体                        | 1.1 路径遍历           |
| MU-03 | 事实 | 身份认证加固采用 fail-closed 策略：未认证路由发现默认拒绝、rate-limit IP 标准化（IPv4/IPv6 统一）、OAuth state 防 CSRF、严格 allowlist           | 1.2 身份认证与授权     |
| MU-04 | 事实 | Shell/Exec 安全四层防御：login-shell 路径合法性校验、macOS path-only 匹配、持久化内部可执行文件路径（非 wrapper shell）、阻止未引用 heredoc 展开 | 1.3 Shell/Exec 安全    |
| MU-05 | 事实 | 新增 `openclaw security audit` 检测危险配置；SSRF 扩展至全部 RFC 特殊用途地址段；原型污染防护；SHA1→SHA256 迁移                                  | 1.4 其他安全审计       |
| MU-06 | 事实 | 新增 Gemini 3.1、Anthropic Sonnet 4.6（1M 上下文）、Volcengine/Byteplus 等 provider；通用 API key 轮换；模型 fallback 全链路可见                 | 2.1 模型与 Provider    |
| MU-07 | 事实 | 新增 Synology Chat 渠道；Discord 线程子代理/forum 标签/ephemeral slash；Telegram forum 主题/reactions/bot-to-bot                                 | 2.2 渠道               |
| MU-08 | 事实 | Agent 工具增强：可配置循环检测、/export-session、压缩后审计（L3）、workspace rules 注入压缩摘要、skills Use when/Don't use when 路由块           | 2.3 Agent 与工具       |
| MU-09 | 事实 | 搜索增强：韩语粒子感知关键词提取、MMR 重排序提升多样性、混合搜索时间衰减因子、QMD mcporter keep-alive 减少冷启动                                 | 2.4 Memory / 搜索      |
| MU-10 | 事实 | 100+ refactor 提交：提取共享 tool-policy/CLI/Channel/Config/Security helpers，集中化日志迁移到子系统 logger                                      | 3.1 代码去重与模块化   |
| MU-11 | 事实 | 类型提取模式：内联 schema 提取到独立模块（ExecToolDefaults → exec-types.ts），配置解析支持 agent 级覆盖（agentExec ?? globalExec）               | 3.2 类型提取           |
| MU-12 | 事实 | 测试改动量最大（2000+ 提交），核心模式为 lightweight clears 替换重量级 mock reset，覆盖几乎所有模块                                              | 4.1 Lightweight Clears |
| MU-13 | 经验 | 测试性能优化模式：批量 fake-timer advance 替代逐次推进、expect.poll 替代固定延时、并行化 unit-isolated 测试、Vitest worker split 调优            | 4.3 性能优化           |
| MU-14 | 经验 | 5 个冲突文件均采纳 main 版本；githubforker 的 shell/shellArgs 功能被覆盖，需基于 main 当前架构重新实现                                           | 6. 冲突解决说明        |
| MU-15 | 事实 | Breaking：channel preview streaming 枚举化（off\|partial\|block\|progress），旧配置通过 `openclaw doctor --fix` 自动迁移                         | 7. Breaking Changes    |
| MU-16 | 事实 | 基础设施加固：Docker 镜像固定 SHA256 摘要、构建步骤 node 用户运行、E2E/install 测试非 root 运行                                                  | 8. 依赖与基础设施      |
