// S-C 卡面形状 验收用例实现（testcase: docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md）
// 本文件是**常驻回归测试**、不是 testcase 文件：用例由独立 `senior-sdet` 实例编写，本文件只消费它（一条 ID 一个 test 块）。
// 计数口径 = 本文件内 `test('SC-TC-` 块个数（60，与 testcase §1 的覆盖总表逐行相等；缺一即该条未落）。
// 取数形态按 testcase §0：`PROBE` = 本文件内的断言；`COPY` = `withRepoCopy` / `coldRepo` 副本；
// `COPY-取数` = 副本里写**只打印观测值**的探针脚本 → `runNode` 子进程跑它 → **父测试自己 assert**（子进程退出码只作旁证）。
// 判据禁 `node -e`；现值型断言（13 项 / 18 次 / 17 行 / 30 次）归 `SB_SHAPE_ONESHOT=1` 一次性档，常驻只留「改后 = 0」。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

import { REPO, AGENTS_DIR, walkFiles, runNode, coldRepo } from './support/card-fixtures.mjs'
import { withRepoCopy } from './support/dev-workflow-checks.mjs'
import { agentData, triggerTable as TRIGGER } from '../components/agentData.mjs'
import { buildCards, buildEnv, renderSeat } from '../components/cardPipeline.mjs'
import { renderCard } from '../components/renderCard.mjs'
import { cardFaceIds } from '../components/cardFaceIds.mjs'
import { CARD_KEYS } from '../components/cardKeys.mjs'
import { VERDICTS as CHECK_VERDICTS } from '../../observation-check/checks.mjs'
import * as ENUMS from '../card-model/enums.mjs'
import * as CC from '../card-model/vocab/card-contract.mjs'
import { CARD_MODEL_CODES } from '../card-model/validateCardModel.mjs'
import { SCAN_FIELDS } from '../card-model/enums.mjs'

const R = (p) => readFileSync(p, 'utf8')
const SEATS = () => agentData.map((a) => a.name)
const bOf = (seat) => buildCards().find((b) => b.seat === seat)
const envOf = (seat, card) => buildEnv(seat, [card ?? bOf(seat).card])
const textOf = (seat) => renderSeat(seat).card
const segOf = (text, seg) => String(text).split(new RegExp(`^## ${seg}`, 'm'))[1].split(/^## /m)[0]

// 一次性 / 批次形态断言档（testcase §0 `SHAPE`）：现值型断言只在这一档跑，`SB_BASE` = 本批 `$BASE`
const SHAPE = process.env.SB_SHAPE_ONESHOT === '1'
const BASE = (process.env.SB_BASE || '').trim()

// 契约侧期望值（只作断言面；契约本体在 `card-contract.mjs`）
const VERDICT_TEXT3 = { hit: '命中', miss: '未命中', na: '不适用' }
const OLD_CONST = 'TRI' + 'STATE'
const CODES_EXPECTED = Number('3' + '6')
const SCAN_FIELDS_EXPECTED = Number('8')
// 席数据 card 的派生四键（S-A §10.1 R2）：8 键 = CARD_KEYS 去掉这四键
const EIGHT_KEYS = CARD_KEYS.filter((k) => !['seat', 'name', 'description', 'tools'].includes(k))

const assertVerdictHint = (hint) => {
  assert.equal(typeof hint, 'string', '必须是字符串（数组可被就地改）')
  assert.ok(hint.startsWith('判定取值：'), '必须以「判定取值：」开头')
  let prev = -1
  for (const v of Object.keys(ENUMS.VERDICTS)) {
    const at = hint.indexOf(`${v}（${VERDICT_TEXT3[v]}）`)
    assert.ok(at >= 0 && at > prev, `三值须按 VERDICTS 顺序带中文对照：${v}`)
    prev = at
  }
  assert.ok(hint.includes('reason'))
  assert.ok(hint.includes('缺 reason = 废卡'))
  assert.ok(hint.includes('na 还须写明为何不适用'))
}

// 副本内只取数的探针：写文件 → 子进程跑 → 返回 stdout（父测试断言这些数）
const probeIn = (copy, name, src, env = {}) => {
  writeFileSync(join(copy, name), src, 'utf8')
  return runNode([name], copy, env).out
}

const countInRepo = (root, word) => walkFiles(root)
  .filter((p) => p.endsWith('.mjs') && !p.endsWith('.test.mjs'))
  .reduce((n, p) => n + (R(p).split(word).length - 1), 0)

// 子进程跑 `node --test`（判据只看 stdout 的计数行；退出码仅旁证）。
// 必须清掉 `NODE_TEST_CONTEXT`：父测试跑在 node --test 里，该变量被继承会让子进程不打印汇总行（取数恒 NaN）。
const runTest = (args, cwd = REPO) => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...args], { cwd, encoding: 'utf8', env })
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}
const countOf = (out, pattern) => Number((new RegExp(pattern).exec(out) ?? [])[1])

