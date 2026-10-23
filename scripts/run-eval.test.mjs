// run-eval.test.mjs —— runner CLI 纯函数单测（spec §5 验收项 10）
// 覆盖可导出的纯函数：参数拼装 / 路径 resolve / 注入 / 退出码选择 / 分桶 / 迭代目录统计。
// 不 spawn 真实工具、不访问网络；临时目录用 os.tmpdir()，用例结束即删。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import {
  parseArgs, resolvePaths, resolveRunPaths, buildToolArgs, decideExitCode, formatRate,
  validateExpectationBlock, auditRepoSource, auditSkillPaths, injectModelAndSkillPaths,
  groupRunsByCase, collectBenchmarks, deriveForcedVerdict, evaluateCase, renderAnomalySection,
} from './run-eval.mjs'
import { assertHash, extractPathValue } from './eval-contract-core.mjs'

const gate = (verdict, dataComplete = true) => ({ role: 'gate', verdict, dataComplete })
const probe = (verdict, dataComplete = true) => ({ role: 'probe', verdict, dataComplete })

// ── ① 参数拼装 ────────────────────────────────────────────────────────────────

test('parseArgs：无参数时用默认技能名 / iteration=2 / 非 dry-run', () => {
  const a = parseArgs([])
  assert.equal(a.skill, 'review-triage')
  assert.equal(a.iteration, 2)
  assert.equal(a.dryRun, false)
  assert.equal(a.evalYaml, null)
  assert.equal(a.outputDir, null)
})

test('parseArgs：位置参数取技能名，其余 flag 各就各位', () => {
  const a = parseArgs([
    'review-triage', '--dry-run',
    '--eval-yaml', 'evals/review-triage/eval.yaml',
    '--output-dir', '.session/eval-out/x',
    '--iteration', '3',
  ])
  assert.equal(a.skill, 'review-triage')
  assert.equal(a.dryRun, true)
  assert.equal(a.evalYaml, 'evals/review-triage/eval.yaml')
  assert.equal(a.outputDir, '.session/eval-out/x')
  assert.equal(a.iteration, 3)
})

test('parseArgs：只给 --dry-run 时技能名仍取默认值', () => {
  const a = parseArgs(['--dry-run'])
  assert.equal(a.skill, 'review-triage')
  assert.equal(a.dryRun, true)
})

test('parseArgs：--iteration 非数字返回 NaN（由前置闸门 ⑤ 判码 4）', () => {
  assert.ok(Number.isNaN(parseArgs(['x', '--iteration', 'abc']).iteration))
})

test('parseArgs：带值参数后紧跟另一个 -- 项 / 缺值 → argError（不得静默吞掉）', () => {
  const a = parseArgs(['x', '--iteration', '--dry-run'])
  assert.match(a.argError, /--iteration/)
  assert.equal(a.dryRun, true)
  assert.match(parseArgs(['x', '--eval-yaml']).argError, /--eval-yaml/)
  assert.match(parseArgs(['x', '--output-dir', '--iteration', '3']).argError, /--output-dir/)
  assert.equal(parseArgs(['x', '--iteration', '3']).argError, null)
})

test('buildToolArgs：固定前缀 + --baseline 由 benchmark.enabled 决定', () => {
  const base = { evalYaml: 'D:/repo/evals/skill/eval.yaml', outputDir: 'D:/repo/.session/eval-out/skill', iteration: 2 }
  assert.deepEqual(buildToolArgs({ ...base, baseline: true }), [
    'run', 'D:/repo/evals/skill/eval.yaml', '--output-dir', 'D:/repo/.session/eval-out/skill', '--iteration', '2', '--baseline',
  ])
  assert.deepEqual(buildToolArgs({ ...base, baseline: false }), [
    'run', 'D:/repo/evals/skill/eval.yaml', '--output-dir', 'D:/repo/.session/eval-out/skill', '--iteration', '2',
  ])
})

// ── ③ 路径 resolve（repoRoot = <eval.yaml 目录>/../..，且 <eval.yaml 目录>/.. 末级必须是 evals）──

