# Cursor 终端配置指南：将默认 Shell 切换为 Git Bash

> 来源：[../../../../journal/2026-02-08/cursor-terminal-config-guide.md](../../../../journal/2026-02-08/cursor-terminal-config-guide.md)
> 缩写：CT

## Atoms

| 编号  | 类型 | 内容                                                                                              | 原文定位                   |
| ----- | ---- | ------------------------------------------------------------------------------------------------- | -------------------------- |
| CT-01 | 事实 | Windows 下 Cursor 默认终端为 PowerShell，与 Unix/Linux 命令（rm -rf, grep, export, &&）不兼容     | 一、问题背景               |
| CT-02 | 判断 | 切换为 Git Bash 可获得类 Unix Shell 体验，大幅减少 AI Agent 生成命令时的执行失败                  | 概述                       |
| CT-03 | 步骤 | 确认 Git Bash 安装位置：`Get-Command git \| Select-Object -ExpandProperty Source`                 | 二、前置条件               |
| CT-04 | 步骤 | 推荐配置方法：Ctrl+Shift+P → Open User Settings (JSON) → 添加 terminalintegrated.profiles.windows | 三、方法一                 |
| CT-05 | 经验 | settings.json 中路径反斜杠需双写（\\），如 `D:\\Program Files\\Git\\bin\\bash.exe`                | 三、方法一                 |
| CT-06 | 事实 | 配置完成后需执行 `Developer: Reload Window` 重新加载窗口使设置生效                                | 三、方法一                 |
| CT-07 | 事实 | settings.json 文件位置：Windows 为 `%APPDATA%\Cursor\User\settings.json`                          | 五、settings.json 文件位置 |
| CT-08 | 经验 | 切换后已打开的旧终端不会自动变更，需关闭后用 Ctrl+` 新建终端才生效                                | 六、常见问题 Q1            |
| CT-09 | 经验 | Git Bash 中 Windows 特有命令（ipconfig, systeminfo）可用 `cmd //c 命令` 方式调用                  | 六、常见问题 Q2            |
| CT-10 | 事实 | Git Bash 路径格式：Windows 盘符映射为 `/x/`，如 `D:\github` → `/d/github`                         | 六、常见问题 Q3            |
| CT-11 | 经验 | AI Agent 可能独立于集成终端设置，可在 `.cursor/rules` 中添加规则要求使用 Git Bash 兼容语法        | 六、常见问题 Q5            |
| CT-12 | 步骤 | 回退方法：将 `terminal.integrated.defaultProfile.windows` 改为 `"PowerShell"` 并重新加载          | 七、回退方法               |
| CT-13 | 步骤 | 配置 openclaw 别名：在 `~/.bashrc` 中添加 `alias openclaw="pnpm --dir /d/... openclaw"`           | 八、切换后的命令别名配置   |
| CT-14 | 经验 | ~/.bashrc 修改后需执行 `source ~/.bashrc` 立即生效，Git Bash 使用 Unix 风格路径                   | 八、切换后的命令别名配置   |
| CT-15 | 事实 | 验证成功标志：终端提示符显示 `MINGW64` 而非 `PS`，且 `ls -la`、`grep`、`cat` 等命令可正常运行     | 四、验证配置               |
