// check-eval-contract.test.mjs —— A1 单测（node:test + node:assert/strict，零第三方依赖）
// 前半：core 纯函数；后半：CLI 级检查项（在同构副本上跑，正例 exit 0 / 负例 exit 4 + 正确编号）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  extractMachineBlock, extractBlockList, hasInlineArray, extractScalar,
  extractContextPaths, extractPromptText, extractPathValue, extractBlockLists,
  extractPlainBlockList, setPathScalar, sha256, canonicalJson, assertHash, auditCaseKeys,
  unquoteYamlScalar, listSkillsPathScalars,
} from './eval-contract-core.mjs'

const MD = '```json\n{"schema":"eval-expectation/v2"}\n```'
const YAML_BLOCK = 'expect:\n  must_contain:\n    - "可直接提交"\n  must_not_contain:\n    - "低风险"\n'

test('extractMachineBlock 抽得出 JSON', () => {
  const r = extractMachineBlock(MD)
  assert.equal(r.ok, true)
  assert.equal(r.block.schema, 'eval-expectation/v2')
})

test('extractMachineBlock 无块时报错', () => {
  assert.equal(extractMachineBlock('# 空的').ok, false)
})

test('extractMachineBlock 多个 json 块时报错（spec §3.2.2 恰好一个）', () => {
  const r = extractMachineBlock(MD + '\n' + MD)
  assert.equal(r.ok, false)
  assert.match(r.error, /恰好 1 个/)
})

test('extractBlockList 抽得出块列表（同级字段处终止）', () => {
  const r = extractBlockList(YAML_BLOCK, 'must_contain')
  assert.equal(r.ok, true)
  assert.deepEqual(r.items, ['可直接提交'])
})

test('extractBlockList 抽得出嵌套层级下的块列表（judge 的 all）', () => {
  const judge = 'judge:\n  success:\n    - output_contains:\n        all:\n          - "必须 review"\n          - "机器判不了"\n'
  const r = extractBlockList(judge, 'all')
  assert.deepEqual(r.items, ['必须 review', '机器判不了'])
})

test('extractBlockList 对行内数组报错', () => {
  const r = extractBlockList('  must_contain: ["a", "b"]\n', 'must_contain')
  assert.equal(r.ok, false)
})

test('extractBlockList 字段为空时报错', () => {
  const r = extractBlockList('expect:\n  must_contain:\n  must_not_contain:\n    - "低风险"\n', 'must_contain')
  assert.equal(r.ok, false)
})

test('hasInlineArray 认行内数组、不认块列表', () => {
  assert.equal(hasInlineArray('must_contain: ["a", "b"]', 'must_contain'), true)
  assert.equal(hasInlineArray(YAML_BLOCK, 'must_contain'), false)
})

test('extractScalar 取顶层标量', () => {
  assert.equal(extractScalar('id: 01-checkbox-mechanical\ntitle: 纯勾选\n', 'title'), '纯勾选')
  assert.equal(extractScalar('id: 01\n', 'title'), null)
})

test('extractContextPaths 取 repo_fixture / apply_diff 与 context.git', () => {
  const text = 'context:\n  repo_fixture: ../.session/eval/fixture/review-triage/checkbox-demo\n  git:\n    init: true\n    apply_diff: review-triage/fixtures/diffs/checkbox.patch\n'
  const r = extractContextPaths(text)
  assert.equal(r.repo_fixture, '../.session/eval/fixture/review-triage/checkbox-demo')
  assert.equal(r.apply_diff, 'review-triage/fixtures/diffs/checkbox.patch')
  assert.equal(r.hasContextGit, true)
  assert.equal(extractContextPaths('expect:\n  must_contain:\n    - "x"\n').hasContextGit, false)
})

test('extractPromptText 只取 prompt 正文（不含 expect 的断言词）', () => {
  const text = 'input:\n  prompt: |\n    只做分流。\n\n    不要输出空分档。\n\nexpect:\n  must_contain:\n    - "notes/plan.md"\n'
  const r = extractPromptText(text)
  assert.equal(r.ok, true)
  assert.match(r.text, /只做分流/)
  assert.doesNotMatch(r.text, /notes\/plan\.md/)
})

