// S-C 卡面形状 验收用例实现（testcase: docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md）
// 本文件是**常驻回归测试**、不是 testcase 文件：用例由独立 `senior-sdet` 实例编写，本文件只消费它（一条 ID 一个 test 块）。
// 计数口径 = 本文件内 `test('SC-TC-` 块个数（60，与 testcase §1 的覆盖总表逐行相等；缺一即该条未落）。
// 取数形态按 testcase §0：`PROBE` = 本文件内的断言；`COPY` = `withRepoCopy` / `coldRepo` 副本；
// `COPY-取数` = 副本里写**只打印观测值**的探针脚本 → `runNode` 子进程跑它 → **父测试自己 assert**（子进程退出码只作旁证）。
// 判据禁 `node -e`；现值型断言（13 项 / 18 次 / 17 行 / 30 次）归 `SB_SHAPE_ONESHOT=1` 一次性档，常驻只留「改后 = 0」。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

import { REPO, AGENTS_DIR, walkFiles, runNode, coldRepo } from './support/card-fixtures.mjs'
import { withRepoCopy } from './support/dev-workflow-checks.mjs'
import { agentData, triggerTable as TRIGGER } from '../components/agentData.mjs'
import { buildCards, buildEnv, renderSeat } from '../components/cardPipeline.mjs'
import { renderCard } from '../components/renderCard.mjs'
import { cardFaceIds } from '../components/cardFaceIds.mjs'
import { CARD_KEYS } from '../components/cardKeys.mjs'
import { expandRefs } from '../components/seatLoader.mjs'
import { VERDICTS as CHECK_VERDICTS } from '../../observation-check/checks.mjs'
import { splitRow } from '../../execution-matrix/markdown-rows.mjs'
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
// `$BASE` = 本批开工提交（S-C spec §11.9 施工第 0 步）：默认冻结常量，`SB_BASE` 可显式覆盖（与 SC-TC-57 同源）
const BASE = (process.env.SB_BASE || '').trim() || 'eef963e96c0a2c309c83789e13da5b195b1d4e0c'
// `$BASE_HEAD` = S-C 收口提交（S-D T1，2026-11-04）：把回退面判据（SC-TC-62）由**开区间**（`$BASE`..工作树末尾）
// 收窄为**闭区间**（`$BASE`..`$BASE_HEAD`）。不改则任何后续批次的新增文件都落 A 面 → 判据恒红（实测两次），
// 只能靠「每批往 NEW_PATHS 补名单」续命。闭区间后该判据 = 「S-C 那批的回退面」的永久可核记录；本批及后续
// 批次的回退面改由各自 plan 白名单 + git status 兜。同族先例 = I29（S3 把 S2 的 `base..HEAD` 收窄为 `base..落地提交`）。
const BASE_HEAD = (process.env.SB_BASE_HEAD || '').trim() || 'cda896f'

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
const runTest = (args, cwd = REPO, extraEnv = null) => {
  const env = { ...process.env, ...(extraEnv || {}) }
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

// ── D 组：数据文案（斜杠 / 动作返回 / 人设 / HOST_TERM）────────────────────────────────────

const SEAT_JSON = (seat) => join(REPO, 'tools/docgen/data/seats', `${seat}.json`)
const seatsText = () => SEATS().map((s) => R(SEAT_JSON(s))).join('\n')
const seatsTextInCopy = (copy) => SEATS().map((s) => R(join(copy, 'tools/docgen/data/seats', `${s}.json`))).join('\n')
const countWord = (text, word) => text.split(word).length - 1

// 四字段斜杠（项口径）：装配后逐席逐字段判 `/` 与全角 `／`（PRD V12 原话：字段路径必须钉死）
const slashItems = () => {
  let n = 0
  for (const a of agentData) {
    const fields = [a.card.duty.trigger, a.card.duty.action, a.card.duty.constraint, ...a.card.categories.map((c) => c.label)]
    for (const v of fields) if (/[/／]/.test(String(v))) n += 1
  }
  return n
}

const SLASH_PROBE = [
  "import { agentData } from './tools/docgen/components/agentData.mjs'",
  "let n = 0, wrong = 0",
  "for (const a of agentData) {",
  "  const fields = [a.card.duty.trigger, a.card.duty.action, a.card.duty.constraint, ...a.card.categories.map((c) => c.label)]",
  "  for (const v of fields) if (/[/／]/.test(String(v))) n += 1",
  "  if (/[/／]/.test(String(a.card.duty))) wrong += 1",
  "}",
  "process.stdout.write('slash ' + n + ' / wrong ' + wrong)",
].join('\n')

const ACTION_PROBE = [
  "import { agentData } from './tools/docgen/components/agentData.mjs'",
  "const acts = agentData.map((a) => String(a.card.duty.action))",
  "const names = [...new Set(acts.map((x) => { const m = /写回(.+?)。?$/.exec(x); return m ? m[1] : '' }))]",
  "process.stdout.write(JSON.stringify({",
  "  writeback: acts.filter((x) => x.includes('写回')).length,",
  "  placeholder: acts.filter((x) => x.includes('本席产物')).length,",
  "  names,",
  "}))",
].join('\n')

const PERSONA_PROBE = [
  "import { agentData } from './tools/docgen/components/agentData.mjs'",
  "import { expectedDocs } from './tools/docgen/components/cardPipeline.mjs'",
  "const words = ['资深', '20 年']",
  "const cards = agentData.length",
  "let readmeHits = 0",
  "for (const w of words) {",
  "  const n = expectedDocs().entries.reduce((k, e) => k + (e.readme.split(w).length - 1), 0)",
  "  readmeHits += n",
  "}",
  "process.stdout.write('cards ' + cards + ' / readmeHits ' + readmeHits)",
].join('\n')

test('SC-TC-23 四字段斜杠串清零（项口径，常驻只判改后 0）', () => {
  assert.equal(slashItems(), 0, '四字段不得再有斜杠项')
  if (SHAPE) {
    assert.ok(BASE, 'SHAPE 档必须提供 SB_BASE')
    const before = execFileSync('git', ['show', `${BASE}:tools/docgen/data/seats/reviewer-qa.json`], { cwd: REPO, encoding: 'utf8' })
    assert.ok(before.includes('/'), '改前侧应仍有斜杠（现值 13 项由 SC-TC-57 登记）')
  }
})

test('SC-TC-24 副本注入一处 a/b → 计数 1（按项计，不是按出现次数）', () => {
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`)
    writeFileSync(p, R(p).replace(/"action": "([^"]*)"/, '"action": "$1（PRD/spec）"'), 'utf8')
    const out = probeIn(copy, 'probe-slash.mjs', SLASH_PROBE)
    const m = /slash (\d+)/.exec(out)
    assert.ok(m, out)
    assert.equal(Number(m[1]), 1, `注入一处后必须恰 1 项（实得 ${m[1]}）`)
    assert.throws(() => assert.equal(Number(m[1]), 0))
  })
})

test('SC-TC-25 全角 ／ 同判（注入 PRD／spec → 计数 ≥1）', () => {
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`)
    writeFileSync(p, R(p).replace(/"action": "([^"]*)"/, '"action": "$1（PRD／spec）"'), 'utf8')
    const out = probeIn(copy, 'probe-slash.mjs', SLASH_PROBE)
    const m = /slash (\d+)/.exec(out)
    assert.ok(m, out)
    assert.ok(Number(m[1]) >= 1, `全角形态必须同判（实得 ${m[1]}）`)
  })
})

