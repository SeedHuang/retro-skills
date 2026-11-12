// 写作用域（S6-B spec §3.2）：每 scope 描述「允许写的落点」与「禁写项排除」。
// 排除项是 `pathGroups` 的项 `id`（不是字面、不是组 ID）；`review.ledger` 无排除、`spec.testcase` 仅排除 `code.test`。
// 本文件的 `roleKind` / `label` 是描述性文本（不是权限授予）；不得含任一席 `display`（不变量 3 的显示名扫描面）。
// `hostRule` 里的 `{host}` 是主持席称谓占位：默认取同 scope 的 `hostNoun`，席级可用 `hostNoun` 覆盖
// （非议会席不得点名「议长」——S4-TC-C03）。只换称谓、不复制整句，避免同一规则出现两份文本。
export const writeScopes = {
  'review.ledger': {
    roleKind: '评审席',
    label: '本次评审账本（`.session/reviews/<本次>/`；归档后 `docs/superpowers/reviews/<本次>/`）目录内的产物',
    hostRule: '不得写 `progress.md`（只由{host}写，内容由{host}从责任席的产出转录）',
    hostNoun: '议长',
    excludePathItems: [],
  },
  'spec.testcase': {
    roleKind: '测试设计',
    label: '本次 spec 同目录的 `-testcase.md` 与同目录由你负责的测试设计文档',
    hostRule: '不得写 `progress.md`（只由主 agent 写）',
    excludePathItems: ['code.test'],
  },
  // S3-A §5 / §9：议长的写作用域（与 `artifacts: progress.md` 对齐；不复用 `review.ledger`）
  // `label` 只写目录、产物名由 ARTIFACTS 槽追加（避免同一句出现两遍 progress.md）；
  // `hostRule` 必须是**禁止式**：模板第 5 行固定前缀「**禁止写**：」，写「可写 …」会自相矛盾。
  'review.host': {
    roleKind: '程序主持',
    label: '本次议会程序账本（`.session/reviews/<本次>/` 目录）',
    hostRule: '不得替他席填写两张审计表（两张审计表只由责任席填写）',
    excludePathItems: [],
  },
};
