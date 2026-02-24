# G12: 消息渠道部署需遵循“先决条件确认 - 差异化配置 - 状态验证”的标准化流程

> 不同渠道的接入复杂度差异巨大，必须严格区分 Token 型、扫码型和协议型渠道的特定配置陷阱，并统一通过状态命令验证闭环。

## 包含的 Atoms

| 编号  | 来源                     | 内容摘要                                                                                             |
| ----- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| CD-01 | channel-deployment-guide | OpenClaw 支持多种消息渠道：Telegram、WhatsApp、Discord、Signal、飞书/Lark、Slack、iMessage           |
| CD-02 | channel-deployment-guide | Telegram 是最简单的渠道，只需 BotFather token，推荐作为首个部署渠道                                  |
| CD-03 | channel-deployment-guide | 多个渠道可以同时启用，OpenClaw 会根据消息来源自动路由回复                                            |
| CD-04 | channel-deployment-guide | 配置渠道前需确认三件事：Gateway 已配置、AI 模型已配置、Gateway 已启动                                |
| CD-05 | channel-deployment-guide | Telegram 创建 Bot：搜索@BotFather → 发送/newbot → 输入名称和用户名 → 复制 Token                      |
| CD-06 | channel-deployment-guide | Telegram 配置命令：`pnpm openclaw config set channels.telegram.botToken "token"`                     |
| CD-07 | channel-deployment-guide | Telegram 群组消息需禁用 Privacy Mode（BotFather → /setprivacy → Disable），否则收不到群组消息        |
| CD-08 | channel-deployment-guide | WhatsApp 需要真实手机号，VoIP 和虚拟号码通常会被封禁                                                 |
| CD-09 | channel-deployment-guide | WhatsApp 推荐方案：备用手机+eSIM 或 WhatsApp Business，避免使用 TextNow、Google Voice 等虚拟号码     |
| CD-10 | channel-deployment-guide | WhatsApp 扫码登录：`pnpm openclaw channels login` → 手机设置 → 已关联设备 → 扫描二维码               |
| CD-11 | channel-deployment-guide | WhatsApp selfChatMode 允许给自己发消息测试，回复会自动添加前缀区分                                   |
| CD-12 | channel-deployment-guide | Discord 创建 Bot 需启用 Message Content Intent 才能读取消息内容                                      |
| CD-13 | channel-deployment-guide | Signal 需先安装 signal-cli：macOS 用`brew install signal-cli`，Linux 需手动下载解压                  |
| CD-14 | channel-deployment-guide | 飞书/Lark 插件内置文档、知识库、云盘工具集成，除基础消息外可扩展企业协作能力                         |
| CD-15 | channel-deployment-guide | 飞书应用必需权限：im:message、im:message:send_as_bot、im:message:readonly、im:chat 等                |
| CD-16 | channel-deployment-guide | 飞书事件订阅推荐使用 WebSocket 方式，无需公网地址；Webhook 需要公网可访问 URL                        |
| CD-17 | channel-deployment-guide | 飞书必需订阅事件：im.message.receive_v1（接收消息）                                                  |
| CD-18 | channel-deployment-guide | 飞书配置命令：`pnpm openclaw config set channels.feishu.appId "cli_xxx"`                             |
| CD-19 | channel-deployment-guide | 飞书 domain 配置："feishu" 对应中国区 (open.feishu.cn)，"lark" 对应国际版 (open.larksuite.com)       |
| CD-20 | channel-deployment-guide | 飞书 wiki 工具依赖 doc 工具（知识库内容通过文档工具编辑），perm 工具涉及敏感权限操作默认关闭         |
| CD-21 | channel-deployment-guide | DM 策略有四种：pairing（需手动批准）、allowlist（白名单）、open（公开）、disabled（禁用）            |
| CD-22 | channel-deployment-guide | 配对码有效期为 1 小时，超时需重新发起                                                                |
| CD-23 | channel-deployment-guide | 不同渠道的 allowFrom 格式不同：Telegram 用用户 ID、WhatsApp 用 E.164 手机号、飞书用 open_id          |
| CD-24 | channel-deployment-guide | 飞书群组默认需要@机器人（requireMention: true），如需始终响应需设置 requireMention: false            |
| CD-25 | channel-deployment-guide | 状态检查命令：`pnpm openclaw channels status`、`pnpm openclaw logs --follow`、`pnpm openclaw health` |
| CD-26 | channel-deployment-guide | 某些服务器 IPv6 路由有问题，可在/etc/hosts 中强制使用 IPv4 解决 Telegram 连接问题                    |

## 组内逻辑顺序

按照“前置依赖确认 → 渠道分类配置（简单 Token 型/复杂扫码型/企业协议型）→ 通用安全策略（DM/白名单）→ 故障排查与验证”的结构顺序排列。
