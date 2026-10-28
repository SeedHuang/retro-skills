// check-plan.mjs 的常驻测试（S4 交付）：58 条 = P01–P47（47）+ P66–P76（11）
//
// 纪律（testcase §0.2 / §1.2）：
//   · 只经 CLI 子进程驱动，**不 import 被测模块内部函数**；
//   · 夹具一律 mkdtempSync 自建、finally 里 rmSync；**不用仓内 plan / PRD / testcase 当夹具**
//     （例外 = 被测对象本身：P45 的文件树快照、P47 的 commands.mjs）；
//   · 路径一律传绝对路径，cwd 也设成临时根（两种基准都能跑通），P44 单独钉相对路径。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, statSync, rmSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLI = resolve(HERE, 'check-plan.mjs')
const REPO = resolve(HERE, '..')

const mkRoot = (files = {}) => {
  const r = mkdtempSync(join(os.tmpdir(), 's4-plan-'))
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(r, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, text)
  }
  return r
}
const R = (root, rel) => join(root, rel)
const run = (root, args) => spawnSync(process.execPath, [CLI, ...args], { cwd: root, encoding: 'utf8' })
const firstLine = (x) => (x.stdout ?? '').split(/\r?\n/)[0]
const withRoot = (files, fn) => {
  const root = mkRoot(files)
  try {
    return fn(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// ── fixtures ─────────────────────────────────────────────────────────────
const PRD_A = [
  '| F | S | 备注 |',
  '|---|---|---|',
  '| F-07 spec ∥ testcase | S1（判据）+ S4（执行细则） | — |',
  '| F-09 plan 门 | S1（条文）+ S4（check-plan.mjs） | — |',
  '| F-13 漂移三分类 | S1（总则）+ S4（sdet 定性执行） | — |',
  '| F-14 分歧举证路由 | S2（内部对齐）+ S4（漂移定性） | — |',
  '| F-01 市场调研角色 | S2 | 新卡 |',
  '| F-24 规则单一来源化 | S6 | — |',
  '',
].join('\n')

const PRD_B = [
  '| F | S | 备注 |',
  '|---|---|---|',
  '| F-01～F-08 | S1 | 定义层 |',
  '| F-09～F-12、F-23 | S4 | 渲染层 |',
  '| F-13～F-16、F-20、F-21 | S2 | 产物合同 |',
  '',
].join('\n')

const TC_A = ['#### P01 甲', '#### P02 乙', '#### P03 丙', '#### P04 丁', ''].join('\n')
const TC3 = ['#### P01', '#### P02', '#### P03', ''].join('\n')
const TC_E = ['#### H01 甲', '#### H02 乙', '| TC-A09 | 边界 | … |', '| H01 | 正 | … |', ''].join('\n')
const TC_NO_ID = ['# testcase', '', '全部用例见评审记录，本文件只写测什么与为什么。', ''].join('\n')

const DEFAULT_MAP = [
  ['F-07', 'spec ∥ testcase', 'Task 1'],
  ['F-09', 'plan 门', 'Task 2'],
  ['F-13', '漂移', 'Task 3'],
  ['F-14', '分歧', 'Task 1'],
]
const DEFAULT_APPENDIX = [
  ['P01', 'Task 1'],
  ['P02', 'Task 2'],
  ['P03', 'Task 3'],
  ['P04', 'Task 1'],
]

// PLAN-A（S3 形态）：正文 F 记号 + MAP-T + 附录 A
function planText(opts = {}) {
  const {
    heads = ['## Task 1: 步骤一', '## Task 2: 步骤二', '## Task 3: 步骤三'],
    consumes = [null, '- Consumes: Task 1', '- Consumes: Task 2'],
    features = ['F-07', 'F-09', 'F-13', 'F-14'],
    tc = 'tc.md',
    mapRows = DEFAULT_MAP,
    appendix = DEFAULT_APPENDIX,
    beforeNodes = '',
    extra = '',
  } = opts
  const out = ['# 夹具 plan', '']
  if (tc) out.push(`**Testcase:** \`${tc}\``, '')
  if (beforeNodes) out.push(beforeNodes, '')
  heads.forEach((h, i) => {
    out.push(h)
    const c = consumes[i]
    if (c) for (const line of String(c).split('\n')) out.push(line)
    out.push('')
  })
  if (features.length) out.push('本 plan 覆盖的功能点：', '', ...features.map((f) => `- ${f} 见下文`), '')
  if (mapRows) {
    out.push('| PRD 功能点 | 一句话 | 本 plan 落点 |', '|---|---|---|')
    for (const r of mapRows) out.push(`| ${r.join(' | ')} |`)
    out.push('')
  }
  if (appendix) {
    out.push('## 附录 A：落点', '', '| ID | 类型 | 落点 |', '|---|---|---|')
    for (const r of appendix) out.push(`| ${r.join(' | ')} |`)
    out.push('')
  }
  if (extra) out.push(extra)
  return out.join('\n')
}

const specLines = (n, sep = '\n', trailing = true) =>
  Array.from({ length: n }, (_, i) => `第 ${i} 行`).join(sep) + (trailing ? sep : '')
const tcIds = (n) => Array.from({ length: n }, (_, i) => `#### P${String(i + 1).padStart(2, '0')}\n`).join('')
const planFixture = (over = {}) => planText(over)

// 常用组合：PRD-A + PLAN-A + TC-A
const std = (over = {}, prd = PRD_A, tc = TC_A) =>
  withRoot({ 'prd.md': prd, 'plan.md': planFixture(over), 'tc.md': tc }, (root) => ({ root }))

const coverage = (root, stage = 'S4') =>
  run(root, ['coverage', '--plan', R(root, 'plan.md'), '--prd', R(root, 'prd.md'), '--stage', stage])
const deps = (root) => run(root, ['deps', '--plan', R(root, 'plan.md')])
const map = (root) => run(root, ['map', '--plan', R(root, 'plan.md')])

// ── A 组：coverage（P01–P10） ─────────────────────────────────────────────
const A_OVERRIDES = {
  countPlan: (line) => {
    const m = /gap (\d+)（prd (\d+) \/ plan (\d+)）/.exec(line)
    return { gap: Number(m[1]), prd: Number(m[2]), plan: Number(m[3]) }
  },
}

test('P01 coverage 4 个功能点全覆盖 → gap 0 / steps ok / exit 0', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText(), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 4 / plan 4）steps ok => ok')
    assert.strictEqual(x.stderr.trim(), '')
    assert.strictEqual(x.stdout.trim().split(/\r?\n/).length, 1)
  })
})

