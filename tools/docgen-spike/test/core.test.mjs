import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TEMPLATE_PATH, TEMPLATE_H2S, assertTemplateClean, render,
  buildData, renderBlocks, renderBaseline, BASELINE_RULES, validateData,
} from '../specTestCaseGate.mjs';
import { compareBuffers } from '../compare.mjs';

const TARGET = 'rules/spec-testcase-gate.md';

test('模板恰有 9 个 H2、12 个占位符、LF、单尾换行', () => {
  const tpl = readFileSync(TEMPLATE_PATH, 'utf8');
  assert.deepEqual(tpl.match(/^## .*$/gm), TEMPLATE_H2S);
  assert.equal((tpl.match(/\{\{[a-zA-Z]+\}\}/g) ?? []).length, 12);
  assert.equal(tpl.includes('\r'), false);
  assert.equal(tpl.endsWith('\n'), true);
  assert.equal(tpl.endsWith('\n\n'), false);
  assertTemplateClean(tpl);
});

test('render 替换标量键与块键，未知键抛 MissingPlaceholder', () => {
  const tpl = '## A\n\n{{title}}\n\n{{criteriaTable}}\n';
  assert.equal(
    render({ title: 'T', criteriaTable: '| x |' }, tpl),
    '## A\n\nT\n\n| x |\n',
  );
  assert.throws(
    () => render({ title: 'T' }, tpl),
    (e) => e.code === 'MissingPlaceholder' && e.key === 'criteriaTable',
  );
});

test('V1：buildData + 模板渲染 === target 逐字节', () => {
  const tpl = readFileSync(TEMPLATE_PATH, 'utf8');
  const actual = render(buildData(), tpl);
  const expected = readFileSync(TARGET, 'utf8');
  assert.equal(Buffer.compare(Buffer.from(actual), Buffer.from(expected)), 0);
});

test('buildData：5 条判据、9 节、块键齐全', () => {
  const data = buildData();
  assert.equal(data.criteria.length, 5);
  assert.deepEqual(data.criteria.map((c) => c.id), ['文件存在', '编写者独立', '用例合格', 'spec 外链', '一起送审']);
  const blocks = renderBlocks(data);
  assert.deepEqual(Object.keys(blocks).sort(), ['criteriaTable', 'examples', 'fourElements', 'trigger', 'verification']);
  assert.match(blocks.criteriaTable, /^\| # \| 判据 \| 怎么算合格 \|/m);
});

test('baseline：21 条且渲染视图可复算', () => {
  assert.equal(BASELINE_RULES.length, 21);
  const baseline = renderBaseline();
  assert.equal(typeof baseline, 'string');
  assert.equal(baseline, JSON.stringify(BASELINE_RULES, null, 2) + '\n');
  assert.equal(JSON.parse(baseline).length, 21);
});

test('compareBuffers：相同返回 null，单字节差异给出 line/byte', () => {
  assert.equal(compareBuffers(Buffer.from('abc\n'), Buffer.from('abc\n')), null);
  const r = compareBuffers(Buffer.from('abc\nX\n'), Buffer.from('abc\nY\n'));
  assert.equal(r.code, 'Mismatch');
  assert.equal(r.byte, 4);
  assert.equal(r.line, 2);
});

test('validateData：criteria.id 重复 → InvalidRuleType(field=criteria.id)', () => {
  const data = buildData();
  data.criteria[1].id = data.criteria[0].id;
  assert.throws(
    () => validateData(data),
    (e) => e.code === 'InvalidRuleType' && e.field === 'criteria.id',
  );
});
