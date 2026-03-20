# OpenClaw 插件层：`types` 与 `registry` 职责笔记

> 来源：[../../../../journal/2026-03-21/openclaw-plugin-types-and-registry.md](../../../../journal/2026-03-21/openclaw-plugin-types-and-registry.md)
> 缩写：OT

## Atoms

| 编号  | 类型 | 内容                                                                                                | 原文定位                   |
| ----- | ---- | --------------------------------------------------------------------------------------------------- | -------------------------- |
| OT-01 | 事实 | 插件系统拆分为 `types.ts`（声明类型与契约）和 `registry.ts`（执行注册、去重、诊断与装配过程）       | 1. 为什么要拆成两块        |
| OT-02 | 经验 | 将类型定义与注册逻辑分离可使 loader、hooks 等模块仅依赖所需部分，从而清晰化依赖边界                 | 1. 为什么要拆成两块        |
| OT-03 | 事实 | `PluginRegistrationMode` 枚举包含 `full`、`setup-only`、`setup-runtime` 三种模式                    | 2.1 插件对外 API           |
| OT-04 | 判断 | 在 `setup-only` 模式下将部分 `register*` 方法设为空操作，可避免误触全局副作用                       | 2.1 插件对外 API           |
| OT-05 | 事实 | `ProviderPlugin` 类型集中描述了模型提供方的目录发现、动态解析、鉴权、流封装及 thinking 策略等能力   | 2.2 Provider 与周边类型    |
| OT-06 | 事实 | `PLUGIN_PROMPT_MUTATION_RESULT_FIELDS` 用于标识需从旧版 Hook 结果中剥离的提示改写字段               | 2.4 类型化 Hook 与提示注入 |
| OT-07 | 步骤 | 使用 `stripPromptMutationFieldsFromLegacyHookResult` 可在禁止提示注入时保留非改写结果并移除危险字段 | 2.4 类型化 Hook 与提示注入 |
| OT-08 | 事实 | `createEmptyPluginRegistry` 返回包含 plugins、tools、hooks、diagnostics 等空集合的初始注册表        | 3.1 数据结构               |
| OT-09 | 步骤 | 注册 HTTP 路由时需规范化路径，且 auth 类型必须为 `gateway` 或 `plugin`                              | 3.2 注册时的规则           |
| OT-10 | 判断 | 若新路由与现有路由重叠且 auth 不一致，或试图抢占其他插件已占用的路由，注册将被拒绝                  | 3.2 注册时的规则           |
| OT-11 | 经验 | 同一 path+match 已存在时可调用 `replaceExisting` 覆盖，但严禁覆盖属于其他插件的路由                 | 3.2 注册时的规则           |
| OT-12 | 事实 | 当 `suppressGlobalCommands` 为 true 时，命令注册仅校验并记入本地 registry，不写入全局命令表         | 3.2 注册时的规则           |
| OT-13 | 经验 | 快照 registry 场景下不做跨插件命令重复检测，真实冲突会在正常启动激活时暴露                          | 3.2 注册时的规则           |
| OT-14 | 步骤 | 当 `allowPromptInjection` 为 false 时，`before_agent_start` Hook 会被包裹以强制剥离提示突变字段     | 3.3 类型化 Hook 与提示策略 |
| OT-15 | 事实 | `createApi` 为每个插件记录注入 logger、runtime、config 及各类注册函数，并在失败时统一推送诊断信息   | 3.4 createApi              |
| OT-16 | 经验 | 快照场景下的 `suppressGlobalCommands` 逻辑与提示注入的 typed hook 包装是未来修改代码时的高风险点    | 4. 小结                    |
