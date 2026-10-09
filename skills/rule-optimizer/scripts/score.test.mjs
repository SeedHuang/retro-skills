import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scoreFile, scoreDir } from './score.mjs'

function makeDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'ro-test-'))
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body, 'utf8')
  return dir
}
function score(dir, name) { return scoreFile(join(dir, name), dir) }

// 合规文件：来源行三字段齐全、H1 判据式、来源行 ≤ 200 字符、无原话引用 → 硬性四维全满分（D4 参考）
const GOOD = `# 有想法先沟通，拿到授权再动手

> 来源：用户当场指令（2026-10-02）｜落地：2026-10-02

## 核心约束
先沟通，拿到授权，才有写权限。`

const NO_SOURCE = `# 测试踩坑笔记

## 说明
无来源行。`

const NO_LANDING = `# 引用完整

> 来源：项目约定（2026-10-02）

## 核心约束
落地字段缺失。`

const LONG_SOURCE = `# 长来源行

> 来源：用户当场指令（2026-10-02）｜证据：${'用户原话'.repeat(60)}｜落地：2026-10-02

## 核心约束
来源行超 200 字符。`

const BROKEN_REF = `# 有引用

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心约束
参考 missing-rule.md 处理。`

test('D1 无来源行扣分', () => {
  const dir = makeDir({ 'a.md': NO_SOURCE })
  assert.ok(score(dir, 'a.md').scores.D1 < 20)
  rmSync(dir, { recursive: true, force: true })
})

test('D1 缺落地字段扣分', () => {
  const dir = makeDir({ 'a.md': NO_LANDING })
  assert.ok(score(dir, 'a.md').scores.D1 < 20)
  rmSync(dir, { recursive: true, force: true })
})

test('D3 来源行超长扣分', () => {
  const dir = makeDir({ 'a.md': LONG_SOURCE })
  assert.ok(score(dir, 'a.md').scores.D3 < 20)
  rmSync(dir, { recursive: true, force: true })
})

test('D4 目录式标题 0 分 / 判据式标题满分（参考维度，不计入 total）', () => {
  const dir = makeDir({ 'bad.md': NO_SOURCE, 'good.md': GOOD })
  assert.equal(score(dir, 'bad.md').d4.score, 0)
  assert.equal(score(dir, 'good.md').d4.score, 20)
  assert.equal(score(dir, 'good.md').total, 80)   // 四维满分，D4 是参考维度不计入
  rmSync(dir, { recursive: true, force: true })
})

test('D5 失效指针扣分 / 无引用满分', () => {
  const dir = makeDir({ 'a.md': BROKEN_REF, 'good.md': GOOD })
  assert.ok(score(dir, 'a.md').scores.D5 < 20)
  assert.equal(score(dir, 'good.md').scores.D5, 20)
  rmSync(dir, { recursive: true, force: true })
})

test('确定性：同一 fixture 连跑两次输出一致', () => {
  const dir = makeDir({ 'good.md': GOOD, 'a.md': BROKEN_REF })
  const a = JSON.stringify(scoreDir(dir, { json: true }))
  const b = JSON.stringify(scoreDir(dir, { json: true }))
  assert.equal(a, b)
  rmSync(dir, { recursive: true, force: true })
})

test('不越界：输出不含「判据」「建议删除」（走 D4=0 finding 路径）', () => {
  const dir = makeDir({ 'bad.md': NO_SOURCE })
  const out = JSON.stringify(scoreDir(dir, { json: true }))
  assert.ok(!out.includes('判据'))
  assert.ok(!out.includes('建议删除'))
  rmSync(dir, { recursive: true, force: true })
})

test('合规基准：GOOD 四维满分 total=80', () => {
  const dir = makeDir({ 'good.md': GOOD })
  assert.equal(score(dir, 'good.md').total, 80)
  rmSync(dir, { recursive: true, force: true })
})

test('level 分级（80 分制）：GOOD 健康 / NO_LANDING 预警 / NO_SOURCE 超标', () => {
  const dir = makeDir({ 'good.md': GOOD, 'mid.md': NO_LANDING, 'bad.md': NO_SOURCE })
  assert.equal(score(dir, 'good.md').level, '健康')      // total 80 ≥ 72
  assert.equal(score(dir, 'mid.md').level, '预警')       // total 70：56–71
  assert.equal(score(dir, 'bad.md').level, '超标')       // total 40 < 56
  rmSync(dir, { recursive: true, force: true })
})

test('BOM 容错：带 BOM 与不带 BOM 结果一致', () => {
  const dir = makeDir({ 'with.md': '\uFEFF' + GOOD, 'without.md': GOOD })
  assert.equal(score(dir, 'with.md').total, score(dir, 'without.md').total)
  rmSync(dir, { recursive: true, force: true })
})
