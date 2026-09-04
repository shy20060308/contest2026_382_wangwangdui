# Circle Launcher v2.1

Circle Launcher 是 L3 Free surface。它可以针对圆屏采用二维蜂窝交互，但必须保持应用语义、路由和其他屏幕 Launcher 的稳定边界。

## 目标

- 应用数量增长时不允许出现重复坐标或图标重叠。
- 拖动输入与 UI layout 解耦，避免每个 `touchmove` 都触发完整渲染。
- 点击任意可见应用直接打开，不要求先把应用吸附到中心后二次点击。
- 圆屏 Honeycomb 保留二维自由拖动，因此 Back 使用左边缘右滑，不占用普通向下拖动。
- Launcher 页面仍然保留 pan 状态；从 App 返回时不主动重置到第一个应用。

## 动态六边形网格

蜂窝坐标由 axial hex ring 动态生成：

- ring 0：1 个中心格；
- ring 1：6 个格；
- ring 2：12 个格；
- 后续每一环增加 `6 * ring` 个格。

`buildSlots(apps)` 必须为每个 App 生成唯一 `gridX/gridY`。禁止通过 `% coords.length` 循环复用固定坐标。当前 12 个应用因此不会再让第 12 个图标复用中心格，解决“运动 / 今日概况”重合。

## 渲染效率

### Frame-throttled layout

`touchmove` 只更新 pan / velocity，并请求下一次 layout。一个 frame window 内重复 touchmove 合并为一次 `layoutSlots()`。当前 frame cadence 为 24ms，目标是稳定的 wearable 交互，而不是让输入事件频率直接驱动渲染频率。

### Visible-slot culling

逻辑 slots 保留完整网格；模板只消费当前屏幕附近的 `circleVisibleSlots`。离屏图标不参与组件树 diff。

### Stable image source

距离中心的视觉层级主要由 size / opacity 表达。移动过程中不再根据同一个距离阈值频繁切换 normal/soft `src`，避免图标在阈值附近反复更新资源。

## 交互

### Drag

拖动使用阻尼后的二维 pan。越过可用网格边界时进入有限 rubber-band 区域。

### Release

释放后根据最后移动速度产生短惯性。惯性结束后：

1. 先回到合法 pan 范围；
2. 如果最近图标已经非常接近视觉焦点，才使用轻量 magnetism 对齐；
3. 不再强制每次拖动都 snap 到一个 App。

### Tap

只要没有被刚结束的拖动 suppress，任意可见 App 单击直接路由打开。中心放大仅表示视觉焦点，不是打开 App 的前置条件。

Tap 路径在 `touchend` 中不会调用 `preventDefault()`；只有已经确认的 drag 或 edge-back 才消费事件，避免父级 raw-touch 识别器吞掉子图标 click。

### Back

Honeycomb 为二维自由拖动 surface，因此普通 up/down/left/right drag 都属于浏览。只有从左边缘开始的明确右滑手势触发 Back。

## 焦点标签

永久的“点按打开”提示已经删除。底部只保留当前最近 App 名称，并在拖动时隐藏、惯性时弱化，避免提示条长期占据视觉注意力。

## 生命周期

`onHide/onDestroy` 必须取消 layout timer 与 inertia timer。页面对象仍存在时不得清空 pan，所以从 App 返回 Launcher 应恢复此前位置。

## 验证

`npm run honeycomb:logic` / `npm run check` 覆盖：

- 1/7/19/37 动态 hex ring；
- 12 个 App 唯一坐标；
- 最小图标间隙；
- visible-slot culling；
- bounded rubber-band；
- wearable frame/inertia 参数；
- 单击直接打开与 edge-back 交互 contract。
