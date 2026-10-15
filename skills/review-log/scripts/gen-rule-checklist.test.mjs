import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { hasBom, parsePorcelain, parseDiffStatus, changedRules, scoreRule, renderRuleTable, ruleAddDeleteVerdict, renderESections, fillTemplate, templateAICounts } from './gen-rule-checklist.mjs'

function tmpfile(content) {
  const dir = mkdtempSync(join(tmpdir(), 'gen-chk-'))
  const p = join(dir, 'f.md')
  writeFileSync(p, content, 'utf8')
  return { dir, p }
}

test('hasBom：无 BOM → false；带 EF BB BF → true', () => {
  const a = tmpfile('# 无 BOM 文件\n')
  assert.equal(hasBom(a.p), false)
  const b = tmpfile('')
  writeFileSync(b.p, Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from('# b\n', 'utf8')]))
  assert.equal(hasBom(b.p), true)
  rmSync(a.dir, { recursive: true, force: true }); rmSync(b.dir, { recursive: true, force: true })
})

test('parsePorcelain：只收 rules/ 下 .md，?? → A，M/D 保留类型，忽略其余路径', () => {
  const out = [
    ' M rules/core-working-principles.md',
    ' M skills/review-log/SKILL.md',          // 非目标：.md 但不在 rules/ 下 → 不收
    '?? rules/new-rule.md',
    ' D rules/gone-rule.md',
    ' M rules/notes.txt',                       // 非 .md → 不收
    '',
  ].join('\n')
  const rows = parsePorcelain(out, 'rules/')
  assert.deepEqual(rows, [
    { name: 'rules/core-working-principles.md', type: 'M' },
    { name: 'rules/new-rule.md', type: 'A' },
    { name: 'rules/gone-rule.md', type: 'D' },
  ])
})

test('parsePorcelain：带引号的路径（中文/空格文件名）剥引号后正常收', () => {
  const rows = parsePorcelain(' M "rules/my rule.md"\n', 'rules/')
  assert.deepEqual(rows, [{ name: 'rules/my rule.md', type: 'M' }])
})

test('parseDiffStatus：A/M/D 收 rules/ 下 .md；R100 old → 旧删 D + 新加 A 双行', () => {
  const out = 'A\trules/new.md\nM\trules/mod.md\nD\trules/del.md\nM\tdocs/b.md\nR100\trules/old.md\trules/new2.md\n'
  assert.deepEqual(parseDiffStatus(out, 'rules/'), [
    { name: 'rules/new.md', type: 'A' },
    { name: 'rules/mod.md', type: 'M' },
    { name: 'rules/del.md', type: 'D' },
    { name: 'rules/old.md', type: 'D' },
    { name: 'rules/new2.md', type: 'A' },
  ])
})

test('parsePorcelain：rename（R old -> new）→ 旧删 D + 新加 A，两条都收', () => {
  const rows = parsePorcelain('R  rules/old.md -> rules/new.md\n', 'rules/')
  assert.deepEqual(rows, [
    { name: 'rules/old.md', type: 'D' },
    { name: 'rules/new.md', type: 'A' },
  ])
})

test('changedRules：commit diff（--name-status）与工作区 porcelain 合并（注入 git runner）', () => {
  const calls = []
  const runner = (args) => {
    calls.push(args.join(' '))
    if (args[0] === 'diff') return 'A\trules/new-committed.md\nD\trules/del-committed.md\nM\trules/mod-committed.md\n'
    return ' M rules/mod-committed.md\n?? rules/untracked-new.md\n'
  }
  const { rules } = changedRules('base', runner)
  assert.deepEqual(rules, [
    { name: 'rules/del-committed.md', type: 'D', evidence: 'commit diff（base..工作区）' },
    { name: 'rules/mod-committed.md', type: 'M', evidence: 'commit diff（base..工作区） + 工作区未提交（M）' },
    { name: 'rules/new-committed.md', type: 'A', evidence: 'commit diff（base..工作区）' },
    { name: 'rules/untracked-new.md', type: 'A', evidence: '工作区未提交（A）' },
  ])
  assert.ok(calls[0].includes('--name-status'), 'diff 侧用 --name-status（C2 才能看见已 commit 的 A/D，OCR R14 :168）')
  assert.ok(calls[1].includes('--porcelain'), 'porcelain 侧保留')
})

test('scoreRule：stdout 前置非 JSON 文本（警告）仍能解析；纯非 JSON / exit≠0 → error 带证据', () => {
  const ok = scoreRule('repo', 'rules/a.md', () => ({ status: 0, stdout: 'node: warning...\n{"total":1,"max":1}', stderr: '' }))
  assert.equal(ok.total, 1, '剥掉前置文本后 JSON 正常解析（OCR R14 :6）')
  const bad = scoreRule('repo', 'rules/a.md', () => ({ status: 0, stdout: 'not json at all', stderr: '' }))
  assert.equal(bad.error, 'exit 0', '整体非 JSON → error（exit 0）')
  const err = scoreRule('repo', 'rules/a.md', () => ({ status: 1, stdout: '', stderr: 'boom' }))
  assert.ok(err.error.includes('exit 1') && err.stderr.includes('boom'), 'exit 非 0 → error 带 stderr')
})

