// S3 验收：卡片权限叙述改为登记 ID（spec 2026-11-12；testcase 25 条）。
// 判据侧纪律：数量/名单一律现算（登记表、席位目录、NON_PARL_SEATS），不写死 18/12/7。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, writeFileSync, existsSync, cpSync, mkdtempSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { constraints } from '../policy/definitions/constraints.mjs'
import { CARD_KEYS } from '../components/cardKeys.mjs'
import { CARD_MODEL_CODES } from '../card-model/validateCardModel.mjs'
import { SCAN_FIELDS } from '../card-model/enums.mjs'
import { buildCards, buildEnv, NON_PARL_SEATS } from '../components/cardPipeline.mjs'
import { renderCard } from '../components/renderCard.mjs'
import { loadSeatData } from '../components/seatLoader.mjs'
import { validateAgentData } from '../components/validateAgentData.mjs'
import { withRepoCopy, runCli, runEsm } from './support/dev-workflow-checks.mjs'

const ROOT = process.cwd()
const SEATS_DIR = 'tools/docgen/dsl/agents/seats'
const REGISTRY = 'tools/docgen/builders/agents/policy/definitions/constraints.mjs'
const seatFiles = () => readdirSync(SEATS_DIR).filter((f) => f.endsWith('.json'))
const seatJSON = (f) => JSON.parse(readFileSync(join(SEATS_DIR, f), 'utf8'))
const BASE = (() => {
  if (process.env.S3_BASE) return process.env.S3_BASE
  return existsSync('.session/s3-base.txt') ? readFileSync('.session/s3-base.txt', 'utf8').trim() : ''
})()
const gitShow = (rel) => execFileSync('git', ['show', `${BASE}:${rel}`], { encoding: 'utf8', maxBuffer: 1e8 })
const sha = (buf) => createHash('sha256').update(buf).digest('hex').toUpperCase()
// 数据层副本（B01–B03）：只复制 dsl/agents，够 loader 读盘
function withDataCopy(fn) {
  const dst = mkdtempSync(join(tmpdir(), 's3-data-'))
  try {
    cpSync('tools/docgen/dsl/agents', join(dst, 'agents'), { recursive: true })
    fn(join(dst, 'agents'))
  } finally { rmSync(dst, { recursive: true, force: true }) }
}
// 探针 1：code = 第一个拦下的码（基线必须为空）
function probeCode(dir) {
  try {
    const { agentData, triggerTable } = loadSeatData(dir)
    try { validateAgentData(agentData, triggerTable) } catch (e) { return e.code || String(e.message) }
    return ''
  } catch (e) { return e.code || String(e.message) }
}
const patch = (file, from, to) => {
  const t = readFileSync(file, 'utf8')
  assert.ok(t.includes(from), `构造前提：${file} 未找到待替换片段`)
  writeFileSync(file, t.replace(from, to))
}

// ── A 组：数据形态 ─────────────────────────────────────────────
test('S3-TC-A01 18 席无 constraint、有 constraints 数组且非空', () => {
  const rows = seatFiles().map((f) => {
    const duty = seatJSON(f).card.duty || {}
    return { f, old: Object.hasOwn(duty, 'constraint'), arr: Array.isArray(duty.constraints), n: (duty.constraints || []).length }
  })
  assert.deepEqual(rows.filter((r) => r.old).map((r) => r.f), [], '席 JSON 不得再有 constraint')
  assert.deepEqual(rows.filter((r) => !r.arr).map((r) => r.f), [], 'constraints 必须是数组')
  assert.deepEqual(rows.filter((r) => r.n === 0).map((r) => r.f), [], 'constraints 不得为空')
})

