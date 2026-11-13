// 边界规则模型（spec `2026-11-13-boundary-logic-interpreter-design.md` §3）。
// 只存「规则结构 + 文案模板 + 指针」：路径 / verb / 清单字面仍归 paths.mjs / commands.mjs / writeScopes.mjs，
// 本文件不复制任何清单成员，因此不是第二真相（唯一事实仍在定义层与席位模型）。
export const boundaryRules = {
  // 写判定：默认拒绝；允许集合 = 席位模型 `permissions.write.allow`（经 `forms[].path` 解析）
  write: {
    policy: 'denyByDefault',
    allowSource: 'permissions.write.allow',
    denySources: ['pathGroups', 'SIGNOFF_LEDGER', 'gitignore'],
    form: '除「权限」段所列落点外，任何写文件或重定向一律禁止（禁写集合 = 策略源 {sources}）。',
  },
  // 命令判定：默认拒绝；允许 = `permissions.command.allow` 反推的命令组；禁止 = forbiddenGroups 全部组
  command: {
    allowSource: 'permissions.command.allow',
    denySource: 'forbiddenGroups',
    envGroup: 'env.assign',
    match: 'longestPrefix',
  },
  // 固定禁令：标签取模型 `_shared.permissionGroups[id].label`；无模型入参时用 fallback（一致性由测试钉住）
  fixedProhibitions: [
    { id: 'adjudicate', form: '不{label}' },
    { id: 'interrupt', form: '无{label}的权力' },
  ],
  permissionLabelFallback: { adjudicate: '裁决他人分歧', interrupt: '中断评审' },
  // 检测可见性：`git status --porcelain` 只看 tracked 工作区；隐式状态与盲区都看不见
  detection: {
    states: [
      { id: 'tracked-dirty', label: 'tracked 未提交', visible: true },
      { id: 'staged', label: 'staged', visible: true },
      { id: 'committed', label: '已提交写', visible: false },
      { id: 'restored', label: '写后还原', visible: false },
      { id: 'ignored', label: '被 gitignore 的路径', visible: false },
    ],
    form: '{ignored}、{committed}与{restored}都看不见——检测门强化留待后续任务。',
  },
  // 越权处置：义务按场景适用；卡面文案是规则陈述，两条复原分支都写
  escalation: {
    recordFields: ['文件', '改前/改后 sha256', '是否可复原', '命令原文'],
    obligations: [
      { id: 'record', actor: 'violator', when: 'always' },
      { id: 'recompute', actor: 'independent', when: 'always' },
      { id: 'restore', actor: 'user', when: 'recoverable', agentForbiddenVerbs: ['checkout', 'restore'] },
      { id: 'baseline', actor: 'violator', when: 'unrecoverable' },
    ],
    forms: {
      record: '越权清单（{fields}）**由越权者写进本人产物**（只限「权限」段所列产物）。{writer}',
      recompute: '复算由独立于越权者的另一席完成（不得自证），复算结论随该席产物一并留档。',
      restore: '可复原（tracked）→ 复原命令由你给出、用户执行（禁 agent 自跑 {verbs}）。',
      baseline: '不可复原（gitignored）→ 以轮初快照（本轮开始时记录的原文）为基线，能比对就比对，不能就明写「不可复原 + 缺失基线」。',
    },
  },
};
