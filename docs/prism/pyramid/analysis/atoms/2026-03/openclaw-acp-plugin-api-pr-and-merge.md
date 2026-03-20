# OpenClaw 上游 PR：ACP 插件 API 与分支合并记录

> 来源：[../../../../journal/2026-03-21/openclaw-acp-plugin-api-pr-and-merge.md](../../../../journal/2026-03-21/openclaw-acp-plugin-api-pr-and-merge.md)
> 缩写：OA

## Atoms

| 编号  | 类型 | 内容                                                                                                       | 原文定位                      |
| ----- | ---- | ---------------------------------------------------------------------------------------------------------- | ----------------------------- |
| OA-01 | 步骤 | 从上游 main 拉取独立分支时，先执行 `git fetch source main` 再基于 `source/main` 新建功能分支               | 1. 今天做了什么（按时间顺序） |
| OA-02 | 判断 | 为上游开 PR 应使用独立分支而非长期开发分支，以避免与本 fork 的定制线搅在一起                               | 1. 今天做了什么（按时间顺序） |
| OA-03 | 事实 | `src/plugins/types.ts` 需在 `OpenClawPluginApi` 增加 `register/unregisterAcpRuntimeBackend` 方法及类型引用 | 1. 今天做了什么（按时间顺序） |
| OA-04 | 事实 | `src/plugins/registry.ts` 中 `createApi` 需委托到 `../acp/runtime/registry`，仅 full 模式真实注册          | 1. 今天做了什么（按时间顺序） |
| OA-05 | 经验 | 修改测试辅助文件 `plugin-api.ts` 补全新方法空实现，可防止因新字段必填导致的类型检查失败                    | 1. 今天做了什么（按时间顺序） |
| OA-06 | 步骤 | 推送分支时使用 `git push -u origin <branch-name>` 建立上游追踪关系                                         | 1. 今天做了什么（按时间顺序） |
| OA-07 | 事实 | 本次 PR 目标为 `openclaw/openclaw` 的 `main` 分支，PR 编号为 #51187                                        | 1. 今天做了什么（按时间顺序） |
| OA-08 | 经验 | 将上游 PR 分支合回 fork 长期分支时，若存在无关差异，直接 merge 会导致 add/add 冲突                         | 1. 今天做了什么（按时间顺序） |
| OA-09 | 步骤 | 遇到无关冲突时应中止 merge (`git merge --abort`) 并改用 `git cherry-pick` 仅提取特定提交                   | 1. 今天做了什么（按时间顺序） |
| OA-10 | 判断 | PR 基线应选择 `source/main` 而非 fork 分支，因为上游维护者以官方 main 为基准评审最干净                     | 2. 决策备忘                   |
| OA-11 | 判断 | 合回 fork 长期分支应选择 cherry-pick 而非 merge，以避免拉入 fork 与 main 在其他文件上的分叉导致高冲突成本  | 2. 决策备忘                   |
| OA-12 | 经验 | 当工作区存在未跟踪文件导致 `format:check` 失败时，可使用 `git commit --no-verify` 跳过钩子提交             | 2. 决策备忘                   |
| OA-13 | 经验 | 独立分支策略适合「PR 基线已是 upstream main 而 fork 另有大量定制」的场景，能显著降低合并冲突               | 4. 一句收尾                   |
