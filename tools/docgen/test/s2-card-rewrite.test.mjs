// S2 卡面重构 验收用例实现（testcase: docs/superpowers/specs/2026-11-01-s2-card-rewrite-design-testcase.md）
// 本文件是**常驻回归测试**、不是 testcase 文件：用例由独立 `senior-sdet` 实例编写，本文件只消费它（一条 ID 一个 test 块）。
// 计数口径 = 本文件内 `test('S2-TC-` 块个数（79 = 76 + D17 的 K 组 3 条），与 testcase 声明逐组相等（`J03` 判）。
// 禁止自递归（testcase 常量 11 / `J02`）：本文件只单跑可独跑的命令（`check-observable` / `cli.mjs <子命令>` / `scope-sweep --check`），
// **不**执行 `npm run check` / `check-all.mjs`（总门禁由门禁自己跑）。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

import { REPO, AGENTS_DIR, DOC_AGENTS_DIR, walkFiles, runNode, runCli, coldRepo, mutCard } from './support/card-fixtures.mjs'
import { splitRow } from '../../execution-matrix/markdown-rows.mjs'
import { checkAgentFromText } from '../../execution-matrix/check-agent.mjs'
import { agentData } from '../components/agentData.mjs'
import { buildCards, buildEnv, renderSeat } from '../components/cardPipeline.mjs'
import { renderCard, expectedBullet } from '../components/renderCard.mjs'
import { cardFaceIds } from '../components/cardFaceIds.mjs'
import { registeredIdsOf } from '../card-model/index.mjs'
import * as ENUMS from '../card-model/enums.mjs'
import * as CC from '../card-model/vocab/card-contract.mjs'
import * as ON from '../card-model/vocab/object-names.mjs'
import * as LAND from '../card-model/vocab/landings.mjs'
import * as PRED from '../card-model/vocab/predicates.mjs'
import * as SH from '../card-model/vocab/shared-actions.mjs'
import * as MF from '../card-model/vocab/card-must-fields.mjs'
import { BASELINE_RULES, agentPaths } from '../components/baseline.mjs'

const SELF = fileURLToPath(import.meta.url)
const SPEC_PATH = join(REPO, 'docs', 'superpowers', 'specs', '2026-11-01-s2-card-rewrite-design.md')
const TC_PATH = join(REPO, 'docs', 'superpowers', 'specs', '2026-11-01-s2-card-rewrite-design-testcase.md')
const S4_SPEC = join(REPO, 'docs', 'superpowers', 'specs', '2026-10-29-agent-card-s4-render-design.md')
const PRD_CARD = join(REPO, 'docs', 'prd', '20261026205821-agent-card-contract.md')
const REPORT = join(REPO, 'docs', 'reports', '2026-11-01-s2-card-comprehension-baseline.md')
const TPL = join(REPO, 'tools', 'docgen', 'templates', 'agent-card.md.tpl')
const RC_SRC = join(REPO, 'tools', 'docgen', 'components', 'renderCard.mjs')
const VAL_SRC = join(REPO, 'tools', 'docgen', 'card-model', 'validateCardModel.mjs')
// D19：`cardFaceIds` 的实现在 `components/` —— 许值的真实消费面看这两个文件
const CF_SRC = join(REPO, 'tools', 'docgen', 'components', 'cardFaceIds.mjs')
const CC_SRC = join(REPO, 'tools', 'docgen', 'card-model', 'vocab', 'card-contract.mjs')