test('resolvePaths：repoRoot 由 eval.yaml 位置推导（= eval.yaml 目录/../..）', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const dir = join(tmp, 'repo', 'evals', 'demo')
    mkdirSync(dir, { recursive: true })
    const yaml = join(dir, 'eval.yaml')
    writeFileSync(yaml, 'schema_version: v1alpha1\n')
    const p = resolvePaths(yaml)
    assert.equal(p.ok, true)
    assert.equal(p.evalDir, resolve(tmp, 'repo', 'evals', 'demo'))
    assert.equal(p.repoRoot, resolve(tmp, 'repo'))
    assert.equal(p.evalYaml, resolve(yaml))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('resolvePaths：<eval.yaml 目录>/.. 末级不是 evals 时 ok=false（码 4）', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const dir = join(tmp, 'repo', 'skills', 'demo')
    mkdirSync(dir, { recursive: true })
    const yaml = join(dir, 'eval.yaml')
    writeFileSync(yaml, 'x\n')
    const p = resolvePaths(yaml)
    assert.equal(p.ok, false)
    assert.match(p.error, /evals/)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('resolveRunPaths：outputDir 缺省为 <repoRoot>/.session/eval-out/<技能名>，全部绝对路径', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const dir = join(tmp, 'repo', 'evals', 'demo')
    mkdirSync(dir, { recursive: true })
    const yaml = join(dir, 'eval.yaml')
    writeFileSync(yaml, 'x\n')
    const r = resolveRunPaths({ evalYaml: yaml, skill: 'demo' })
    assert.equal(r.ok, true)
    assert.equal(r.evalsDir, resolve(tmp, 'repo', 'evals'))
    assert.equal(r.skillRoot, resolve(tmp, 'repo', 'skills', 'demo'))
    assert.equal(r.outputDir, resolve(tmp, 'repo', '.session', 'eval-out', 'demo'))
    const r2 = resolveRunPaths({ evalYaml: yaml, outputDir: 'relative-out', skill: 'demo' })
    assert.equal(r2.outputDir, resolve('relative-out'))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('resolveRunPaths：基准不合法时直接失败（不猜 repoRoot）', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const dir = join(tmp, 'repo', 'x', 'demo')
    mkdirSync(dir, { recursive: true })
    const yaml = join(dir, 'eval.yaml')
    writeFileSync(yaml, 'x\n')
    const r = resolveRunPaths({ evalYaml: yaml, skill: 'demo' })
    assert.equal(r.ok, false)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

// ── ⑥-1 源目录检查：缺目录 / 自带 .git 都要拦（避免 .git 被再 init 成嵌套仓库）──────

test('auditRepoSource：缺源目录报问题；源目录自带 .git 同样报（⑥-1 → 码 4）', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const evalDir = join(tmp, 'evals', 'demo')
    const repos = join(evalDir, 'fixtures', 'repos')
    mkdirSync(join(repos, 'clean'), { recursive: true })
    mkdirSync(join(repos, 'dirty', '.git'), { recursive: true })
    assert.deepEqual(auditRepoSource(evalDir, new Map([['clean', 'c1']])), [])
    const problems = auditRepoSource(evalDir, new Map([['dirty', 'c2'], ['ghost', 'c3']]))
    assert.equal(problems.length, 2, problems.join('；'))
    assert.match(problems.join('\n'), /dirty\/\.git/)
    assert.match(problems.join('\n'), /源目录不存在：fixtures\/repos\/ghost\//)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

// ── ② 退出码选择（二维表 ①–④ + 跨行优先级 + probe 不参与 + 认证/超时分支）──────

test('二维表①：工具码 0/1 + 数据完整 → 码由 verdict 定', () => {
  assert.equal(decideExitCode({ toolCode: 0, hasBenchmark: true, lines: [gate('VALID')] }), 0)
  assert.equal(decideExitCode({ toolCode: 1, hasBenchmark: true, lines: [gate('INVALID_ASSERT')] }), 1)
  // 工具退 1 不直接决定 runner 码（以稳定性结论为准）
  assert.equal(decideExitCode({ toolCode: 1, hasBenchmark: true, lines: [gate('VALID')] }), 0)
})

test('二维表②：工具码 2/3 且有数据 → 以工具为准（不被 verdict 洗成 0）', () => {
  assert.equal(decideExitCode({ toolCode: 3, hasBenchmark: true, lines: [gate('VALID')] }), 3)
  assert.equal(decideExitCode({ toolCode: 2, hasBenchmark: true, lines: [gate('VALID')] }), 2)
})

test('二维表③：数据不完整 → 码 2（含无 benchmark.json、某臂未判定）', () => {
  assert.equal(decideExitCode({ toolCode: 0, hasBenchmark: false, lines: [gate('INVALID_ENV', false)] }), 2)
  assert.equal(decideExitCode({ toolCode: 1, hasBenchmark: true, lines: [gate('INVALID_ENV', false)] }), 2)
})

test('二维表④：表外码原样透传，且透传优先于③（无产物也透传）', () => {
  assert.equal(decideExitCode({ toolCode: 5, hasBenchmark: false, lines: [] }), 5)
  assert.equal(decideExitCode({ toolCode: 5, hasBenchmark: true, lines: [gate('VALID')] }), 5)
})

test('跨行优先级 2 > 3 > 1 > 0', () => {
  assert.equal(decideExitCode({ toolCode: 0, hasBenchmark: true, lines: [gate('VALID'), gate('INVALID_FLAKY')] }), 3)
  assert.equal(decideExitCode({ toolCode: 0, hasBenchmark: true, lines: [gate('INVALID_FLAKY'), gate('INVALID_ENV')] }), 2)
  assert.equal(decideExitCode({ toolCode: 0, hasBenchmark: true, lines: [gate('VALID'), gate('INVALID_ASSERT')] }), 1)
  assert.equal(decideExitCode({ toolCode: 0, hasBenchmark: true, lines: [gate('VALID'), gate('VALID')] }), 0)
})

test('probe 不参与退出码；gate 用例数为 0 → 码 3', () => {
  assert.equal(decideExitCode({ toolCode: 0, hasBenchmark: true, lines: [gate('VALID'), probe('INVALID_FLAKY')] }), 0)
  assert.equal(decideExitCode({ toolCode: 0, hasBenchmark: true, lines: [probe('VALID')] }), 3)
})

test('认证分支覆盖一切（含表外码透传）→ 码 2', () => {
  assert.equal(decideExitCode({ toolCode: 1, authFailed: true, hasBenchmark: true, lines: [gate('VALID')] }), 2)
  assert.equal(decideExitCode({ toolCode: 5, authFailed: true, hasBenchmark: false, lines: [] }), 2)
})

test('超时分支 → 码 2；spawn 报错（无工具码）→ 码 2', () => {
  assert.equal(decideExitCode({ toolCode: 1, timedOut: true, hasBenchmark: true, lines: [gate('VALID')] }), 2)
  assert.equal(decideExitCode({ toolCode: null, hasBenchmark: false, lines: [] }), 2)
})

// ── 行渲染：两臂都不可算时 rate 归一成「未判定」（spec §3.3-7）────────────────

test('formatRate：两臂 determined 均为 0 → 写「未判定」；任一臂有数则保留「装/不装」', () => {
  assert.equal(formatRate({ rate: '未判定/未判定' }, { determined: 0 }, { determined: 0 }), '未判定')
  assert.equal(formatRate({ rate: '未判定/0.4' }, { determined: 0 }, { determined: 2 }), '未判定/0.4')
  assert.equal(formatRate({ rate: '1/0' }, { determined: 2 }, { determined: 2 }), '1/0')
})

// ── frozen 账本：assert_hash 复算比对（spec §3.2.2③，runner 只复算不生成）──────

test('frozen：ledger assert_hash 与当前 assert/anchors/arms/delta 一致 → 无问题；篡改 assert 或 arms → 报不一致', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const caseText = 'title: T\nexpect:\n  must_contain:\n    - "a"\n  must_not_contain:\n    - "b"\n'
    const arms = { with_skill: { min_rate: 0.9, max_rate: 1 }, without_skill: { min_rate: 0, max_rate: 0.1 } }
    const delta = { min: 0.8 }
    const assertBlock = { must_contain: ['a'], must_not_contain: ['b'] }
    const anchors = ['x']
    const base = {
      eval_name: 'T', role: 'gate', origin: 'frozen', frozen_since: '2026-10-01',
      oracle: 'o.md', anchors, assert: assertBlock, arms, delta,
    }
    writeFileSync(join(tmp, 'frozen-ledger.json'), JSON.stringify({
      T: {
        frozen_since: '2026-10-01',
        verified_at: 'fixtures/calibration/t.json',
        arms_snapshot: arms,
        delta_at_verify: delta,
        assert_hash: assertHash({ assert: assertBlock, anchors, arms, delta }),
        verified_snapshot: {},
      },
    }), 'utf8')
    const cases = [{ rel: 'c', abs: 'c', text: caseText, title: 'T', id: 'c', ctx: {} }]

    assert.deepEqual(validateExpectationBlock({ iteration_min: 2, cases: [base] }, cases, { evalDir: tmp, iteration: 2 }), [])

    const badAssert = validateExpectationBlock(
      { iteration_min: 2, cases: [{ ...base, assert: { must_contain: ['a', 'c'], must_not_contain: ['b'] } }] },
      cases, { evalDir: tmp, iteration: 2 },
    )
    assert.ok(badAssert.some((p) => p.includes('assert_hash')), badAssert.join('；'))

    const badArms = validateExpectationBlock(
      { iteration_min: 2, cases: [{ ...base, arms: { ...arms, with_skill: { min_rate: 0.95, max_rate: 1 } } }] },
      cases, { evalDir: tmp, iteration: 2 },
    )
    assert.ok(badArms.some((p) => p.includes('assert_hash')), badArms.join('；'))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

// ── ⑧ 键白名单 + judge ⊆ expect（与 A1 的 KEYS-1/2/6 同一实现 auditCaseKeys）──────

function probeBlock(assertBlock = { must_contain: ['a'], must_not_contain: ['b'] }) {
  return {
    iteration_min: 2,
    cases: [{ eval_name: 'T', role: 'probe', origin: 'calibrated', oracle: 'o.md', anchors: [], assert: assertBlock, arms: null, delta: null }],
  }
}

test('⑧ judge⊆expect：judge.all 含 expect 未声明的词 → validateExpectationBlock 返回非空', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const caseText = 'title: T\nexpect:\n  must_contain:\n    - "a"\n  must_not_contain:\n    - "b"\njudge:\n  success:\n    - output_contains:\n        all:\n          - "a"\n          - "越界词"\n'
    const cases = [{ rel: 'c', abs: 'c', text: caseText, title: 'T', id: 'c', ctx: {} }]
    const out = validateExpectationBlock(probeBlock(), cases, { evalDir: tmp, iteration: 2 })
    assert.ok(out.some((p) => p.includes('judge.all') && p.includes('越界词')), out.join('；'))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('⑧ 键白名单：用例 yaml 用了 exit_code: → validateExpectationBlock 返回非空', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const caseText = 'title: T\nexit_code: 0\nexpect:\n  must_contain:\n    - "a"\n  must_not_contain:\n    - "b"\n'
    const cases = [{ rel: 'c', abs: 'c', text: caseText, title: 'T', id: 'c', ctx: {} }]
    const out = validateExpectationBlock(probeBlock(), cases, { evalDir: tmp, iteration: 2 })
    assert.ok(out.some((p) => p.includes('禁止的键') && p.includes('exit_code')), out.join('；'))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

// ── ① 未知参数：不得静默吞掉（吞掉 = 配错照样按默认值跑）────────────────────

test('parseArgs：未知 --flag / 单横线参数 → argError（单横线不得被当成技能名）', () => {
  const unknown = parseArgs(['x', '--verbose'])
  assert.equal(unknown.skill, 'x')
  assert.match(unknown.argError, /--verbose/)

  const single = parseArgs(['x', '-iteration', '3'])
  assert.equal(single.skill, 'x')
  assert.match(single.argError, /-iteration/)
  assert.equal(single.iteration, 2)

  assert.equal(parseArgs(['x', '--dry-run']).argError, null)
})

// ── ④ 注入：整值替换（占位是否带引号 / 描述正文 / 原有引号 / 多技能）────────────

const INJECT_TEXT = [
  'schema_version: v1alpha1',
  'name: demo',
  'description: 说明里写了 "{provider}" 这个占位',
  'skills:',
  '  - source: local_path',
  '    path: ../skills/demo',
  'engine:',
  '  name: claude_code',
  '  model:',
  '    provider: {provider}',
  '    name: "{name}"',
  '',
].join('\n')

const withEvalDir = (text, evalsDir, provider = 'DeepSeek', name = 'deepseek-flash') =>
  injectModelAndSkillPaths(text, { provider, name, evalsDir })

test('injectModelAndSkillPaths：占位不带引号也能注入，skills.path 绝对化为 posix 路径', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const evalsDir = join(tmp, 'repo', 'evals')
    const r = withEvalDir(INJECT_TEXT, evalsDir)
    assert.equal(r.ok, true, r.error)
    assert.equal(extractPathValue(r.text, ['engine', 'model', 'provider']).value, 'DeepSeek')
    assert.equal(extractPathValue(r.text, ['engine', 'model', 'name']).value, 'deepseek-flash')
    const want = resolve(evalsDir, '../skills/demo').split(sep).join('/')
    assert.equal(extractPathValue(r.text, ['skills', 'path']).value, want)
    assert.equal(r.rewritten, 1)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('injectModelAndSkillPaths：description 正文里的 "{provider}" 字面量不得被替换', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const r = withEvalDir(INJECT_TEXT, join(tmp, 'repo', 'evals'))
    assert.equal(r.ok, true, r.error)
    assert.match(r.text, /^description: 说明里写了 "\{provider\}" 这个占位$/m)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('injectModelAndSkillPaths：原值带引号时不产生悬空尾引号', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const evalsDir = join(tmp, 'repo', 'evals')
    const text = INJECT_TEXT.replace('    path: ../skills/demo', '    path: "../skills/demo"')
    const r = withEvalDir(text, evalsDir)
    assert.equal(r.ok, true, r.error)
    const line = r.text.split('\n').find((l) => l.includes('path:'))
    assert.equal((line.match(/"/g) || []).length, 2, line)
    assert.equal(extractPathValue(r.text, ['skills', 'path']).value, resolve(evalsDir, '../skills/demo').split(sep).join('/'))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('injectModelAndSkillPaths：skills 块内多条 path 全部绝对化（多技能不漏改）', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const evalsDir = join(tmp, 'repo', 'evals')
    const text = INJECT_TEXT.replace(
      '    path: ../skills/demo',
      '    path: ../skills/demo\n  - source: local_path\n    path: ../skills/other',
    )
    const r = withEvalDir(text, evalsDir)
    assert.equal(r.ok, true, r.error)
    assert.equal(r.rewritten, 2)
    const paths = r.text.split('\n').filter((l) => l.includes('path:')).map((l) => l.match(/"([^"]+)"/)?.[1])
    assert.deepEqual(paths, [
      resolve(evalsDir, '../skills/demo').split(sep).join('/'),
      resolve(evalsDir, '../skills/other').split(sep).join('/'),
    ])
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

// ── ⑤ 分桶：configuration 只认两臂，其余落 unknown（不得默认成不装臂）──────────

test('groupRunsByCase：configuration 三分桶（未知值 / 缺失值都不得落进不装臂）', () => {
  const map = groupRunsByCase([
    { runs: [
      { eval_name: 'A', configuration: 'with_skill', result: { passed: 3, total: 3 } },
      { eval_name: 'A', configuration: 'without_skill', result: { passed: 0, total: 3 } },
      { eval_name: 'A', configuration: 'baseline', result: { passed: 3, total: 3 } },
      { eval_name: 'A', result: { passed: 3, total: 3 } },
    ] },
  ])
  const b = map.get('A')
  assert.equal(b.with.length, 1)
  assert.equal(b.without.length, 1)
  assert.equal(b.unknown.length, 2)
  assert.equal(b.all.length, 4)
})

// ── ⑥ 迭代目录：n 只数成功解析的 benchmark.json ──────────────────────────────

test('collectBenchmarks：坏 benchmark.json 不计入 n 且被单列；目录不存在时 n=0', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    mkdirSync(join(tmp, 'iteration-1'), { recursive: true })
    writeFileSync(join(tmp, 'iteration-1', 'benchmark.json'), JSON.stringify({ runs: [] }), 'utf8')
    mkdirSync(join(tmp, 'iteration-2'), { recursive: true })
    writeFileSync(join(tmp, 'iteration-2', 'benchmark.json'), '{oops', 'utf8')

    const r = collectBenchmarks(tmp)
    assert.equal(r.n, 1)
    assert.equal(r.datas.length, 1)
    assert.equal(r.badFiles.length, 1)
    assert.match(r.badFiles[0].path, /iteration-2/)

    assert.deepEqual(collectBenchmarks(join(tmp, 'ghost')), { n: 0, badFiles: [], datas: [] })
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('collectBenchmarks：能 parse 但形状不可用（null / 数组 / runs 非数组）同样进 badFiles、不计 n', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const write = (dir, text) => {
      mkdirSync(join(tmp, dir), { recursive: true })
      writeFileSync(join(tmp, dir, 'benchmark.json'), text, 'utf8')
    }
    write('iteration-1', 'null')            // JSON.parse 成功但返回 null：旧实现收下后 groupRunsByCase 取 .runs 直接崩
    write('iteration-2', '[]')
    write('iteration-3', '{"runs":{}}')
    write('iteration-4', '{"runs":[]}')

    const r = collectBenchmarks(tmp)
    assert.equal(r.n, 1)
    assert.deepEqual(r.badFiles.map((b) => b.error), ['产物不是对象', '产物不是对象', 'runs 不是数组'])
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

// ── ⑦ 注入失败分支：不得静默成功（缺 skills 块 / path 为空 / 块内无 path）────────

test('injectModelAndSkillPaths：缺 skills 块 / path 为空 / 块内无 path 都返回 ok=false 并指明哪一项', () => {
  const evalsDir = join(tmpdir(), 'run-eval-nowhere', 'evals')
  const noSkills = 'engine:\n  model:\n    provider: {provider}\n    name: {name}\n'
  const r1 = withEvalDir(noSkills, evalsDir)
  assert.equal(r1.ok, false)
  assert.match(r1.error, /缺少 skills 块/)

  const emptyPath = INJECT_TEXT.replace('    path: ../skills/demo', '    path: ""')
  const r2 = withEvalDir(emptyPath, evalsDir)
  assert.equal(r2.ok, false)
  assert.match(r2.error, /skills\.path 为空/)

  const noPath = INJECT_TEXT.replace('    path: ../skills/demo\n', '')
  const r3 = withEvalDir(noPath, evalsDir)
  assert.equal(r3.ok, false)
  assert.match(r3.error, /没有 path 字段/)
})

test('injectModelAndSkillPaths：单引号 path（合法 YAML）也去壳，写出的是纯双引号绝对路径', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const evalsDir = join(tmp, 'repo', 'evals')
    const text = INJECT_TEXT.replace('    path: ../skills/demo', "    path: '../skills/demo'")
    const r = withEvalDir(text, evalsDir)
    assert.equal(r.ok, true, r.error)
    const line = r.text.split('\n').find((l) => l.includes('path:'))
    assert.equal((line.match(/'/g) || []).length, 0, line)
    assert.equal(line.match(/"([^"]+)"/)?.[1], resolve(evalsDir, '../skills/demo').split(sep).join('/'))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

// ── ⑧ ⑥-4：skills[].path 是复数，每条都要查（与注入同口径）──────────────────

test('auditSkillPaths：单引号不被误判；多条 path 逐条查，第二条缺 SKILL.md 要报出来', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'run-eval-'))
  try {
    const evalsDir = join(tmp, 'evals')
    mkdirSync(evalsDir, { recursive: true })
    // path 相对 evalsDir 解析：../skills/x → <tmp>/skills/x
    mkdirSync(join(tmp, 'skills', 'a'), { recursive: true })
    writeFileSync(join(tmp, 'skills', 'a', 'SKILL.md'), 'x\n')
    mkdirSync(join(tmp, 'skills', 'b'), { recursive: true })
    mkdirSync(join(tmp, 'skills', 'c'), { recursive: true })
    writeFileSync(join(tmp, 'skills', 'c', 'SKILL.md'), 'x\n')

    const twoOk = "skills:\n  - source: local_path\n    path: '../skills/a'\n  - source: local_path\n    path: ../skills/c\n"
    assert.deepEqual(auditSkillPaths(twoOk, evalsDir).problems, [])

    const secondBad = "skills:\n  - source: local_path\n    path: '../skills/a'\n  - source: local_path\n    path: '../skills/b'\n"
    const out = auditSkillPaths(secondBad, evalsDir)
    assert.equal(out.problems.length, 1, out.problems.join('；'))
    assert.match(out.problems[0], /skills[\\/]b/)
    assert.match(out.problems[0], /SKILL\.md/)

    const ghost = "skills:\n  - source: local_path\n    path: ../skills/ghost\n"
    assert.match(auditSkillPaths(ghost, evalsDir).problems[0], /解析后不存在/)

    const missing = 'engine:\n  model:\n    provider: x\n'
    assert.match(auditSkillPaths(missing, evalsDir).problems[0], /缺失/)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

// ── ⑨ ③ 与 ④ 的优先级：unknown 配置归 ③，不得把表外码透传洗成 2 ──────────────

test('renderAnomalySection：无异常写「无」；四类异常各自逐条落纸', () => {
  assert.deepEqual(renderAnomalySection({}), ['## 异常明细', '', '无'])

  const bucket = {
    unknown: [{ eval_name: 'A', configuration: 'baseline' }],
    all: [
      { eval_name: 'A', configuration: 'with_skill', result: { passed: [], total: [] } },
      { eval_name: 'A', configuration: 'with_skill', result: { passed: 3, total: 3 } },
    ],
  }
  const out = renderAnomalySection({
    badFiles: [{ path: 'x/iteration-2/benchmark.json', error: 'runs 不是数组' }],
    decisions: [{ c: { eval_name: 'A' }, bucket }],
    timeoutSignals: ['② stderr 命中 timeout / timed out / 超时'],
  })
  assert.equal(out[0], '## 异常明细')
  assert.ok(out.some((l) => l.includes('iteration-2/benchmark.json') && l.includes('runs 不是数组')))
  assert.ok(out.some((l) => l.includes('unknown 配置的跑') && l.includes('"baseline"')))
  assert.ok(out.some((l) => l.includes('undetermined 的跑') && l.includes('passed=[]')))
  assert.ok(out.some((l) => l.includes('超时信号') && l.includes('②')))
  assert.ok(!out.includes('无'), '有异常时不得写「无」')
})

test('deriveForcedVerdict：工具码 5 即使数据不完整也不覆盖（④ 透传优先于 ③）', () => {
  assert.equal(deriveForcedVerdict({ toolCode: 5, dataComplete: false }), null)
  assert.equal(deriveForcedVerdict({ toolCode: 0, dataComplete: false }), 'INVALID_ENV')
  assert.equal(deriveForcedVerdict({ toolCode: 1, dataComplete: true }), null)
  assert.equal(deriveForcedVerdict({ toolCode: 3, dataComplete: true }), 'INVALID_ENV')
  assert.equal(deriveForcedVerdict({ authFailed: true, toolCode: 5 }), 'INVALID_ENV')
})

test('evaluateCase：存在 unknown 配置的跑 → dataComplete=false（结论仍是 VALID，靠 forced 层拦）', () => {
  const caseMeta = {
    eval_name: 'A', role: 'gate', origin: 'calibrated',
    arms: { with_skill: { min_rate: 0.8, max_rate: 1 }, without_skill: { min_rate: 0, max_rate: 0.5 } },
    delta: { min: 0.5 },
  }
  const run = (configuration, passed, total) => ({ eval_name: 'A', configuration, result: { passed, total } })
  const clean = groupRunsByCase([{ runs: [
    run('with_skill', 3, 3), run('with_skill', 3, 3),
    run('without_skill', 0, 3), run('without_skill', 0, 3),
  ] }]).get('A')
  const ok = evaluateCase({ caseMeta, bucket: clean, iterationDirs: 2, iterationMin: 2 })
  assert.equal(ok.d.verdict, 'VALID')
  assert.equal(ok.dataComplete, true)

  const dirty = groupRunsByCase([{ runs: [
    run('with_skill', 3, 3), run('with_skill', 3, 3),
    run('without_skill', 0, 3), run('without_skill', 0, 3),
    run('baseline', 3, 3),
  ] }]).get('A')
  const bad = evaluateCase({ caseMeta, bucket: dirty, iterationDirs: 2, iterationMin: 2 })
  assert.equal(bad.d.verdict, 'VALID')          // 聚合层不改 verdict
  assert.equal(bad.dataComplete, false)         // 由 run 期覆盖层判 INVALID_ENV
  assert.equal(deriveForcedVerdict({ toolCode: 0, dataComplete: false }), 'INVALID_ENV')
})
