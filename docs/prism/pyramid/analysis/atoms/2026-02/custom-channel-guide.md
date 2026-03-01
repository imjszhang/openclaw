# OpenClaw 自定义 Channel 开发指南

> 来源：[../../../../journal/2026-02-01/custom-channel-guide.md](../../../../journal/2026-02-01/custom-channel-guide.md)
> 缩写：CC

## Atoms

| 编号  | 类型 | 内容                                                                                                     | 原文定位                 |
| ----- | ---- | -------------------------------------------------------------------------------------------------------- | ------------------------ |
| CC-01 | 事实 | Channel 是 OpenClaw 中消息来源和目标的抽象，代表一种消息平台（如 Telegram、WhatsApp、Discord 等）        | 1.1 什么是 Channel       |
| CC-02 | 事实 | Channel 插件需处理五大职责：消息接收、消息发送、配置管理、状态检查、访问控制                             | 1.2 Channel 的职责       |
| CC-03 | 判断 | 实现方式分两种：核心 Channel（内置源码）和插件 Channel（extensions 目录），推荐插件方式                  | 2.1 两种实现方式         |
| CC-04 | 经验 | 个人/团队内部使用、开源贡献、实验性功能验证均推荐插件方式，官方主流平台用核心方式                        | 2.2 选择建议             |
| CC-05 | 事实 | 标准插件目录结构：index.ts 入口、openclaw.plugin.json 清单、package.json 配置、src/源码目录              | 3.1 标准目录结构         |
| CC-06 | 事实 | openclaw.plugin.json 必需字段：id（插件标识）、channels（注册 Channel ID 列表）、configSchema            | 3.2 插件清单             |
| CC-07 | 经验 | package.json 中 openclaw 必须用 peerDependencies 而非 dependencies，运行时依赖放 dependencies            | 3.3 包配置               |
| CC-08 | 事实 | ChannelPlugin 主类型包含 id、meta、capabilities、defaults、reload 及 19 个可选/必需适配器                | 4.1 ChannelPlugin 主类型 |
| CC-09 | 事实 | ChannelMeta 元数据包含 id、label、selectionLabel、docsPath、blurb、order、aliases 等 14 个字段           | 4.2 ChannelMeta 元数据   |
| CC-10 | 事实 | ChannelCapabilities 能力声明包含 chatTypes、polls、reactions、edit、unsend、reply、media 等              | 4.3 ChannelCapabilities  |
| CC-11 | 事实 | config 适配器是唯一必须实现的适配器，负责 listAccountIds、resolveAccount 等配置管理                      | 5.1 config 适配器        |
| CC-12 | 步骤 | config 适配器实现示例：listAccountIds 从 cfg.channels.mychannel.accounts 提取键名                        | 5.1 config 适配器实现    |
| CC-13 | 事实 | outbound 适配器 deliveryMode 分三种：direct（直接）、gateway（通过网关）、hybrid（混合）                 | 5.2 outbound 适配器      |
| CC-14 | 步骤 | outbound 适配器推荐实现 sendText 和 sendMedia 方法，返回 OutboundDeliveryResult                          | 5.2 outbound 适配器实现  |
| CC-15 | 事实 | security 适配器处理 DM 策略（resolveDmPolicy）和收集安全警告（collectWarnings）                          | 6.1 security 适配器      |
| CC-16 | 事实 | gateway 适配器负责 startAccount（启动监听）、stopAccount（停止）、loginWithQrStart/Wait（扫码）          | 6.2 gateway 适配器       |
| CC-17 | 步骤 | gateway 适配器 startAccount 需处理 abortSignal 监听中断，调用 setStatus 更新状态                         | 6.2 gateway 适配器实现   |
| CC-18 | 事实 | status 适配器提供 defaultRuntime、buildChannelSummary、probeAccount、auditAccount 等状态检查             | 6.3 status 适配器        |
| CC-19 | 步骤 | pairing 适配器需实现 idLabel（CLI 提示用）、normalizeAllowEntry、notifyApproval（通知配对批准）          | 6.4 pairing 适配器       |
| CC-20 | 事实 | 其他可选适配器共 13 个：onboarding、groups、mentions、threading、streaming、messaging 等                 | 6.6 其他适配器           |
| CC-21 | 事实 | 最小实现只需 meta、capabilities、config（listAccountIds、resolveAccount、isConfigured）、outbound        | 7.1 最小实现             |
| CC-22 | 判断 | 参考现有实现复杂度：Telegram/Discord 简单（Bot API）、WhatsApp/Signal 中等、Matrix 复杂                  | 7.2 完整功能实现         |
| CC-23 | 事实 | 基础配置位于 channels.<id>，支持 enabled、token、dmPolicy、allowFrom 等字段                              | 8.1 基础配置             |
| CC-24 | 事实 | 多账户配置通过 channels.<id>.accounts 实现，每个账户可覆盖顶层配置                                       | 8.2 多账户配置           |
| CC-25 | 事实 | DM 策略四种：pairing（需批准）、allowlist（白名单）、open（公开）、disabled（禁用）                      | 8.4 DM 策略选项          |
| CC-26 | 事实 | 插件发现顺序（高到低）：配置 paths、工作区 extensions、全局 extensions、内置 extensions                  | 9.1 发现顺序             |
| CC-27 | 步骤 | 启用内置插件命令：`pnpm openclaw plugins enable <id>` 或在配置 plugins.entries 中设置 enabled            | 9.2 启用插件             |
| CC-28 | 步骤 | 测试调试命令：plugins list/diagnose、channels status/probe、logs --follow、doctor、health                | 10.1-10.5 测试与调试     |
| CC-29 | 经验 | 插件未被发现检查四点：openclaw.plugin.json 存在、package.json 有 openclaw.extensions、权限、diagnose     | 11.1 插件未被发现        |
| CC-30 | 经验 | 配对不工作检查三点：security.resolveDmPolicy 返回正确 policy、pairing.notifyApproval 实现、dmPolicy 配置 | 11.5 配对不工作          |