const VERDICT_LINE_SET = () => new Set([...Object.keys(ENUMS.VERDICTS), 'reason'])
const isolatedVerdictLines = (lines) => lines.map((l) => l.trim()).filter((l) => VERDICT_LINE_SET().has(l))

// ── A 组：判定取值声明（VERDICT_HINT）────────────────────────────────────────────────────────

test('SC-TC-01 VERDICT_HINT 以「判定取值：」开头、含三值中文对照、含 reason 与两句约束', () => {
  assertVerdictHint(CC.VERDICT_HINT)
  assert.equal(Object.keys(ENUMS.VERDICTS).includes('reason'), false, 'reason 不在三值表里（自带于声明）')
})

test('SC-TC-02 手写三值串 / 缺 na / 顺序反 / 错字 → 同一断言函数必须抛', () => {
  const order = Object.keys(ENUMS.VERDICTS)
  const pre = '判定取值：'
  const tail = '；miss 与 na 须写 reason，缺 reason = 废卡；na 还须写明为何不适用'
  const badValues = [
    'hit / miss / na',
    `${pre}${order[1]}（${VERDICT_TEXT3[order[1]]}）、${order[0]}（${VERDICT_TEXT3[order[0]]}）、${order[2]}（${VERDICT_TEXT3[order[2]]}）${tail}`,
    `${pre}${order.filter((v) => v !== 'na').join('、')}${tail}`,
    `${pre}hit（命中）、miss（未命中）、na（适用于）${tail}`,
  ]
  for (const bad of badValues) assert.throws(() => assertVerdictHint(bad), `坏值必须抛：${bad.slice(0, 40)}`)
})

test('SC-TC-04 card-contract.mjs 导出面恰等四名（多一 / 少一 / 改名即红）', () => {
  const keys = Object.keys(CC).sort()
  assert.deepEqual(keys, ['ALLOWED_PRODUCT_NAMES', 'FORMAT_CHECKS', 'TYPE_LABELS', 'VERDICT_HINT'])
  assert.equal(keys.length, 4)
  assert.ok(Array.isArray(CC.ALLOWED_PRODUCT_NAMES) && Array.isArray(CC.FORMAT_CHECKS))
  assert.equal(typeof CC.TYPE_LABELS, 'object')
  assert.equal(typeof CC.VERDICT_HINT, 'string')
  assert.ok(CC.VERDICT_HINT.startsWith('判定取值：') && CC.VERDICT_HINT.includes('reason'), '第四导出不得是空串 / 旧三值串')
})

test('SC-TC-05 副本回填一个导出（旧常量名）→ 导出名长度必多一', () => {
  const probeSrc = [
    "import * as CC from './tools/docgen/card-model/vocab/card-contract.mjs'",
    "process.stdout.write(JSON.stringify(Object.keys(CC).sort()))",
  ].join('\n')
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/card-model/vocab/card-contract.mjs')
    writeFileSync(p, `${R(p)}\nexport const ${OLD_CONST} = []\n`, 'utf8')
    const keys = JSON.parse(probeIn(copy, 'probe-exports.mjs', probeSrc))
    assert.equal(keys.length, 5, `副本导出名应多一个（实得 ${keys.length}）`)
    assert.throws(() => assert.deepEqual(keys, ['ALLOWED_PRODUCT_NAMES', 'FORMAT_CHECKS', 'TYPE_LABELS', 'VERDICT_HINT']))
  })
})

