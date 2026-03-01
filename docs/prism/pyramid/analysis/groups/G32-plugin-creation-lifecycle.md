# G32: OpenClaw 插件创建需遵循"SDK 隔离 + 清单驱动 + 安全加载”的全生命周期规范

> 插件开发必须严格依赖官方 SDK 而非内部模块，通过标准化的清单声明与安全加载机制，实现能力的灵活扩展与系统稳定性的平衡。

## 包含的 Atoms

| 编号  | 来源                  | 内容摘要                                                                                                   |
| ----- | --------------------- | ---------------------------------------------------------------------------------------------------------- |
| PC-01 | plugin-creation-guide | 插件系统由 loader.ts 协调，包含 discovery、manifest-registry、registry、config-state 四个核心模块          |
| PC-02 | plugin-creation-guide | 动态加载器使用 jiti 直接加载 TypeScript 文件，无需预编译步骤                                               |
| PC-03 | plugin-creation-guide | 插件架构分为两层：编译时稳定的 Plugin SDK 和运行时注入的 Plugin Runtime                                    |
| PC-04 | plugin-creation-guide | 开发者只能导入 openclaw/plugin-sdk，严禁直接导入 src 内部模块，运行时能力需通过 api.runtime 获取           |
| PC-05 | plugin-creation-guide | 插件发现按优先级扫描四个来源：config 指定路径、workspace 扩展、global 扩展、bundled 内置扩展               |
| PC-06 | plugin-creation-guide | 系统识别三种插件形式：含 openclaw.plugin.json 的包目录、顶层脚本文件、含 openclaw.extensions 字段的 npm 包 |
| PC-07 | plugin-creation-guide | 插件加载流程包含验证清单、检查 ID 冲突、判定启用状态、安全检查、配置校验、jiti 加载、调用 register 等十步  |
| PC-08 | plugin-creation-guide | 插件模块导出支持三种形式：默认导出函数、含 register 方法的对象、含 activate 方法的对象                     |
| PC-09 | plugin-creation-guide | 创建插件需建立目录结构，包含必需的 openclaw.plugin.json 清单文件和 index.ts 入口文件                       |
| PC-10 | plugin-creation-guide | 插件清单中 id 字段为全局唯一标识符且必需，configSchema 推荐用于配置校验                                    |
| PC-11 | plugin-creation-guide | 非 bundled 来源的插件需在 config.yaml 的 plugins.entries 中显式设置 enabled: true 才能启用                 |
| PC-12 | plugin-creation-guide | registerTool 支持静态工具定义和基于上下文的工厂模式，optional 为 true 时失败不阻断加载                     |
| PC-13 | plugin-creation-guide | registerChannel 是最复杂的注册类型，需实现 ChannelPlugin 接口的多个适配器                                  |
| PC-14 | plugin-creation-guide | registerProvider 支持 api_key、oauth、token、device_code、custom 五种认证类型                              |
| PC-15 | plugin-creation-guide | 注册 Hook 推荐使用 api.on() 方法而非 api.registerHook()，以获得完整的类型推导支持                          |
| PC-16 | plugin-creation-guide | registerCommand 注册的斜杠命令优先级高于内置命令和 Agent 调用，且可要求发送者认证                          |
| PC-17 | plugin-creation-guide | registerHttpHandler 通过返回 true/false 控制是否消费请求，比 registerHttpRoute 更灵活                      |
| PC-18 | plugin-creation-guide | registerService 注册的后台服务在 Gateway 启动时拉起，关闭时销毁                                            |
| PC-19 | plugin-creation-guide | Hook 系统包含 22 个生命周期切面，分为只读 Hook 和可通过返回值修改行为的可写 Hook                           |
| PC-20 | plugin-creation-guide | before_tool_call 是可写 Hook，可修改参数或通过 block: true 阻止工具执行                                    |
| PC-21 | plugin-creation-guide | message_sending 是可写 Hook，允许修改回复内容或设置 cancel: true 取消发送                                  |
| PC-22 | plugin-creation-guide | subagent_spawning 是可写 Hook，返回 status: "error" 可阻止子 Agent 创建                                    |
| PC-23 | plugin-creation-guide | 六种插件类型中，仅 Memory 插件需要在清单中设置 kind: "memory" 以参与槽位机制                               |
| PC-24 | plugin-creation-guide | 单个插件可同时注册多种能力（如工具、CLI、HTTP、服务），voice-call 插件即为综合案例                         |
| PC-25 | plugin-creation-guide | 配置验证在加载时进行，若 entries 中的 config 不匹配清单定义的 JSON Schema 将阻止插件加载                   |
| PC-26 | plugin-creation-guide | uiHints 中的 sensitive 字段指示 UI 将配置项渲染为密码输入框，advanced 字段指示折叠到高级区域               |
| PC-27 | plugin-creation-guide | 启用状态判定优先级最高的是全局 plugins.enabled 开关，其次是 deny 黑名单和 allow 白名单                     |
| PC-28 | plugin-creation-guide | 同一时刻只有一个 memory 插件被选中，通过 resolveMemorySlotDecision 机制竞争槽位                            |
| PC-29 | plugin-creation-guide | 内置插件默认启用列表仅包含 device-pair、phone-control、talk-voice 三个                                     |
| PC-30 | plugin-creation-guide | 安全机制会拒绝世界可写路径（mode & 0o002）并验证文件所有者与进程 UID 一致                                  |
| PC-31 | plugin-creation-guide | 非 bundled 插件若未在 installs 或 load.paths 中记录，系统会触发安全警告                                    |
| PC-32 | plugin-creation-guide | 使用 openclaw plugins list 查看已加载插件，使用 validate 命令验证配置                                      |
| PC-33 | plugin-creation-guide | Vitest 测试环境下插件系统默认禁用，需在测试配置中显式设置 plugins.enabled: true                            |
| PC-34 | plugin-creation-guide | 入门学习推荐参考 extensions/llm-task/（最简单工具插件），进阶参考 extensions/twitch/（通道插件）           |
| PC-35 | plugin-creation-guide | api.pluginConfig 获取本插件专属配置，api.config 获取全局 OpenClaw 配置                                     |
| PC-36 | plugin-creation-guide | api.resolvePath(input) 用于解析插件内的相对路径                                                            |

## 组内逻辑顺序

按插件开发全生命周期排列：架构与加载原理 (PC-01~04) -> 发现与识别机制 (PC-05~06) -> 初始化与目录结构 (PC-07~11) -> 能力注册详解 (PC-12~18) -> 高级扩展点 Hook 系统 (PC-19~22) -> 特殊类型与多能力组合 (PC-23~24) -> 配置与 UI 交互 (PC-25~26) -> 启用策略与竞争机制 (PC-27~29) -> 安全与运维 (PC-30~33) -> 最佳实践与 API 参考 (PC-34~36)。
