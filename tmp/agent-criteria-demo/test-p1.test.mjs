import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { renderModel } from '../../tools/agent-model/render/index.mjs'
import { sections, makeHelpers } from '../../tools/agent-model/render/sections.mjs'
import { expand } from '../../tools/agent-model/verify-models.mjs'
import { TIERS } from '../../tools/docgen/builders/agents/policy/definitions/tiers.mjs'
import { renderBoundary } from '../../tools/docgen/builders/agents/components/renderBoundary.mjs'

const HERE = import.meta.dirname
const ROOT = resolve(HERE, '../..')
const ENGINE = join(ROOT, 'tools', 'agent-model')
const MODELS = join(ENGINE, 'models')
const SHARED = JSON.parse(readFileSync(join(MODELS, '_shared-model.json'), 'utf8'))
const SEATS = ['detective-observer', 'evidence-reader', 'respondent-architect', 'respondent-dev', 'reviewer-actuary', 'reviewer-ai', 'reviewer-audit']
const POLICY = ['detective-observer', 'reviewer-audit']
const NONPOLICY = ['evidence-reader', 'respondent-architect', 'respondent-dev', 'reviewer-actuary', 'reviewer-ai']
const ALLOC = { 'detective-observer': ['producer', 'policy'], 'reviewer-audit': ['producer', 'policy'], 'evidence-reader': ['readOnly', 'literal'], 'respondent-architect': ['readOnly', 'literal'], 'respondent-dev': ['command', 'literal'], 'reviewer-actuary': ['readOnly', 'default'], 'reviewer-ai': ['readOnly', 'default'] }

const MODEL_COUNT = () => readdirSync(MODELS).filter((f) => f.endsWith('-model.json') && !f.startsWith('_')).length
const model = (s) => JSON.parse(readFileSync(join(MODELS, `${s}-model.json`), 'utf8'))
const render = (s) => renderModel(join(MODELS, `${s}-model.json`), SHARED).text
const section = (text, name) => text.split(/\n## /).find((x) => x.startsWith(name + '\n')) || ''
const bodyOf = (sec) => sec.slice(sec.indexOf('\n') + 1)
// 段拼接用 join('\n')，末段自带一个尾换行；逐字节比对前只归一化「尾部空白」，正文内容不动
const trimEnd = (s) => s.replace(/\s+$/, '')
const cardSection = (s, name) => {
  const t = readFileSync(join(ROOT, 'agents', `${s}.md`), 'utf8')
  const i = t.indexOf('\n## ' + name + '\n')
  return i < 0 ? '' : t.slice(i + 1).replace(/\s+$/, '')
}
const run = (args, cwd = HERE) => spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env: { ...process.env, MODEL_SKILLS_ROOT: join(ROOT, 'skills') } })
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')

// 副本根 = tmp/p1-case-<pid>：既放 demo 脚本（render-all / diff-report / sandbox），也按仓内相对深度放一份引擎
// （render-all 的默认 models 路径按 here/../../tools 计算，副本根与仓根同深度，故能命中副本自己的引擎）
const ENGINE_REL = ['tools', 'agent-model']
const M = (d) => join(d, ...ENGINE_REL)
function copyCase(mutate, seat = 'evidence-reader') {
  const dir = join(HERE, '..', 'p1-case-' + process.pid)
  rmSync(dir, { recursive: true, force: true })
  cpSync(HERE, dir, { recursive: true, filter: (src) => !src.includes('sandbox') && !src.includes('p1-case-') })
  // 引擎 + 它真正 import 的兄弟模块（docgen/builders/agents 下的 policy 与 components）按原深度复制；test/fixtures 不复制
  cpSync(ENGINE, M(dir), { recursive: true })
  for (const sub of ['policy', 'components']) {
    cpSync(join(ROOT, 'tools', 'docgen', 'builders', 'agents', sub), join(dir, 'tools', 'docgen', 'builders', 'agents', sub), { recursive: true })
  }
  if (mutate) {
    const p = join(M(dir), 'models', `${seat}-model.json`)
    const m = JSON.parse(readFileSync(p, 'utf8'))
    mutate(m)
    writeFileSync(p, JSON.stringify(m, null, 2))
  }
  return dir
}

function caseCopy(mutate, seat) {
  const dir = copyCase(mutate, seat)
  return { dir, out: run([join(M(dir), 'verify-models.mjs')], M(dir)) }
}

test('TC-001/002 7 席 tier 与 boundary 分配', () => {
  for (const s of SEATS) {
    assert.equal(model(s).seat.tier, ALLOC[s][0], s)
    assert.equal(model(s).boundary.kind, ALLOC[s][1], s)
  }
})

