# OpenClaw 插件层：`types` 与 `registry` 职责笔记

> 日期：2026-03-21  
> 类型：代码结构 / 实现备忘  
> 相关路径：`src/plugins/types.ts`、`src/plugins/registry.ts`  
> 说明：以下记录的是当前这两份模块在仓库中的分工与关键行为，便于日后回溯「类型面」与「注册装配」各自管什么。

---

## 1. 为什么要拆成两块

插件系统在运行时要做两件事：**约定长什么样**（类型与契约），以及**把约定落到一张可遍历的表上**（注册、去重、诊断、与核心子系统挂钩）。

- `types.ts` 偏 **声明**：插件作者与核心代码共同依赖的 TypeScript 类型、Hook 名称枚举、事件/结果形状、Provider 能力钩子等。
- `registry.ts` 偏 **过程**：`createPluginRegistry` 在加载插件时收集 `PluginRecord` 与各类 `*Registration`，并在冲突时写入 `diagnostics`。

这样 loader、hooks、http、contracts 测试等可以只 import 类型，或只 import 工厂函数，依赖边界更清晰。

---

## 2. `src/plugins/types.ts`：类型与 Hook 契约

### 2.1 插件对外 API

`OpenClawPluginApi` 汇总了插件在 `register`/`activate` 阶段能调用的入口：`registerTool`、`registerHook`、`registerHttpRoute`、`registerChannel`、`registerProvider` 以及 speech / 媒体理解 / 文生图 / 网页搜索等扩展注册，还有 `registerGatewayMethod`、`registerCli`、`registerService`、`registerCommand`、`registerInteractiveHandler`、`registerContextEngine`、ACP runtime backend 的注册/注销、`resolvePath`，以及类型化生命周期 `on(hookName, handler)`。

`PluginRegistrationMode`（`full` / `setup-only` / `setup-runtime`）决定哪些 `register*` 在对应模式下是空操作，避免「只跑 setup」时误触全局副作用。

### 2.2 Provider 与周边类型

`ProviderPlugin` 集中描述插件化模型提供方的能力面：目录/发现（`catalog` 与兼容别名 `discovery`）、动态模型解析与归一化、运行时鉴权与用量快照、流封装、thinking 策略、向导元数据等。大量 `Provider*` Context/Result 类型把「核心负责编排、插件负责厂商细节」的边界写死在类型里。

### 2.3 命令与交互

`OpenClawPluginCommandDefinition`、`PluginCommandContext` 等支撑「绕过 LLM 的插件命令」；Telegram / Discord / Slack 的交互回调则有分渠道的 Handler Context 与 `PluginInteractiveHandlerRegistration` 联合类型。

### 2.4 类型化 Hook 与提示注入

- `PluginHookName` 与常量 `PLUGIN_HOOK_NAMES`、`isPluginHookName` 保证 Hook 名字可校验。
- `PROMPT_INJECTION_HOOK_NAMES`、`isPromptInjectionHookName` 标出与提示词改写相关的 Hook。
- `PLUGIN_PROMPT_MUTATION_RESULT_FIELDS` 与 `stripPromptMutationFieldsFromLegacyHookResult` 用于在 **禁止提示注入** 时，从旧版 `before_agent_start` 的返回里剥掉会改 system/上下文 的字段，同时保留模型/提供方覆盖等「非提示改写」结果。

`PluginHookHandlerMap` 把每个 Hook 名映射到严格的 handler 签名，供 `api.on(...)` 做类型推断。

---

## 3. `src/plugins/registry.ts`：注册表与 `createApi`

### 3.1 数据结构

- `createEmptyPluginRegistry()` 返回空的 `PluginRegistry`（plugins、tools、hooks、typedHooks、channels、各类 providers、gatewayHandlers、httpRoutes、cli、services、commands、diagnostics 等）。
- `PluginRecord` 记录单个插件的元数据、启用状态、已登记的 id 列表（工具名、Hook 名、渠道 id、CLI 命令等）以及 `httpRoutes` 计数等聚合字段。

### 3.2 注册时的规则（摘要点）

- **工具**：支持传入工厂或已构造的 `AnyAgentTool`，统一成 `OpenClawPluginToolFactory` 写入 `registry.tools`。
- **内部 Hook**：按 Hook 名去重；与 `config.hooks.internal.enabled` 及 `opts.register` 配合决定是否调用 `registerInternalHook`。
- **Gateway 方法**：不能与核心已有方法或其它插件已注册方法冲突。
- **HTTP 路由**：路径规范化、`auth` 必须是 `gateway` 或 `plugin`；与现路由 **重叠且 auth 不一致** 时拒绝；同一 path+match 已存在时可 `replaceExisting`，但 **不能抢别的插件** 已占用的路由。
- **渠道**：区分 `setup-only`（只进 `channelSetups`）与完整注册；setup 与 runtime 列表各自去重。
- **Provider 族**：通用 `registerProvider` 走 `normalizeRegisteredProvider`；speech / 媒体 / 文生图 / 搜索等用 `registerUniqueProviderLike` 减少重复逻辑。
- **CLI**：必须提供显式 `commands` 元数据，且与已注册命令集合无交集。
- **命令**：正常路径走 `registerPluginCommand`；当 `PluginRegistryParams.suppressGlobalCommands === true`（例如非激活的快照加载）时 **只校验并记入本地 registry，不写全局命令表**，避免污染正在运行的 gateway；注释中说明快照 registry 上 **不做跨插件重复命令检测**，真实冲突会在正常启动激活时暴露。

### 3.3 类型化 Hook 与提示策略

`registerTypedHook` 在 Hook 名非法时告警并忽略。若配置为 `allowPromptInjection === false`：对 `before_prompt_build` 直接拦截；对 `before_agent_start` 则包一层 `constrainLegacyPromptInjectionHook`，在同步/异步返回路径上都调用 `stripPromptMutationFieldsFromLegacyHookResult`，与 `types.ts` 中的字段列表一致。

### 3.4 `createApi`

为每个 `PluginRecord` 构造 `OpenClawPluginApi`：注入 `logger`、`runtime`、`config`、`pluginConfig`、`registrationMode` 以及上面的各类 `register*`，并在 `registerContextEngine` 等处与核心注册表（如 context engine 槽位、ACP backend）交互，失败时统一 `pushDiagnostic`。

---

## 4. 小结（日记一句）

今天把插件层里 **「类型契约」**（`types.ts`）和 **「注册表与副作用边界」**（`registry.ts`）拆开记了一笔：前者定规矩、后者在加载时执行规矩并产出可观测的 `PluginRegistry` + `diagnostics`；快照场景下对插件命令的 **suppressGlobalCommands** 与提示注入相关的 **typed hook 包装** 是两块最容易踩坑、也最值得以后改代码时先回来看的细节。