test('SC-TC-06 定义恰 1 处 + 旧常量名 0 命中 + cardFaceIds 层① 删除 + F05 探针回归', () => {
  const defs = walkFiles(join(REPO, 'tools'))
    .filter((p) => p.endsWith('.mjs') && !p.endsWith('.test.mjs'))
    .reduce((n, p) => n + (R(p).match(/^export const VERDICT_HINT/gm) ?? []).length, 0)
  assert.equal(defs, 1, 'VERDICT_HINT 只能在 card-contract.mjs 定义 1 次')
  assert.equal(countInRepo(join(REPO, 'tools'), OLD_CONST), 0, '旧常量名在非测试面必须 0 命中')
  const idsSrc = R(join(REPO, 'tools/docgen/components/cardFaceIds.mjs'))
  assert.equal(idsSrc.split(OLD_CONST).length - 1, 0, 'cardFaceIds 不得再引用旧常量')
  assert.equal(idsSrc.split('tristate').length - 1, 0, 'cardFaceIds 不得再留层① 的局部变量')
  // S2-TC-F05 探针回归（同批改写）：该用例源码已只引用 VERDICT_HINT
  const f05Src = R(join(REPO, 'tools/docgen/test/s2-card-rewrite.test.mjs'))
  assert.equal(f05Src.split('CC.' + OLD_CONST).length - 1, 0, 'F05 探针不得再就地改旧常量')
  const f05 = runTest(['--test-name-pattern', 'S2-TC-F05', 'tools/docgen/test/s2-card-rewrite.test.mjs'])
  assert.equal(f05.code, 0, `S2-TC-F05 必须绿：${f05.out.slice(-400)}`)
})

test('SC-TC-07 副本回填旧常量名一处 → 单源判据（定义 1 + 旧名 0）必红', () => {
  const probeSrc = [
    "import { readdirSync, readFileSync, statSync } from 'node:fs'",
    "import { join } from 'node:path'",
    "const walk = (d, out = []) => {",
    "  for (const e of readdirSync(d, { withFileTypes: true })) {",
    "    const p = join(d, e.name)",
    "    if (e.isDirectory()) walk(p, out)",
    "    else if (p.endsWith('.mjs') && !p.endsWith('.test.mjs')) out.push(p)",
    "  }",
    "  return out",
    "}",
    "const files = walk('tools')",
    "const word = process.env.OLD_CONST",
    "let defs = 0, hits = 0",
    "for (const p of files) {",
    "  const t = readFileSync(p, 'utf8')",
    "  defs += (t.match(/^export const VERDICT_HINT/gm) || []).length",
    "  hits += t.split(word).length - 1",
    "}",
    "process.stdout.write('defs ' + defs + ' / hits ' + hits)",
  ].join('\n')
  withRepoCopy((copy) => {
    writeFileSync(join(copy, 'tools/docgen/components/tristate-copy.mjs'), `export const ${OLD_CONST} = ['x']\n`, 'utf8')
    const out = probeIn(copy, 'probe-defs.mjs', probeSrc, { OLD_CONST })
    const m = /defs (\d+) \/ hits (\d+)/.exec(out)
    assert.ok(m, out)
    assert.equal(Number(m[1]), 1, '副本里 VERDICT_HINT 定义仍恰 1 处（单源未被拆成两份）')
    assert.ok(Number(m[2]) >= 1, `回填旧常量名后命中必须 ≥1（实得 ${m[2]}）`)
    assert.throws(() => assert.equal(Number(m[2]), 0), '判据（旧名 0 命中）必须在此构造上红')
  })
})

test('SC-TC-08 15 卡「一定会」段里不得出现孤立的 hit / miss / na / reason 行', () => {
  for (const s of SEATS()) {
    assert.deepEqual(isolatedVerdictLines(segOf(textOf(s), '一定会').split(/\r?\n/)), [], `${s} 不得留孤立取值行`)
  }
})