test('SC-TC-26 口径判别力：扫 duty 容器恒 0（假绿）vs 扫四字段有值', () => {
  const wrong = SEATS().filter((s) => { const a = agentData.find((x) => x.name === s); return /[/／]/.test(String(a.card.duty)) }).length
  assert.equal(wrong, 0, '错口径（容器串化）恒 0——这正是不能用它作判据的理由')
  const right = slashItems()
  assert.equal(right, 0, '正口径改后必须 0（改前 13 由 SC-TC-57 一次性档登记）')
  if (!SHAPE) return
  assert.ok(BASE, 'SHAPE 档必须提供 SB_BASE')
  const before = SEATS().reduce((n, s) => {
    const j = JSON.parse(execFileSync('git', ['show', `${BASE}:tools/docgen/data/seats/${s}.json`], { cwd: REPO, encoding: 'utf8' }))
    const fields = [j.card.duty.action, j.card.duty.constraint, j.trigger.when, ...j.card.categories.map((c) => c.label)]
    return n + fields.filter((v) => /[/／]/.test(String(v))).length
  }, 0)
  assert.notEqual(before, right, '改前有值、改后为 0，两值必须不等（错口径才会两侧都 0）')
})

test('SC-TC-27 duty.action 四件齐：含写回 / 产物名非占位 / ≥3 种 / 不含三态词 + tool-tiers 回归', () => {
  const acts = SEATS().map((s) => String(agentData.find((a) => a.name === s).card.duty.action))
  assert.equal(acts.filter((x) => x.includes('写回')).length, SEATS().length, '每席都必须写明「写回」')
  assert.equal(acts.filter((x) => x.includes('本席产物')).length, 0, '产物名不得是占位串')
  const names = new Set(acts.map((x) => { const m = /写回(.+?)。?$/.exec(x); return m ? m[1] : '' }))
  assert.ok(names.size >= 3, `产物名至少 3 种不同值（实得 ${names.size}）`)
  assert.equal([...names].filter((n) => n === '').length, 0, '每席「写回」后必须有产物名')
  const en = Object.keys(ENUMS.VERDICTS)
  const zh = ['命中', '未命中', '不适用']
  const bad = acts.filter((x) => en.some((v) => x.includes(v)) || zh.some((v) => x.includes(v)))
  assert.deepEqual(bad, [], '动作行不得写三态词（英文或中文都不写）')
  const tt = runTest(['--test-name-pattern', 'S5-TC-C08', 'tools/docgen/test/tool-tiers.test.mjs'])
  assert.equal(tt.code, 0, `S5-TC-C08 必须绿（构造前提已换新文案片段）：${tt.out.slice(-400)}`)
  const ttSrc = R(join(REPO, 'tools/docgen/test/tool-tiers.test.mjs'))
  assert.equal(ttSrc.includes('只审各项标准是否达到，不裁技术对错'), false, '旧 action 子串不得再被当构造前提')
})

