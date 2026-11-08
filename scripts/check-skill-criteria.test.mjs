// S-4/S-5：skill 判据检查器用例（对应 docs/superpowers/specs/2026-11-08-s4-s5-skill-criteria-design-testcase.md）
import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { check, judge } from '../tools/docgen/builders/rules/schema.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'tools', 'docgen', 'dsl', 'skills')
const SCRIPT = join(ROOT, 'scripts', 'check-skill-criteria.mjs')
const json = (p) => JSON.parse(readFileSync(p, 'utf8'))
const clone = (x) => JSON.parse(JSON.stringify(x))
const write = (p, x) => writeFileSync(p, `${JSON.stringify(x, null, 2)}\n`, 'utf8')

function run(dir = SRC) {
  return spawnSync(process.execPath, [SCRIPT], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, SKILL_CRITERIA_DIR: dir },
  })
}

function tempSkills() {
  const dir = mkdtempSync(join(tmpdir(), 's4s5-'))
  for (const f of ['docs-placement.json', 'docs-placement.testcase.json']) {
    cpSync(join(SRC, f), join(dir, f))
  }
  return {
    dir,
    data: () => json(join(dir, 'docs-placement.json')),
    cases: () => json(join(dir, 'docs-placement.testcase.json')),
    saveData: (x) => write(join(dir, 'docs-placement.json'), x),
    saveCases: (x) => write(join(dir, 'docs-placement.testcase.json'), x),
    done: () => rmSync(dir, { recursive: true, force: true }),
  }
}

function assertRed(r, code) {
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stderr.split(/\r?\n/)[0] ?? '', new RegExp(`^\\[skill-criteria\\] .*${code}`))
  assert.doesNotMatch((r.stdout || '').trim().split(/\r?\n/).at(-1) ?? '', /^skill-criteria ok$/)
}

test('S4S5-TC-01 两份文件在位，容器结构成立，检查器全绿', () => {
  assert.equal(existsSync(join(SRC, 'docs-placement.json')), true)
  assert.equal(existsSync(join(SRC, 'docs-placement.testcase.json')), true)
  const doc = json(join(SRC, 'docs-placement.json'))
  assert.equal(doc.skill, 'docs-placement')
  assert.ok(Array.isArray(doc.criteria) && doc.criteria.length > 0)
  assert.deepEqual([...new Set(doc.criteria.map((c) => c.scope))], ['skill:docs-placement'])
  assert.equal(new Set(doc.criteria.map((c) => c.id)).size, doc.criteria.length)
  const r = run()
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.match(r.stdout, /^skill-criteria 4 条 \/ 绿 4 \/ 红 0$/m)
  assert.match(r.stdout, /^skill-criteria ok$/m)
})

test('S4S5-TC-02 容器非对象 / 缺 skill / criteria 空 / 非数组 → SkillFileShape', () => {
  const t = tempSkills()
  try {
    for (const bad of [[], { skill: 'docs-placement' }, { ...t.data(), criteria: [] }, { ...t.data(), criteria: {} }]) {
      t.saveData(bad)
      assertRed(run(t.dir), 'SkillFileShape')
    }
  } finally {
    t.done()
  }
})

test('S4S5-TC-03 skill 与文件名不一致 → SkillNameMismatch', () => {
  const t = tempSkills()
  try {
    const d = t.data()
    d.skill = 'docs-placements'
    t.saveData(d)
    assertRed(run(t.dir), 'SkillNameMismatch')
  } finally {
    t.done()
  }
})

test('S4S5-TC-04 任一 scope ≠ skill:<文件名> → CriterionScopeMismatch', () => {
  const t = tempSkills()
  try {
    const d = t.data()
    d.criteria[0].scope = 'skill:docs-placed'
    t.saveData(d)
    assertRed(run(t.dir), 'CriterionScopeMismatch')
  } finally {
    t.done()
  }
})

test('S4S5-TC-05 判据 id 重复 → DuplicateId', () => {
  const t = tempSkills()
  try {
    const d = t.data()
    d.criteria[1].id = d.criteria[0].id
    t.saveData(d)
    assertRed(run(t.dir), 'DuplicateId')
  } finally {
    t.done()
  }
})