test('P02 coverage 缺 F-13 → gap 1，且不报「无任务落点」（Q29）', () => {
  const map1 = DEFAULT_MAP.filter((r) => r[0] !== 'F-13')
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText({ features: ['F-07', 'F-09', 'F-14'], mapRows: map1 }), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 1)
    assert.match(firstLine(x), /^coverage: gap 1（prd 4 \/ plan 3）steps ok => fail$/)
    assert.match(x.stderr, /^\[check-plan\] coverage：缺 F-13$/m)
    assert.ok(!/F-13 无任务落点/.test(x.stderr), 'Q29：不在交集里的 F 不报落点缺失')
    assert.ok(!x.stdout.includes('缺 F-13'), '违规行不得混进 stdout')
  })
})

test('P03 coverage 多一个 F-99 → 不红，且 gap = prd − plan 自洽', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText({ extra: 'F-99 只在正文出现一次' }), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 4 / plan 4）steps ok => ok')
    const { gap, prd, plan } = A_OVERRIDES.countPlan(firstLine(x))
    assert.strictEqual(gap, prd - plan)
  })
})

test('P04 coverage 一行一组形态（区间 + 顿号 + 反引号内竖线）→ prd 5', () => {
  const feats = ['F-09', 'F-10', 'F-11', 'F-12', 'F-23']
  const mapRows = feats.map((f, i) => [f, '见下文', `Task ${(i % 3) + 1}`])
  mapRows[4] = ['F-23', '见 `a|b` 两路', 'Task 3']
  withRoot({ 'prd.md': PRD_B, 'plan.md': planText({ features: feats, mapRows }), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 5 / plan 5）steps ok => ok')
  })
})

test('P05 coverage S40 不得命中 S4（精确 token），红只落行尾位', () => {
  const prd = ['| F | S | 备注 |', '|---|---|---|', '| F-07 | S40 | — |', '| F-09 | S40 | — |', '| F-13 | S40 | — |', '| F-14 | S40 | — |', ''].join('\n')
  withRoot({ 'prd.md': prd, 'plan.md': planText(), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 1)
    assert.match(x.stderr, /stage S4 在 F→S 表里 0 命中/)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 0 / plan 0）steps ok => fail')
    assert.strictEqual(/ => fail$/.test(firstLine(x)), x.status === 1)
  })
})

test('P06 coverage --stage S9 命中 0 行 → exit 1（PRD 漂移，不是用法错）', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText(), 'tc.md': TC_A }, (root) => {
    const x = coverage(root, 'S9')
    assert.strictEqual(x.status, 1)
    assert.match(x.stderr, /stage S9 在 F→S 表里 0 命中/)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 0 / plan 0）steps ok => fail')
  })
})

test('P07 coverage PRD 无 F→S 表 → exit 2，且无计数行', () => {
  withRoot({ 'prd.md': '# 没有表\n\n正文。\n', 'plan.md': planText(), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 2)
    assert.match(x.stderr, /未找到 F→S 覆盖表/)
    assert.strictEqual(x.stderr.trim().split(/\r?\n/).length, 1)
    assert.ok(!/gap /.test(x.stdout), 'exit 2 不得打计数行')
  })
})

