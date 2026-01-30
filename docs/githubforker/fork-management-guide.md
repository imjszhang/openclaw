# OpenClaw Fork 管理与生产部署指南

> 编写日期：2026-01-31  
> 适用场景：官方频繁更新 + 个人定制需求 + 生产环境部署

---

## 目录

1. [场景分析](#1-场景分析)
2. [Git 工作流策略](#2-git-工作流策略)
3. [上游同步工作流](#3-上游同步工作流)
4. [生产环境部署](#4-生产环境部署)
5. [定制化最佳实践](#5-定制化最佳实践)
6. [稳定性保障措施](#6-稳定性保障措施)
7. [升级策略选择](#7-升级策略选择)
8. [自动化建议](#8-自动化建议)
9. [总结](#9-总结)

---

## 1. 场景分析

### 1.1 核心矛盾

| 需求 | 挑战 |
|------|------|
| **官方更新频繁** | OpenClaw 处于 pre-1.0 阶段，迭代快速 |
| **个人定制需求** | 需要保持自己的修改不被上游覆盖 |
| **生产环境稳定性** | 需要可靠运行，不能频繁出问题 |

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

| 分支 | 用途 | 更新策略 |
|------|------|----------|
| `main` | 与上游保持同步 | `git fetch upstream && git merge upstream/main` |
| `production` | 生产部署分支 | 从 main rebase/cherry-pick + 定制提交 |
| `feature/*` | 定制功能开发 | 完成后合并到 production |

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

| 文件类型 | 处理建议 |
|----------|----------|
| `package.json` | 保留上游依赖版本，合并你的定制依赖 |
| `tsconfig.json` | 通常保留上游配置 |
| 核心源码文件 | 仔细对比，保留你的 `// CUSTOM` 标记代码 |
| 配置示例文件 | 可以直接接受上游版本 |

---

## 4. 生产环境部署

学会同步后，下一步是把项目部署运行起来。

### 4.1 安装方式选择

| 方式 | 优点 | 缺点 | 推荐场景 |
|------|------|------|----------|
| **源码安装 (git)** | 完全可控，易于定制 | 需要编译 | ✅ Fork 定制场景 |
| npm 全局安装 | 简单，自动更新 | 无法定制 | 普通用户 |
| Docker | 隔离环境 | 资源开销大 | 服务器部署 |

**推荐使用源码安装**，因为需要定制。

### 4.2 部署流程

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

# 4. 启动/重启 Gateway
pnpm openclaw gateway restart

# 5. 验证
pnpm openclaw health
pnpm openclaw channels status --probe
```

### 4.3 部署脚本示例

创建部署脚本 `scripts/deploy.sh`：

```bash
#!/bin/bash
set -e

echo "=== OpenClaw 生产部署 ==="

# 切换到项目目录
cd "$(dirname "$0")/.."

# 拉取最新代码
echo ">>> 拉取 production 分支..."
git checkout production
git pull origin production

# 安装依赖
echo ">>> 安装依赖..."
pnpm install

# 构建
echo ">>> 构建项目..."
pnpm build
pnpm ui:build

# 诊断
echo ">>> 运行诊断..."
pnpm openclaw doctor --non-interactive

# 重启 Gateway
echo ">>> 重启 Gateway..."
pnpm openclaw gateway restart

# 等待启动
sleep 3

# 验证
echo ">>> 验证服务状态..."
pnpm openclaw health

echo "=== 部署完成 ==="
```

### 4.4 macOS 特定配置

如果在 macOS 上部署：

```bash
# Gateway 通过 macOS 菜单栏应用运行
# 重启方式：
./scripts/restart-mac.sh

# 或者通过 launchctl
launchctl kickstart -k gui/$UID/bot.molt.gateway

# 查看日志
./scripts/clawlog.sh --follow
```

### 4.5 Linux 特定配置

```bash
# 安装 systemd 服务
pnpm openclaw gateway install

# 管理服务
systemctl --user start openclaw-gateway
systemctl --user stop openclaw-gateway
systemctl --user restart openclaw-gateway
systemctl --user status openclaw-gateway

# 查看日志
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

| 文件 | 用途 |
|------|------|
| `AGENTS.md` | 操作指令 + "记忆" |
| `SOUL.md` | 人格、边界、语气 |
| `TOOLS.md` | 工具使用说明 |
| `BOOTSTRAP.md` | 首次运行仪式（完成后删除）|
| `IDENTITY.md` | 代理名称/风格/表情符号 |
| `USER.md` | 用户档案 + 偏好称呼 |

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

| 层级 | 定制方式 | 同步难度 | 推荐度 |
|------|----------|----------|--------|
| 配置 | `~/.openclaw/` 文件 | ⭐ 无影响 | ✅ 优先 |
| 工作区 | `~/.openclaw/workspace/` | ⭐ 无影响 | ✅ 优先 |
| 技能 | `workspace/skills/` 或全局 skills | ⭐ 无影响 | ✅ 优先 |
| 插件 | `extensions/` 独立目录 | ⭐⭐ 低冲突 | ✅ 推荐 |
| 源码 | 核心代码修改 | ⭐⭐⭐⭐ 高冲突 | ⚠️ 谨慎 |

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

| 策略 | 同步频率 | 适用场景 | 风险 |
|------|----------|----------|------|
| **保守策略** | 每月一次 | 生产环境稳定优先 | 低 |
| **积极策略** | 每周一次 | 需要新功能，可接受偶尔问题 | 中 |
| **按需策略** | 需要时 | 功能已满足当前需求 | 最低 |

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
    - cron: '0 9 * * 1'  # 每周一上午 9 点
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

- 更新指南：https://docs.openclaw.ai/install/updating
- Gateway 配置：https://docs.openclaw.ai/gateway/configuration
- 插件开发：https://docs.openclaw.ai/extensions
- 故障排除：https://docs.openclaw.ai/gateway/troubleshooting

---

*文档编写：2026-01-31*
