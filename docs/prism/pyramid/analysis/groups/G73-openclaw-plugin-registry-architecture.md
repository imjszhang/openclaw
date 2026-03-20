# G73: 插件注册表架构必须严格分离「类型契约声明」与「运行时装配逻辑」并实施细粒度权限控制

> 通过拆分 `types.ts` 与 `registry.ts` 明确依赖边界，利用注册模式枚举、路由冲突检测及提示注入过滤机制，构建安全可控的插件运行时环境。

## 包含的 Atoms

| 编号  | 来源                               | 内容摘要                                                                                            |
| ----- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| OT-01 | openclaw-plugin-types-and-registry | 插件系统拆分为 `types.ts`（声明类型与契约）和 `registry.ts`（执行注册、去重、诊断与装配过程）       |
| OT-02 | openclaw-plugin-types-and-registry | 将类型定义与注册逻辑分离可使 loader、hooks 等模块仅依赖所需部分，从而清晰化依赖边界                 |
| OT-03 | openclaw-plugin-types-and-registry | `PluginRegistrationMode` 枚举包含 `full`、`setup-only`、`setup-runtime` 三种模式                    |
| OT-04 | openclaw-plugin-types-and-registry | 在 `setup-only` 模式下将部分 `register*` 方法设为空操作，可避免误触全局副作用                       |
| OT-05 | openclaw-plugin-types-and-registry | `ProviderPlugin` 类型集中描述了模型提供方的目录发现、动态解析、鉴权、流封装及 thinking 策略等能力   |
| OT-06 | openclaw-plugin-types-and-registry | `PLUGIN_PROMPT_MUTATION_RESULT_FIELDS` 用于标识需从旧版 Hook 结果中剥离的提示改写字段               |
| OT-07 | openclaw-plugin-types-and-registry | 使用 `stripPromptMutationFieldsFromLegacyHookResult` 可在禁止提示注入时保留非改写结果并移除危险字段 |
| OT-08 | openclaw-plugin-types-and-registry | `createEmptyPluginRegistry` 返回包含 plugins、tools、hooks、diagnostics 等空集合的初始注册表        |
| OT-09 | openclaw-plugin-types-and-registry | 注册 HTTP 路由时需规范化路径，且 auth 类型必须为 `gateway` 或 `plugin`                              |
| OT-10 | openclaw-plugin-types-and-registry | 若新路由与现有路由重叠且 auth 不一致，或试图抢占其他插件已占用的路由，注册将被拒绝                  |
| OT-11 | openclaw-plugin-types-and-registry | 同一 path+match 已存在时可调用 `replaceExisting` 覆盖，但严禁覆盖属于其他插件的路由                 |
| OT-12 | openclaw-plugin-types-and-registry | 当 `suppressGlobalCommands` 为 true 时，命令注册仅校验并记入本地 registry，不写入全局命令表         |
| OT-13 | openclaw-plugin-types-and-registry | 快照 registry 场景下不做跨插件命令重复检测，真实冲突会在正常启动激活时暴露                          |
| OT-14 | openclaw-plugin-types-and-registry | 当 `allowPromptInjection` 为 false 时，`before_agent_start` Hook 会被包裹以强制剥离提示突变字段     |
| OT-15 | openclaw-plugin-types-and-registry | `createApi` 为每个插件记录注入 logger、runtime、config 及各类注册函数，并在失败时统一推送诊断信息   |
| OT-16 | openclaw-plugin-types-and-registry | 快照场景下的 `suppressGlobalCommands` 逻辑与提示注入的 typed hook 包装是未来修改代码时的高风险点    |

## 组内逻辑顺序

按架构设计逻辑组织：核心分层原则 (OT-01, OT-02) -> 类型定义与契约 (OT-03, OT-05, OT-06, OT-07) -> 注册表初始化与模式控制 (OT-04, OT-08, OT-15) -> 路由与命令注册的安全校验机制 (OT-09, OT-10, OT-11, OT-12, OT-13) -> 风险提示 (OT-16)。
