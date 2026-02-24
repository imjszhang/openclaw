# 使用已部署的 js-knowledge-prism 插件：实操指南

> 编写日期：2026-02-25
> 前置阅读：`from-notes-to-plugin.md`（插件的诞生历程）、`plugin-creation-guide.md`（插件机制原理）

---

## 当前部署状态

在写这篇指南时，js-knowledge-prism 插件已完成安装并处于启用状态。以下是从 `D:\.openclaw\openclaw.json` 中提取的关键配置：

```json
"plugins": {
  "enabled": true,
  "load": {
    "paths": ["d:\\github\\my\\js-knowledge-prism\\openclaw-plugin"]
  },
  "entries": {
    "js-knowledge-prism": {
      "enabled": true,
      "config": {
        "api": {
          "baseUrl": "${LOCAL_LAN_BASE_URL}",
          "model": "${LOCAL_LAN_MODEL}",
          "apiKey": "${LOCAL_LAN_API_KEY}"
        }
      }
    }
  },
  "installs": {
    "js-knowledge-prism": {
      "source": "path",
      "sourcePath": "d:\\github\\my\\js-knowledge-prism\\openclaw-plugin",
      "installPath": "d:\\github\\my\\js-knowledge-prism\\openclaw-plugin",
      "version": "1.0.0",
      "installedAt": "2026-02-24T17:36:11.741Z"
    }
  }
}
```

几个要点：

- **加载方式**：`plugins.load.paths` 指定了本地路径，属于最高优先级的 config 来源（优先级 1）
- **安装方式**：`source: "path"` 表示使用 `--link` 模式安装，插件代码仍在原项目目录中，修改即时生效
- **API 配置**：使用环境变量引用（`${LOCAL_LAN_BASE_URL}` 等），实际值在 `.env` 中定义，指向局域网内的本地模型服务

---

## 插件提供的两类能力

### AI 工具（Agent 在对话中调用）

| 工具名                    | 功能                                           | 关键参数                                 |
| ------------------------- | ---------------------------------------------- | ---------------------------------------- |
| `knowledge_prism_process` | 执行增量处理管线（atoms → groups → synthesis） | `baseDir`、`stage`（1/2/3）、`autoWrite` |
| `knowledge_prism_status`  | 查询知识库当前状态统计                         | `baseDir`                                |

### CLI 命令（终端中调用）

```
openclaw prism init <dir>                        初始化知识棱镜骨架
openclaw prism process [选项]                    执行增量处理
openclaw prism status [选项]                     查看状态
openclaw prism new-perspective <slug> [选项]     创建新视角目录
```

---

## 使用方式一：通过 AI Agent 对话使用

这是插件化的核心价值——在与 Agent 的对话中直接触发知识库处理，无需切换到终端。

### 查看状态

在飞书（或其他已绑定渠道）中对 Agent 说：

> 帮我查看一下知识库状态，根目录是 D:/github/fork/openclaw/docs/githubforker

Agent 会调用 `knowledge_prism_status` 工具，返回类似：

```
知识棱镜状态 (D:/github/fork/openclaw/docs/githubforker)

Journal: 25 篇 (11 个日期目录)
Atoms: 18 个文件
Groups: 32 个分组
视角: 1 个
待处理 Journal: 3 篇
未归组 Atom: 2 个
Synthesis 最后修改: 2026-02-25

待处理列表:
  2026-02-25 / from-notes-to-plugin.md
  2026-02-25 / plugin-creation-guide.md
  2026-02-25 / using-knowledge-prism-plugin.md
```

### 执行增量处理

> 对 D:/github/fork/openclaw/docs/githubforker 执行增量处理，全部三个阶段

Agent 会调用 `knowledge_prism_process` 工具，处理完成后返回摘要：

```
处理完成 (baseDir: D:/github/fork/openclaw/docs/githubforker)
- Atoms 处理: 12 个
- Groups 新建: 1, 更新: 3
- Synthesis 更新: 是
```

### 分阶段执行

如果只想提取 atoms 而不做归组和收敛（例如想先人工审查 atoms 质量）：

> 对知识库执行增量处理，只到阶段 1

Agent 调用时会传入 `stage: 1`，仅执行 atoms 提取。

### 参数说明

| 参数        | 类型        | 默认值                      | 说明                                                 |
| ----------- | ----------- | --------------------------- | ---------------------------------------------------- |
| `baseDir`   | string      | 插件配置值或 workspace 路径 | 知识库根目录，必须包含 journal/ 和 pyramid/ 子目录   |
| `stage`     | 1 \| 2 \| 3 | 3                           | 执行到哪个阶段：1=仅 atoms，2=atoms+groups，3=全流程 |
| `autoWrite` | boolean     | true                        | 阶段 2/3 是否自动写入文件                            |

---

## 使用方式二：通过 CLI 终端使用

适合批量操作、调试、或需要看到详细输出的场景。

### 前置条件

CLI 命令通过 `openclaw` 主命令调用，确保 OpenClaw 已在 PATH 中可用。

### 查看状态

