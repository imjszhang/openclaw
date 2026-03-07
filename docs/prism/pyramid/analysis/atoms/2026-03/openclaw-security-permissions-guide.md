# OpenClaw 状态目录权限加固指南

> 来源：[../../../../journal/2026-03-06/openclaw-security-permissions-guide.md](../../../../journal/2026-03-06/openclaw-security-permissions-guide.md)
> 缩写：SP

## Atoms

| 编号  | 类型 | 内容                                                                                              | 原文定位            |
| ----- | ---- | ------------------------------------------------------------------------------------------------- | ------------------- |
| SP-01 | 事实 | 状态目录 ~/.openclaw 存放配置、凭据、会话、认证，若对「其他用户」可写可读则存在篡改和隐私泄露风险 | 1. 背景与风险       |
| SP-02 | 事实 | openclaw security audit --deep 检测权限问题，--fix 自动修复文件系统权限                           | 3. 一键自动修复     |
| SP-03 | 步骤 | Unix 修复：chmod 700 状态目录、600 openclaw.json、700 credentials、600 auth-profiles 和 sessions  | 4. Unix 手动修复    |
| SP-04 | 步骤 | Windows 修复：用 icacls 收紧 ACL，inheritance:r / grant:r 仅保留当前用户和 SYSTEM                 | 5. Windows 手动修复 |
| SP-05 | 经验 | 新环境部署后、迁移状态目录后应执行 security audit --deep 和 --fix                                 | 6. 日常实践         |
| SP-06 | 判断 | 多用户场景应按 SECURITY.md 建议，每个用户使用独立状态目录和 Gateway                               | 6. 日常实践         |
