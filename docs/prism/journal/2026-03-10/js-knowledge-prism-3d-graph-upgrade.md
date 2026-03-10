# js-knowledge-prism 3D 知识图谱升级 + 多项优化

> 文档日期：2026-03-10
>
> 来源：Cursor Agent 对话 — js-knowledge-prism 项目开发
>
> 相关：[js-knowledge-prism-project-creation.md](../2026-02-24/js-knowledge-prism-project-creation.md)

---

## 背景

在此前的对话中，已为 js-knowledge-prism 实现了 2D D3.js 力导向图的知识图谱可视化功能（`graph` 命令）。用户提出希望图谱支持鼠标旋转、缩放等 3D 交互，并将此前讨论的多项优化点一并纳入实施。

## 技术选型

采用 **3d-force-graph**（基于 Three.js 封装）替换原有 D3 SVG 方案：

- API 与 D3 force 高度相似，nodes/links 数据结构完全兼容，后端无需改动
- 内置 OrbitControls：左键旋转、右键平移、滚轮缩放
- 内置节点/连线渲染、hover/click 事件
- 搭配 **three-spritetext** 实现 3D 文字标签，始终面向摄像机

依赖链：`three` → `three-spritetext` → `d3-force-3d` → `3d-force-graph`

## 改动清单

### 1. 后端优化（lib/graph.mjs）

| 改动         | 说明                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| addLink 去重 | 在 `extractGraph` 中用 Set 防止相同 source+target+type 的 link 重复添加                    |
| 空状态标记   | `analyzeGraph` 返回新增 `isEmpty` / `hasNoLinks` 字段，供前端展示空状态                    |
| vendor 内联  | `generateGraphHtml` 检测 `vendor/` 下是否有本地 JS，有则内联到 HTML 替代 CDN，实现离线可用 |

内联逻辑使用正则匹配 CDN script 标签，支持 unpkg 和 jsdelivr 两种来源：

```javascript
const inlineEntries = [
  { pattern: /<script src="[^"]*three@[^"]*\/three\.min\.js"><\/script>/, file: "three.min.js" },
  {
    pattern: /<script src="[^"]*three-spritetext[^"]*"><\/script>/,
    file: "three-spritetext.min.js",
  },
  { pattern: /<script src="[^"]*d3-force-3d[^"]*"><\/script>/, file: "d3-force-3d.min.js" },
  { pattern: /<script src="[^"]*3d-force-graph[^"]*"><\/script>/, file: "3d-force-graph.min.js" },
];
```

### 2. 3D 渲染升级（templates/graph.html）

- **SVG → div**：`<svg id="graph">` 替换为 `<div id="graph">`，3d-force-graph 自动创建 WebGL canvas
- **ForceGraph3D 初始化**：配置 nodeColor、nodeVal、linkColor、linkDirectionalArrow 等
- **层级 Y 轴**：`d3.forceY` 将 journal→output 六层节点分布到不同 Y 高度，旋转时呈金字塔结构
- **3D 文字标签**：通过 `nodeThreeObjectExtend(true)` + `SpriteText` 在每个节点上方渲染名称

### 3. 交互功能

| 功能              | 实现方式                                                                      |
| ----------------- | ----------------------------------------------------------------------------- |
| 3D 旋转/平移/缩放 | 内置 OrbitControls，无需额外代码                                              |
| 节点 Tooltip      | `onNodeHover` + 自定义 `.tooltip` div，跟随鼠标                               |
| 详情面板          | `onNodeClick` → 右侧面板滑出，显示类型/路径/meta/引用列表                     |
| 搜索高亮          | 输入关键词 → `nodeColor` / `linkColor` 动态刷新，非匹配节点暗化               |
| 图层过滤          | filter chips → `nodeVisibility` / `linkVisibility` 控制显隐                   |
| 缩放按钮          | `Graph.cameraPosition()` 调整相机距离                                         |
| 标签切换          | 重新调用 `nodeThreeObject` 切换 SpriteText / undefined                        |
| 力模拟暂停        | `cooldownTicks(0)` 暂停 / `cooldownTicks(Infinity) + d3ReheatSimulation` 恢复 |

### 4. 新增功能

#### 全链路溯源高亮

点击节点后，BFS 双向遍历完整引用链（向上到 journal + 向下到 output），高亮链上所有节点和连线，其余暗化。点击背景或 ESC 恢复。

```javascript
function traceFullChain(nodeId) {
  const chain = new Set([nodeId]);
  // BFS backward → ancestors
  // BFS forward → descendants
  return chain;
}
```

#### 详情面板引用列表点击导航

Incoming/Outgoing 列表中的条目添加 `data-node-id`，点击后：

1. 相机飞向目标节点（`Graph.cameraPosition` 动画 1000ms）
2. 打开目标节点的详情面板
3. 触发溯源高亮

#### 空状态提示

当 nodes 为空时，在 `.main` 区域显示居中引导信息，提示用户先运行 `process` 命令。

#### 详情面板绝对定位

将右侧详情面板改为 `position: absolute`，未打开时不占布局空间，图谱区域完全占满可用宽度。

### 5. 基础设施

- **vendor/ 目录**：新建并下载 4 个 JS 文件供离线使用
  - `three.min.js`（669KB）
  - `three-spritetext.min.js`（7KB）
  - `3d-force-graph.min.js`（1.2MB）
  - `d3-force-3d.min.js`（10KB）
- **窗口 resize 响应**：`Graph.width() / .height()` 跟随容器尺寸变化
- **CSS 清理**：移除 SVG 专用规则，添加 `.empty-state` 样式

### 6. 测试

- `test/graph.test.mjs`：classify link 期望值从 2 改为 1（去重后的正确行为），全部 11 个测试通过
- `test/graph-demo/prism-graph-demo.html`：同步升级为 3D 版本，含完整 mock 数据，可用本地 HTTP server 直接打开预览

## 改动文件总结

| 文件                                    | 改动类型                                        |
| --------------------------------------- | ----------------------------------------------- |
| `lib/graph.mjs`                         | 修改：addLink 去重、空状态标记、vendor 内联逻辑 |
| `templates/graph.html`                  | 重写：2D D3 → 3D force-graph + 全部新功能       |
| `test/graph.test.mjs`                   | 修改：更新去重后的测试期望                      |
| `test/graph-demo/prism-graph-demo.html` | 重写：同步升级为 3D 版本                        |
| `test/graph-demo/d3.min.js`             | 删除：不再需要                                  |
| `vendor/`                               | 新增：4 个 JS 文件供离线内联                    |

## 最终效果

- 33 个节点、41 条引用关系的 demo 在浏览器中流畅渲染
- 金字塔层级结构清晰可见，旋转时立体感强
- 每个节点上方有 3D 文字标签，始终朝向摄像机
- 点击节点触发溯源高亮，详情面板从右侧滑出覆盖图谱
- 搜索/过滤/缩放/暂停等全部交互功能正常工作