test('TC-044 verify 全绿且 exit 0', () => {
  const r = run([join(ENGINE, 'verify-models.mjs')], ENGINE)
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal(r.stdout.trim().split('\n').filter((l) => /EQUIVALENT$/.test(l)).length, MODEL_COUNT())
})

test('TC-016 tools = TIERS[seat.tier]', () => {
  for (const s of SEATS) {
    assert.match(render(s), new RegExp('^tools: ' + TIERS[model(s).seat.tier].join(', ') + '$', 'm'), s)
  }
  // §4.5-2：渲染层只能是 import 现役档位表（Task 4 后为 TIERS），不得复制数组字面量
  const src = readFileSync(join(ENGINE, 'render/sections.mjs'), 'utf8')
  assert.match(src, /import\s*\{[^}]*\bTIERS\b[^}]*\}\s*from\s*'[^']*tiers\.mjs'/)
  assert.doesNotMatch(src, /\['Read',\s*'Glob'/)
})

test('TC-020 越界处置按 steps 序号', () => {
  const sec = section(render('detective-observer'), '越界处置')
  assert.match(sec, /^1\. 立即停手。/m)
  assert.match(sec, /^2\. /m)
  assert.match(sec, /^3\. /m)
  const m = expand(join(MODELS, 'detective-observer-model.json'))
  const four = { ...m, escalation: { ...m.escalation, steps: [...m.escalation.steps, { kind: 'halt', text: '第四步。' }] } }
  const h = makeHelpers({ ...SHARED, ...four }, SHARED)
  assert.ok(sections.escalation(four, SHARED, h).includes('4. 第四步。'))
})

test('TC-010/011 outputFormat 段与行数公式', () => {
  for (const s of SEATS) {
    const m = model(s)
    const sec = section(render(s), '输出格式')
    assert.equal(Boolean(sec), Boolean(m.outputFormat), s)
    if (m.outputFormat) {
      const n = sec.split('\n').filter((l) => l.trim()).length
      assert.equal(n, m.outputFormat.requiredFields.length + m.outputFormat.checks.length + 5, s)
    }
  }
})

test('TC-014 refExists 派生且 OP 键集为 22', () => {
  const m = model('detective-observer')
  const OP = makeHelpers({ ...SHARED, ...m }, SHARED).OP
  assert.equal(Object.keys(OP).length, 22)
  assert.ok('refExists' in OP)
  const sec = section(render('detective-observer'), '输出格式')
  assert.match(sec, /卡号存在/)
  assert.doesNotMatch(sec, /refExists/)
  for (const s of SEATS) {
    const m = model(s)
    if (!m.outputFormat) continue
    const lines = section(render(s), '输出格式').split('\n').filter((l) => /^- /.test(l))
    assert.equal(lines.length, m.outputFormat.checks.length, s)
  }
})

test('TC-013 outputFormat.checks 无 text 键', () => {
  for (const s of SEATS) {
    const m = model(s)
    for (const c of m.outputFormat?.checks || []) assert.ok(!('text' in c), s)
  }
})

test('TC-047 whenEq 渲染嵌套 then（P0 证据规则不截断）', () => {
  const OP = makeHelpers({ ...SHARED, ...model('reviewer-actuary') }, SHARED).OP
  const text = OP.whenEq({
    op: 'whenEq',
    ofRef: 'issueCardFull',
    field: 'severity',
    value: 'P0',
    then: { op: 'countGte', ofRef: 'conflictEvidence', value: 2 },
  })
  assert.equal(text, '严重级别 = P0 时，冲突证据 计数 ≥ 2')
})

test('TC-012 无 outputFormat 时不留空标题', () => {
  const dir = copyCase((m) => { delete m.outputFormat }, 'reviewer-ai')
  const t = renderModel(join(M(dir), 'models/reviewer-ai-model.json'), JSON.parse(readFileSync(join(M(dir), 'models/_shared-model.json'), 'utf8'))).text
  rmSync(dir, { recursive: true, force: true })
  assert.ok(!t.includes('\n## 输出格式\n'), '空段不得留标题')
})

test('TC-006 policy 边界与 renderBoundary 逐字节相等', () => {
  for (const s of POLICY) assert.equal(trimEnd(bodyOf(section(render(s), '边界'))), trimEnd(renderBoundary(s)), s)
})

test('TC-007 非 policy 边界与现役卡逐字节相等', () => {
  for (const s of NONPOLICY) assert.equal(trimEnd(bodyOf(section(render(s), '边界'))), trimEnd(bodyOf(cardSection(s, '边界'))), s)
})

