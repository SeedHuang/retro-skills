// 14 席 agentData（S1 只立骨架；12 席正文转录由 S2/S3/S4 完成，此处以 name/role/dimension/sharedBlock/outputKind 支撑派生与清单）
// 锚点席（reviewer-product / senior-sdet）在 S1 完整拆槽（triggerTable 有 when），供 W4 派生断言验收。
import { patternRegistry } from './patternRegistry.mjs';

const SKELETON = [
  {
    name: 'reviewer-audit',
    role: '审计专员',
    dimension: '独立（标准核对）',
    identity: '资深审计专员，只审各项标准是否达到，不裁技术对错，不提新技术问题。',
    fixedList: [
      '卡片合规：八字段齐（缺证据或建议解法 = 废卡）',
      '级别匹配：P0 需两处冲突证据；P1 需可复现触发序列；否则应降级',
      '答辩合规：判定（承认/反驳/部分承认）+ 依据 + 修法三字段齐',
      '计数一致：卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮',
      '轮际对账：上轮承诺与本轮开卷清单逐项相等（少 = 蒸发，多 = 无来源）',
      '落点真实：修复对照抽查 ≥3，文件:行号真实存在且内容相符',
      '证据可复算：任抽一条沿证据链能重现结果',
    ],
    sharedBlock: 'AUDIT_RULES',
    outputKind: 'audit',
  },
  { name: 'reviewer-product', role: '产品评委', dimension: '产品设计', outputKind: 'issue-card' },
  { name: 'reviewer-interaction', role: '交互评委', dimension: '产品设计', outputKind: 'issue-card' },
  { name: 'reviewer-ui', role: 'UI 评委', dimension: '产品设计', outputKind: 'issue-card' },
  { name: 'reviewer-frontend', role: '前端评委', dimension: '技术实现', sharedBlock: 'SIX_METHODS', outputKind: 'issue-card' },
  { name: 'reviewer-backend', role: '后端评委', dimension: '技术实现', sharedBlock: 'SIX_METHODS', outputKind: 'issue-card' },
  { name: 'reviewer-ops', role: '运维评委', dimension: '技术实现', outputKind: 'issue-card' },
  { name: 'reviewer-qa', role: '测试评委', dimension: '技术实现', outputKind: 'issue-card' },
  { name: 'reviewer-ai', role: 'AI 评委', dimension: '技术实现', outputKind: 'issue-card' },
  { name: 'reviewer-security', role: '安全顾问', dimension: '安全风险', outputKind: 'issue-card' },
  { name: 'reviewer-actuary', role: '精算师', dimension: '成本考量', outputKind: 'issue-card' },
  { name: 'reviewer-reader', role: '读者代表', dimension: '产品设计', outputKind: 'issue-card' },
  { name: 'detective-observer', role: '侦探', dimension: '独立观察', sharedBlock: 'DETECTIVE_RULES', outputKind: 'observation' },
  { name: 'senior-sdet', role: '资深测试开发工程师（Senior SDET）', outputKind: 'testcase' },
].map((s) => ({ tools: s.name === 'senior-sdet' ? patternRegistry.tools.sdet : patternRegistry.tools.readOnly, ...s }));

// 触发表（单一真相，§4.1）：已拆槽锚点席给完整 when；registered 席 S1 不拆槽（triggerTable 无条目 = 豁免）
export const triggerTable = {
  'reviewer-audit': {
    when: '当议会评审需要过程标准核对、轮际对账或交付审计',
    route: 'reviewer-audit',
  },
  'reviewer-product': { when: '当主持人调度对 PRD/spec/plan 做产品视角评审', route: 'reviewer-product' },
  'senior-sdet': {
    when: '当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景',
    route: 'senior-sdet',
    notWhen: { text: '修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）', refs: ['reviewer-qa'] },
  },
};

export const agentData = SKELETON;
export const AGENT_KINDS = { rule: 'rule', agent: 'agent' };