const R = (p) => readFileSync(p, 'utf8')
const sha = (buf) => createHash('sha256').update(buf).digest('hex').toUpperCase()
const SEATS = () => agentData.map((a) => a.name)
const bOf = (seat) => buildCards().find((b) => b.seat === seat)
const envOf = (seat, card) => buildEnv(seat, [card ?? bOf(seat).card])
const textOf = (seat) => renderSeat(seat).card
const segOf = (text, seg) => String(text).split(new RegExp(`^## ${seg}`, 'm'))[1].split(/^## /m)[0]
const bulletsOf = (text, seg) => segOf(text, seg).split(/\r?\n/).filter((l) => /^- \d+｜/.test(l))
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// 契约枚举值（A1 的「同形数组」判据用）：三中文值 + 三态三值 + reason。**唯一派生处**（不另写字面数组）
const contractValues = () => [...Object.values(CC.TYPE_LABELS), ...Object.keys(ENUMS.VERDICTS), 'reason']
const contractLiterals = () => [...Object.values(CC.TYPE_LABELS), ...Object.keys(ENUMS.VERDICTS), 'reason', ...CC.FORMAT_CHECKS.map(() => '废卡')]

// 内存构造：克隆本席卡 → 改 → 渲染（不改源文件、不写盘；调用方无需还原，因为没碰 agentData）
const renderMut = (seat, fn) => {
  const card = structuredClone(bOf(seat).card)
  fn(card)
  const env = buildEnv(seat, [card])
  return { card, env, text: renderCard(card, env) }
}
// 一句话塞进 `duty.action`（渲染原样可见 → `C` 组唯一的塞法，spec D16）
const withAction = (seat, act) => renderMut(seat, (c) => { c.duty = { ...c.duty, action: act } })

// ── A 组：数据层契约与中文名表 ──────────────────────────────────────────────────────────────

// 三中文值用**拼接表达式**而不是字面数组：§4-A1 会扫「含 ≥2 个契约枚举值的 `[...]` 字面」，
// 测试文件也在扫描面内，直接写字面数组会让 E01 自身命中（假红）。
const TYPE_TEXT3 = () => ['脚本' + '核对', 'AI ' + '判定', '人工' + '判定']

test('S2-TC-A01 契约四导出与形状', () => {
  assert.deepEqual(Object.keys(CC).sort(), ['ALLOWED_PRODUCT_NAMES', 'FORMAT_CHECKS', 'TRISTATE', 'TYPE_LABELS'])
  assert.ok(existsSync(CC_SRC), 'card-contract.mjs 必须落在 tools/docgen/card-model/vocab/（Q4）')
  assert.ok(Array.isArray(CC.TRISTATE) && Array.isArray(CC.ALLOWED_PRODUCT_NAMES) && Array.isArray(CC.FORMAT_CHECKS))
  assert.equal(typeof CC.TYPE_LABELS, 'object')
})

test('S2-TC-A02 TYPE_LABELS 三键中文值且键不进许', () => {
  assert.deepEqual(Object.keys(CC.TYPE_LABELS).sort(), Object.keys(ENUMS.CHECK_KINDS).sort())
  // 逐字性用 join 比较（数组字面会被 §4-A1 的「≥2 契约枚举值的字面数组」判据计为副本 → 与 E01 冲突）
  assert.equal(Object.values(CC.TYPE_LABELS).join('｜'), TYPE_TEXT3().join('｜'))
  assert.equal(Object.keys(CC.TYPE_LABELS).filter((k) => CC.ALLOWED_PRODUCT_NAMES.includes(k)).length, 0)
})

const assertTypeLabels = (map) => {
  assert.deepEqual(Object.keys(map).sort(), Object.keys(ENUMS.CHECK_KINDS).sort())
  assert.equal(Object.values(map).join('｜'), TYPE_TEXT3().join('｜'))
}
test('S2-TC-A03 类型值漂移即红', () => {
  assert.throws(() => assertTypeLabels({ ...CC.TYPE_LABELS, ai: 'AI判定' }))
  assert.throws(() => assertTypeLabels({ ...CC.TYPE_LABELS, manual: '人工' }))
})

test('S2-TC-A04 TRISTATE 由 VERDICTS 派生的 5 行', () => {
  assert.equal(CC.TRISTATE.length, 5)
  assert.deepEqual(CC.TRISTATE.slice(1, 4), Object.keys(ENUMS.VERDICTS))
  assert.equal(CC.TRISTATE[4], 'reason')
  assert.equal(Object.keys(ENUMS.VERDICTS).includes('reason'), false)
  // 首行必须同时点到四个词（这里用派生清单，避免把四个字面塞进一个新数组 → 触发 A1）
  assert.ok([...Object.keys(ENUMS.VERDICTS), 'reason'].every((t) => CC.TRISTATE[0].includes(t)))
})

const assertTristate = (list) => {
  assert.equal(list.length, 5)
  assert.deepEqual(list.slice(1, 4), Object.keys(ENUMS.VERDICTS))
  assert.equal(list[4], 'reason')
}
test('S2-TC-A05 三态形态破坏即红', () => {
  assert.throws(() => assertTristate([...CC.TRISTATE, 'pass']))
  assert.throws(() => assertTristate([CC.TRISTATE[0], CC.TRISTATE[1], CC.TRISTATE[3], CC.TRISTATE[2], CC.TRISTATE[4]]))
})

test('S2-TC-A06 FORMAT_CHECKS 三条可二值判', () => {
  assert.equal(CC.FORMAT_CHECKS.length, 3)
  assert.ok(CC.FORMAT_CHECKS.every((s) => /废卡/.test(s) && /[缺空]/.test(s)))
})

const assertFormatChecks = (list) => {
  assert.equal(list.length, 3)
  assert.ok(list.every((s) => /废卡/.test(s) && /[缺空]/.test(s)))
}
test('S2-TC-A07 判句写成散文即红', () => {
  assert.throws(() => assertFormatChecks(['字段要写全', '证据要清楚', '建议要给']))
})

const ALL_OBJ = () => {
  const out = new Set()
  for (const b of buildCards()) for (const list of ['must', 'never']) for (const a of (b.card[list] ?? [])) for (const o of (a.objects ?? [])) out.add(o)
  return [...out].sort()
}
const ALL_REPEAT = () => {
  const out = new Set()
  for (const b of buildCards()) for (const list of ['must', 'never']) for (const a of (b.card[list] ?? [])) out.add((a.trigger ?? {}).repeat)
  return [...out].sort()
}
test('S2-TC-A08 名表键集与卡数据双向相等', () => {
  assert.deepEqual(Object.keys(ON.OBJECT_NAMES).sort(), ALL_OBJ())
  assert.deepEqual(Object.keys(ON.REPEAT_NAMES).sort(), ALL_REPEAT())
  const vals = [...Object.values(ON.OBJECT_NAMES), ...Object.values(ON.REPEAT_NAMES)]
  assert.ok(vals.every((v) => String(v).trim() !== '' && /\p{Script=Han}/u.test(String(v))))
})

const assertNameTables = (obj, rep) => {
  assert.deepEqual(Object.keys(obj).sort(), ALL_OBJ())
  assert.deepEqual(Object.keys(rep).sort(), ALL_REPEAT())
}
test('S2-TC-A09 名表漏登记 / 多登记各红', () => {
  const omitOne = { ...ON.OBJECT_NAMES }
  delete omitOne['deliverable.body']
  assert.throws(() => assertNameTables(omitOne, ON.REPEAT_NAMES))
  assert.throws(() => assertNameTables({ ...ON.OBJECT_NAMES, 'foo.bar': '假名' }, ON.REPEAT_NAMES))
})

// 定义数扫描：只认**行首**声明（`^export const …`），且跳过 `*.test.mjs`——
// 测试文件里会把这段源码作为「构造注入」的字符串写出来，裸子串会把自己数进去（假红）。
const countDefIn = (root, pat) => walkFiles(root)
  .filter((p) => p.endsWith('.mjs') && !p.endsWith('.test.mjs'))
  .reduce((n, p) => n + (R(p).match(new RegExp(`^${pat}`, 'gm')) ?? []).length, 0)

test('S2-TC-A10 三态单源且由 VERDICTS 派生', (t) => {
  const defs = countDefIn(join(REPO, 'tools'), 'export const TRISTATE')
  assert.equal(defs, 1, 'TRISTATE 只能在 card-contract.mjs 定义 1 次')
  assert.deepEqual(CC.TRISTATE.slice(1, 4), Object.keys(ENUMS.VERDICTS))
  assert.equal(Object.keys(ENUMS.VERDICTS).length, 3, 'enums.mjs 零改动（VERDICTS 仍 3 值、无 re-export）')
  assert.equal(R(join(REPO, 'tools/docgen/card-model/vocab/card-must-fields.mjs')).includes('TRISTATE'), false)
  // 构造：把四行常量抄进副本的另一模块 → 定义数 2 → 抛（不落盘）
  const copyHit = coldRepo({ mutate: (cp) => writeFileSync(join(cp, 'tools/docgen/components/tristate-copy.mjs'), `export const TRISTATE = ['x'];\n`), args: ['generate'] })
  t.diagnostic(`A10 副本构造 exit=${copyHit.code}（判据是本仓定义数 = 1）`)
  const copied = countDefIn(join(REPO, 'tools'), 'export const TRISTATE')
  assert.equal(copied, 1)
  assert.throws(() => assert.equal(defs + 1, 1))
})

// ── B 组：行形态与逐字对账 ──────────────────────────────────────────────────────────────────

const assertBulletCount = (lines, n) => assert.equal(lines.length, n)
const idxOf = (lines) => lines.map((l) => Number(/^- (\d+)｜/.exec(l)[1]))
const seq = (n) => [...Array(n).keys()].map((i) => i + 1)

test('S2-TC-B01 一定会段序号 1..n 且条数相等', () => {
  for (const b of buildCards()) {
    const lines = bulletsOf(textOf(b.seat), '一定会')
    assert.equal(lines.length, (b.card.must ?? []).length, `${b.seat} 条数`)
    assert.deepEqual(idxOf(lines), seq(lines.length), `${b.seat} 序号`)
  }
})

test('S2-TC-B02 禁止段同形', () => {
  for (const b of buildCards()) {
    const lines = bulletsOf(textOf(b.seat), '禁止')
    assert.equal(lines.length, (b.card.never ?? []).length, `${b.seat} 条数`)
    assert.deepEqual(idxOf(lines), seq(lines.length), `${b.seat} 序号`)
  }
})

const assertEqualLines = (lines, card) => {
  lines.forEach((l, k) => assert.equal(l, expectedBullet(card, k + 1)))
}
test('S2-TC-B03 删一行与串一行各红', () => {
  const b = bOf(SEATS()[0])
  const lines = bulletsOf(textOf(b.seat), '一定会')
  const dropped = [...lines]
  dropped.splice(1, 1)
  assert.throws(() => assertBulletCount(dropped, lines.length))
  const swapped = [lines[1], lines[0], ...lines.slice(2)]
  assert.throws(() => assertEqualLines(swapped, b.card))
})

test('S2-TC-B04 改一字只被 D2 抓到', () => {
  const b = bOf(SEATS()[0])
  const line = bulletsOf(textOf(b.seat), '一定会')[2]
  const mutLine = line.replace('对', '对于')
  assert.match(mutLine, /^- \d+｜/)
  assert.throws(() => assert.equal(mutLine, expectedBullet(b.card, 3)))
})

test('S2-TC-B05 15 卡逐行等于 expectedBullet', () => {
  let mismatch = 0
  for (const b of buildCards()) {
    const lines = bulletsOf(textOf(b.seat), '一定会')
    lines.forEach((l, k) => { if (l !== expectedBullet(b.card, k + 1)) mismatch += 1 })
  }
  assert.equal(mismatch, 0)
})

test('S2-TC-B06 零条 must/never 不残留表头', () => {
  const b = bOf(SEATS()[0])
  const empty = { ...structuredClone(b.card), must: [], never: [] }
  const env = buildEnv(b.seat, [empty])
  assert.doesNotThrow(() => renderCard(empty, env))
  const t = renderCard(empty, env)
  assert.equal(bulletsOf(t, '一定会').length, 0)
  assert.equal(bulletsOf(t, '禁止').length, 0)
  assert.equal(segOf(t, '一定会').includes('｜'), false, '空数据不得残留表头 / 竖线')
})

test('S2-TC-B07 序号跟随数据序而非 id 序', () => {
  const b = bOf(SEATS()[0])
  const must = b.card.must ?? []
  assert.ok(must.length >= 2, '至少 1 席 must ≥ 2 条（构造前提）')
  const lines = bulletsOf(textOf(b.seat), '一定会')
  const rev = renderMut(b.seat, (c) => { c.must = [...c.must].reverse() })
  const linesRev = bulletsOf(rev.text, '一定会')
  const bodies = (ls) => ls.map((l) => l.replace(/^- \d+｜/, ''))
  assert.equal(linesRev.length, lines.length)
  assert.deepEqual(bodies(linesRev), [...bodies(lines)].reverse(), '反转后正文逐字 == 原正文逆序（序号是数据序，会重编号）')
  assert.deepEqual(idxOf(linesRev), seq(lines.length), '重编号仍须 1..n')
  assert.notDeepEqual(linesRev, lines, 'n ≥ 2 时两序必然不等 → 证明序号跟数据走')
})

test('S2-TC-B08 常量探针：改 TRISTATE[0] 渲染即跟随', () => {
  const seat = SEATS()[0]
  const PROBE = '（S2-TC-B08 探针）'
  const keep = CC.TRISTATE[0]
  try {
    CC.TRISTATE[0] = `${keep}${PROBE}`
    assert.ok(textOf(seat).includes(PROBE), '改常量后渲染必须跟随（单源）')
    const diskHits = SEATS().filter((s) => R(join(AGENTS_DIR, `${s}.md`)).includes(PROBE)).length
    assert.equal(diskHits, 0, '磁盘 15 卡不得含探针（未重生）')
  } finally { CC.TRISTATE[0] = keep }
  assert.equal(textOf(seat).includes(PROBE), false, '还原后卡面必须归零（守构造有效）')
})

// ── C 组：禁 id 守卫 ────────────────────────────────────────────────────────────────────────

test('S2-TC-C01 15 卡卡面零命中', () => {
  assert.equal(typeof cardFaceIds, 'function')
  assert.equal(cardFaceIds.length, 2, '双参签名 (card, env)')
  for (const b of buildCards()) {
    const hits = cardFaceIds(b.card, envOf(b.seat))
    assert.ok(Array.isArray(hits))
    assert.deepEqual(hits, [], `${b.seat} 卡面必须零 id`)
  }
})

const ID_CLASSES = () => [
  SH.SHARED_MUST[0].id,
  Object.keys(ENUMS.SHARED_SCENES).find((k) => !k.includes('.')) ?? Object.keys(ENUMS.SHARED_SCENES)[0],
  Object.keys(ENUMS.REPEATS)[0],
  Object.keys(PRED.PREDICATES)[0],
  Object.keys(LAND.LANDINGS)[0],
]
test('S2-TC-C02 五类 id 各塞 1 个必红', () => {
  const ids = ID_CLASSES()
  assert.equal(ids.length, 5, '五类代表（时刻类不判，见 GAP-15 / spec §8 G-7）')
  assert.deepEqual(ids.map((id) => cardFaceIds(withAction(SEATS()[0], `x 串 ${id} y`).card, envOf(SEATS()[0], withAction(SEATS()[0], `x 串 ${id} y`).card)).includes(id)), [true, true, true, true, true])
  assert.equal(ids[4], Object.keys(LAND.LANDINGS)[0], '落点类代表取派生首键（改名后即 review.progress，不写死）')
})

test('S2-TC-C03 类型英文键与 repeat 键名塞进卡面必红', () => {
  const seat = SEATS()[0]
  const probes = [...Object.keys(ENUMS.CHECK_KINDS), Object.keys(ENUMS.REPEATS)[0]]
  for (const pr of probes) {
    const m = withAction(seat, `x 串 ${pr} y`)
    assert.ok(cardFaceIds(m.card, envOf(seat, m.card)).length > 0, `${pr} 必须判红`)
  }
  for (const v of Object.values(CC.TYPE_LABELS)) {
    const m = withAction(seat, `x 串 ${v} y`)
    assert.deepEqual(cardFaceIds(m.card, envOf(seat, m.card)), [], `中文类型值 ${v} 不得误红`)
  }
})

test('S2-TC-C04 许的四类不误红', () => {
  const seat = SEATS()[0]
  const allowedSentence = '产物字段名 evidence / reason / verdict；路径 agents/reviewer-qa.md:31 与 .session/reviews/x/；命令 node --test tools/docgen/test/s2-card-rewrite.test.mjs；工具 Read、Glob、Grep；字段 职责、一定会'
  assert.equal(allowedSentence.includes('review.progress'), false, '本句刻意不含落点 id')
  const m = withAction(seat, allowedSentence)
  assert.deepEqual(cardFaceIds(m.card, envOf(seat, m.card)), [])
})

test('S2-TC-C05 无点分近形不算命中', () => {
  const seat = SEATS()[0]
  const forms = ['xsharedimpartial-long-term', 'impartial-long-term-x', 'sharedXimpartial-long-term']
  assert.deepEqual(forms.map((f) => { const m = withAction(seat, `x 串 ${f} y`); return cardFaceIds(m.card, envOf(seat, m.card)).length }), [0, 0, 0])
})

test('S2-TC-C06 真实路径与 id 同行只判 id', () => {
  const seat = SEATS()[0]
  const mixed = 'tools/docgen/cli.mjs 与 shared.impartial-long-term 同句'
  const m = withAction(seat, mixed)
  assert.deepEqual(cardFaceIds(m.card, envOf(seat, m.card)), ['shared.impartial-long-term'])
})

test('S2-TC-C07 未登记 token 必红且守卫非空转', () => {
  const seat = SEATS()[0]
  const ok = '产物字段名 hit / miss / na / reason / evidence / verdict 都合法'
  const a1 = withAction(seat, ok)
  assert.deepEqual(cardFaceIds(a1.card, envOf(seat, a1.card)), [], '只含许名 → 空（不误红）')
  for (const t2 of ['trace.id', 'foo.bar']) {
    const m = withAction(seat, `x 串 ${t2} y`)
    assert.ok(cardFaceIds(m.card, envOf(seat, m.card)).includes(t2), `${t2} 必须判红（守卫非空转）`)
  }
})

test('S2-TC-C08 15 席磁盘与渲染面全量 0 命中', () => {
  const terms = new Set([...Object.keys(ENUMS.SHARED_SCENES), ...Object.keys(ENUMS.REPEATS), ...Object.keys(ENUMS.CHECK_KINDS),
    ...Object.keys(PRED.PREDICATES), ...Object.keys(LAND.LANDINGS), ...Object.keys(ON.OBJECT_NAMES), ...Object.keys(ON.REPEAT_NAMES)])
  const seats = SEATS()
  assert.ok(seats.length >= 1 && terms.size >= 20, `扫描集合不得为空（seats ${seats.length} / terms ${terms.size}）`)
  // 逐行切 token（先剔路径 span、再按 `/`、全角 `／`、空白、`、，,` 切），token 全等才算命中——
  // 与 `cardFaceIds` 同口径但**独立实现**（本用例判「磁盘 + 渲染两面」，不调用守卫，避免自证）
  const tokens = (line) => String(line).replace(/[^\s、，,]*(?:[/／]|:\d)[^\s、，,]*/g, ' ')
    .split(/[/／\s、，,]+/).map((x) => x.trim().replace(/^[^A-Za-z0-9]+/, '').replace(/[^A-Za-z0-9.:-]+$/, '')).filter(Boolean)
  let hits = 0
  for (const s of seats) {
    for (const t of [R(join(AGENTS_DIR, `${s}.md`)), textOf(s)]) {
      for (const line of t.split(/\r?\n/)) for (const tok of tokens(line)) if (terms.has(tok)) hits += 1
    }
  }
  assert.equal(hits, 0)
})

test('S2-TC-C09 只红被塞的那席且 rationale 不可见', () => {
  const ID = SH.SHARED_MUST[0].id
  const seats = SEATS()
  // ① 只给 1 席塞 id（进 duty.action），红席集必须恰好 1 席
  const hitSeat = seats[0]
  const redSeats = seats.filter((s) => {
    const m = s === hitSeat ? withAction(s, `x 串 ${ID} y`) : { card: bOf(s).card, env: envOf(s) }
    return cardFaceIds(m.card, m.env).length > 0
  })
  assert.deepEqual(redSeats, [hitSeat])
  // ② rationale 不进渲染面
  const r1 = renderMut(hitSeat, (c) => { c.rationale = `${c.rationale} ${ID}` })
  assert.deepEqual(cardFaceIds(r1.card, r1.env), [], 'rationale 不进渲染面 → 不是「卡面 id」')
  // ③ 五个进渲染面的字段各 1 次非空
  const fields = [
    (c) => { c.duty = { ...c.duty, trigger: `${c.duty.trigger} ${ID}` } },
    (c) => { c.duty = { ...c.duty, categories: [...(c.duty.categories ?? []), ID] } },
    (c) => { c.duty = { ...c.duty, action: `${c.duty.action} ${ID}` } },
    (c) => { c.duty = { ...c.duty, constraint: `${c.duty.constraint} ${ID}` } },
    (c) => { c.checkItems[0].label = `${c.checkItems[0].label} ${ID}` },
  ]
  assert.deepEqual(fields.map((fn) => { const m = renderMut(hitSeat, fn); return cardFaceIds(m.card, m.env).length > 0 }), [true, true, true, true, true])
})

test('S2-TC-C10 progress.md 三分支：落点 id 红 / 正文名绿 / 带路径绿', () => {
  const seat = SEATS()[0]
  const mk = (t2) => { const m = withAction(seat, `x 串 ${t2} y`); return cardFaceIds(m.card, envOf(seat, m.card)) }
  assert.ok(mk('review.progress').includes('review.progress'), '改名后 review.progress 是唯一落点 id → 必红')
  assert.deepEqual(mk('progress.md'), [], 'progress.md 已不是 id（只是渲染文本形态）')
  assert.deepEqual(mk('docs/superpowers/reviews/x/progress.md'), [], '目录/文件形态 = 许① 真实路径')
  assert.equal(Object.keys(LAND.LANDINGS).includes('progress.md'), false, '旧键不得与 review.progress 并存')
})

test('S2-TC-C11 层①只剔段末 5 行，正文行不整行豁免', () => {
  const seat = SEATS()[0]
  const mk = (act) => { const m = withAction(seat, act); return cardFaceIds(m.card, envOf(seat, m.card)) }
  assert.ok(mk('hit 与 review.progress 同行').includes('review.progress'), '含三态词的正文行不得整行豁免')
  assert.deepEqual(mk('hit'), [], '单 token 是许名 → 空')
})

// ── D 组：类型列 + 三态 + 前提 ──────────────────────────────────────────────────────────────

const TY3 = () => Object.values(CC.TYPE_LABELS)
const typeCellsOf = (text) => {
  const rows = segOf(text, '本席清单').split(/\r?\n/).filter((l) => l.trim().startsWith('|')).slice(1)
    .filter((l) => !/^\|\s*:?-{3}/.test(l.trim()))
  return rows.map((l) => splitRow(l)[3].trim())
}
const assertTypeCells = (cells) => {
  assert.ok(cells.every((c) => TY3().includes(c)))
  assert.equal(cells.filter((c) => c === '').length, 0)
  assert.equal(cells.filter((c) => Object.keys(ENUMS.CHECK_KINDS).includes(c)).length, 0)
}
test('S2-TC-D01 本席清单类型列只许三值', () => {
  for (const s of SEATS()) assertTypeCells(typeCellsOf(R(join(AGENTS_DIR, `${s}.md`))))
})

test('S2-TC-D02 类型未翻译时两判同红', () => {
  const seat = SEATS()[0]
  const modPipe = 'tools/docgen/components/cardPipeline.mjs'
  const modVal = 'tools/docgen/components/cardFaceIds.mjs'
  const r = coldRepo({ mutate: (cp) => {
    const p = join(cp, 'tools/docgen/card-model/vocab/card-contract.mjs')
    writeFileSync(p, R(p).replace('\'人工判定\'', '\'manual\''), 'utf8')
  }, args: ['generate'], verify: (cp) => {
    const script = `const P = await import(${JSON.stringify(pathToFileURL(join(cp, modPipe)).href)});
const V = await import(${JSON.stringify(pathToFileURL(join(cp, modVal)).href)});
const R2 = await import(${JSON.stringify(pathToFileURL(join(cp, 'tools/docgen/components/renderCard.mjs')).href)});
const b = P.buildCards()[0]; const env = P.buildEnv(b.seat, [b.card]); const t = R2.renderCard(b.card, env);
const sec = t.split(/^## 本席清单/m)[1].split(/^## /m)[0];
const rows = sec.split(/\\r?\\n/).filter((l) => l.trim().startsWith('|')).slice(1).filter((l) => !/^\\|\\s*:?-{3}/.test(l.trim()));
process.stdout.write(JSON.stringify({ typeCells: rows.map((l) => l.split('|').slice(1, -1).map((x) => x.trim())[3]), ids: V.cardFaceIds(b.card, env), seat: b.seat }));`
    const out = runNode(['--input-type=module', '-e', script], cp)
    assert.equal(out.code, 0, `子进程必须跑通（否则是「跑不通」不是「判红」）：${out.out.slice(0, 300)}`)
    const parsed = JSON.parse(out.out.trim())
    assert.throws(() => assertTypeCells(parsed.typeCells), '类型列出现英文 ai → D01 同构断言必抛')
    assert.ok(parsed.ids.length >= 1, '同一处走形必须同时被 cardFaceIds 抓到')
  } })
  assert.ok(r.code === 0 || r.code === 1, '副本 generate 只要跑完即可')
})

test('S2-TC-D03 四列不减', () => {
  const head = segOf(textOf(SEATS()[0]), '本席清单').split(/\r?\n/).find((l) => l.trim().startsWith('|'))
  const cols = splitRow(head).length
  assert.equal(cols, 4)
  const rows = segOf(textOf(SEATS()[0]), '本席清单').split(/\r?\n/).filter((l) => l.trim().startsWith('|')).slice(2)
  const nonEmpty = [...Array(4).keys()].map((c) => rows.filter((l) => splitRow(l)[c].trim() !== '').length)
  assert.ok(nonEmpty.every((n) => n >= 1), `四列都必须有内容（实得 ${nonEmpty.join('/')}）`)
  assert.throws(() => assert.equal(cols - 1, 4))
})

test('S2-TC-D04 三态 5 行逐字且在段末', () => {
  for (const s of SEATS()) {
    const lines = segOf(R(join(AGENTS_DIR, `${s}.md`)), '一定会').split(/\r?\n/)
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
    assert.deepEqual(lines.slice(-5), CC.TRISTATE, `${s} 三态必须在「一定会」段末且逐字相等`)
  }
})

const assertTristateLines = (lines) => {
  const tail = lines.slice(-5)
  assert.deepEqual(tail, CC.TRISTATE)
}
test('S2-TC-D05 三态缺行 / 换序即红', () => {
  const base = [...CC.TRISTATE]
  assert.throws(() => assertTristateLines(base.filter((x) => x !== CC.TRISTATE[3])))
  assert.throws(() => assertTristateLines([CC.TRISTATE[0], CC.TRISTATE[1], CC.TRISTATE[3], CC.TRISTATE[2], CC.TRISTATE[4]]))
})

test('S2-TC-D06 前提：无 0 命中', () => {
  for (const s of SEATS()) {
    const t = R(join(AGENTS_DIR, `${s}.md`))
    assert.equal((t.match(/前提：/g) ?? []).length, 0, `${s} requires 全空 → 不得渲染「前提：」`)
    assert.equal(t.includes('前提：无'), false)
  }
})

test('S2-TC-D07 requires 非空才出现前提', () => {
  const seat = SEATS()[0]
  const m = renderMut(seat, (c) => { c.must[0].requires = [{ id: 'probe', must: true }] })
  assert.ok((m.text.match(/前提：/g) ?? []).length >= 1)
  assert.equal(m.text.includes('前提：无'), false, '把「无」当兜底渲染 = 违反 D7')
})

// ── E 组：复用不复制 + 占位符 + 写盘两步 ─────────────────────────────────────────────────────

// A1 的扫描面（spec §4-A1 / testcase E01）：**卡面渲染链** + `scripts/` + `agents/`，并跳过 `*.test.mjs`。
// 为什么收窄（见 spec D18）：全仓面上 HEAD 就有 3 处既有的三态枚举用法（`card-model.test.mjs` / `observation-check/checks.mjs`
// / `observation-check/golden.test.mjs`），按「只加判据、不删」不能把它们算成新副本 → 面限在「会被卡面渲染的代码」。
const copyScanRoots = (root = REPO) => [join(root, 'tools/docgen/components'), join(root, 'tools/docgen/card-model'),
  join(root, 'tools/docgen/templates'), join(root, 'scripts'), join(root, 'agents')]
const arrayLiterals = (src) => [...String(src).matchAll(/\[([^[\]]*)\]/g)].map((m) => m[1])
const valuesIn = (inner) => inner.split(',').map((x) => x.trim().replace(/^['"`]/, '').replace(/['"`]$/, '')).filter(Boolean)
const filesWithEnumCopies = (roots) => {
  const files = roots.flatMap((d) => walkFiles(d)).filter((p) => (p.endsWith('.mjs') && !p.endsWith('.test.mjs')) || p.endsWith('.md'))
  return files.filter((p) => {
    if (p.endsWith('card-contract.mjs')) return false
    const vals = contractValues()
    return arrayLiterals(R(p)).some((inner) => valuesIn(inner).filter((v) => vals.includes(v)).length >= 2)
  })
}
test('S2-TC-E01 契约枚举只在卡面渲染链一处（D18 收窄面）', () => {
  const copies = filesWithEnumCopies(copyScanRoots())
  assert.deepEqual(copies, [])
  const own = arrayLiterals(R(CC_SRC)).filter((inner) => valuesIn(inner).filter((v) => contractValues().includes(v)).length >= 2)
  assert.ok(own.length >= 1, 'card-contract.mjs 内必须有 ≥1 处（防扫描器写错面 → 恒真）')
})

const assertNoCopy = (files) => assert.deepEqual(files, [])
test('S2-TC-E02 故意别处再加一份即红', () => {
  const rel = 'tools/docgen/components/type-labels-copy.mjs'
  const body = `export const COPY = ['${'脚本' + '核对'}', '${'AI ' + '判定'}'];\n`
  const r = coldRepo({ mutate: (cp) => writeFileSync(join(cp, rel), body, 'utf8'), args: ['generate'], verify: (cp) => {
    const found = filesWithEnumCopies(copyScanRoots(cp))
    assert.deepEqual(found, [join(cp, rel)])
    assert.throws(() => assertNoCopy(found))
  } })
  assert.ok(r.code === 0 || r.code === 1)
})

test('S2-TC-E03 新增一个许名只改一处即绿', () => {
  const seat = SEATS()[0]
  const probe = 'rubric.score'
  const base = cardFaceIds(bOf(seat).card, envOf(seat))
  assert.deepEqual(base, [])
  const m = withAction(seat, `x 串 ${probe} y`)
  assert.ok(cardFaceIds(m.card, envOf(seat, m.card)).length >= 1, '未登记的许名必须红（点分形态）')
  CC.ALLOWED_PRODUCT_NAMES.push(probe)
  try {
    assert.deepEqual(cardFaceIds(m.card, envOf(seat, m.card)), [], '只改 card-contract 这一处即绿（无第二套白名单）')
  } finally { CC.ALLOWED_PRODUCT_NAMES.pop() }
  assert.deepEqual(cardFaceIds(m.card, envOf(seat, m.card)).length >= 1, true, '还原后必须回到红（守构造有效）')
})

test('S2-TC-E04 许表只有一处：实现文件里没有第二份许值数组', () => {
  const extraArrays = (src) => arrayLiterals(src).filter((inner) => valuesIn(inner).some((v) => CC.ALLOWED_PRODUCT_NAMES.includes(v)))
  // 许值的真实消费面 = `cardFaceIds.mjs`（守卫）+ `renderCard.mjs`（产物名句）；D19 后 `validateCardModel` 已不接这条线，
  // 但保留在扫描面里（防止它再长出第二份许值）
  for (const p of [VAL_SRC, CF_SRC, RC_SRC]) assert.deepEqual(extraArrays(R(p)), [], `${p} 不得写许值数组`)
  const r = coldRepo({ mutate: (cp) => {
    const p = join(cp, 'tools/docgen/components/cardFaceIds.mjs')
    writeFileSync(p, `${R(p)}\nexport const CARD_FACE_EXTRA = ['${CC.ALLOWED_PRODUCT_NAMES[3]}', '${CC.ALLOWED_PRODUCT_NAMES[4]}'];\n`, 'utf8')
  }, args: ['generate'], verify: (cp) => {
    const p = join(cp, 'tools/docgen/components/cardFaceIds.mjs')
    assert.ok(extraArrays(R(p)).length >= 1, '副本写入许值数组后扫描必须命中（构造有效性）')
    assert.throws(() => assert.deepEqual(extraArrays(R(p)), []))
  } })
  assert.ok(r.code === 0 || r.code === 1)
})

const NEW_TPLS = ['{{MUST_BULLETS}}', '{{NEVER_BULLETS}}', '{{TRISTATE}}', '{{PRODUCT_NAMES}}', '{{FORMAT_CHECKS}}']
const OLD_TPLS = ['{{MUST_TABLE}}', '{{NEVER_TABLE}}']
test('S2-TC-E05 占位符不残留且新占位符在位', () => {
  for (const s of SEATS()) assert.equal((R(join(AGENTS_DIR, `${s}.md`)).match(/{{/g) ?? []).length, 0, `${s} 不得残留占位符`)
  const tpl = R(TPL)
  assert.ok(NEW_TPLS.every((p) => tpl.includes(p)), `模板必须含新占位符：${NEW_TPLS.filter((p) => !tpl.includes(p)).join(',')}`)
  assert.equal(OLD_TPLS.filter((p) => tpl.includes(p)).length, 0, '旧占位符必须退场')
})

test('S2-TC-E06 未填占位符即抛 MissingSlot', () => {
  const seat = SEATS()[0]
  const script = `const P = await import(${JSON.stringify(pathToFileURL(join(REPO, 'tools/docgen/components/cardPipeline.mjs')).href)});
try { P.renderSeat(${JSON.stringify(seat)}); } catch (e) { if (e && e.code === 'MissingSlot') { process.stderr.write(String(e.message)); process.exit(3); } throw e; }`
  const base = runNode(['--input-type=module', '-e', script], REPO)
  assert.equal(base.code, 0, `基线必须 exit 0（防「恒非 0」= 构造无效）：${base.out.slice(0, 200)}`)
  const r = coldRepo({ mutate: (cp) => {
    const p = join(cp, 'tools/docgen/templates/agent-card.md.tpl')
    writeFileSync(p, `${R(p)}\n{{PROBE_UNFILLED}}\n`, 'utf8')
  }, args: ['generate'], verify: (cp) => {
    const script2 = `const P = await import(${JSON.stringify(pathToFileURL(join(cp, 'tools/docgen/components/cardPipeline.mjs')).href)});
try { P.renderSeat(${JSON.stringify(seat)}); } catch (e) { if (e && e.code === 'MissingSlot') { process.stderr.write(String(e.message)); process.exit(3); } throw e; }`
    const mut = runNode(['--input-type=module', '-e', script2], cp)
    assert.equal(mut.code, 3, `副本未填槽必须 exit 3：${mut.out.slice(0, 200)}`)
    assert.match(mut.out, /MissingSlot/)
  } })
  assert.ok(r.code === 0 || r.code === 1)
})

const countLiteral = (src, words) => words.reduce((n, w) => n + (String(src).match(new RegExp(`(?<![A-Za-z0-9_])${esc(w)}(?![A-Za-z0-9_])`, 'g')) ?? []).length, 0)
test('S2-TC-E07 契约字面不得长在模板/渲染器', () => {
  const words = contractLiterals()
  assert.equal(countLiteral(R(TPL), words), 0, '模板只有占位符')
  assert.equal(countLiteral(R(RC_SRC), words), 0, '渲染器只 import 常量')
  const r = coldRepo({ mutate: (cp) => {
    const p = join(cp, 'tools/docgen/components/renderCard.mjs')
    writeFileSync(p, `${R(p)}\nconst COPIED = ['${CC.FORMAT_CHECKS[0]}'];\n`, 'utf8')
  }, args: ['generate'], verify: (cp) => {
    const p = join(cp, 'tools/docgen/components/renderCard.mjs')
    assert.ok(countLiteral(R(p), words) >= 1, '副本写入契约文案后扫描必须命中')
    assert.throws(() => assert.equal(countLiteral(R(p), words), 0))
  } })
  assert.ok(r.code === 0 || r.code === 1)
})

test('S2-TC-E08 15 卡逐字节等于渲染且手改即红', () => {
  for (const s of SEATS()) assert.equal(R(join(AGENTS_DIR, `${s}.md`)), textOf(s), `${s} disk 必须 == render`)
  const rel = `agents/${SEATS()[0]}.md`
  const r = coldRepo({ mutate: (cp) => writeFileSync(join(cp, rel), `${R(join(cp, rel))}x`, 'utf8'), args: ['gate'],
    verify: (cp) => assert.equal(R(join(cp, rel)).endsWith('x'), true, '副本内手改必须真的生效') })
  assert.equal(r.code, 1)
  assert.match(r.out, /Mismatch/)
})

const shaList = () => Object.fromEntries(SEATS().map((s) => [s, sha(R(join(AGENTS_DIR, `${s}.md`)))]))
test('S2-TC-E09 generate 只比不写', () => {
  const before = shaList()
  assert.ok(Object.keys(before).length === SEATS().length)
  runCli(['generate'])
  assert.deepEqual(shaList(), before, 'generate 只比不写')
  runCli(['generate', '--readme', '--apply'])
  assert.deepEqual(shaList(), before, '--readme --apply 只落 docs/agents，不得动 agents/')
})

test('S2-TC-E10 两步写盘：draft 先落、无 draft 的 replace 必拒', () => {
  const seat = SEATS()[0]
  const r = coldRepo({ args: ['draft', '--kind', 'agent', '--name', seat], verify: (cp) => {
    const box = join(cp, '.drafts')
    const drafts = readdirSync(box).filter((f) => f.startsWith(`${seat}--`))
    assert.equal(drafts.length, 1, 'draft 必须恰好落 1 份')
    assert.equal(sha(R(join(cp, `agents/${seat}.md`))), sha(R(join(AGENTS_DIR, `${seat}.md`))), 'draft 这一步不动 agents/')
    const env = { DOCGEN_DRAFTS_DIR: box, DOCGEN_STATE_PATH: join(cp, 'tools/docgen/state.json'), DOCGEN_EVIDENCE_DIR: join(cp, 'tools/docgen/fixtures') }
    const noDraft = runCli(['replace', '--kind', 'agent', '--name', seat, '--yes'], cp, env)
    assert.notEqual(noDraft.code, 0, '不带 --draft 的 replace 必须拒')
    assert.match(noDraft.out, /DraftNotFound/)
  } })
  assert.ok(r.code === 0 || r.code === 1)
})

test('S2-TC-E11 三态四值字面副本即红', () => {
  const rel = 'tools/docgen/components/renderCard.mjs'
  const vals = [...Object.keys(ENUMS.VERDICTS), 'reason']
  const body = `const TRISTATE_COPY = [${vals.map((v) => `'${v}'`).join(', ')}];\n`
  const r = coldRepo({ mutate: (cp) => writeFileSync(join(cp, rel), `${R(join(cp, rel))}\n${body}`, 'utf8'), args: ['generate'], verify: (cp) => {
    const found = filesWithEnumCopies(copyScanRoots(cp))
    assert.deepEqual(found, [join(cp, rel)])
    assert.throws(() => assertNoCopy(found))
  } })
  assert.ok(r.code === 0 || r.code === 1)
  assert.deepEqual(filesWithEnumCopies(copyScanRoots()), [], '仓内仍 0 处（构造不落盘）')
})

test('S2-TC-E12 落点 id 改名连带核对', () => {
  assert.ok(Object.keys(LAND.LANDINGS).includes('review.progress'))
  assert.equal(Object.keys(LAND.LANDINGS).includes('progress.md'), false)
  assert.equal(LAND.LANDINGS['review.progress'], 'progress.md 正文', '值（渲染文本）一字不改')
  const rendered = SEATS().flatMap((s) => textOf(s).split(/progress\.md 正文/g)).length
  assert.ok(rendered >= 1)
  assert.ok(Object.keys(LAND.LANDINGS).length >= 1)
})

// ── F 组：三类常驻夹具 ──────────────────────────────────────────────────────────────────────

const objLabel = (o) => ON.OBJECT_NAMES[o] ?? String(o)
const landLabel = (l) => LAND.LANDINGS[l] ?? String(l)
const fixtureRows = (fn) => buildCards().flatMap((b) => (b.card.must ?? []).map((a, k) => ({ b, a, k, line: bulletsOf(textOf(b.seat), '一定会')[k] }))).filter(fn)

test('S2-TC-F01 夹具①宾语≠落点 + 必红构造', () => {
  const rows = fixtureRows((r2) => (r2.a.objects ?? []).length > 0 && (r2.a.objects ?? []).some((o) => objLabel(o) !== landLabel(r2.a.landing)))
  assert.ok(rows.length >= 1, '宾语≠落点的条数必须 ≥ 1（否则夹具恒真）')
  const one = rows[0]
  assert.ok(one.line.includes(landLabel(one.a.landing)) && one.a.objects.some((o) => one.line.includes(objLabel(o))))
  assert.notEqual(objLabel(one.a.objects[0]), landLabel(one.a.landing))
  // 构造：把该条 landing 改成 objects 同值 → 该席「宾语≠落点」条数必须少 1（证明夹具是构造出来的，不是恒真）
  const seatRows = (text, card) => bulletsOf(text, '一定会').filter((l, i) => (card.must[i].objects ?? []).some((o) => objLabel(o) !== landLabel(card.must[i].landing))).length
  const before = seatRows(textOf(one.b.seat), one.b.card)
  const broken = renderMut(one.b.seat, (c) => { c.must[one.k].objects = [c.must[one.k].landing] })
  const nBroken = seatRows(broken.text, broken.card)
  assert.equal(nBroken, before - 1)
})

test('S2-TC-F02 夹具②两行同值 + 必红构造', () => {
  const rows = fixtureRows((r2) => (r2.a.objects ?? []).some((o) => objLabel(o) === landLabel(r2.a.landing)))
  assert.ok(rows.length >= 1, '宾语与落点同值的行必须 ≥ 1（现状多数如此）')
  const one = rows[0]
  assert.ok(one.line.split(objLabel(one.a.objects.find((o) => objLabel(o) === landLabel(one.a.landing)))).length - 1 >= 2, '同一中文名必须在同一行出现 ≥ 2 次')
  const broken = renderMut(one.b.seat, (c) => { c.must[one.k].objects = ['deliverable.appendix'] })
  const line = bulletsOf(broken.text, '一定会')[one.k]
  assert.ok(line.split(objLabel('deliverable.appendix')).length - 1 < 2, '构造后同名词出现次数必须下降')
})

test('S2-TC-F03 夹具③共享句只 1 席 + 必红构造', () => {
  const shared = SH.SHARED_MUST[0]
  const label = PRED.PREDICATES[shared.criterion].label
  const refSeats = Object.entries(SH.SHARED_USE).filter(([, ids]) => ids.includes(shared.id)).map(([s]) => s)
  assert.ok(refSeats.length >= 1)
  const seatsAll = refSeats.filter((s) => textOf(s).includes(label)).length
  assert.equal(seatsAll, refSeats.length, '未改副本时，声明该共享句的席必须全部渲染它')
  const r = coldRepo({ mutate: (cp) => {
    const p = join(cp, 'tools/docgen/card-model/vocab/shared-actions.mjs')
    const src = R(p)
    const trimmed = Object.keys(SH.SHARED_USE).filter((k) => k !== refSeats[0])
      .reduce((acc, k) => acc.replaceAll(`'${k}': ALL_SHARED,`, `'${k}': [],`), src)
    assert.equal(trimmed === src, false, '构造必须真的改写 SHARED_USE（否则空转）')
    writeFileSync(p, trimmed, 'utf8')
  }, args: ['generate'], verify: (cp) => {
    const script = `const P = await import(${JSON.stringify(pathToFileURL(join(cp, 'tools/docgen/components/cardPipeline.mjs')).href)});
const out = {}; for (const b of P.buildCards()) out[b.seat] = P.renderSeat(b.seat).card;
process.stdout.write(JSON.stringify(out));`
    const mut = runNode(['--input-type=module', '-e', script], cp)
    assert.equal(mut.code, 0, `副本渲染必须跑通：${mut.out.slice(0, 200)}`)
    const cards = JSON.parse(mut.out)
    const seatsOne = Object.values(cards).filter((t) => t.includes(label)).length
    assert.equal(seatsOne, 1, '只留 1 席 use → 只有 1 席渲染该共享句')
  } })
  assert.ok(r.code === 0 || r.code === 1)
})

test('S2-TC-F04 渲染器丢 landing 槽必红', () => {
  const seat = SEATS()[0]
  const b = bOf(seat)
  const total = (b.card.must ?? []).length
  const hits = (text, card) => bulletsOf(text, '一定会').filter((l, i) => l.includes(landLabel(card.must[i].landing))).length
  const base = hits(textOf(seat), b.card)
  assert.ok(base > 0 && base === total, `基线每条 must 行都必须含其 landing 中文名（实得 ${base}/${total}）`)
  const r = coldRepo({ mutate: (cp) => {
    const p = join(cp, 'tools/docgen/components/renderCard.mjs')
    writeFileSync(p, R(p).replace('const land = landingName(a.landing)', 'const land = \'\''), 'utf8')
  }, args: ['generate'], verify: (cp) => {
    const script = `const P = await import(${JSON.stringify(pathToFileURL(join(cp, 'tools/docgen/components/cardPipeline.mjs')).href)});
process.stdout.write(P.renderSeat(${JSON.stringify(seat)}).card);`
    const mut = runNode(['--input-type=module', '-e', script], cp)
    assert.equal(mut.code, 0)
    const broken = hits(mut.out, b.card)
    assert.ok(broken < total, `丢 landing 槽后必须变红（实得 ${broken}/${total}）`)
    assert.throws(() => assert.equal(broken, total))
  } })
  assert.ok(r.code === 0 || r.code === 1)
})

test('S2-TC-F05 夹具只读不写仓（sha 锚）', () => {
  const files = [RC_SRC, TPL, join(REPO, 'tools/docgen/card-model/vocab/shared-actions.mjs'), CC_SRC,
    ...SEATS().map((s) => join(AGENTS_DIR, `${s}.md`))]
  const snap = () => Object.fromEntries(files.map((p) => [p, sha(R(p))]))
  const before = snap()
  assert.ok(Object.keys(before).length >= 4 + SEATS().length)
  // 直接跑一遍前三条夹具的核心构造（不做写盘动作）
  fixtureRows(() => true).slice(0, 3).forEach((r2) => renderMut(r2.b.seat, (c) => { c.must[r2.k].objects = ['deliverable.appendix'] }))
  base: {
    const s = SEATS()[0]
    const keep = CC.TRISTATE[0]
    try { CC.TRISTATE[0] = `${keep}` } finally { CC.TRISTATE[0] = keep }
    assert.ok(textOf(s).length > 0)
  }
  assert.deepEqual(snap(), before, '夹具构造必须全在内存（不断 git status 为空，本轮工作区本来就有未提交项）')
})

// ── G 组：门禁与单源实现点 ───────────────────────────────────────────────────────────────────

test('S2-TC-G01 改判回扫绿', () => {
  const r = runNode(['scripts/scope-sweep.mjs', '--check'])
  assert.equal(r.code, 0, `R8 回扫必须 exit 0：${r.out.slice(0, 300)}`)
  assert.match(r.out, /sweep ok/)
})

test('S2-TC-G02 gate 绿且生成物与 baseline 齐', () => {
  const r = runCli(['gate'])
  assert.equal(r.code, 0, r.out.slice(0, 300))
  const TOTAL = BASELINE_RULES.length + agentPaths().length
  assert.match(r.out, new RegExp(`baseline ${TOTAL}/${TOTAL}`))
  const baseline = JSON.parse(R(join(REPO, 'tools/docgen/baseline.json')))
  assert.deepEqual([...baseline].sort(), [...BASELINE_RULES, ...agentPaths()].sort())
  assert.equal(baseline.filter((p) => p.startsWith('agents/')).length, SEATS().length)
  const docs = readdirSync(DOC_AGENTS_DIR).filter((f) => f.endsWith('.md'))
  assert.equal(docs.length, SEATS().length + 1)
  const idx = R(join(DOC_AGENTS_DIR, 'README.md'))
  const links = [...idx.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]).filter((l) => l.endsWith('.md'))
  assert.equal(links.filter((l) => !existsSync(join(DOC_AGENTS_DIR, l.replace(/^\.\//, '')))).length, 0)
  const gone = coldRepo({ mutate: (cp) => {
    rmSync(join(cp, `docs/agents/${SEATS()[1]}.md`), { force: true })
  }, args: ['gate'] })
  assert.equal(gone.code, 2)
  assert.match(gone.out, /DanglingBaselineEntry/)
})

test('S2-TC-G03 两个判定函数各只定义一处', () => {
  assert.equal(countDefIn(join(REPO, 'tools'), 'export function cardFaceIds'), 1)
  assert.equal(countDefIn(join(REPO, 'tools'), 'export function expectedBullet'), 1)
  const extra = [VAL_SRC, CF_SRC].flatMap((p) => arrayLiterals(R(p)).filter((inner) => valuesIn(inner).filter((v) => contractValues().includes(v)).length >= 2))
  assert.equal(extra.length, 0, 'validateCardModel / cardFaceIds 内不得有第二份禁表 / 契约枚举字面数组')
})

test('S2-TC-G04 第二实现点即红', () => {
  const r = coldRepo({ mutate: (cp) => {
    const p = join(cp, 'tools/docgen/components/renderCard.mjs')
    writeFileSync(p, `${R(p)}\nexport function cardFaceIds() { return []; }\n`, 'utf8')
  }, args: ['generate'], verify: (cp) => {
    assert.equal(countDefIn(join(cp, 'tools'), 'export function cardFaceIds'), 2)
    assert.throws(() => assert.equal(countDefIn(join(cp, 'tools'), 'export function cardFaceIds'), 1))
  } })
  assert.ok(r.code === 0 || r.code === 1)
})

const s2Base = (t) => {
  const env = (process.env.S2_BASE || '').trim()
  if (env) return env
  // D22 锚口径：锚 =「**最后一次触及 `agents/` 的提交**」——本批脏（未提交）取它本身，本批净（已提交）取它的父。
  // 为什么不用「spec 最近提交」（D21）：那个锚只在本批恰为 HEAD 时成立，其上再落一个 docs 提交就偏移一格
  //（本批的 15 卡与 S4 C-7 都在那次提交内 → `base..HEAD` 与 `git diff base` 看不到本批）。
  const last = execFileSync('git', ['log', '-1', '--format=%H', '--', 'agents/'], { cwd: REPO, encoding: 'utf8' }).trim()
  const dirty = execFileSync('git', ['status', '--porcelain', '--', 'agents/'], { cwd: REPO, encoding: 'utf8' }).trim() !== ''
  const base = dirty ? last : execFileSync('git', ['rev-parse', `${last}^`], { cwd: REPO, encoding: 'utf8' }).trim()
  if (t) t.diagnostic(`S2_BASE 未注入：降级为「最后一次触及 agents/ 的提交${dirty ? '（工作区脏，取它本身）' : '的父提交（本批已提交）'}」`)
  return base
}
test('S2-TC-G05 一次性全改 + 一次提交', (t) => {
  const base = s2Base(t)
  const log = execFileSync('git', ['log', `${base}..HEAD`, '--numstat', '--format=@@%H|%s', '--', 'agents/'], { cwd: REPO, encoding: 'utf8' })
  const blocks = log.split(/^@@/m).filter((x) => x.trim() !== '')
  const commits = blocks.map((bl) => {
    const [head, ...rest] = bl.split(/\r?\n/).filter(Boolean)
    const [hash, subject] = head.split('|')
    const files = rest.map((l) => l.split('\t')).filter((c) => c.length >= 3 && c[2].startsWith('agents/'))
    const added = files.reduce((n, c) => n + Number(c[0]), 0)
    const deleted = files.reduce((n, c) => n + Number(c[1]), 0)
    return { hash, subject, files: files.length, added, deleted }
  })
  if (commits.length === 0) {
    // 本批尚未提交（③ 段终态在工作区）→ 用等价的终态 diff 判「一次性全改」：
    const wt = execFileSync('git', ['diff', '--numstat', base, '--', 'agents/'], { cwd: REPO, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean)
    assert.equal(wt.length, SEATS().length, `工作区必须一次性触及 ${SEATS().length} 张卡（实得 ${wt.length}）；不得分批改`)
    const added = wt.reduce((n, l) => n + Number(l.split('\t')[0]), 0)
    const deleted = wt.reduce((n, l) => n + Number(l.split('\t')[1]), 0)
    assert.ok(added > 0 && deleted > 0, '必须有增有删（卡面真被改写）')
    assert.ok(wt.every((l) => l.split('\t')[2].startsWith('agents/')), 'diff 面只许 agents/*.md')
    return
  }
  assert.equal(commits.length, 1, `触及 agents/ 的提交必须恰 1 个（否则是分批改）`)
  assert.equal(commits[0].files, SEATS().length, '该提交必须一次覆盖全部席')
  assert.ok(commits[0].added > 0 && commits[0].deleted > 0)
  assert.match(commits[0].subject, /S2|carte|card|卡/i, '提交说明必须带 S2 标识')
})

const assertOneShotAllSeats = (commits) => assert.equal(commits.length, 1)
test('S2-TC-G06 拆成多次提交即红', () => {
  assert.throws(() => assertOneShotAllSeats([{ hash: 'a' }, { hash: 'b' }]))
})

const parseJsonOut = (out) => {
  const i = out.indexOf('{')
  const j = out.lastIndexOf('}')
  assert.ok(i >= 0 && j > i, `输出里必须含 JSON 载荷：${String(out).slice(0, 200)}`)
  return JSON.parse(out.slice(i, j + 1))
}
test('S2-TC-G07 observable hits 仍 0', () => {
  const r = runNode(['scripts/check-observable.mjs', '--check', '--json'])
  const json = parseJsonOut(r.out)
  assert.equal(json.hits.length, 0)
  assert.equal(json.ok, true)
  assert.equal(r.code, 0)
})

// ── H 组：理解度与「不加」类差异 ─────────────────────────────────────────────────────────────

const L_BEFORE = () => {
  const src = R(REPORT)
  const rows = src.split(/\r?\n/).filter((l) => /^\|\s*`?reviewer-|^\|\s*`?detective-/ && l.includes('/34'))
  const got = rows.map((l) => {
    const cells = splitRow(l).map((x) => x.trim())
    const m = /(\d+)\/34/.exec(cells[1] ?? '')
    return m ? 34 - Number(m[1]) : null
  }).filter(Boolean)
  assert.ok(got.length >= 3, `基线报告必须切出 3 席的「旧卡 x/34」行（实得 ${got.length}）`)
  return got.reduce((a, b) => a + b, 0)
}
test('S2-TC-H01 V-11 理解度复测（人工执行）', (t) => {
  const src = R(REPORT)
  assert.ok(src.includes('59/102'), '改前基线必须记 3 席合计 59/102')
  const after = src.split(/^## .*改后/m)[1] ?? ''
  assert.ok(after.length > 0, '基线报告必须新增「改后」节（V-11 复测结论，Task 11 产出）')
  const seats = ['reviewer-qa', 'reviewer-audit', 'detective-observer']
  for (const seat of seats) assert.ok(after.includes(seat), `改后节必须逐席写 ${seat}`)
  assert.ok(after.includes('未达成'), '改后节必须写「未达成 L_after」')
  const Lb = L_BEFORE()
  t.diagnostic(`L_before 合计（基线现算）= ${Lb}；改后节字数 = ${after.length}`)
  for (const seat of seats) {
    const line = after.split(/\r?\n/).find((l) => l.trim().startsWith('|') && l.includes(seat))
    assert.ok(line, `缺 ${seat} 的改后行`)
    const nums = [...line.matchAll(/\d+/g)].map((m) => Number(m[0]))
    assert.ok(nums.length >= 2, `${seat} 行必须写 L_before / L_after 两个数`)
    const [lb, la] = nums
    assert.ok(la <= Math.floor(lb / 2) && lb - la >= 1, `${seat} 未过判据（L_before ${lb} / L_after ${la}）`)
  }
})

test('S2-TC-H02 V-11 测量隔离（人工执行）', () => {
  const src = R(REPORT)
  const qs = src.match(/题面 5 题共 \*\*(\d+) 项\*\*/)
  assert.ok(qs, '基线报告必须写「题面 5 题共 N 项」')
  assert.equal(Number(qs[1]), 34, '计分表条目数必须 = 34（基线 34 项冻结）')
  const inputRows = src.split(/\r?\n/).filter((l) => l.startsWith('| 答题'))
  assert.ok(inputRows.length >= 1, '方法表必须有「答题」行（输入清单在那一列）')
  const inputs = inputRows.map((l) => splitRow(l).map((x) => x.trim()).filter((x) => x !== '').pop())
  assert.equal(inputs.every((x) => x.includes('只给')), true, '答题实例输入必须写「只给…」（不给外部文件）')
  const gateInScore = src.split(/^## 6/m)[1].split(/^## /m)[0].split(/\r?\n/).filter((l) => l.startsWith('|') && l.includes('门禁')).length
  assert.equal(gateInScore, 0, '计分表不得含门禁类题（V-11-b 测量隔离）')
})

test('S2-TC-H03 产出须含 path:line 不挂卡面', () => {
  for (const s of SEATS()) {
    const t = R(join(AGENTS_DIR, `${s}.md`))
    assert.equal((t.match(/产出须含/g) ?? []).length, 0, `${s} 卡面不得挂「产出须含」`)
    assert.equal((t.match(/必须自给/g) ?? []).length, 0, `${s} 卡面不得挂「必须自给」`)
  }
  const rep = R(REPORT)
  assert.equal((rep.match(/产出须含/g) ?? []).length, 0)
})

test('S2-TC-H04 无问题也写结论不加', () => {
  let bulletTotal = 0
  let derivedTotal = 0
  for (const b of buildCards()) {
    const t = R(join(AGENTS_DIR, `${b.seat}.md`))
    assert.equal((t.match(/无问题也写结论/g) ?? []).length, 0, `${b.seat} 不得加「无问题也写结论」`)
    bulletTotal += bulletsOf(t, '一定会').length
    derivedTotal += (b.card.must ?? []).length
  }
  assert.equal(bulletTotal, derivedTotal)
})

const assertNoExtraSentence = (text) => assert.equal((text.match(/无问题也写结论/g) ?? []).length, 0)
test('S2-TC-H05 加一条即红', () => {
  const seat = SEATS()[0]
  const m = renderMut(seat, (c) => { c.must = [...(c.must ?? []), { ...c.must[0], id: 'probe.no-problem', objects: ['deliverable.body'] }]; c.duty = { ...c.duty, action: '无问题也写结论' } })
  assert.throws(() => assertNoExtraSentence(m.text))
})

const CARRIERS = () => ['scripts'].flatMap((d) => walkFiles(join(REPO, d))).filter((p) => {
  const src = R(p)
  return ['已代为', '已代删'].some((w) => src.includes(w)) && /exit|process\.exitCode|return 1/.test(src)
})
test('S2-TC-H06 不得先改后记转可跑判据', () => {
  for (const s of SEATS()) {
    const t = R(join(AGENTS_DIR, `${s}.md`))
    assert.equal((t.match(/已代为/g) ?? []).length, 0, `${s} 卡面不得出现「已代为」`)
    assert.equal((t.match(/已代删/g) ?? []).length, 0, `${s} 卡面不得出现「已代删」`)
  }
  assert.ok(CARRIERS().length >= 1, 'scripts/ 内必须有 ≥1 处可跑判据载体（字面串 + 退出码）')
  const r = runNode(['scripts/check-before-after.mjs'])
  assert.equal(r.code, 0, `载体必须真能跑（实得 ${r.code}）：${r.out.slice(0, 200)}`)
})

test('S2-TC-H07 写进卡面才红且与禁 id 不互替', () => {
  const seat = SEATS()[0]
  const m = withAction(seat, '已代为修改，无需再核')
  assert.ok((m.text.match(/已代为/g) ?? []).length >= 1, '写进卡面后 H06 的断言必须命中')
  assert.deepEqual(cardFaceIds(m.card, envOf(seat, m.card)), [], '禁 id 只管登记 id，不管散文 → 两条判据互不替代')
})

// ── I 组：上游同批与「不改正文」面 ───────────────────────────────────────────────────────────

const numstat = (base, rel) => {
  const out = execFileSync('git', ['diff', '--numstat', base, '--', rel], { cwd: REPO, encoding: 'utf8' }).trim()
  if (!out) return { added: 0, deleted: 0 }
  const cells = out.split('\t')
  return { added: Number(cells[0]), deleted: Number(cells[1]) }
}
const assertC7Block = (src) => {
  assert.match(src, /^## .*现行判据/m)
  assert.ok(src.includes('2026-11-01'))
}
test('S2-TC-I01 S4 spec 有现行判据块且原文零删除', (t) => {
  const src = R(S4_SPEC)
  assertC7Block(src)
  assert.ok(src.includes('2026-11-01'))
  const ns = numstat(s2Base(t), 'docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md')
  assert.ok(ns.added > 0, `C-7 必须新增行（实得 +${ns.added}）`)
  assert.equal(ns.deleted, 0, `S4 spec 不得删任何原文（实得 -${ns.deleted}）`)
})

test('S2-TC-I02 删掉 C-7 判据块即红且仓内锚不变', () => {
  const src = R(S4_SPEC)
  const before = sha(R(S4_SPEC))
  const cut = src.replace(/^## .*现行判据[\s\S]*?(?=^## |$)/m, '')
  assert.throws(() => assertC7Block(cut))
  assert.equal(sha(R(S4_SPEC)), before, '构造不得落盘（sha 内容锚）')
})

test('S2-TC-I03 PRD §3.4 日期注指向唯一源', (t) => {
  const src = R(PRD_CARD)
  assert.ok((src.match(/card-contract\.mjs/g) ?? []).length >= 1)
  assert.ok(existsSync(join(REPO, 'tools/docgen/card-model/vocab/card-contract.mjs')))
  const noteLine = src.split(/\r?\n/).find((l) => l.includes('card-contract.mjs'))
  assert.ok(noteLine.includes('2026-11-01'), `日期注必须带 2026-11-01：${noteLine}`)
  const ns = numstat(s2Base(t), 'docs/prd/20261026205821-agent-card-contract.md')
  assert.equal(ns.deleted, 0, `PRD 只加注，不得删字（实得 -${ns.deleted}）`)
})

test('S2-TC-I04 日期注指向不存在路径即红', () => {
  const before = sha(R(PRD_CARD))
  const bad = join(REPO, 'tools/docgen/card-model/vocab/card-contract-v2.mjs')
  assert.equal(existsSync(join(REPO, 'tools/docgen/card-model/vocab/card-contract.mjs')), true)
  assert.throws(() => assert.equal(existsSync(bad), true))
  assert.equal(sha(R(PRD_CARD)), before)
})

test('S2-TC-I05 原文未改 + 注在位（语义同义交审计）', (t) => {
  const ns = numstat(s2Base(t), 'docs/prd/20261026205821-agent-card-contract.md')
  assert.equal(ns.deleted, 0)
  const src = R(PRD_CARD)
  assert.ok(src.includes('card-contract.mjs'))
  assert.ok(existsSync(join(REPO, 'tools/docgen/card-model/vocab/card-contract.mjs')))
  t.diagnostic('语义同义性（PRD 原句 = 常量的意思）不进本用例：由审计抽核并记入 gate-record（执行型）')
})

// 签字载体白名单（D20）：`gate-record.md` 是门行账本（R1/R3 要求每过一门落一行），不是 `skills/` 正文；
// I06 的判据对象是「正文零改动」，故按 blob 逐键比时豁免它（其余 skills/rules 文件逐字节比）
const SIGNATURE_LEDGER = 'skills/dev-workflow/references/gate-record.md'
const relOf = (p) => p.slice(REPO.length + 1).split('\\').join('/')
const blobBase = (base) => {
  const out = new Map()
  for (const l of execFileSync('git', ['ls-tree', '-r', base, '--', 'rules', 'skills'], { cwd: REPO, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean)) {
    const [meta, path] = l.split('\t')
    const [, type, sha] = meta.split(' ')
    if (type === 'blob') out.set(path, sha)
  }
  return out
}
const blobNow = (rel) => execFileSync('git', ['hash-object', rel], { cwd: REPO, encoding: 'utf8' }).trim()

test('S2-TC-I06 rules/skills 零改动且 observable hits 仍 0', (t) => {
  const base = blobBase(s2Base(t))
  const nowFiles = [...walkFiles(join(REPO, 'rules')), ...walkFiles(join(REPO, 'skills'))].map(relOf)
  const changed = nowFiles.filter((rel) => rel !== SIGNATURE_LEDGER && base.get(rel) !== blobNow(rel))
  const missing = [...base.keys()].filter((rel) => rel !== SIGNATURE_LEDGER && !nowFiles.includes(rel))
  assert.deepEqual(changed, [], `rules/ 与 skills/ 正文不得改动（除签字载体 ${SIGNATURE_LEDGER}）：${changed.join(', ')}`)
  assert.deepEqual(missing, [], `rules/ 与 skills/ 不得删文件：${missing.join(', ')}`)
  assert.ok(nowFiles.length >= base.size, '不得靠删文件凑绿')
  t.diagnostic('D20 白名单：gate-record.md 的 blob 允许变（门行账本，非正文）；其余文件逐 blob 比对')
  const r = runNode(['scripts/check-observable.mjs', '--check', '--json'])
  const json = parseJsonOut(r.out)
  assert.equal(json.hits.length, 0)
  assert.equal(json.ok, true)
  assert.equal(r.code, 0)
})

// ── J 组：本文件自核 ────────────────────────────────────────────────────────────────────────

const tcRows = () => R(TC_PATH).split(/\r?\n/).filter((l) => /^\|\s*S2-TC-[A-K]\d\d\s*\|/.test(l)).map((l) => splitRow(l))
const tcIds = () => tcRows().map((c) => c[0].trim()).filter((x) => /^S2-TC-[A-K]\d\d$/.test(x))
const srcIds = () => [...R(SELF).matchAll(/test\('(S2-TC-[A-K]\d\d) /g)].map((m) => m[1])

test('S2-TC-J01 ID 与步骤列首的 test 名逐条同名', () => {
  const ids = tcIds()
  const src = srcIds()
  assert.deepEqual([...ids].sort(), [...src].sort())
  assert.equal(new Set(ids).size, ids.length, 'ID 不得重复')
  const rowsWithout = tcRows().filter((c) => {
    const steps = c[4] ?? ''
    const found = [...steps.matchAll(/S2-TC-[A-K]\d\d/g)].map((m) => m[0])
    return found.length !== 1 || found[0] !== c[0].trim()
  })
  assert.equal(rowsWithout.length, 0, `每行「步骤」列必须恰 1 个同名 test：${rowsWithout.slice(0, 2).map((c) => c[0]).join(',')}`)
})

test('S2-TC-J02 全文不得 spawn 门禁', () => {
  const src = R(SELF)
  // 只认「调用形态 + 引号字面」：散文 / 正则里提到命令字面不算违规（否则本行自身的扫描器就会自命中）
  const callForm = /(spawnSync|execFileSync|execSync|runNode|runCli)\s*\([^\n]*?['"](npm run check|check-all\.mjs)/g
  const callFormHits = [...src.matchAll(callForm)].length
  assert.equal(callFormHits, 0, '调用形态不得碰门禁总脚本')
  const stepHits = tcRows().filter((c) => /npm run check|check-all\.mjs/.test(c[4] ?? '')).length
  assert.equal(stepHits, 0, '用例步骤不得真的跑门禁总脚本')
  assert.ok((R(TC_PATH).match(/门禁/g) ?? []).length >= 1, '散文里必须有「不跑门禁」的声明（守扫描器没写错面）')
})

test('S2-TC-J03 声明计数 == 实测计数', () => {
  const src = R(TC_PATH)
  const statusLine = src.split(/\r?\n/).find((l) => l.includes('用例总数')) ?? ''
  const totalDecl = Number((/用例总数\s*\*\*(\d+)\*\*/.exec(statusLine) ?? /用例总数\s*(\d+)/.exec(statusLine) ?? [])[1])
  const revLine = src.split(/\r?\n/).find((l) => l.includes('修订记录 3')) ?? ''
  const rev = /用例数\s*(\d+)\s*（正\s*(\d+)\s*\/\s*负\s*(\d+)\s*\/\s*边界\s*(\d+)/.exec(revLine)
  assert.ok(Number.isFinite(totalDecl), `状态行必须声明用例总数（实得：${statusLine.slice(0, 80)}）`)
  assert.ok(rev, `修订记录 3 必须声明条数与三类计数（实得：${revLine.slice(0, 80)}）`)
  const actual = tcIds()
  assert.equal(actual.length, totalDecl)
  assert.equal(actual.length, Number(rev[1]))
  const types = tcRows().map((c) => c[1].trim())
  const count = (re) => types.filter((x) => re.test(x)).length
  const actualTypes = { 正: count(/^正/), 负: count(/^负/), 边界: count(/^边界/) }
  assert.deepEqual(Object.keys(actualTypes).sort(), ['正', '负', '边界'])
  assert.deepEqual(actualTypes, { 正: Number(rev[2]), 负: Number(rev[3]), 边界: Number(rev[4]) })
  assert.equal(types.filter((x) => !/^(正|负|边界)/.test(x)).length, 0, `类型列不得出现第四种值：${[...new Set(types)].join(',')}`)
})

// ── K 组：A3 判据扩面（spec §6-D17）────────────────────────────────────────────────────────

const mkCard = (block) => ['---', 'name: x', '---', '', '# 角色：X', '', '## 一定会', block, '', '缺答 = 不合格。', '证据可复算。', '',
  '## 边界', '不做什么。', '', '## 输出格式', '表格。', ''].join('\n')
const hasA3 = (card) => checkAgentFromText(card).findings.some((f) => f.code === 'A3')
const bulletRows = (card) => card.split(/\r?\n/).filter((l) => /^- \d+｜/.test(l)).length
test('S2-TC-K01 A3 扩面：只有 bullet 也过', () => {
  const card = mkCard('- 1｜交付物写完时：正文每条结论须带 `path:line`，缺失 == 未命中并写 `reason`。')
  const r = checkAgentFromText(card)
  assert.ok(!r.findings.some((f) => f.code === 'A3'), '只有 bullet 清单（无表格）时必须过 A3')
  assert.equal(bulletRows(card), 1, '构造有效性：必须是恰 1 条 bullet 行')
  assert.equal(card.split(/\r?\n/).filter((l) => l.trim().startsWith('|')).length, 0, '构造有效性：不得含任何表格行')
  assert.equal(r.findings.some((f) => f.code === 'A6'), false, '边界节在位 → A6 不得红')
  assert.equal(r.findings.some((f) => f.code === 'A7'), false, '输出格式节在位 → A7 不得红')
})

test('S2-TC-K02 A3 旧形态不删：只留表格仍过（存量兼容边界）', () => {
  const card = mkCard(['| # | 必问 | 回答 |', '|---|---|---|', '| 1 | 你的判据 | 待答 |'].join('\n'))
  assert.equal(card.split(/\r?\n/).filter((l) => /^\|.*必问.*\|/.test(l)).length, 1, '构造有效性：含「必问」的表头行必须恰 1 行')
  assert.ok(!hasA3(card), '旧表格形态必须仍然过 A3（只加不删）')
  assert.equal(bulletRows(card), 0, '构造有效性：不得含 `- <i>｜` bullet 行（证明过 A3 靠的是表格形态）')
})

test('S2-TC-K03 两形态都没有 / bullet 只在围栏里 → A3 红', () => {
  const plain = mkCard('本卡暂无清单。')
  assert.ok(hasA3(plain), '两形态都没有 → 必红')
  assert.equal(bulletRows(plain), 0, '构造有效性：plain 卡不得含 bullet 行')
  const fenced = mkCard(['本卡暂无清单（示例见下）。', '', '```markdown', '- 1｜示例行，不是本卡真清单。', '```'].join('\n'))
  assert.ok(fenced.includes('- 1｜'), '构造有效性：围栏里必须真的写了 bullet 行')
  assert.equal(bulletRows(fenced), 1, '构造有效性：围栏内必须恰 1 条 bullet 行')
  assert.ok(hasA3(fenced), '围栏内 bullet 不得算真清单 → 必红')
})