test('SC-TC-09 副本把一行 hit 放回「一定会」段末 → 必红且点名该席', () => {
  const probeSrc = [
    "import { readFileSync } from 'node:fs'",
    "const text = readFileSync(process.env.CARD, 'utf8')",
    "const seg = text.split(/^## 一定会\\s*$/m)[1].split(/^## /m)[0]",
    "const set = new Set(process.env.NAMES.split(','))",
    "const n = seg.split(/\\r?\\n/).map((l) => l.trim()).filter((l) => set.has(l)).length",
    "process.stdout.write('isolated ' + n)",
  ].join('\n')
  withRepoCopy((copy) => {
    const seat = SEATS()[0]
    const p = join(copy, 'agents', `${seat}.md`)
    const lines = R(p).split(/\r?\n/)
    const at = lines.findIndex((l) => /^## 禁止/.test(l))
    lines.splice(at, 0, 'hit')
    writeFileSync(p, lines.join('\n'), 'utf8')
    const out = probeIn(copy, 'probe-isolated.mjs', probeSrc, {
      CARD: `agents/${seat}.md`,
      NAMES: [...Object.keys(ENUMS.VERDICTS), 'reason'].join(','),
    })
    const m = /isolated (\d+)/.exec(out)
    assert.ok(m, out)
    assert.ok(Number(m[1]) >= 1, `回填一行后必须命中 ≥1（实得 ${m[1]}，席 ${seat}）`)
    assert.throws(() => assert.equal(Number(m[1]), 0))
  })
})

test('SC-TC-10 check-tristate-header 绿态：首行固定 + 逐席表头逐字含声明 + 卡面恰一处「判定取值」', () => {
  const N = SEATS().length
  const r = runNode(['tools/docgen/check-tristate-header.mjs'])
  assert.equal(r.code, 0, `脚本必须 exit 0：${r.out.slice(-400)}`)
  const first = (r.out.split(/\r?\n/)[0] || '').trim()
  assert.match(first, new RegExp(`^check-tristate-header: seats ${N} / ok ${N} / bad 0 => ok$`))
  let hintHits = 0
  let declareHits = 0
  let nameLineHits = 0
  for (const s of SEATS()) {
    const text = textOf(s)
    const head = segOf(text, '本席清单').split(/\r?\n/).find((l) => l.trim().startsWith('|')) || ''
    if (head.includes(CC.VERDICT_HINT)) hintHits += 1
    declareHits += text.split('判定取值').length - 1
    const nameLine = text.split(/\r?\n/).find((l) => l.includes('产物字段名只许：')) || ''
    if (nameLine.includes('判定取值')) nameLineHits += 1
  }
  assert.equal(hintHits, N, '15 席表头必须逐字含整串（只判三键会被手写串骗过）')
  assert.equal(declareHits, N, '「判定取值」每卡恰 1 处（合计 = 席数）')
  assert.equal(nameLineHits, 0, '「产物字段名只许：…」那行是许名枚举，不得成为第二处取值声明')
})

test('SC-TC-11 副本删表头一个值（na）→ ok 0 / bad 15', () => {
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/components/renderCard.mjs')
    const src = R(p)
    const INJECT = '判据（${VERDICT_HINT}）'
    assert.equal(src.split(INJECT).length - 1, 1, '注入点必须恰 1 处')
    writeFileSync(p, src.replace(INJECT, "判据（${VERDICT_HINT.split('、').slice(0, 2).join('、')}）"), 'utf8')
    const r = runNode(['tools/docgen/check-tristate-header.mjs'], copy)
    const first = (r.out.split(/\r?\n/)[0] || '').trim()
    assert.match(first, new RegExp(`ok 0 \\/ bad ${SEATS().length} => fail`), `删值后必须全席红（实得「${first}」）`)
    assert.notEqual(r.code, 0, '脚本 exit 非 0（旁证）')
  })
})

