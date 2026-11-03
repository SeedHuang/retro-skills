// S-A 数据层用例落点（TC-001…TC-030）。本文件由 plan 逐任务追加，不要一次写满。
// 编写者：主 agent（施工者本人）；本文件是常驻测试、不是 testcase 文件，不受独立编写义务约束。
import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expandRefs, loadSeatData } from '../components/seatLoader.mjs'
import { CARD_KEYS, buildCards } from '../components/cardPipeline.mjs'

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