test('TC-008 段顺序', () => {
  const t = render('detective-observer')
  const idx = ['职责', '一定会', '禁止', '冲突裁决', '本席清单', '输出格式', '产出', '权限', '越界处置', '边界']
    .map((n) => t.indexOf('\n## ' + n + '\n'))
  assert.ok(idx.every((i) => i >= 0), JSON.stringify(idx))
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b))
})

test('TC-040 policy 非写席 → BOUNDARY_POLICY_NONWRITER，exit 1', () => {
  const { dir, out } = caseCopy((m) => { m.boundary = { kind: 'policy' } })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /BOUNDARY_POLICY_NONWRITER/)
  assert.equal(out.status, 1)
})

test('TC-017 TIER_MISMATCH', () => {
  const { dir, out } = caseCopy((m) => { m.seat.tier = 'producer' })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /TIER_MISMATCH/)
  assert.equal(out.status, 1)
})

test('TC-031 BOUNDARY_KIND_UNKNOWN', () => {
  const { dir, out } = caseCopy((m) => { m.boundary = { kind: 'boom' } })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /BOUNDARY_KIND_UNKNOWN/)
  assert.equal(out.status, 1)
})

test('TC-019 未知档位值 → TIER_MISMATCH，exit 1', () => {
  const { dir, out } = caseCopy((m) => { m.seat.tier = 'admin' })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /TIER_MISMATCH/)
  assert.equal(out.status, 1)
})

test('TC-032 空白 text 只发 BOUNDARY_TEXT_MISSING', () => {
  const { dir, out } = caseCopy((m) => { m.boundary = { kind: 'literal', text: ' ' } })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /BOUNDARY_TEXT_MISSING/)
  assert.doesNotMatch(out.stdout, /BOUNDARY_TEXT_WHITESPACE/)
  assert.equal(out.status, 1)
})

test('TC-004 default 两席只有 kind，模型不复制常量', () => {
  for (const s of ['reviewer-actuary', 'reviewer-ai']) assert.deepEqual(Object.keys(model(s).boundary), ['kind'])
  for (const f of readdirSync(MODELS).filter((f) => f.endsWith('.json'))) {
    assert.ok(!readFileSync(join(MODELS, f), 'utf8').includes('你是只读评审角色'), f)
  }
})

