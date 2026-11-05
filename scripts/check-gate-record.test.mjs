// check-gate-record 测试：按单元格判表头、R1 空证据、R2 自签、R3 阶段门、R6 计数、段值白名单、上限、目录扫面、R9
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { checkGateRecord, checkDir, checkSkillLedgers, LIMITS, RECORD_DIR, RECORD_NAME } from './check-gate-record.mjs'

const HEAD = [
  '| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |',
  '|---|---|---|---|---|---|',
].join('\n')

// 签字人按段表「谁签」列取默认值（R2 角色判据）：①/⑤ 用户、④ sdet、其余审计
const signerOf = (seg) => ({ '①': '用户', '⑤': '用户', '④': 'sdet' }[String(seg).replace(/@.*/, '')] ?? '审计')
const ok = (seg = '③@X', extra = '') =>
  `| ${seg} | 判据 | \`npm run check\` → check 全部通过（exit 0）${extra} | 开发（主 agent） | ${signerOf(seg)} | 过 |`
const line = (seg, evidence = '`npm run check` → 通过', verdict = '过', people = `开发 | ${signerOf(seg)}`) =>
  `| ${seg} | 判据 | ${evidence} | ${people} | ${verdict} |`

test('全合规 → rows 计到、无 reason', () => {
  const r = checkGateRecord(`${HEAD}\n${ok('①@X')}\n`)
  assert.equal(r.rows, 1)
  assert.deepEqual(r.reasons, [])
})

test('正文含「申报人」字样的数据行仍被核（不按整行子串丢行）', () => {
  const row = `| ①@X | 判据 | \`npm run check\` → 通过；R2 自查：申报人 ∩ 签字人 = ∅ | 开发（主 agent） | 用户 | 过 |`
  const r = checkGateRecord(`${HEAD}\n${row}\n`)
  assert.equal(r.rows, 1)
  assert.deepEqual(r.reasons, [])
})

test('R2：自签 → 报出来', () => {
  const row = '| ③@X | 判据 | `npm run check` → 通过（exit 0） | 开发（主 agent） | 开发（主 agent） | 过 |'
  const r = checkGateRecord(`${HEAD}\n${row}\n`)
  assert.equal(r.rowsWithIssues.length, 1)
  assert.match(r.reasons.join('\n'), /R2 自签/)
})

test('R1：证据为空 / 只写「已核」/ 空话无锚点 → 报出来；有锚点的短证据放行', () => {
  const empty = '| ③@X | 判据 |  | 开发 | 审计 | 过 |'
  const a = checkGateRecord(`${HEAD}\n${empty}\n`)
  assert.match(a.reasons.join('\n'), /为空（R1）/)
  const short = '| ③@X | 判据 | 已核 | 开发 | 审计 | 过 |'
  const b = checkGateRecord(`${HEAD}\n${short}\n`)
  assert.match(b.reasons.join('\n'), /无可复算锚点（R1/)
  for (const talk of ['已核对全部字段', '看过了全部证据', '同上次核对了全部细节', '已全部核对 → 通过', '全看过 → ok', '已核对 2026-10-28 10:30', '已核对 1:1']) {
    const r = checkGateRecord(`${HEAD}\n| ③@X | 判据 | ${talk} | 开发 | 审计 | 过 |\n`)
    assert.match(r.reasons.join('\n'), /无可复算锚点（R1/, talk)
  }
  for (const okEvidence of ['见 #L7', 'R1:3', '`npm run check` → 通过']) {
    const r = checkGateRecord(`${HEAD}\n| ①@X | 判据 | ${okEvidence} | 开发 | 用户 | 过 |\n`)
    assert.deepEqual(r.reasons, [], okEvidence)
  }
  // 反引号本身不是锚点：`` `已核对` `` 只是给空话加了个壳（2026-11-05 sdet P1）
  // 命令锚点只认白名单首词：`` `check 全部通过` `` 是输出文案，不是可复算命令（2026-11-05 审查 P2）
  for (const talk of ['`已核对`', '`已全部核对字段`', '`check 全部通过`']) {
    const r = checkGateRecord(`${HEAD}\n| ①@X | 判据 | ${talk} | 开发 | 用户 | 过 |\n`)
    assert.match(r.reasons.join('\n'), /无可复算锚点（R1/, talk)
  }
})

