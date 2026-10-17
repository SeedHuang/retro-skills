import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ROLES, buildAgent, renderAll, checkAll, AGENTS_DIR, TEMPLATE } from './gen-agents.mjs'

test('花名册 13 席：name 唯一、合法、含侦探与审计', () => {
  assert.equal(ROLES.length, 13)
  const names = ROLES.map((r) => r.name)
  assert.equal(new Set(names).size, 13)
  for (const n of names) assert.match(n, /^[a-z][a-z0-9-]{0,49}$/)
  assert.ok(names.includes('detective-observer'))
  assert.ok(names.includes('reviewer-audit'))
})

test('模板含全部占位符且特质节在位', () => {
  for (const ph of ['{{NAME}}', '{{DESCRIPTION}}', '{{ZH_NAME}}', '{{DIMENSION}}', '{{IDENTITY}}', '{{FIXED_LIST}}', '{{OUTPUT_FORMAT}}', '{{SHARED_BLOCK}}'])
    assert.ok(TEMPLATE.includes(ph), `模板缺占位符 ${ph}`)
  assert.ok(TEMPLATE.includes('## 共享特质'))
})

test('buildAgent：frontmatter 合法、tools 只读、占位符清零', () => {
  for (const r of ROLES) {
    const t = buildAgent(r)
    assert.ok(t.startsWith(`---\nname: ${r.name}\ndescription: `), `${r.name} frontmatter 不对`)
    assert.ok(t.includes('tools: Read, Glob, Grep'), `${r.name} tools 必须只读`)
    assert.ok(!t.includes('{{'), `${r.name} 有未替换占位符`)
    assert.ok(t.includes('## 固定必问清单'))
    assert.ok(t.includes('## 自由探索'))
  }
})

test('共享特质段 13 文件逐字一致（编译式单源）', () => {
  const seg = (t) => t.split('## 共享特质')[1].split('\n## ')[0]
  const first = seg(buildAgent(ROLES[0]))
  for (const r of ROLES) assert.equal(seg(buildAgent(r)), first)
})

test('生成物已落盘且与源零漂移', () => {
  for (const r of ROLES) {
    const onDisk = readFileSync(join(AGENTS_DIR, r.name + '.md'), 'utf8')
    assert.equal(onDisk, buildAgent(r), `${r.name}.md 与生成结果不一致（被手改或未重新生成）`)
  }
})

test('checkAll：一致报空、漂移报红', () => {
  const dir = mkdtempSync(join(tmpdir(), 'parliament-'))
  try {
    for (const [name, text] of Object.entries(renderAll())) writeFileSync(join(dir, name + '.md'), text)
    assert.equal(checkAll(dir).length, 0)
    writeFileSync(join(dir, ROLES[0].name + '.md'), buildAgent(ROLES[0]) + '\n手改一行\n')
    const diffs = checkAll(dir)
    assert.ok(diffs.length > 0 && diffs[0].includes(ROLES[0].name))
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