test('extractPromptText 缺 prompt 时报错', () => {
  assert.equal(extractPromptText('id: x\n').ok, false)
})

test('setPathScalar：只换目标行整值并写合法双引号；键路径缺失时报错', () => {
  const text = 'engine:\n  name: claude_code\n  model:\n    provider: {provider}\n    name: "{name}"\n'
  const r = setPathScalar(text, ['engine', 'model', 'provider'], 'DeepSeek')
  assert.equal(r.ok, true)
  assert.match(r.text, /^ {4}provider: "DeepSeek"$/m)
  assert.match(r.text, /^ {4}name: "\{name\}"$/m)      // 其它行原样
  assert.match(r.text, /^ {2}name: claude_code$/m)     // 同名的其它层不误伤
  assert.equal(setPathScalar(text, ['engine', 'model', 'ghost'], 'x').ok, false)
})

test('sha256 对已知输入给已知值', () => {
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.equal(sha256(Buffer.from('abc', 'utf8')), sha256('abc'))
})

test('canonicalJson 键名升序', () => {
  assert.equal(canonicalJson({ b: 1, a: 2 }), '{"a":2,"b":1}')
  assert.equal(canonicalJson({ b: { d: 1, c: 2 }, a: [2, 1] }), '{"a":[2,1],"b":{"c":2,"d":1}}')
})

test('assertHash 覆盖 assert+anchors+arms+delta：同输入稳定，改 assert 或 arms 即变', () => {
  const base = {
    assert: { must_contain: ['a'], must_not_contain: ['b'] },
    anchors: ['x'],
    arms: { with_skill: { min_rate: 1, max_rate: 1 }, without_skill: { min_rate: 0, max_rate: 0 } },
    delta: { min: 1 },
  }
  const h = assertHash(base)
  assert.match(h, /^[0-9a-f]{64}$/)
  assert.equal(h, assertHash({ ...base }))
  assert.notEqual(h, assertHash({ ...base, assert: { must_contain: ['a', 'c'], must_not_contain: ['b'] } }))
  assert.notEqual(h, assertHash({ ...base, arms: { ...base.arms, with_skill: { min_rate: 0.9, max_rate: 1 } } }))
})

test('extractPathValue 逐级下探（含 block list 项上的键、引号剥离）', () => {
  const yaml = 'environment:\n  type: none\nskills:\n  - source: local_path\n    path: ../skills/review-triage\nengine:\n  model:\n    provider: "{provider}"\n'
  assert.equal(extractPathValue(yaml, ['environment', 'type']).value, 'none')
  assert.equal(extractPathValue(yaml, ['skills', 'source']).value, 'local_path')
  assert.equal(extractPathValue(yaml, ['skills', 'path']).value, '../skills/review-triage')
  assert.equal(extractPathValue(yaml, ['engine', 'model', 'provider']).value, '{provider}')
  assert.equal(extractPathValue(yaml, ['benchmark', 'enabled']).ok, false)
  assert.equal(extractPathValue('report:\n  formats:\n    - json\n', ['report', 'formats']).value, '')
})

test('unquoteYamlScalar：双引号 / 单引号 / 无引号三种合法标量都去壳', () => {
  assert.equal(unquoteYamlScalar('"../skills/x"'), '../skills/x')
  assert.equal(unquoteYamlScalar("'../skills/x'"), '../skills/x')
  assert.equal(unquoteYamlScalar('../skills/x'), '../skills/x')
  assert.equal(unquoteYamlScalar("'it''s'"), "it's")
  assert.equal(unquoteYamlScalar('"a\\"b"'), 'a"b')
})