test('P08 coverage 缺 --stage → exit 2', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText(), 'tc.md': TC_A }, (root) => {
    const x = run(root, ['coverage', '--plan', R(root, 'plan.md'), '--prd', R(root, 'prd.md')])
    assert.strictEqual(x.status, 2)
    assert.match(x.stderr.trim(), /^\[check-plan\] 用法错：.*--stage/s)
    assert.ok(!/gap /.test(x.stdout))
  })
})

test('P09 coverage --plan 指向不存在的文件 → exit 2 并打印文件名（反向半段）', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText(), 'tc.md': TC_A }, (root) => {
    const bad = run(root, ['coverage', '--plan', R(root, 'nope.md'), '--prd', R(root, 'prd.md'), '--stage', 'S4'])
    assert.strictEqual(bad.status, 2)
    assert.match(bad.stderr, /nope\.md/)
    assert.strictEqual(bad.stderr.trim().split(/\r?\n/).length, 1)
    const ok = coverage(root)
    assert.ok(!ok.stderr.includes('不存在'), '存在的文件不得出现该报文')
  })
})

// ── B 组：deps（P11–P23 / P74） ──────────────────────────────────────────
const depsCase = (over, expectFirst, expectStatus, extra) =>
  withRoot({ 'plan.md': planText(over), 'tc.md': TC_A }, (root) => {
    const x = deps(root)
    assert.strictEqual(x.status, expectStatus)
    assert.strictEqual(firstLine(x), expectFirst)
    if (extra) extra(x)
  })

test('P11 deps 3 节点线性链', () => {
  depsCase({}, 'deps: cycle 0 dangling 0（nodes 3 / edges 2） => ok', 0, (x) => assert.strictEqual(x.stderr.trim(), ''))
})

test('P12 deps 三种标题形态混合都识别', () => {
  depsCase({ heads: ['## Task 1: a', '### Task 2: b', '### T3'], consumes: [null, '- Consumes: Task 1', '- Consumes: Task 2'] }, 'deps: cycle 0 dangling 0（nodes 3 / edges 2） => ok', 0)
})

test('P13 deps Task2 ↔ Task3 成环 → cycle 2 且报出两条环边', () => {
  depsCase({ consumes: [null, '- Consumes: Task 3', '- Consumes: Task 2'] }, 'deps: cycle 2 dangling 0（nodes 3 / edges 2） => fail', 1, (x) => {
    assert.match(x.stderr, /环 .*Task 2.*Task 3/)
    assert.match(x.stderr, /环 .*Task 3.*Task 2/)
  })
})

test('P14 deps 自环 → cycle 1', () => {
  depsCase({ consumes: ['- Consumes: Task 1', null, null] }, 'deps: cycle 1 dangling 0（nodes 3 / edges 1） => fail', 1, (x) => {
    assert.match(x.stderr, /Task 1\s*→\s*Task 1/)
  })
})

test('P15 deps 指向不存在任务 → dangling 1 且不计入 edges', () => {
  depsCase({ consumes: [null, '- Consumes: Task 1', '- Consumes: Task 9'] }, 'deps: cycle 0 dangling 1（nodes 3 / edges 1） => fail', 1, (x) => {
    assert.match(x.stderr, /Task 9/)
    const m = /dangling (\d+)（nodes (\d+) \/ edges (\d+)）/.exec(firstLine(x))
    assert.strictEqual(Number(m[1]) + Number(m[3]), 2, '两条 Consumes 引用 = 1 条边 + 1 条 dangling')
  })
})

test('P16 deps 「无（…）」整行 + 裸数字都不取 → nodes 4 / edges 2', () => {
  depsCase(
    {
      heads: ['### T1', '### T2', '### T3', '### T4'],
      consumes: [null, '- Consumes: 无（判据全在 S3 spec §11.2 表）', '- Consumes: T2', '- Consumes: Task 1（见 spec:119-126）'],
    },
    'deps: cycle 0 dangling 0（nodes 4 / edges 2） => ok',
    0,
    (x) => assert.strictEqual(x.stderr.trim(), ''),
  )
})

test('P17 deps **Consumes:** 粗体形态同结果', () => {
  depsCase({ consumes: [null, '**Consumes:** Task 1', '**Consumes:** Task 2'] }, 'deps: cycle 0 dangling 0（nodes 3 / edges 2） => ok', 0)
})

test('P18 deps 裸 T3 也认', () => {
  depsCase({ consumes: [null, '- Consumes: T1', '- Consumes: T2'] }, 'deps: cycle 0 dangling 0（nodes 3 / edges 2） => ok', 0)
})

test('P19 deps 两行指同一目标 → 边去重', () => {
  depsCase({ consumes: [null, '- Consumes: Task 1\n- Consumes: Task 1', '- Consumes: Task 2'] }, 'deps: cycle 0 dangling 0（nodes 3 / edges 2） => ok', 0)
})