test('R3：结论列为空或「—」→ 报未收口', () => {
  for (const verdict of ['', '—']) {
    const row = `| ①@X | 判据 | \`npm run check\` → 通过 | 开发 | 审计 | ${verdict} |`
    const r = checkGateRecord(`${HEAD}\n${row}\n`)
    assert.match(r.reasons.join('\n'), /结论为空（R3/, JSON.stringify(verdict))
  }
})

test('列数 ≠ 6 → 报出来（防行结构坏了却当成合规行）', () => {
  const row = '| ①@X | 判据 | `npm run check` 通过 | 开发 | 审计 |'
  const r = checkGateRecord(`${HEAD}\n${row}\n`)
  assert.match(r.reasons.join('\n'), /列数 5 ≠ 6/)
})

test('R6：「拆 spec 中」账行 2 条 → 报出来；1 条 → 不报；表外说明文字不计', () => {
  const one = checkGateRecord(`${HEAD}\n${line('①@X', '`npm run check`', '拆 spec 中')}\n`)
  assert.deepEqual(one.reasons, [])
  const two = checkGateRecord(`${HEAD}\n${line('①@X', '`npm run check`', '拆 spec 中')}\n${line('①@Y', '`npm run lint`', '拆 spec 中')}\n`)
  assert.match(two.reasons.join('\n'), /R6/)
  const noteOnly = checkGateRecord(`${HEAD}\n${ok('①@X')}\n\n状态 = 拆 spec 中\n`)
  assert.deepEqual(noteOnly.reasons, [])
})

test('段值白名单：② -> ③ / ⑥ → 红；②→③@S2 合法', () => {
  for (const bad of ['② -> ③', '⑥', '②→']) {
    const r = checkGateRecord(`${HEAD}\n${line(bad, '`x`')}\n`)
    assert.match(r.reasons.join('\n'), /段值不在白名单/, bad)
  }
  assert.deepEqual(checkGateRecord(`${HEAD}\n${ok('①@X')}\n${ok('②@X')}\n${ok('②→③@S2')}\n`).reasons, [])
})

test('R3 阶段门：出现 ②→③ 及之后的行时，①、② 必须在位且结论非空', () => {
  const only = checkGateRecord(`${HEAD}\n${ok('③@X')}\n`)
  assert.match(only.reasons.join('\n'), /R3：.*缺 ① 行/)
  const noVerdict = checkGateRecord(`${HEAD}\n${line('①@X', '`x`', '')}\n${line('②@X', '`y`')}\n${ok('③@X')}\n`)
  assert.match(noVerdict.reasons.join('\n'), /R3：① 行结论为空/)
  const good = checkGateRecord(`${HEAD}\n${ok('①@X')}\n${ok('②@X')}\n${ok('③@X')}\n`)
  assert.deepEqual(good.reasons, [])
  // 只有 ① 行 = 合法中间态
  assert.deepEqual(checkGateRecord(`${HEAD}\n${ok('①@X')}\n`).reasons, [])
})

test('模板占位行 `[[...]]` 不计数据行（整份复制模板应绿）', () => {
  const tpl = `${HEAD}\n| [[段]] | [[判据]] | [[证据]] | [[申报人]] | [[签字人]] | [[结论]] |\n`
  const r = checkGateRecord(tpl)
  assert.equal(r.rows, 0)
  assert.deepEqual(r.reasons, [])
})

test('上限：整行 / 出口判据 / 核了什么 / 结论超限 → 报出实测值', () => {
  const longVerdict = '过'.repeat(LIMITS.verdict + 5)
  const r1 = checkGateRecord(`${HEAD}\n${line('①@X', '`x`', longVerdict)}\n`)
  assert.match(r1.reasons.join('\n'), new RegExp(`结论 .* > ${LIMITS.verdict}`))
  const longEvidence = `\`npm run check\` ${'y'.repeat(LIMITS.evidence + 20)}`
  const r2 = checkGateRecord(`${HEAD}\n${line('①@X', longEvidence)}\n`)
  assert.match(r2.reasons.join('\n'), new RegExp(`核了什么」.* > ${LIMITS.evidence}`))
  const longCriteria = '判'.repeat(LIMITS.criteria + 10)
  const r3 = checkGateRecord(`${HEAD}\n| ①@X | ${longCriteria} | \`x\` | 开发 | 审计 | 过 |\n`)
  assert.match(r3.reasons.join('\n'), new RegExp(`出口判据 .* > ${LIMITS.criteria}`))
  const huge = `| ①@X | ${'判'.repeat(400)} | \`${'z'.repeat(300)}\` | 开发 | 审计 | ${'结'.repeat(150)} |`
  assert.ok(huge.length > LIMITS.row)
  const r4 = checkGateRecord(`${HEAD}\n${huge}\n`)
  assert.match(r4.reasons.join('\n'), new RegExp(`整行 .* > ${LIMITS.row}`))
})