test('S3-TC-A02 登记表 id 合规、文本唯一、源码键数一致', () => {
  const ids = Object.keys(constraints)
  const RE = /^[a-z][a-z0-9.:-]*$/
  assert.deepEqual(ids.filter((i) => !RE.test(i)), [], 'id 必须合归码谓词')
  assert.deepEqual(ids.filter((i) => /^duty\.[0-9]+$/.test(i)), [], '禁序号码')
  const texts = Object.values(constraints).map((v) => v.text)
  assert.deepEqual([...new Set(texts)].length, texts.length, '不得有两条完全相同文本')
  const src = readFileSync(REGISTRY, 'utf8')
  const srcKeys = [...src.matchAll(/'(duty\.[a-z0-9.:-]+)'\s*:\s*\{/g)].map((m) => m[1])
  assert.equal(srcKeys.length, ids.length, '构造前提：源码键数 = 导出键数（正则只作前提，不作判据）')
})

test('S3-TC-A03 迁移逐字：新文本 = $BASE 旧值（含 @ 展开）', { skip: !BASE }, () => {
  const shared = JSON.parse(gitShow('tools/docgen/dsl/agents/shared.json'))
  const bad = []
  for (const f of seatFiles()) {
    const old = gitShow(`${SEATS_DIR}/${f}`)
    const oldDuty = JSON.parse(old).card.duty || {}
    const raw = String(oldDuty.constraint || '')
    const oldText = raw.startsWith('@') ? shared[raw.slice(1)] : raw
    const ids = seatJSON(f).card.duty.constraints
    const newText = ids.map((id) => constraints[id].text).join('；')
    if (oldText !== newText) bad.push(f)
  }
  assert.deepEqual(bad, [], '卡面文本必须逐字不变（I-4）')
})

test('S3-TC-A04 shared.json 键集 = $BASE 键集 − dutyConstraintDefault；席内零引用', { skip: !BASE }, () => {
  const now = Object.keys(JSON.parse(readFileSync('tools/docgen/dsl/agents/shared.json', 'utf8'))).sort()
  const before = Object.keys(JSON.parse(gitShow('tools/docgen/dsl/agents/shared.json'))).sort()
  assert.deepEqual(now, before.filter((k) => k !== 'dutyConstraintDefault'))
  const refs = seatFiles().filter((f) => readFileSync(join(SEATS_DIR, f), 'utf8').includes('@dutyConstraintDefault'))
  assert.deepEqual(refs, [])
})

test('S3-TC-A05 原默认席恰为 ["duty.default"]；全席 id 可解析', { skip: !BASE }, () => {
  const bad = []
  for (const f of seatFiles()) {
    const old = String((JSON.parse(gitShow(`${SEATS_DIR}/${f}`)).card.duty || {}).constraint || '')
    const ids = seatJSON(f).card.duty.constraints
    if (old === '@dutyConstraintDefault' && !(ids.length === 1 && ids[0] === 'duty.default')) bad.push(f)
    for (const id of ids) if (!Object.hasOwn(constraints, id)) bad.push(`${f}:${id}`)
  }
  assert.deepEqual(bad, [])
})

test('S3-TC-A06 模型层 duty 无 constraint 键', () => {
  const dir = 'tools/agent-model/models'
  const hits = readdirSync(dir).filter((f) => f.endsWith('-model.json'))
    .filter((f) => Object.hasOwn(JSON.parse(readFileSync(join(dir, f), 'utf8')).duty || {}, 'constraint'))
  assert.deepEqual(hits, [])
})

test('S3-TC-A07 rationale 不进卡面，只进 docs 投影', () => {
  let cardHit = 0
  const docsMiss = []
  for (const b of buildCards()) {
    if (renderCard(b.card, buildEnv(b.seat, [b.card])).includes(b.card.rationale)) cardHit++
    if (!readFileSync(`docs/agents/${b.seat}.md`, 'utf8').includes(b.card.rationale)) docsMiss.push(b.seat)
  }
  assert.equal(cardHit, 0)
  assert.deepEqual(docsMiss, [])
})

test('S3-TC-A08 迁移全或无：登记表在 ⇒ 18 席全改；不在 ⇒ 全部仍是旧字段', () => {
  const has = existsSync(REGISTRY)
  const rows = seatFiles().map((f) => seatJSON(f).card.duty || {})
  const migrated = rows.filter((d) => Array.isArray(d.constraints) && !Object.hasOwn(d, 'constraint')).length
  assert.equal(has, true)
  assert.equal(migrated, rows.length, '登记表已存在时不得留半迁移态')
})

// ── B 组：校验码负例 ───────────────────────────────────────────
test('S3-TC-B01 旧字段 constraint 并存 → CONSTRAINT_NOT_IDS', () => {
  withDataCopy((dir) => {
    const p = join(dir, 'seats', 'reviewer-actuary.json')
    assert.equal(probeCode(dir), '', '构造前提：基线必须为空')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.card.duty.constraint = '只记录不裁决'
    writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`)
    assert.match(readFileSync(p, 'utf8'), /"constraint"/)
    assert.equal(probeCode(dir), 'CONSTRAINT_NOT_IDS')
  })
})

test('S3-TC-B02 未知 id → CONSTRAINT_ID_UNKNOWN', () => {
  withDataCopy((dir) => {
    const p = join(dir, 'seats', 'reviewer-actuary.json')
    assert.equal(probeCode(dir), '')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.card.duty.constraints = ['duty.not-registered']
    writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`)
    assert.match(readFileSync(p, 'utf8'), /duty\.not-registered/)
    assert.equal(probeCode(dir), 'CONSTRAINT_ID_UNKNOWN')
  })
})