test('extractPathValue：单引号 / 无引号标量不再带引号（⑥-4 误判「路径不存在」回归）', () => {
  for (const raw of ["'../skills/review-triage'", '../skills/review-triage']) {
    const yaml = `skills:\n  - source: local_path\n    path: ${raw}\n`
    assert.equal(extractPathValue(yaml, ['skills', 'path']).value, '../skills/review-triage')
  }
})

test('listSkillsPathScalars：枚举 skills 块内全部 path；缺块 / 空值 / 无 path 各自报错', () => {
  const all = listSkillsPathScalars(
    "skills:\n  - source: local_path\n    path: ../skills/a\n  - source: local_path\n    path: '../skills/b'\nengine:\n  name: claude_code\n",
  )
  assert.equal(all.ok, true, all.error)
  assert.deepEqual(all.items.map((i) => i.value), ['../skills/a', '../skills/b'])
  assert.equal(all.items[1].lineIndex, 4)

  assert.match(listSkillsPathScalars('engine:\n  name: x\n').error, /缺少 skills 块/)
  assert.match(listSkillsPathScalars('skills:\n  - source: local_path\n    path: ""\n').error, /为空/)
  assert.match(listSkillsPathScalars('skills:\n  - source: local_path\n').error, /没有 path/)
})

test('extractBlockLists 末项无尾换行也抽得到（KEYS-6 的末行漏报回归）', () => {
  const text = 'judge:\n  success:\n    - output_contains:\n        all:\n          - "可直接提交"\n          - "越界词"'
  const lists = extractBlockLists(text, 'all')
  assert.equal(lists.length, 1)
  assert.deepEqual(lists[0].items, ['可直接提交', '越界词'])
  assert.equal(lists[0].bad, null)
})

test('extractBlockLists 把不合规行记为 bad', () => {
  const text = '        any:\n          - 未加引号的词\n'
  assert.equal(extractBlockLists(text, 'any')[0].bad, '- 未加引号的词')
})

test('extractPlainBlockList 认无引号块列表、行内数组报错', () => {
  assert.deepEqual(extractPlainBlockList('report:\n  formats:\n    - json\n    - html\n', 'formats').items, ['json', 'html'])
  const r = extractPlainBlockList('report:\n  formats: [json, html]\n', 'formats')
  assert.equal(r.ok, false)
  assert.match(r.error, /行内数组/)
})

test('auditCaseKeys 正例：judge 词全在 expect 内、无禁用键 → 三项皆空', () => {
  const a = auditCaseKeys(YAML_BLOCK + 'judge:\n  success:\n    - output_contains:\n        all:\n          - "可直接提交"\n')
  assert.deepEqual(a.bannedKeys, [])
  assert.equal(a.usesOutputNot, false)
  assert.deepEqual(a.judge, [])
})

test('auditCaseKeys 负例：禁用键 / output_contains.not / 越界词 / 非块列表行都要报', () => {
  const text = 'exit_code: 0\nexpect:\n  must_contain:\n    - "a"\n  must_not_contain:\n    - "b"\n'
    + 'judge:\n  success:\n    output_contains:\n      not:\n        - "b"\n'
  const a = auditCaseKeys(text)
  assert.deepEqual(a.bannedKeys, ['exit_code'])
  assert.equal(a.usesOutputNot, true)
  assert.equal(auditCaseKeys(YAML_BLOCK + 'judge:\n  all:\n    - "越界词"\n').judge[0].undeclaredWords[0], '越界词')
  assert.equal(auditCaseKeys(YAML_BLOCK + 'judge:\n  any:\n    - 未加引号的词\n').judge[0].badLine, '- 未加引号的词')
  // 无违规的字段不入列（only-invalid）
  assert.equal(a.judge.filter((j) => j.field === 'all' && j.badLine === null && j.undeclaredWords.length === 0).length, 0)
})

// ── CLI 级检查项：同构副本（<副本根>/evals/review-triage/ + <副本根>/skills/review-triage/）──
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function editFile(p, fn) {
  writeFileSync(p, fn(readFileSync(p, 'utf8')), 'utf8')
}

