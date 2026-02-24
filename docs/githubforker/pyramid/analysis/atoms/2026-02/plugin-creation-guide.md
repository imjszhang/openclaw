# OpenClaw 插件创建完全指引

> 来源：[../../../../journal/2026-02-25/plugin-creation-guide.md](../../../../journal/2026-02-25/plugin-creation-guide.md)
> 缩写：PC

## Atoms

| 编号  | 类型 | 内容                                                                                                       | 原文定位                     |
| ----- | ---- | ---------------------------------------------------------------------------------------------------------- | ---------------------------- |
| PC-01 | 事实 | OpenClaw 插件系统由 loader.ts 协调，包含 discovery、manifest-registry、registry、config-state 四个核心模块 | 插件系统全景                 |
| PC-02 | 事实 | 动态加载器使用 jiti 直接加载 TypeScript 文件，无需预编译步骤                                               | 插件系统全景                 |
| PC-03 | 事实 | 插件架构分为两层：编译时稳定的 Plugin SDK 和运行时注入的 Plugin Runtime                                    | 核心概念：两层架构           |
| PC-04 | 经验 | 开发者只能导入 openclaw/plugin-sdk，严禁直接导入 src 内部模块，运行时能力需通过 api.runtime 获取           | 核心概念：两层架构           |
| PC-05 | 事实 | 插件发现按优先级扫描四个来源：config 指定路径、workspace 扩展、global 扩展、bundled 内置扩展               | 插件的一生：从发现到运行     |
| PC-06 | 事实 | 系统识别三种插件形式：含 openclaw.plugin.json 的包目录、顶层脚本文件、含 openclaw.extensions 字段的 npm 包 | 插件的一生：从发现到运行     |
| PC-07 | 步骤 | 插件加载流程包含验证清单、检查 ID 冲突、判定启用状态、安全检查、配置校验、jiti 加载、调用 register 等十步  | 插件的一生：从发现到运行     |
| PC-08 | 事实 | 插件模块导出支持三种形式：默认导出函数、含 register 方法的对象、含 activate 方法的对象                     | 插件的一生：从发现到运行     |
| PC-09 | 步骤 | 创建插件需建立目录结构，包含必需的 openclaw.plugin.json 清单文件和 index.ts 入口文件                       | 动手创建：五步走             |
| PC-10 | 事实 | 插件清单中 id 字段为全局唯一标识符且必需，configSchema 推荐用于配置校验                                    | 动手创建：五步走             |
| PC-11 | 步骤 | 非 bundled 来源的插件需在 config.yaml 的 plugins.entries 中显式设置 enabled: true 才能启用                 | 动手创建：五步走             |
| PC-12 | 事实 | registerTool 支持静态工具定义和基于上下文的工厂模式，optional 为 true 时失败不阻断加载                     | 十大注册能力详解             |
| PC-13 | 事实 | registerChannel 是最复杂的注册类型，需实现 ChannelPlugin 接口的多个适配器                                  | 十大注册能力详解             |
| PC-14 | 事实 | registerProvider 支持 api_key、oauth、token、device_code、custom 五种认证类型                              | 十大注册能力详解             |
| PC-15 | 经验 | 注册 Hook 推荐使用 api.on() 方法而非 api.registerHook()，以获得完整的类型推导支持                          | 十大注册能力详解             |
| PC-16 | 事实 | registerCommand 注册的斜杠命令优先级高于内置命令和 Agent 调用，且可要求发送者认证                          | 十大注册能力详解             |
| PC-17 | 事实 | registerHttpHandler 通过返回 true/false 控制是否消费请求，比 registerHttpRoute 更灵活                      | 十大注册能力详解             |
| PC-18 | 事实 | registerService 注册的后台服务在 Gateway 启动时拉起，关闭时销毁                                            | 十大注册能力详解             |
| PC-19 | 事实 | Hook 系统包含 22 个生命周期切面，分为只读 Hook 和可通过返回值修改行为的可写 Hook                           | Hook 系统：22 个生命周期切面 |
| PC-20 | 事实 | before_tool_call 是可写 Hook，可修改参数或通过 block: true 阻止工具执行                                    | Hook 系统：22 个生命周期切面 |
| PC-21 | 事实 | message_sending 是可写 Hook，允许修改回复内容或设置 cancel: true 取消发送                                  | Hook 系统：22 个生命周期切面 |
| PC-22 | 事实 | subagent_spawning 是可写 Hook，返回 status: "error" 可阻止子 Agent 创建                                    | Hook 系统：22 个生命周期切面 |
| PC-23 | 事实 | 六种插件类型中，仅 Memory 插件需要在清单中设置 kind: "memory" 以参与槽位机制                               | 六种插件类型对照             |
| PC-24 | 事实 | 单个插件可同时注册多种能力（如工具、CLI、HTTP、服务），voice-call 插件即为综合案例                         | 六种插件类型对照             |
| PC-25 | 事实 | 配置验证在加载时进行，若 entries 中的 config 不匹配清单定义的 JSON Schema 将阻止插件加载                   | 配置体系                     |
| PC-26 | 事实 | uiHints 中的 sensitive 字段指示 UI 将配置项渲染为密码输入框，advanced 字段指示折叠到高级区域               | 配置体系                     |
| PC-27 | 判断 | 启用状态判定优先级最高的是全局 plugins.enabled 开关，其次是 deny 黑名单和 allow 白名单                     | 启用状态判定规则             |
| PC-28 | 事实 | 同一时刻只有一个 memory 插件被选中，通过 resolveMemorySlotDecision 机制竞争槽位                            | 启用状态判定规则             |
| PC-29 | 事实 | 内置插件默认启用列表仅包含 device-pair、phone-control、talk-voice 三个                                     | 启用状态判定规则             |
| PC-30 | 经验 | 安全机制会拒绝世界可写路径（mode & 0o002）并验证文件所有者与进程 UID 一致                                  | 安全机制                     |
| PC-31 | 经验 | 非 bundled 插件若未在 installs 或 load.paths 中记录，系统会触发安全警告                                    | 安全机制                     |
| PC-32 | 步骤 | 使用 openclaw plugins list 查看已加载插件，使用 validate 命令验证配置                                      | 调试与运维                   |
| PC-33 | 经验 | Vitest 测试环境下插件系统默认禁用，需在测试配置中显式设置 plugins.enabled: true                            | 调试与运维                   |
| PC-34 | 经验 | 入门学习推荐参考 extensions/llm-task/（最简单工具插件），进阶参考 extensions/twitch/（通道插件）           | 实战参考：内置插件索引       |
| PC-35 | 事实 | api.pluginConfig 获取本插件专属配置，api.config 获取全局 OpenClaw 配置                                     | 附：API 速查卡               |
| PC-36 | 事实 | api.resolvePath(input) 用于解析插件内的相对路径                                                            | 附：API 速查卡               |