test('SC-TC-28 副本三坏形态必红：删写回 / 回填占位 / 全席同名', () => {
  const runOne = (mutate) => {
    let out = ''
    withRepoCopy((copy) => { mutate(copy); out = probeIn(copy, 'probe-action.mjs', ACTION_PROBE) })
    const j = JSON.parse(out)
    return j
  }
  // ① 某席「写回」→「写到」：命中席数变 席数 − 1
  const one = runOne((copy) => {
    const p = join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`)
    writeFileSync(p, R(p).replace('结论写回', '结论写到'), 'utf8')
  })
  assert.equal(one.writeback, SEATS().length - 1, `删一席「写回」必须少一席（实得 ${one.writeback}）`)
  // ② 某席产物名换成占位
  const two = runOne((copy) => {
    const p = join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`)
    writeFileSync(p, R(p).replace(/结论写回([^"]*)"/, '结论写回本席产物"'), 'utf8')
  })
  assert.ok(two.placeholder >= 1, `回填占位必须命中 ≥1（实得 ${two.placeholder}）`)
  // ③ 15 席产物名统一成同一个
  const three = runOne((copy) => {
    for (const s of SEATS()) {
      const p = join(copy, 'tools/docgen/data/seats', `${s}.json`)
      writeFileSync(p, R(p).replace(/结论写回([^"]*)"/, '结论写回交付物正文"'), 'utf8')
    }
  })
  assert.equal(three.names.length, 1, `全席同名时必须只剩 1 种（实得 ${three.names.length}）`)
})

test('SC-TC-29 人设词三面清零（含外层 role / agents / docs/agents）+ sdet-data 回归 + 占位保全', () => {
  const words = ['资深', '20 年', '十年']
  for (const w of words) {
    assert.equal(countWord(seatsText(), w), 0, `seats 面（含外层 role）不得含「${w}」`)
    const agentsText = SEATS().map((s) => R(join(AGENTS_DIR, `${s}.md`))).join('\n')
    assert.equal(countWord(agentsText, w), 0, `agents 面不得含「${w}」`)
    const docsText = SEATS().map((s) => R(join(REPO, 'docs/agents', `${s}.md`))).join('\n')
    assert.equal(countWord(docsText, w), 0, `docs/agents 面不得含「${w}」`)
  }
  const sd = runTest(['--test-name-pattern', 'TC-007', 'tools/docgen/test/sdet-data.test.mjs'])
  assert.equal(sd.code, 0, `TC-007（role 已去「资深」）必须绿：${sd.out.slice(-400)}`)
  if (SHAPE) assert.equal(countWord(seatsText(), '${@hostTerm}'), 18, 'SHAPE：占位总数须仍为 18')
})

test('SC-TC-30 回填人设必红；rationale 改写不得弄丢 ${@hostTerm} 占位（仍 18 / 漏 1 → 17）', () => {
  // ① 副本把某席 rationale 开头改成「资深审阅者……」→ 人设投影面命中 ≥1
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`)
    const src = R(p)
    writeFileSync(p, src.replace(/"rationale": "[^"]*"/, '"rationale": "资深审阅者，按本席视角拆卡。${@cardRationaleHead}七${@cardRationaleTail}"'), 'utf8')
    const out = probeIn(copy, 'probe-persona.mjs', PERSONA_PROBE)
    const m = /readmeHits (\d+)/.exec(out)
    assert.ok(m, out)
    assert.ok(Number(m[1]) >= 1, '回填人设后 docs/agents 投影面必须命中 ≥1')
  })
  const detective = R(SEAT_JSON('detective-observer'))
  assert.ok(detective.includes('${@hostTerm}失职'), '前置：detective 的引语已改占位')
  // ② 副本换掉 detective 的开头人设句但不动占位 → 仍 18
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/seats/detective-observer.json')
    writeFileSync(p, R(p).replace('以行为核实为视角：', '以行为核实为视角（改写）：'), 'utf8')
    const n = countWord(seatsTextInCopy(copy), '${@hostTerm}')
    assert.equal(n, 18, `改写 rationale 后占位总数必须仍为 18（实得 ${n}）`)
  })
  // ③ 副本弄丢一处占位（换回字面）→ 17
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/seats/detective-observer.json')
    writeFileSync(p, R(p).replace('${@hostTerm}失职', '主持人失职'), 'utf8')
    const n = countWord(seatsTextInCopy(copy), '${@hostTerm}')
    assert.equal(n, 17, `漏一处必须变 17（实得 ${n}）`)
  })
})

test('SC-TC-31 人设词面边界：`20 年经验` 与 `20 年` 都须 0（面宽与 SC-TC-29 同宽）', () => {
  const faces = [seatsText(), SEATS().map((s) => R(join(AGENTS_DIR, `${s}.md`))).join('\n'), SEATS().map((s) => R(join(REPO, 'docs/agents', `${s}.md`))).join('\n')]
  for (const w of ['20 年经验', '20 年', '十年']) assert.equal(faces.reduce((n, t) => n + countWord(t, w), 0), 0, `「${w}」必须 0`)
})

test('SC-TC-32 动作行不写三态词：英文与中文都不许（注入即红）', () => {
  const acts = SEATS().map((s) => String(agentData.find((a) => a.name === s).card.duty.action))
  const en = Object.keys(ENUMS.VERDICTS)
  const zh = ['命中', '未命中', '不适用']
  assert.deepEqual(acts.filter((x) => en.some((v) => x.includes(v))), [])
  assert.deepEqual(acts.filter((x) => zh.some((v) => x.includes(v))), [])
  for (const [probe, label] of [[en[0], '英文'], ['不适用', '中文']]) {
    withRepoCopy((copy) => {
      const p = join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`)
      writeFileSync(p, R(p).replace(/结论写回([^"]*)"/, `结论写回$1（${probe}）"`), 'utf8')
      const out = probeIn(copy, 'probe-action.mjs', ACTION_PROBE)
      const j = JSON.parse(out)
      const hit = j.names.some((n) => n.includes(probe))
      assert.ok(hit, `${label}三态词注入后产物名片段必须可见（构造有效性）`)
    })
  }
})

test('SC-TC-43 shared.json.hostTerm === 主持人（唯一写死处）+ 键数 4 + sa-data 回归', () => {
  const shared = JSON.parse(R(join(REPO, 'tools/docgen/data/shared.json')))
  assert.equal(shared.hostTerm, '主持人')
  assert.equal(Object.keys(shared).length, 4)
  assert.deepEqual(Object.keys(shared).sort(), ['cardRationaleHead', 'cardRationaleTail', 'dutyConstraintDefault', 'hostTerm'])
  assert.equal(countWord(R(join(REPO, 'tools/docgen/data/shared.json')), '主持人'), 1, '同文件不得出现第二份字面')
  const sa = runTest(['--test-name-pattern', 'TC-001', 'tools/docgen/test/sa-data-layer.test.mjs'])
  assert.equal(sa.code, 0, `TC-001（shared.json 键数已改 4）必须绿：${sa.out.slice(-400)}`)
})

test('SC-TC-44 席位数据「主持人」字面 0 次（常驻）；${@hostTerm} 18 次（一次性档）', () => {
  assert.equal(countWord(seatsText(), '主持人'), 0, '席位数据不得再有字面')
  if (SHAPE) assert.equal(countWord(seatsText(), '${@hostTerm}'), 18, '一次性档：占位出现次数须 = 18')
})

test('SC-TC-45 行口径 vs 次数口径（17 行 / 18 处）——整条归一次性档', (t) => {
  // G6（S-D T2）：原为 `if (!SHAPE) return` —— 一条断言不跑却计 pass，`# skipped 0` 掩盖。改 `t.skip()` 后
  // 默认档汇总行如实出现 skip（名字进 `SKIP_ALLOWLIST`，由 ② 段 skip 守卫按名核）。
  if (!SHAPE) return t.skip('一次性档未开（SB_SHAPE_ONESHOT≠1）')
  assert.ok(BASE, 'SHAPE 档必须提供 SB_BASE')
  let lines = 0
  let occs = 0
  for (const s of SEATS()) {
    const raw = execFileSync('git', ['show', `${BASE}:tools/docgen/data/seats/${s}.json`], { cwd: REPO, encoding: 'utf8' })
    for (const line of raw.split(/\r?\n/)) {
      const c = line.split('主持人').length - 1
      if (c > 0) { lines += 1; occs += c }
    }
  }
  assert.equal(lines, 17)
  assert.equal(occs, 18)
  assert.notEqual(lines, occs, '差值 1 = detective 的 rationale 一行 2 处（按行断会漏第 2 处）')
  assert.equal(countWord(seatsText(), '主持人'), 0, '改后侧字面必须 0')
})

test('SC-TC-46 渲染面「主持人」总数 = 30（等价性证明）——整条归一次性档', (t) => {
  // G6（S-D T2）：同 SC-TC-45，默认档改为如实计 skip
  if (!SHAPE) return t.skip('一次性档未开（SB_SHAPE_ONESHOT≠1）')
  const total = SEATS().reduce((n, s) => n + countWord(textOf(s), '主持人'), 0)
  assert.equal(total, 30, `渲染面总数须 = 30（实得 ${total}）`)
})

test('SC-TC-47 副本把 hostTerm 改「议长」→ 渲染跟随、真仓 0 命中（不落真仓）', () => {
  const PROBE = '议长'
  const probeSrc = [
    "import { renderSeat } from './tools/docgen/components/cardPipeline.mjs'",
    "const card = renderSeat(process.env.SEAT).card",
    "process.stdout.write('probe ' + (card.split(process.env.TERM).length - 1) + ' / host ' + (card.split('主持人').length - 1))",
  ].join('\n')
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/shared.json')
    writeFileSync(p, R(p).replace('"hostTerm": "主持人"', `"hostTerm": "${PROBE}"`), 'utf8')
    // 选 issue-card 席（not 指针席）：其渲染面「主持人」只来自 ${@hostTerm}，不含模板 / 共享块里的既有字面
    const out = probeIn(copy, 'probe-host.mjs', probeSrc, { SEAT: 'reviewer-product', TERM: PROBE })
    const m = /probe (\d+) \/ host (\d+)/.exec(out)
    assert.ok(m, out)
    assert.ok(Number(m[1]) >= 1, '渲染必须跟随新词')
    assert.equal(Number(m[2]), 0, '原词必须归零')
  })
  assert.equal(SEATS().filter((s) => R(join(AGENTS_DIR, `${s}.md`)).includes(PROBE)).length, 0, '真仓 15 卡不得被写入探针')
})

