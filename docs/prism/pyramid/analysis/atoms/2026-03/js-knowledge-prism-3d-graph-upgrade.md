# js-knowledge-prism 3D 知识图谱升级 + 多项优化

> 来源：[../../../../journal/2026-03-10/js-knowledge-prism-3d-graph-upgrade.md](../../../../journal/2026-03-10/js-knowledge-prism-3d-graph-upgrade.md)
> 缩写：JG

## Atoms

| 编号  | 类型 | 内容                                                                                               | 原文定位            |
| ----- | ---- | -------------------------------------------------------------------------------------------------- | ------------------- |
| JG-01 | 事实 | 3d-force-graph 基于 Three.js 封装，API 与 D3 force 高度相似且 nodes/links 数据结构完全兼容         | 技术选型            |
| JG-02 | 事实 | 3d-force-graph 内置 OrbitControls 实现左键旋转、右键平移、滚轮缩放交互                             | 技术选型            |
| JG-03 | 事实 | three-spritetext 库用于实现始终面向摄像机的 3D 文字标签渲染                                        | 技术选型            |
| JG-04 | 事实 | 项目依赖链顺序为：three → three-spritetext → d3-force-3d → 3d-force-graph                          | 技术选型            |
| JG-05 | 步骤 | 在 extractGraph 中使用 Set 数据结构防止相同 source+target+type 的 link 重复添加                    | 改动清单 > 后端优化 |
| JG-06 | 事实 | analyzeGraph 函数新增返回 isEmpty 和 hasNoLinks 字段用于前端空状态展示                             | 改动清单 > 后端优化 |
| JG-07 | 步骤 | generateGraphHtml 通过正则匹配 CDN script 标签并将 vendor/下的本地 JS 内联以实现离线可用           | 改动清单 > 后端优化 |
| JG-08 | 步骤 | 将模板中的 `<svg id="graph">` 替换为 `<div id="graph">` 以启用 WebGL canvas 自动创建               | 改动清单 > 3D 渲染  |
| JG-09 | 步骤 | 配置 d3.forceY 将 journal 到 output 的六层节点分布到不同 Y 高度以形成金字塔结构                    | 改动清单 > 3D 渲染  |
| JG-10 | 步骤 | 调用 nodeThreeObjectExtend(true) 配合 SpriteText 在每个节点上方渲染名称标签                        | 改动清单 > 3D 渲染  |
| JG-11 | 事实 | 节点 Tooltip 通过 onNodeHover 事件结合自定义 .tooltip div 跟随鼠标实现                             | 改动清单 > 交互功能 |
| JG-12 | 步骤 | 点击节点触发 onNodeClick 事件使右侧详情面板滑出并显示类型/路径/meta/引用列表                       | 改动清单 > 交互功能 |
| JG-13 | 步骤 | 搜索高亮功能通过动态刷新 nodeColor/linkColor 并将非匹配节点暗化实现                                | 改动清单 > 交互功能 |
| JG-14 | 步骤 | 图层过滤功能通过 filter chips 控制 nodeVisibility 和 linkVisibility 属性实现                       | 改动清单 > 交互功能 |
| JG-15 | 步骤 | 调用 cooldownTicks(0) 暂停力模拟，调用 cooldownTicks(Infinity) 配合 d3ReheatSimulation 恢复模拟    | 改动清单 > 交互功能 |
| JG-16 | 步骤 | 全链路溯源高亮通过 BFS 双向遍历（向上到 journal 向下到 output）收集节点 ID 集合并高亮显示          | 改动清单 > 新增功能 |
| JG-17 | 步骤 | 详情面板引用列表点击后执行相机飞向目标节点动画、打开目标面板并触发溯源高亮                         | 改动清单 > 新增功能 |
| JG-18 | 经验 | 当 nodes 为空时需在 .main 区域显示居中引导信息提示用户先运行 process 命令                          | 改动清单 > 新增功能 |
| JG-19 | 经验 | 将右侧详情面板改为 position:absolute 可在未打开时不占布局空间使图谱区域占满可用宽度                | 改动清单 > 新增功能 |
| JG-20 | 事实 | vendor/目录需存放 three.min.js、three-spritetext.min.js、3d-force-graph.min.js、d3-force-3d.min.js | 改动清单 > 基础设施 |
| JG-21 | 步骤 | 监听窗口 resize 事件并调用 Graph.width()/.height() 使图谱尺寸跟随容器变化                          | 改动清单 > 基础设施 |
| JG-22 | 判断 | classify link 测试期望值从 2 改为 1 是去重逻辑生效后的正确行为                                     | 改动清单 > 测试     |
| JG-23 | 事实 | prism-graph-demo.html 同步升级为 3D 版本后可通过本地 HTTP server 直接打开预览                      | 改动清单 > 测试     |
| JG-24 | 判断 | 33 个节点和 41 条引用关系的 demo 在浏览器中流畅渲染证明新方案性能达标                              | 最终效果            |
