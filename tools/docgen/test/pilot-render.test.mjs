import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sharedBlocks } from '../components/sharedBlocks.mjs';
// 旧模板的散文块（逐字节基线）；S4 的结构化合同另见 `outputFormats`
import { legacyOutputFormats as outputFormats } from '../components/outputFormats.mjs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { renderAgent } from '../components/renderAgent.mjs';
import { renderByName } from '../components/renderByName.mjs';

test('AUDIT_RULES 是 3 条审计铁律，逐字取自黄金快照 L89-91', () => {
  const s = sharedBlocks.AUDIT_RULES;
  assert.ok(s.startsWith('\n### 审计铁律\n- 轮间核对单与交付审计表必由你本人实例完成；主持人代填即违规\n'));
  assert.ok(s.includes('- 证据栏空 = 不通过，不是待补\n'));
  assert.ok(s.includes('- 你无中断评审权；不裁决技术分歧；机械绿 ≠ 语义真（限度自知并声明）\n'));
  assert.ok(s.endsWith('\n'));
});

test('audit 输出格式含核对项/A 节/B 节/两个结论，逐字取自黄金快照 L32-79', () => {
  const s = outputFormats.audit;
  for (const anchor of [
    '> 声明：本核对单必由审计专员本人实例完成；主持人代填即违规；证据栏空 = 不通过，不是待补。',
    '## 核对项',
    '## A 节 过程闭环',
    '## B 节 按 doc-taxonomy 完成判据逐交付物核对',
    '- 通过',
    '- 不通过（打回清单）：',
  ]) {
    assert.ok(s.includes(anchor), `缺锚点：${anchor}`);
  }
  assert.ok(s.startsWith('\n\n'));
  assert.ok(s.endsWith('\n'));
});

const agent = () => agentData.find((a) => a.name === 'reviewer-audit');
const tpl = () => readFileSync('tools/docgen/templates/agent.md.tpl', 'utf8');

test('渲染结果与黄金快照整文件逐字节相等', () => {
  // S4 迁移后 reviewer-audit 走新卡渲染器：判据不变（渲染产物 == 盘上卡），承载渲染器换成 renderByName 的新分支
  const actual = renderByName('reviewer-audit');
  const expected = readFileSync('agents/reviewer-audit.md', 'utf8');
  assert.equal(Buffer.compare(Buffer.from(actual), Buffer.from(expected)), 0);
});

test('模板纯度：不含本席 identity/fixedList/角色名/审计铁律/## 共享块', () => {
  const t = tpl();
  assert.ok(!t.includes('资深审计专员'));
  assert.ok(!t.includes('卡片合规：'));
  assert.ok(!t.includes('审计专员'));
  assert.ok(!t.includes('### 审计铁律'));
  assert.ok(!t.includes('## 共享块'));
  assert.ok(t.includes('{{TOOLS}}'));
});

test('数据变异：改 identity 只改该行；7 条 fixedList 逐条变异各只改一行', () => {
  const base = renderAgent({
    agent: agent(), trigger: triggerTable['reviewer-audit'], template: tpl(), sharedBlocks, outputFormats,
  });
  const mutated = renderAgent({
    agent: { ...agent(), identity: agent().identity + '（变异）' },
    trigger: triggerTable['reviewer-audit'], template: tpl(), sharedBlocks, outputFormats,
  });
  const diff = mutated.split('\n').filter((line, i) => line !== base.split('\n')[i]);
  assert.equal(diff.length, 1);
  assert.ok(diff[0].includes('（变异）'));

  for (let i = 0; i < 7; i += 1) {
    const fixedList = [...agent().fixedList];
    fixedList[i] += '（变异）';
    const m = renderAgent({
      agent: { ...agent(), fixedList },
      trigger: triggerTable['reviewer-audit'], template: tpl(), sharedBlocks, outputFormats,
    });
    const d = m.split('\n').filter((line, j) => line !== base.split('\n')[j]);
    assert.equal(d.length, 1, `fixedList[${i}] 变异影响了 ${d.length} 行`);
    assert.ok(d[0].includes('（变异）'));
  }
});

test('固定必问清单渲染为 7 行表格 + tools 渲染为逗号空格', () => {
  const s = renderAgent({
    agent: agent(), trigger: triggerTable['reviewer-audit'], template: tpl(), sharedBlocks, outputFormats,
  });
  assert.match(s, /^tools: Read, Glob, Grep, Write, Edit, RunCommand$/m);
  assert.equal((s.match(/^\| \d+ \| .* \| 待答 \|$/gm) || []).length, 7);
});

test('无 sharedBlock 席：共享块整段消失，通用纪律末条与边界之间恰一空行', () => {
  const stub = {
    name: 'stub', role: '桩', dimension: '测试', tools: ['Read'], identity: '桩。',
    fixedList: ['一'], outputKind: 'issue-card',
  };
  const s = renderAgent({
    agent: stub, trigger: { when: '当测试' }, template: tpl(), sharedBlocks, outputFormats,
  });
  assert.ok(s.includes('## 通用纪律'));
  // 判据只看「通用纪律末条 → ## 边界」区间：issue-card 输出格式本身含三连换行，全卡查三连空行会误报
  // 行首锚定且要求恰好一处：正文提及该字面不算命中；产物多出边界节时响亮失败，不静默截到错误区间
  const marks = [...s.matchAll(/^## 边界$/gm)];
  assert.equal(marks.length, 1, '产物应恰有 1 处行首 ## 边界 节');
  const head = s.slice(0, marks[0].index);
  // 判据只判换行数、不锚定模板逐字文案：末条文案被正常改写（间距仍对）时不得假红
  assert.ok(head.endsWith('\n\n'), '末条与边界之间恰一空行');
  assert.ok(!head.endsWith('\n\n\n'), '不得出现连续两空行');
  assert.ok(!s.includes('### 六手法全过'), '无共享块席不得出现六手法');
});
