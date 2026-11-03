// `Card` = S1 §4 `:58-67` 的全量 12 键（spec §4 `:89`）；缺任一键 → 拒绝渲染。
// 独立成**叶模块**（零 import）：`seatLoader.mjs`（席文件 8 键判）与 `cardPipeline.mjs`（buildOne 派生后
// 的 12 键全量判）都要用它。若它留在 `cardPipeline.mjs`，`seatLoader → cardPipeline → agentData → seatLoader`
// 会成环，入口为 `seatLoader` 或 `cardPipeline` 时本常量处于 TDZ（2026-11-03 代码审查实测：两入口均 exit 1）。
export const CARD_KEYS = ['seat', 'name', 'description', 'tools', 'duty', 'scenes', 'signals', 'must', 'never',
  'categories', 'checkItems', 'rationale']
