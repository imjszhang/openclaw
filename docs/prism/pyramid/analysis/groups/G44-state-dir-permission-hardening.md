# G44: 状态目录权限加固需通过 security audit 检测与自动修复，保障配置与凭据不被其他用户篡改或读取

> ~/.openclaw 存放配置、凭据、会话，若对「其他用户」可写可读则存在篡改和隐私泄露风险，需执行 chmod/icacls 收紧权限。

## 包含的 Atoms

| 编号  | 来源                                | 内容摘要                                                                                          |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| SP-01 | openclaw-security-permissions-guide | 状态目录 ~/.openclaw 存放配置、凭据、会话、认证，若对「其他用户」可写可读则存在篡改和隐私泄露风险 |
| SP-02 | openclaw-security-permissions-guide | openclaw security audit --deep 检测权限问题，--fix 自动修复文件系统权限                           |
| SP-03 | openclaw-security-permissions-guide | Unix 修复：chmod 700 状态目录、600 openclaw.json、700 credentials、600 auth-profiles 和 sessions  |
| SP-04 | openclaw-security-permissions-guide | Windows 修复：用 icacls 收紧 ACL，inheritance:r / grant:r 仅保留当前用户和 SYSTEM                 |
| SP-05 | openclaw-security-permissions-guide | 新环境部署后、迁移状态目录后应执行 security audit --deep 和 --fix                                 |
| SP-06 | openclaw-security-permissions-guide | 多用户场景应按 SECURITY.md 建议，每个用户使用独立状态目录和 Gateway                               |

## 组内逻辑顺序

遵循"风险背景 → 推荐权限 → 自动修复 → 平台手动修复 → 日常实践"的结构顺序。