test('S3-TC-B03 空数组 / 非数组 → CONSTRAINT_LIST_EMPTY', () => {
  for (const bad of [[], 'duty.default']) {
    withDataCopy((dir) => {
      const p = join(dir, 'seats', 'reviewer-actuary.json')
      assert.equal(probeCode(dir), '')
      const j = JSON.parse(readFileSync(p, 'utf8'))
      j.card.duty.constraints = bad
      writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`)
      assert.equal(probeCode(dir), 'CONSTRAINT_LIST_EMPTY')
    })
  }
})

test('S3-TC-B04 登记文本塞写权限否定 → CONSTRAINT_TEXT_PERMISSION', () => {
  withRepoCopy((dst) => {
    const f = join(dst, REGISTRY)
    patch(f, "text: '按本席职责与边界执行", "text: '不改任何文件；按本席职责与边界执行")
    const out = runEsm(dst, `import {constraints} from './${REGISTRY}';import {validateAgentData} from './tools/docgen/builders/agents/components/validateAgentData.mjs';import {loadSeatData} from './tools/docgen/builders/agents/components/seatLoader.mjs';const {agentData,triggerTable}=loadSeatData('tools/docgen/dsl/agents');try{validateAgentData(agentData,triggerTable);console.log('code=')}catch(e){console.log('code='+e.code)}`)
    assert.match(`${out.stdout}${out.stderr}`, /code=CONSTRAINT_TEXT_PERMISSION/)
  })
})

// ── C 组：渲染与字节等价 ───────────────────────────────────────
test('S3-TC-C01 约束行 = 登记文本按序连接；duty 键集只含派生五键', () => {
  const bad = []
  const extra = []
  for (const b of buildCards()) {
    const ids = b.card.duty.constraints
    const want = ids.map((id) => constraints[id].text).join('；')
    const line = renderCard(b.card, buildEnv(b.seat, [b.card])).split('\n').find((l) => l.startsWith('约束：')) || ''
    if (line !== `约束：${want}`) bad.push(b.seat)
    const ek = Object.keys(b.card.duty).filter((k) => !['trigger', 'categories', 'action', 'constraints', 'constraint'].includes(k))
    if (ek.length) extra.push(`${b.seat}:${ek.join(',')}`)
  }
  assert.deepEqual(bad, [])
  assert.deepEqual(extra, [])
})

test('S3-TC-C02 迁移前后 18 卡逐字节相同（一次性施工校验）', { skip: !BASE }, () => {
  const changed = []
  for (const f of readdirSync('agents').filter((x) => x.endsWith('.md'))) {
    const old = execFileSync('git', ['show', `${BASE}:agents/${f}`], { maxBuffer: 1e8 })
    if (!old.equals(readFileSync(`agents/${f}`))) changed.push(f)
  }
  assert.deepEqual(changed, [])
})

test('S3-TC-C03 卡哈希 = evidence.renderSha256', () => {
  const bad = []
  for (const f of readdirSync('agents').filter((x) => x.endsWith('.md'))) {
    const seat = f.slice(0, -3)
    const e = JSON.parse(readFileSync(`tools/docgen/builders/agents/fixtures/${seat}.evidence.json`, 'utf8'))
    if (e.renderSha256 !== sha(readFileSync(`agents/${f}`))) bad.push(seat)
  }
  assert.deepEqual(bad, [])
})

test('S3-TC-C04 多 id：loader 派生文本 = 数组序连接', () => {
  const ids = Object.keys(constraints).slice(0, 2)
  withDataCopy((dir) => {
    const p = join(dir, 'seats', 'reviewer-actuary.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.card.duty.constraints = ids
    writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`)
    const { agentData } = loadSeatData(dir)
    const entry = agentData.find((a) => a.name === 'reviewer-actuary')
    assert.equal(entry.card.duty.constraint, ids.map((i) => constraints[i].text).join('；'))
  })
})

