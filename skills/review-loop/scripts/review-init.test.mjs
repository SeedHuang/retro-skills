// review-init.test.mjs —— readProjectType / flattenCandidates / listInfo / candidateSet 单测
// 惯例：同目录 *.test.mjs，node:test + 临时目录 fixture（参照 skill-inspector/scripts/check.test.mjs）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  readProjectType, flattenCandidates, listInfo, candidateSet, ensureRegistry, registryPath,
} from './review-init.mjs'

const tmpDir = () => mkdtempSync(join(tmpdir(), 'review-init-test-'))
const seedCount = () => {
  const { activeProjectTypes } = JSON.parse(readFileSync(registryPath(tmpHomeRef), 'utf8'))
  return activeProjectTypes.length
}

let tmpHomeRef = null

// ---------- readProjectType ----------

test('readProjectType：指针不存在（ENOENT）→ null，视为未设置', () => {
  const cwd = tmpDir()
  assert.equal(readProjectType(cwd), null)
})

test('readProjectType：空 / 纯空白 → null', () => {
  const cwd = tmpDir()
  mkdirSync(join(cwd, '.reviewconfig'), { recursive: true })
  writeFileSync(join(cwd, '.reviewconfig', 'project-type'), '  \n', 'utf8')
  assert.equal(readProjectType(cwd), null)
})

test('readProjectType：有值 → trim 后返回', () => {
  const cwd = tmpDir()
  mkdirSync(join(cwd, '.reviewconfig'), { recursive: true })
  writeFileSync(join(cwd, '.reviewconfig', 'project-type'), 'Agent Skill 项目\n', 'utf8')
  assert.equal(readProjectType(cwd), 'Agent Skill 项目')
})

test('readProjectType：EISDIR（指针是目录）→ 抛错，不吞成 null（读不了 ≠ 未设置）', () => {
  const cwd = tmpDir()
  mkdirSync(join(cwd, '.reviewconfig', 'project-type'), { recursive: true })
  assert.throws(() => readProjectType(cwd), /项目类型指针读取失败/)
})

// ---------- flattenCandidates ----------

test('flattenCandidates：对象条目透传 path/ignore，字符串条目只有 name/source', () => {
  const out = flattenCandidates({
    activeProjectTypes: [{ name: 'node-cli', path: '**/*.{js,mjs}', ignore: '无前端' }],
    languagePresets: [{ name: 'python-backend', path: '**/*.py', ignore: '无前端' }],
    ecosystemPresets: ['React H5'],
  })
  const byName = Object.fromEntries(out.map((c) => [c.name, c]))
  assert.deepEqual(byName['node-cli'], { name: 'node-cli', path: '**/*.{js,mjs}', ignore: '无前端', source: '个人累积' })
  assert.deepEqual(byName['python-backend'], { name: 'python-backend', path: '**/*.py', ignore: '无前端', source: '语言级' })
  assert.deepEqual(byName['React H5'], { name: 'React H5', source: '生态级' })
  assert.equal('path' in byName['React H5'], false)
  assert.equal('ignore' in byName['React H5'], false)
})

test('flattenCandidates：无名项被丢弃', () => {
  const out = flattenCandidates({
    activeProjectTypes: [{ name: '', path: 'x' }, { name: 'ok', path: 'y' }],
    languagePresets: [],
    ecosystemPresets: [],
  })
  assert.deepEqual(out.map((c) => c.name), ['ok'])
})

// ---------- candidateSet / ensureRegistry ----------

test('candidateSet：注册表不存在 → 写种子；幂等（第二次不覆盖、不翻倍）', () => {
  tmpHomeRef = tmpDir()
  const first = candidateSet(tmpHomeRef)
  const firstCount = first.activeProjectTypes.length
  assert.ok(firstCount > 0)
  assert.equal(ensureRegistry(tmpHomeRef).created, false) // 已存在 → created=false
  const again = candidateSet(tmpHomeRef)
  assert.equal(again.activeProjectTypes.length, firstCount) // 不是 2×firstCount
  assert.equal(seedCount(), firstCount)
})

// ---------- listInfo（currentHit：MiniMax 悬空指针场景） ----------

test('listInfo：current 在候选集内 → currentHit 命中该类型', () => {
  tmpHomeRef = tmpDir()
  const cwd = tmpDir()
  mkdirSync(join(cwd, '.reviewconfig'), { recursive: true })
  writeFileSync(join(cwd, '.reviewconfig', 'project-type'), 'node-cli\n', 'utf8')
  const info = listInfo(tmpHomeRef, cwd)
  assert.equal(info.current, 'node-cli')
  assert.equal(info.currentHit.name, 'node-cli')
  assert.ok(info.candidates.length > 0)
})

test('listInfo：current 悬空（注册表误删后自定义类型消失，指针仍在）→ currentHit 为 null', () => {
  tmpHomeRef = tmpDir()
  const cwd = tmpDir()
  mkdirSync(join(cwd, '.reviewconfig'), { recursive: true })
  writeFileSync(join(cwd, '.reviewconfig', 'project-type'), 'H5 中台\n', 'utf8') // 不在任何候选层
  const info = listInfo(tmpHomeRef, cwd)
  assert.equal(info.current, 'H5 中台')
  assert.equal(info.currentHit, null)
})