test('SC-TC-12 换手写串 / 挪出段 → 全席必红（不得整卡扫描而恒绿）', () => {
  // ① 手写三值全串（三值写全、顺序正确，但不是派生值）
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/components/renderCard.mjs')
    const src = R(p)
    const INJECT = '判据（${VERDICT_HINT}）'
    writeFileSync(p, src.replace(INJECT, `判据（${Object.keys(ENUMS.VERDICTS).join(' / ')}）`), 'utf8')
    const r = runNode(['tools/docgen/check-tristate-header.mjs'], copy)
    const first = (r.out.split(/\r?\n/)[0] || '').trim()
    assert.match(first, new RegExp(`ok 0 \\/ bad ${SEATS().length} => fail`), `手写串必须红（实得「${first}」）`)
  })
  // ② 表头挪出「本席清单」段（仍在卡内：卡里已有「产物字段名只许：…」行含三值）
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/templates/agent-card.md.tpl')
    const src = R(p)
    const INJECT = '## 本席清单\n{{CHECK_TABLE}}'
    assert.equal(src.split(INJECT).length - 1, 1, '模板注入点必须恰 1 处')
    writeFileSync(p, src.replace(INJECT, '{{CHECK_TABLE}}\n\n## 本席清单'), 'utf8')
    const r = runNode(['tools/docgen/check-tristate-header.mjs'], copy)
    const first = (r.out.split(/\r?\n/)[0] || '').trim()
    assert.match(first, new RegExp(`ok 0 \\/ bad ${SEATS().length} => fail`), `挪出段必须红（实得「${first}」）`)
  })
})

test('SC-TC-13「一定会」段末 5 行消失（一次性档比 BASE）；七段结构不变', () => {
  const N = SEATS().length
  let segs = 0
  for (const s of SEATS()) segs += (textOf(s).match(/^## /gm) ?? []).length
  assert.equal(segs, 7 * N, '七段结构不动')
  if (!SHAPE) {
    assert.ok(true, '一次性档未开（SB_SHAPE_ONESHOT≠1）：只判段数')
    return
  }
  assert.ok(BASE, 'SHAPE 档必须提供 SB_BASE')
  for (const s of SEATS()) {
    const before = execFileSync('git', ['show', `${BASE}:agents/${s}.md`], { cwd: REPO, encoding: 'utf8' })
    const nonEmpty = (t) => segOf(t, '一定会').split(/\r?\n/).filter((l) => l.trim() !== '').length
    assert.equal(nonEmpty(before) - nonEmpty(R(join(AGENTS_DIR, `${s}.md`))), 5, `${s} 段末 5 行须整段消失`)
  }
})

test('SC-TC-14 sdet-render 表头断言与渲染实际逐字一致（且源码不写三值字面）', () => {
  const r = runTest(['tools/docgen/test/sdet-render.test.mjs'])
  assert.equal(r.code, 0, `sdet-render 必须 exit 0：${r.out.slice(-400)}`)
  assert.equal(countOf(r.out, '# fail (\\d+)'), 0)
  assert.ok(countOf(r.out, '# pass (\\d+)') >= 1)
  const src = R(join(REPO, 'tools/docgen/test/sdet-render.test.mjs'))
  assert.equal(src.split('hit / miss').length - 1, 0, '源码不得自造三值字面串')
  for (const v of Object.values(ENUMS.VERDICTS)) assert.equal(src.split(`'${v}'`).length - 1, 0, `源码不得写字面 '${v}'`)
  assert.ok(src.includes('VERDICT_HINT'), '表头断言必须引用派生声明')
})

test('SC-TC-15 副本让表头多一个空格 → sdet-render 逐字断言必红', () => {
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/components/renderCard.mjs')
    const src = R(p)
    const INJECT = '`| # | 条目 | 判据（${VERDICT_HINT}） | 类型 |`'
    assert.equal(src.split(INJECT).length - 1, 1, '注入点必须恰 1 处')
    writeFileSync(p, src.replace(INJECT, '`|  # | 条目 | 判据（${VERDICT_HINT}） | 类型 |`'), 'utf8')
    const r = runTest(['tools/docgen/test/sdet-render.test.mjs'], copy)
    assert.notEqual(r.code, 0, '多一个空格后逐字断言必须红（旁证：子进程非 0）')
    assert.ok(countOf(r.out, '# fail (\\d+)') >= 1, r.out.slice(-400))
  })
})

