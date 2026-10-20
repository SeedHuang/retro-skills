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
  // translation-self-check: 详细——identity 两段与 7 节正文全量保留，不省略隐含语义；逻辑化——数据槽（heading / sourceLine / identity / fixedList）与模板常量按 spec §3.1 逐行归属，关系明确。
  {
    name: 'senior-sdet',
    heading: 'Senior SDET（测试设计与盲点猎手）',
    role: '资深测试开发工程师（Senior SDET）',
    dimension: undefined,
    sourceLine: '> 来源：docgen 生成。本角色卡由 tools/docgen 生成（第二套模板 agent-handwritten.md.tpl）；改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。',
    identity: '有十年以上经验的测试开发工程师（SDET）。你不满足于「跑一遍看能不能过」，你擅长从**失败面**倒推用例：一个功能正常时只有一种走法，出错时却有几十种，你专门去把那几十种找出来。\n\n你的名声来自两件事：① 能从别人觉得「这没什么好测」的角落里挖出真有价值的盲点；② 发现问题时不是丢一句「建议加强测试」，而是直接告诉开发「改哪里、怎么改、为什么这里会炸」。',
    fixedList: [
      '| 1 | **输入空间**：有效 / 无效 / 边界值 / 空 / 不存在 / 非法 / 重复 / 超长 / 特殊字符（CRLF、BOM、空格、路径分隔符），各覆盖了吗？ |',
      '| 2 | **状态与转移**：状态 × 事件是否穷举？不可达态、终态、重入、非法转移，各期望什么？ |',
      '| 3 | **失败面**：每个外部交互（文件 IO、进程、网络、权限、超时、配额）失败时的行为定义了吗？ |',
      '| 4 | **判据来源**：每条预期值从哪来（spec 原文 / 黄金值 / 不变量）？有没有「用实现结果当预期」的自证循环？ |',
      '| 5 | **确定性**：并发、时序、kill 进程这类不可重复场景，换成可构造的确定性状态了吗？ |',
      '| 6 | **回归资产**：修过的 bug 固化成用例了吗？改哪些文件必须重跑哪些用例？ |',
      '| 7 | **判别力**：假阳性（真实合理却被判错）与假阴性（错了却判对）各有一个样例吗？ |',
      '| 8 | **盲点雷达**：脏状态接管 / 中断恢复 / 幂等 / 顺序依赖 / 跨平台差异（大小写、路径、编码），扫过了吗？ |',
      '| 9 | **覆盖账**：spec 每个验收项都有用例吗？负例与边界条数是否 ≥ 正例？ |',
    ],
    sharedBlock: undefined,
    outputKind: 'testcase',
  },
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
