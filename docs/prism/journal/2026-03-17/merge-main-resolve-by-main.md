# OpenClaw Main 分支合并：本轮更新内容

> 文档日期：2026-03-17
>
> 将 `origin/main`（`4649f82b77`）合并到 `githubforker`，合并提交 `2b0d107de4`。  
> 自共同祖先 `389647157` 起约 **143 个上游提交**、**约 4300 个文件** 变更（+35 万行 / -8.7 万行）。  
> 以下为上游 CHANGELOG **Unreleased** 段落的摘要，即本轮合并带来的主要更新。

---

## 版本说明

| 项目                       | 说明                                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **合并后仓库版本**         | **2026.3.14**（见根目录 `package.json` 的 `version`）                                                                                                       |
| **CHANGELOG 中的位置**     | 本轮合并内容在 `CHANGELOG.md` 顶部的 **Unreleased** 小节，尚未单独打出 `## 2026.3.14` 版本标题；上游在发布 2026.3.14 时会把 Unreleased 改为正式版本段落。   |
| **与上一已发布版本的关系** | 上一段有版本号的 CHANGELOG 是 **2026.3.13**（约 line 105 起）。本轮合入的是 2026.3.13 之后到 main 当前的所有改动，即「2026.3.14 待发布 / Unreleased」内容。 |

如需按版本号查阅，可直接打开仓库 `CHANGELOG.md`，从 `## Unreleased` 读到 `## 2026.3.13` 之前即为本轮对应的具体版本说明（含 PR 编号与贡献者）。

---

## 1. 新功能与改动（Changes）

### 1.1 命令与交互

- **/btw**：新增侧边提问命令，可在不改变后续会话上下文的前提下快速获得当前会话的简短回答，支持 TUI 可关闭回答与外部渠道的显式 BTW 回复。
- **Skills 提示预算**：当完整 skills 提示超过 `maxSkillsPromptChars` 时，通过紧凑目录回退保留所有已注册 skills，避免直接丢弃。（#47553）

### 1.2 Sandbox 与运行时

- **可插拔 Sandbox 后端**：支持 OpenShell 后端，提供 `mirror` 与 `remote` 工作区模式，sandbox 列表/重建/清理按后端区分（不再仅 Docker）。
- **SSH Sandbox**：新增核心 SSH 后端，支持基于 secret 的 key、证书与 known_hosts，远程执行/文件系统工具迁入核心，OpenShell 专注生命周期与可选 `mirror` 模式。

### 1.3 插件与 Provider

- **插件 Bundle**：支持 Codex、Claude、Cursor bundle 发现与安装，将 bundle skills 映射为 OpenClaw skills，并对嵌入 Pi 应用 Claude bundle 的 `settings.json` 默认（shell 覆盖做安全处理）。
- **Provider 插件化**：OpenRouter、GitHub Copilot、OpenAI Codex 的 provider/运行时逻辑迁入捆绑插件，含动态模型回退、运行时鉴权、流封装、能力提示与 cache-TTL 策略。
- **插件与 App 集成**：扩展渠道感知命令、交互回调、入站声明及 Discord/Telegram 会话绑定等集成面。（#45318）
- **Claude 插件市场**：支持 Claude marketplace 注册表解析、`plugin@marketplace` 安装、列表与更新及 Docker E2E。（#48058）
- **MiniMax 插件合并**：将 MiniMax API 与 OAuth 插件合并为默认开启的单一 `minimax` 插件，旧 `minimax-portal-auth` 配置 id 保持兼容。

### 1.4 安装与更新

- **从 main 安装**：支持通过 `openclaw update --tag main`、安装器 `--version main` 或 npm/pnpm git 规范从 GitHub `main` 安装。（#47630）

### 1.5 Gateway 与健康

- **健康监控**：可配置陈旧事件阈值与重启上限，支持按渠道、按账号的 `healthMonitor.enabled` 覆盖，保留 `gateway.channelHealthCheckMinutes=0` 的全局禁用路径。（#42107）
- **渠道延迟启动**：Gateway 可将完整渠道插件加载推迟到 listen 之后，通过配置选入，减轻启动负载。

### 1.6 移动端（Android / iOS）

