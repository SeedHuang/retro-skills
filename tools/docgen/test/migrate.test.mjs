import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildData, render, renderBlocks, validateData, assertTemplateClean, TEMPLATE_PATH } from '../components/specTestCaseGate.mjs';
import { compareBuffers, checkEnvironment, assertInside } from '../components/compare.mjs';

const TEMPLATE = () => readFileSync(TEMPLATE_PATH, 'utf8');

test('V1 等价：buildData + 模板渲染 === target 逐字节（rule 侧）', () => {
  const target = readFileSync(new URL('../../../rules/spec-testcase-gate.md', import.meta.url), 'utf8');
  const data = buildData();
  assertTemplateClean(TEMPLATE());
  const rendered = render(data, TEMPLATE());
  assert.equal(rendered, target);
  assert.equal(compareBuffers(Buffer.from(rendered), Buffer.from(target)), null);
});

test('V2b 等价：CRLF 不归一 → Mismatch（非 EnvironmentEOL）', () => {
  const t = TEMPLATE().replace(/\n/g, '\r\n');
  try { checkEnvironment(Buffer.from(t), 'template'); assert.fail('应报 CR'); }
  catch (e) { assert.equal(e.code, 'EnvironmentEOL'); assert.equal(e.violation, 'CR'); }
});

test('V6 等价：assertTemplateClean 拦 target 签名 + 探针', () => {
  const bad = TEMPLATE() + '\n一条 spec 要算「可交付」，下面五条必须同时成立，缺一不合格：';
  try { assertTemplateClean(bad); assert.fail('应拦 TemplateHardcoded'); }
  catch (e) { assert.equal(e.code, 'TemplateHardcoded'); }
});

test('V8 等价：BOM → CR → INVALID_UTF8 顺序', () => {
  for (const [buf, v] of [[Buffer.from([0xef, 0xbb, 0xbf, 0x0a]), 'BOM'], [Buffer.from('a\r\nb\n'), 'CR'], [Buffer.from([0xff, 0x0a]), 'INVALID_UTF8']]) {
    try { checkEnvironment(buf, 'target'); assert.fail(`应报 ${v}`); }
    catch (e) { assert.equal(e.violation, v); }
  }
});

test('V11 等价：assertInside 越界 → InvalidOutputPath', () => {
  try { assertInside('C:/repo/.tmp-test', 'C:/repo/rules/x.md', 'output'); assert.fail('应越界'); }
  catch (e) { assert.equal(e.code, 'InvalidOutputPath'); }
});
