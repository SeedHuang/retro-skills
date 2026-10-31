import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentData } from '../components/agentData.mjs';
import { renderByName } from '../components/renderByName.mjs';
import { renderSeat } from '../components/cardPipeline.mjs';
import { CARD_SEGMENTS } from '../card-model/vocab/card-must-fields.mjs';
import { renderIndex } from '../components/renderReadme.mjs';

// S4 Task 7：旧模板（agent.md.tpl）与 legacyOutputFormats 已删除；本文件断言全部改走新卡等价面。
const entry = () => agentData.find((a) => a.name === 'reviewer-audit');
const tpl = () => readFileSync('tools/docgen/templates/agent-card.md.tpl', 'utf8');

test('渲染结果与盘上卡逐字节相等（新卡分支）', () => {
  const actual = renderByName('reviewer-audit');
  const expected = readFileSync('agents/reviewer-audit.md', 'utf8');
  assert.equal(Buffer.compare(Buffer.from(actual), Buffer.from(expected)), 0);
});

test('卡面 7 段齐且顺序 = CARD_SEGMENTS 单源', () => {
  const got = [...renderByName('reviewer-audit').matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(got, [...CARD_SEGMENTS]);
});

test('新卡模板纯度：不含本席身份 / 清单原文 / 角色名，含必须槽位', () => {
  const t = tpl();
  assert.ok(!t.includes('资深审计专员'));
  assert.ok(!t.includes('卡片合规：'));
  assert.ok(!t.includes('审计专员'));
  assert.ok(t.includes('{{DUTY}}'));
  assert.ok(t.includes('{{CHECK_TABLE}}'));
  assert.ok(t.includes('{{BOUNDARY}}'));
});

test('数据变异：改 card.duty.action 只影响卡面「动作」一行', () => {
  const a = entry();
  const before = renderSeat('reviewer-audit').card;
  const keep = a.card.duty.action;
  try {
    a.card.duty.action = `${keep}（变异）`;
    const after = renderSeat('reviewer-audit').card;
    const diff = after.split('\n').filter((line, i) => line !== before.split('\n')[i]);
    assert.equal(diff.length, 1, `变异影响了 ${diff.length} 行`);
    assert.ok(diff[0].includes('（变异）'));
  } finally {
    a.card.duty.action = keep;
  }
});

test('本席清单 7 条逐条在位（原固定清单的等价面）', () => {
  const items = entry().card.checkItems;
  assert.equal(items.length, 7);
  for (const it of items) {
    assert.match(it.id, /^audit\./);
    assert.equal(it.subject, 'reviewer-audit.card');
    assert.ok(it.label.includes('审计席卡'));
  }
  const s = renderSeat('reviewer-audit').card;
  assert.equal((s.match(/^\| \d+ \| 审计席卡：/gm) || []).length, 7);
});

test('「一定会」表 5 行（4 条共享 + 1 条自由探索）+ tools 行逗号空格', () => {
  const s = renderSeat('reviewer-audit').card;
  assert.match(s, /^tools: Read, Glob, Grep, Write, Edit, RunCommand$/m);
  assert.equal((s.match(/^\| \d+ \| [^|]+ \| trigger:/gm) || []).length, 5);
});

test('共享层上移：4 条 shared must 出现在卡面（旧 sharedBlock 的等价面）', () => {
  const s = renderSeat('reviewer-audit').card;
  for (const id of ['shared.impartial-long-term', 'shared.evidence', 'shared.plain-expression', 'shared.no-fake-problem']) {
    assert.ok(s.includes(id), `卡面缺共享 must：${id}`);
  }
  assert.equal(s.includes('### 审计铁律'), false, '新卡不渲染共享散文块');
});

test('frontmatter 三字段齐且 description 为触发条件直出', () => {
  const s = renderSeat('reviewer-audit').card;
  assert.match(s, /^name: reviewer-audit$/m);
  assert.match(s, /^description: 当议会评审需要过程标准核对、轮际对账或交付审计$/m);
  assert.match(s, /^tools: Read, Glob, Grep, Write, Edit, RunCommand$/m);
});

test('边界段取自权限物料单源（非 DEFAULT_BOUNDARY）', () => {
  const s = renderSeat('reviewer-audit').card;
  const sec = s.slice(s.lastIndexOf('## 边界'));
  assert.equal(sec.includes('你是只读评审角色：不得创建、修改、删除任何文件'), false, 'producer 席不得落默认只读句');
  assert.ok(sec.includes('只允许写'), '边界段必须含「只允许写」清单');
});

test('README 投影：职责缘由非空 + 覆盖记录三列表头', () => {
  const r = renderSeat('reviewer-audit');
  assert.ok(r.readme.includes('## 职责缘由'));
  assert.ok(r.readme.includes('| id | changed | reason |'));
});

test('index 投影：五列表头 + 每席一行链接', () => {
  const cards = agentData.map((a) => a.name);
  const idx = renderIndex(cards.map((name) => ({ name, description: '', seat: name })));
  assert.ok(idx.includes('| 席名 | 职责一句 | 维度 | 输出类型 | 链接 |'));
  assert.equal((idx.match(/^\| [a-z].*\| `docs\/agents\/.*\.md` \|$/gm) || []).length, cards.length);
});

test('渲染幂等：连跑两次产物逐字相等', () => {
  const a = renderSeat('reviewer-audit');
  const b = renderSeat('reviewer-audit');
  assert.equal(a.card, b.card);
  assert.equal(a.readme, b.readme);
});

test('产物无 CR/BOM/绝对路径/槽位残留（跨平台与陈旧槽位守卫）', () => {
  const s = renderSeat('reviewer-audit').card;
  assert.equal(s.includes('\r'), false, '卡面不得含 CR');
  assert.equal(s.charCodeAt(0) === 0xfeff, false, '卡面不得带 BOM');
  assert.equal(/[A-Z]:\\/.test(s), false, '卡面不得含盘符绝对路径');
  assert.equal([...s.matchAll(/\{\{[A-Z_]+\}\}/g)].length, 0, '不得残留槽位');
});

test('README 以单个换行收尾（写盘比对面逐字节安全）', () => {
  const r = renderSeat('reviewer-audit').readme;
  assert.ok(r.endsWith('\n'), 'README 末尾必须恰一个换行');
  assert.equal(r.endsWith('\n\n'), false, 'README 末尾不得多空行');
});
