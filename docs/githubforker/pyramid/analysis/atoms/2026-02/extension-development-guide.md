# OpenClaw 扩展开发指南

> 来源：[../../../../journal/2026-02-01/extension-development-guide.md](../../../../journal/2026-02-01/extension-development-guide.md)
> 缩写：ED

## Atoms

| 编号  | 类型 | 内容                                                                                              | 原文定位               |
| ----- | ---- | ------------------------------------------------------------------------------------------------- | ---------------------- |
| ED-01 | 事实 | OpenClaw 扩展系统基于四大核心概念：发现机制、清单注册、运行时加载（jiti）、Plugin API 统一注册    | 扩展架构概述           |
| ED-02 | 事实 | 扩展发现顺序（优先级高到低）：config 配置 paths、workspace 工作区、global 全局、bundled 内置      | 扩展发现顺序           |
| ED-03 | 事实 | 支持五种扩展类型：Channel（消息渠道）、Provider（AI 认证）、Tool（Agent 工具）、Memory、Service   | 扩展类型               |
| ED-04 | 步骤 | 最小扩展示例：创建 index.ts 定义 plugin 对象（id/name/description/configSchema/register 函数）    | 快速开始               |
| ED-05 | 事实 | openclaw.plugin.json 必需字段：id（唯一标识），可选 kind/channels/uiHints/configSchema            | openclaw.plugin.json   |
| ED-06 | 事实 | package.json 必需字段：name/version/type="module"，openclaw.extensions 指定入口文件               | package.json           |
| ED-07 | 事实 | uiHints 配置选项包含：label（显示标签）、help（帮助文本）、advanced（高级）、sensitive（敏感）    | uiHints 选项           |
| ED-08 | 事实 | OpenClawPluginApi 提供 registerTool/Hook/HttpHandler/Route/Channel/Provider/Cli/Service/Command   | OpenClawPluginApi 接口 |
| ED-09 | 步骤 | Logger 接口方法：api.logger.info/warn/error/debug（可选）                                         | Logger 接口            |
| ED-10 | 事实 | PluginRuntime 提供版本、配置加载、媒体检测、TTS、各渠道相关函数等核心功能访问                     | PluginRuntime          |
| ED-11 | 步骤 | 注册工具使用 TypeBox 定义 parameters schema，execute 函数返回 content 和 details                  | 注册工具               |
| ED-12 | 经验 | 工具选项 name/names 可设别名，optional=true 在缺少依赖时不报错                                    | 工具选项               |
| ED-13 | 事实 | 渠道插件需实现 meta 元数据和多个适配器：config/auth/messaging/status/gateway 等                   | 注册渠道               |
| ED-14 | 步骤 | 注册 Provider 需定义 id/label/docsPath/aliases/envVars 和 auth 流程（api_key 或 oauth）           | 注册 Provider          |
| ED-15 | 步骤 | 注册 CLI 命令使用 api.registerCli，通过 program.command 定义子命令和选项                          | 注册 CLI 命令          |
| ED-16 | 步骤 | 注册 Gateway 方法使用 api.registerGatewayMethod("命名空间。方法", handler)，通过 respond 返回结果 | 注册 Gateway 方法      |
| ED-17 | 步骤 | 注册 HTTP 路由两种方式：registerHttpRoute（推荐）或 registerHttpHandler（通用处理器）             | 注册 HTTP 路由         |
| ED-18 | 事实 | 注册服务使用 api.registerService，实现 start 和 stop 生命周期函数管理后台服务                     | 注册服务               |
| ED-19 | 事实 | 注册自定义命令使用 api.registerCommand，可设 name/description/acceptsArgs/requireAuth/handler     | 注册自定义命令         |
| ED-20 | 事实 | 生命周期钩子共 14 个：before_agent_start、agent_end、message_received/sending/sent 等             | 可用钩子               |
| ED-21 | 经验 | before_agent_start 可注入上下文（prependContext），message_sending 可修改内容或取消发送           | 可用钩子可修改返回值   |
| ED-22 | 经验 | before_tool_call 可修改参数或阻止调用（block+blockReason），tool_result_persist 可修改消息        | 可用钩子可修改返回值   |
| ED-23 | 经验 | 配置验证推荐使用 Zod 进行运行时验证，确保类型安全                                                 | 配置验证               |
| ED-24 | 经验 | 错误处理应捕获异常返回 details 包含错误信息，使用 logger.error 记录                               | 错误处理               |
| ED-25 | 经验 | 重型资源使用延迟初始化模式（ensureClient 函数），避免启动时加载                                   | 延迟初始化             |
| ED-26 | 经验 | 使用 Service 生命周期管理资源清理，在 stop 函数中关闭连接/释放资源                                | 清理资源               |
| ED-27 | 经验 | Tool Schema 避免使用 Type.Union，字符串枚举用 stringEnum，可选用 Type.Optional 而非\|null         | 避免 Tool Schema 问题  |
| ED-28 | 事实 | 调试命令：plugins list（查看已加载）、plugins validate（验证配置）、pnpm test（运行测试）         | 调试与测试             |
| ED-29 | 经验 | 参考现有扩展源码学习：telegram（简单渠道）、twitch（复杂渠道）、voice-call（完整功能）            | 示例扩展               |
| ED-30 | 步骤 | 发布扩展：确保 package.json 正确→添加 README→运行测试→npm publish，用户通过 loadPaths 配置加载    | 发布扩展               |
