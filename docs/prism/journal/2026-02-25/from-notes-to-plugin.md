# 从散乱笔记到 OpenClaw 插件：知识棱镜的诞生历程

> 编写日期：2026-02-25
> 记录一个需求如何从"手动整理笔记"演化为"独立工具项目"，再到"OpenClaw 插件"的完整历程。

---

## 起点：20 篇笔记和一个越来越明显的问题

从 1 月 31 日开始学习 OpenClaw，到 2 月中旬，`docs/githubforker/journal/` 下已经积累了 20 多篇按日期组织的笔记——渠道部署、Agent 配置、安全加固、Fork 管理、终端设置……内容覆盖面够广，但有一个越来越难忽视的问题：

**笔记越多，越难用。**

想查"OpenClaw 的核心概念有哪些"，答案散落在 1/31 的分析报告和 2/13 的概念梳理里。想给别人解释"怎么从零开始部署"，需要从 5 篇不同日期的文档里拼凑步骤。时间线组织适合记录过程，但不适合教学和复用。

## 第一步：设计架构（2 月 22 日）

认识到问题后，第一反应不是"赶紧分类"，而是退一步想清楚组织原则。参考《金字塔原理》的方法论，设计了三层架构：

```
journal/   原始素材层    ← 按日期忠实记录，只增不改
    ↓
pyramid/   结构化拆解层  ← 基于金字塔原理，双轨处理
    ↓
outputs/   读者产出层    ← 面向特定读者的成品文章
```

这个设计过程涉及 9 个关键决策——atoms 按月分目录、structure 按视角分目录、tree 升级为目录、scqa 和 validation 保持单文件……每个决策都有明确的判断标准：**产物是否会随素材规模增长**。会增长的用目录拆分，固定的用单文件保内聚。

完整的设计思考记录在 `knowledge-base-architecture-design.md` 中。

## 第二步：方法论命名与实践（2 月 23 日）

架构落地后，给这套方法起了个名字：**Knowledge Prism（知识棱镜）**。

名字来自一个物理隐喻——散乱的日常笔记（白光）经过结构化拆解（棱镜），产出面向读者的清晰文章（光谱）。三棱镜的三角截面也暗合了金字塔原理的核心形态。

随后开始实际的增量拆解：

1. 从 23 篇 journal 中提取 atoms（最小知识单元）
2. 跨文档边界归组为 groups，每组提炼一个观点句（最终形成 G01–G31 共 31 个分组）
3. 从观点句中收敛出 20 个顶层候选观点（S1–S20）
4. 基于候选观点建立了第一个视角（P01），完成 SCQA → 金字塔树 → 验证的全流程
5. 产出第一篇成品《个人知识库的结构化方法》

整个过程走通，但一个新问题浮现了：**每次新增 journal 后的增量处理，手动操作太繁琐。**

提取 atoms 需要逐篇阅读、标注来源；归组需要审视 30 多个现有分组决定是更新还是新建；synthesis 需要检查候选观点是否需要调整……流程是清晰的，但每一步都涉及大量重复性的文本处理。

## 第三步：从方法论到工具（js-knowledge-prism）

