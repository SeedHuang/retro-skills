// 议会账本模板生成器：块渲染 / 转义 / 校验 / 与磁盘一致（数据 → 渲染 → 逐字节）
// 判据：未知块键抛错（不静默丢段）；同名 file 抛错；真实数据生成三份且与磁盘逐字节相等。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { renderTemplate, collectDocs, renderAll, BLOCK_KEYS, OUT } from '../ledger.mjs'

const tpl = (blocks) => ({ file: 'x.md', blocks })

test('L-TC-01 六种块各自渲染正确', () => {
  const md = renderTemplate(tpl([
    { h1: '标题' },
    { h2: '小节' },
    { para: '一段话' },
    { notes: ['注一', '注二'] },
    { bullets: ['甲', '乙'] },
    { table: { columns: ['列一', '列二'], rows: [['a', ''], ['b', 'c']] } },
  ]))
  assert.equal(md, [
    '# 标题',
    '',
    '## 小节',
    '',
    '一段话',
    '',
    '> 注一',
    '> 注二',
    '',
    '- 甲',
    '- 乙',
    '',
    '| 列一 | 列二 |',
    '|---|---|',
    '| a |  |',
    '| b | c |',
    '',
  ].join('\n'))
})

test('L-TC-02 单元格竖线被转义，不破坏表格列数', () => {
  const md = renderTemplate(tpl([{ table: { columns: ['a|b'], rows: [['x|y']] } }]))
  assert.ok(md.includes('| a\\|b |'))
  assert.ok(md.includes('| x\\|y |'))
})

test('L-TC-03 末尾多余空行被压成一个换行', () => {
  const md = renderTemplate(tpl([{ h1: '只一个标题' }]))
  assert.equal(md, '# 只一个标题\n')
})

test('L-TC-04 未知块键抛错（不静默丢段）', () => {
  assert.throws(() => renderTemplate(tpl([{ h3: '写错键' }])), /块键/)
})

test('L-TC-05 一个块同时含两个键抛错', () => {
  assert.throws(() => renderTemplate(tpl([{ h1: 'a', h2: 'b' }])), /块键/)
})

test('L-TC-06 空块对象抛错', () => {
  assert.throws(() => renderTemplate(tpl([{}])), /块键/)
})

test('L-TC-07 缺 blocks 数组抛错', () => {
  assert.throws(() => renderTemplate({ file: 'x.md' }), /blocks/)
})

test('L-TC-08 BLOCK_KEYS 与渲染实现一致（六种，不多不少）', () => {
  assert.deepEqual([...BLOCK_KEYS].sort(), ['bullets', 'h1', 'h2', 'notes', 'para', 'table'])
})

test('L-TC-09 同名 file 抛错（防 --apply 互相覆盖）', () => {
  const formats = {
    a: { docs: [{ file: 'same.md', blocks: [{ h1: 'a' }] }] },
    b: { docs: [{ file: 'same.md', blocks: [{ h1: 'b' }] }] },
  }
  assert.throws(() => collectDocs(formats), /文件名重复/)
})

test('L-TC-10 缺 file 抛错', () => {
  const formats = { a: { docs: [{ blocks: [{ h1: 'a' }] }] } }
  assert.throws(() => collectDocs(formats), /缺 file/)
})

test('L-TC-11 真实数据生成三份，文件名固定', () => {
  const all = renderAll()
  assert.deepEqual(all.map((x) => x.file).sort(), ['delivery-audit.md', 'issue-card.md', 'round-check.md'])
})

test('L-TC-12 真实数据与磁盘逐字节一致（生成物漂移即红）', () => {
  for (const { file, text } of renderAll()) {
    const p = path.join(OUT, file)
    assert.ok(existsSync(p), `缺生成物：${file}`)
    assert.equal(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''), text, `${file} 与数据不一致（手改或改源未重生成）`)
  }
})
