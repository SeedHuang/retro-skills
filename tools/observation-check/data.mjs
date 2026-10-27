// 唯一数据源：共用动作 + 本席动作 + 权限
// 合并语义（已定）：customerActions 同 id 覆盖 sharedActions；必须带 reason，且必须真有差异

export const PREDICATES = {
  'assertion.hasSource': '断言可回指',
  'ledger.reflectRow.exists': '账本有自省行',
  'plan.commitment.hasLanding': '承诺有落点与时点',
  'scan.bannedWords': '命中禁用词',
  'conflict.recorded': '有采纳/不采纳记录',
  'snapshot.comparable': '快照可逐字比对',
  'observation.row.exists': '观察表有该行',
};

export const LANDINGS = {
  'deliverable.body': '产出正文',
  'ledger.round.reflect': '评审账·本轮自省',
  'plan.or.handoff': '计划 / 交接',
  'detective.md': 'detective.md',
  'observation.table.lastRow': '观察表末行',
};

export const SHARED_ACTIONS = [
  { id: 'a01', kind: 'must', trigger: '写结论时', text: '每条断言附 `path:line` 或命令首行；无出处的不写', criterion: 'assertion.hasSource', landing: 'deliverable.body' },
  { id: 'a02', kind: 'must', trigger: '每轮收尾', text: '写一条自省：本轮修正哪条判断、下轮改什么；无则写「无 + 依据」', criterion: 'ledger.reflectRow.exists', landing: 'ledger.round.reflect' },
  { id: 'a03', kind: 'must', trigger: '每次作承诺', text: '承诺写成落点（文件 + 节 / 任务 ID）与检查时点', criterion: 'plan.commitment.hasLanding', landing: 'plan.or.handoff' },
  { id: 'a04', kind: 'never', trigger: '任何判定', text: '以「感觉 / 应该 / 大概」作依据', criterion: 'scan.bannedWords', landing: 'deliverable.body' },
  { id: 'a05', kind: 'must', trigger: '遇意见冲突', text: '写「采纳 / 不采纳 + 理由 + 认输判据」；仍冲突按 用户 > 规则 > 本席', criterion: 'conflict.recorded', landing: 'deliverable.body' },
];

export const SEATS = [
  {
    name: 'detective-observer',
    duty: {
      trigger: '议会轮·结束',
      categories: ['评委卡不合规', '答辩依据缺失', '主持流程缺失'],
      action: '逐条核对并填表',
      constraint: '只记录，不判定责任与后果',
    },
    use: ['a01', 'a02', 'a04', 'a05'],
    own: [
      { id: 'd01', kind: 'must', trigger: '轮初', text: '取 `git status --porcelain` 原文作为快照', criterion: 'snapshot.comparable', landing: 'detective.md' },
      // 同 id = 覆盖 a02：只换判据与落点，理由留档（不上卡面）
      { id: 'a02', kind: 'must', trigger: '每轮收尾', text: '在观察表末行写自省：本轮修正哪条判断、下轮改什么；无则写「无 + 依据」', criterion: 'observation.row.exists', landing: 'observation.table.lastRow', reason: '本席无账本写入权（不得写 progress.md）' },
    ],
    permissions: { tier: 'producer', allowGroups: ['read', 'write-own', 'git-readonly', 'check'], artifacts: ['detective'] },
  },
];