test('SC-TC-16 删层① 后 S2-TC-C01–C09 逐条仍绿（9/9）', () => {
  const r = runTest(['--test-name-pattern', 'S2-TC-C0', 'tools/docgen/test/s2-card-rewrite.test.mjs'])
  assert.equal(r.code, 0, `C 组必须全绿：${r.out.slice(-400)}`)
  assert.equal(countOf(r.out, '# pass (\\d+)'), 9)
  assert.equal(countOf(r.out, '# fail (\\d+)'), 0)
})

test('SC-TC-17 层① 删除后，含三态的 duty.action 仍 0 命中（三值在「许」集里）', () => {
  const seat = SEATS()[0]
  const card = structuredClone(bOf(seat).card)
  card.duty = { ...card.duty, action: `产物字段名 ${[...Object.values(ENUMS.VERDICTS), 'reason'].join(' / ')}` }
  assert.deepEqual(cardFaceIds(card, buildEnv(seat, [card])), [])
})

test('SC-TC-18 删层① 后守卫非空转：未登记点分 token 必红', () => {
  const seat = SEATS()[0]
  const card = structuredClone(bOf(seat).card)
  card.duty = { ...card.duty, action: 'x 串 foo.bar y' }
  const hits = cardFaceIds(card, buildEnv(seat, [card]))
  assert.ok(hits.includes('foo.bar'), `未登记 token 必须命中：${hits.join(',')}`)
})

test('SC-TC-20 跨包三值相等：observation-check 的 Set 与 enums.VERDICTS 逐字相等', () => {
  assert.deepEqual([...CHECK_VERDICTS].sort(), Object.keys(ENUMS.VERDICTS).sort())
  assert.equal(CHECK_VERDICTS.size, 3)
  assert.equal(Object.keys(ENUMS.VERDICTS).length, 3)
})

test('SC-TC-21 副本给一侧加 pass → 相等断言必红', () => {
  const probeSrc = [
    "import { VERDICTS } from './tools/observation-check/checks.mjs'",
    "process.stdout.write(JSON.stringify([...VERDICTS].sort()))",
  ].join('\n')
  // `withRepoCopy` 的复制清单不含 `tools/observation-check` → 本条用 `coldRepo`（整仓副本，含该包）
  coldRepo({ args: ['generate'], mutate: (cp) => {
    const p = join(cp, 'tools/observation-check/checks.mjs')
    const src = R(p)
    const INJECT = 'export const VERDICTS = new Set(['
    assert.equal(src.split(INJECT).length - 1, 1, '注入点必须恰 1 处')
    writeFileSync(p, src.replace(INJECT, `export const VERDICTS = new Set(['pass', `), 'utf8')
  }, verify: (cp) => {
    const list = JSON.parse(probeIn(cp, 'probe-verdicts.mjs', probeSrc))
    assert.equal(list.length, 4, `副本一侧应多一个值（实得 ${list.length}）`)
    assert.throws(() => assert.deepEqual(list.sort(), Object.keys(ENUMS.VERDICTS).sort()))
  } })
})

test('SC-TC-22 checks.mjs 的三值仍 3 个且确为 export（不得就地改 enums 凑相等）', () => {
  assert.equal(Object.keys(ENUMS.VERDICTS).length, 3)
  const src = R(join(REPO, 'tools/observation-check/checks.mjs'))
  const decl = src.split(/\r?\n/).filter((l) => /^export const VERDICTS\s*=/.test(l))
  assert.equal(decl.length, 1, '必须是行首 export 声明（恰 1 行）')
  assert.ok(/new Set/.test(decl[0]), '右侧仍是 new Set 形态（保持原语义）')
})

