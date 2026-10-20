import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentData } from '../components/agentData.mjs';

const tpl = () => readFileSync('tools/docgen/templates/agent-handwritten.md.tpl', 'utf8');
const entry = () => agentData.find((a) => a.name === 'senior-sdet');

test('TC-006：9 节逐字全等且顺序一致', () => {
  const got = [...tpl().matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(got, [
    '你是谁',
    '你负责三件事',
    '三条铁律',
    '输入（四样，缺一不写）',
    '测试设计固定清单（每条必答，"没问题"也要写结论）',
    '自由探索（必做）',
    '输出格式',
    '通用纪律',
    '边界',
  ]);
});

test('TC-002(b)：槽位恰 7 种（字典序）', () => {
  const uniq = [...new Set([...tpl().matchAll(/\{\{[A-Z_]+\}\}/g)].map((x) => x[0]))].sort();
  assert.deepEqual(uniq, [
    '{{DESCRIPTION}}',
    '{{FIXED_LIST}}',
    '{{HEADING}}',
    '{{IDENTITY}}',
    '{{NAME}}',
    '{{SOURCE_LINE}}',
    '{{TOOLS}}',
  ]);
});

test('TC-002(c)：模板纯度（从数据取值做探针，命中 0）', () => {
  const e = entry();
  const t = tpl();
  const probes = [
    ['heading', e.heading],
    ['role', e.role],
    ['sourceLine', e.sourceLine],
    ...e.identity.split('\n').map((l) => l.trim()).filter((l) => l.length >= 8).map((l) => ['identity-line', l]),
    ...e.fixedList.map((r, i) => [`fixedList[${i}]`, r]),
  ];
  const hit = probes.filter((p) => p[1] && t.includes(p[1]));
  assert.deepEqual(hit.map((p) => p[0]), []);
});

test('TC-002(d)：tools 行逐字 == tools: {{TOOLS}}', () => {
  assert.equal(tpl().split('\n').find((l) => l.startsWith('tools:')), 'tools: {{TOOLS}}');
});

test('TC-023：两套模板均无 {{NOT_WHEN}} 与裸 notWhen', () => {
  for (const p of ['tools/docgen/templates/agent.md.tpl', 'tools/docgen/templates/agent-handwritten.md.tpl']) {
    const s = readFileSync(p, 'utf8');
    assert.equal(s.includes('{{NOT_WHEN}}'), false, `${p} 含 {{NOT_WHEN}}`);
    assert.equal(s.includes('notWhen'), false, `${p} 含裸 notWhen`);
  }
});
