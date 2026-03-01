# 日记：OPENCLAW_STATE_DIR 与默认 Workspace 路径不一致导致 read 工具 ENOENT

> 记录日期：2026-02-26
> 问题：设置 OPENCLAW_STATE_DIR 到 D 盘后，read 工具仍尝试读取 C 盘下的 MEMORY.md

---

## 现象

日志中出现：

```
[tools] read failed: ENOENT: no such file or directory, access 'C:\Users\Helix\.openclaw\workspace\MEMORY.md'
```

环境变量已将 `.openclaw` 相关路径配置到 D 盘，但 read 工具仍访问 `C:\Users\Helix\.openclaw\workspace\MEMORY.md`。

---

## 根因分析

OpenClaw 中 **State 目录** 和 **默认 Workspace 目录** 的解析逻辑是分离的：

| 路径类型       | 环境变量                                   | 默认值                  | 代码位置                                                        |
| -------------- | ------------------------------------------ | ----------------------- | --------------------------------------------------------------- |
| State 目录     | `OPENCLAW_STATE_DIR`                       | `~/.openclaw`           | `src/config/paths.ts` → `resolveStateDir()`                     |
| 默认 Workspace | `OPENCLAW_HOME`（或 `HOME`/`USERPROFILE`） | `~/.openclaw/workspace` | `src/agents/workspace.ts` → `resolveDefaultAgentWorkspaceDir()` |

**关键点**：`resolveDefaultAgentWorkspaceDir` 使用 `path.join(home, ".openclaw", "workspace")`，其中 `home` 来自 `resolveRequiredHomeDir`，优先级为：

- `OPENCLAW_HOME` → `HOME` → `USERPROFILE` → `os.homedir()`

**`OPENCLAW_STATE_DIR` 不参与默认 workspace 的解析**。因此即使设置了 `OPENCLAW_STATE_DIR=D:\.openclaw`，默认 agent 的 workspace 仍会解析为 `C:\Users\Helix\.openclaw\workspace`（因为 `USERPROFILE` 在 C 盘）。

read 工具、memory 工具等均以 `workspaceDir` 为根解析相对路径（如 `MEMORY.md`），故会去 C 盘读取。

---

## 解决方案（配置层面，不修改代码）

在 `openclaw.json` 中显式指定 workspace 路径，使配置优先于默认解析：

```json
{
  "agents": {
    "defaults": {
      "workspace": "D:/.openclaw/workspace",
      ...
    }
  }
}
```

`resolveAgentWorkspaceDir` 的优先级为：

1. Agent 配置中的 `workspace`
2. 默认 agent 的 `agents.defaults.workspace`
3. 上述均未配置时，才回退到 `resolveDefaultAgentWorkspaceDir()`

因此设置 `agents.defaults.workspace` 后，read/memory 等工具会使用 D 盘路径。

---

## 其他可选方案

- **`OPENCLAW_HOME`**：设置 `OPENCLAW_HOME=D:\你的路径`，所有基于 home 的路径（包括 workspace）都会迁移到 D 盘。
- **代码层面**：可考虑在 `resolveDefaultAgentWorkspaceDir` 中，当 `OPENCLAW_STATE_DIR` 已设置时，使用 `path.join(stateDir, "workspace")`，使默认 workspace 与 state 目录保持一致（本次未采用）。

---

## 相关代码位置

- `src/agents/workspace.ts`：`resolveDefaultAgentWorkspaceDir`
- `src/agents/agent-scope.ts`：`resolveAgentWorkspaceDir`（配置优先）
- `src/config/paths.ts`：`resolveStateDir`
- `src/infra/home-dir.ts`：`resolveRequiredHomeDir`
- `src/agents/pi-tool-definition-adapter.ts`：`[tools]` 日志前缀来源
