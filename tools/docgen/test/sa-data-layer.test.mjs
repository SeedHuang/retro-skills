// S-A 数据层用例落点（TC-001…TC-030）。本文件由 plan 逐任务追加，不要一次写满。
// 编写者：主 agent（施工者本人）；本文件是常驻测试、不是 testcase 文件，不受独立编写义务约束。
import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { expandRefs, loadSeatData } from '../components/seatLoader.mjs'
import { CARD_KEYS, buildCards } from '../components/cardPipeline.mjs'
import { SCAN_FIELDS } from '../card-model/enums.mjs'
import { pathGroups, DETECTION_BLIND_SPOTS } from '../policy/definitions/paths.mjs'
import { ROOT, runCli, runEsm, withRepoCopy, Q8_REMOVED_PATHS } from './support/dev-workflow-checks.mjs'

const DATA = 'tools/docgen/data'
const SEATS = `${DATA}/seats`
const DERIVED = ['seat', 'name', 'description', 'tools']
const EIGHT = [...CARD_KEYS].filter((k) => !DERIVED.includes(k)).sort()
const expandCases = () => {
  const shared = { a: '甲', b: '乙', arr: ['x'], empty: '', nul: null, ws: '   ', nested: '@a' }
  return { shared }
}
// 注入面统一在副本上做（data/ 整份拷到临时目录），不动工作区
const copyData = () => {
  const dst = mkdtempSync(join(tmpdir(), 'sa-refs-'))
  cpSync(DATA, dst, { recursive: true })
  return dst
}
const rewrite = (dst, rel, mutate) => {
  const p = join(dst, rel)
  const j = JSON.parse(readFileSync(p, 'utf8'))
  mutate(j)
  writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
}

test('TC-001 数据源按席拆成 data/seats/<seat>.json（一席一文件）+ data/shared.json（1 份）', () => {
  const dirs = readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  assert.deepEqual(dirs, ['seats'], 'data/ 下一级只能有 seats 一个目录')
  // 一席一文件：先取全部条目，非 `.json` 的（含子目录）一律算违规——只按 `.json` 过滤会让散文件静默通过
  const entries = readdirSync(SEATS, { withFileTypes: true })
  const strays = entries.map((d) => d.name).filter((n) => !n.endsWith('.json'))
  assert.deepEqual(strays, [], `seats/ 只许 <seat>.json，实有多余条目：${strays.join('、')}`)
  const files = entries.filter((d) => d.isFile() && d.name.endsWith('.json'))
    .map((d) => d.name.replace(/\.json$/, '')).sort()
  const shared = JSON.parse(readFileSync(`${DATA}/shared.json`, 'utf8'))
  assert.deepEqual(Object.keys(shared).sort(),
    ['cardRationaleHead', 'cardRationaleTail', 'dutyConstraintDefault', 'hostTerm'], 'shared.json 恰 4 键（S-C 加 hostTerm）')
  // 席名与 agentData 逐字相等（旧入口仍在，故可就地比对）；席数一律派生，不写席位数字面量
  // （`dev-workflow-counts.test.mjs` 的 `counterProbes` 会扫 `tools/docgen/test/*.test.mjs` 的 assert 行）
  return import('../components/agentData.mjs').then(({ agentData }) => {
    const names = agentData.map((a) => a.name).sort()
    assert.equal(files.length, names.length, `席文件数与 agentData 席数不等：${files.length} vs ${names.length}`)
    assert.deepEqual(files, names, '席文件名必须与 agentData 席名集逐字相等')
  })
})

test('TC-002 展开是装配前一次性纯函数：同输入两次逐字节相等', () => {
  const { shared } = expandCases()
  const input = { k: '前${@a}后', l: '@arr' }
  const a = JSON.stringify(expandRefs(input, shared, 'probe'))
  const b = JSON.stringify(expandRefs(input, shared, 'probe'))
  assert.equal(a, b)
  assert.equal(input.k, '前${@a}后', '不得就地改写入参')
})

test('TC-003 两段判：席文件 card 恰等 8 键（loader）+ buildCards() 与 CARD_KEYS 恰等（12 键全量，消费点）', async () => {
  const { agentData } = await import('../components/agentData.mjs')
  for (const e of agentData) {
    // 8 键 = CARD_KEYS 去派生四键；12 键只在 cardPipeline.mjs 的 buildOne 里派生（spec §10.1 R2 改判）
    assert.deepEqual(Object.keys(e.card).sort(), EIGHT, `${e.name} 席数据 card 必须恰等 8 键`)
  }
  const built = buildCards()
  assert.equal(built.length, agentData.length, `buildCards() 席数必须与 agentData 一致：${built.length} vs ${agentData.length}`)
  for (const b of built) {
    assert.deepEqual(Object.keys(b.card).sort(), [...CARD_KEYS].sort(), `${b.seat} 的 buildCards() card 必须与 CARD_KEYS 恰等（12 键全量）`)
  }
})