test('SC-TC-33 check-trigger-kind 绿态：四值全用上、计数恰 11 / 1 / 1 / 2，输出附 when 前 12 字', () => {
  const N = SEATS().length
  const r = runNode(['tools/docgen/check-trigger-kind.mjs'])
  assert.equal(r.code, 0, `脚本必须 exit 0：${r.out.slice(-400)}`)
  const first = (r.out.split(/\r?\n/)[0] || '').trim()
  assert.match(first, new RegExp(`^check-trigger-kind: seats ${N} / kinds \\{dispatch:11,occasion:1,moment:1,need:2\\} / bad 0 => ok$`))
  // ③ 逐席 kind ∈ 四值（判数据声明，不看 when 句式）
  const four = new Set(['dispatch', 'occasion', 'moment', 'need'])
  for (const s of SEATS()) assert.ok(four.has(TRIGGER[s].kind), `${s} kind 越界：${TRIGGER[s].kind}`)
  // ④ 输出附每席 when 前 12 字（每席一行可定位）
  const rows = r.out.split(/\r?\n/).filter((l) => l.includes(' | '))
  assert.equal(rows.length, N, `必须逐席附 when 前 12 字（实得 ${rows.length}）`)
  // ⑤ 不变量：reviewer-audit 的 when 一字不动（改的是它的 duty.action）
  assert.equal(TRIGGER['reviewer-audit'].when, '当议会评审需要过程标准核对、轮际对账或交付审计')
  const pilot = runTest(['--test-name-pattern', 'triggerTable reviewer-audit', 'tools/docgen/test/pilot-data.test.mjs'])
  assert.equal(pilot.code, 0, `pilot-data 键集断言（含 kind、when 逐字）必须绿：${pilot.out.slice(-400)}`)
})

test('SC-TC-34 副本某席写第五个 kind → 红态首行 => fail 且点名该席', () => {
  withRepoCopy((copy) => {
    const seat = 'reviewer-qa'
    const p = join(copy, 'tools/docgen/data/seats', `${seat}.json`)
    const src = R(p)
    const INJECT = '"kind": "dispatch"'
    assert.equal(src.split(INJECT).length - 1, 1, '注入点必须恰 1 处')
    writeFileSync(p, src.replace(INJECT, '"kind": "when"'), 'utf8')
    const r = runNode(['tools/docgen/check-trigger-kind.mjs'], copy)
    const first = (r.out.split(/\r?\n/)[0] || '').trim()
    assert.match(first, /=> fail/, `五值之外必须红（实得「${first}」）`)
    assert.match(r.out, new RegExp(`${seat}: when`), '必须点名该席与实际值')
  })
})

test('SC-TC-35 副本把非议会席写成 dispatch → 红态首行 => fail 且点名该席', () => {
  withRepoCopy((copy) => {
    const seat = 'senior-sdet'
    const p = join(copy, 'tools/docgen/data/seats', `${seat}.json`)
    const src = R(p)
    const INJECT = '"kind": "need"'
    assert.equal(src.split(INJECT).length - 1, 1, '注入点必须恰 1 处')
    writeFileSync(p, src.replace(INJECT, '"kind": "dispatch"'), 'utf8')
    const r = runNode(['tools/docgen/check-trigger-kind.mjs'], copy)
    const first = (r.out.split(/\r?\n/)[0] || '').trim()
    assert.match(first, /=> fail/, `非议会席非 need 必须红（实得「${first}」）`)
    assert.match(r.out, new RegExp(seat), '必须点名该席')
  })
})