test('P20 deps Task 2–7 展开为 2..7 → edges 6（五种破折号同值）', () => {
  const heads = Array.from({ length: 8 }, (_, i) => `## Task ${i + 1}: 步骤 ${i + 1}`)
  const consumes = Array.from({ length: 8 }, (_, i) => (i === 7 ? '- Consumes: Task 2–7' : null))
  for (const d of ['–', '～', '~', '—', '-']) {
    const cons = [...consumes]
    cons[7] = `- Consumes: Task 2${d}7`
    withRoot({ 'plan.md': planText({ heads, consumes: cons }), 'tc.md': TC_A }, (root) => {
      const x = deps(root)
      assert.strictEqual(firstLine(x), 'deps: cycle 0 dangling 0（nodes 8 / edges 6） => ok', d)
      assert.strictEqual(x.status, 0, d)
    })
  }
})

test('P21 deps ##### Task 9（h5）不算节点', () => {
  depsCase({ extra: '##### Task 9' }, 'deps: cycle 0 dangling 0（nodes 3 / edges 2） => ok', 0)
})

test('P22 deps 任务块外的 Consumes 提及不产生边', () => {
  depsCase({ beforeNodes: '- **边集**（每个 Task 的 `Consumes:` 只指更小编号）' }, 'deps: cycle 0 dangling 0（nodes 3 / edges 2） => ok', 0)
})

test('P23 deps 0 个任务节点 → exit 1（行尾位就是结论位）', () => {
  withRoot({ 'plan.md': planText({ heads: [], consumes: [], features: ['F-07'], mapRows: null, appendix: null }), 'tc.md': TC_A }, (root) => {
    const x = deps(root)
    assert.strictEqual(x.status, 1)
    assert.strictEqual(firstLine(x), 'deps: cycle 0 dangling 0（nodes 0 / edges 0） => fail')
    assert.match(x.stderr, /\[check-plan\] deps：/)
    assert.strictEqual(/ => fail$/.test(firstLine(x)), x.status === 1)
  })
})

test('P74 deps 区间端点不存在 → 展开后每条各计 dangling（dangling 2）', () => {
  const heads = Array.from({ length: 7 }, (_, i) => `## Task ${i + 1}: 步骤 ${i + 1}`)
  const consumes = Array.from({ length: 7 }, (_, i) => (i === 6 ? '- Consumes: Task 8–9' : null))
  withRoot({ 'plan.md': planText({ heads, consumes }), 'tc.md': TC_A }, (root) => {
    const x = deps(root)
    assert.strictEqual(x.status, 1)
    assert.strictEqual(firstLine(x), 'deps: cycle 0 dangling 2（nodes 7 / edges 0） => fail')
    assert.match(x.stderr, /Task 8/)
    assert.match(x.stderr, /Task 9/)
    assert.strictEqual((x.stderr.match(/^\[check-plan\] deps：/gm) ?? []).length, 2, '展开后每条引用各报一条')
  })
})

// ── C 组：map（P24–P32 / P71） ───────────────────────────────────────────
const mapCase = (files, expectFirst, expectStatus, extra) =>
  withRoot(files, (root) => {
    const x = map(root)
    assert.strictEqual(x.status, expectStatus)
    if (expectFirst) assert.strictEqual(firstLine(x), expectFirst)
    if (extra) extra(x, root)
  })

test('P24 map 附录 A 4 行 ↔ testcase 4 条 → 全绿', () => {
  mapCase({ 'plan.md': planText(), 'tc.md': TC_A }, 'map: missing 0 dangling 0（cases 4 / mapped 4） => ok', 0, (x) => assert.strictEqual(x.stderr.trim(), ''))
})

test('P25 map 同一 ID 在两种载体各一次 → 只算一条', () => {
  const appendix = [['H01', 'Task 1'], ['H02', 'Task 2'], ['TC-A09', 'Task 3']]
  mapCase({ 'plan.md': planText({ appendix }), 'tc.md': TC_E }, 'map: missing 0 dangling 0（cases 3 / mapped 3） => ok', 0)
})

test('P26 map testcase 有 P05 而附录 A 无 → missing 1', () => {
  mapCase({ 'plan.md': planText(), 'tc.md': `${TC_A}\n#### P05 戊\n` }, 'map: missing 1 dangling 0（cases 5 / mapped 4） => fail', 1, (x) => {
    assert.match(x.stderr, /missing.*P05|P05.*missing/)
  })
})

test('P27 map 附录 A 有 P09 而 testcase 无 → dangling 1', () => {
  const appendix = [...DEFAULT_APPENDIX, ['P09', 'Task 3']]
  mapCase({ 'plan.md': planText({ appendix }), 'tc.md': TC_A }, 'map: missing 0 dangling 1（cases 4 / mapped 5） => fail', 1, (x) => {
    assert.match(x.stderr, /P09/)
  })
})

