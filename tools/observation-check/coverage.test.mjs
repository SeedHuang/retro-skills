// B19：registeredIds 单源清单（议会 problems.md §2 派工项）
// 编写者 / 独立性声明：senior-sdet 子代理，全新上下文；≠ spec 作者、≠ 施工者
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REGISTERED_IDS } from './registered-ids.mjs';
import { validateObservation } from './checks.mjs';
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';

test('B19 registeredIds 单源清单：删一个 id 即对账红', () => {
  // ① 单源常量存在且为非空字符串数组
  assert.ok(Array.isArray(REGISTERED_IDS), 'REGISTERED_IDS 必须是数组');
  assert.ok(REGISTERED_IDS.length > 0, 'REGISTERED_IDS 不得为空');
  assert.ok(REGISTERED_IDS.every((id) => typeof id === 'string' && id.length > 0), 'REGISTERED_IDS 元素必须是非空字符串');
  assert.ok(REGISTERED_IDS.includes('k02'), '本判据依赖 k02 在册');

  const { dir, dispose } = makeDir();
  try {
    // ② 合法基具：total = 全量分母、skipped 恰为 k02（对账天然成立）
    const evidence = evidenceLines(dir, ['第一条真实观察行']);
    const doc = docBase({
      evidence,
      items: [
        { id: 'k01', verdict: 'hit', evidence },
        { id: 'k03', verdict: 'na', reason: '不适用' },
      ],
    });

    // ③ 分母删一个 id：total(全量) ≠ registeredIds(缩水) → 必报 CoverageMismatch
    const raised = validateObservation(doc, { registeredIds: REGISTERED_IDS.filter((id) => id !== 'k02') });
    assert.ok(
      raised.errors.some((e) => e.code === 'CoverageMismatch'),
      `删一个 id 后必须对账红，实际：${JSON.stringify(raised.errors)}`,
    );

    // 对照：全量分母下同一 doc 不报 CoverageMismatch（证明上面的红来自分母缩水）
    const full = validateObservation(doc, { registeredIds: REGISTERED_IDS });
    assert.deepEqual(full.errors.filter((e) => e.code === 'CoverageMismatch'), []);
  } finally {
    dispose();
  }
});

// —— 覆盖对账组：B07–B14 + F03（plan Task 10 Step 2；B19 已在上面，不重贴）——

const cov = makeDir();
test.after(cov.dispose);
const covEv = evidenceLines(cov.dir, ['第一条真实观察行']);
const two = () => [
  { id: 'k01', verdict: 'hit', evidence: covEv },
  { id: 'k02', verdict: 'na', reason: '不适用' },
];
const codesOf = (doc, ids = IDS) => validateObservation(doc, { registeredIds: ids }).errors.map((e) => e.code);

test('B07 DuplicateItem', () => {
  const doc = docBase({ items: [...two(), { id: 'k01', verdict: 'na', reason: '重了' }] });
  assert.ok(codesOf(doc).includes('DuplicateItem'));
  // F018：只钉码名不够——重复必须能定位到**第二条**重复项（items[2].id），否则「哪条重复」判不出来
  const errors = validateObservation(doc, { registeredIds: IDS }).errors;
  assert.ok(errors.some((e) => e.code === 'DuplicateItem' && e.path === 'items[2].id'), JSON.stringify(errors));
});

// 每条 = 一组必须产出 CoverageMismatch 的构造（id / message 正则 / 构造函数）
const RECON_CASES = [
  {
    id: 'B08', re: /items 条数/,
    build: () => {
      const a = docBase({ items: two() }); a.coverage.read = 1;                       // items 2 / read 1
      const b = docBase({ items: [...two(), { id: 'k03', verdict: 'miss', reason: '没找到' }] }); b.coverage.read = 2; // items 3 / read 2
      return [a, b];
    },
  },
  {
    id: 'B09', re: /total/,
    build: () => { const a = docBase({ items: two() }); a.coverage.total = 2; return [a]; },
  },
  {
    id: 'B10', re: /read \+ skipped/,
    build: () => {
      const a = docBase({ items: two() }); a.coverage.skipped = ['k03']; a.coverage.read = 1;
      const b = docBase({ items: two() }); b.coverage.total = 4;
      return [a, b];
    },
  },
  {
    id: 'B11', re: /skipped.*k99/,
    build: () => { const a = docBase({ items: two() }); a.coverage.skipped = ['k99']; return [a]; },
  },
  {
    id: 'B12', re: /又判又跳/,
    build: () => {
      const a = docBase({ items: [{ id: 'k01', verdict: 'hit', evidence: covEv }] });
      a.coverage.read = 1;
      a.coverage.skipped = ['k01', 'k02'];
      a.coverage.total = 3;
      return [a];
    },
  },
];