test('S4S5-TC-05b 跨文件重复 id → DuplicateId', () => {
  const dir = mkdtempSync(join(tmpdir(), 's4s5-cross-'))
  try {
    const base = json(join(SRC, 'docs-placement.json')).criteria[0]
    const cases = json(join(SRC, 'docs-placement.testcase.json')).cases.filter((c) => c.criterion === base.id)
    for (const n of ['a', 'b']) {
      write(join(dir, `${n}.json`), { skill: n, criteria: [{ ...clone(base), scope: `skill:${n}`, id: 'same-id' }] })
      write(join(dir, `${n}.testcase.json`), { skill: n, cases: cases.map((c) => ({ ...c, criterion: 'same-id' })) })
    }
    const r = run(dir)
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stderr, /DuplicateId/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('S4S5-TC-06 整个 testcase 缺失 → SkillTestcaseMissing', () => {
  const t = tempSkills()
  try {
    rmSync(join(t.dir, 'docs-placement.testcase.json'))
    assertRed(run(t.dir), 'SkillTestcaseMissing')
  } finally {
    t.done()
  }
})

test('S4S5-TC-07 某判据无 case → TestcaseMissing', () => {
  const t = tempSkills()
  try {
    const c = t.cases()
    c.cases = c.cases.filter((x) => x.criterion !== 'docs-placement-naming')
    t.saveCases(c)
    assertRed(run(t.dir), 'TestcaseMissing')
  } finally {
    t.done()
  }
})

test('S4S5-TC-08 只剩正例或只剩反例 → 红', () => {
  const t = tempSkills()
  try {
    const c = t.cases()
    c.cases = c.cases.filter((x) => !(x.criterion === 'docs-placement-naming' && x.expect === 'fail'))
    t.saveCases(c)
    assertRed(run(t.dir), 'TestcaseSchema')
  } finally {
    t.done()
  }
})

test('S4S5-TC-09 testcase 指向未登记 criterion → UnknownCriterion', () => {
  const t = tempSkills()
  try {
    const c = t.cases()
    c.cases.push({ criterion: 'not-registered', input: {}, expect: 'pass' })
    t.saveCases(c)
    assertRed(run(t.dir), 'UnknownCriterion')
  } finally {
    t.done()
  }
})

test('S4S5-TC-09b 未知 criterion 只记 finding，不撑大 N', () => {
  const t = tempSkills()
  try {
    const c = t.cases()
    c.cases.push({ criterion: 'not-registered', input: {}, expect: 'pass' })
    t.saveCases(c)
    const r = run(t.dir)
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stderr, /UnknownCriterion/)
    assert.match(r.stdout, /^skill-criteria 4 条 \/ 绿 4 \/ 红 0$/m)
  } finally {
    t.done()
  }
})

test('S4S5-TC-10 expect 与 judge 结果不符 → CaseMismatch', () => {
  const t = tempSkills()
  try {
    const c = t.cases()
    const i = c.cases.findIndex((x) => x.criterion === 'docs-placement-naming' && x.expect === 'pass')
    c.cases[i].input = { writingDocs: true, docNameExitCode: 1, pathInDocs: true }
    t.saveCases(c)
    assertRed(run(t.dir), 'CaseMismatch')
  } finally {
    t.done()
  }
})

test('S4S5-TC-10b input 为 null → CaseInputInvalid', () => {
  const t = tempSkills()
  try {
    const c = t.cases()
    const i = c.cases.findIndex((x) => x.criterion === 'docs-placement-naming')
    c.cases[i].input = null
    t.saveCases(c)
    const r = run(t.dir)
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stderr, /CaseInputInvalid/)
    assert.match(r.stdout, /^skill-criteria 4 条 \/ 绿 3 \/ 红 1$/m)
  } finally {
    t.done()
  }
})

test('S4S5-TC-11 testcase 容器形状坏 → 红，报文指向 testcase 文件', () => {
  const t = tempSkills()
  try {
    for (const bad of [
      { ...t.cases(), skill: 'other-skill' },
      { ...t.cases(), cases: [] },
    ]) {
      t.saveCases(bad)
      const r = run(t.dir)
      assert.equal(r.status, 1, r.stdout + r.stderr)
      assert.match(r.stderr.split(/\r?\n/)[0] ?? '', /^\[skill-criteria\] .*docs-placement\.testcase\.json/)
    }
  } finally {
    t.done()
  }
})

test('S4S5-TC-12 非 .json 与孤立 testcase 不参与容器扫描', () => {
  const t = tempSkills()
  try {
    writeFileSync(join(t.dir, 'notes.md'), 'ignored\n', 'utf8')
    write(join(t.dir, 'zzz.testcase.json'), { skill: 'zzz', cases: [] })
    const r = run(t.dir)
    assert.equal(r.status, 0, r.stdout + r.stderr)
    assert.match(r.stdout, /^skill-criteria 4 条 \/ 绿 4 \/ 红 0$/m)
  } finally {
    t.done()
  }
})

test('S4S5-TC-13/17 skill scope 正例，global / project 不回归', () => {
  const base = json(join(SRC, 'docs-placement.json')).criteria[0]
  for (const scope of ['skill:docs-placement', 'global', 'project:retro-skills']) {
    const c = { ...clone(base), scope }
    const out = []
    check(c, 'probe.json', out)
    assert.deepEqual(out.filter((x) => /^Scope/.test(x.code)), [], `${scope}: ${JSON.stringify(out)}`)
  }
})

test('S4S5-TC-14/16 skill name 非法 / 缺 scope', () => {
  const base = json(join(SRC, 'docs-placement.json')).criteria[0]
  const bad = clone(base)
  bad.scope = 'skill:Bad_Name'
  const e1 = []
  check(bad, 'probe.json', e1)
  assert.ok(e1.some((x) => x.code === 'ScopeInvalid'))
  const missing = clone(base)
  delete missing.scope
  const e2 = []
  check(missing, 'probe.json', e2)
  const hit = e2.find((x) => x.code === 'ScopeMissing')
  assert.ok(hit)
  assert.match(hit.message, /skill:<name>/)
})

test('S4S5-TC-15 project scope 用在 skill 容器 → CriterionScopeMismatch', () => {
  const t = tempSkills()
  try {
    const d = t.data()
    d.criteria[0].scope = 'project:docs-placement'
    t.saveData(d)
    assertRed(run(t.dir), 'CriterionScopeMismatch')
  } finally {
    t.done()
  }
})

test('S4S5-TC-18～28 docs-placement 四组判据的 pass/fail 与 residual', () => {
  const doc = json(join(SRC, 'docs-placement.json'))
  const tc = json(join(SRC, 'docs-placement.testcase.json'))
  const byId = new Map(doc.criteria.map((c) => [c.id, c]))
  for (const c of tc.cases) {
    const criterion = byId.get(c.criterion)
    assert.ok(criterion, `未知 criterion ${c.criterion}`)
    assert.equal(judge(criterion, c.input), c.expect, `${c.criterion} ${JSON.stringify(c.input)}`)
  }
  for (const c of doc.criteria) {
    for (const k of ['who', 'sample', 'fields', 'objectivePath']) assert.ok(c.residual?.[k] !== undefined, `${c.id} 缺 residual.${k}`)
  }
})

test('S4S5-TC-29/30/31 输出契约与计数自洽', () => {
  const ok = run()
  assert.equal(ok.status, 0, ok.stdout + ok.stderr)
  assert.match(ok.stdout, /^skill-criteria 4 条 \/ 绿 4 \/ 红 0$/m)
  assert.match(ok.stdout, /^skill-criteria ok$/m)

  const t = tempSkills()
  try {
    const d = t.data()
    d.criteria[0].scope = 'skill:docs-placed'
    t.saveData(d)
    const bad = run(t.dir)
    assert.equal(bad.status, 1, bad.stdout + bad.stderr)
    const first = bad.stdout.split(/\r?\n/)[0]
    const m = /^skill-criteria (\d+) 条 \/ 绿 (\d+) \/ 红 (\d+)$/.exec(first)
    assert.ok(m, first)
    assert.equal(Number(m[1]), 4)
    assert.equal(Number(m[2]) + Number(m[3]), 4)
    assert.doesNotMatch(bad.stdout.trim().split(/\r?\n/).at(-1), /^skill-criteria ok$/)
  } finally {
    t.done()
  }
})

test('S4S5-TC-32/33/35 门禁与独立入口接线', () => {
  const pkg = json(join(ROOT, 'package.json'))
  assert.equal(pkg.scripts['check:skill-criteria'], 'node scripts/check-skill-criteria.mjs')
  const checkAll = readFileSync(join(ROOT, 'scripts', 'check-all.mjs'), 'utf8')
  assert.ok(checkAll.includes('check-skill-criteria.mjs'))
  assert.ok(checkAll.includes('scRun') && /failed = true/.test(checkAll), 'check-all 必须调用检查器并在失败时置 failed')
})

test('S4S5-TC-34 既有判据引擎零回归', () => {
  const r = spawnSync('npm run check:criteria', { cwd: ROOT, encoding: 'utf8', shell: true })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.match(r.stdout, /criteria-engine ok/)
})

test('S4S5-TC-36b skills 目录不存在 → SkillDirMissing', () => {
  const dir = join(tmpdir(), `s4s5-missing-${Date.now()}`)
  const r = run(dir)
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stderr, /SkillDirMissing/)
})

test('S4S5-TC-36 空目录 → 0 条 / 绿 0 / 红 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 's4s5-empty-'))
  try {
    writeFileSync(join(dir, '.gitkeep'), '', 'utf8')
    const r = run(dir)
    assert.equal(r.status, 0, r.stdout + r.stderr)
    assert.match(r.stdout, /^skill-criteria 0 条 \/ 绿 0 \/ 红 0$/m)
    assert.match(r.stdout, /^skill-criteria ok$/m)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