test('templateAICounts：从模板表行派生 A/B/C/D/E2/F 计数（不硬编码）', () => {
  const tpl = ['| A1 | x | | | |', '| A2 | x | | | |', '| B1 | x | | | |', '| C1 | x | | | |', '| D1 | x | | | |', '| E2-1 | x | | | |', '| F1 | x | | | |'].join('\n')
  assert.deepEqual(templateAICounts(tpl), { A: 2, B: 1, C: 1, D: 1, E2: 1, F: 1 })
})

test('ruleAddDeleteVerdict：无 A/D → 未触发；有 A → 触发并列名', () => {
  const none = ruleAddDeleteVerdict([{ name: 'rules/a.md', type: 'M' }])
  assert.equal(none.triggered, false)
  assert.ok(none.text.includes('未触发'))
  const has = ruleAddDeleteVerdict([{ name: 'rules/a.md', type: 'A' }, { name: 'rules/b.md', type: 'M' }])
  assert.equal(has.triggered, true)
  assert.ok(has.text.includes('rules/a.md'))
})

test('renderESections：checks[] 逐检查点一行一项，未过项保留 msg；缺 checks → 取证失败行', () => {
  const rules = [{ name: 'rules/a.md' }]
  const ok = renderESections(rules, [{
    total: 2, max: 2, level: '健康', groups: { '头部规范': { score: 3, max: 3 } },
    checks: [
      { group: '头部规范', check: '来源行三字段（类型/日期/落地）', pass: true, msg: '' },
      { group: '冗余度', check: '三检验报告已做', pass: false, msg: '三检验报告未做（AI 侧）' },
    ],
  }])
  assert.ok(ok.includes('| 1 | 来源行三字段（类型/日期/落地） |'), '每个检查项一行')
  assert.ok(ok.includes('| 2 | 三检验报告已做 |'), '未过项也是一行')
  assert.ok(ok.includes('**未过**：三检验报告未做（AI 侧）'), '未过项保留 msg')
  assert.ok(ok.includes('确认执行'), '机械行确认列已填')
  // checks 条数 ≠ 组 max 之和 → 对账告警行
  const drift = renderESections(rules, [{
    total: 2, max: 2, level: '健康', groups: { '头部规范': { score: 3, max: 5 } },
    checks: [{ group: '头部规范', check: 'X', pass: true, msg: '' }],
  }])
  assert.ok(drift.includes('数据不一致'), 'checks 与 groups 漂移时必须告警')
  // 缺 checks[] → 取证失败
  const missing = renderESections(rules, [{ total: 1, max: 1, level: '健康', groups: {} }])
  assert.ok(missing.includes('取证失败'), '缺 checks[] 视为取证失败')
  // score 报错 → 取证失败行原样留档
  const errored = renderESections(rules, [{ error: 'exit 1', stderr: 'boom' }])
  assert.ok(errored.includes('exit 1') && errored.includes('boom'), '错误原样进快照')
})

test('renderRuleTable：逐行成表', () => {
  const rows = [{ name: 'rules/a.md', type: 'M', evidence: 'commit diff（master..工作区）' }]
  assert.equal(renderRuleTable(rows), '| rules/a.md | M | commit diff（master..工作区） |')
})

test('fillTemplate：全部占位符替换（含 C2），无 {{ 残留', () => {
  const tpl = 'R{{ROUND}}\nT {{RULE_TABLE}}\nC1 {{C1_OUTPUT}}\nC2 {{C2_OUTPUT}}\nC4 {{C4_OUTPUT}}\nE {{E_SECTIONS}}\nS {{MECH_SUMMARY}}\n'
  const out = fillTemplate(tpl, {
    round: 'R13', ruleTable: '| r |', c1: 'True', c2: '未触发', c4: 'false',
    eSections: '### E-1', mechSummary: '- 摘要',
  })
  assert.ok(!out.includes('{{'), '占位符必须全部替换')
  assert.ok(out.includes('R13') && out.includes('未触发'))
})

test('fillTemplate：E_SECTIONS 含多行表格时保留换行结构', () => {
  const out = fillTemplate('X {{E_SECTIONS}} Y', {
    round: 'R', ruleTable: '', c1: '', c2: '', c4: '',
    eSections: '### E-1 · a\n\n| 1 | 行 |', mechSummary: '',
  })
  assert.equal(out, 'X ### E-1 · a\n\n| 1 | 行 | Y')
})
