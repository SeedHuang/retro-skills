import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { hasBom, parsePorcelain, parseDiffNames, renderRuleTable, fillTemplate } from './gen-rule-checklist.mjs'

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

test('parseDiffNames：只收 rules/ 下 .md', () => {
  const out = 'rules/a.md\ndocs/b.md\nrules/c.txt\nrules/sub/d.md\n'
  assert.deepEqual(parseDiffNames(out, 'rules/'), ['rules/a.md', 'rules/sub/d.md'])
})

test('renderRuleTable：逐行成表', () => {
  const rows = [{ name: 'rules/a.md', type: 'M', evidence: 'commit diff（master..HEAD）' }]
  assert.equal(renderRuleTable(rows), '| rules/a.md | M | commit diff（master..HEAD） |')
})

test('fillTemplate：全部占位符替换，无 {{ 残留', () => {
  const tpl = '# {{ROUND}} @ {{GENERATED_AT}}\nT1 {{RULE_TABLE}}\nC1 {{C1_OUTPUT}}\nC4 {{C4_OUTPUT}}\nE {{E_SECTIONS}}\nS {{MECH_SUMMARY}}\n'
  const out = fillTemplate(tpl, {
    round: 'R13', generatedAt: '2026-10-15 18:00', ruleTable: '| r |', c1: 'True', c4: 'false',
    eSections: 'E-1', mechSummary: '- 摘要',
  })
  assert.ok(!out.includes('{{'), '占位符必须全部替换')
  assert.ok(out.includes('R13') && out.includes('E-1'))
})

test('fillTemplate：E_SECTIONS 含多行 JSON 块时保留换行结构', () => {
  const out = fillTemplate('X {{E_SECTIONS}} Y', {
    round: 'R', generatedAt: 't', ruleTable: '', c1: '', c4: '',
    eSections: '### E-1 · a\n\n> line1\n> line2', mechSummary: '',
  })
  assert.equal(out, 'X ### E-1 · a\n\n> line1\n> line2 Y')
})
