# 日记：OPENCLAW_STATE_DIR 与默认 Workspace 路径不一致导致 read 工具 ENOENT

> 来源：[../../../../journal/2026-02-26/workspace-path-openclaw-state-dir-mismatch.md](../../../../journal/2026-02-26/workspace-path-openclaw-state-dir-mismatch.md)
> 缩写：OP

## Atoms

| 编号  | 类型 | 内容                                                                                                       | 原文定位     |
| ----- | ---- | ---------------------------------------------------------------------------------------------------------- | ------------ |
| OP-01 | 事实 | OpenClaw 中 State 目录由 `OPENCLAW_STATE_DIR` 控制，默认 Workspace 目录由 `OPENCLAW_HOME` 或系统家目录控制 | 根因分析     |
| OP-02 | 事实 | `resolveDefaultAgentWorkspaceDir` 函数解析逻辑完全不依赖 `OPENCLAW_STATE_DIR` 环境变量                     | 根因分析     |
| OP-03 | 事实 | 默认 Workspace 解析优先级顺序为：`OPENCLAW_HOME` > `HOME` > `USERPROFILE` > `os.homedir()`                 | 根因分析     |
| OP-04 | 经验 | 仅设置 `OPENCLAW_STATE_DIR` 会导致 read/memory 等工具仍访问 C 盘默认路径从而报 ENOENT 错误                 | 现象         |
| OP-05 | 步骤 | 在 `openclaw.json` 的 `agents.defaults.workspace` 字段显式指定路径可覆盖默认解析逻辑                       | 解决方案     |
| OP-06 | 事实 | Agent Workspace 解析优先级为：Agent 配置 > 默认 Agent 配置 > `resolveDefaultAgentWorkspaceDir()`           | 解决方案     |
| OP-07 | 经验 | 设置 `OPENCLAW_HOME` 环境变量可一次性将所有基于 home 的路径（含 workspace）迁移到指定磁盘                  | 其他可选方案 |
| OP-08 | 判断 | 代码层面让默认 workspace 跟随 state 目录是可行优化方向，但本次修复选择通过配置文件解决                     | 其他可选方案 |