```bash
openclaw prism status --base-dir D:/github/fork/openclaw/docs/githubforker
```

输出：

```
知识棱镜根目录: D:/github/fork/openclaw/docs/githubforker

  Journal: 25 篇 (11 个日期目录)
  Atoms:   18 个文件
  Groups:  32 个分组
  视角:    1 个
  待处理:  3 篇 journal
  未归组:  2 个 atom
  Synthesis 最后修改: 2026-02-25
```

JSON 格式输出（便于脚本消费）：

```bash
openclaw prism status --base-dir D:/github/fork/openclaw/docs/githubforker --json
```

### 执行增量处理

完整三阶段处理：

```bash
openclaw prism process --base-dir D:/github/fork/openclaw/docs/githubforker --auto-write
```

CLI 特有的高级选项：

| 选项                | 说明                                |
| ------------------- | ----------------------------------- |
| `--dry-run`         | 只预览待处理内容，不调用模型        |
| `--auto-write`      | 阶段 2/3 自动写入文件（不暂停确认） |
| `--stage <n>`       | 只执行到指定阶段（1/2/3），默认 3   |
| `--file <filename>` | 只处理指定的某篇 journal            |
| `--verbose`         | 显示完整的 LLM prompt（调试用）     |
| `--base-dir <dir>`  | 指定知识库根目录（覆盖插件配置）    |

#### 典型场景

**只处理今天新写的 journal**：

```bash
openclaw prism process --base-dir D:/github/fork/openclaw/docs/githubforker --file from-notes-to-plugin.md --auto-write
```

**预览但不实际执行**（检查哪些文件会被处理）：

```bash
openclaw prism process --base-dir D:/github/fork/openclaw/docs/githubforker --dry-run
```

**只提取 atoms，手动审查后再继续**：

```bash
openclaw prism process --base-dir D:/github/fork/openclaw/docs/githubforker --stage 1 --auto-write
# 审查 pyramid/analysis/atoms/2026-02/ 下的新文件
# 满意后再执行阶段 2-3
openclaw prism process --base-dir D:/github/fork/openclaw/docs/githubforker --auto-write
```

### 初始化新知识库

如果要为一个新目录创建知识棱镜骨架：

```bash
openclaw prism init D:/path/to/new-knowledge-base --name "我的知识库"
```

会生成标准目录结构：

```
new-knowledge-base/
├── .knowledgeprism.json
├── journal/
├── pyramid/
│   ├── analysis/
│   │   ├── atoms/
│   │   │   └── README.md
│   │   ├── groups/
│   │   │   └── INDEX.md
│   │   └── synthesis.md
│   └── structure/
└── outputs/
```

### 创建新视角

```bash
openclaw prism new-perspective deployment-guide --name "从零部署指南"
```

会在 `pyramid/structure/` 下创建视角子目录，包含 SCQA、金字塔树和验证模板。

---

## 增量处理管线详解

理解三个阶段的数据流有助于判断何时需要手动介入。

```
               阶段 1                  阶段 2                    阶段 3
journal/*.md  ──────→  atoms/*.md  ──────→  groups/G*.md  ──────→  synthesis.md
              提取最小               跨文档归组               从观点句收敛
              知识单元               提炼观点句               顶层候选观点
```

### 阶段 1：Atoms 提取

- **输入**：`journal/` 下所有未处理的 `.md` 文件
- **输出**：`pyramid/analysis/atoms/{年-月}/` 下的 atom 文件
- **处理逻辑**：逐篇调用 LLM，将每篇 journal 拆解为不可再分的最小知识单元，每个 atom 带有来源标注
- **幂等性**：已处理过的 journal 不会重复处理（通过 atoms/README.md 中的缩写映射表追踪）

### 阶段 2：Groups 归组

- **输入**：所有 atoms + 现有 groups
- **输出**：`pyramid/analysis/groups/` 下的 G\*.md 文件 + INDEX.md 更新
- **处理逻辑**：LLM 审视新 atoms 和已有分组，决定是合并到现有分组还是创建新分组，每组提炼一个观点句
- **需要注意**：新归组可能改变现有分组的观点句措辞，建议处理后审查 INDEX.md 的变化

### 阶段 3：Synthesis 收敛

- **输入**：所有 groups 的观点句
- **输出**：`pyramid/analysis/synthesis.md` 更新
- **处理逻辑**：从 30+ 个观点句中进一步归纳，产出/更新顶层候选观点列表（S1-S20+）
- **需要注意**：这是最需要人工审查的阶段——顶层候选观点直接影响后续视角的建立

---

## 实际知识库结构参照

当前 `docs/githubforker` 的实际目录结构：

