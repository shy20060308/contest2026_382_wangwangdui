# 维护者指南

本文描述 `vela_band` 3.0 当前维护边界。设计运行时规范以 [ARCHITECTURE_V3.md](ARCHITECTURE_V3.md) 和实际测试为准；历史架构只存在于 Git 历史中，不作为新代码的兼容入口。

## 维护目标

每次改动都应保持：

1. 同一产品在 Pill / Circle / Rect 目标形态上可运行。
2. 页面在 V3 Design Plan 解析完成前不渲染产品几何。
3. Recipe 是静态视觉几何的唯一来源；UX、View、Resolver 和 Product Engine 不保存第二套默认布局。
4. 页面生命周期、Feature、Domain 和 Capability 的职责不因视觉适配重新混回 UX。
5. 健康、运动、传感器和同步数据的真实性边界保持清晰，视觉层不得伪造业务样本。
6. 同一个事实只在拥有它的边界校验/规范化一次；下游不得叠加防御性 normalize、clamp、缓存或 silent fallback。
7. `npm run check` 是合并前的最低质量门槛。

## 事实来源优先级

发生实现与文档冲突时，按以下顺序核对：

1. `src/manifest.json`：权限、系统 feature、路由和入口。
2. `package.json`：版本、检查命令和构建入口。
3. `src/capabilities/*`：原生 Vela 能力边界和原生值规范化。
4. `src/domain/*`：业务模型、状态与持久化。
5. `src/v2/features/*`：应用级 orchestration 和资源生命周期。
6. `src/runtime/device_profile.js`：设备形态、物理尺寸和声明式 safe insets。
7. `src/v2/design/scene.js`：Host Scene 投影。
8. `src/v2/design/apps/*`：产品 Recipe、Resolver 和 View。
9. `src/v2/design/engines/*`：只消费 resolved Plan 的产品数学/交互引擎。
10. `src/pages/*` 与 `src/components/watchfaces/*`：最终渲染和事件绑定。
11. `test/v3_architecture.test.js`、`test/v3_design.test.js` 和各 Domain/Runtime 测试：当前边界的可执行约束。

`src/v2` 是当前 V3 中部分源码的历史路径名，不代表其中代码属于旧架构。`src/v2/app` 和 `src/v2/system` 已经退出；是否属于 legacy 应由职责和行为判断，而不是仅看目录名称。

## 当前设计链

```text
Device Profile
    ↓
Host Scene + declared safe insets
    ↓
App Recipe
    ↓
Adapter translation
    ↓
App Resolver
    ↓
Resolved Plan
    ↓
Optional Product Math Engine
    ↓
UX / Watchface renderer
```

### Device Profile

`src/runtime/device_profile.js` 是物理设备事实的验证边界，负责设备形态、屏幕尺寸和显式 safe inset。不要在 Scene、Adapter、页面或组件里重新验证同一套物理事实。

### Scene

`src/v2/design/scene.js` 只负责把已解析 Device Profile 投影到 192 design-width Host Scene，并应用 Profile 已声明的 inset。Scene 可以维护最终 safe-region 正值等投影不变量，但不重新分类设备。

### Recipe

每个产品的 `src/v2/design/apps/<app>/layout.js` 拥有静态视觉意图，包括：区域位置与尺寸、间距/padding/radius、typography、shape override、静态视觉 chrome、明确的分页容量或图表视觉范围。

如果一个值改变后应直接改变产品构图，它通常应属于 Recipe，而不是 UX 私有默认值。

### Adapter

`src/v2/design/adapter.js` 只做 Recipe 合并、区域投影、grid 和 content-box 翻译。禁止加入：clamp/fitting、Circle chord 扫描、根据组件宽度重新计算 safe area、aesthetic scale、缺字段时的视觉兜底，以及对 Device Profile/Scene 的第二遍验证。

### Resolver

Resolver 只组合无法静态表达的区域关系。它不得用 `Math.min` / `Math.max` 修复 Recipe 几何，也不得因为设备空间不足偷偷改变设计意图。

### Product Math Engine

只有确实需要运行时数学或连续交互的产品才使用 `src/v2/design/engines/*`。Engine 必须由 resolved Recipe/Plan 配置，可以拥有纯几何算法、惯性、阻尼、overscroll、方向选择等交互物理，但不得拥有产品 focus 坐标、icon 基础尺寸/放大量、label 区域等静态视觉事实，也不得为缺失/错误 Recipe 输入发明默认值。

当前 Circle Launcher 的 Honeycomb 是明确样例：`launcher/layout.js` 声明 focus、spacing、动态 icon 表达和 label 几何；Launcher Resolver 注入真实 Scene viewport；`honeycomb.create(plan.honeycomb)` 只把这些已决设计翻译成 hex 坐标、动态尺寸、遮让、pan bounds 和交互运动。

