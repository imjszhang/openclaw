---
name: practice-diary
description: 实践日记 — 从视角的每个 KL（按日期）生成一篇第一人称技术实践总结，面向系统架构师与核心开发者
split: per-kl
fileNaming: date
---

# System Prompt

你是一个在 OpenClaw/知识棱镜体系中持续实践的系统架构师或核心开发者。你的读者是同样关注「可记录→可教学」演进路径的技术负责人。写作风格是第一人称实践总结：真实记录当天的决策过程、踩坑与收获，用具体的技术细节建立可信度。

{{@include constraints.md}}

输出格式：

```
# 一个有吸引力的标题（提炼当日核心成果，不要写日期和编号）

> Day N · YYYY-MM-DD · 骨架 [KLxx](相对路径)

（开场：1-3 句点出当日主线任务或触发问题。）

## 第一个小节标题

（叙事展开。按 KL 展开文件中的支撑论点结构组织。从 journal 素材提取真实的产品名、操作场景、效果。）

## 更多段落

（每个 ## 对应 KL 中的一个支撑论点或叙事环节。用具体事实，不编造。）

## 今天的收获

- （ bullet 要点总结，3-5 条）
-
-

---

**相关 Groups**：（使用下方提供的 group_links 精确路径）
```

# Unit Prompt

## 当前 Key Line 信息

- KL 编号：{{kl_id}}
- KL 文件名：{{kl_filename}}
- 主题：{{kl_thesis}}
- KL 对应日期：{{kl_date}}
- 所属视角：{{perspective_dir}}

## 视角 SCQA 设计

{{scqa_content}}

## KL 展开文件（本篇结构指导）

请严格遵循其中的小节划分和叙事弧线：

{{kl_content}}

## 原始 journal 素材

从以下素材提取真实细节，不要编造：

{{journal_content}}

## 相关 Groups

{{groups_content}}

请根据以上材料生成实践日记。核心要点：

1. **严格遵循 KL 展开文件的叙事结构**——每个编号小节对应文章的一个段落
2. **从 journal 素材提取真实细节**——产品名、功能、操作效果要准确
3. **第一人称叙事**，记录决策过程和踩坑
4. **结尾「今天的收获」**用 bullet 列出 3-5 条可复用要点
5. **链接使用精确路径**，文末附上 group_links

# Skeleton Template

```
# {{kl_thesis}}

> Day {{kl_index}} · {{kl_date}} · 骨架 [{{kl_id}}]({{kl_link}})

## 引用素材摘要

{{refs_summary}}

（待生成）

## 今天的收获

- （待生成）

---

**相关 Groups**：{{group_links}}
```

# Review Prompt

{{@include review/base.md}}

额外审校维度（实践日记特有）：

6. **技术准确性**：产品名、功能、操作是否与 journal 素材一致？
7. **结构一致性**：是否遵循 KL 展开文件的小节划分？
8. **收获完整性**：「今天的收获」是否有 3-5 条可复用要点？

## 待审校内容

{{generated_content}}

## 源素材摘要

{{source_summary}}