test('文件体积 > 40 KB → 报出（长证据需外迁）', () => {
  const pad = 'x'.repeat(LIMITS.fileBytes)
  const r = checkGateRecord(`${HEAD}\n${ok('①@X')}\n\n${pad}\n`)
  assert.match(r.reasons.join('\n'), /字节 > 40960/)
})

// ── 目录扫面（tasks / 缺文件 / 目录名）────────────────────────────────────
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'gate-'))
  for (const rel of files) {
    const abs = join(root, rel)
    mkdirSync(join(abs, '..'), { recursive: true })
    writeFileSync(abs, `${HEAD}\n${ok('①@X')}\n`, 'utf8')
  }
  return root
}

test('checkDir：tasks 0 → 判红；缺 gate-record.md → 判红；目录名不合规 → 判红', () => {
  const empty = mkdtempSync(join(tmpdir(), 'gate-'))
  mkdirSync(join(empty, RECORD_DIR), { recursive: true })
  try {
    const r0 = checkDir(empty)
    assert.equal(r0.tasks, 0)
    assert.match(r0.reasons.join('\n'), /tasks 0 判红/)
  } finally { rmSync(empty, { recursive: true, force: true }) }

  const missing = mkdtempSync(join(tmpdir(), 'gate-'))
  mkdirSync(join(missing, RECORD_DIR, '20260102030405-t'), { recursive: true })
  try {
    const r1 = checkDir(missing)
    assert.equal(r1.tasks, 1)
    assert.match(r1.reasons.join('\n'), new RegExp(`缺 ${RECORD_NAME}`))
    assert.ok(r1.bad >= 1)
  } finally { rmSync(missing, { recursive: true, force: true }) }

  const badName = fixture([`${RECORD_DIR}/Task-B/${RECORD_NAME}`])
  try {
    const r2 = checkDir(badName)
    assert.match(r2.reasons.join('\n'), /目录名不合规/)
  } finally { rmSync(badName, { recursive: true, force: true }) }
})

