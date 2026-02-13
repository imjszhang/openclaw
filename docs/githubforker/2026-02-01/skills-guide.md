# OpenClaw 技能系统指南

本文档介绍 OpenClaw 项目中内置可配置的技能系统，包括技能的配置方法以及如何增加新技能。

## 一、技能系统概述

技能（Skills）是 OpenClaw 的核心扩展机制，它为 AI Agent 提供了专业化的知识、工作流程和工具集成。技能可以理解为"领域专家指南"——它们将通用 AI 转变为具备特定领域知识的专业 Agent。

### 技能的作用

1. **专业化工作流程** - 特定领域的多步骤操作流程
2. **工具集成** - 与特定 CLI 工具、API 或文件格式的交互指南
3. **领域知识** - 公司特定知识、数据库 schema、业务逻辑
4. **资源捆绑** - 脚本、参考文档和模板等资源

### 技能的结构

每个技能是一个目录，包含必需的 `SKILL.md` 文件和可选的资源：

```
skill-name/
├── SKILL.md            # 必需：技能定义文件
├── scripts/            # 可选：可执行脚本（Python/Bash）
├── references/         # 可选：参考文档
└── assets/             # 可选：模板、图片等资源
```

### SKILL.md 格式

每个 `SKILL.md` 文件由两部分组成：

```markdown
---
name: skill-name
description: 技能描述，说明何时使用此技能
metadata: { "openclaw": { "emoji": "🔧", "requires": { "bins": ["tool"] } } }
homepage: https://example.com
---

# 技能标题

这里是技能的详细使用说明...
```

**前置元数据（Frontmatter）字段：**

| 字段          | 必需 | 说明                          |
| ------------- | ---- | ----------------------------- |
| `name`        | ✓    | 技能名称（小写，使用连字符）  |
| `description` | ✓    | 技能描述，触发条件说明        |
| `metadata`    | 否   | OpenClaw 扩展元数据（见下方） |
| `homepage`    | 否   | 技能相关工具/服务的主页       |

**metadata.openclaw 字段：**

```json5
{
  openclaw: {
    emoji: "🔧", // 技能图标
    always: false, // 是否总是加载（跳过过滤）
    primaryEnv: "API_KEY", // 主要环境变量名
    os: ["darwin", "linux"], // 支持的操作系统
    requires: {
      bins: ["gh"], // 必需的二进制（全部满足）
      anyBins: ["npm", "pnpm"], // 必需的二进制（任一满足）
      env: ["GITHUB_TOKEN"], // 必需的环境变量
      config: ["browser.enabled"], // 必需的配置项
    },
    install: [
      // 安装选项
      {
        id: "brew",
        kind: "brew",
        formula: "gh",
        bins: ["gh"],
        label: "Install GitHub CLI (brew)",
      },
    ],
  },
}
```

---

## 二、内置技能列表

OpenClaw 在 `skills/` 目录下提供了约 60+ 个内置技能，按类别分组如下：

### 开发工具类

| 技能           | 描述                         | 依赖 |
| -------------- | ---------------------------- | ---- |
| `github`       | 使用 `gh` CLI 与 GitHub 交互 | gh   |
| `coding-agent` | 代码编写辅助                 | -    |
| `canvas`       | Canvas 画布操作              | -    |
| `tmux`         | Tmux 终端会话管理            | tmux |

### 笔记和文档

| 技能          | 描述                | 依赖     |
| ------------- | ------------------- | -------- |
| `apple-notes` | Apple 备忘录操作    | macOS    |
| `bear-notes`  | Bear 笔记应用集成   | bear     |
| `obsidian`    | Obsidian 知识库管理 | obsidian |
| `notion`      | Notion 文档操作     | -        |
| `nano-pdf`    | PDF 处理            | -        |

### 通信和消息

| 技能          | 描述                      | 依赖        |
| ------------- | ------------------------- | ----------- |
| `discord`     | Discord 消息发送          | 配置        |
| `slack`       | Slack 工作区集成          | 配置        |
| `imsg`        | iMessage 消息发送         | macOS       |
| `bluebubbles` | BlueBubbles iMessage 桥接 | bluebubbles |
| `wacli`       | WhatsApp CLI 工具         | wacli       |

### 媒体处理

| 技能                 | 描述                    | 依赖        |
| -------------------- | ----------------------- | ----------- |
| `openai-image-gen`   | OpenAI DALL-E 图像生成  | API Key     |
| `nano-banana-pro`    | Banana Pro 图像生成     | API Key     |
| `video-frames`       | 视频帧提取              | ffmpeg      |
| `openai-whisper`     | 本地 Whisper 语音转文字 | whisper     |
| `openai-whisper-api` | Whisper API 语音转文字  | API Key     |
| `sherpa-onnx-tts`    | Sherpa ONNX 文字转语音  | sherpa-onnx |