function runOnCopy(mutate, extraArgs = []) {
  const root = mkdtempSync(join(tmpdir(), 'a1-check-'))
  cpSync(join(repoRoot, 'scripts'), join(root, 'scripts'), {
    recursive: true,
    filter: (src) => !src.endsWith('.test.mjs'),
  })
  cpSync(join(repoRoot, 'evals', 'review-triage'), join(root, 'evals', 'review-triage'), { recursive: true })
  cpSync(join(repoRoot, 'skills', 'review-triage'), join(root, 'skills', 'review-triage'), { recursive: true })
  try {
    if (mutate) mutate(root)
    const r = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'check-eval-contract.mjs'), 'review-triage', ...extraArgs],
      { encoding: 'utf8' },
    )
    return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const evalYamlOf = (root) => join(root, 'evals', 'review-triage', 'eval.yaml')
const expectedOf = (root) => join(root, 'evals', 'review-triage', 'expected.md')
const caseOf = (root, name) => join(root, 'evals', 'review-triage', 'cases', name)

function expectFail(mutate, id, args) {
  const r = runOnCopy(mutate, args)
  assert.equal(r.status, 4, `期望 exit 4，实际 ${r.status}\n${r.out}`)
  assert.match(r.out, new RegExp(`\\[${id}\\]`), `未报出 ${id}\n${r.out}`)
  assert.match(r.out, /CONTRACT\.json 未写入/)
  return r
}

test('同构副本基线：exit 0、0 findings、无 SKIP、写入快照', () => {
  const r = runOnCopy()
  assert.equal(r.status, 0, r.out)
  assert.match(r.out, /findings=0/)
  assert.doesNotMatch(r.out, /\bSKIP\b/, r.out)
  assert.match(r.out, /CONTRACT\.json 已写入/)
})

test('FIX-3 合并前的一级目录名（eval-fixture）必须报：只认 .session/eval/fixture/', () => {
  expectFail(
    (root) => editFile(caseOf(root, '01-checkbox-mechanical.yaml'), (t) => t.replace('../.session/eval/fixture/', '../.session/eval-fixture/')),
    'FIX-3',
  )
})

test('FIX-3 路径里的 .. 必须报（子串 includes 不再放行穿越）', () => {
  expectFail(
    (root) => editFile(caseOf(root, '01-checkbox-mechanical.yaml'), (t) => t.replace('../.session/eval/fixture/', '../.session/eval/fixture/../fixture/')),
    'FIX-3',
  )
})

test('FIX-3 只写到技能名一层（缺 <仓库名>）必须报', () => {
  expectFail(
    (root) => editFile(caseOf(root, '01-checkbox-mechanical.yaml'), (t) => t.replace('../.session/eval/fixture/review-triage/checkbox-demo', '../.session/eval/fixture/checkbox-demo')),
    'FIX-3',
  )
})

test('YAML-2 schema_version 必须 v1alpha1', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('schema_version: v1alpha1', 'schema_version: v2')), 'YAML-2')
})

test('YAML-3 environment.type 必须 none', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('  type: none', '  type: docker')), 'YAML-3')
})

test('YAML-4 engine.name 必须 claude_code', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('  name: claude_code', '  name: other')), 'YAML-4')
})

test('YAML-5 engine.model 必须是占位模板（不得写死模型名）', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('provider: "{provider}"', 'provider: "openai"')), 'YAML-5')
})

test('YAML-6 skills[].source 必须 local_path', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('- source: local_path', '- source: registry')), 'YAML-6')
})

test('YAML-7 skills[].path 必须 ../skills/<技能名>', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('path: ../skills/review-triage', 'path: evals/review-triage')), 'YAML-7')
})

test('YAML-8 cases.defaults.timeout_seconds 必须 240', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('timeout_seconds: 240', 'timeout_seconds: 5')), 'YAML-8')
})

test('YAML-9 cases.defaults.max_turns 必须 8', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('max_turns: 8', 'max_turns: 1')), 'YAML-9')
})