test('checkDir：合规任务目录 → tasks 1 rows 1 bad 0', () => {
  const root = fixture([`${RECORD_DIR}/20260102030405-ok/${RECORD_NAME}`])
  try {
    const r = checkDir(root)
    assert.equal(r.tasks, 1)
    assert.equal(r.rows, 1)
    assert.equal(r.bad, 0)
    assert.deepEqual(r.reasons, [])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

// ── R9：技能侧不得装任务账 ───────────────────────────────────────────────
test('R9：references 里出现六列签字行 → 红；模板与 [[...]] 行豁免', () => {
  const root = mkdtempSync(join(tmpdir(), 'gate-'))
  mkdirSync(join(root, 'skills', 'demo', 'references'), { recursive: true })
  try {
    writeFileSync(join(root, 'skills', 'demo', 'references', 'bad.md'), `${HEAD}\n${ok('①@X')}\n`, 'utf8')
    assert.match(checkSkillLedgers(root).join('\n'), /R9/)
    writeFileSync(join(root, 'skills', 'demo', 'references', 'gate-record-template.md'), `${HEAD}\n| [[段]] | [[判据]] | [[证据]] | [[申报人]] | [[签字人]] | [[结论]] |\n`, 'utf8')
    writeFileSync(join(root, 'skills', 'demo', 'references', 'bad.md'), '# 说明\n\n| 列 | 写什么 |\n|---|---|\n| 段 | 六种 |\n', 'utf8')
    assert.deepEqual(checkSkillLedgers(root), [])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('P70 R2 自签：括号里的名字也参与交集', () => {
  const r = checkGateRecord(`${HEAD}\n${line('④@X', '`npm run check`', '过', '开发（sdet 代拟） | sdet')}\n`)
  assert.match(r.reasons.join('\n'), /自签/)
})

test('P71 R9 扫 references 子目录；围栏里的示例表不算；行内 `[[` 不丢行', () => {
  const root = mkdtempSync(join(tmpdir(), 'gate-'))
  mkdirSync(join(root, 'skills', 'demo', 'references', 'sub'), { recursive: true })
  try {
    writeFileSync(join(root, 'skills', 'demo', 'references', 'sub', 'deep.md'), `${HEAD}\n${ok('①@X')}\n`, 'utf8')
    assert.match(checkSkillLedgers(root).join('\n'), /R9/)
    writeFileSync(join(root, 'skills', 'demo', 'references', 'sub', 'deep.md'), `\`\`\`\n${HEAD}\n${line('①@X')}\n\`\`\`\n`, 'utf8')
    assert.deepEqual(checkSkillLedgers(root), [])
    writeFileSync(join(root, 'skills', 'demo', 'references', 'sub', 'deep.md'), `${HEAD}\n${line('①@X', '见 `docs/x.md:12` 的 `[[wiki]]` 段')}\n`, 'utf8')
    assert.match(checkSkillLedgers(root).join('\n'), /R9/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('P72 表头后另一张六列表（首格非段值）不收行', () => {
  const other = ['| 列1 | 列2 | 列3 | 列4 | 列5 | 列6 |', '|---|---|---|---|---|---|', '| a | b | c | d | e | f |'].join('\n')
  const r = checkGateRecord(`${HEAD}\n${ok('①@X')}\n\n${other}\n`)
  assert.equal(r.rows, 1)
  assert.deepEqual(r.reasons, [])
})

test('P73 通用限定语不参与交集（两边都带「（主 agent）」不误判自签）', () => {
  const r = checkGateRecord(`${HEAD}\n${line('①@X', '`npm run check`', '过', '开发（主 agent 代拟） | 用户（主 agent）')}\n`)
  assert.deepEqual(r.reasons, [])
})

test('P74 R3 多批次：第二个 ② 行结论为空也要报（不只查首行）', () => {
  const r = checkGateRecord(`${HEAD}\n${ok('①@X')}\n${ok('②@X')}\n${line('②@Y', '`npm run check`', '')}\n${ok('③@Y')}\n`)
  assert.match(r.reasons.join('\n'), /R3：② 行结论为空/)
})

test('P75 R9：技能侧 references 未闭合围栏 → 判红（不静默吞掉其后签字行）', () => {
  const root = mkdtempSync(join(tmpdir(), 'gate-'))
  mkdirSync(join(root, 'skills', 'demo', 'references'), { recursive: true })
  try {
    writeFileSync(join(root, 'skills', 'demo', 'references', 'bad.md'), `# 说明\n\n\`\`\`\n${HEAD}\n${line('①@X')}\n`, 'utf8')
    assert.match(checkSkillLedgers(root).join('\n'), /围栏未闭合/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('P76 旁路只认结论列：判据里提「旁路」不改判签字人角色', () => {
  const row = `| ①@X | 免议会旁路口径见 \`docs/x.md:1\` | \`npm run check\` | 开发 | 用户 | 过 |`
  const r = checkGateRecord(`${HEAD}\n${row}\n`)
  assert.deepEqual(r.reasons, [])
})

test('P77 checkDir：docs/devworkflows 是文件而非目录 → 报理由，不抛异常', () => {
  const root = mkdtempSync(join(tmpdir(), 'gate-'))
  mkdirSync(join(root, 'docs'), { recursive: true })
  try {
    writeFileSync(join(root, RECORD_DIR), 'not a dir', 'utf8')
    const r = checkDir(root)
    assert.match(r.reasons.join('\n'), /不是目录/)
    assert.ok(r.bad >= 1)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

// ── S4 / R10①：ISO 时间串不得当锚点 ──────────────────────────────────
const reasonsOf = (evidence) => checkGateRecord(`${HEAD}\n${line('①@X', evidence)}\n`).reasons.join('\n')

test('P57 ISO 时间串（分钟）不得当锚点 → 必报 R1', () => {
  assert.match(reasonsOf('已核对 2026-10-28T10:30'), /无可复算锚点（R1/)
})

test('P58 ISO 时间串（带秒）同样必报 R1', () => {
  assert.match(reasonsOf('已核对 2026-10-28T10:30:45'), /无可复算锚点（R1/)
})

test('P59 含反引号命令的证据里带 ISO 时间串 → 仍放行（不得误伤）', () => {
  assert.deepEqual(checkGateRecord(`${HEAD}\n${line('①@X', '`npm run check` → 2026-10-28T10:30 通过')}\n`).reasons, [])
})

test('P60 合法锚点（path:line / #L7）仍放行', () => {
  for (const ev of ['已核对 `docs/x.md:12`', '见 #L7']) {
    assert.deepEqual(checkGateRecord(`${HEAD}\n${line('①@X', ev)}\n`).reasons, [], ev)
  }
})

// ── 2026-11-05 审查回归：解析边界与角色判据 ─────────────────────────────────
test('P61 围栏内的示例签字行不计数据行', () => {
  const fenced = ['```', line('①@Y'), '```'].join('\n')
  const r = checkGateRecord(`${HEAD}\n${ok('①@X')}\n\n${fenced}\n`)
  assert.equal(r.rows, 1)
  assert.deepEqual(r.reasons, [])
})

test('P62 围栏未闭合 → 判红（不得把其后内容静默吞掉）', () => {
  const r = checkGateRecord(`${HEAD}\n${ok('①@X')}\n\`\`\`\n`)
  assert.match(r.reasons.join('\n'), /围栏未闭合/)
})

test('P63 表被非表格行截断后的六列签字行 → 报孤行，不再静默跳过', () => {
  const r = checkGateRecord(`${HEAD}\n${ok('①@X')}\n\n（说明段）\n\n${line('②@X')}\n`)
  assert.equal(r.rows, 1)
  assert.match(r.reasons.join('\n'), /不在表头之下/)
})

test('P64 真实行里含 `[[` 不被整行丢弃', () => {
  const r = checkGateRecord(`${HEAD}\n${line('①@X', '见 `docs/x.md:12` 的 `[[wiki]]` 段')}\n`)
  assert.equal(r.rows, 1)
  assert.deepEqual(r.reasons, [])
})

test('P65 第二张自带同样表头的签字表继续收行', () => {
  const r = checkGateRecord(`${HEAD}\n${ok('①@X')}\n\n${HEAD}\n${ok('②@X')}\n`)
  assert.equal(r.rows, 2)
  assert.deepEqual(r.reasons, [])
})

test('P66 R2 角色：① 签字人须为用户；旁路行须为审计', () => {
  const bad1 = checkGateRecord(`${HEAD}\n${line('①@X', '`npm run check`', '过', '开发 | 审计')}\n`)
  assert.match(bad1.reasons.join('\n'), /不在段表「谁签」列（R2/)
  const bypassOk = checkGateRecord(`${HEAD}\n${line('①@X', '`npm run check`', '过（旁路）', '开发 | 审计')}\n`)
  assert.deepEqual(bypassOk.reasons, [])
  const bypassBad = checkGateRecord(`${HEAD}\n${line('①@X', '`npm run check`', '过（旁路）', '开发 | 用户')}\n`)
  assert.match(bypassBad.reasons.join('\n'), /旁路行的签字人须为「审计」/)
})

test('P67 R3 计划门：②→③ 签字人须含审计', () => {
  const r = checkGateRecord(`${HEAD}\n${ok('①@X')}\n${ok('②@X')}\n${line('②→③', '`npm run check`', '过', '主 agent | 用户')}\n`)
  assert.match(r.reasons.join('\n'), /计划门（②→③）行的「签字人」须含「审计」/)
})

test('P68 有数据行却没有 ① → 判红', () => {
  const r = checkGateRecord(`${HEAD}\n${ok('②@X')}\n`)
  assert.match(r.reasons.join('\n'), /缺 ① 行/)
})

test('P69 R6 只在证据列提「拆 spec 中」不计数', () => {
  const a = line('①@X', '`npm run check` 拆 spec 中')
  const b = line('①@Y', '`npm run check` 拆 spec 中')
  assert.deepEqual(checkGateRecord(`${HEAD}\n${a}\n${b}\n`).reasons, [])
})
