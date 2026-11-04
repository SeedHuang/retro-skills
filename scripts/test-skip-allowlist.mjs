// 静默 skip 守卫的用例名白名单（R9 单源）。
// 随批次同改本文件与 S3 spec §11.2 末段；判据只按名字，不比较条数。
// S-B（spec §11.2.7 第 4 步末句）：依赖「本批 BASE 的 diff 形态」的断言归**一次性档**，
// 默认 skip、须 `SB_SHAPE_ONESHOT=1`（+ 可选 `SB_BASE=<新提交>`）手工跑 → 三条进白名单。
export const SKIP_ALLOWLIST = [
  'TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验）',
  'TC-E27 只写源不 aas sync → 本机 Test-Path 为 False（探针式，不碰 dev-workflow 本体）',
  'SB-TC-06（一次性）：与 SB_BASE 比每席都变 + 每席一个路径',
  'SB-TC-32（S-C 位置型三段，一次性）：每席在「职责」「一定会」「本席清单」各有删增，且不触达其它段',
  'SB-TC-25（一次性）④：与 SB_BASE 比每席都变',
];
