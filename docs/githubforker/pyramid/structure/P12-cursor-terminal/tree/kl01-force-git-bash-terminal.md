# KL22: 必须将 Windows 下 Cursor 的默认终端强制切换为 Git Bash，以提供原生的 Unix 命令执行环境

> 所属视角：P12-cursor-terminal
> 上层论点：必须将 Windows 下 Cursor 的默认终端强制切换为 Git Bash，以提供原生的 Unix 命令执行环境，从而彻底消除语法兼容性障碍并保障 AI 工作流的连续性。

## 支撑论点

### 22.1: 默认 PowerShell 与 Unix 命令语法不兼容是导致 AI Agent 生成命令频繁失败的根本原因

- 逻辑顺序：问题背景
- 引用 atoms: CT-01, CT-02
- 引用 groups: G22

Windows 下 Cursor 默认使用 PowerShell，其命令语法（如 `rm`, `grep`, `export`）与 AI Agent 基于 Linux 环境生成的 Unix 命令严重冲突，直接导致执行报错。切换为 Git Bash 可立即获得类 Unix Shell 体验，大幅降低因语法差异造成的 Agent 执行失败率。

### 22.2: 通过修改 settings.json 配置终端配置文件是切换 Git Bash 的核心实施步骤

- 逻辑顺序：配置实施
- 引用 atoms: CT-03, CT-04, CT-05, CT-06, CT-07
- 引用 groups: G22

用户需定位 `%APPDATA%\Cursor\User\settings.json`，在 `terminal.integrated.profiles.windows` 中添加 Git Bash 路径（注意双写反斜杠），并将其设为 `defaultProfile`。配置完成后必须执行 `Developer: Reload Window` 使设置生效，且需关闭旧终端重新新建才能看到变化。

### 22.3: 适配 Git Bash 的路径格式与别名配置是保障高级工作流顺畅运行的关键细节

- 逻辑顺序：细节处理
- 引用 atoms: CT-09, CT-10, CT-13, CT-14, CT-11
- 引用 groups: G22

Git Bash 使用 `/x/` 映射 Windows 盘符，需在 `.bashrc` 中配置项目别名（如 openclaw）并 source 生效；同时可通过 `cmd //c` 调用 Windows 特有命令。此外，建议在 `.cursor/rules` 中显式要求 Agent 使用 Git Bash 兼容语法，以双重保障执行成功率。

### 22.4: 验证终端提示符变更及掌握回退方案是确保配置安全可靠的最后防线

- 逻辑顺序：验证与回退
- 引用 atoms: CT-12, CT-15
- 引用 groups: G22

配置成功的标志是终端提示符显示 `MINGW64` 且 `ls -la` 等命令正常运行。若遇兼容性问题，可通过将 `terminal.integrated.defaultProfile.windows` 改回 `"PowerShell"` 并重新加载窗口快速回退至初始状态。

## 论点间关系

本 Key Line 遵循“问题背景 → 配置实施 → 细节处理 → 验证与回退”的操作流程顺序。首先明确 PowerShell 不兼容的痛点，接着提供具体的 JSON 配置步骤，然后补充路径映射和别名等进阶用法，最后给出验证标准和应急回退方案，形成完整的闭环操作指南。

---