### 系统集成

| 技能           | 描述               | 依赖     |
| -------------- | ------------------ | -------- |
| `1password`    | 1Password 密码管理 | op       |
| `peekaboo`     | macOS UI 自动化    | peekaboo |
| `session-logs` | 会话日志查看       | -        |

### 生活服务

| 技能           | 描述         | 依赖   |
| -------------- | ------------ | ------ |
| `weather`      | 天气查询     | -      |
| `food-order`   | 外卖订餐     | -      |
| `goplaces`     | 地点搜索     | -      |
| `local-places` | 本地商家搜索 | Python |

### 智能家居

| 技能             | 描述                 | 依赖           |
| ---------------- | -------------------- | -------------- |
| `openhue`        | Philips Hue 灯光控制 | openhue        |
| `sonoscli`       | Sonos 音响控制       | sonoscli       |
| `spotify-player` | Spotify 播放控制     | spotify_player |

### 任务管理

| 技能              | 描述            | 依赖   |
| ----------------- | --------------- | ------ |
| `apple-reminders` | Apple 提醒事项  | macOS  |
| `things-mac`      | Things 任务管理 | things |
| `trello`          | Trello 看板管理 | -      |

### AI 服务

| 技能        | 描述                  | 依赖   |
| ----------- | --------------------- | ------ |
| `gemini`    | Gemini CLI 一次性问答 | gemini |
| `summarize` | 文本总结              | -      |
| `oracle`    | Oracle 预测           | -      |

---

## 三、技能配置方法

### 3.1 配置文件位置

技能配置存储在 `~/.openclaw/openclaw.json` 的 `skills` 字段中：

```json5
{
  skills: {
    // Bundled 技能白名单（仅影响内置技能）
    allowBundled: ["gemini", "peekaboo", "github"],

    // 加载配置
    load: {
      extraDirs: ["~/my-skills"], // 额外技能目录
      watch: true, // 监听文件变化
      watchDebounceMs: 250, // 防抖延迟
    },

    // 安装偏好
    install: {
      preferBrew: true, // 优先使用 Homebrew
      nodeManager: "pnpm", // npm | pnpm | yarn | bun
    },

    // 各技能的单独配置
    entries: {
      gemini: {
        enabled: true,
        apiKey: "YOUR_API_KEY",
      },
      "openai-image-gen": {
        enabled: true,
        env: {
          OPENAI_API_KEY: "sk-xxx",
        },
      },
      "custom-skill": {
        enabled: false, // 禁用此技能
      },
    },
  },
}
```

### 3.2 CLI 命令

```bash
# 列出所有技能
openclaw skills list

# 列出可用技能（满足所有依赖）
openclaw skills list --eligible

# 显示详细信息（包括缺失的依赖）
openclaw skills list --verbose

# 查看单个技能详情
openclaw skills info github

# 检查技能状态
openclaw skills check

# JSON 输出
openclaw skills list --json
```

### 3.3 技能过滤机制

技能在加载时会经过以下过滤条件：

1. **配置启用状态** - `entries[skill].enabled` 为 `false` 则跳过
2. **Bundled 白名单** - 如配置了 `allowBundled`，仅加载白名单中的内置技能
3. **操作系统检查** - `metadata.os` 必须包含当前平台
4. **必需二进制检查** - `requires.bins` 中的所有工具必须存在
5. **任一二进制检查** - `requires.anyBins` 中至少一个工具存在
6. **必需环境变量** - `requires.env` 中的变量必须设置
7. **必需配置项** - `requires.config` 中的配置项必须启用

### 3.4 技能加载优先级

技能从多个目录加载，后加载的同名技能会覆盖先加载的：

1. **Extra 目录**（最低优先级）- `skills.load.extraDirs` 配置的目录
2. **Bundled 技能** - `skills/` 目录（随安装包提供）
3. **Managed 技能** - `~/.openclaw/skills/` 用户共享技能
4. **Workspace 技能**（最高优先级）- `<workspace>/skills/` 工作区技能
5. **Plugin 技能** - 插件提供的技能

---

## 四、创建新技能

### 4.1 使用 skill-creator 初始化

推荐使用内置的 `skill-creator` 技能来创建新技能：

```bash
# 基本初始化
python3 skills/skill-creator/scripts/init_skill.py my-skill --path skills/

# 带资源目录
python3 skills/skill-creator/scripts/init_skill.py my-skill --path skills/ --resources scripts,references

# 带示例文件
python3 skills/skill-creator/scripts/init_skill.py my-skill --path skills/ --resources scripts --examples
```

### 4.2 手动创建技能

创建技能目录和 `SKILL.md` 文件：

```bash
mkdir -p skills/my-skill
```

编写 `skills/my-skill/SKILL.md`：

