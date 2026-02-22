# 产出（Outputs）

基于 [pyramid/](../pyramid/) 拆解产出生成的各类面向读者的内容。每种产出对应 pyramid/structure/ 中的一个视角。

## 产出总览

| 产出                   | 格式       | 基于视角   | 状态   |
| ---------------------- | ---------- | ---------- | ------ |
| [tutorial/](tutorial/) | 系统化教程 | （待关联） | 规划中 |

## 产出与视角的关系

```
pyramid/structure/P01-xxx/   →   outputs/tutorial/
pyramid/structure/P02-xxx/   →   outputs/blog/（示例，未创建）
```

每种产出在其 README 中标注所依赖的视角，视角的 tree 结构决定了产出的章节组织。

## 新建产出流程

1. 确认对应的 pyramid/structure/ 视角已完成（至少 scqa + tree 初稿）
2. 在 `outputs/` 下创建产出目录
3. 在产出的 README 中标注基于哪个视角
4. 按视角的 tree 结构组织内容
5. 更新本文件的产出总览表