test('TC-004 duty.trigger 与 triggerTable.when 逐字相同（15/15）', () => {
  const { agentData, triggerTable } = loadSeatData()
  for (const e of agentData) assert.equal(e.card.duty.trigger, triggerTable[e.name].when, e.name)
})

test('TC-008 kind 只住 triggerTable；条目顶层不得出现', () => {
  const { agentData, triggerTable } = loadSeatData()
  for (const e of agentData) assert.equal('kind' in e, false, `${e.name} 条目顶层不得有 kind`)
  for (const [seat, t] of Object.entries(triggerTable)) {
    for (const k of Object.keys(t)) assert.ok(['when', 'route', 'notWhen', 'fallback', 'kind'].includes(k), `${seat}.${k} 越界`)
  }
})

test('TC-011/012/013/016 引用四形态：悬空 / 空值 / 混用 / 嵌套（规则 2·3·4 走纯函数，规则 1 走加载器）', () => {
  const { shared } = expandCases()
  assert.throws(() => expandRefs({ k: '@noSuchKey' }, shared, 'probe'), (e) => e.code === 'DanglingSharedRef')
  assert.throws(() => expandRefs({ k: '@empty' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  assert.throws(() => expandRefs({ k: '@nul' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  assert.throws(() => expandRefs({ k: '@ws' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  assert.throws(() => expandRefs({ k: 'x${@arr}y' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  // 规则 4 上半：以 @ 开头但不整体匹配 ^@key$（整值与插值混用）
  assert.throws(() => expandRefs({ k: '@a ${@b}' }, shared, 'probe'), (e) => e.code === 'NestedSharedRef')
  // 规则 4 下半：整值展开结果内仍含引用
  assert.throws(() => expandRefs({ k: '@nested' }, { ...shared, nested: '@a' }, 'probe'), (e) => e.code === 'NestedSharedRef')
  // 规则 1：shared 值内再写引用 → 加载器前置拒绝（不递归、不必栈溢出）
  const dst = copyData()
  try {
    rewrite(dst, 'shared.json', (j) => { j.dutyConstraintDefault = '@cardRationaleHead' })   // 第二层引用
    assert.throws(() => loadSeatData(dst), (e) => e.code === 'NestedSharedRef')
  } finally { rmSync(dst, { recursive: true, force: true }) }
})

test('TC-014 席文件 card 少一个键（删 rationale）→ CardKeySetMismatch', () => {
  const dst = copyData()
  try {
    rewrite(dst, join('seats', 'reviewer-product.json'), (j) => { delete j.card.rationale })
    assert.throws(() => loadSeatData(dst), (e) => e.code === 'CardKeySetMismatch' && (e.missing || []).includes('rationale'))
  } finally { rmSync(dst, { recursive: true, force: true }) }
})

test('TC-015 多一个键（ghostField）/ 写派生四键（tools）→ 两种形态都报 CardKeySetMismatch', () => {
  const forms = [
    ['extra', (j) => { j.card.ghostField = [] }],
    ['derived', (j) => { j.card.tools = [] }],
  ]
  for (const [label, mutate] of forms) {
    const dst = copyData()
    try {
      rewrite(dst, join('seats', 'reviewer-product.json'), mutate)
      assert.throws(() => loadSeatData(dst), (e) => e.code === 'CardKeySetMismatch', `${label} 形态必须报 CardKeySetMismatch`)
    } finally { rmSync(dst, { recursive: true, force: true }) }
  }
})

test('TC-027 `kind` 写进条目顶层 → 拒载 TriggerFieldMisplaced（不静默当成 trigger 字段）', async () => {
  const { validateAgentData } = await import('../components/validateAgentData.mjs')
  const dst = copyData()
  try {
    rewrite(dst, join('seats', 'reviewer-audit.json'), (j) => { j.kind = 'dispatch' })   // 顶层写入（应只住 trigger.kind）
    const { agentData, triggerTable } = loadSeatData(dst)
    assert.throws(() => validateAgentData(agentData, triggerTable),
      (e) => e.code === 'TriggerFieldMisplaced' && String(e.extra || '').includes('kind'))
  } finally { rmSync(dst, { recursive: true, force: true }) }
})

test('TC-019 席文件里写回非空 duty.trigger → 拒载 TriggerFieldMisplaced（不静默覆盖）', () => {
  const dst = copyData()
  try {
    rewrite(dst, join('seats', 'reviewer-product.json'),
      (j) => { j.card.duty.trigger = '当主持人调度对 PRD/spec/plan 做产品视角评审' })   // 第二来源
    assert.throws(() => loadSeatData(dst), (e) => e.code === 'TriggerFieldMisplaced')
  } finally { rmSync(dst, { recursive: true, force: true }) }
})

test('TC-031 席序冻结：loadSeatData 的席序与 docs/agents/README.md 的表格行序逐条相等', () => {
  const { agentData } = loadSeatData()
  // 锚在**已提交的生成物**上（不是把名单抄进测试）：席序一变，README 索引就会重排 → gate 报 Mismatch
  const rows = readFileSync('docs/agents/README.md', 'utf8').split(/\r?\n/)
    .filter((l) => l.startsWith('| ')).slice(1)          // 去掉表头（分隔行不以 `| ` 开头，天然被过滤）
    .map((l) => l.split('|')[1].trim())
  assert.deepEqual(agentData.map((a) => a.name), rows)
})

test('TC-032 trigger.when 类型不是字符串（数字）→ 拒载 MissingWhen（不把坏类型注入 duty.trigger）', () => {
  const dst = copyData()
  try {
    rewrite(dst, join('seats', 'reviewer-product.json'), (j) => { j.trigger.when = 1 })
    assert.throws(() => loadSeatData(dst), (e) => e.code === 'MissingWhen' && e.when === 1)
  } finally { rmSync(dst, { recursive: true, force: true }) }
})

test('TC-033 trigger.route 缺失 / 空白 → 拒载 TriggerMissingRoute（不能靠 validateAgentData 的跳过分支放过）', () => {
  for (const [label, mutate] of [
    ['missing', (j) => { delete j.trigger.route }],
    ['blank', (j) => { j.trigger.route = '   ' }],
  ]) {
    const dst = copyData()
    try {
      rewrite(dst, join('seats', 'reviewer-product.json'), mutate)
      assert.throws(() => loadSeatData(dst), (e) => e.code === 'TriggerMissingRoute', `${label} 形态必须报 TriggerMissingRoute`)
    } finally { rmSync(dst, { recursive: true, force: true }) }
  }
})

test('TC-034 seats/ 下的非文件条目（名为 x.json 的目录 / 散文件）→ 拒载 InvalidInputPath', () => {
  const dst = copyData()
  try {
    mkdirSync(join(dst, 'seats', 'zz-probe.json'))              // 目录冒充席文件：旧实现会 EISDIR 裸错
    writeFileSync(join(dst, 'seats', 'zz-probe.md'), 'stray\n') // 散文件
    assert.throws(() => loadSeatData(dst), (e) => e.code === 'InvalidInputPath' && (e.entries || []).length === 2)
  } finally { rmSync(dst, { recursive: true, force: true }) }
})

test('TC-035 席序与文件集不等（缺席 / 多出）→ 拒载 InvalidInputPath 并点名 absent / unknown', () => {
  const forms = [
    ['absent', (dst) => rmSync(join(dst, 'seats', 'reviewer-reader.json')),
      (e) => (e.absent || []).includes('reviewer-reader')],
    ['unknown', (dst) => writeFileSync(join(dst, 'seats', 'zz-probe.json'), JSON.stringify({ name: 'zz-probe' })),
      (e) => (e.unknown || []).includes('zz-probe')],
  ]
  for (const [label, mutate, extra] of forms) {
    const dst = copyData()
    try {
      mutate(dst)
      assert.throws(() => loadSeatData(dst), (e) => e.code === 'InvalidInputPath' && extra(e),
        `${label} 形态必须报 InvalidInputPath 并点名`)
    } finally { rmSync(dst, { recursive: true, force: true }) }
  }
})

test('TC-030 坏数据在 import 期即 fail-closed（干净 exit 0；悬空引用 exit 1 + 码名）', () => {
  const code = "import('./tools/docgen/components/agentData.mjs').then(()=>process.exit(0),e=>{console.error(e.code);process.exit(1)})"
  const ok = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8' })
  assert.equal(ok.status, 0, `干净数据下 import 应成功，实得 ${ok.status}：${ok.stderr}`)
  withRepoCopy((dst) => {
    rewrite(dst, join('tools', 'docgen', 'data', 'seats', 'reviewer-product.json'),
      (j) => { j.card.duty.constraint = '@noSuchKey' })   // 悬空引用：必须在 import 期抛，而不是等到渲染
    const bad = spawnSync(process.execPath, ['-e', code], { cwd: dst, encoding: 'utf8' })
    assert.equal(bad.status, 1, bad.stdout + bad.stderr)
    assert.match(bad.stderr, /DanglingSharedRef/)
  })
})

test('TC-005 拆 JSON 后 15 席 disk == render、gate exit 0', () => {
  const r = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'gate'], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)
})

test('TC-017 值类型漂移（`duty.action` 句子 → 数字）→ gate exit 1 `Mismatch`', () => {
  withRepoCopy((dst) => {
    rewrite(dst, join('tools', 'docgen', 'data', 'seats', 'reviewer-product.json'),
      (j) => { j.card.duty.action = 1 })                  // 句子 → 数字：渲染文本必变
    const r = runCli(dst, ['gate'])
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stdout + r.stderr, /Mismatch/)
  })
})

test('TC-018 改了 seats/*.json 未重生成 agents/*.md → gate exit 1 `Mismatch`', () => {
  withRepoCopy((dst) => {
    rewrite(dst, join('tools', 'docgen', 'data', 'seats', 'reviewer-product.json'),
      (j) => { j.card.duty.action = `${j.card.duty.action}。` })   // 加一个句号：值合法、渲染变
    const r = runCli(dst, ['gate'])
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stdout + r.stderr, /Mismatch/)
  })
})

test('TC-007 装配点唯一：`tools: toolsForSeat(s.name)` 恰 1 处，`...s` 紧随其后（薄壳零装配式）', () => {
  const src = readFileSync('tools/docgen/components/seatLoader.mjs', 'utf8')
  const hits = [...src.matchAll(/tools:\s*toolsForSeat\(\s*s\.name\s*\)/g)]
  assert.equal(hits.length, 1, '装配式必须恰 1 处（正则与 S5-TC-D10 同一形态）')
  const j = src.indexOf('...s', hits[0].index)
  assert.ok(j > hits[0].index && j - hits[0].index < 400, '...s 必须紧随其后（不再允许等价写法）')
  const shell = readFileSync('tools/docgen/components/agentData.mjs', 'utf8')
  assert.equal([...shell.matchAll(/toolsForSeat\(/g)].length, 0, '薄壳里不得有装配式')
})

test('TC-026 薄壳必须先 import seatLoader（本地绑定，card-render 的 INJECT_BAD 依赖）', () => {
  const shell = readFileSync('tools/docgen/components/agentData.mjs', 'utf8')
  assert.ok(/^import .*seatLoader\.mjs/m.test(shell), '薄壳必须先 import（不得用纯再导出）')
})

// T4：在仓副本里只跑 `S1-TC-G09`（`card-model.test.mjs` 在模块顶层读 S1 spec，故副本须补该文件）。
// `NODE_TEST_CONTEXT` 必须清掉：父进程是 `node --test` 时子进程若继承它，会以测试子进程身份退出 0。
// 副本必须补 S1 spec：`card-model` 的模块顶层要读它，缺文件会让子进程死于 ENOENT（假红）
const copyS1Spec = (dst) => {
  const rel = join('docs', 'superpowers', 'specs', '2026-10-29-agent-card-s1-card-model-design.md')
  mkdirSync(dirname(join(dst, rel)), { recursive: true })
  cpSync(join(ROOT, rel), join(dst, rel))
}
const ESC_G09 = (dst) => {
  copyS1Spec(dst)
  return spawnSync(process.execPath,
    ['--test', '--test-name-pattern', 'S1-TC-G09', 'tools/docgen/test/card-model.test.mjs'],
    { cwd: dst, encoding: 'utf8', env: { ...process.env, NODE_TEST_CONTEXT: undefined } })
}

test('TC-022 新增第 9 个 `SCAN_FIELDS` 键 → `ESC` exit 非 0', () => {
  withRepoCopy((dst) => {
    const p = join(dst, 'tools', 'docgen', 'card-model', 'enums.mjs')
    const s = readFileSync(p, 'utf8')
    const anchor = 'export const SCAN_FIELDS = Object.freeze({'
    assert.equal(s.split(anchor).length - 1, 1, '注入锚必须恰 1 处')
    writeFileSync(p, s.split(anchor).join(`${anchor}\n  Description: Object.freeze(['description']),`))
    const r = ESC_G09(dst)
    assert.notEqual(r.status, 0, '第 9 键必须让 8 键断言红')
    assert.match(r.stdout + r.stderr, /SCAN_FIELDS/, '红必须落在 8 键断言上（不得因副本缺文件而红）')
  })
})

test('TC-023 三条冻结断言未同批改写（还原成旧口径）→ `ESC` exit 非 0', () => {
  withRepoCopy((dst) => {
    const p = join(dst, 'tools', 'docgen', 'test', 'card-model.test.mjs')
    const s = readFileSync(p, 'utf8')
    const NEW = "  only(run((c) => { c.description = '每轮答辩结束后开始观察（共 3 条）'; }), 'HardcodedCount', 'description');"
    const OLD = "  green(run((c) => { c.description = '每轮答辩结束后开始观察（共 3 条）'; }));"
    assert.equal(s.split(NEW).length - 1, 1, '还原锚必须恰 1 处（T4 Step 4 已把它改成 only）')
    writeFileSync(p, s.split(NEW).join(OLD))
    const r = ESC_G09(dst)
    assert.notEqual(r.status, 0, '还原成「不扫」的旧断言后，实现已扫 description → 必红')
    assert.match(r.stdout + r.stderr, /HardcodedCount/, '红必须由该冻结断言本身产生（旧口径应绿、实得 HardcodedCount）')
  })
})

test('TC-009 `SCAN_FIELDS` 仍 8 键，且 4 个文本码的扫描面含 description', () => {
  assert.equal(Object.keys(SCAN_FIELDS).length, 8)
  const flat = (v) => JSON.stringify(v)
  const WITH = ['PointerToElsewhere', 'HardcodedCount', 'MixedTermInCard', 'ProceduralWordOutsideParliament']
  for (const k of WITH) {
    assert.ok(flat(SCAN_FIELDS[k]).includes('description'), `${k} 的扫描面必须含 description`)
  }
  const WITHOUT = ['SubjectiveLabel', 'InlineTermList', 'InlineThreshold', 'AmbiguousCriterion']
  for (const k of WITHOUT) {
    assert.equal(flat(SCAN_FIELDS[k]).includes('description'), false, `${k} 不得含 description`)
  }
  // ④ 段补测（TC-009 步骤 ④ 的 `ESC` 面）：上面只判扫描面表，判不出「冻结断言仍绿」——补一次复原态
  withRepoCopy((dst) => {
    const r = ESC_G09(dst)
    assert.equal(r.status, 0, `TC-009④ ESC 必须 exit 0（实得 ${r.status}）：${r.stdout}${r.stderr}`)
  })
})

// T4-补（代码审查 P2）：注入面按 testcase TC-020 的「前置」走真实派生链 ——
// `seats/senior-sdet.json` 的 `trigger.notWhen.text` → `descriptionOf` → 卡上 `description`。
// 直接给 `card.description` 赋值只能证明 `surfaceTexts` 认这个 ref，证明不了「数据改了卡面就跟着改」。
const DESC_PROBE = `
const { buildCards, buildEnv } = await import('./tools/docgen/components/cardPipeline.mjs')
const { validateCardModel } = await import('./tools/docgen/card-model/index.mjs')
const b = buildCards().find((x) => x.seat === 'senior-sdet')
const errors = validateCardModel(b.card, buildEnv('senior-sdet', [b.card])).errors
  .filter((e) => /description/i.test(e.path))
process.stdout.write(JSON.stringify({ description: b.card.description, errors }))
`

test('TC-020/021 description 由 notWhen 派生后必须被扫（三个码 path 落在 description），半改态归 0', () => {
  withRepoCopy((dst) => {
    const seatJson = join('tools', 'docgen', 'data', 'seats', 'senior-sdet.json')
    const original = JSON.parse(readFileSync(join(dst, seatJson), 'utf8')).trigger.notWhen.text
    assert.ok(typeof original === 'string' && original.trim() !== '', '前置：senior-sdet 必须有 notWhen.text（唯一只进 description 的面）')
    const probe = () => {
      const r = runEsm(dst, DESC_PROBE)
      assert.equal(r.status, 0, r.stdout + r.stderr)
      return JSON.parse(r.stdout)
    }
    // 完整态：注入句经 descriptionOf 进 description，三个不同码都必须报在 description 上
    for (const [text, code] of [
      ['详见 §3 的口径', 'PointerToElsewhere'],
      ['共 3 条', 'HardcodedCount'],
      ['收卡', 'ProceduralWordOutsideParliament'],
    ]) {
      rewrite(dst, seatJson, (j) => { j.trigger.notWhen.text = text })
      const o = probe()
      assert.ok(o.description.includes(text), `前置：注入句必须进 description，实得 ${o.description}`)
      assert.ok(o.errors.some((e) => e.code === code), `应报 ${code} 且 path 在 description，实得 ${JSON.stringify(o.errors)}`)
    }
    // 复原态：原 notWhen 句对四码零命中
    rewrite(dst, seatJson, (j) => { j.trigger.notWhen.text = original })
    assert.deepEqual(probe().errors, [], '复原态 description 上不得有任何码')
    // 半改态（只改 CARD_TEXT_FIELDS 不补 surfaceTexts）：表里有、实现不扫 → 命中 0（这就是判别力）
    const p = join(dst, 'tools', 'docgen', 'card-model', 'validateCardModel.mjs')
    const src = readFileSync(p, 'utf8')
    const patched = src.replace(/\r?\n\s*else if \(ref === 'description'\) push\('description', card\.description\);/, '')
    assert.notEqual(patched, src, '注入必须命中（surfaceTexts 的 description 分支仍在）')
    writeFileSync(p, patched)
    rewrite(dst, seatJson, (j) => { j.trigger.notWhen.text = '详见 §3 的口径' })
    assert.deepEqual(probe().errors, [], '半改态下 /description/ 必须 0 命中（静默空转）')
  })
})

test('TC-029 notWhen 拼接丢失（`descriptionOf` 丢 notWhen）→ gate exit 1，点名 senior-sdet', () => {
  withRepoCopy((dst) => {
    const p = join(dst, 'tools', 'docgen', 'components', 'cardPipeline.mjs')
    const src = readFileSync(p, 'utf8')
    const patched = src.replace('const notWhen = t.notWhen', "const notWhen = ''")
    assert.notEqual(patched, src, '注入必须命中（notWhen 分支仍在 descriptionOf 里）')
    writeFileSync(p, patched)
    const r = runCli(dst, ['gate'])
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stdout + r.stderr, /senior-sdet/)
  })
})

// ── T5（Q8）：删 3 项本仓专属路径 → 2 卡重生成 → 两处基线同批 ─────────────────────
// 三项的唯一字面在 `support/dev-workflow-checks.mjs` 的 `Q8_REMOVED_PATHS`（本文件与 `policy-pure-source` 共用）。
const Q8_REMOVED = Q8_REMOVED_PATHS
const cardText = (seat) => readFileSync(join('agents', `${seat}.md`), 'utf8')
// S-B §11.2.6：卡面已指针化（禁写集合 / 命令白名单 / 禁止命令 / 检测盲区不再逐项落卡）→
// 「删一条禁止路径 → 卡面失配」这条构造失去载体（删清单项不再改变渲染）。
// 等价构造：改**会渲染**的定义层值（席 clause 槽）而不重生成卡 → 定义层 ≠ 卡面 → Mismatch。
const POINTER_SYMBOLS = ['pathGroups', 'commandGroups', 'forbiddenGroups', 'DETECTION_BLIND_SPOTS']
// 卡面 ③ 段的现形态（S-B §11.2.3）：一句指针 + 原样保留的兜底句
const PATH_POINTER_LINE = '禁写集合 ='
const FALLBACK_SENTENCE = '兜底句：凡 `.gitignore` 覆盖的路径一律视为禁止写入。'
// 派生式成员数（禁手抄）：③ 段口径 = 六组展开 ∪ `spec / plan`
const pathTokens = () => [...Object.values(pathGroups).flat().flatMap((x) => x.split('、')), 'spec / plan']
// 判别力探针（SB-TC-12 / SB-TC-36 形态）：回填一行 → 计数必须从 0 变 1
const scanQuota = (text) => text.split('\n').filter((l) => l.includes('逐项点名')).length
const scanLessons = (text) => text.split('\n').filter((l) => l.includes('lessons/')).length

test('TC-024 改定义层一项却不重生成 2 卡 → gate exit 1 `Mismatch`（指针句在位）', () => {
  // 前置（S-B 指针化的锚）：2 卡边界段已换成指针句，`逐项点名` 已清零
  for (const seat of ['reviewer-audit', 'detective-observer']) {
    const text = cardText(seat)
    assert.equal(scanQuota(text), 0, `${seat}: 卡面不得再有「逐项点名」`)
    for (const sym of POINTER_SYMBOLS) assert.ok(text.includes(`\`${sym}\``), `${seat}: 卡面缺指针符号 ${sym}`)
  }
  withRepoCopy((dst) => {
    const p = join(dst, 'tools', 'docgen', 'policy', 'definitions', 'paths.mjs')
    const src = readFileSync(p, 'utf8')
    // 前置：Q8 三项已从 `pathGroups.workspace` 删掉（用「4 空格缩进的数组项」这一形态判，
    // `DETECTION_BLIND_SPOTS` 那行里的 `'lessons/'` 不算——它属「检测限度」段，spec R6 要求保留）
    for (const item of Q8_REMOVED) {
      assert.equal(src.split(`    '${item}',\n`).length - 1, 0, `前置：Q8 已把 ${item} 从 workspace 删掉`)
    }
    // 构造：改一条**会渲染**的定义层值（席 clause 槽），不重生成卡 → 定义层 ≠ 卡面
    const anchor = "'、审计表"
    const seatsRel = join(dst, 'tools/docgen', 'policy', 'definitions', 'seats.mjs')
    const seatsSrc = readFileSync(seatsRel, 'utf8')
    assert.equal(seatsSrc.split(anchor).length - 1, 1, '改造锚必须恰 1 处')
    writeFileSync(seatsRel, seatsSrc.replace(anchor, "'、审计表（改）"))
    const r = runCli(dst, ['gate'])
    assert.equal(r.status, 1, r.stdout + r.stderr)
    const out = r.stdout + r.stderr
    assert.match(out, /Mismatch/, '改定义层而不重生成必须落 Mismatch')
    assert.ok(/reviewer-audit/.test(out), `必须点名受影响的席，实得 ${out.slice(0, 300)}`)
  })
})

test('TC-006 卡面指针化：`逐项点名` 0 命中 + 兜底句逐字在位 + 定义层仍 20 项', () => {
  const tokens = pathTokens()
  const baseline = JSON.parse(readFileSync('tools/docgen/fixtures/capability-baseline.json', 'utf8')).seats
  for (const seat of ['reviewer-audit', 'detective-observer']) {
    const text = cardText(seat)
    // S-B §11.2.6：该行整句已消失（不是「20 项变别的数」）→ 判据换成「0 命中 + 指针句在位」
    assert.equal(scanQuota(text), 0, `${seat}: 「逐项点名」行必须整体消失（实得 ${scanQuota(text)} 行）`)
    const line = text.split('\n').find((l) => l.includes(PATH_POINTER_LINE))
    assert.ok(line, `${seat}: 缺禁写集合句（指针句的落点）`)
    assert.ok(line.includes('`pathGroups`（六组）与一项模式项'), `${seat}: 禁写句必须指向策略源 pathGroups，实得：${line}`)
    assert.ok(line.includes(FALLBACK_SENTENCE), `${seat}: 兜底句必须逐字在位`)
    for (const w of Q8_REMOVED) {
      assert.equal(line.includes(w), false, `${seat}: 禁写句不得残留 ${w}`)
    }
    // 定义层成员数不变：基线 23 项 − Q8 删除的 3 项 = 现定义层应仍有的 20 项（不写死 20）
    const want = baseline[seat].forbiddenPaths.filter((x) => !Q8_REMOVED.includes(x)).length
    assert.equal(tokens.length, want, `${seat}: 定义层成员数应 = 基线减 Q8（${want}），实得 ${tokens.length}`)
    assert.ok(tokens.includes('spec / plan'), `${seat}: 定义层必须仍含 spec / plan`)
  }
  // 判别力（回填一行 → 判红）：把旧形态接回卡文本，计数必须变 1
  const injected = `${cardText('reviewer-audit')}\n**除上述落点外，任何写文件或重定向一律禁止**，逐项点名：\`a/\`；兜底句：凡 \`.gitignore\` 覆盖的路径一律视为禁止写入。`
  assert.equal(scanQuota(injected), 1, '回填一行后计数必须恰 1（否则判据没有判别力）')
  // ④ 段补测（TC-006 步骤 ④ 的 `GATE` 面）：行内计数判不出「卡面与渲染一致」，补一次 gate
  const g = runCli(ROOT, ['gate'])
  assert.equal(g.status, 0, `TC-006④ GATE 必须 exit 0（实得 ${g.status}）：${g.stdout}${g.stderr}`)
})

test('TC-025 卡面无 `lessons/`（检测盲区已指针化）；定义层仍含该盲区项', () => {
  for (const seat of ['reviewer-audit', 'detective-observer']) {
    const text = cardText(seat)
    // S-B §11.2.6：`lessons/` 因检测盲区改指针而从卡面消失（红因不是「行数变了」）
    assert.equal(scanLessons(text), 0, `${seat}: 全卡 lessons/ 必须 0 命中（实得 ${scanLessons(text)} 行）`)
    const line = text.split('\n').find((l) => l.includes('**检测限度**'))
    assert.ok(line, `${seat}: 缺「检测限度」句`)
    assert.ok(line.includes('`DETECTION_BLIND_SPOTS`'), `${seat}: 检测限度必须指向策略源 DETECTION_BLIND_SPOTS，实得：${line}`)
    // 语义句保留（指针化 ≠ 删段，spec §11.2.3）
    for (const w of ['被 gitignore', '仓外', '已提交写']) {
      assert.ok(line.includes(w), `${seat}: 检测限度段必须保留语义要素 ${w}`)
    }
  }
  // 定义层成员数不变：三个盲区项仍在（不丢能力）
  for (const w of ['lessons/', '.session/', '.superpowers/']) {
    assert.ok(DETECTION_BLIND_SPOTS.includes(w), `定义层不得丢盲区项 ${w}`)
  }
  // 判别力（回填一行 → 判红）：把盲区项接回卡文本，计数必须变 1
  const injected = `${cardText('reviewer-audit')}\n- 另：被 gitignore 的 \`lessons/\` 也看不见。`
  assert.equal(scanLessons(injected), 1, '回填一行后计数必须恰 1（否则判据没有判别力）')
})

test('TC-028 基线两处：evidence.renderSha256 == 盘上哈希（逐席）+ 2 席 lastWrittenHash + baseline.json 无哈希字段', async () => {
  const { agentData } = await import('../components/agentData.mjs')
  for (const e of agentData) {
    const sha = createHash('sha256').update(readFileSync(join('agents', `${e.name}.md`))).digest('hex').toUpperCase()
    const ev = JSON.parse(readFileSync(join('tools', 'docgen', 'fixtures', `${e.name}.evidence.json`), 'utf8'))
    assert.equal(ev.renderSha256, sha, `${e.name}: evidence.renderSha256 必须等于盘上哈希`)
    if (['reviewer-audit', 'detective-observer'].includes(e.name)) {
      assert.equal(ev.lastWrittenHash, sha, `${e.name}: 重生成后 lastWrittenHash 必须同步`)
    }
  }
  const baseline = JSON.parse(readFileSync(join('tools', 'docgen', 'baseline.json'), 'utf8'))
  assert.ok(Array.isArray(baseline), 'baseline.json 应只装路径清单（数组）')
  assert.equal(baseline.filter((p) => /sha256|hash/i.test(String(p))).length, 0, 'baseline.json 不得含哈希字段')
})

// ④ 段补测（TC-011/012/013/016 的 `REFS` 面）：testcase 明写执行面 = `COPY` + `REFS`（`check-shared-refs.mjs`），
// 且 TC-013 写明「不得对纯函数 `expandRefs` 单点断言」——上面那个块只做纯函数面，这里按明写执行面补测。
const DATA_OF = (dst) => join(dst, 'tools', 'docgen', 'data')
const REFS = (dst) => {
  copyS1Spec(dst)   // 与 ESC_G09 同因：`card-model` 顶层读 S1 spec，副本缺它必 ENOENT
  return spawnSync(process.execPath, ['tools/docgen/check-shared-refs.mjs'], { cwd: dst, encoding: 'utf8' })
}

test('TC-011（REFS 面）悬空整值引用 → check-shared-refs exit 1，输出含码名 / 键 / 席', () => {
  withRepoCopy((dst) => {
    rewrite(DATA_OF(dst), join('seats', 'reviewer-product.json'), (j) => { j.card.duty.constraint = '@noSuchKey' })
    const r = REFS(dst)
    assert.equal(r.status, 1, `REFS 必须 exit 1（实得 ${r.status}）：${r.stdout}${r.stderr}`)
    for (const s of ['DanglingSharedRef', 'noSuchKey', 'reviewer-product']) {
      assert.ok(r.stdout.includes(s), `输出必须含 ${s}：${r.stdout}`)
    }
  })
})

test('TC-012（REFS 面）共享段互引 → NestedSharedRef exit 1，且 10 秒内返回', () => {
  withRepoCopy((dst) => {
    rewrite(DATA_OF(dst), 'shared.json', (j) => {
      j.dutyConstraintDefault = '${@cardRationaleHead}'
      j.cardRationaleHead = '${@dutyConstraintDefault}'
    })
    const t0 = Date.now()
    const r = REFS(dst)
    const ms = Date.now() - t0
    assert.equal(r.status, 1, `REFS 必须 exit 1（实得 ${r.status}）：${r.stdout}${r.stderr}`)
    assert.match(r.stdout, /NestedSharedRef/, `输出必须点嵌套码：${r.stdout}`)
    assert.ok(ms < 10000, `必须 10 秒内返回（实得 ${ms}ms）`)
  })
})

test('TC-013（REFS 面）shared 侧嵌套 / seat 侧整值+插值混用 → 两者都 NestedSharedRef', () => {
  withRepoCopy((dst) => {
    rewrite(DATA_OF(dst), 'shared.json', (j) => { j.cardRationaleHead = '@dutyConstraintDefault' })
    const r = REFS(dst)
    assert.equal(r.status, 1, `REFS 必须 exit 1（实得 ${r.status}）：${r.stdout}${r.stderr}`)
    assert.match(r.stdout, /NestedSharedRef/, `输出必须点嵌套码：${r.stdout}`)
    assert.match(r.stdout, /cardRationaleHead/, `输出必须点键名：${r.stdout}`)
  })
  withRepoCopy((dst) => {
    rewrite(DATA_OF(dst), join('seats', 'reviewer-product.json'), (j) => {
      j.card.duty.constraint = '@dutyConstraintDefault ${@cardRationaleTail}'
    })
    const r = REFS(dst)
    assert.equal(r.status, 1, `REFS 必须 exit 1（实得 ${r.status}）：${r.stdout}${r.stderr}`)
    assert.match(r.stdout, /NestedSharedRef/, `输出必须点嵌套码：${r.stdout}`)
    assert.match(r.stdout, /reviewer-product/, `输出必须点席名：${r.stdout}`)
  })
})

test('TC-016（REFS 面）共享值空串 → EmptySharedValue exit 1 且点名键', () => {
  withRepoCopy((dst) => {
    rewrite(DATA_OF(dst), 'shared.json', (j) => { j.dutyConstraintDefault = '' })
    const r = REFS(dst)
    assert.equal(r.status, 1, `REFS 必须 exit 1（实得 ${r.status}）：${r.stdout}${r.stderr}`)
    assert.match(r.stdout, /EmptySharedValue/, `输出必须点空值码：${r.stdout}`)
    assert.match(r.stdout, /dutyConstraintDefault/, `输出必须点键名：${r.stdout}`)
  })
})

test('TC-014/015/019/027（GATE 面）四类坏数据 → cli gate exit 1 且点名码', () => {
  const cases = [
    ['TC-014', (data) => rewrite(data, join('seats', 'reviewer-product.json'), (j) => { delete j.card.rationale }), /CardKeySetMismatch/],
    ['TC-015', (data) => rewrite(data, join('seats', 'reviewer-product.json'), (j) => { j.card.ghostField = [] }), /CardKeySetMismatch/],
    ['TC-019', (data) => rewrite(data, join('seats', 'reviewer-product.json'), (j) => { j.card.duty.trigger = '非空' }), /TriggerFieldMisplaced/],
    ['TC-027', (data) => rewrite(data, join('seats', 'reviewer-product.json'), (j) => { j.kind = 'agent' }), /TriggerFieldMisplaced/],
  ]
  for (const [id, mutate, want] of cases) {
    withRepoCopy((dst) => {
      mutate(DATA_OF(dst))
      const r = runCli(dst, ['gate'])
      assert.equal(r.status, 1, `${id}: gate 必须 exit 1（实得 ${r.status}）：${r.stdout}${r.stderr}`)
      assert.match(r.stdout + r.stderr, want, `${id}: 输出须含 ${want}：${r.stdout}${r.stderr}`)
    })
  }
})
