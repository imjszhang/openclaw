# OpenClaw Fork 管理与生产部署指南

> 编写日期：2026-01-31  
> 适用场景：官方频繁更新 + 个人定制需求 + 生产环境部署

---

## 目录

1. [场景分析](#1-场景分析)
2. [Git 工作流策略](#2-git-工作流策略)
3. [上游同步工作流](#3-上游同步工作流)
4. [生产环境部署](#4-生产环境部署)
   - [4.4.1 开发模式命令别名配置](#441-开发模式命令别名配置)
5. [定制化最佳实践](#5-定制化最佳实践)
6. [稳定性保障措施](#6-稳定性保障措施)
7. [升级策略选择](#7-升级策略选择)
8. [自动化建议](#8-自动化建议)
9. [总结](#9-总结)

---

## 1. 场景分析

### 1.1 核心矛盾

| 需求               | 挑战                                 |
| ------------------ | ------------------------------------ |
| **官方更新频繁**   | OpenClaw 处于 pre-1.0 阶段，迭代快速 |
| **个人定制需求**   | 需要保持自己的修改不被上游覆盖       |
| **生产环境稳定性** | 需要可靠运行，不能频繁出问题         |

### 1.2 解决思路

采用 **Fork + 分层定制架构**，将定制内容分层管理，最大化减少与上游的冲突，同时保持生产环境稳定。

---

## 2. Git 工作流策略

### 2.1 分支架构

```
┌─────────────────────────────────────────────────────────┐
│  upstream/main (官方仓库)                                │
│  └── 定期 fetch + 审查后 merge/rebase                    │
└────────────────────────┬────────────────────────────────┘
                         │ merge (定期)
                         ▼
┌─────────────────────────────────────────────────────────┐
│  origin/main (Fork 主分支)                               │
│  └── 保持与上游同步，但不包含个人定制                     │
└────────────────────────┬────────────────────────────────┘
                         │ branch
                         ▼
┌─────────────────────────────────────────────────────────┐
│  origin/production (生产分支)                            │
│  └── 包含所有个人定制，稳定版本用于部署                   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 分支职责

| 分支         | 用途           | 更新策略                                        |
| ------------ | -------------- | ----------------------------------------------- |
| `main`       | 与上游保持同步 | `git fetch upstream && git merge upstream/main` |
| `production` | 生产部署分支   | 从 main rebase/cherry-pick + 定制提交           |
| `feature/*`  | 定制功能开发   | 完成后合并到 production                         |

### 2.3 初始化设置

```bash
# 添加上游远程
git remote add upstream https://github.com/openclaw/openclaw.git

# 验证远程配置
git remote -v
# origin    https://github.com/<your-username>/openclaw.git (fetch)
# origin    https://github.com/<your-username>/openclaw.git (push)
# upstream  https://github.com/openclaw/openclaw.git (fetch)
# upstream  https://github.com/openclaw/openclaw.git (push)

# 创建生产分支
git checkout -b production
git push -u origin production
```

---

## 3. 上游同步工作流

Fork 管理的核心技能是保持与上游同步。在开始定制之前，先掌握同步流程。

### 3.1 标准同步流程

```bash
# 1. 获取上游更新
git fetch upstream

# 2. 切换到 main 分支并合并上游
git checkout main
git merge upstream/main

# 3. 推送到 origin
git push origin main

# 4. 切换到生产分支并 rebase
git checkout production
git rebase main

# 5. 解决冲突（如有）
# ... 手动解决冲突 ...
git add .
git rebase --continue

# 6. 测试
pnpm install
pnpm build
pnpm test

# 7. 确认无误后推送
git push origin production --force-with-lease
```

### 3.2 选择性同步（推荐）

如果不想合并所有上游更新，可以使用 cherry-pick：

```bash
# 查看上游新提交
git log upstream/main --oneline -20

# 选择性应用特定提交
git checkout production
git cherry-pick <commit-hash>
```

### 3.3 处理合并冲突

冲突通常发生在以下文件：

| 文件类型        | 处理建议                                |
| --------------- | --------------------------------------- |
| `package.json`  | 保留上游依赖版本，合并你的定制依赖      |
| `tsconfig.json` | 通常保留上游配置                        |
| 核心源码文件    | 仔细对比，保留你的 `// CUSTOM` 标记代码 |
| 配置示例文件    | 可以直接接受上游版本                    |

---

## 4. 生产环境部署

学会同步后，下一步是把项目部署运行起来。

### 4.1 安装方式选择

| 方式               | 优点               | 缺点       | 推荐场景         |
| ------------------ | ------------------ | ---------- | ---------------- |
| **源码安装 (git)** | 完全可控，易于定制 | 需要编译   | ✅ Fork 定制场景 |
| npm 全局安装       | 简单，自动更新     | 无法定制   | 普通用户         |
| Docker             | 隔离环境           | 资源开销大 | 服务器部署       |

**推荐使用源码安装**，因为需要定制。

### 4.2 首次部署流程

首次部署需要安装 Gateway 服务：

```bash
# 1. 拉取生产分支
cd /path/to/openclaw
git checkout production
git pull origin production

# 2. 安装依赖和构建
pnpm install
pnpm build
pnpm ui:build

# 3. 运行诊断
pnpm openclaw doctor

# 4. 设置 Gateway 模式（首次必需，否则网关无法启动）
pnpm openclaw config set gateway.mode local

# 5. 设置 Gateway Token（Dashboard 访问认证必需）
pnpm openclaw config set gateway.auth.token "$(openssl rand -hex 16)"

# 6. 配置 AI 模型（二选一）
#    方式 A：交互式向导（推荐）
pnpm openclaw onboard

#    方式 B：直接设置 API 密钥
pnpm openclaw config set env.ANTHROPIC_API_KEY "sk-ant-..."
pnpm openclaw config set agents.defaults.model.primary "anthropic/claude-sonnet-4-5"

# 7. 安装并启动 Gateway 服务
pnpm openclaw gateway install --force

# 8. 验证
pnpm openclaw health
pnpm openclaw channels status --probe
pnpm openclaw models status  # 检查 AI 模型配置

# 9. 获取带 Token 的 Dashboard URL
pnpm openclaw dashboard --no-open
```

> **重要**：
>
> - `gateway.mode` 必须在安装服务前设置，否则网关会报 "Missing config" 错误。`local` 表示网关在本机运行，只监听 loopback 地址。
> - `gateway.auth.token` 必须设置，否则 Dashboard 会显示 "unauthorized: gateway token missing" 错误。设置后用 `openclaw dashboard --no-open` 获取带 `?token=...` 参数的URL。
> - **AI 模型配置**是必需的，否则无法与 AI 对话。推荐使用 `openclaw onboard` 向导交互式配置。

### 4.2.1 AI 模型与 Agent 配置

AI 模型和 Agent 配置是 OpenClaw 的核心，详细内容请参考独立文档：

📄 **[AI 模型与 Agent 配置指南](./model-agent-config-guide.md)**

该文档包含：

- **支持的 AI 提供商**：20+ 个内置和自定义提供商（Anthropic、OpenAI、Google、Moonshot 等）
- **认证方式**：API Key vs 订阅认证（Claude/ChatGPT/Google/Qwen 订阅）
- **常用配置示例**：各提供商的详细配置命令
- **Agent 概念**：单 Agent 与多 Agent 配置
- **场景推荐**：根据需求选择最佳配置

**快速开始**（交互式向导）：

```bash
pnpm openclaw onboard
```

**常用命令**：

```bash
# 查看可用模型
pnpm openclaw models list --all

# 检查模型状态
pnpm openclaw models status

# 查看 Agent 列表
pnpm openclaw agents list
```

**场景速查**：

| 使用场景 | 推荐配置                      |
| -------- | ----------------------------- |
| 最强能力 | `anthropic/claude-opus-4-5`   |
| 性价比   | `anthropic/claude-sonnet-4-5` |
| 免费试用 | OpenRouter free tier          |
| 本地运行 | `ollama/llama3.3`             |
| 中国访问 | `moonshot/kimi-k2.5`          |

> 详细配置请查看 [model-agent-config-guide.md](./model-agent-config-guide.md)

### 4.2.2 消息渠道配置

配置好 AI 模型后，下一步是连接消息渠道（WhatsApp、Telegram 等）。详细内容请参考独立文档：

📄 **[消息渠道部署指南](./channel-deployment-guide.md)**

该文档包含：

- **渠道概览**：支持的渠道对比（Telegram、WhatsApp、Discord、Signal 等）
- **详细部署步骤**：每个渠道的配置和登录流程
- **DM 策略**：pairing、allowlist、open 模式说明
- **群组配置**：群组策略和 @提及设置
- **故障排除**：常见问题和解决方案

**快速开始**（推荐 Telegram）：

```bash
# 1. 设置 Bot Token（从 @BotFather 获取）
pnpm openclaw config set channels.telegram.botToken "你的token"
pnpm openclaw config set channels.telegram.enabled true

# 2. 重启 Gateway
pnpm openclaw gateway restart

# 3. 检查状态
pnpm openclaw channels status
```

**渠道推荐**：

| 渠道     | 难度      | 说明                  |
| -------- | --------- | --------------------- |
| Telegram | ⭐ 最简单 | 只需 BotFather token  |
| WhatsApp | ⭐⭐ 中等 | 需要扫码 + 真实手机号 |
| Discord  | ⭐⭐ 中等 | 需要创建应用          |

> 详细配置请查看 [channel-deployment-guide.md](./channel-deployment-guide.md)

### 4.3 后续更新流程

服务已安装后，更新代码只需重启：

```bash
# 1. 拉取最新代码
git checkout production
git pull origin production

# 2. 重新构建
pnpm install
pnpm build

# 3. 重启 Gateway（服务已安装时可用）
pnpm openclaw gateway restart

# 4. 验证
pnpm openclaw health
pnpm openclaw models status  # 确认 AI 模型仍然可用
```

> **注意**：
>
> - `gateway restart` 只能重启已安装的服务。如果提示服务未加载，需要先运行 `gateway install --force`。
> - 如果 AI 认证过期（OAuth token），需要重新运行 `openclaw onboard` 或刷新 setup-token。

### 4.4 前台运行模式（开发/调试）

如果不想安装系统服务，可以直接前台运行：

```bash
# 首先确保配置已设置（或使用 --allow-unconfigured 跳过检查）
pnpm openclaw config set gateway.mode local

# 前台运行（Ctrl+C 停止）
pnpm openclaw gateway run --bind loopback --port 18789

# 或者后台运行
nohup pnpm openclaw gateway run --bind loopback --port 18789 > /tmp/openclaw-gateway.log 2>&1 &

# 快速临时运行（跳过配置检查，仅用于测试）
pnpm openclaw gateway run --bind loopback --port 18789 --allow-unconfigured
```

这种方式适合：

- 开发调试
- 临时测试
- 不需要开机自启动的场景

### 4.4.1 开发模式命令别名配置

在开发模式下，每次输入 `pnpm openclaw ...` 比较繁琐。可以配置命令别名，直接使用 `openclaw` 命令。

#### macOS / Linux (Zsh)

```bash
# 添加到 ~/.zshrc
echo 'alias openclaw="pnpm --dir /path/to/your/openclaw openclaw"' >> ~/.zshrc

# 生效
source ~/.zshrc

# 验证
openclaw --version
```

#### macOS / Linux (Bash)

```bash
# 添加到 ~/.bashrc
echo 'alias openclaw="pnpm --dir /path/to/your/openclaw openclaw"' >> ~/.bashrc

# 生效
source ~/.bashrc
```

#### Windows PowerShell

```powershell
# 查看 PowerShell 配置文件路径
echo $PROFILE

# 创建配置文件（如果不存在）
if (!(Test-Path -Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }

# 添加函数别名
Add-Content -Path $PROFILE -Value @'
function openclaw {
    pnpm --dir "C:\path\to\your\openclaw" openclaw $args
}
'@

# 重新加载配置
. $PROFILE
```

#### Windows CMD

CMD 不支持持久化别名，但可以使用以下方法：

**方法 1：创建批处理文件**

```batch
:: 创建 openclaw.bat 并放入 PATH 目录（如 C:\Windows 或自定义目录）
@echo off
pnpm --dir "C:\path\to\your\openclaw" openclaw %*
```

**方法 2：使用 doskey（仅当前会话有效）**

```batch
doskey openclaw=pnpm --dir "C:\path\to\your\openclaw" openclaw $*
```

#### 配置对比

| 系统               | 方式      | 持久化 | 配置文件                  |
| ------------------ | --------- | ------ | ------------------------- |
| macOS/Linux        | alias     | ✅     | `~/.zshrc` 或 `~/.bashrc` |
| Windows PowerShell | function  | ✅     | `$PROFILE`                |
| Windows CMD        | .bat 文件 | ✅     | PATH 中的 .bat 文件       |
| Windows CMD        | doskey    | ❌     | 仅当前会话                |

> **提示**：配置完成后，可以直接使用 `openclaw channels status --probe` 等命令，无需再加 `pnpm` 前缀。

### 4.5 系统服务管理

Gateway 支持作为系统服务运行（Linux systemd / macOS launchd / Windows schtasks）：

```bash
# 服务管理命令（跨平台通用）
pnpm openclaw gateway install --force  # 安装服务
pnpm openclaw gateway restart          # 重启服务
pnpm openclaw gateway stop             # 停止服务
pnpm openclaw gateway status           # 查看状态
pnpm openclaw gateway uninstall        # 卸载服务

# 查看日志
tail -f ~/.openclaw/logs/gateway.log
```

**Linux systemd 额外命令**：

```bash
# 使用 systemctl 管理
systemctl --user start openclaw-gateway
systemctl --user stop openclaw-gateway
systemctl --user restart openclaw-gateway
systemctl --user status openclaw-gateway

# 查看 systemd 日志
journalctl --user -u openclaw-gateway -f
```

---

## 5. 定制化最佳实践

项目运行起来后，可以开始按需定制。定制应该**分层处理**，优先使用不改动源码的方式。

### 5.1 第一层：配置级定制（优先使用）

这些不需要改代码，升级最无痛：

```bash
# 配置文件位置
~/.openclaw/openclaw.json      # 主配置
~/.openclaw/credentials/       # 认证凭据
~/.openclaw/workspace/         # 工作区
```

**工作区可定制文件**：

| 文件           | 用途                       |
| -------------- | -------------------------- |
| `AGENTS.md`    | 操作指令 + "记忆"          |
| `SOUL.md`      | 人格、边界、语气           |
| `TOOLS.md`     | 工具使用说明               |
| `BOOTSTRAP.md` | 首次运行仪式（完成后删除） |
| `IDENTITY.md`  | 代理名称/风格/表情符号     |
| `USER.md`      | 用户档案 + 偏好称呼        |

**同步影响**：⭐ 无影响

### 5.2 第二层：技能定制

技能系统支持多级覆盖：

```
优先级（高 → 低）:
<workspace>/skills → ~/.openclaw/skills → bundled skills
```

**创建自定义技能**：

```bash
# 在工作区创建技能目录
mkdir -p ~/.openclaw/workspace/skills/my-skill

# 技能格式
cat > ~/.openclaw/workspace/skills/my-skill/skill.md << 'EOF'
---
name: my-skill
description: 我的自定义技能描述
metadata: {"openclaw":{"requires":{"bins":[],"env":[]}}}
---

<!-- 技能指令内容 -->
EOF
```

**同步影响**：⭐ 无影响

### 5.3 第三层：插件/扩展定制

项目支持插件系统，可以在 `extensions/` 下添加自己的扩展：

```
extensions/
├── my-custom-channel/     # 自定义渠道
│   ├── index.ts
│   ├── package.json
│   └── openclaw.plugin.json
├── my-custom-tool/        # 自定义工具
└── ...
```

**优势**：插件相对独立，上游更新时冲突概率低

**同步影响**：⭐⭐ 低冲突

### 5.4 第四层：源码级定制（谨慎使用）

如果必须修改核心代码：

1. **尽量保持改动最小化**
2. **添加清晰的注释标记**：

```typescript
// CUSTOM: <描述改动原因>
// 原始代码: <被替换的代码>
const myCustomLogic = ...
// END CUSTOM
```

3. **集中在特定文件**，避免散落到处
4. **记录所有改动位置**，便于同步时检查

**同步影响**：⭐⭐⭐⭐ 高冲突

### 5.5 定制层级对比

| 层级   | 定制方式                          | 同步难度        | 推荐度  |
| ------ | --------------------------------- | --------------- | ------- |
| 配置   | `~/.openclaw/` 文件               | ⭐ 无影响       | ✅ 优先 |
| 工作区 | `~/.openclaw/workspace/`          | ⭐ 无影响       | ✅ 优先 |
| 技能   | `workspace/skills/` 或全局 skills | ⭐ 无影响       | ✅ 优先 |
| 插件   | `extensions/` 独立目录            | ⭐⭐ 低冲突     | ✅ 推荐 |
| 源码   | 核心代码修改                      | ⭐⭐⭐⭐ 高冲突 | ⚠️ 谨慎 |

---

## 6. 稳定性保障措施

### 6.1 版本标签管理

```bash
# 每次稳定部署后打标签
git tag -a prod-$(date +%Y.%m.%d) -m "生产稳定版本 $(date +%Y-%m-%d)"
git push origin prod-$(date +%Y.%m.%d)

# 查看所有生产标签
git tag -l "prod-*"
```

### 6.2 回滚流程

```bash
# 查看可用的稳定版本
git tag -l "prod-*" --sort=-version:refname

# 回滚到指定版本
git checkout prod-2026.01.30

# 重新构建和部署
pnpm install
pnpm build
pnpm openclaw gateway restart
```

### 6.3 配置备份

```bash
# 备份配置目录
tar -czvf openclaw-config-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/credentials/ \
  ~/.openclaw/workspace/

# 恢复配置
tar -xzvf openclaw-config-backup-YYYYMMDD.tar.gz -C ~/
```

### 6.4 健康检查

定期运行健康检查：

```bash
# 完整健康检查
pnpm openclaw doctor

# 快速状态检查
pnpm openclaw health

# 通道状态检查（带探测）
pnpm openclaw channels status --probe

# 节点状态检查
pnpm openclaw nodes status
```

---

## 7. 升级策略选择

### 7.1 策略对比

| 策略         | 同步频率 | 适用场景                   | 风险 |
| ------------ | -------- | -------------------------- | ---- |
| **保守策略** | 每月一次 | 生产环境稳定优先           | 低   |
| **积极策略** | 每周一次 | 需要新功能，可接受偶尔问题 | 中   |
| **按需策略** | 需要时   | 功能已满足当前需求         | 最低 |

### 7.2 推荐：保守策略

对于生产环境，推荐采用**保守策略**：

1. **每月审查上游 changelog**

   ```bash
   # 查看上游更新
   git fetch upstream
   git log upstream/main --oneline --since="1 month ago"
   ```

2. **选择性同步重要更新**
   - 安全修复：立即同步
   - Bug 修复：评估后同步
   - 新功能：等稳定后再考虑

3. **测试环境先行**
   - 在测试环境验证后再部署到生产

### 7.3 升级检查清单

- [ ] 阅读上游 CHANGELOG
- [ ] 检查是否有破坏性变更
- [ ] 在测试环境验证
- [ ] 备份当前配置
- [ ] 打上版本标签
- [ ] 执行同步和部署
- [ ] 验证所有功能正常
- [ ] 监控 24 小时

---

## 8. 自动化建议

### 8.1 上游更新通知

创建 GitHub Action 自动检查上游更新：

```yaml
# .github/workflows/check-upstream.yml
name: Check Upstream Updates

on:
  schedule:
    - cron: "0 9 * * 1" # 每周一上午 9 点
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Add upstream remote
        run: git remote add upstream https://github.com/openclaw/openclaw.git

      - name: Fetch upstream
        run: git fetch upstream

      - name: Check for updates
        run: |
          COMMITS=$(git log HEAD..upstream/main --oneline | wc -l)
          echo "上游有 $COMMITS 个新提交"
          if [ "$COMMITS" -gt 0 ]; then
            echo "## 上游更新摘要" >> $GITHUB_STEP_SUMMARY
            echo "" >> $GITHUB_STEP_SUMMARY
            git log HEAD..upstream/main --oneline >> $GITHUB_STEP_SUMMARY
          fi
```

### 8.2 自动化部署脚本

```bash
#!/bin/bash
# scripts/auto-deploy.sh

set -e

# 配置
DEPLOY_BRANCH="production"
NOTIFY_URL=""  # 可选：Webhook 通知 URL

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

notify() {
    if [ -n "$NOTIFY_URL" ]; then
        curl -s -X POST "$NOTIFY_URL" -d "message=$1" || true
    fi
}

# 主流程
log "开始自动部署..."
notify "🚀 开始部署 OpenClaw"

cd "$(dirname "$0")/.."

# 拉取更新
git checkout "$DEPLOY_BRANCH"
git pull origin "$DEPLOY_BRANCH"

# 构建
pnpm install
pnpm build

# 测试（可选）
# pnpm test

# 部署
pnpm openclaw gateway restart

# 验证
sleep 5
if pnpm openclaw health > /dev/null 2>&1; then
    log "部署成功！"
    notify "✅ OpenClaw 部署成功"
else
    log "部署失败，请检查日志"
    notify "❌ OpenClaw 部署失败"
    exit 1
fi
```

---

## 9. 总结

### 9.1 核心原则

1. **配置优先**：尽量把定制推到配置层和插件层
2. **减少源码改动**：源码改动越少，同步越容易
3. **定期同步**：不要积累太多上游更新
4. **测试先行**：生产环境部署前充分测试
5. **版本管理**：使用标签管理稳定版本，便于回滚

### 9.2 推荐工作流

```
日常开发:
  定制需求 → 优先使用配置/技能/插件 → 必要时修改源码

定期维护 (每月):
  审查上游更新 → 选择性同步 → 测试 → 部署 → 打标签

紧急修复:
  Cherry-pick 安全修复 → 测试 → 立即部署
```

### 9.3 相关文档

**本系列文档：**

- [AI 模型与 Agent 配置指南](./model-agent-config-guide.md)
- [消息渠道部署指南](./channel-deployment-guide.md)
- [openclaw doctor 诊断指南](./openclaw-doctor-guide.md)

**官方文档：**

- 更新指南：https://docs.openclaw.ai/install/updating
- Gateway 配置：https://docs.openclaw.ai/gateway/configuration
- 消息渠道：https://docs.openclaw.ai/channels
- 插件开发：https://docs.openclaw.ai/extensions
- 故障排除：https://docs.openclaw.ai/gateway/troubleshooting

---

_文档编写：2026-01-31_