### View

View 负责 canonical 业务数据到展示状态的映射，例如文案、颜色和真实样本的可视化映射。View 不应再次 `Number/isFinite` 已由 Capability/Domain 规范的数据，也不得用 0、空字符串等二次编码代替 `null/unavailable`。

### UX / Watchface

UX 和表盘组件负责渲染 resolved plan、绑定 Feature state、路由和用户事件，以及必要的实时交互状态。静态产品几何不得重新写回 `<style>`。

## 一个事实，一个 owner

推荐边界：

```text
Native data      -> Capability normalize once
Business state   -> Domain validate/transition once
Lifecycle flow   -> Feature orchestrate
Physical device  -> Device Profile validate once
Design intent    -> Recipe
Design math      -> Adapter/Resolver/Recipe-bound Engine translate
Presentation     -> View/UX format
```

需要删除的典型模式：

```text
Capability Number(x)
→ Domain Number(x) || 0
→ Feature isFinite(Number(x))
→ View Math.max(...Number(x))
```

如果上游已经声明 canonical contract，下游只消费。只有本层新引入的语义规则才在本层校验，例如 GPS segment 噪声阈值、Workout 是否处于 running、Health 是否为 official live provenance。

## 持久化策略

完整 V3 不长期背负旧 schema migration。破坏性迁移使用干净 namespace，例如当前 Activity、Workout、Settings 都使用 V3 key。旧实现和旧数据结构由 Git 历史保存，而不是在 Repository/State Machine 中永久保留多层兼容。

内存降级只有在调用方能明确看到 provenance/result 时才允许。例如 Storage 写失败可以返回 `memoryOnly: true`；不能把失败或旧缓存伪装成当前 Battery/Health 数据。

## Clock 组件边界

Clock 不允许父页进入 V3 后由子表盘重新拥有布局。`clock/layout.js` 持有 shape / face 静态视觉几何；`clock.ux` 把 resolved `faceLayout` 传给 `src/components/watchfaces/*`。子表盘只渲染该 layout 和实时表盘数据。

## Settings 共享层边界

`src/v2/design/apps/_shared/detail.js` 只共享设置详情页真正共同的 `header + stream` Host Scene 投影。Brightness、Vibration、Motion、Diagnostics、Sync 各自拥有 Recipe。

Settings Domain 使用干净 V3 persistence，并是 brightness、haptic setting 等配置值的 canonical owner。Feature/Runtime 不再重复设置默认值或修正非法值。

## L1 / L2 / L3

- L1：产品和表达相同，仅几何变化。
- L2：产品/数据共享，但局部表达变化。
- L3：交互或产品 surface 本身不同。

等级描述某个跨形态差异，不是页面永久标签。`difference.js` 是 difference level 的唯一 validator；Adapter 不再维护第二份等级校验。

## Math.min / Math.max

不要机械禁止所有 `Math.min` / `Math.max`。

允许：领域范围/噪声规则、真实数据映射到 Recipe 声明的视觉范围、交互状态边界。

禁止：`Math.max(40, recipeHeight)`、`Math.min(recipeWidth, safeWidth)`、缺少 Recipe 时回退旧尺寸、Resolver 根据屏幕空间重新选择“看起来安全”的几何，以及下游重复 clamp 上游已经 canonical 的值。

## 工具与模板

当前产品优先阶段不维护旧 Layout Studio/模板工具。此前 Studio 自己复制了 Profile、App level、Recipe 字段白名单、mock 数据、Recipe 重写和 UX translation 规则，形成第二套规范，已经退役。

未来重新引入工具时，应直接消费成熟 V3 Recipe/IR 和唯一 Validator；工具只能提供编辑/可视化体验，不能成为第二个 Device Profile、Adapter 或 Recipe schema owner。

## 修改检查清单

改 UI 前确认：这个值属于静态视觉、动态数据还是交互状态；静态视觉是否进入 App Recipe；Resolver 是否只组合；Product Engine 是否只消费 resolved Plan；View 是否只处理展示；UX CSS 是否重新拥有固定几何；子组件是否绕过父 plan。

改业务前确认：校验是否已经在上游 owner 做过；是否新增了第二份默认值/缓存/normalize；页面销毁后 timer、sensor、health、location 和事件订阅是否释放；数据降级是否明确而不是伪造。

## 验证

在 `quickapp/velaclaw-aiot` 下运行：

```bash
npm run check
npm run build
```

其中核心架构检查为：

```bash
npm run v3:architecture
npm run v3:design
npm run v3:truth
```

如果测试失败，应修正 ownership，而不是通过重新加入 fallback、compat bridge、重复 validator 或 CSS 私有几何绕过测试。