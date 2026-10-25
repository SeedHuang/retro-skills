import test from 'node:test';
import assert from 'node:assert/strict';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { validateAgentData, exitCodeFor } from '../components/validateAgentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';

const valid = () => ({ data: structuredClone(agentData), table: structuredClone(triggerTable) });
const expectFail = (code, { data, table } = valid(), msg) => {
  try { validateAgentData(data, table); assert.fail(`应抛 ${code}：${msg ?? ''}`); }
  catch (e) { assert.equal(e.code, code); }
};

test('断言 1：name 唯一且合法（regex）；重复 → DuplicateAgentName', () => {
  const { data } = valid();
  data.push({ ...data[0] });
  expectFail('DuplicateAgentName', { data, table: valid().table });
  const bad = valid(); bad.data[0].name = 'BAD_NAME!';
  expectFail('InvalidName', bad);
});

test('断言 3：name/tools 必填非空 → FrontmatterFieldMissing；when 存在性由断言 14 独占（F1）', () => {
  // S10 修正：空 tools → FrontmatterFieldMissing（TC-041）；空 name 归断言 1 InvalidName（TC-095），不在本测试
  const a = valid(); a.data[0].tools = [];
  expectFail('FrontmatterFieldMissing', a);
  // when 缺失 → MissingWhen（断言 14），不是 FrontmatterFieldMissing
  const b = valid(); delete b.table['reviewer-product'].when;
  expectFail('MissingWhen', b);
});

// 席位数与档位数一律派生（不加档后重犯此处：本行曾被写成「15 席 / 四档」的字面量）
test(`断言 4：tools 按席分档（${agentData.length} 席 / ${Object.keys(patternRegistry.tools).length} 档）→ ToolsViolation`, () => {
  const a = valid(); a.data[0].tools = ['Read', 'Write'];
  expectFail('ToolsViolation', a);
});

test('断言 5：sharedBlock 引用存在于枚举 + 同引用枚举同值；无 sharedBlock 席不渲染（N1）', () => {
  const a = valid(); a.data[4].sharedBlock = 'NOPE'; // reviewer-frontend
  expectFail('SharedBlockMissing', a);
  const b = valid(); b.data[4].sharedBlock = 'DETECTIVE_RULES'; // 合法枚举值
  validateAgentData(b.data, b.table); // 合法值应通过
});

test('断言 7：when 格式——不含「在…中担任 / 时调用」、不以「时」结尾 → WhenFormatViolation', () => {
  const a = valid(); a.table['reviewer-product'].when = '当主持人调度对 PRD/spec/plan 做产品视角评审时'; // 尾「时」
  expectFail('WhenFormatViolation', a);
  const b = valid(); b.table['reviewer-product'].when = '在议会评审中担任产品评委。当…';
  expectFail('WhenFormatViolation', b);
});

test('断言 8：派生 description == 句式拼装输出 + 不含「时时」（A 族）；registered 未拆槽席豁免', () => {
  // S11 修正：时时置中、不以「时」结尾（绕过断言 7，TC-088 前置「绕过 §6-7 时」构造）；时时结尾归断言 7 WhenFormatViolation（TC-087）
  const a = valid(); a.table['reviewer-product'].when = '当主持人调度对 PRD/spec/plan 做产品视角评审时时确认';
  expectFail('DescriptionDerivation', a);
});

test('断言 9：route 唯一且存在；重复 → TriggerConflict、悬空 → TriggerMissingRoute（N4）', () => {
  const a = valid(); a.table['reviewer-product'].route = 'ghost-route';
  expectFail('TriggerMissingRoute', a);
  const b = valid(); b.table['senior-sdet'].route = 'reviewer-product'; // 与 product 抢 route
  expectFail('TriggerConflict', b);
});

test('断言 10：when 集合两两唯一 → DuplicateWhen', () => {
  const a = valid();
  a.table['senior-sdet'].when = a.table['reviewer-product'].when;
  expectFail('DuplicateWhen', a);
});

test('断言 11：outputKind 枚举合法 → InvalidOutputKind', () => {
  const a = valid(); a.data[0].outputKind = 'bogus';
  expectFail('InvalidOutputKind', a);
});

test('断言 12：notWhen.refs ⊆ agentData 键集 → TriggerConflict', () => {
  const a = valid(); a.table['senior-sdet'].notWhen = { text: 'x', refs: ['ghost'] };
  expectFail('TriggerConflict', a);
});

test('断言 13：fallback vacuous（未声明合法；声明须 true 且 route ∈ 键集）', () => {
  const a = valid(); a.table['reviewer-product'].fallback = false;
  expectFail('TriggerMissingRoute', a); // 声明但值非 true
  const b = valid(); b.table['reviewer-product'].fallback = true;
  validateAgentData(b.data, b.table); // 合法
});

test('断言 14：每席 when 非空（对已拆槽席）→ MissingWhen；registered 未拆槽席豁免', () => {
  const a = valid(); delete a.table['senior-sdet'].when;
  expectFail('MissingWhen', a);
  // 12 席 registered 未拆槽（triggerTable 无条目）→ 豁免，validate 通过
  validateAgentData(valid().data, valid().table);
});

test('退出码五档映射：exitCodeFor 对齐 §7（21+10+6+1=38）', () => {
  assert.equal(exitCodeFor('MissingWhen'), 1);
  assert.equal(exitCodeFor('UnsupportedKind'), 2);
  assert.equal(exitCodeFor('DraftNotFound'), 3);
  assert.equal(exitCodeFor('NotAuthorized'), 4);
  assert.equal(exitCodeFor('Mismatch'), 1);
  assert.equal(exitCodeFor('DanglingBaselineEntry'), 2);
});