test('SC-TC-48 副本改 hostTerm 不重生成 → gate Mismatch exit 1；真仓 gate exit 0', () => {
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/shared.json')
    writeFileSync(p, R(p).replace('"hostTerm": "主持人"', '"hostTerm": "议长"'), 'utf8')
    const r = runNode(['tools/docgen/cli.mjs', 'gate'], copy)
    assert.notEqual(r.code, 0, '改了数据不重生成不得 exit 0')
    assert.match(r.out, /Mismatch/, r.out.slice(-400))
  })
  const g = runNode(['tools/docgen/cli.mjs', 'gate'])
  assert.equal(g.code, 0, `真仓 gate 必须 exit 0：${g.out.slice(-400)}`)
})

test('SC-TC-49 @HOST_TERM（整值）抛错；${@HOST_TERM}（大写插值）静默不展开；小写正常', () => {
  const shared = { hostTerm: '主持人' }
  assert.throws(() => expandRefs('@HOST_TERM', shared, 'x'), (e) => e && e.code === 'NestedSharedRef')
  assert.equal(expandRefs('$' + '{@HOST_TERM}', shared, 'x'), '$' + '{@HOST_TERM}', '大写插值不抛也不展开（静默失败）')
  assert.equal(expandRefs('@hostTerm', shared, 'x'), '主持人')
  assert.equal(expandRefs('当$' + '{@hostTerm}调度', shared, 'x'), '当主持人调度')
})