既然流程固定、步骤可重复，自然想到自动化。于是把这套方法论抽象成了一个独立的 CLI 工具项目：[js-knowledge-prism](https://github.com/my/js-knowledge-prism)。

设计目标：

- **零外部依赖**——只用 Node.js 内置模块，降低安装门槛
- **编程 API + CLI 双入口**——既能命令行使用，也能被其他系统集成
- **LLM 驱动的处理管线**——atoms 提取、groups 归组、synthesis 收敛三个阶段都调用 LLM 完成

工具的核心模块：

| 模块                      | 职责                                             |
| ------------------------- | ------------------------------------------------ |
| `lib/process.mjs`         | 三阶段增量处理管线（atoms → groups → synthesis） |
| `lib/status.mjs`          | 知识库状态统计（各层文件数、待处理项等）         |
| `lib/config.mjs`          | 配置加载（`.knowledgeprism.json`）               |
| `lib/init.mjs`            | 初始化知识库骨架                                 |
| `lib/new-perspective.mjs` | 创建新视角目录                                   |

CLI 用法：

```bash
js-knowledge-prism init <dir>           # 初始化骨架
js-knowledge-prism process              # 执行增量处理
js-knowledge-prism status               # 查看状态
js-knowledge-prism new-perspective <slug>  # 创建新视角
```

工具做完后，增量处理从手动操作变成了一条命令。但新的想法又冒了出来——

**既然日常的 OpenClaw 使用场景里，AI Agent 可以调用工具，能不能让 Agent 直接帮我管理知识库？**

比如写完一篇 journal，直接告诉 Agent "处理一下"，它自动调用知识棱镜的管线完成拆解。不需要切换到终端敲命令，在对话中就能完成。

这就需要把 js-knowledge-prism 变成 OpenClaw 的插件。

## 第四步：研究插件机制（2 月 25 日）

为了搞清楚"怎么把一个独立项目变成 OpenClaw 插件"，对 OpenClaw 的插件系统做了一次深度源码分析。产出了 `plugin-creation-guide.md`——一份覆盖从机制原理到动手创建的完全指引。

关键发现：

### 插件系统的四模块协作

```
loader.ts       协调全流程：发现 → 校验 → 加载 → 注册 → 缓存
discovery.ts    扫描目录，产出候选
registry.ts     收集注册，工厂 API
config-state.ts 启用/禁用决策，优先级裁决
```

### 插件发现的四级来源

| 优先级 | 来源      | 路径                                 |
| ------ | --------- | ------------------------------------ |
| 1      | config    | `plugins.load.paths`（用户显式指定） |
| 2      | workspace | `.openclaw/extensions/`              |
| 3      | global    | `~/.config/openclaw/extensions/`     |
| 4      | bundled   | `extensions/`                        |

### 插件的最低结构要求

```
my-plugin/
├── openclaw.plugin.json   ← 清单文件（必需：id + configSchema）
├── index.ts               ← 入口文件（导出 register 函数）
└── package.json           ← 推荐
```

### 十种注册能力

插件通过 `api.registerXxx()` 注册能力——工具、通道、Provider、Hook、命令、HTTP 路由、Gateway 方法、CLI 命令、后台服务。一个插件可以同时注册多种。

## 第五步：适配与安装

研究完机制后发现，js-knowledge-prism 在设计时已经预留了 OpenClaw 插件的接口——项目中有一个 `openclaw-plugin/` 子目录，结构完全合规：

```
js-knowledge-prism/
└── openclaw-plugin/
    ├── openclaw.plugin.json   ← id: "knowledge-prism"
    ├── index.mjs              ← 导出 register(api)
    └── package.json
```

插件注册了两类能力：

**AI 工具**（Agent 可调用）：

| 工具名                    | 功能                                       |
| ------------------------- | ------------------------------------------ |
| `knowledge_prism_process` | 执行增量处理（atoms → groups → synthesis） |
| `knowledge_prism_status`  | 查询知识库状态                             |

**CLI 命令**（终端可调用）：

```
openclaw prism init <dir>
openclaw prism process [--base-dir <dir>]
openclaw prism status [--base-dir <dir>]
openclaw prism new-perspective <slug>
```

安装方式是用 `--link` 模式链接本地路径（避免复制导致相对路径断裂）：

```bash
openclaw plugins install --link d:\github\my\js-knowledge-prism\openclaw-plugin
```

安装后，`baseDir` 支持每次调用时动态指定，因此同一个插件可以管理多个知识库目录——包括当前的 `docs/githubforker`，也包括未来任何符合三层结构的目录。

## 回望：一条需求驱动的演化链

把整个历程拉通来看，是一条清晰的需求驱动链：

```
笔记难用 → 设计三层架构 → 手动拆解太繁琐 → 抽象为 CLI 工具 → 想在对话中直接用 → 转为 OpenClaw 插件
```

每一步都不是预先规划的，而是前一步的实践暴露了新的痛点，自然地推动了下一步。这也验证了知识棱镜本身的方法论——**增量演化优于一步到位**。

值得记录的几个认知：

1. **工具和方法论应该分离**。三层架构是方法论，js-knowledge-prism 是工具。方法论可以用任何工具执行（手动、脚本、插件），工具也可以服务于任何符合结构的知识库。
2. **插件化的核心价值不是"技术炫酷"，而是缩短反馈循环**。从"写完笔记 → 切终端 → 敲命令 → 看结果"变成"写完笔记 → 告诉 Agent → 自动处理"，减少的是上下文切换成本。
3. **研究插件机制本身就是一篇 journal**。这篇文档的产生过程，恰好就是知识棱镜 journal 层的运作方式——按时间忠实记录探索过程，之后再由 pyramid 层做结构化拆解。

## 相关文档

| 文档                                    | 日期       | 内容                      |
| --------------------------------------- | ---------- | ------------------------- |
| `knowledge-base-architecture-design.md` | 2026-02-22 | 三层架构的 9 个设计决策   |
| `knowledge-prism-introduction.md`       | 2026-02-23 | 知识棱镜的方法论介绍      |
| `plugin-creation-guide.md`              | 2026-02-25 | OpenClaw 插件系统深度分析 |
| 本文                                    | 2026-02-25 | 从笔记到插件的完整历程    |