test('P28 map testcase 0 条 ID → exit 1（防恒绿，与 P41 成对照）', () => {
  mapCase({ 'plan.md': planText(), 'tc.md': TC_NO_ID }, null, 1, (x) => {
    assert.match(x.stderr, /testcase 未解析出任何用例 ID/)
    assert.match(firstLine(x), /^map: missing \d+ dangling \d+（cases 0 \/ mapped 4） => fail$/)
  })
})

test('P29 map plan 无 Testcase 行 → exit 2（单行用法错，不报「存量不追溯」）', () => {
  mapCase({ 'plan.md': planText({ tc: null }), 'tc.md': TC_A }, null, 2, (x) => {
    assert.match(x.stderr.trim(), /^\[check-plan\] 用法错：.*Testcase/s)
    assert.ok(!/存量|不追溯/.test(x.stderr), 'Q23：exit 2 不区分「存量不追溯」')
    assert.strictEqual(x.stderr.trim().split(/\r?\n/).length, 1)
    assert.ok(!/(^|\n)(coverage: gap |deps: cycle |map: missing |size: spec )/.test(x.stdout))
  })
})

test('P30 map Testcase 指向的文件不存在 → exit 2 并打印路径', () => {
  mapCase({ 'plan.md': planText({ tc: 'tc-missing.md' }), 'tc.md': TC_A }, null, 2, (x) => {
    assert.match(x.stderr.trim(), /^\[check-plan\] 用法错：/s)
    assert.match(x.stderr, /tc-missing\.md/)
    assert.strictEqual(x.stderr.trim().split(/\r?\n/).length, 1)
    assert.ok(!/(^|\n)(coverage: gap |deps: cycle |map: missing |size: spec )/.test(x.stdout))
  })
})

test('P31 map 附录 A 首列是「组」→ exit 2（结构缺失，不是全 missing）', () => {
  const appendix = [['A', 'Task 9'], ['B', 'Task 9']]
  mapCase({ 'plan.md': planText({ appendix }), 'tc.md': TC_A }, null, 2, (x) => {
    assert.match(x.stderr.trim(), /^\[check-plan\] 用法错：.*(附录 A|首列)/s)
    assert.strictEqual(x.stderr.trim().split(/\r?\n/).length, 1)
    assert.ok(!/(^|\n)(coverage: gap |deps: cycle |map: missing |size: spec )/.test(x.stdout))
  })
})

test('P32 map 全文无「附录 A」节 → exit 2（不是 exit 1）', () => {
  mapCase({ 'plan.md': planText({ appendix: null }), 'tc.md': TC_A }, null, 2, (x) => {
    assert.match(x.stderr.trim(), /^\[check-plan\] 用法错：.*附录 A/s)
    assert.strictEqual(x.stderr.trim().split(/\r?\n/).length, 1)
    assert.ok(!/^map: missing/m.test(x.stdout))
  })
})

test('P71 map 附录 A 同一 ID 2 行 → mapped 按集合去重', () => {
  const appendix = [['P01', 'Task 1'], ['P01', 'Task 2'], ['P02', 'Task 3']]
  const tc = ['#### P01', '#### P02', ''].join('\n')
  mapCase({ 'plan.md': planText({ appendix }), 'tc.md': tc }, 'map: missing 0 dangling 0（cases 2 / mapped 2） => ok', 0, (x) => {
    // 自洽断言：mapped 位 = **附录 A 节内**首列去重后的集合大小（不能把映射表的 F 行算进来）
    const sec = planText({ appendix }).split(/^## /m).find((s) => s.startsWith('附录 A'))
    const ids = new Set((sec.match(/^\|\s*([A-Z][\w-]*?\d{2})\s*\|/gm) ?? []).map((l) => /^\|\s*([A-Z][\w-]*?\d{2})\s*\|/.exec(l)[1]))
    assert.strictEqual(Number(/mapped (\d+)/.exec(firstLine(x))[1]), ids.size)
    assert.ok(!/重复|duplicated|多次出现/i.test(x.stderr))
  })
})

// ── D 组：size（P33–P41 / P72 / P73 / P75） ─────────────────────────────
const sizeRun = (root, rounds = '2') => run(root, ['size', '--spec', R(root, 'spec.md'), '--testcase', R(root, 'tc.md'), ...(rounds === null ? [] : ['--rounds', rounds])])

test('P33 size 100 行 / 3 条 / rounds 2 → 首行逐字', () => {
  withRoot({ 'spec.md': specLines(100), 'tc.md': TC3 }, (root) => {
    const x = sizeRun(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'size: spec 100/350 tc 3/80 rounds 2/3 => ok')
    assert.strictEqual(x.stderr.trim(), '')
  })
})

test('P34 size 恰好 350 / 80 / 3 → 不红（含等号）', () => {
  withRoot({ 'spec.md': specLines(350), 'tc.md': tcIds(80) }, (root) => {
    const x = sizeRun(root, '3')
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'size: spec 350/350 tc 80/80 rounds 3/3 => ok')
  })
})