test('SC-TC-60 大写形态兜底：seats 内 @HOST_TERM 0，且 15 卡 ${@ 残留 0', () => {
  const text = seatsText()
  assert.equal(countWord(text, '@HOST_TERM'), 0, '大写形态（含插值）合计必须 0')
  const cards = SEATS().map((s) => R(join(AGENTS_DIR, `${s}.md`))).join('\n')
  assert.equal(countWord(cards, '${@'), 0, '展开后卡面不得残留 ${@')
  // 构造：副本把所有占位写成大写形态 → 渲染残留 ≥1（expandRefs 不报错，只能靠本判据抓）
  const probeSrc = [
    "import { renderSeat } from './tools/docgen/components/cardPipeline.mjs'",
    "const card = renderSeat(process.env.SEAT).card",
    "process.stdout.write('residual ' + (card.split('$' + '{@').length - 1))",
  ].join('\n')
  withRepoCopy((copy) => {
    for (const s of SEATS()) {
      const p = join(copy, 'tools/docgen/data/seats', `${s}.json`)
      writeFileSync(p, R(p).replaceAll('${@hostTerm}', '${@HOST_TERM}'), 'utf8')
    }
    const out = probeIn(copy, 'probe-upper.mjs', probeSrc, { SEAT: 'detective-observer' })
    const m = /residual (\d+)/.exec(out)
    assert.ok(m, out)
    assert.ok(Number(m[1]) >= 1, '大写插值必须留下字面（否则本条判据没有对象）')
  })
})

// ── F 组：长度约束与槽位计数（Q4）────────────────────────────────────────────────────────────

// 三词槽（Q4）：卡模型键面 0 命中是判据；全树取数只作口径对照（行口径）
const SLOT_WORDS = ['needs', 'purpose', 'method']
const labelsOfAll = () => agentData.flatMap((a) => a.card.categories.map((c) => c.label))
const LABEL_PROBE = [
  "import { agentData } from './tools/docgen/components/agentData.mjs'",
  "const labels = agentData.flatMap((a) => a.card.categories.map((c) => c.label))",
  "const max = labels.reduce((k, l) => Math.max(k, l.length), 0)",
  "process.stdout.write('labels ' + labels.length + ' / max ' + max)",
].join('\n')

test('SC-TC-39 categories[].label 每项 ≤ 20 字（97 项，现最长 13）', () => {
  const labels = labelsOfAll()
  assert.equal(labels.length, 97, '类别项数不变（本段不动 categories 形状）')
  assert.ok(labels.every((l) => l.length <= 20), `每项 ≤ 20 字（最长 ${Math.max(...labels.map((l) => l.length))}）`)
  assert.equal(Math.max(...labels.map((l) => l.length)), 13, '现值最长 13（记录项）')
})

test('SC-TC-40 副本注入 21 字 label → 必红', () => {
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`)
    writeFileSync(p, R(p).replace(/("label": ")[^"]*"/, `$1${'核'.repeat(21)}"`), 'utf8')
    const out = probeIn(copy, 'probe-label.mjs', LABEL_PROBE)
    const m = /max (\d+)/.exec(out)
    assert.ok(m, out)
    assert.equal(Number(m[1]), 21, `注入后最长必须变 21（实得 ${m[1]}）`)
    assert.throws(() => assert.ok(Number(m[1]) <= 20))
  })
})

test('SC-TC-41 三词槽在卡模型键面 0 命中（needs / purpose / method）', () => {
  const keys = new Set(CARD_KEYS)
  for (const a of agentData) {
    for (const k of Object.keys(a.card)) keys.add(k)
    for (const k of Object.keys(a.card.duty)) keys.add(k)
  }
  const hits = SLOT_WORDS.filter((w) => [...keys].some((k) => k.includes(w)))
  assert.deepEqual(hits, [], '卡模型键面不得出现三词槽')
})

test('SC-TC-42 口径判别力：全树行口径 0 / 22 / 1，卡模型键面 0', () => {
  const lineHits = (word) => walkFiles(join(REPO, 'tools/docgen'))
    .filter((p) => (p.endsWith('.mjs') || p.endsWith('.json')) && !p.endsWith('sc-card-shape.test.mjs'))
    .reduce((n, p) => n + R(p).split(/\r?\n/).filter((l) => l.includes(word)).length, 0)
  assert.equal(lineHits(SLOT_WORDS[0]), 0, 'needs 全树行口径 0')
  assert.equal(lineHits(SLOT_WORDS[1]), 22, 'purpose 全树行口径 22（commands.mjs 9 + policy-pure-source.test.mjs 13）')
  assert.equal(lineHits(SLOT_WORDS[2]), 1, 'method 全树行口径 1（card-model/expression.mjs）')
  assert.equal(SLOT_WORDS.filter((w) => agentData.some((a) => Object.keys(a.card).concat(Object.keys(a.card.duty)).some((k) => k.includes(w)))).length, 0)
})

// ── G 组：`ret`+`urns` 归零与一次性档清单（R11 / §11.9 末条）─────────────────────────────────

// 判据实现必须**拼接构造**该词（直接写字面 → 本文件自身命中 = 假红）
const BANNED_FIELD = 'ret' + 'urns'
const SELF_PATH = join(REPO, 'tools/docgen/test/sc-card-shape.test.mjs')
const countBanned = (files) => files.reduce((n, t) => n + countWord(t, BANNED_FIELD), 0)
const docgenFiles = () => walkFiles(join(REPO, 'tools/docgen')).filter((p) => p.endsWith('.mjs') || p.endsWith('.json'))

