# Cursor 终端配置指南：将默认 Shell 切换为 Git Bash

## 概述

在 Windows 环境下使用 Cursor IDE 时，默认集成终端为 PowerShell。PowerShell 与常见的 Unix/Linux 命令存在较多不兼容之处（如 `rm -rf`、`grep`、`cat`、`export` 等），在进行日常开发、运行脚本或使用 AI Agent 工具时容易出错。

将默认终端切换为 **Git Bash** 可以获得类 Unix 的 Shell 体验，大幅减少命令兼容性问题。

## 一、问题背景

### PowerShell 常见的命令兼容性问题

| 场景 | Bash 命令 | PowerShell 行为 |
|------|-----------|----------------|
| 删除目录 | `rm -rf dist/` | `rm` 是 `Remove-Item` 的别名，不支持 `-rf` 参数 |
| 环境变量 | `export NODE_ENV=production` | 不支持 `export`，需使用 `$env:NODE_ENV="production"` |
| 链式命令 | `command1 && command2` | PowerShell 5.x 不支持 `&&` 运算符 |
| 文本搜索 | `grep "pattern" file` | `grep` 不存在，需用 `Select-String` |
| 查看文件 | `cat file \| head -20` | `head` 不存在，需用 `Get-Content -TotalCount` |
| 路径分隔符 | `/path/to/file` | Windows 默认使用 `\`，部分工具不兼容 |

这些差异在 AI Agent 执行命令时尤为明显——Agent 默认生成的是 Bash 风格命令，在 PowerShell 中直接运行会频繁失败。

## 二、前置条件

### 确认 Git Bash 已安装

Git for Windows 自带 Git Bash。运行以下命令确认安装位置：

```powershell
# 在 PowerShell 中查找 Git 安装路径
Get-Command git | Select-Object -ExpandProperty Source
```

Git Bash 的 `bash.exe` 通常位于以下路径之一：

- `C:\Program Files\Git\bin\bash.exe`
- `D:\Program Files\Git\bin\bash.exe`
- 自定义安装路径下的 `Git\bin\bash.exe`

如果尚未安装 Git for Windows，请前往 [https://git-scm.com/download/win](https://git-scm.com/download/win) 下载安装。

## 三、配置步骤

### 方法一：直接编辑 settings.json（推荐）

1. 在 Cursor 中按 `Ctrl+Shift+P` 打开命令面板
2. 输入 `Preferences: Open User Settings (JSON)` 并回车
3. 在 JSON 文件中添加以下配置：

```json
{
    "terminal.integrated.profiles.windows": {
        "Git Bash": {
            "path": "D:\\Program Files\\Git\\bin\\bash.exe",
            "icon": "terminal-bash"
        }
    },
    "terminal.integrated.defaultProfile.windows": "Git Bash"
}
```

> **注意**：请将 `path` 替换为你实际的 `bash.exe` 路径，路径中的反斜杠需要双写（`\\`）。

4. 保存文件
5. 按 `Ctrl+Shift+P`，执行 `Developer: Reload Window` 重新加载窗口

### 方法二：通过 GUI 设置

1. 按 `Ctrl+,` 打开设置界面
2. 搜索 `terminal default profile windows`
3. 在下拉菜单中选择 `Git Bash`
4. 如果列表中没有 Git Bash，先搜索 `terminal profiles windows`，手动添加 Git Bash 配置

### settings.json 完整示例

以下是一个包含终端配置的完整 `settings.json` 示例：

```json
{
    "window.commandCenter": true,
    "git.autofetch": true,
    "git.enableSmartCommit": true,
    "terminal.integrated.profiles.windows": {
        "PowerShell": {
            "source": "PowerShell",
            "icon": "terminal-powershell"
        },
        "Git Bash": {
            "path": "D:\\Program Files\\Git\\bin\\bash.exe",
            "icon": "terminal-bash"
        },
        "Command Prompt": {
            "path": "C:\\Windows\\System32\\cmd.exe",
            "icon": "terminal-cmd"
        }
    },
    "terminal.integrated.defaultProfile.windows": "Git Bash"
}
```

## 四、验证配置

### 1. 检查终端类型

打开新终端（`` Ctrl+` ``），终端提示符应显示类似：

```
Administrator@DESKTOP-XXXXX MINGW64 /d/github/fork/openclaw
$
```

而不是 PowerShell 的：

```
PS D:\github\fork\openclaw>
```

### 2. 测试常用命令

```bash
# 以下命令应能正常运行
echo $SHELL
ls -la
grep --version
cat --version
rm --help
```

### 3. 测试 Git 操作

```bash
git status
git log --oneline -5
git branch -a
```

## 五、settings.json 文件位置

| 操作系统 | 路径 |
|----------|------|
| Windows | `%APPDATA%\Cursor\User\settings.json` |
| macOS | `~/Library/Application Support/Cursor/User/settings.json` |
| Linux | `~/.config/Cursor/User/settings.json` |

在 Windows 上，`%APPDATA%` 通常展开为 `C:\Users\<用户名>\AppData\Roaming`。

## 六、常见问题

### Q1: 切换后旧终端仍然是 PowerShell

已打开的终端不会自动切换。关闭旧终端，用 `` Ctrl+` `` 新建终端即可。

### Q2: Git Bash 中某些 Windows 命令无法使用

Git Bash 基于 MSYS2/MinGW 环境，部分 Windows 特有命令（如 `ipconfig`、`systeminfo`）可以直接在 Git Bash 中使用，但需要写全路径或使用 `cmd //c` 包装：

```bash
# 直接调用（通常可行）
ipconfig

# 如果不行，通过 cmd 中转
cmd //c ipconfig
```

### Q3: 路径格式问题

Git Bash 使用 Unix 风格路径，Windows 盘符映射规则为：

| Windows 路径 | Git Bash 路径 |
|-------------|--------------|
| `C:\Users\Admin` | `/c/Users/Admin` |
| `D:\github\project` | `/d/github/project` |

### Q4: 如何临时使用 PowerShell

即使默认终端改为 Git Bash，你仍然可以随时切换：

1. 点击终端面板右上角的 `+` 按钮旁的下拉箭头
2. 选择 `PowerShell` 即可新建一个 PowerShell 终端

### Q5: Agent 执行命令时仍使用 PowerShell

Cursor 中 AI Agent 使用的 Shell 可能独立于集成终端设置。如果 Agent 仍然使用 PowerShell，可以在聊天中明确指示 Agent 使用 bash 风格命令，或在项目的 `.cursor/rules` 中添加规则：

```markdown
在 Windows 环境下，请使用 Git Bash 兼容的命令语法。
避免使用 PowerShell 特有的语法如 $env:、Select-String 等。
```

## 七、回退方法

如果需要恢复 PowerShell 为默认终端：

1. 打开 `settings.json`
2. 将 `terminal.integrated.defaultProfile.windows` 改为 `"PowerShell"`：

```json
{
    "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

3. 保存并重新加载窗口

## 八、相关资源

- [Git for Windows 下载](https://git-scm.com/download/win)
- [VS Code / Cursor 终端配置文档](https://code.visualstudio.com/docs/terminal/profiles)
- [Git Bash 与 MSYS2 环境说明](https://www.msys2.org/)