const assertRecon = (id) => {
  const c = RECON_CASES.find((x) => x.id === id);
  assert.ok(c, `RECON_CASES 缺 ${id}`);
  for (const doc of c.build()) {
    const errors = validateObservation(doc, { registeredIds: IDS }).errors;
    assert.ok(errors.some((e) => e.code === 'CoverageMismatch' && c.re.test(e.message)), JSON.stringify(errors));
  }
};

// 用例名保持静态字面（对抗向量表按名字检索承接）；判据体走同一张表，禁删/禁放宽由 F03 行为复核
test('B08 CoverageMismatch：items.length ≠ read（两形态）', () => assertRecon('B08'));
test('B09 CoverageMismatch：total ≠ registeredIds.length', () => assertRecon('B09'));
test('B10 CoverageMismatch：read + skipped ≠ total（两形态）', () => assertRecon('B10'));
test('B11 CoverageMismatch：skipped 含未登记 id', () => assertRecon('B11'));
test('B12 CoverageMismatch：items ∩ skipped ≠ ∅', () => assertRecon('B12'));

test('B13 InvalidCoverage：read > total', () => {
  const doc = docBase({ items: two() });
  doc.coverage.read = 3;
  doc.coverage.total = 2;
  assert.ok(codesOf(doc).includes('InvalidCoverage'));
});

test('B14 正例：skipped 非空且七条全过 → 零错误', () => {
  assert.deepEqual(codesOf(docBase({ items: two() })), []);
});

// F006 / Ruling #15：skipped 是「未判项 id 清单」（集合语义）。重复项让 read + skipped 算术「看起来平」，
// 实际 k03 既未判也未跳 → 静默通过。本条钉住实现补的第 6 条对账判据。
test('B20 CoverageMismatch：skipped 内 id 重复 → CoverageMismatch（message 含「重复」）', () => {
  const doc = docBase({ items: two() });
  doc.coverage.skipped = ['k03', 'k03'];      // 去重后 1 个、原 2 个 → 漏判 1 项
  const errors = validateObservation(doc, { registeredIds: IDS }).errors;
  assert.ok(errors.some((e) => e.code === 'CoverageMismatch' && /重复/.test(e.message)), JSON.stringify(errors));
});

// F03：禁删对账换绿。判据必须是**行为**的——文本匹配可被 `true ||` / 注释蒙过（实测：把断言改成恒真，
// 旧版四条文本谓词全绿）。故这里重新执行同一张 RECON_CASES 表，而不是扫源码字符。
test('F03 覆盖对账五负例存续（禁删对账换绿）', () => {
  // ① 五条构造必须恰为 B08–B12、一条都不能少（删一条 → 这里红）
  assert.deepEqual(RECON_CASES.map((c) => c.id), ['B08', 'B09', 'B10', 'B11', 'B12']);
  // ② 逐条重新执行：把生成用例里的断言改成恒真，也躲不过这一条
  for (const c of RECON_CASES) {
    for (const doc of c.build()) {
      const errors = validateObservation(doc, { registeredIds: IDS }).errors;
      assert.ok(
        errors.some((e) => e.code === 'CoverageMismatch' && c.re.test(e.message)),
        `${c.id} 的构造已不再产生 CoverageMismatch：${JSON.stringify(errors)}`,
      );
    }
  }
  // ③ 选项对象形态的跳过开关（不含 test.skip 字面量）同样不得出现
  const src = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  assert.equal(/[{,]\s*skip\s*:/.test(src), false, '本文件出现跳过选项');
  assert.equal(/\b(only|todo)\s*:/.test(src), false, '本文件出现 only / todo 选项');
});
