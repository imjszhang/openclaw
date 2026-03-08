# JS Knowledge Prism：知识棱镜工具的创建

> 编写日期：2026-02-24
> 记录 JS Knowledge Prism 项目的创建——一个基于金字塔原理的三层知识蒸馏工具包，将散乱的时间线笔记转化为结构化知识产出。

---

## 目录

1. [项目动机](#1-项目动机)
2. [核心概念：知识棱镜](#2-核心概念知识棱镜)
3. [三层架构设计](#3-三层架构设计)
4. [增量处理管线](#4-增量处理管线)
5. [技术选型](#5-技术选型)
6. [项目架构](#6-项目架构)
7. [CLI 工具](#7-cli-工具)
8. [OpenClaw 插件能力](#8-openclaw-插件能力)
9. [扩展技能系统](#9-扩展技能系统)
10. [当日进展](#10-当日进展)
11. [版本演化](#11-版本演化)

---

## 1. 项目动机

从 1 月底开始学习 OpenClaw，到 2 月中旬已积累了 20 多篇按日期组织的笔记。渠道部署、Agent 配置、安全加固、Fork 管理、终端设置……内容覆盖面够广，但一个问题越来越明显：

**笔记越多，越难用。**

想查"OpenClaw 的核心概念"，答案散落在不同日期的多篇文档里。想给别人解释"怎么从零部署"，需要从 5 篇笔记里拼凑步骤。时间线组织适合记录过程，但不适合教学和复用。

需要一套方法论把散乱笔记结构化。进一步地，需要把这套方法论变成工具，让 AI Agent 自动执行。

## 2. 核心概念：知识棱镜

名字来自一个物理隐喻：

> 一束白光射入三棱镜，折射出有序的七色光谱。散乱的日常笔记（白光）经过结构化拆解（棱镜），产出面向读者的清晰文章（光谱）。

三棱镜的三角截面暗合金字塔原理的核心形态——这不仅是工具名称，更是整套方法论的浓缩。

## 3. 三层架构设计

```
journal/   原始素材层    ← 按日期忠实记录，只增不改
    ↓
pyramid/   结构化拆解层  ← 基于金字塔原理，双轨处理
    ↓
outputs/   读者产出层    ← 面向特定读者的成品文章
```

### 3.1 Journal（原始素材层）

按日期目录组织的原始笔记，忠实记录探索过程。核心原则是"只增不改"——记录是忠实的，结构化是后续层的事。

### 3.2 Pyramid（结构化拆解层）

金字塔层包含两条处理轨道：

**分析轨（Analysis）**：

| 层级          | 职责                                        |
| ------------- | ------------------------------------------- |
| **Atoms**     | 从 journal 中提取的最小知识单元，按月分目录 |
| **Groups**    | 跨文档边界归组 atoms，每组提炼一个观点句    |
| **Synthesis** | 从观点句中收敛出顶层候选观点                |

**结构轨（Structure）**：

| 组件            | 职责                                               |
| --------------- | -------------------------------------------------- |
| **Perspective** | 以特定视角组织知识（如"入门教程"、"安全加固指南"） |
| **SCQA**        | 情境-冲突-问题-答案框架                            |
| **Key Line**    | 核心论证线索                                       |
| **Validation**  | 交叉验证                                           |

### 3.3 Outputs（读者产出层）

基于视角和模板生成面向读者的成品——博客文章、教程、实践日记等。支持多种输出模板。

## 4. 增量处理管线

三阶段自动化处理，由 LLM 驱动：

```
阶段 1: Atoms 提取
  journal/*.md → LLM → atoms/{月}/xxx.md

阶段 2: Groups 归组
  new atoms → LLM → groups/Gxx-xxx.md（新建或更新）

阶段 3: Synthesis 收敛
  all groups → LLM → synthesis.md（顶层观点候选）
```

关键设计原则：

- **增量处理**——只处理新增的 journal，已处理的不重复
- **幂等性**——同一 journal 多次处理不会产生重复 atoms
- **LLM 驱动**——提取、归组、收敛三个阶段都调用 LLM，不是规则匹配

## 5. 技术选型

| 技术                | 选择理由                                          |
| ------------------- | ------------------------------------------------- |
| **Node.js >= 18**   | ES Module 原生支持，与 OpenClaw 生态一致          |
| **零外部依赖**      | 核心库和独立 CLI 不依赖第三方包，降低安装门槛     |
| **OpenAI 兼容 API** | 支持任何兼容接口（本地模型、云端服务均可）        |
| **archiver**        | 唯一依赖——用于构建技能包 zip（仅 CLI 工具链使用） |

零外部依赖是刻意的设计选择——作为知识管理工具，它应该足够轻量，不引入不必要的复杂性。LLM 调用通过 Node.js 原生 `fetch` 实现。

## 6. 项目架构

```
js-knowledge-prism/
├── bin/
│   └── cli.mjs                    # 独立 CLI 入口（npx 调用）
├── lib/                           # 核心模块
│   ├── config.mjs                 # 配置加载（.knowledgeprism.json + .env）
│   ├── process.mjs                # 三阶段增量管线（atoms → groups → synthesis）
│   ├── status.mjs                 # 知识库状态统计
│   ├── init.mjs                   # 骨架初始化
│   ├── new-perspective.mjs        # 创建新视角
│   ├── fill-perspective.mjs       # 生成 SCQA / Key Line
│   ├── expand-kl.mjs              # 展开 Key Line 为完整文档
│   ├── output.mjs                 # 面向读者的产出生成
│   ├── agent-index.mjs            # Agent 检索索引生成
│   └── utils.mjs                  # 共享工具
├── templates/                     # 初始化模板
│   ├── README.md.tpl
│   ├── SKILL.md.tpl
│   ├── CHANGELOG.md
│   ├── pyramid/                   # pyramid 骨架模板
│   └── outputs/                   # output 模板
├── openclaw-plugin/               # OpenClaw 插件
│   ├── openclaw.plugin.json       # 插件清单（配置 schema + UI hints）
│   ├── index.mjs                  # 注册 AI 工具 + CLI + 技能管理
│   ├── package.json
│   └── skills/
│       └── prism-processor/       # cron 自动处理技能
├── cli/                           # 开发工具链
│   └── cli.cjs                    # build, bump, commit, sync, release
├── scripts/                       # 辅助脚本
├── test/                          # 单元测试（24 个测试用例）
├── dist/                          # 构建产物（技能包 zip + skills.json）
├── SKILL.md                       # ClawHub 技能清单
├── install.sh / install.ps1       # 跨平台一键安装脚本
└── CHANGELOG.md
```

### 双入口设计

- **独立 CLI**：`npx js-knowledge-prism <command>`——无需 OpenClaw 环境
- **OpenClaw 插件**：`openclaw prism <command>` + AI 工具——深度集成 Agent 对话

两种入口共享同一套 `lib/` 核心模块，API 配置方式不同（独立 CLI 用 `.env`，插件用 `openclaw.json`），但处理逻辑完全一致。

## 7. CLI 工具

### 独立 CLI

```bash
npx js-knowledge-prism init <dir>                    # 初始化骨架
npx js-knowledge-prism process [--dry-run]            # 增量处理
npx js-knowledge-prism status                         # 查看状态
npx js-knowledge-prism new-perspective <slug>         # 创建新视角
```

### OpenClaw CLI

```bash
openclaw prism init <dir>                             # 初始化
openclaw prism process [--dry-run] [--stage <n>]      # 增量处理
openclaw prism status [--json]                        # 状态查询
openclaw prism new-perspective <slug>                 # 新视角
openclaw prism output --perspective <dir> --template <name>  # 生成产出
openclaw prism agent-index                            # Agent 索引
openclaw prism register <dir>                         # 注册知识库
openclaw prism unregister <dir>                       # 取消注册
openclaw prism registered [--status]                  # 查看注册列表
openclaw prism setup-cron [--every <minutes>]         # 配置 cron
```

## 8. OpenClaw 插件能力

插件注册了丰富的 AI 工具和 CLI 命令，覆盖知识管理全流程。

### AI 工具（14 个）

**核心处理**：

| 工具                          | 功能                                   |
| ----------------------------- | -------------------------------------- |
| `knowledge_prism_process`     | 增量处理（atoms → groups → synthesis） |
| `knowledge_prism_status`      | 知识库状态查询                         |
| `knowledge_prism_process_all` | 批量处理所有已注册知识库               |

**视角管理**：

| 工具                               | 功能                      |
| ---------------------------------- | ------------------------- |
| `knowledge_prism_new_perspective`  | 创建新视角骨架            |
| `knowledge_prism_fill_perspective` | 生成 SCQA / Key Line 内容 |
| `knowledge_prism_expand_kl`        | 展开 Key Line 为完整文档  |

**产出生成**：

| 工具                             | 功能                |
| -------------------------------- | ------------------- |
| `knowledge_prism_output`         | 从视角生成读者产出  |
| `knowledge_prism_list_templates` | 列出可用输出模板    |
| `knowledge_prism_agent_index`    | 生成 Agent 检索索引 |

**多库管理**：

| 工具                              | 功能                     |
| --------------------------------- | ------------------------ |
| `knowledge_prism_register`        | 注册知识库到自动处理列表 |
| `knowledge_prism_unregister`      | 移除知识库注册           |
| `knowledge_prism_list_registered` | 列出所有已注册知识库     |

**技能扩展**：

| 工具                              | 功能               |
| --------------------------------- | ------------------ |
| `knowledge_prism_discover_skills` | 查询扩展技能注册表 |
| `knowledge_prism_install_skill`   | 下载并安装扩展技能 |

### 插件配置

| 选项                  | 默认值                     | 说明                 |
| --------------------- | -------------------------- | -------------------- |
| `baseDir`             | cwd                        | 知识库根目录         |
| `api.baseUrl`         | `http://localhost:8888/v1` | OpenAI 兼容 API 端点 |
| `api.model`           | `default`                  | 模型名称             |
| `api.apiKey`          | `not-needed`               | API Key              |
| `process.batchSize`   | `5`                        | 每批处理 journal 数  |
| `process.temperature` | `0.3`                      | LLM 温度             |
| `process.maxTokens`   | `8192`                     | 单次最大 token 数    |
| `process.timeoutMs`   | `1800000`                  | 请求超时（30 分钟）  |

### 多知识库注册与 Cron

插件支持注册多个知识库，通过 cron 定时任务自动批量处理：

```bash
openclaw prism register docs/prism          # 注册知识库
openclaw prism register docs/another-kb     # 注册第二个
openclaw prism setup-cron --every 60        # 每小时自动处理
```

注册信息存储在 `.openclaw/prism-processor/registry.json` 中，cron 任务调用 `knowledge_prism_process_all` 遍历所有已注册且启用的知识库。

## 9. 扩展技能系统

与 JS-Eyes 类似，Knowledge Prism 也实现了扩展技能系统：

- **技能注册表**：`skills.json` 描述可用的扩展技能
- **发现工具**：`knowledge_prism_discover_skills` 查询注册表
- **安装工具**：`knowledge_prism_install_skill` 下载、解压、安装依赖、注册插件

目前已有的扩展技能：

| 技能              | 功能                          |
| ----------------- | ----------------------------- |
| prism-processor   | cron 自动处理所有已注册知识库 |
| prism-output-blog | 从视角生成博客文章            |

跨平台安装脚本：

```bash
# Linux / macOS
curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash

# Windows PowerShell
irm https://raw.githubusercontent.com/.../install.ps1 | iex
```

## 10. 当日进展

2026-02-24 是项目创建日。主要里程碑：

| 时间  | 进展                                                                            |
| ----- | ------------------------------------------------------------------------------- |
| 22:18 | Initial commit——CLI 工具包首版，核心管线（process/status/init/new-perspective） |

创建日完成了核心 lib 模块实现：

- `process.mjs`：三阶段增量处理管线（atoms → groups → synthesis）
- `status.mjs`：知识库状态统计
- `init.mjs`：骨架初始化（生成完整目录结构 + 配置文件）
- `new-perspective.mjs`：新视角创建
- `config.mjs`：配置加载
- `utils.mjs`：共享工具

以及独立 CLI 入口（`bin/cli.mjs`）、初始化模板（`templates/`）和编程 API。

次日凌晨（2/25 01:20–02:33）紧接着完成了 OpenClaw 插件封装、插件重命名和 Windows 兼容性补丁。

## 11. 版本演化

从创建到目前（2026-03-08），项目已积累 **22 次提交**，发布了一个正式版本：

| 日期  | 主要变更                                                      |
| ----- | ------------------------------------------------------------- |
| 02-24 | 首次提交——核心管线 + CLI                                      |
| 02-25 | OpenClaw 插件封装 + Windows 兼容性                            |
| 02-27 | new-perspective 增强（baseDir 选项）                          |
| 02-28 | .env 加载修复（换行符、编码）                                 |
| 03-01 | **v1.0.0 正式发布**——5 个 AI 工具 + CLI + 技能系统 + 安装脚本 |
| 03-04 | 环境变量引用更新                                              |
| 03-05 | output 命令、骨架生成/验证、prompt 日志、实践日记模板         |
| 03-06 | Agent 索引生成、项目本地 .env 加载                            |
| 03-07 | 多库注册管理 + cron 配置 + 工作区目录解析增强                 |
| 03-08 | 文档清理                                                      |

演化路径：**核心管线 → 插件化 → 视角工具链 → 产出生成 → 多库管理 → 自动化调度**。

---

## 相关文档

| 文档                                    | 日期       | 内容                                 |
| --------------------------------------- | ---------- | ------------------------------------ |
| `knowledge-base-architecture-design.md` | 2026-02-22 | 三层架构的 9 个设计决策              |
| `knowledge-prism-introduction.md`       | 2026-02-23 | 知识棱镜方法论介绍                   |
| `from-notes-to-plugin.md`               | 2026-02-25 | 从散乱笔记到 OpenClaw 插件的完整历程 |
| `plugin-creation-guide.md`              | 2026-02-25 | OpenClaw 插件创建完全指引            |
| `using-knowledge-prism-plugin.md`       | 2026-02-25 | 知识棱镜插件使用指南                 |