test('YAML-10 benchmark.enabled 必须 true', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('enabled: true', 'enabled: false')), 'YAML-10')
})

test('YAML-11 report.formats 行内数组报错', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('  formats:\n    - json\n    - html\n', '  formats: [json, html]\n')), 'YAML-11')
})

test('YAML-11 report.formats 必须有序 [json, html]', () => {
  expectFail((root) => editFile(evalYamlOf(root), (t) => t.replace('    - json\n    - html\n', '    - html\n    - json\n')), 'YAML-11')
})

test('CASE-4 id 必须与文件名（去扩展名）逐字相同', () => {
  expectFail((root) => editFile(caseOf(root, '02-command-swap-semantic.yaml'), (t) => t.replace('id: 02-command-swap-semantic', 'id: 99-renamed')), 'CASE-4')
})

test('EXP-14 只改 yaml expect（加词）必须报', () => {
  expectFail((root) => editFile(caseOf(root, '01-checkbox-mechanical.yaml'), (t) => t.replace('    - "notes/plan.md"\n  must_not_contain:', '    - "notes/plan.md"\n    - "实跑"\n  must_not_contain:')), 'EXP-14')
})

test('EXP-14 只改机读块 assert（加词）必须报', () => {
  expectFail((root) => editFile(expectedOf(root), (t) => t.replace('"可直接提交", "git diff", "notes/plan.md"', '"可直接提交", "git diff", "notes/plan.md", "实跑"')), 'EXP-14')
})

test('EXP-14 有序：调换顺序即不等（集合相等不算过）', () => {
  expectFail((root) => editFile(expectedOf(root), (t) => t.replace('"可直接提交", "git diff", "notes/plan.md"', '"git diff", "可直接提交", "notes/plan.md"')), 'EXP-14')
})

test('EXP-15 iteration_min 必须 ≥2（1 与缺失都报）', () => {
  expectFail((root) => editFile(expectedOf(root), (t) => t.replace('"iteration_min": 2', '"iteration_min": 1')), 'EXP-15')
  expectFail((root) => editFile(expectedOf(root), (t) => t.replace('  "iteration_min": 2,\n', '')), 'EXP-15')
})

test('KEYS-6 末项无尾换行时越界词也要报（旧正则漏报回归）', () => {
  expectFail((root) => editFile(caseOf(root, '02-command-swap-semantic.yaml'), (t) => `${t.replace(/\s+$/, '')}\n  any:\n    - "越界词"`), 'KEYS-6')
})

test('ORACLE-1 按机读块 c.oracle 判存在（anchors=[] 的用例也要拦）', () => {
  expectFail((root) => editFile(expectedOf(root), (t) => t.replace(
    'review-triage/fixtures/oracle/02-command-swap-semantic.md',
    'review-triage/fixtures/oracle/does-not-exist.md',
  )), 'ORACLE-1')
})

test('--deep 被接受：exit 0 且输出注明本轮无意义', () => {
  const r = runOnCopy(null, ['--deep'])
  assert.equal(r.status, 0, r.out)
  assert.match(r.out, /NOTE --deep 本轮无意义/)
})

// ── LEDGER-1：frozen 账本的 assert_hash 复算（spec §3.2.2③）──────────────────
// 仅在临时副本里把 02（gate）改成 frozen 并造一份自洽 ledger；仓库里的
// expected.md / frozen-ledger.json 一个字节都不动
const GATE_NAME = '执行动作替换应判为必须 review'