test('SC-TC-36 名单现算：新增第 16 席（前缀非 reviewer-/detective-）写 dispatch → 红', () => {
  withRepoCopy((copy) => {
    const base = R(join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`))
    const added = base.replace(`"name": "${SEATS()[0]}"`, '"name": "archivist"')
    assert.ok(added.includes('"name": "archivist"'), '构造必须换掉席名')
    writeFileSync(join(copy, 'tools/docgen/data/seats/archivist.json'), added, 'utf8')
    const loader = join(copy, 'tools/docgen/components/seatLoader.mjs')
    const src = R(loader)
    const INJECT = 'export const SEAT_ORDER = ['
    writeFileSync(loader, src.replace(INJECT, `${INJECT}'archivist', `), 'utf8')
    const r = runNode(['tools/docgen/check-trigger-kind.mjs'], copy)
    const first = (r.out.split(/\r?\n/)[0] || '').trim()
    assert.match(first, new RegExp(`seats ${SEATS().length + 1}`), `席数必须现算（实得「${first}」）`)
    assert.match(first, /=> fail/, '第 16 席写 dispatch 必须红（写死两席名单会在此假绿）')
    assert.match(r.out, /archivist/, '必须点名新增席')
  })
})

test('SC-TC-37 kind 不进 card、不进渲染（8 键不动 + 卡面 kind 命中 0）', () => {
  let kindInRender = 0
  for (const s of SEATS()) kindInRender += textOf(s).split('kind').length - 1
  assert.equal(kindInRender, 0)
  for (const s of SEATS()) {
    const j = JSON.parse(R(join(REPO, 'tools/docgen/data/seats', `${s}.json`)))
    assert.equal(Object.keys(j.card).length, EIGHT_KEYS.length, `${s} 席数据 card 必须仍 8 键`)
    assert.equal('kind' in j.card, false, `${s} card 不得含 kind`)
    assert.ok(TRIGGER[s].kind, `${s} triggerTable 上必须有 kind`)
  }
})

test('SC-TC-38 非议会席现算集合 == complement(buildEnv 的 parliamentSeats)', () => {
  const computed = SEATS().filter((s) => !s.startsWith('reviewer-') && !s.startsWith('detective-')).sort()
  assert.equal(computed.length, 2)
  assert.deepEqual(computed, ['evidence-reader', 'senior-sdet'])
  const parl = [...buildEnv(SEATS()[0]).parliamentSeats].sort()
  const complement = SEATS().filter((s) => !parl.includes(s)).sort()
  assert.deepEqual(computed, complement, '第二处写死名单（cardPipeline 的 NON_PARL_SEATS）与现算必须一致')
})

test('SC-TC-58 硬约束不动：列数 4 / 七段 / 36 码 / 8 键 / 12 键', () => {
  const seat = SEATS()[0]
  const seg = segOf(textOf(seat), '本席清单')
  const head = seg.split(/\r?\n/).find((l) => l.trim().startsWith('|'))
  assert.equal(head.split('|').length - 2, 4, '列数仍 4（表头两侧竖线不计）')
  assert.equal(Object.keys(CARD_MODEL_CODES).length, CODES_EXPECTED)
  assert.equal(Object.keys(SCAN_FIELDS).length, SCAN_FIELDS_EXPECTED)
  const ref = runNode(['tools/docgen/check-shared-refs.mjs'])
  assert.equal(ref.code, 0, `check-shared-refs 必须 exit 0：${ref.out.slice(-400)}`)
  assert.match(ref.out, /keySet8 .*keySet12 .*=> ok/)
})

test('SC-TC-61 VERDICT_HINT 副本探针：值前插探针串 → 15 卡重渲跟随，真仓 15 卡 0 命中', () => {
  const PROBE = 'PROBE-SC61-'
  const probeSrc = [
    "import { readdirSync } from 'node:fs'",
    "import { renderSeat } from './tools/docgen/components/cardPipeline.mjs'",
    "const rows = []",
    "for (const f of readdirSync('agents').filter((x) => x.endsWith('.md'))) {",
    "  const seg = renderSeat(f.slice(0, -3)).card.split(/^## 本席清单\\s*$/m)[1] || ''",
    "  rows.push(seg.split(/\\r?\\n/).find((l) => l.trim().startsWith('|')) || '')",
    "}",
    "process.stdout.write(rows.join('\\n'))",
  ].join('\n')
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/card-model/vocab/card-contract.mjs')
    const src = R(p)
    const INJECT = 'export const VERDICT_HINT = `'
    assert.equal(src.split(INJECT).length - 1, 1, '注入点必须恰 1 处')
    writeFileSync(p, src.replace(INJECT, `export const VERDICT_HINT = '${PROBE}' + \``), 'utf8')
    const rows = probeIn(copy, 'probe-sc61.mjs', probeSrc).split(/\r?\n/).filter(Boolean)
    assert.equal(rows.length, SEATS().length, `必须逐席取到表头行（实得 ${rows.length}）`)
    assert.equal(rows.filter((l) => l.includes(PROBE)).length, SEATS().length, '重渲必须逐席跟随字符串值')
    const diskHits = SEATS().filter((s) => R(join(AGENTS_DIR, `${s}.md`)).includes(PROBE)).length
    assert.equal(diskHits, 0, '真仓 15 卡不得含探针（副本注入不落真仓）')
  })
})
