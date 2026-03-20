# G72: 上游 PR 贡献必须采用「独立分支隔离 + Cherry-pick 回合并」策略以规避定制线冲突

> 向官方上游提交 PR 时，必须基于 `source/main` 创建独立分支，合回本地长期分支时严禁直接 Merge，应改用 Cherry-pick 提取特定提交以消除无关差异带来的高冲突成本。

## 包含的 Atoms

| 编号  | 来源                                 | 内容摘要                                                                                                  |
| ----- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| OA-01 | openclaw-acp-plugin-api-pr-and-merge | 从上游 main 拉取独立分支时，先执行 `git fetch source main` 再基于 `source/main` 新建功能分支              |
| OA-02 | openclaw-acp-plugin-api-pr-and-merge | 为上游开 PR 应使用独立分支而非长期开发分支，以避免与本 fork 的定制线搅在一起                              |
| OA-06 | openclaw-acp-plugin-api-pr-and-merge | 推送分支时使用 `git push -u origin <branch-name>` 建立上游追踪关系                                        |
| OA-07 | openclaw-acp-plugin-api-pr-and-merge | 本次 PR 目标为 `openclaw/openclaw` 的 `main` 分支，PR 编号为 #51187                                       |
| OA-08 | openclaw-acp-plugin-api-pr-and-merge | 将上游 PR 分支合回 fork 长期分支时，若存在无关差异，直接 merge 会导致 add/add 冲突                        |
| OA-09 | openclaw-acp-plugin-api-pr-and-merge | 遇到无关冲突时应中止 merge (`git merge --abort`) 并改用 `git cherry-pick` 仅提取特定提交                  |
| OA-10 | openclaw-acp-plugin-api-pr-and-merge | PR 基线应选择 `source/main` 而非 fork 分支，因为上游维护者以官方 main 为基准评审最干净                    |
| OA-11 | openclaw-acp-plugin-api-pr-and-merge | 合回 fork 长期分支应选择 cherry-pick 而非 merge，以避免拉入 fork 与 main 在其他文件上的分叉导致高冲突成本 |
| OA-12 | openclaw-acp-plugin-api-pr-and-merge | 当工作区存在未跟踪文件导致 `format:check` 失败时，可使用 `git commit --no-verify` 跳过钩子提交            |
| OA-13 | openclaw-acp-plugin-api-pr-and-merge | 独立分支策略适合「PR 基线已是 upstream main 而 fork 另有大量定制」的场景，能显著降低合并冲突              |

## 组内逻辑顺序

按 Git 操作流程组织：分支创建与推送 (OA-01, OA-02, OA-06, OA-07, OA-10) -> 合并回本地策略与冲突处理 (OA-08, OA-09, OA-11, OA-13) -> 特殊场景处理 (OA-12)。
