// S-A 数据层用例落点（TC-001…TC-030）。本文件由 plan 逐任务追加，不要一次写满。
// 编写者：主 agent（施工者本人）；本文件是常驻测试、不是 testcase 文件，不受独立编写义务约束。
import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { expandRefs, loadSeatData } from '../components/seatLoader.mjs'
import { CARD_KEYS, buildCards } from '../components/cardPipeline.mjs'
import { SCAN_FIELDS } from '../card-model/enums.mjs'
import { validateCardModel } from '../card-model/index.mjs'
import { ROOT, runCli, withRepoCopy } from './support/dev-workflow-checks.mjs'

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
    ['cardRationaleHead', 'cardRationaleTail', 'dutyConstraintDefault'], 'shared.json 恰 3 键')
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

test('TC-015 多一个键（returns）/ 写派生四键（tools）→ 两种形态都报 CardKeySetMismatch', () => {
  const forms = [
    ['extra', (j) => { j.card.returns = [] }],
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
const ESC_G09 = (dst) => {
  const rel = join('docs', 'superpowers', 'specs', '2026-10-29-agent-card-s1-card-model-design.md')
  mkdirSync(dirname(join(dst, rel)), { recursive: true })
  cpSync(join(ROOT, rel), join(dst, rel))
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
})

test('TC-020/021 description 上的违规词必须报码，且 path 落在 description（指针词 / 硬编码数量 / 程序词）', async () => {
  const { agentData } = await import('../components/agentData.mjs')
  const { buildEnv } = await import('../components/cardPipeline.mjs')
  const card = structuredClone(agentData.find((a) => a.name === 'senior-sdet').card)
  const env = buildEnv('senior-sdet', [card])
  // 半改态（只改 `CARD_TEXT_FIELDS` 不补 `surfaceTexts`）下这里恒为空：顺序 π push 之后再无 description 分支
  const onDescription = () => validateCardModel(card, env).errors.filter((x) => /description/i.test(x.path))
  card.description = '当需要为 PRD/spec 设计并编写测试用例；不用于：详见 §3 的口径'
  const e1 = onDescription()
  assert.ok(e1.some((x) => x.code === 'PointerToElsewhere'), `应报 PointerToElsewhere，实得 ${JSON.stringify(e1)}`)
  card.description = '当需要为 PRD/spec 设计并编写测试用例；不用于：共 3 条'
  const e2 = onDescription()
  assert.ok(e2.some((x) => x.code === 'HardcodedCount'), `应报 HardcodedCount，实得 ${JSON.stringify(e2)}`)
  card.description = '当需要为 PRD/spec 设计并编写测试用例；不用于：收卡'
  const e3 = onDescription()
  assert.ok(e3.some((x) => x.code === 'ProceduralWordOutsideParliament'), `应报 ProceduralWordOutsideParliament，实得 ${JSON.stringify(e3)}`)
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
