# 教程导读

> 基于视角：（待关联 pyramid/structure/ 中的具体视角）

## 这套教程是什么

基于个人实践经验整理的 OpenClaw 系统化学习路径。内容来源于真实的部署、配置和二次开发过程，按金字塔原理重组为"从认知到实践"的递进结构。

## 适合谁

- 想部署和使用 OpenClaw 的开发者
- 想基于 OpenClaw 做二次开发或定制的工程师
- 想了解多渠道 AI Agent 网关架构的技术人员

## 怎么读

### 推荐路径（按顺序）

```
认识 OpenClaw → 部署与运行 → 配置与使用 → 扩展与进阶
```

每个阶段建立在前一阶段的基础上。如果你已经有一定基础，可以直接跳到对应章节。

### 按需查阅

每篇文档开头会标注：

- **前置阅读**：读本文前建议先看哪些内容
- **难度等级**：入门 / 中级 / 高级

## 章节概览

### [一、认识 OpenClaw](01-understand/)

> 核心问题：它是什么？架构怎么运作？

- 项目全景：OpenClaw 解决什么问题、整体架构
- 五层核心概念：Channel → Account → Agent → Workspace → Session
- 常见问题与场景澄清

**素材来源**：[项目分析报告](../../journal/2026-01-31/openclaw-analysis-report.md)、[核心概念金字塔](../../journal/2026-02-13/openclaw-core-concepts-pyramid.md)、[核心概念 Q&A](../../journal/2026-02-13/openclaw-core-concepts-qa-and-usage.md)

### [二、部署与运行](02-deploy/)

> 核心问题：怎么跑起来？

- 环境准备与工具配置
- Fork 管理与代码同步
- 消息渠道部署（通用 + WeCom 专项）
- 健康检查与故障排除
- 版本升级与分支合并

**素材来源**：[Fork 管理指南](../../journal/2026-01-31/fork-management-guide.md)、[渠道部署指南](../../journal/2026-01-31/channel-deployment-guide.md)、[WeCom 插件部署](../../journal/2026-02-08/wecom-plugin-deployment-guide.md)、[Cursor 终端配置](../../journal/2026-02-08/cursor-terminal-config-guide.md)、[Doctor 诊断](../../journal/2026-01-31/openclaw-doctor-guide.md)、[Tiny Core 可行性](../../journal/2026-01-31/tinycore-feasibility-report.md)、[合并升级总结](../../journal/2026-02-22/merge-main-upgrade-summary.md)

### [三、配置与使用](03-configure/)

> 核心问题：跑起来后怎么用好？

- AI 模型与 Agent 配置
- 定时任务（Cron）配置
- 独立 Agent 创建
- 浏览器中继（Browser Relay）
- Token 使用监控

**素材来源**：[模型与 Agent 配置](../../journal/2026-01-31/model-agent-config-guide.md)、[Cron 配置](../../journal/2026-02-05/cron-config-guide.md)、[独立 Agent 创建](../../journal/2026-02-13/independent-agent-creation-guide.md)、[Browser Relay](../../journal/2026-02-11/browser-relay-guide.md)、[Token 监控分析](../../journal/2026-02-14/agent-token-usage-monitoring-analysis.md)

### [四、扩展与进阶](04-extend/)

> 核心问题：怎么做深度定制和二次开发？

- 扩展开发总论
- 自定义渠道开发（Channel 插件）
- 技能系统配置与开发
- 外部脚本调用接口
- Agent 自我进化系统设计

**素材来源**：[扩展开发指南](../../journal/2026-02-01/extension-development-guide.md)、[自定义 Channel](../../journal/2026-02-01/custom-channel-guide.md)、[技能系统](../../journal/2026-02-01/skills-guide.md)、[外部脚本接口](../../journal/2026-02-06/external-scripting-guide.md)、[Agent 进化设计](../../journal/2026-02-06/agent-evolution-guide.md)
