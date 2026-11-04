// 静默 skip 守卫的用例名白名单（R9 单源）。
// 随批次同改本文件与 S3 spec §11.1 / §11.2 两处计数；判据只按名字，不比较条数。
// S-B（spec §11.2.7 第 4 步末句）：依赖「本批 BASE 的 diff 形态」的断言归**一次性档**，
// 默认 skip、须 `SB_SHAPE_ONESHOT=1`（+ 可选 `SB_BASE=<新提交>`）手工跑 → 三条进白名单。
// S-D T2（G6，2026-11-04）：`SC-TC-45` / `SC-TC-46` 原为 `if (!SHAPE) return`（默认档空跑仍计 pass，
// `# skipped 0` 掩盖），改 `t.skip()` → 名字进白名单，默认档汇总行如实出现 skip。
export const SKIP_ALLOWLIST = [
  'TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验）',
  'TC-E27 只写源不 aas sync → 本机 Test-Path 为 False（探针式，不碰 dev-workflow 本体）',
  'SB-TC-06（一次性）：与 SB_BASE 比每席都变 + 每席一个路径',
  'SB-TC-32（S-C 位置型三段，一次性）：每席在「职责」「一定会」「本席清单」各有删增，且不触达其它段',
  'SB-TC-25（一次性）④：与 SB_BASE 比每席都变',
  'SC-TC-45 行口径 vs 次数口径（17 行 / 18 处）——整条归一次性档',
  'SC-TC-46 渲染面「主持人」总数 = 30（等价性证明）——整条归一次性档',
];