test('P35 size 351 行 → exit 1', () => {
  withRoot({ 'spec.md': specLines(351), 'tc.md': TC3 }, (root) => {
    const x = sizeRun(root)
    assert.strictEqual(x.status, 1)
    assert.strictEqual(firstLine(x), 'size: spec 351/350 tc 3/80 rounds 2/3 => fail')
    assert.match(x.stderr, /spec.*350|351.*350/)
  })
})

test('P36 size 81 条 ID → exit 1', () => {
  withRoot({ 'spec.md': specLines(100), 'tc.md': tcIds(81) }, (root) => {
    const x = sizeRun(root)
    assert.strictEqual(x.status, 1)
    assert.strictEqual(firstLine(x), 'size: spec 100/350 tc 81/80 rounds 2/3 => fail')
  })
})

test('P37 size --rounds 4 → exit 1', () => {
  withRoot({ 'spec.md': specLines(100), 'tc.md': TC3 }, (root) => {
    const x = sizeRun(root, '4')
    assert.strictEqual(x.status, 1)
    assert.strictEqual(firstLine(x), 'size: spec 100/350 tc 3/80 rounds 4/3 => fail')
    assert.match(x.stderr, /rounds|轮/)
  })
})

test('P38 size 缺 --rounds / 非法值 / --stage 形态错 → 一律 exit 2', () => {
  withRoot({ 'spec.md': specLines(100), 'tc.md': TC3, 'prd.md': PRD_A, 'plan.md': planText() }, (root) => {
    const missing = sizeRun(root, null)
    assert.strictEqual(missing.status, 2)
    assert.match(missing.stderr.trim(), /^\[check-plan\] 用法错：.*--rounds/s)
    assert.strictEqual(missing.stderr.trim().split(/\r?\n/).length, 1)
    assert.ok(!/(^|\n)size: spec /.test(missing.stdout), '缺 --rounds 不得打计数行')

    for (const v of ['三', '-1', '1.5']) {
      const y = sizeRun(root, v)
      assert.strictEqual(y.status, 2, v)
      assert.match(y.stderr.trim(), /^\[check-plan\] 用法错：/, v)
      assert.ok(!/(^|\n)size: spec /.test(y.stdout), v)
    }

    for (const v of ['4', 's4', 'S4x']) {
      const y = run(root, ['coverage', '--plan', R(root, 'plan.md'), '--prd', R(root, 'prd.md'), '--stage', v])
      assert.strictEqual(y.status, 2, v)
      assert.match(y.stderr.trim(), /^\[check-plan\] 用法错：/, v)
      assert.ok(!/(^|\n)coverage: gap /.test(y.stdout), v)
    }
  })
})

test('P39 size 带末尾换行的 350 行 → 记 350', () => {
  withRoot({ 'spec.md': specLines(350, '\r\n', true), 'tc.md': TC3 }, (root) => {
    const x = sizeRun(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'size: spec 350/350 tc 3/80 rounds 2/3 => ok')
  })
})

test('P40 size 80 个 ID 各出现两次 → 去重后 80', () => {
  const table = Array.from({ length: 80 }, (_, i) => `| P${String(i + 1).padStart(2, '0')} | 正 | … |`).join('\n')
  withRoot({ 'spec.md': specLines(100), 'tc.md': `${table}\n${tcIds(80)}` }, (root) => {
    const x = sizeRun(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'size: spec 100/350 tc 80/80 rounds 2/3 => ok')
  })
})

test('P41 size 0 字节 spec + 0 条 ID → tc 0/80、exit 0（与 P28 成对照）', () => {
  withRoot({ 'spec.md': '', 'tc.md': TC_NO_ID }, (root) => {
    const x = sizeRun(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'size: spec 0/350 tc 0/80 rounds 2/3 => ok')
  })
})

test('P72 size --spec 指向目录 → exit 2「不是文件」，传文件时不出现该报文', () => {
  withRoot({ 'spec.md': specLines(100), 'tc.md': TC3 }, (root) => {
    mkdirSync(join(root, 'spec-dir'), { recursive: true })
    const x = run(root, ['size', '--spec', R(root, 'spec-dir'), '--testcase', R(root, 'tc.md')])
    assert.strictEqual(x.status, 2)
    assert.match(x.stderr.trim(), /^\[check-plan\] 用法错：.*不是文件/s)
    assert.ok(x.stderr.includes('不是文件'))
    assert.strictEqual(x.stderr.trim().split(/\r?\n/).length, 1)
    assert.ok(!/(^|\n)(coverage: gap |deps: cycle |map: missing |size: spec )/.test(x.stdout))
    const y = sizeRun(root)
    assert.strictEqual(y.status, 0)
    assert.ok(!y.stderr.includes('不是文件'), '传文件时不得出现该报文')
  })
})

