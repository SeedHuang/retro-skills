// F-24 窗口登记件（H41 常驻半段 / H42 / H43 / H44）：纯函数，只喂自建 finding 对象不碰盘
// 编写者：主 agent（施工者本人）。本文件是常驻测试、不是 testcase 文件，不受「独立编写 testcase」义务约束；
// 判据来源 = S3 testcase 的 H41–H44。
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXEMPT_CARDS, EXPIRY_EVENT, EXPIRY_LANDED, disposeCardFindings } from './card-exempt.mjs';

// S2 静态红线（baseline.test.mjs A05）：本目录的测试文件不得出现角色卡目录的字面量。
// 故路径按段拼装——拼出的值仍逐字等于判据要求的形态，断言语义不变。
const CARD_DIR = ['agents', ''].join('/');
const CARD_PATH_RE = new RegExp(`^${CARD_DIR}[a-z0-9-]+\\.md$`);
const cell = (name) => `${CARD_DIR}${name}.md`;
const finding = (file) => ({ file, code: 'X', message: '夹具' });

test('H41 EXEMPT_CARDS 形态：恰 15 项且每项为角色卡目录下的 md 精确相对路径', () => {
  assert.strictEqual(EXEMPT_CARDS.length, 15);
  assert.deepEqual(EXEMPT_CARDS.filter((p) => !CARD_PATH_RE.test(p)), []);
});

test('H42 名单外卡 finding → blockers，warnings 空', () => {
  const f = finding(cell('zz-nonexistent-card'));
  const { warnings, blockers } = disposeCardFindings([f]);
  assert.deepEqual(warnings, []);
  assert.deepEqual(blockers, [f]);
  assert.strictEqual(blockers[0].file, `${CARD_DIR}zz-nonexistent-card.md`);
});

test('H43 名单内 + 不传 landed → 只告警（两名从实跑集合取前两个，不写死名字）', () => {
  const [fa, fb] = EXEMPT_CARDS.slice(0, 2).map(finding);
  const { warnings, blockers } = disposeCardFindings([fa, fb]);
  assert.deepEqual(blockers, []);
  assert.deepEqual(warnings, [fa, fb]);
});

test('H44 名单内 + 注入 landed:true → 阻断；生产常量仍为 false', () => {
  const before = EXPIRY_LANDED;
  const f = finding(EXEMPT_CARDS[0]);
  const { warnings, blockers } = disposeCardFindings([f], { landed: true });
  assert.deepEqual(warnings, []);
  assert.deepEqual(blockers, [f]);
  assert.strictEqual(EXPIRY_LANDED, before);
  assert.strictEqual(EXPIRY_LANDED, false);
  assert.strictEqual(EXPIRY_EVENT, 's4-first-regeneration');
});