function freezeCase(root, ledgerEdit) {
  editFile(expectedOf(root), (t) => t.replace(
    /"origin": "calibrated",(\r?\n)(\s*)"oracle": "review-triage\/fixtures\/oracle\/02-command-swap-semantic\.md"/,
    '"origin": "frozen",$1$2"frozen_since": "2026-10-01",$1$2"oracle": "review-triage/fixtures/oracle/02-command-swap-semantic.md"',
  ))
  const block = extractMachineBlock(readFileSync(expectedOf(root), 'utf8')).block
  const c = block.cases.find((x) => x.eval_name === GATE_NAME)
  const ledger = {
    [GATE_NAME]: {
      frozen_since: '2026-10-01',
      verified_at: 'fixtures/calibration/02-command-swap-semantic.json',
      arms_snapshot: c.arms,
      delta_at_verify: c.delta,
      assert_hash: assertHash({ assert: c.assert, anchors: c.anchors, arms: c.arms, delta: c.delta }),
      verified_snapshot: {},
    },
  }
  if (ledgerEdit) ledgerEdit(ledger)
  writeFileSync(join(root, 'evals', 'review-triage', 'frozen-ledger.json'), JSON.stringify(ledger, null, 2) + '\n', 'utf8')
  return c
}

test('LEDGER-1 正例：frozen + 自洽 ledger 的 assert_hash → exit 0、不误报', () => {
  const r = runOnCopy((root) => { freezeCase(root) })
  assert.equal(r.status, 0, r.out)
  assert.match(r.out, /findings=0/)
  assert.doesNotMatch(r.out, /\[LEDGER-1\]/)
})

test('LEDGER-1 篡改 ledger 的 assert_hash → FAIL（复算不一致）', () => {
  expectFail((root) => { freezeCase(root, (l) => { l[GATE_NAME].assert_hash = '0'.repeat(64) }) }, 'LEDGER-1')
})

test('EXP-10 正例：with_skill 只写 min_rate → PASS（与 runner ⑧ 同口径，spec §3.2.2 示例）', () => {
  const r = runOnCopy((root) => editFile(expectedOf(root), (t) => t.replace(
    '"with_skill": { "min_rate": 1.0, "max_rate": 1.0 }',
    '"with_skill": { "min_rate": 1.0 }',
  )))
  assert.equal(r.status, 0, r.out)
  assert.match(r.out, /findings=0/)
})

test('EXP-10 负例：min_rate / max_rate 两侧都不写 → FAIL', () => {
  expectFail((root) => editFile(expectedOf(root), (t) => t.replace(
    '"with_skill": { "min_rate": 1.0, "max_rate": 1.0 }',
    '"with_skill": {}',
  )), 'EXP-10')
})

test('EXP-11：with_skill 只写 max_rate（缺 min_rate）→ FAIL（与 runner ⑧ 同判，不得只靠 EXP-10 放行）', () => {
  expectFail((root) => editFile(expectedOf(root), (t) => t.replace(
    '"with_skill": { "min_rate": 1.0, "max_rate": 1.0 }',
    '"with_skill": { "max_rate": 1.0 }',
  )), 'EXP-11')
})

// ── REC-0 / REC-6 / REC-7：取证记录（RECORD.md）不得缺失、不得错贴哈希、不得删行通关 ──
const recordOf = (root) => join(root, 'evals', 'review-triage', 'fixtures', 'RECORD.md')

test('REC-0：fixtures/RECORD.md 缺失 → FAIL（不再是 SKIP、不得 exit 0）', () => {
  const r = expectFail((root) => { rmSync(recordOf(root), { force: true }) }, 'REC-0')
  assert.doesNotMatch(r.out, /\bSKIP\b/, r.out)
})

test('REC-6：反向证据的 assert_hash 错贴成非该用例的哈希 → FAIL（逐条复算）', () => {
  expectFail((root) => editFile(recordOf(root), (t) => t.replace(
    'assert_hash `64a8bec1a2b03347a32328ea2dd87399a0bccf3112deca275e25be5fed839a1d`',
    `assert_hash \`${'b'.repeat(64)}\``,
  )), 'REC-6')
})

test('REC-7：删掉某禁词的全部留痕，样本里该词仍真实出现 → FAIL（补删行即通关的洞）', () => {
  expectFail((root) => editFile(recordOf(root), (t) => t
    .split('\n').filter((l) => !l.includes('命中「不影响代码」')).join('\n')), 'REC-7')
})