test('P73 size 无末尾换行的 350 行 → 仍记 350', () => {
  withRoot({ 'spec.md': specLines(350, '\r\n', false), 'tc.md': TC3 }, (root) => {
    const x = sizeRun(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'size: spec 350/350 tc 3/80 rounds 2/3 => ok')
  })
})

test('P75 size 纯 \\n 的 1 字节文件 → spec 1/350', () => {
  withRoot({ 'spec.md': '\n', 'tc.md': TC3 }, (root) => {
    const x = sizeRun(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'size: spec 1/350 tc 3/80 rounds 2/3 => ok')
  })
})

// ── E 组：CLI 形态 / 只读 / 静态（P42–P47） ──────────────────────────────
test('P42 未知子命令 → exit 2，且不得打计数行', () => {
  withRoot({ 'plan.md': planText() }, (root) => {
    const x = run(root, ['lint', '--plan', R(root, 'plan.md')])
    assert.strictEqual(x.status, 2)
    assert.match(x.stderr.trim(), /^\[check-plan\] 用法错：/s)
    assert.strictEqual(x.stderr.trim().split(/\r?\n/).length, 1)
    assert.ok(!/(^|\n)(coverage: gap |deps: cycle |map: missing |size: spec )/.test(x.stdout))
  })
})

test('P43 多余参数 → exit 2（不许静默忽略）', () => {
  withRoot({ 'plan.md': planText(), 'prd.md': PRD_A }, (root) => {
    const x = run(root, ['deps', '--plan', R(root, 'plan.md'), '--prd', R(root, 'prd.md')])
    assert.strictEqual(x.status, 2)
    assert.match(x.stderr.trim(), /^\[check-plan\] 用法错：.*--prd/s)
    assert.strictEqual(x.stderr.trim().split(/\r?\n/).length, 1)
    assert.ok(!/(^|\n)(coverage: gap |deps: cycle |map: missing |size: spec )/.test(x.stdout))
  })
})

test('P44 相对路径（cwd = 临时根）与绝对路径判定一致', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText(), 'tc.md': TC_A }, (root) => {
    const x = run(root, ['coverage', '--plan', 'plan.md', '--prd', 'prd.md', '--stage', 'S4'])
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 4 / plan 4）steps ok => ok')
  })
})

const snapshot = (dir, base = dir) => {
  const out = []
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name)
    const st = statSync(abs)
    if (st.isDirectory()) out.push(...snapshot(abs, base))
    else out.push([relative(base, abs), st.size, st.mtimeMs])
  }
  return out
}

test('P45 R1 只读：四条子命令跑完，临时根文件树一字节不变', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText(), 'tc.md': TC_A, 'spec.md': specLines(10) }, (root) => {
    const before = snapshot(root)
    const outs = [
      coverage(root),
      deps(root),
      map(root),
      run(root, ['size', '--spec', R(root, 'spec.md'), '--testcase', R(root, 'tc.md'), '--rounds', '2']),
    ]
    const after = snapshot(root)
    assert.deepEqual(after, before)
    for (const x of outs) assert.ok(!x.stdout.trim().startsWith('{'), '输出只有文本，不是 JSON')
  })
})

test('P46 静态：只用 node 内置 + splitRow，无写盘 / 无 env / 无旁路开关', () => {
  const src = readFileSync(CLI, 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.match(src, /from 'node:fs'/)
  assert.doesNotMatch(src, /from 'node:(child_process|http|https|os|worker_threads)'/)
  assert.doesNotMatch(src, /process\.env|execSync|spawn/)
  assert.doesNotMatch(src, /writeFileSync|appendFileSync|mkdirSync|rmSync|unlinkSync|cpSync|renameSync|createWriteStream/)
  assert.doesNotMatch(src, /--force|--skip|BYPASS/)
  assert.doesNotMatch(src, /\.split\('\|'\)/, '不得自写单元格切分')
  assert.match(src, /from '\.\.\/tools\/execution-matrix\/markdown-rows\.mjs'/)
})

test('P47 静态：R8 —— commands.mjs 不补 check.local', () => {
  const src = readFileSync(join(REPO, 'tools/docgen/policy/definitions/commands.mjs'), 'utf8')
  assert.strictEqual((src.match(/check-plan/g) ?? []).length, 0)
})

// ── A 组第二半：coverage 的映射表（P66–P70 / P76 / P10） ─────────────────
test('P10 coverage plan 一个 F 都没有（连带表消失）→ gap 4 / steps fail', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText({ features: [], mapRows: null }), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 1)
    assert.strictEqual(firstLine(x), 'coverage: gap 4（prd 4 / plan 0）steps fail => fail')
  })
})

test('P66 coverage 映射表四行各指向存在的 Task → steps ok', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText(), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 4 / plan 4）steps ok => ok')
  })
})