```
docs/githubforker/
├── journal/                          ← 按日期的原始笔记（11 个日期目录，25+ 篇）
│   ├── 2026-01-31/
│   ├── 2026-02-01/
│   ├── ...
│   └── 2026-02-25/
│       ├── from-notes-to-plugin.md
│       ├── plugin-creation-guide.md
│       └── using-knowledge-prism-plugin.md   ← 本文
├── pyramid/                          ← 结构化拆解层
│   ├── analysis/
│   │   ├── atoms/
│   │   │   ├── README.md             ← 缩写映射表（18 个缩写，追踪处理状态）
│   │   │   └── 2026-02/              ← 按月存放 atom 文件
│   │   ├── groups/
│   │   │   ├── INDEX.md              ← 分组总览（G01-G32，32 个分组）
│   │   │   ├── G01-time-vs-logic-organization.md
│   │   │   ├── ...
│   │   │   └── G32-plugin-creation-lifecycle.md
│   │   └── synthesis.md              ← 顶层候选观点（S1-S20）
│   └── structure/                    ← 按视角组织（目前 1 个视角）
└── outputs/                          ← 面向读者的成品文章
```

---

## 配置调优

### 修改 API 配置

如果模型服务地址变更，编辑 `D:\.openclaw\openclaw.json` 中的插件配置：

```json
"js-knowledge-prism": {
  "enabled": true,
  "config": {
    "api": {
      "baseUrl": "http://新地址:端口/v1",
      "model": "新模型名",
      "apiKey": "新密钥"
    }
  }
}
```

或者修改 `.env` 中的环境变量（当前使用 `${LOCAL_LAN_BASE_URL}` 等引用）：

```
LOCAL_LAN_BASE_URL=http://192.168.31.135:8888/v1
LOCAL_LAN_MODEL=unsloth/Qwen3.5-397B-A17B
LOCAL_LAN_API_KEY=sk-...
```

### 调整处理参数

在插件 config 中增加 `process` 节：

```json
"js-knowledge-prism": {
  "enabled": true,
  "config": {
    "api": { ... },
    "process": {
      "batchSize": 5,
      "temperature": 0.3,
      "maxTokens": 8192,
      "timeoutMs": 1800000
    }
  }
}
```

| 参数          | 默认值  | 说明                         |
| ------------- | ------- | ---------------------------- |
| `batchSize`   | 5       | 每批处理的 journal 数量      |
| `temperature` | 0.3     | LLM 采样温度（越低越确定性） |
| `maxTokens`   | 8192    | LLM 单次最大输出 token 数    |
| `timeoutMs`   | 1800000 | 单次 LLM 调用超时（30 分钟） |

### 指定默认 baseDir

如果不想每次都传 `--base-dir`，可以在插件 config 中设置默认值：

```json
"js-knowledge-prism": {
  "config": {
    "baseDir": "D:/github/fork/openclaw/docs/githubforker",
    "api": { ... }
  }
}
```

设置后，CLI 和 AI 工具调用都会使用此默认路径。

---

## 日常使用工作流

### 典型一天的知识库维护

```
1. 写完一篇 journal
       ↓
2. 对 Agent 说"查一下知识库状态"
       ↓                              确认待处理数量
3. 对 Agent 说"执行增量处理"
       ↓                              等待 LLM 处理完成
4. 审查 git diff
       ↓                              检查新 atoms 质量、groups 变化、synthesis 更新
5. 满意后 git commit
```

### 批量补处理

积累了多篇未处理 journal 时，一次性全量处理：

```bash
openclaw prism process --base-dir D:/github/fork/openclaw/docs/githubforker --auto-write --verbose
```

### 只处理特定文件

```bash
openclaw prism process --base-dir D:/github/fork/openclaw/docs/githubforker --file plugin-creation-guide.md --auto-write
```

---

## 故障排查

### 插件未加载

```bash
openclaw plugins list
```

如果列表中没有 `js-knowledge-prism`，检查：

1. `openclaw.json` 中 `plugins.enabled` 是否为 `true`
2. `plugins.load.paths` 中的路径是否存在
3. 该路径下是否有 `openclaw.plugin.json`
4. `plugins.entries.js-knowledge-prism.enabled` 是否为 `true`

### LLM 调用超时

原因通常是模型服务不可达或响应过慢。检查：

1. `.env` 中的 `LOCAL_LAN_BASE_URL` 是否可访问
2. 模型是否已启动
3. 如果 journal 特别长，考虑增大 `timeoutMs`

### baseDir 路径错误

症状："找不到 journal 目录"或"知识库结构不完整"。

确认目标目录包含以下子目录：

```
{baseDir}/
├── journal/
└── pyramid/
    └── analysis/
        ├── atoms/
        ├── groups/
        └── synthesis.md
```

如果是全新目录，先用 `openclaw prism init <dir>` 初始化骨架。

---

## 相关文档

| 文档                                                  | 内容                                 |
| ----------------------------------------------------- | ------------------------------------ |
| `from-notes-to-plugin.md`                             | 从散乱笔记到 OpenClaw 插件的完整历程 |
| `plugin-creation-guide.md`                            | OpenClaw 插件系统深度分析与创建指引  |
| `knowledge-base-architecture-design.md`（2026-02-22） | 三层架构的 9 个设计决策              |
| `knowledge-prism-introduction.md`（2026-02-23）       | 知识棱镜方法论介绍                   |