test('TC-015 输出格式表头只有两列', () => {
  const sec = section(render('detective-observer'), '输出格式')
  assert.match(sec, /^\| # \| 字段 \|$/m)
  assert.doesNotMatch(sec, /nonEmpty|required|"type"/)
})

test('TC-022 调换步序后编号跟序号', () => {
  const m = expand(join(MODELS, 'detective-observer-model.json'))
  const [halt, report, ...rest] = m.escalation.steps
  const swapped = { ...m, escalation: { ...m.escalation, steps: [report, halt, ...rest] } }
  const h = makeHelpers({ ...SHARED, ...swapped }, SHARED)
  const out = sections.escalation(swapped, SHARED, h)
  assert.match(out[1], /^1\. 越权信息报/)
  assert.match(out[2], /^2\. 立即停手。/)
})

test('TC-023 5 席无越界处置段', () => {
  for (const s of NONPOLICY) assert.ok(!render(s).includes('\n## 越界处置\n'), s)
})

test('TC-034/035 空 must/never 返回 []', () => {
  assert.deepEqual(sections.must({ must: [] }, SHARED, {}), [])
  assert.deepEqual(sections.never({ never: [] }, SHARED, {}), [])
})

test('TC-036 literal 首尾空白原样渲染', () => {
  const padded = ' ' + model('evidence-reader').boundary.text + '\n'
  const dir = copyCase((m) => { m.boundary.text = padded })
  const t = renderModel(join(M(dir), 'models/evidence-reader-model.json'), JSON.parse(readFileSync(join(M(dir), 'models/_shared-model.json'), 'utf8'))).text
  const sec = t.split(/\n## /).find((x) => x.startsWith('边界\n'))
  rmSync(dir, { recursive: true, force: true })
  const body = sec.slice('边界\n'.length)
  assert.ok(body.startsWith(padded), '正文必须原样包含带首尾空白的 text')
  assert.ok(body.startsWith(' '), '首部空格不得被 trim')
})

test('TC-041 非空带首尾空白只发 WHITESPACE', () => {
  const { dir, out } = caseCopy((m) => { m.boundary.text = m.boundary.text + ' ' })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /BOUNDARY_TEXT_WHITESPACE/)
  assert.doesNotMatch(out.stdout, /BOUNDARY_TEXT_MISSING/)
  assert.equal(out.status, 1)
})

test('TC-024/025 render-all 落 sandbox、8 文件、两次字节同、无 sandbox 字样', () => {
  assert.equal(run(['render-all.mjs']).status, 0)
  const files = readdirSync(join(HERE, 'sandbox')).filter((f) => f.endsWith('.md') && f !== 'diff-report.md').sort()
  assert.equal(files.length, MODEL_COUNT())
  const before = Object.fromEntries(files.map((f) => [f, sha(join(HERE, 'sandbox', f))]))
  assert.equal(run(['render-all.mjs']).status, 0)
  for (const f of files) {
    assert.equal(sha(join(HERE, 'sandbox', f)), before[f], f)
    assert.ok(!readFileSync(join(HERE, 'sandbox', f), 'utf8').includes('sandbox'), f)
  }
})

test('TC-026 --out 相对脚本目录解析（cwd 故意设为仓库根）', () => {
  const script = join(HERE, 'render-all.mjs')
  const abs = join(HERE, 'abs-out')
  assert.equal(run([script, '--out', 'rel-out'], ROOT).status, 0)
  assert.equal(readdirSync(join(HERE, 'rel-out')).filter((f) => f.endsWith('.md')).length, MODEL_COUNT())
  assert.ok(!existsSync(join(ROOT, 'rel-out')), '不得按 process.cwd() 解析')
  assert.equal(run([script, '--out', abs], ROOT).status, 0)
  assert.equal(readdirSync(abs).filter((f) => f.endsWith('.md')).length, MODEL_COUNT())
  rmSync(join(HERE, 'rel-out'), { recursive: true, force: true })
  rmSync(abs, { recursive: true, force: true })
})

test('TC-042/028 报告五节列名冻结且两次字节相同', () => {
  assert.equal(run(['render-all.mjs']).status, 0)
  assert.equal(run(['diff-report.mjs']).status, 0)
  const p = join(HERE, 'sandbox/diff-report.md')
  const t = readFileSync(p, 'utf8')
  for (const h of ['## 总览', '## 段级差异', '## 边界核对', '## 缺失项', '## 已知差异归类']) assert.ok(t.includes(h), h)
  assert.match(t, /^\| 席 \| 类型 \| 沙箱行数 \| 现役行数 \| 沙箱字符 \| 现役字符 \| 段数（沙箱\/现役） \| 边界形态 \| 边界一致 \| 输出格式 \|$/m)
  assert.match(t, /^\| 席 \| 段 \| 状态 \| 字符差 \|$/m)
  assert.match(t, /^\| 席 \| 形态 \| 沙箱长度 \| 现役长度 \| 逐字节相等 \|$/m)
  assert.match(t, /^\| 席 \| 缺失项 \| 原因 \|$/m)
  assert.match(t, /^\| # \| 差异 \| 依据 \|$/m)
  assert.match(t, /reviewer-audit \| 输出格式 \|/)
  assert.equal(readdirSync(join(HERE, 'sandbox')).filter((f) => f.endsWith('.md')).length, MODEL_COUNT() + 1, 'N 张卡 + 1 份报告')
  assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(t))
  const first = sha(p)
  assert.equal(run(['diff-report.mjs']).status, 0)
  assert.equal(sha(p), first, '两次报告须字节相同')
})

test('TC-046 render-all 首个抛错即停、已写文件保留', () => {
  const { dir } = caseCopy((m) => { m.boundary = { kind: 'boom' } }, 'reviewer-ai')
  rmSync(join(dir, 'sandbox'), { recursive: true, force: true })
  // 用副本自己的 models 目录取顺序（render-all 读的也是这一份，避免依赖两个目录的 readdir 顺序一致）
  const order = readdirSync(join(M(dir), 'models')).filter((f) => f.endsWith('-model.json') && !f.startsWith('_')).map((f) => f.replace('-model.json', ''))
  const bad = order.indexOf('reviewer-ai')
  const r = run(['render-all.mjs', '--models', join(M(dir), 'models')], dir)
  const files = existsSync(join(dir, 'sandbox')) ? readdirSync(join(dir, 'sandbox')).filter((f) => f.endsWith('.md')) : []
  rmSync(dir, { recursive: true, force: true })
  assert.equal(r.status, 1)
  assert.equal(files.length, bad, `坏席之前的产物应保留、之后不再写：${files.length} vs ${bad}`)
  for (const s of order.slice(bad)) assert.ok(!files.includes(`${s}.md`), s)
  for (const s of order.slice(0, bad)) assert.ok(files.includes(`${s}.md`), s)
})

test('TC-037 PRD 回写', () => {
  const t = readFileSync(join(ROOT, 'docs/prd/20261111145723-agent-model-pipeline.md'), 'utf8')
  assert.equal((t.match(/要补的 4 个缺口/g) || []).length, 1)
  assert.ok(!t.includes('## 9 待你确认'))
  assert.match(t, /^## 9 已定$/m)
})