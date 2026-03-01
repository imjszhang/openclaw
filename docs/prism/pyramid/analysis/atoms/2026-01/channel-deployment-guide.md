# OpenClaw 消息渠道部署指南

> 来源：[../../../../journal/2026-01-31/channel-deployment-guide.md](../../../../journal/2026-01-31/channel-deployment-guide.md)
> 缩写：CD

## Atoms

| 编号  | 类型 | 内容                                                                                                 | 原文定位             |
| ----- | ---- | ---------------------------------------------------------------------------------------------------- | -------------------- |
| CD-01 | 事实 | OpenClaw 支持多种消息渠道：Telegram、WhatsApp、Discord、Signal、飞书/Lark、Slack、iMessage           | 2. 渠道概览          |
| CD-02 | 经验 | Telegram 是最简单的渠道，只需 BotFather token，推荐作为首个部署渠道                                  | 2.2 推荐顺序         |
| CD-03 | 事实 | 多个渠道可以同时启用，OpenClaw 会根据消息来源自动路由回复                                            | 2.3 渠道可以同时运行 |
| CD-04 | 步骤 | 配置渠道前需确认三件事：Gateway 已配置、AI 模型已配置、Gateway 已启动                                | 1. 前提条件          |
| CD-05 | 步骤 | Telegram 创建 Bot：搜索@BotFather → 发送/newbot → 输入名称和用户名 → 复制 Token                      | 3.1 创建 Bot         |
| CD-06 | 步骤 | Telegram 配置命令：`pnpm openclaw config set channels.telegram.botToken "token"`                     | 3.2 配置 Token       |
| CD-07 | 经验 | Telegram 群组消息需禁用 Privacy Mode（BotFather → /setprivacy → Disable），否则收不到群组消息        | 10.2 常见问题        |
| CD-08 | 事实 | WhatsApp 需要真实手机号，VoIP 和虚拟号码通常会被封禁                                                 | 4.1 手机号要求       |
| CD-09 | 经验 | WhatsApp 推荐方案：备用手机+eSIM 或 WhatsApp Business，避免使用 TextNow、Google Voice 等虚拟号码     | 4.1 手机号要求       |
| CD-10 | 步骤 | WhatsApp 扫码登录：`pnpm openclaw channels login` → 手机设置 → 已关联设备 → 扫描二维码               | 4.3 扫码登录         |
| CD-11 | 事实 | WhatsApp selfChatMode 允许给自己发消息测试，回复会自动添加前缀区分                                   | 4.5 个人号码模式     |
| CD-12 | 步骤 | Discord 创建 Bot 需启用 Message Content Intent 才能读取消息内容                                      | 5.2 配置 Bot 权限    |
| CD-13 | 步骤 | Signal 需先安装 signal-cli：macOS 用`brew install signal-cli`，Linux 需手动下载解压                  | 6.1 安装 signal-cli  |
| CD-14 | 事实 | 飞书/Lark 插件内置文档、知识库、云盘工具集成，除基础消息外可扩展企业协作能力                         | 7. 飞书/Lark 部署    |
| CD-15 | 步骤 | 飞书应用必需权限：im:message、im:message:send_as_bot、im:message:readonly、im:chat 等                | 7.2 配置应用权限     |
| CD-16 | 经验 | 飞书事件订阅推荐使用 WebSocket 方式，无需公网地址；Webhook 需要公网可访问 URL                        | 7.3 配置事件订阅     |
| CD-17 | 事实 | 飞书必需订阅事件：im.message.receive_v1（接收消息）                                                  | 7.3 配置事件订阅     |
| CD-18 | 步骤 | 飞书配置命令：`pnpm openclaw config set channels.feishu.appId "cli_xxx"`                             | 7.6 配置 OpenClaw    |
| CD-19 | 事实 | 飞书 domain 配置："feishu" 对应中国区(open.feishu.cn)，"lark" 对应国际版(open.larksuite.com)         | 7.7 域名选择         |
| CD-20 | 经验 | 飞书 wiki 工具依赖 doc 工具（知识库内容通过文档工具编辑），perm 工具涉及敏感权限操作默认关闭         | 7.13 工具集成配置    |
| CD-21 | 事实 | DM 策略有四种：pairing（需手动批准）、allowlist（白名单）、open（公开）、disabled（禁用）            | 9.1 DM 策略选项      |
| CD-22 | 经验 | 配对码有效期为 1 小时，超时需重新发起                                                                | 9.2 配对流程         |
| CD-23 | 事实 | 不同渠道的 allowFrom 格式不同：Telegram 用用户 ID、WhatsApp 用 E.164 手机号、飞书用 open_id          | 9.3 allowFrom 格式   |
| CD-24 | 经验 | 飞书群组默认需要@机器人（requireMention: true），如需始终响应需设置 requireMention: false            | 7.11 群组配置        |
| CD-25 | 步骤 | 状态检查命令：`pnpm openclaw channels status`、`pnpm openclaw logs --follow`、`pnpm openclaw health` | 10.1 状态检查命令    |
| CD-26 | 经验 | 某些服务器 IPv6 路由有问题，可在/etc/hosts 中强制使用 IPv4 解决 Telegram 连接问题                    | 10.2 网络问题        |