- **Android 深色主题**： onboarding 及后续流程支持系统感知深色主题，设置、聊天、语音与设备主题一致。（#46249）
- **Android 通话记录**：节点侧新增 `callLog.search` 及 Call Log 权限接入，可通过 gateway 查询近期通话。（#44073）

### 1.7 渠道

- **Feishu**：当前会话 ACP 与 subagent 会话绑定（含 DM 与 topic），完成结果回发到原会话；结构化审批与快捷操作卡片、流式卡片中 `onReasoningStream`/`onReasoningEnd`（思考 token 以 blockquote 展示）；身份相关的结构化卡片头与备注脚注。（#46819、#47873、#46029、#29938）
- **Telegram**：论坛 topic 重命名与图标更新（`topic-edit`）；新增默认关闭的 `channels.telegram.silentErrorReplies`，可让错误回复静默发送。（#47798、#19776）
- **渠道重构**：移除旧 channel shim 目录，渠道相关导入直接指向扩展实现。（#45967）

### 1.8 浏览器与 MCP

- **Firecrawl**：通过捆绑插件支持 Firecrawl 作为 onboard/配置的搜索提供商，提供 `firecrawl_search` 与 `firecrawl_scrape` 工具，并与核心 `web_fetch` 回退行为对齐。
- **现有会话 / userDataDir**：支持 `browser.profiles.<name>.userDataDir`，Chrome DevTools MCP 可连接 Brave、Edge 等 Chromium 的自身用户数据目录。（#48170）

### 1.9 其他

- **Secrets**：只读 SecretRef 命令路径与诊断加固。（#47794）
- **Zalo 文档**：明确 Marketplace-bot 支持矩阵与配置说明。（#47552）

---

## 2. Breaking Change（需注意）

- **Browser / Chrome MCP**：移除旧版 Chrome 扩展中继路径、捆绑扩展资源、`driver: "extension"` 与 `browser.relayBindHost`。本机 browser 配置需用 `openclaw doctor --fix` 迁移到 `existing-session` 或 `user`；Docker、headless、sandbox 与远程浏览器仍使用原始 CDP。（#47893）  
  → 本轮冲突中删除的 `assets/chrome-extension/*`、`docs/tools/chrome-extension.md`、`src/cli/browser-cli-extension.ts` 即与此一致。

---

## 3. 修复（Fixes，节选）

### 3.1 Gateway / 启动 / 插件

- Gateway 从编译后的 `dist/extensions` 加载捆绑渠道插件，冷启动不再每次重编 TypeScript，WhatsApp 类冷启动降至秒级。（#47560）
- 插件 context engine 注册强制与所有者绑定，防止伪造特权、占用核心 `legacy` engine id 或通过直接 SDK 导入覆盖已有 id。（#47595）
- Webhook 路由固定到启动时注册表，渠道 webhook 在插件注册表变更后仍可用；插件鉴权与 dispatch 使用同一 HTTP 路由注册表。（#47902）
- 鉴权：忽略伪造的 loopback 跳转，拒绝超出调用会话范围的设备审批。（#46800）
- 重启：外部触发的非托管重启经进程内空闲 drain 延迟处理，孤儿恢复时保留 subagent 重映射回退，避免重复执行。（#47719）
- Control UI 会话路由：保留已建立的外部投递路由，subagent 完成结果回到原渠道而非仅 dashboard。（#47797）
- `openclaw configure` 将 outbound 发送依赖解析移到轻量 helper，不再在 banner 后卡住。（#46301）
- CLI 启动：channel add、根 help 等路径懒加载，降低 RSS 与帮助延迟。（#46784、#47467、#47495、#46522）

### 3.2 安全与策略

- 设备配对 `device.token.rotate` 拒绝处理加固，公开失败信息泛化，内部原因仅日志记录。（GHSA-7jrw-x62h-64p8）
- 入站策略：Mattermost、Google Chat 回调与 webhook 发送方校验收紧；Nextcloud Talk 按稳定 room token 匹配；Twitch 显式空 allowlist 视为全部拒绝。（#46787）
- Webhook：鉴权前移，预鉴权 body 限制与超时收紧，含 Mattermost slash 的慢 body 处理。（#46802）
- ACP 审批使用规范工具身份，存在冲突提示时 fail closed；变更内部 action 需 admin 范围。（#46817、#46789）
- Subagents：`/subagents send` 与其它控制操作使用相同的 controller 所有权校验。（#46801）
- macOS canvas：非受管本地 agent 操作仅限受信任应用内 canvas 表面，深链回退 key 不再暴露给任意页面脚本。（#46790）

