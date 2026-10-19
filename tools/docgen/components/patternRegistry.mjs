// 模式登记册（P2-8）：每个槽位一条模式定义。P2 内只登记不强制翻译闭环。
export const patternRegistry = {
  description: {
    parliament: (role, when) => `在议会评审中担任${role}。${when}时调用`, // 13 席，domain 常量
    handwritten: (identity, when, notWhen) => `${identity}。${when}时调用。Do not use for ${notWhen}。`,
  },
  identityMaster: '资深{role}，对{dim1}与{dim2}有经验直觉', // 仅未来加席目标；13 席现状 = 已识别例外（常量转录）
  tools: { readOnly: ['Read', 'Glob', 'Grep'], sdet: ['Read', 'Glob', 'Grep', 'Write', 'Edit'] },
  outputKind: new Set(['issue-card', 'observation', 'audit', 'testcase']),
  sharedBlock: new Set(['SIX_METHODS', 'DETECTIVE_RULES', 'AUDIT_RULES']),
};
