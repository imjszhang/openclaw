# js-eyes install.sh 安装脚本修复说明

> 记录日期：2026-02-28
> 背景：用户通过 `curl -fsSL https://js-eyes.com/install.sh | JS_EYES_SKILL=js-search-x bash` 安装 js-search-x 子技能后，OpenClaw 配置校验失败，`openclaw daemon restart` 等命令无法执行，报错 `plugin not found: js-search-x`。本文档记录根因分析与 install.sh 的修复方案。

---

## 目录

1. [问题现象](#1-问题现象)
2. [根因分析](#2-根因分析)
3. [必须修复：解压后权限收紧](#3-必须修复解压后权限收紧)
4. [可选改进](#4-可选改进)
5. [改动清单与 Patch 示例](#5-改动清单与-patch-示例)
6. [已安装环境的快速修复](#6-已安装环境的快速修复)

---

## 1. 问题现象

执行 `curl -fsSL https://js-eyes.com/install.sh | JS_EYES_SKILL=js-search-x bash` 安装 js-search-x 子技能后：

- 脚本安装成功，输出注册提示
- 用户（或 Agent）已将路径加入 `~/.openclaw/openclaw.json` 的 `plugins.load.paths` 和 `plugins.entries`
- 执行 `openclaw daemon restart` 时失败，报错：

```
Invalid config at /Users/.../openclaw.json:
- plugins.entries.js-search-x: plugin not found: js-search-x
```

- `openclaw doctor` 同时提示：`blocked plugin candidate: world-writable path (.../openclaw-plugin/index.mjs, mode=666)`

---

## 2. 根因分析

### 2.1 权限链路

1. **zip 包内文件权限**：`js-search-x-skill.zip` 中部分文件（如 `index.mjs`、`openclaw.plugin.json`）权限为 `0666`（world-writable）。
2. **解压行为**：`unzip` 或 `python3 zipfile.extractall()` 会保留 zip 内的权限，解压后文件仍为 `-rw-rw-rw-`。
3. **OpenClaw 安全检查**：`src/plugins/discovery.ts` 中 `checkPathStatAndPermissions()` 会检查插件路径及根目录下所有文件的 `mode`，若 `(modeBits & 0o002) !== 0`（即 other 可写），则判定为不安全并拒绝加载该插件。
4. **配置校验失败**：插件因 world-writable 被拒绝 → 不进入 `knownIds` → `plugins.entries.js-search-x` 引用了「不存在的」插件 → 配置校验报 `plugin not found`。
5. **命令提前退出**：依赖配置校验的命令（如 `daemon restart`）在启动时即失败，导致 gateway 无法重启。

### 2.2 主技能 vs 子技能

- **js-eyes 主技能**：通常通过 ClawHub 或主技能 zip 安装，解压/复制后文件权限多为 644，可正常加载。
- **js-search-x 子技能**：由 install.sh 从 `js-search-x-skill.zip` 解压得到，zip 内权限为 666，解压后未修正，故触发 OpenClaw 的 world-writable 拦截。

---

## 3. 必须修复：解压后权限收紧

在 install.sh 中，**每次解压完成后**立即收紧权限，确保所有文件和目录不再具有 world-writable 位。

### 3.1 子技能安装分支（约第 100–120 行）

在 `unzip`/`python3` 解压之后、`if [ -f "${TARGET}/package.json" ]` 之前插入：

```bash
# 收紧权限：OpenClaw 拒绝加载 world-writable 的插件路径
find "$TARGET" -type f -exec chmod 644 {} + 2>/dev/null || true
find "$TARGET" -type d -exec chmod 755 {} + 2>/dev/null || true
```

### 3.2 主技能安装分支（约第 195–235 行）

在 `extract_zip` 调用之后、`info "Installing dependencies..."` 之前插入同样的两行（若有多个解压分支，每个解压后各加一次）：

```bash
# 收紧权限：OpenClaw 拒绝加载 world-writable 的插件路径
find "$TARGET" -type f -exec chmod 644 {} + 2>/dev/null || true
find "$TARGET" -type d -exec chmod 755 {} + 2>/dev/null || true
```

### 3.3 说明

- `find ... -type f -exec chmod 644 {} +`：文件改为 644（rw-r--r--）
- `find ... -type d -exec chmod 755 {} +`：目录改为 755（rwxr-xr-x）
- `2>/dev/null || true`：避免 find/chmod 在极端情况（如无权限）下导致脚本失败
- 建议放在解压完成之后、`npm install` 之前，以避免 npm 或后续步骤再次修改权限

---

## 4. 可选改进

### 4.1 默认安装路径

**现状**：`INSTALL_DIR="${JS_EYES_DIR:-./skills}"` 使用相对路径 `./skills`，依赖执行时的 CWD。若用户在 `~`、`/tmp` 等目录执行，子技能会装到错误位置，与 OpenClaw 期望的 `~/.openclaw/workspace/skills/` 不一致。

**建议**：

```bash
INSTALL_DIR="${JS_EYES_DIR:-${HOME:-$(eval echo ~$(whoami))}/.openclaw/workspace/skills}"
```

或保持 `./skills`，但在文档中明确要求用户：

```bash
cd ~/.openclaw/workspace && curl -fsSL ... | JS_EYES_SKILL=js-search-x bash
```

### 4.2 自动写入 openclaw.json

**现状**：脚本仅打印手动配置步骤，易出现路径写错或漏配。

**建议**：参考 `js_eyes_install_skill` 工具逻辑，在安装完成后：

- 检测 `~/.openclaw/openclaw.json` 是否存在
- 若存在，将 `plugins.load.paths` 和 `plugins.entries` 的变更合并写入
- 输出变更摘要与后续步骤（如 `openclaw daemon restart`）

实现时需注意 JSON 格式、备份与幂等性。

---

## 5. 改动清单与 Patch 示例

### 5.1 必须改动

| 文件              | 位置                   | 改动内容                           |
| ----------------- | ---------------------- | ---------------------------------- |
| `docs/install.sh` | 子技能解压后           | 新增 `find ... chmod 644/755` 两行 |
| `docs/install.sh` | 主技能解压后（各分支） | 同上                               |

### 5.2 Patch 示例（基于 raw.githubusercontent.com/imjszhang/js-eyes/main/docs/install.sh）

**子技能分支**（unzip / python3 解压之后）：

```diff
  info "Extracting..."
  if command -v unzip >/dev/null 2>&1; then
   unzip -qo "$SKILL_ZIP" -d "$TARGET"
  elif command -v python3 >/dev/null 2>&1; then
   python3 -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "$SKILL_ZIP" "$TARGET"
  else
   err "unzip or python3 is required."; exit 1
  fi
+
+ # Fix permissions: OpenClaw rejects world-writable plugin paths
+ find "$TARGET" -type f -exec chmod 644 {} + 2>/dev/null || true
+ find "$TARGET" -type d -exec chmod 755 {} + 2>/dev/null || true

  if [ -f "${TARGET}/package.json" ]; then
```

**主技能分支**（`extract_zip` 或解压逻辑完成后，`npm install` 之前）：

```diff
  extract_zip "$SKILL_ZIP" "$TARGET"
+ find "$TARGET" -type f -exec chmod 644 {} + 2>/dev/null || true
+ find "$TARGET" -type d -exec chmod 755 {} + 2>/dev/null || true
  info "Installing dependencies..."
```

（主技能若从 archive.zip 解压后再 cp 到 TARGET，则在 cp 完成后对 `$TARGET` 执行上述 find 命令即可。）

---

## 6. 已安装环境的快速修复

若用户已经通过旧版 install.sh 安装了 js-search-x，且遇到 `plugin not found`，可先手动修正权限再重启：

```bash
# 将 PLUGIN_DIR 替换为实际路径，例如：
PLUGIN_DIR="$HOME/.openclaw/workspace/skills/js-eyes/skills/js-search-x"

find "$PLUGIN_DIR" -type f -exec chmod 644 {} +
find "$PLUGIN_DIR" -type d -exec chmod 755 {} +
```

然后执行：

```bash
openclaw daemon restart
```

---

## 参考

- OpenClaw 插件发现逻辑：`src/plugins/discovery.ts`（`checkPathStatAndPermissions`、`path_world_writable`）
- 配置校验逻辑：`src/config/validation.ts`（`plugin not found` 报错）
- js-eyes 技能发现与安装设计：`docs/githubforker/journal/2026-02-26/skill-discovery-system-design-and-implementation.md`
