// 静默 skip 守卫的用例名白名单（R9 单源）。
// 随批次同改本文件与 S3 spec §11.2 末段；判据只按名字，不比较条数。
export const SKIP_ALLOWLIST = [
  'TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验）',
  'TC-E27 只写源不 aas sync → 本机 Test-Path 为 False（探针式，不碰 dev-workflow 本体）',
];
