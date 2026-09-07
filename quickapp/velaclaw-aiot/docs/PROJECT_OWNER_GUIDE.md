# 维护者指南

本文描述 `vela_band` 3.0 当前维护边界。设计运行时的规范以 [ARCHITECTURE_V3.md](ARCHITECTURE_V3.md) 和实际测试为准；历史架构只存在于 Git 历史中，不作为新代码的兼容入口。

## 维护目标

每次改动都应保持：

1. 同一产品在 Pill / Circle / Rect 目标形态上可运行。
2. 页面在 V3 Design Plan 解析完成前不渲染产品几何。
3. Recipe 是静态视觉几何的唯一来源；UX、View 和 Resolver 不保存第二套默认布局。
4. 页面生命周期、Feature、Domain 和 Capability 的职责不因视觉适配重新混回 UX。
5. 健康、运动、传感器和同步数据的真实性边界保持清晰，视觉层不得伪造业务样本。
6. `npm run check` 是合并前的最低质量门槛。

## 事实来源优先级

发生实现与文档冲突时，按以下顺序核对：

1. `src/manifest.json`：权限、系统 feature、路由和入口。
2. `package.json`：版本、检查命令和构建入口。
3. `src/capabilities/*`：原生 Vela 能力边界。
4. `src/domain/*`：业务模型、状态与持久化。
5. `src/v2/features/*`：应用级 orchestration 和资源生命周期。
6. `src/v2/system/device_profile.js`：设备形态、物理尺寸和声明式 safe insets。
7. `src/v2/design/scene.js`：Host Scene 投影。
8. `src/v2/design/apps/*`：产品 Recipe、Resolver 和 View。
9. `src/pages/*` 与 `src/components/watchfaces/*`：最终渲染和事件绑定。
10. `test/v3_architecture.test.js`、`test/v3_design.test.js`：当前架构边界的可执行约束。

`src/v2` 是当前 V3 运行时的历史路径名，不代表其中代码属于旧架构。是否属于 legacy 由职责和行为判断，而不是目录名称判断。

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
UX / Watchface renderer
```

### Device Profile

`src/v2/system/device_profile.js` 负责设备形态、屏幕尺寸和显式 safe inset。不要在页面或组件里重新推断安全区域。

### Scene

`src/v2/design/scene.js` 只负责把设备投影到 192 design-width Host Scene，并应用 Device Profile 已声明的 inset。

### Recipe

每个产品的 `src/v2/design/apps/<app>/layout.js` 拥有该产品的静态视觉意图，包括：

- 区域位置与尺寸；
- 间距、padding、radius；
- typography；
- shape-specific override；
- 静态视觉 chrome；
- 明确的分页容量或图表视觉范围。

如果一个值改变后应直接改变产品构图，它通常应属于 Recipe，而不是 UX 私有默认值。

### Adapter

`src/v2/design/adapter.js` 只做 Recipe 合并、区域投影、grid 和 content-box 翻译。禁止加入：

- clamp/fitting；
- Circle chord 扫描；
- 根据组件宽度重新计算 safe area；
- aesthetic scale；
- 缺字段时的视觉兜底。

### Resolver

Resolver 只组合无法静态表达的区域关系。它不得用 `Math.min` / `Math.max` 修复 Recipe 几何，也不得因为设备空间不足偷偷改变设计意图。

### View

View 负责业务数据到展示状态的映射，例如文案、颜色、百分比和真实样本的可视化映射。View 可以约束数据范围，但不得发明缺失的 Recipe 几何或容量。

### UX / Watchface

UX 和表盘组件负责：

- 渲染 resolved plan；
- 绑定 Feature state；
- 路由和用户事件；
- 必要的实时交互状态。

静态产品几何不得重新写回 `<style>`。已经完成 strict V3 的页面由架构测试禁止 CSS 持有非零 px 几何。

## Clock 组件边界

Clock 是一个完整产品链，不允许父页进入 V3 后由子表盘重新拥有布局。

`clock/layout.js` 持有每个 shape / face 的静态视觉几何；`clock.ux` 把 resolved `faceLayout` 传给 `src/components/watchfaces/*`。子表盘只能渲染该 layout 和实时表盘数据。

动态模拟表针 transform、真实数据柱高映射等可以在 renderer/helper 中计算，但柱高视觉范围等参数必须来自 Recipe。

## Settings 共享层边界

`src/v2/design/apps/_shared/detail.js` 仅共享设置详情页真正共同的 `header + stream` Host Scene 投影。

不要把具体页面的卡片、按钮、列宽或视觉 chrome 放进共享层。Brightness、Vibration、Motion、Diagnostics、Sync 各自拥有自己的 Recipe。

## L1 / L2 / L3

- L1：产品和表达相同，仅几何变化。
- L2：产品/数据共享，但局部表达变化。
- L3：交互或产品 surface 本身不同。

等级描述的是某个跨形态差异，不是页面永久标签。蜂巢等真正的动态交互引擎可以存在，但不能演化成新的通用屏幕 fitting solver。

## 数据与几何的 Math.min / Math.max

不要机械禁止所有 `Math.min` / `Math.max`。

允许：

- 亮度值限制到 0–255；
- 进度限制到 0–100%；
- 倒计时不小于 0；
- 真实样本映射到 Recipe 给出的图表范围。

禁止：

- `Math.max(40, recipeHeight)`；
- `Math.min(recipeWidth, safeWidth)`；
- 缺少 Recipe 时回退到旧卡片尺寸；
- Resolver 根据屏幕空间重新选择“看起来安全”的几何。

## 分页与容量

容量属于产品表达时必须显式声明。`pager.js` 要求调用方提供正数 `pageSize`，不再默认为 1。Diagnostics 等页面的每页卡片数量同样来自对应 Recipe。

## 修改检查清单

改 UI 前确认：

- 这个值是产品静态视觉、动态数据，还是交互状态？
- 静态视觉是否进入对应 App Recipe？
- Resolver 是否只做组合，没有修复设计？
- View 是否只处理数据，没有视觉 fallback？
- UX CSS 是否重新拥有非零固定几何？
- 子组件是否绕过父计划？
- 新 Manifest 产品路由是否被 strict V3 ownership 测试覆盖？

改业务前确认：

- 是否应属于 Capability、Domain 或 Feature，而不是 Design/Page？
- 页面销毁后 timer、sensor、health、location 和事件订阅是否正确释放？
- 数据降级是否明确，而不是由视觉层伪造？

## 验证

在 `quickapp/velaclaw-aiot` 下运行：

```bash
npm check
```

其中 V3 的核心设计检查为：

```bash
npm run v3:architecture
npm run v3:design
```

如果架构测试失败，应修正 ownership，而不是通过重新加入 fallback、compat bridge 或 CSS 私有几何绕过测试。
