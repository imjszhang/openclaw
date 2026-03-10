# G58: 3D 知识图谱升级需通过"Three.js 生态整合 + 力导向分层布局 + 交互细节优化"实现高性能可视化

> 基于 three.js 生态的 3D 图谱方案，通过垂直分层布局展现知识金字塔结构，并辅以离线内联、溯源高亮及响应式交互，解决了 2D 方案在空间表达与性能上的局限。

## 包含的 Atoms

| 编号  | 来源                                | 内容摘要                                                                                           |
| ----- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| JG-01 | js-knowledge-prism-3d-graph-upgrade | 3d-force-graph 基于 Three.js 封装，API 与 D3 force 高度相似且 nodes/links 数据结构完全兼容         |
| JG-02 | js-knowledge-prism-3d-graph-upgrade | 3d-force-graph 内置 OrbitControls 实现左键旋转、右键平移、滚轮缩放交互                             |
| JG-03 | js-knowledge-prism-3d-graph-upgrade | three-spritetext 库用于实现始终面向摄像机的 3D 文字标签渲染                                        |
| JG-04 | js-knowledge-prism-3d-graph-upgrade | 项目依赖链顺序为：three → three-spritetext → d3-force-3d → 3d-force-graph                          |
| JG-05 | js-knowledge-prism-3d-graph-upgrade | 在 extractGraph 中使用 Set 数据结构防止相同 source+target+type 的 link 重复添加                    |
| JG-06 | js-knowledge-prism-3d-graph-upgrade | analyzeGraph 函数新增返回 isEmpty 和 hasNoLinks 字段用于前端空状态展示                             |
| JG-07 | js-knowledge-prism-3d-graph-upgrade | generateGraphHtml 通过正则匹配 CDN script 标签并将 vendor/下的本地 JS 内联以实现离线可用           |
| JG-08 | js-knowledge-prism-3d-graph-upgrade | 将模板中的 `<svg id="graph">` 替换为 `<div id="graph">` 以启用 WebGL canvas 自动创建               |
| JG-09 | js-knowledge-prism-3d-graph-upgrade | 配置 d3.forceY 将 journal 到 output 的六层节点分布到不同 Y 高度以形成金字塔结构                    |
| JG-10 | js-knowledge-prism-3d-graph-upgrade | 调用 nodeThreeObjectExtend(true) 配合 SpriteText 在每个节点上方渲染名称标签                        |
| JG-11 | js-knowledge-prism-3d-graph-upgrade | 节点 Tooltip 通过 onNodeHover 事件结合自定义 .tooltip div 跟随鼠标实现                             |
| JG-12 | js-knowledge-prism-3d-graph-upgrade | 点击节点触发 onNodeClick 事件使右侧详情面板滑出并显示类型/路径/meta/引用列表                       |
| JG-13 | js-knowledge-prism-3d-graph-upgrade | 搜索高亮功能通过动态刷新 nodeColor/linkColor 并将非匹配节点暗化实现                                |
| JG-14 | js-knowledge-prism-3d-graph-upgrade | 图层过滤功能通过 filter chips 控制 nodeVisibility 和 linkVisibility 属性实现                       |
| JG-15 | js-knowledge-prism-3d-graph-upgrade | 调用 cooldownTicks(0) 暂停力模拟，调用 cooldownTicks(Infinity) 配合 d3ReheatSimulation 恢复模拟    |
| JG-16 | js-knowledge-prism-3d-graph-upgrade | 全链路溯源高亮通过 BFS 双向遍历（向上到 journal 向下到 output）收集节点 ID 集合并高亮显示          |
| JG-17 | js-knowledge-prism-3d-graph-upgrade | 详情面板引用列表点击后执行相机飞向目标节点动画、打开目标面板并触发溯源高亮                         |
| JG-18 | js-knowledge-prism-3d-graph-upgrade | 当 nodes 为空时需在 .main 区域显示居中引导信息提示用户先运行 process 命令                          |
| JG-19 | js-knowledge-prism-3d-graph-upgrade | 将右侧详情面板改为 position:absolute 可在未打开时不占布局空间使图谱区域占满可用宽度                |
| JG-20 | js-knowledge-prism-3d-graph-upgrade | vendor/目录需存放 three.min.js、three-spritetext.min.js、3d-force-graph.min.js、d3-force-3d.min.js |
| JG-21 | js-knowledge-prism-3d-graph-upgrade | 监听窗口 resize 事件并调用 Graph.width()/.height() 使图谱尺寸跟随容器变化                          |
| JG-22 | js-knowledge-prism-3d-graph-upgrade | classify link 测试期望值从 2 改为 1 是去重逻辑生效后的正确行为                                     |
| JG-23 | js-knowledge-prism-3d-graph-upgrade | prism-graph-demo.html 同步升级为 3D 版本后可通过本地 HTTP server 直接打开预览                      |
| JG-24 | js-knowledge-prism-3d-graph-upgrade | 33 个节点和 41 条引用关系的 demo 在浏览器中流畅渲染证明新方案性能达标                              |

## 组内逻辑顺序

遵循"底层依赖与架构 (JG-01~04) → 数据处理与去重 (JG-05~06) → 渲染引擎与离线构建 (JG-07~08) → 核心布局算法 (JG-09) → 视觉增强 (JG-10) → 交互体系 (JG-11~17) → 空状态与布局优化 (JG-18~19) → 资源部署与适配 (JG-20~21) → 验证与测试 (JG-22~24)"的技术实施流。