test('P67 coverage 映射表某 F 指向不存在的 Task 9 → steps fail，只点名 Task 9', () => {
  const mapRows = DEFAULT_MAP.map((r) => (r[0] === 'F-13' ? ['F-13', '漂移', 'Task 2、Task 9'] : r))
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText({ mapRows }), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 1)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 4 / plan 4）steps fail => fail')
    assert.match(x.stderr.trim(), /^\[check-plan\] coverage：F-13 指向 Task 9 不存在$/)
    assert.ok(!x.stdout.includes('F-13'))
  })
})

test('P68 coverage 无映射表 → exit 1（第二半不成立，逐字 + 恰一行）', () => {
  withRoot({ 'prd.md': PRD_A, 'plan.md': planText({ mapRows: null }), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 1)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 4 / plan 4）steps fail => fail')
    assert.deepEqual(x.stderr.trim().split(/\r?\n/), ['[check-plan] coverage：无「功能点→任务映射表」，第二半不成立'])
  })
})

test('P69 coverage 表头不含 F / Task 也须识别为「有表」（Q21）', () => {
  const prd = ['| F | S | 备注 |', '|---|---|---|', '| F-07 spec ∥ testcase | S4 | — |', ''].join('\n')
  const plan = planText({ features: ['F-07'], mapRows: [['F-07', 'spec ∥ testcase 执行细则', 'Task 1']] })
  withRoot({ 'prd.md': prd, 'plan.md': plan, 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 0)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 1 / plan 1）steps ok => ok')
    assert.ok(!x.stderr.includes('第二半不成立'))
    assert.strictEqual(x.stderr.trim(), '')
  })
})

test('P70 coverage 有 F 行但全表无 Task 单元格 → 判无表 → exit 1（Q22）', () => {
  const prd = ['| F | S | 备注 |', '|---|---|---|', '| F-07 spec ∥ testcase | S4 | — |', ''].join('\n')
  const onlyFeatureTable = ['| PRD 功能点 | 一句话 | 备注 |', '|---|---|---|', '| F-07 | spec ∥ testcase 执行细则 | 待定 |', ''].join('\n')
  withRoot({ 'prd.md': prd, 'plan.md': planText({ features: ['F-07'], mapRows: null, extra: onlyFeatureTable }), 'tc.md': TC_A }, (root) => {
    const x = coverage(root)
    assert.strictEqual(x.status, 1)
    assert.strictEqual(firstLine(x), 'coverage: gap 0（prd 1 / plan 1）steps fail => fail')
    assert.deepEqual(x.stderr.trim().split(/\r?\n/), ['[check-plan] coverage：无「功能点→任务映射表」，第二半不成立'])
    assert.ok(!/落点缺|缺落点|无任务落点|未指向/.test(x.stderr), 'Q22：缺 Task 侧特征即不认表')
  })
})

test('P76 coverage 三类红 + 一类绿：四种首行两两不同，且「首行说红 ⇔ exit 1」', () => {
  const prdA5 = `${PRD_A.replace('| F-01 市场调研角色 | S2 | 新卡 |', '| F-01 市场调研角色 | S2 | 新卡 |\n| F-99 多出来的 | S4 | — |')}`
  const runOne = (prd, over, stage) =>
    withRoot({ 'prd.md': prd, 'plan.md': planText(over), 'tc.md': TC_A }, (root) => coverage(root, stage))
  const mapB = DEFAULT_MAP.map((r) => (r[0] === 'F-13' ? ['F-13', '漂移', 'Task 9'] : r))
  const A = runOne(prdA5, {}, 'S4')
  const B = runOne(PRD_A, { mapRows: mapB }, 'S4')
  const C = runOne(PRD_A, {}, 'S9')
  const D = runOne(PRD_A, {}, 'S4')

  assert.deepEqual([A.status, B.status, C.status, D.status], [1, 1, 1, 0])
  assert.strictEqual(firstLine(A), 'coverage: gap 1（prd 5 / plan 4）steps ok => fail')
  assert.strictEqual(firstLine(B), 'coverage: gap 0（prd 4 / plan 4）steps fail => fail')
  assert.strictEqual(firstLine(C), 'coverage: gap 0（prd 0 / plan 0）steps ok => fail')
  assert.strictEqual(firstLine(D), 'coverage: gap 0（prd 4 / plan 4）steps ok => ok')
  assert.strictEqual(new Set([firstLine(A), firstLine(B), firstLine(C), firstLine(D)]).size, 4)

  const redByFirstLine = (s, st) => (Number(/gap (\d+)/.exec(s)[1]) > 0 || /steps fail/.test(s) || / => fail$/.test(s)) === (st === 1)
  for (const x of [A, B, C, D]) assert.ok(redByFirstLine(firstLine(x), x.status), firstLine(x))
  assert.ok(/ => ok$/.test(firstLine(D)))
  assert.ok(!/ => fail$/.test(firstLine(D)))
})
