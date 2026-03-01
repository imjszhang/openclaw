# ClawHub 技能发布指南

> 来源：[../../../../journal/2026-02-25/clawhub-publish-guide.md](../../../../journal/2026-02-25/clawhub-publish-guide.md)
> 缩写：CH

## Atoms

| 编号  | 类型 | 内容                                                                                               | 原文定位                   |
| ----- | ---- | -------------------------------------------------------------------------------------------------- | -------------------------- |
| CH-01 | 事实 | ClawHub 是 OpenClaw 生态的公共技能注册中心，定位类似 npm 但面向 AI Agent 技能包                    | 1. ClawHub 是什么          |
| CH-02 | 事实 | ClawHub 后端基于 Convex 构建，认证采用 GitHub OAuth，搜索使用 OpenAI embedding 向量索引            | 1. ClawHub 是什么          |
| CH-03 | 事实 | OpenClaw 有两套扩展机制：插件（运行时代码）和技能（文本形式的 Agent 指令包），ClawHub 管理的是技能 | 1. ClawHub 是什么          |
| CH-04 | 事实 | 技能包最低要求仅包含一个 SKILL.md 文件，可附带任意数量的文本支持文件                               | 2. 核心概念 > 技能包       |
| CH-05 | 事实 | ClawHub 只接受文本文件（如.md, .js, .json 等），明确拒绝二进制文件（如.png, .zip, .exe）           | 2. 核心概念 > 文件类型限制 |
| CH-06 | 事实 | 技能 Slug 格式必须匹配正则 `^[a-z0-9][a-z0-9-]*$`，仅允许小写字母、数字和连字符                    | 2. 核心概念 > Slug         |
| CH-07 | 事实 | 每次发布必须使用 semver 格式版本号，标签（如 latest）是指向特定版本的指针                          | 2. 核心概念 > 版本与标签   |
| CH-08 | 事实 | 发布账号需注册超过 7 天，单版本总大小限制为 50MB，且必须包含可解析 frontmatter 的 SKILL.md         | 2. 核心概念 > 发布要求     |
| CH-09 | 事实 | SKILL.md 顶部必须包含 YAML frontmatter，定义 name, description, version 及 metadata 元数据         | 3. SKILL.md 文件格式       |
| CH-10 | 事实 | metadata.openclaw 字段支持声明 emoji、OS 支持、环境变量依赖、CLI 工具依赖及安装规范                | 3. SKILL.md 文件格式       |
| CH-11 | 经验 | 安全审查会比对 frontmatter 声明与实际代码行为，声明缺失或冗余会触发警告影响审核通过                | 3. SKILL.md 文件格式       |
| CH-12 | 判断 | 发布目录应仅包含插件本身文件，若从项目根目录发布会打包无关文件（如测试、扩展源码）导致包体积过大   | 4. 实战 > 第一步           |
| CH-13 | 步骤 | 创建 .clawhubignore 文件可排除构建产物、敏感文件和二进制文件，语法同 .gitignore                    | 4. 实战 > 第二步           |
| CH-14 | 经验 | 浏览器 OAuth 登录若被防火墙或代理拦截会导致回调失败，此时应改用 --token 方式手动登录               | 4. 实战 > 第三步           |
| CH-15 | 步骤 | 使用 `npx clawhub publish` 命令指定目录、slug、版本、标签和 changelog 即可完成技能发布             | 4. 实战 > 第四步           |
| CH-16 | 步骤 | 使用 `clawhub inspect <slug> --versions` 可验证发布状态、版本号及标签映射关系                      | 4. 实战 > 第五步           |
| CH-17 | 事实 | `clawhub search` 基于向量语义搜索而非关键词匹配，`clawhub sync` 可自动扫描并发布变更的技能         | 5. CLI 命令速查            |
| CH-18 | 事实 | `clawhub delete` 执行的是软删除，原版本号不可复用，需通过 `undelete` 恢复后使用新版本号重新发布    | 7. 注意事项与排查          |
| CH-19 | 经验 | 新发布技能若显示隐藏状态，通常是因为正在排队进行自动安全扫描，等待几分钟即可自动恢复可见           | 7. 注意事项与排查          |
| CH-20 | 步骤 | 发布前需检查 SKILL.md 格式、semver 版本唯一性、依赖声明一致性及 .clawhubignore 排除规则是否生效    | 7. 注意事项与排查          |
| CH-21 | 事实 | 环境变量 CLAWHUB_DISABLE_TELEMETRY=1 可用于禁用 sync 命令的遥测数据上报                            | 7. 注意事项与排查          |