````markdown
---
name: my-skill
description: 我的自定义技能，用于执行特定任务。当用户需要 XXX 时使用此技能。
metadata: { "openclaw": { "emoji": "🎯", "requires": { "bins": ["my-tool"] } } }
---

# 我的技能

## 快速开始

使用示例：

```bash
my-tool --action do-something
```
````

## 常用命令

- `my-tool list` - 列出资源
- `my-tool create <name>` - 创建资源
- `my-tool delete <id>` - 删除资源

## 注意事项

- 确保已安装 my-tool
- 需要配置环境变量 MY_API_KEY

````

### 4.3 技能编写最佳实践

#### 保持简洁

- **Context 窗口是公共资源** - 技能与系统提示、对话历史共享上下文
- **假设 AI 已经很聪明** - 只添加 AI 不知道的信息
- **用示例代替冗长解释** - 简洁的代码示例比长篇解释更有效

#### 渐进式披露

技能采用三级加载：

1. **元数据** - 始终在上下文中（~100 词）
2. **SKILL.md 正文** - 技能触发时加载（<5k 词）
3. **资源文件** - 按需加载（无限制）

```markdown
# PDF 处理

## 快速开始
[基本示例]

## 高级功能
- **表单填充**: 参见 [references/forms.md](references/forms.md)
- **API 参考**: 参见 [references/api.md](references/api.md)
````

#### 设置合适的自由度

| 自由度 | 使用场景                 | 实现方式           |
| ------ | ------------------------ | ------------------ |
| 高     | 多种方法有效，依赖上下文 | 文本指导           |
| 中     | 存在首选模式，允许变化   | 伪代码/带参数脚本  |
| 低     | 操作脆弱，一致性关键     | 具体脚本，少量参数 |

### 4.4 添加依赖检查

如果技能依赖外部工具，配置 metadata：

```yaml
metadata: { "openclaw": { "requires": { "bins": ["required-tool"], "anyBins": [ # 全部必需
                "npm",
                "pnpm",
              ], "env": ["API_KEY"], "config": [ # 任一满足 # 必需环境变量
                "feature.enabled",
              ] }, "install": [{ "id": "brew", "kind": "brew", "formula": "my-tool", "bins": ["my-tool"], "label": "Install my-tool (brew)" }, { "id": "npm", "kind": "node", "package": "my-tool", "bins": ["my-tool"], "label": "Install my-tool (npm)" }] } } # 必需配置项
```

### 4.5 打包和分发

使用打包脚本创建可分发的 `.skill` 文件：

```bash
python3 skills/skill-creator/scripts/package_skill.py skills/my-skill

# 指定输出目录
python3 skills/skill-creator/scripts/package_skill.py skills/my-skill ./dist
```

打包脚本会自动验证：

- YAML frontmatter 格式
- 技能命名规范
- 描述完整性
- 文件组织结构

---

## 五、技能位置总结

| 位置      | 路径                  | 说明                 | 优先级   |
| --------- | --------------------- | -------------------- | -------- |
| Bundled   | `skills/`             | 内置技能（随安装包） | 低       |
| Managed   | `~/.openclaw/skills/` | 用户共享技能         | 中       |
| Workspace | `<workspace>/skills/` | 工作区技能           | 高       |
| Extra     | 配置的 `extraDirs`    | 额外技能目录         | 最低     |
| Plugin    | 插件目录              | 插件提供的技能       | 依赖声明 |

---

## 六、常见问题

### Q: 如何禁用某个内置技能？

在配置中设置：

```json
{
  "skills": {
    "entries": {
      "skill-name": { "enabled": false }
    }
  }
}
```

### Q: 如何只启用特定的内置技能？

使用白名单：

```json
{
  "skills": {
    "allowBundled": ["github", "gemini", "peekaboo"]
  }
}
```

### Q: 如何为技能设置 API Key？

两种方式：

```json
{
  "skills": {
    "entries": {
      "gemini": {
        "apiKey": "your-key" // 使用 primaryEnv 映射
      },
      "other-skill": {
        "env": {
          "CUSTOM_API_KEY": "your-key" // 直接设置环境变量
        }
      }
    }
  }
}
```

### Q: 如何查看技能缺失哪些依赖？

```bash
openclaw skills info skill-name
openclaw skills list --verbose
```

### Q: 技能不生效怎么办？

1. 运行 `openclaw skills check` 检查状态
2. 确认依赖已安装（bins、env、config）
3. 检查是否被 `allowBundled` 白名单过滤
4. 查看 `enabled` 配置是否为 false

---

## 七、相关文档

- [技能 CLI 文档](https://docs.openclaw.ai/cli/skills)
- [ClawdHub 技能市场](https://clawdhub.com)
- [配置参考](https://docs.openclaw.ai/configuration)
