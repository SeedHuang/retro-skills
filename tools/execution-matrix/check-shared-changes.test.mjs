// check-shared-changes.test.mjs —— R7 硬闸门：共享项变更须「改前 + 改后 + 用户确认」留齐，且登记与落地一致
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSharedChanges, parseLedger } from './shared-changes/check-shared-changes.mjs';
import { readSharedDefinitions } from './shared-items.mjs';

test('台账现状：三件套齐全 + 登记与权威载体当前定义一致 → 通过', () => {
  const { ok, findings } = checkSharedChanges();
  assert.equal(ok, true, JSON.stringify(findings));
});

test('台账覆盖全部 5 个共享项', () => {
  const { records } = checkSharedChanges();
  const items = new Set(records.map((r) => r.item));
  for (const item of readSharedDefinitions().keys()) {
    assert.ok(items.has(item), `台账缺共享项：${item}`);
  }
});

test('台账解析：跳过表头与分隔行', () => {
  const text = [
    '| 日期 | 共享项 | 改前版 | 改后版 | 用户确认 | 受影响引用方 |',
    '|---|---|---|---|---|---|',
    '| 2026-10-20 | 来源覆盖④ | 前 | 后 | 用户确认 | refs |',
  ].join('\n');
  const records = parseLedger(text);
  assert.equal(records.length, 1);
  assert.equal(records[0].item, '来源覆盖④');
  assert.equal(records[0].before, '前');
  assert.equal(records[0].after, '后');
  assert.equal(records[0].confirmed, '用户确认');
});

test('缺「改前版 / 改后版 / 用户确认」任一件 → SharedChangeIncomplete', () => {
  const COL = { 改前版: [2, 'before'], 改后版: [3, 'after'], 用户确认: [4, 'confirmed'] };
  for (const [label, [col, field]] of Object.entries(COL)) {
    const cells = ['2026-10-20', '来源覆盖④', '前', '后', '用户确认', 'refs'];
    cells[col] = '';
    const text = [
      '| 日期 | 共享项 | 改前版 | 改后版 | 用户确认 | 受影响引用方 |',
      '|---|---|---|---|---|---|',
      `| ${cells.join(' | ')} |`,
    ].join('\n');
    const { findings } = checkSharedChanges({ ledgerText: text });
    assert.ok(
      findings.some((f) => f.code === 'SharedChangeIncomplete' && f.missing === field),
      `缺「${label}」必须报 SharedChangeIncomplete（missing=${field}）`,
    );
  }
});

test('登记的改后版与权威载体当前定义不一致 → SharedDefinitionMismatch', () => {
  const defs = readSharedDefinitions();
  const def = defs.get('来源覆盖④');
  const text = [
    '| 日期 | 共享项 | 改前版 | 改后版 | 用户确认 | 受影响引用方 |',
    '|---|---|---|---|---|---|',
    `| 2026-10-20 | 来源覆盖④ | ${def} | 登记成了别的版本 | 用户确认 | refs |`,
  ].join('\n');
  const { findings } = checkSharedChanges({ ledgerText: text });
  const hit = findings.find((f) => f.code === 'SharedDefinitionMismatch' && f.item === '来源覆盖④');
  assert.ok(hit, '登记的改后版 ≠ 权威载体当前定义必须报 SharedDefinitionMismatch');
  assert.equal(hit.registered, '登记成了别的版本');
  assert.equal(hit.current, def);
});

test('台账缺某个共享项的登记 → SharedDefinitionMismatch（条数 = 共享项数，动态）', () => {
  const text = [
    '| 日期 | 共享项 | 改前版 | 改后版 | 用户确认 | 受影响引用方 |',
    '|---|---|---|---|---|---|',
  ].join('\n');
  const { findings } = checkSharedChanges({ ledgerText: text });
  assert.equal(findings.filter((f) => f.code === 'SharedDefinitionMismatch').length, readSharedDefinitions().size);
});

// —— 「最新记录」按日期取，不按文件出现顺序（否则旧记录补记到末尾会盖住新记录 = 假绿）——

const LEDGER_HEADER = [
  '| 日期 | 共享项 | 改前版 | 改后版 | 用户确认 | 受影响引用方 |',
  '|---|---|---|---|---|---|',
];

test('乱序追加：旧记录出现在文件末尾，仍按日期取最新（不得被旧版盖住）', () => {
  const defs = readSharedDefinitions();
  const rows = [...defs].map(([item, def]) => `| 2026-10-20 | ${item} | 前-${item} | ${def} | 用户确认 | refs |`);
  rows.push('| 2026-10-19 | 来源覆盖④ | 前 | 旧版（已被取代） | 用户确认 | refs |');
  const { ok, findings } = checkSharedChanges({ ledgerText: [...LEDGER_HEADER, ...rows].join('\n') });
  assert.equal(ok, true, `旧记录补记在末尾不应翻转结论：${JSON.stringify(findings)}`);
});

test('乱序追加：更晚日期的未落地变更排在中间，也不得被判通过（原假绿场景）', () => {
  const defs = readSharedDefinitions();
  const rows = [...defs].map(([item, def]) => `| 2026-10-19 | ${item} | 前-${item} | ${def} | 用户确认 | refs |`);
  // 插在最前面：10-20 的变更把「改后版」写成尚未落地的版本
  rows.unshift('| 2026-10-20 | 来源覆盖④ | 前 | 未落地的新版 | 用户确认 | refs |');
  const { ok, findings } = checkSharedChanges({ ledgerText: [...LEDGER_HEADER, ...rows].join('\n') });
  assert.equal(ok, false, '按日期最新那条与当前定义不一致时必须报红');
  const hit = findings.find((f) => f.code === 'SharedDefinitionMismatch' && f.item === '来源覆盖④');
  assert.ok(hit);
  assert.equal(hit.registered, '未落地的新版');
});

test('日期非 YYYY-MM-DD → SharedChangeBadDate', () => {
  const defs = [...readSharedDefinitions()];
  const rows = defs.map(([item, def], i) => `| ${i === 0 ? '2026/10/20' : '2026-10-20'} | ${item} | 前 | ${def} | 用户确认 | refs |`);
  const { findings } = checkSharedChanges({ ledgerText: [...LEDGER_HEADER, ...rows].join('\n') });
  const hit = findings.find((f) => f.code === 'SharedChangeBadDate');
  assert.ok(hit, '非法日期必须报红，否则「取最新」的排序依据不可信');
  assert.equal(hit.date, '2026/10/20');
});
