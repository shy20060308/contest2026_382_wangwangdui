# Contributing to vela_band

感谢参与 `vela_band`。当前工程版本为 V3，贡献必须维护单一产品链：

```text
Capability → Domain → Feature → Device Profile/Scene → Recipe → Adapter → Resolver → UX
```

Git 历史负责保存旧实现；当前源码不建立 V2/common/presentation 兼容桥。

## 开发环境

- Node.js 18 或更高版本
- npm
- AIoT-IDE 或兼容的 Vela Quick App 工具链
- 可用的 Vela 模拟器/设备

```bash
npm ci
```

## 提交前门禁

```bash
npm run check
npm run build
```

涉及页面构图、生命周期、设备能力或形态差异时，还应在对应 Pill / Circle / Rect profile 与可用模拟器上做回归。

## V3 所有权规则

- `src/capabilities/*`：原生 Vela API 与能力边界。
- `src/domain/*`：业务模型、状态机、持久化语义。
- `src/runtime/*`：Device Profile、页面 runtime 和需要独立执行的 runtime core；不得承担页面设计。
- `src/v2/features/*`：应用级生命周期和业务编排。
- `src/v2/design/*`：Scene、Recipe、Adapter、Resolver 和明确的设计/交互 engine。
- `src/pages/*`：绑定 resolved plan、feature state 和用户交互。
- `src/components/watchfaces/*`：渲染 Clock Recipe 注入的表盘计划。
- `src/common/*`：仅静态图片、图标、表盘背景等资源；禁止新增 JS/UX 逻辑。

不要恢复：

- `src/presentation`
- `src/platform` capability aliases
- `src/v2/system`
- `src/v2/app`
- `src/v2/design/specs`
- `src/v2/design/views`
- `src/v2/design/geometry.js`
- `src/common/*.js`

## Recipe ownership

视觉迁移或新页面必须遵循：

1. 页面在 resolved plan 就绪前不渲染产品几何。
2. 页面 CSS 不写产品非零 px 几何；颜色、方向、语义状态等非几何样式可以保留。
3. UX 不保留 `plan || oldValue` 一类私有视觉 fallback。
4. Resolver 不用 `Math.min/Math.max`、扫描、缩放等方式修复 Recipe 几何。
5. Adapter 只做 Recipe → Host Scene 翻译和明确的 box-model 转换，不决定设计。
6. Device Profile 显式声明 safe insets；safe area 不根据组件宽度重新求解。
7. Circle / Pill / Rect 的真实产品差异写在 app-owned Recipe 中，不藏在共享 helper 里。
8. 复杂交互 engine 可以计算动态状态，但必须消费 resolved Recipe/Plan，不得重新成为页面适配 solver 或静态视觉 owner。

## 业务与能力规则

- 页面不重新实现 Domain 状态机或 Capability 调用。
- 定时器、传感器、位置、健康和事件订阅必须由其 owner 在生命周期结束时释放。
- 持久化统一进入对应 Domain repository/store。
- 原生系统能力统一进入 Capabilities；不要新增 platform/common 转发层。
- 健康和运动正式表面只使用官方实时健康样本，不得生成伪造健康趋势。
- 模拟 transport 或降级能力必须在产品语义上明确，不得描述为真实硬件链路。

## 静态资源

应用图标源文件位于 `assets/icons/*.svg`，渲染后的 wearable 资源位于 `src/common/icons/`。`src/common` 是资源命名空间，不是公共代码目录。

资源生成脚本：

```bash
npm run icons:render
npm run backgrounds:render
```

## 文档

架构变化同步更新：

- `README.md`
- `docs/README_EN.md`
- `docs/ARCHITECTURE_V3.md`
- `docs/PROJECT_OWNER_GUIDE.md`

不要在当前树中保留已退休架构的“当前实现说明”；历史说明由 Git 历史保存。

## 提交信息

推荐 Conventional Commits：

```text
feat: add a user-visible capability
fix: correct runtime behavior
docs: update current documentation
refactor: change ownership or implementation structure
test: strengthen a current contract
chore: maintain tooling or dependencies
```

提交格式是团队约定，不依赖仓库内隐式安装的 Git hook。需要强制提交规范时，应显式引入并维护完整工具链，而不是保留不可执行的 Husky/Commitlint 配置残片。

## 检查清单

- [ ] `npm run check` 通过
- [ ] `npm run build` 成功
- [ ] 相关 Pill / Circle / Rect 场景已回归
- [ ] 新页面已登记在 `src/manifest.json`
- [ ] 新视觉参数归 Recipe 所有，没有写回 UX/CSS fallback
- [ ] 新业务逻辑归 Domain/Feature/Capability 所有
- [ ] 没有新增 `src/common` 逻辑、platform alias 或 retired design runtime
- [ ] 中英文 README 与当前 V3 实现一致
- [ ] 未提交普通构建产物、IDE 私有文件或密钥

报告问题时请提供复现步骤、设备/模拟器信息、Node.js 与 AIoT Toolkit 版本、相关日志和预期行为，并先删除账号、设备标识等敏感信息。