// ── D 组：散文探针回归（登记表成为新文本面） ───────────────────
const probeAfterInject = (inject, id = 'duty.default') => {
  let out = ''
  withRepoCopy((dst) => {
    patch(join(dst, REGISTRY), `'${id}': {\n    text: '`, `'${id}': {\n    text: '${inject}`)
    const r = runEsm(dst, `import{buildCards,collectCardFindings}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';const b=buildCards().find(v=>v.card.duty.constraints.includes(${JSON.stringify(id)}));const codes=[...new Set(collectCardFindings().map(x=>x.code))];console.log('inText='+String(b.card.duty.constraint.includes(${JSON.stringify(inject)}))+' codes='+JSON.stringify(codes))`)
    out = `${r.stdout}${r.stderr}`
  })
  return out
}

test('S3-TC-D01 登记文本注入「见 §3」→ PointerToElsewhere', () => {
  const out = probeAfterInject('见 §3；')
  assert.match(out, /inText=true/)
  assert.match(out, /PointerToElsewhere/)
})

test('S3-TC-D02 登记文本注入「共 3 条」→ HardcodedCount', () => {
  const out = probeAfterInject('共 3 条；')
  assert.match(out, /inText=true/)
  assert.match(out, /HardcodedCount/)
})

test('S3-TC-D03 同一登记文本注入两词 → MixedTermInCard', () => {
  const out = probeAfterInject('议长派发、主持人转录；')
  assert.match(out, /inText=true/)
  assert.match(out, /MixedTermInCard/)
})

test('S3-TC-D04 非议会席所用条目注入程序词 → ProceduralWordOutsideParliament', () => {
  const target = buildCards().find((b) => NON_PARL_SEATS.includes(b.seat))
  assert.ok(target, '构造前提：必须存在非议会席')
  const id = target.card.duty.constraints[0]
  const out = probeAfterInject('收卡；', id)
  assert.match(out, /inText=true/)
  assert.match(out, /ProceduralWordOutsideParliament/)
})

// ── E 组：门禁与记账 ───────────────────────────────────────────
test('S3-TC-E01 gate baseline 全绿且无 Mismatch', () => {
  const r = runCli(ROOT, ['gate'])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal(/Mismatch:/.test(r.stdout + r.stderr), false)
})

test('S3-TC-E02 check 全绿（一次性：套内不递归跑 npm run check）', { skip: true }, () => {})

test('S3-TC-E03 scope-sweep 绿', () => {
  const r = execFileSync('node', ['scripts/scope-sweep.mjs', '--check'], { encoding: 'utf8' })
  assert.match(r, /sweep ok/)
})

test('S3-TC-E04 卡面零变化已记账（锚串「卡面 0 变化」）', () => {
  const dir = 'docs/superpowers/reviews/2026-10-25-1723-s6-eval'
  const text = readFileSync(`${dir}/capability-diff.md`, 'utf8')
  assert.ok(text.includes('卡面 0 变化'), '记账必须含锚串「卡面 0 变化」')
  const diff = execFileSync('git', ['diff', '--stat', BASE || 'HEAD', '--', 'agents/'], { encoding: 'utf8' })
  assert.equal(diff.trim(), '')
})

test('S3-TC-E05 契约面不漂移：CARD_MODEL_CODES 无 CONSTRAINT_*；扫描面键集不变', () => {
  assert.deepEqual(Object.keys(CARD_MODEL_CODES).filter((k) => k.startsWith('CONSTRAINT_')), [])
  assert.deepEqual(Object.keys(SCAN_FIELDS).sort(),
    ['AmbiguousCriterion', 'HardcodedCount', 'InlineTermList', 'InlineThreshold', 'MixedTermInCard',
      'PointerToElsewhere', 'ProceduralWordOutsideParliament', 'SubjectiveLabel'])
  assert.ok(SCAN_FIELDS.PointerToElsewhere.includes('duty.constraint'), '历史键名保留（取值 = 派生文本）')
  assert.equal(CARD_KEYS.length, 12)
})
