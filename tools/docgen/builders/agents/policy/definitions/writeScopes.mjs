// 写作用域（S6-B spec §3.2）：每 scope 描述「允许写的落点」与「禁写项排除」。
// 排除项是 `pathGroups` 的项 `id`（不是字面、不是组 ID）；`review.ledger` 无排除、`spec.testcase` 仅排除 `code.test`。
// 本文件的 `roleKind` / `label` 是描述性文本（不是权限授予）；不得含任一席 `display`（不变量 3 的显示名扫描面）。
export const writeScopes = {
  'review.ledger': {
    roleKind: '评审席',
    label: '本次评审账本（`.session/reviews/<本次>/`；归档后 `docs/superpowers/reviews/<本次>/`）目录内的产物',
    hostRule: '不得写 `progress.md`（只由主持人写，段二 / 段三由主持人从责任席的产出转录）',
    excludePathItems: [],
  },
  'spec.testcase': {
    roleKind: '测试设计',
    label: '本次 spec 同目录的 `-testcase.md` 与同目录由你负责的测试设计文档',
    hostRule: '不得写 `progress.md`（只由主 agent 写）',
    excludePathItems: ['code.test'],
  },
};