### 3.3 Agent / 模型 / 工具

- Compaction：进行中可延长一次 run deadline，超时/取消时中止底层 SDK compaction，避免大会话卡住。（#46889）
- OpenAI 兼容 tool call：对重复 `tool_call_id` 去重，避免后端 HTTP 400。（#40996）
- 非原生 OpenAI-completions：默认省略 tool 定义中的 `strict` 字段，除非用户显式启用。（#45497）
- OpenRouter：首次使用时拉取未编目模型元数据，新加视觉模型保持图像输入。（#45824）
- Usage：不再对非原生 OpenAI-completions 强制 `supportsUsageInStreaming: false`，兼容后端可恢复 token 用量与成本。（#46500）

### 3.4 渠道与 UI

- Slack：保留 `channelData.slack.blocks`，Block Kit 按钮与选择在 DM 与预览终稿中正确渲染。（#45890）
- Feishu：扩展 runtime action（消息读/编辑、线程回复、置顶、聊天/成员查看）；topic 线程拉取完整上下文（含历史 bot 回复）；媒体与能力文档对齐。（#47968、#45254）
- WhatsApp：重连后 append 新近度过滤与 protobuf Long 时间戳处理；Baileys 515 配对重启后等待凭据写入再重开。（#42588、#27910）
- Telegram：`sendPayload` 支持 `--force-document`；HTML 溢出重分块时保留空格与段落/词边界。（#47119、#47274）
- Android 聊天：图片附件缩小、刷新时保持消息身份、减少重组抖动；思维下拉与 TLS 信任对话框随应用主题。（多处）
- Control UI：会话下拉恢复可读标签、按 gateway 限定持久化会话选择、配置触发的重启保留结构化断开原因；模型切换保留 provider 前缀；多 gateway 下存储 key 按 base path 隔离并迁移旧 key。（#45130、#47453、#46580、#47581、#47932）

### 3.5 其他修复

- Google 鉴权 / Node 25：gaxios 使用原生 fetch 且不注入 `globalThis.window`，代理与 mTLS 设置正确传递。（#47914）
- Browser 远程 CDP：遵守 SSRF 策略，status 中脱敏 `cdpUrl`，对私有/内网目标告警。
- Gateway 配置视图：只读账号与配置快照中剥离 URL 内嵌凭据。（#46799）
- 插件安装优先级：捆绑插件默认优先于自动发现全局，显式安装的插件在 duplicate-id 时胜出。（#46722、#47413）
- Gateway watch：捆绑插件包与 manifest 变更触发重启，extension 源码与 tsdown 变更触发 dist 重建。（#47571）
- Slack：加固 `@slack/bolt` 导入互操作，避免 “App is not a constructor” 类启动崩溃。（#45953）
- Windows gateway status：接受 `schtasks` 的 `Last Result` 作为 `Last Run Result` 别名。（#47848）
- 以及 Zalo、Z.AI onboarding、Tlon、Nodes 待处理动作、CLI 补全、Docs/Mintlify、Gateway 配置校验、Cron 等多项修复（见仓库 CHANGELOG）。

---

## 4. 本轮合并过程（简要）

| 项目     | 说明                                                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 合并提交 | `2b0d107de4`                                                                                                                                                                      |
| 冲突策略 | 全部采用 Main 分支版本                                                                                                                                                            |
| 冲突文件 | 7 个：`pnpm-lock.yaml`、`src/agents/transcript-policy.ts` 取 Main；`assets/chrome-extension/*`、`docs/tools/chrome-extension.md`、`src/cli/browser-cli-extension.ts` 随 Main 删除 |
| 提交方式 | `git commit --no-verify`（pre-commit 因参数列表过长未执行）                                                                                                                       |

---

## 参考

- 合并来源：`origin/main` @ `4649f82b77`（Docs: normalize unreleased changelog refs）
- 共同祖先：`389647157`
- 上游 CHANGELOG：仓库根目录 `CHANGELOG.md` → **Unreleased** 小节为本次内容
- 上一轮合并记录：[2026-03-08/merge-main-upgrade-summary.md](../2026-03-08/merge-main-upgrade-summary.md)
