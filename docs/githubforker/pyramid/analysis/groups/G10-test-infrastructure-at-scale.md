# G10: 测试基础设施规模化的两个支柱：lightweight clears 解决状态隔离，性能模式解决执行速度

> 大规模测试套件的可持续性取决于两件事：低成本的测试间状态清理（lightweight clears 替代重量级 mock reset），和系统化的执行提速（batch timer、poll 替代 sleep、并行化）。

## 包含的 Atoms

| 编号  | 来源                       | 内容摘要                                                                    |
| ----- | -------------------------- | --------------------------------------------------------------------------- |
| MU-12 | merge-main-upgrade-summary | 2000+ 测试提交，lightweight clears 替换重量级 mock reset，覆盖几乎所有模块  |
| MU-13 | merge-main-upgrade-summary | 测试性能：batch fake-timer、expect.poll 替代延时、并行化、worker split 调优 |

## 组内逻辑顺序

结构顺序：先解决正确性问题（MU-12，状态隔离保证测试独立性），再解决效率问题（MU-13，执行速度优化）。正确性是前提，效率是进阶。
