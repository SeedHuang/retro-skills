// A 表并入 8 码冒烟：render.mjs 已实现零测试面（§0.2 #16）。render.mjs 的 demo 循环已由 Task 9 Step 4 加守卫，import 不打印。
// 编写者 / 独立性声明：senior-sdet 子代理，全新上下文；≠ spec 作者、≠ 施工者
import test from 'node:test';
import assert from 'node:assert/strict';
import { personalActions, renderCard, renderReadme } from './render.mjs';
import { SEATS, SHARED_ACTIONS } from './data.mjs';
import { splitRow } from '../execution-matrix/markdown-rows.mjs';

const clone = () => structuredClone(SEATS[0]);

test('I01 合并纪律三码冒烟（DuplicateStatement / OverrideWithoutReason / PointlessOverride）', () => {
  const a = clone();
  a.own.push({ ...a.own[0] });
  assert.throws(() => personalActions(a), /DuplicateStatement/);

  const b = clone();
  b.own.push({ id: 'a01', kind: 'must', trigger: '写结论时', text: '改了口径' });
  assert.throws(() => personalActions(b), /OverrideWithoutReason/);

  const baseA01 = SHARED_ACTIONS.find((x) => x.id === 'a01');
  const c = clone();
  c.own.push({ ...baseA01, reason: '无差异' });
  assert.throws(() => personalActions(c), /PointlessOverride/);
});

const I02_CASES = [
  ['MissingTrigger', { id: 'x1', kind: 'must', text: 'T', criterion: 'assertion.hasSource', landing: 'deliverable.body' }, /MissingTrigger/],
  ['MissingCriterion', { id: 'x2', kind: 'must', trigger: 'T', text: 'x', landing: 'deliverable.body' }, /MissingCriterion/],
  ['MissingLanding', { id: 'x3', kind: 'must', trigger: 'T', text: 'x', criterion: 'assertion.hasSource' }, /MissingLanding/],
  ['MissingCriterionImpl', { id: 'x4', kind: 'must', trigger: 'T', text: 'x', criterion: 'assertion.nope', landing: 'deliverable.body' }, /MissingCriterionImpl[\s\S]*criterion=assertion\.nope/],
  ['UnknownLanding', { id: 'x5', kind: 'must', trigger: 'T', text: 'x', criterion: 'assertion.hasSource', landing: 'no.such.landing' }, /UnknownLanding[\s\S]*landing=no\.such\.landing/],
];

test('I02 必填与登记五码冒烟（renderCard 消费路径）', () => {
  for (const [name, action, re] of I02_CASES) {
    const s = clone();
    s.own.push(action);
    assert.throws(() => renderCard(s), re, name);
  }
});

// I03：README 是给人读的唯一表格投影——与 checks.mjs 同源转义（竖线 / 换行 / 反引号）
// 两份表列数不同（动作 7 列 / 覆盖记录 5 列）：按连续 `|` 行块分组，各块与本块表头比
test('I03 README 表格转义：含 | 与换行的动作文本 → 每行列数 = 本块表头列数', () => {
  const s = clone();
  s.own.push({ id: 'x9', kind: 'must', trigger: 'T | 触发', text: 'A | B\n第二行', criterion: 'assertion.hasSource', landing: 'deliverable.body' });
  const md = renderReadme(s);
  const blocks = [];
  let cur = [];
  for (const l of md.split('\n')) {
    if (l.startsWith('|')) cur.push(l);
    else if (cur.length) { blocks.push(cur); cur = []; }
  }
  if (cur.length) blocks.push(cur);
  assert.equal(blocks.length >= 2, true, md);
  for (const block of blocks) {
    const width = splitRow(block[0]).length;
    assert.deepEqual(block.filter((l) => splitRow(l).length !== width), [], block.join('\n'));
  }
  assert.ok(md.includes('<br>'), '换行应压成 <br>');
});

// I04：卡面是散文字符串——换行不压掉会把一条 bullet 截成两行
test('I04 卡面散文压掉换行（bullet 不被截断）', () => {
  const s = clone();
  s.own.push({ id: 'x8', kind: 'must', trigger: 'T', text: '第一行\n第二行', criterion: 'assertion.hasSource', landing: 'deliverable.body' });
  const md = renderCard(s);
  assert.ok(md.includes('第一行 第二行'), md);
  assert.equal(md.includes('第一行\n第二行'), false);
});
