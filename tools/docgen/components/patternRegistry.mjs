// 模式登记册（P2-8）：每个槽位一条模式定义。P2 内只登记不强制翻译闭环。
export const DOMAIN = '议会评审';

// ASCII 开头（首字符码 <128）的 role（UI 评委 / AI 评委）在派生式里前置一个空格，与迁移前现卡逐字一致（spec §3 派生式注）
// 谓词与 testcase【DESC】判据同一口径 = 任意 ASCII，不限字母（原先 [A-Za-z] 会让数字开头 role 与判据分歧）
const roleSep = (role) => (typeof role === 'string' && role.charCodeAt(0) < 128 ? ' ' : '');

export const patternRegistry = {
  description: {
    parliament: (role, when, domain = DOMAIN) => `在${domain}中担任${roleSep(role)}${role}。${when}时调用`,
    handwritten: (identity, when, notWhen) => `${identity}。${when}时调用。Do not use for ${notWhen}。`,
  },
  identityMaster: '资深{role}，对{dim1}与{dim2}有经验直觉',
  tools: { readOnly: ['Read', 'Glob', 'Grep'], sdet: ['Read', 'Glob', 'Grep', 'Write', 'Edit'] },
  outputKind: new Set(['issue-card', 'observation', 'audit', 'testcase']),
  sharedBlock: new Set(['SIX_METHODS', 'DETECTIVE_RULES', 'AUDIT_RULES']),
};