test('SC-TC-50 该键名在 tools/docgen/** 计数 0（现 3，全在 S-A 负例夹具）', () => {
  assert.equal(countBanned(docgenFiles().map((p) => R(p))), 0, '夹具已改名为 ghostField，全树不得再有该词')
})

test('SC-TC-51 判据实现必须拼接构造该词（写字面会让测试文件自身命中）', () => {
  const self = R(SELF_PATH)
  assert.equal(countWord(self, BANNED_FIELD), 0, '本文件不得含完整字面（否则它会把自己数进去）')
  assert.ok(self.includes("'ret' + 'urns'"), '必须两段拼接构造')
  // 反证：若写成完整字面，扫描集合（含测试文件）会命中 ≥1
  assert.equal(countBanned(["const w = '" + BANNED_FIELD + "'"]), 1, '写字面形态必被同一计数抓到')
})

test('SC-TC-52 副本回填该键名 → 计数 ≥1 必红', () => {
  const probeSrc = [
    "import { readdirSync, readFileSync } from 'node:fs'",
    "import { join } from 'node:path'",
    "const walk = (d, out = []) => {",
    "  for (const e of readdirSync(d, { withFileTypes: true })) {",
    "    const p = join(d, e.name)",
    "    if (e.isDirectory()) walk(p, out)",
    "    else if (p.endsWith('.mjs') || p.endsWith('.json')) out.push(p)",
    "  }",
    "  return out",
    "}",
    "const word = process.env.BANNED",
    "let n = 0",
    "for (const p of walk('tools/docgen')) n += readFileSync(p, 'utf8').split(word).length - 1",
    "process.stdout.write('banned ' + n)",
  ].join('\n')
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`)
    writeFileSync(p, R(p).replace('"checkItems"', `"${BANNED_FIELD}": [],\n    "checkItems"`), 'utf8')
    const out = probeIn(copy, 'probe-banned.mjs', probeSrc, { BANNED: BANNED_FIELD })
    const m = /banned (\d+)/.exec(out)
    assert.ok(m, out)
    assert.ok(Number(m[1]) >= 1, `回填该键名后必须命中 ≥1（实得 ${m[1]}）`)
    assert.throws(() => assert.equal(Number(m[1]), 0))
  })
})

test('SC-TC-57 一次性档清单：SB_BASE 换本批 $BASE，四个现值两侧各有明确取值', () => {
  const baseText = (rel) => execFileSync('git', ['show', `${BASE || 'HEAD'}:${rel}`], { cwd: REPO, encoding: 'utf8' })
  if (!SHAPE) {
    // 常驻档：S-B 三条一次性用例必须 skip（不跑即不假红），且本文件不跑任何现值断言
    const r = runTest(['tools/docgen/test/sb-contract-layer.test.mjs'])
    assert.equal(countOf(r.out, '# skipped (\\d+)'), 3, `常驻档必须恰 3 条 skip（实得 ${countOf(r.out, '# skipped (\\d+)')}）`)
    return
  }
  assert.ok(BASE, 'SHAPE 档必须提供 SB_BASE')
  // ① `$BASE` 侧四个现值：斜杠 13 项 / 主持人 18 次 17 行 / 渲染 30
  let beforeSlash = 0
  let beforeLines = 0
  let beforeOccs = 0
  let beforeRender = 0
  for (const s of SEATS()) {
    const j = JSON.parse(baseText(`tools/docgen/data/seats/${s}.json`))
    const fields = [j.card.duty.action, j.card.duty.constraint, j.trigger.when, ...j.card.categories.map((c) => c.label)]
    beforeSlash += fields.filter((v) => /[/／]/.test(String(v))).length
    for (const line of baseText(`tools/docgen/data/seats/${s}.json`).split(/\r?\n/)) {
      const c = line.split('主持人').length - 1
      if (c > 0) { beforeLines += 1; beforeOccs += c }
    }
    beforeRender += countWord(baseText(`agents/${s}.md`), '主持人')
  }
  assert.equal(beforeSlash, 13, 'BASE 侧斜杠项现值 = 13')
  assert.equal(beforeLines, 17, 'BASE 侧行口径 = 17')
  assert.equal(beforeOccs, 18, 'BASE 侧次数口径 = 18')
  assert.equal(beforeRender, 30, 'BASE 侧渲染总数 = 30')
  // ② 改后侧：0 / 0 / 18 / 30
  assert.equal(slashItems(), 0)
  assert.equal(countWord(seatsText(), '主持人'), 0)
  assert.equal(countWord(seatsText(), '${@hostTerm}'), 18)
  assert.equal(SEATS().reduce((n, s) => n + countWord(textOf(s), '主持人'), 0), 30)
  // ③ S-B 三条一次性用例按新 BASE 重跑必须绿
  const r = runTest(['tools/docgen/test/sb-contract-layer.test.mjs'], REPO, { SB_SHAPE_ONESHOT: '1', SB_BASE: BASE })
  assert.equal(r.code, 0, `一次性档必须绿：${r.out.slice(-600)}`)
  assert.equal(countOf(r.out, '# skipped (\\d+)'), 0)
  assert.equal(countOf(r.out, '# fail (\\d+)'), 0)
})

// ── H 组：回归面与回退面（V3 / V1 / §11.14）──────────────────────────────────────────────────

const BATCH_CASES = 60
const BASELINE_TESTS = 1481
const blockCount = (file, prefix = '') => (R(file).match(new RegExp(`^\\s*test\\('${prefix}`, 'gm')) ?? []).length

test('SC-TC-53 gate exit 0 且 15 席 disk == render 逐字节', () => {
  const g = runNode(['tools/docgen/cli.mjs', 'gate'])
  assert.equal(g.code, 0, `gate 必须 exit 0：${g.out.slice(-400)}`)
  const bj = JSON.parse(R(join(REPO, 'tools', 'docgen', 'baseline.json')))
  assert.match(g.out, new RegExp(`baseline ${bj.length}\\/${bj.length}`), '末行 N/N 从两清单派生（不再写死 38）')
  for (const s of SEATS()) assert.equal(R(join(AGENTS_DIR, `${s}.md`)), textOf(s), `${s} 盘上必须逐字节 == 渲染`)
})

test('SC-TC-54 副本改一席 action 不重生成 → gate Mismatch exit 1', () => {
  withRepoCopy((copy) => {
    const p = join(copy, 'tools/docgen/data/seats', `${SEATS()[0]}.json`)
    const src = R(p)
    writeFileSync(p, src.replace(/("action": "[^"]*)"/, '$1（改）"'), 'utf8')
    const r = runNode(['tools/docgen/cli.mjs', 'gate'], copy)
    assert.notEqual(r.code, 0, '改数据不重生成不得 exit 0')
    assert.match(r.out, /Mismatch/, r.out.slice(-400))
  })
})

test('SC-TC-55 用例账对齐（60 块）+ plan 的 check-plan map 无缺口 / 无悬空', () => {
  assert.equal(blockCount(SELF_PATH, 'SC-TC-'), BATCH_CASES, '本文件 test 块必须恰 = 附录 A 行数')
  // `# tests` 口径：基线 1481 + 本批**实际块数** = 1541；测试内**不自跑** `npm run check`（禁自递归，见文件头禁令），
  // 实际值由 ③ 出口的 `npm run check` 记录在 plan 执行记录 / 门行；左侧取实际块数（写死常量会让「删一块」判不出来）。
  assert.equal(BASELINE_TESTS + blockCount(SELF_PATH, 'SC-TC-'), 1541, 'floor = 基线 + 本批实际块数（删一块即 1540 红）')
  const r = runNode(['scripts/check-plan.mjs', 'map', '--plan', 'docs/superpowers/plans/2026-11-03-s-c-card-shape.md'])
  assert.equal(r.code, 0, `check-plan map 必须 exit 0：${r.out.slice(-300)}`)
  assert.match(r.out, /map: missing 0 dangling 0（cases 60 \/ mapped 60） => ok/)
})

test('SC-TC-56 做坏判据：副本真删 sdet-render.test.mjs → 同一命令真实计数归零且 exit 非 0', () => {
  const victim = 'tools/docgen/test/sdet-render.test.mjs'
  const victimBlocks = blockCount(join(REPO, victim), '')
  assert.ok(victimBlocks >= 1, '所选文件的用例块数必须可数')
  withRepoCopy((copy) => {
    // 删前：真跑该文件，真实 # tests 必须等于它的块数（读数与文件现状互证）
    const before = runTest([victim], copy)
    assert.equal(countOf(before.out, '# tests (\\d+)'), victimBlocks, '删前真实 # tests 必须等于该文件块数')
    assert.equal(before.code, 0, `删前该文件必须 exit 0：${before.out.slice(-300)}`)
    rmSync(join(copy, victim), { force: true })
    // 删后：同一命令真跑 → 用例数掉落且 exit 非 0（「删用例凑绿」会在此处必红）
    const after = runTest([victim], copy)
    assert.notEqual(after.code, 0, '副本内删文件后同一命令必须 exit 非 0')
    const raw = countOf(after.out, '# tests (\\d+)')
    const got = Number.isFinite(raw) ? raw : 0
    assert.ok(got < victimBlocks, `删后真实计数必须低于删前（删前 ${victimBlocks} / 删后 ${got}）`)
  })
})

test('SC-TC-59 防回退：PRD 行数 D 17 / Q 8 / 空值 0（S-C 不得改功能点集合）', () => {
  const prd = R(join(REPO, 'docs/prd/20261102212627-card-data-contract-and-proof/index.md'))
  const rows = prd.split(/\r?\n/).filter((l) => l.startsWith('|'))
  const dRows = rows.filter((r) => /^\| \*{0,2}D\d+/.test(r))
  const qRows = rows.filter((r) => /^\| Q\d+/.test(r))
  assert.equal(dRows.length, 17, 'D 编号行数必须 17（正则须容忍粗体行号）')
  assert.equal(qRows.length, 8, 'Q 编号行数必须 8')
  const empty = [...dRows.map((r) => splitRow(r)[2]), ...qRows.map((r) => splitRow(r)[3])].filter((c) => c.trim() === '')
  assert.deepEqual(empty, [], '「依据」列与「影响面」列不得有空值')
})

// 回退面判据（spec §11.14）：按 `git diff --name-status $BASE $BASE_HEAD` 的集合比，不比计数（CC-1）；
// 区间**闭**（S-D T1 改判）：上界冻结在 S-C 收口提交，后续批次新增文件不再落入本判据的视线
const AFTER_PATH = `docs/after/20261104101304-s-c-checkitem-${BANNED_FIELD}-deferral-open-decisions.md`
const NEW_PATHS = [
  'docs/handoffs/2026-11-04-s-c-card-shape.md',
  // ③ 交接词：spec §11.14 步 1 只列了 ② 交接词；③ 收尾必然新写一份（本批 A 面），已由用户 2026-11-04 裁定补入
  'docs/handoffs/2026-11-04-s-c-card-shape-impl.md',
  // ⑤ 收尾交接词：同 ③ 的成因（spec §11.14 步 1 未列），本批 A 面、由 2026-11-04 收口时补入（与 ② / ③ 交接词同类，非新口径）
  'docs/handoffs/2026-11-04-next-batch-kickoff.md',
  'docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md',
  'docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md',
  AFTER_PATH,
  'docs/superpowers/plans/2026-11-03-s-c-card-shape.md',
  'tools/docgen/check-trigger-kind.mjs',
  'tools/docgen/check-tristate-header.mjs',
  'tools/docgen/test/sc-card-shape.test.mjs',
]
const M_PREFIXES = ['tools/docgen/', 'tools/observation-check/', 'scripts/', 'agents/', 'docs/agents/']
const M_REALS = [
  'docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md',
  'docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md',
  // 签后增量登记（spec §11.15 强制动作）：门行是本批交付面、回退面**不抹**它；testcase 的白名单未列，
  // 已由用户 2026-11-04 裁定按「spec 自身强制的产物」补入（登记为偏差，不放松其它路径）
  'skills/dev-workflow/references/gate-record.md',
]
const inMWhitelist = (path) => M_PREFIXES.some((p) => path.startsWith(p)) || M_REALS.includes(path) || NEW_PATHS.includes(path)

const judgeNameStatus = (rows) => {
  const aSet = new Set()
  const nonA = []
  for (const row of rows) {
    const [status, ...paths] = row.split('\t')
    if (status === 'A') { aSet.add(paths[0]); continue }
    for (const p of paths) nonA.push(p)
  }
  const aOutside = [...aSet].filter((p) => !NEW_PATHS.includes(p))
  const mOutside = nonA.filter((p) => !inMWhitelist(p))
  return { aSet, aOutside, mOutside, nonA }
}

test('SC-TC-62 回退面复验（$BASE..$BASE_HEAD 闭区间）：A 面 ⊆ 本批新增白名单、其余状态面 ⊆ 修改白名单；D6 延期落点实名可核', () => {
  assert.ok(BASE, 'SC-TC-62 必须提供 $BASE（= 开工提交）')
  assert.ok(BASE_HEAD, 'SC-TC-62 必须提供 $BASE_HEAD（= 本批收口提交；闭区间上界）')
  // ②-0 盲区前置：新增件必须对 `git diff` 可见（未跟踪件 `git diff` 看不见）
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', ...NEW_PATHS], { cwd: REPO, encoding: 'utf8' })
    .split(/\r?\n/).filter(Boolean)
  assert.deepEqual(untracked, [], '白名单内的新增件必须已进索引 / 已跟踪')
  const rows = execFileSync('git', ['-c', 'core.quotePath=false', 'diff', '--name-status', BASE, BASE_HEAD], { cwd: REPO, encoding: 'utf8' })
    .split(/\r?\n/).filter((l) => l.trim())
  const { aSet, aOutside, mOutside } = judgeNameStatus(rows)
  console.log(`name-status: rows ${rows.length} / A ${aSet.size} / A-outside ${aOutside.length} / nonA-outside ${mOutside.length}`)
  assert.deepEqual(aOutside, [], `A 面出现白名单外路径：${aOutside.join('、')}`)
  assert.deepEqual(mOutside, [], `其余状态面出现修改白名单外路径：${mOutside.join('、')}`)
  // B（不许少）：`$BASE` 上**不存在**的白名单件必须都出现在 A 面——用 `git ls-tree $BASE` 现算，
  // 不写死「哪几件是新的」：② 段的 spec / testcase / plan / docs-after 已在 `$BASE`（eef963e）里提交，
  // 它们不是本批新增（plan 会被本批再改 → 以 M 出现，仍在白名单内）
  const atBase = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', BASE], { cwd: REPO, encoding: 'utf8' })
    .split(/\r?\n/).filter(Boolean))
  const want = NEW_PATHS.filter((p) => !atBase.has(p))
  assert.ok(want.every((p) => aSet.has(p)), `A 面缺项：${want.filter((p) => !aSet.has(p)).join('、')}`)
  // ③ 步 2 的等价面：tools/docgen 前缀下 A 面恰 = 本批新增 3 件
  const addedInDocgen = rows.filter((r) => r.startsWith('A\t') && r.includes('tools/docgen/')).map((r) => r.split('\t')[1]).sort()
  assert.deepEqual(addedInDocgen, ['tools/docgen/check-trigger-kind.mjs', 'tools/docgen/check-tristate-header.mjs', 'tools/docgen/test/sc-card-shape.test.mjs'].sort())
  // ④ 步 3–4 的复验入口可跑
  assert.equal(runTest(['tools/docgen/test/sa-data-layer.test.mjs']).code, 0)
  assert.equal(runNode(['tools/docgen/cli.mjs', 'gate']).code, 0)
  // ⑤ 延期落点实名 + 触发 / 谁兜两栏在位
  const after = R(join(REPO, AFTER_PATH))
  assert.ok(after.includes('触发'), '必须含「触发」栏')
  assert.ok(after.includes('下一次修订'), '必须含触发条件的可核表述')
  assert.ok(after.includes('谁兜') && after.includes('用户'), '必须含谁兜 / 签字人')
  // 红态：白名单外路径必须被点名（纯函数构造，不在真仓注入）
  const fake = judgeNameStatus(['A\ttools/docgen/rogue-new.mjs', 'M\tREADME.md'])
  assert.deepEqual(fake.aOutside, ['tools/docgen/rogue-new.mjs'])
  assert.deepEqual(fake.mOutside, ['README.md'])
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
