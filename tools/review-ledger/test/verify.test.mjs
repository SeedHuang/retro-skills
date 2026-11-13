// T4 校验器单测：10 类 red code 的判红 / 不判红；只读与 CLI 退出码。
// 对应 TC-05 / TC-11 / TC-12 / TC-18 / TC-22 / TC-24。
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { modelWithShared } from '../../docgen/models/agents/source.mjs'
import { verifyLedger } from '../verify.mjs'

const MODEL = modelWithShared('reviewer-audit')
const KIND = 'round-check'
const HEAD = '| 项 | 核对内容 | 判据 | 类型 | 结果 | 理由 | 适用性 | 证据 |'
const DELIM = '|---|---|---|---|---|---|---|---|'
const VERIFY = fileURLToPath(new URL('../verify.mjs', import.meta.url))
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')

const row = (no, verdict = '[人工] hit', reason = '', app = '', ev = '') =>
  `| ${no} | 内容${no} | 判据${no} | 可机判 | ${verdict} | ${reason} | ${app} | ${ev} |`
const table = (rows) => [HEAD, DELIM, ...rows].join('\n')
const clean = () => table(Array.from({ length: 8 }, (_, i) => row(i + 1)))
const codes = (text) => verifyLedger({ text, model: MODEL, kind: KIND }).reds.map((r) => r.code)
const PROV = '[机算] 命令=scs check landings --ledger .；退出码=0；首行=ok；时刻=2026-11-13 10:00:00 +08:00'

test('T4-01 干净表：reds 为空（TC-05）', () => {
  assert.deepEqual(verifyLedger({ text: clean(), model: MODEL, kind: KIND }).reds, [])
})

test('T4-02 表头列数不符 → header_mismatch', () => {
  const text = '| 项 | 核对内容 | 结果 | 证据 |\n|---|---|---|---|\n| 1 | a |  |  |'
  assert.ok(codes(text).includes('header_mismatch'))
})

test('T4-03 行键缺失 → row_keys_mismatch', () => {
  const text = table(Array.from({ length: 7 }, (_, i) => row(i + 1)))
  assert.ok(codes(text).includes('row_keys_mismatch'))
})

test('T4-04 重复行键 → duplicate_keys（TC-18）', () => {
  const text = table([row(1), row(2), row(3), row(3), row(5), row(6), row(7), row(8)])
  const reds = verifyLedger({ text, model: MODEL, kind: KIND }).reds
  const dup = reds.find((r) => r.code === 'duplicate_keys')
  assert.ok(dup)
  assert.match(dup.reason, /3/)
})

test('T4-05 空结果格 → pending_unmarked；有标记无值 → pending_unfilled（TC-12）', () => {
  assert.ok(codes(table([row(1, ''), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])).includes('pending_unmarked'))
  assert.ok(codes(table([row(1, '[待判]'), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])).includes('pending_unfilled'))
})

test('T4-06 空值合法清单：hit 证据可空；miss 缺理由 / na 缺适用性判红（TC-22）', () => {
  const hit = table([row(1, '[人工] hit', '', '', ''), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])
  assert.ok(!codes(hit).includes('missing_reason'))
  assert.ok(codes(table([row(1, '[人工] miss'), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])).includes('missing_reason'))
  assert.ok(codes(table([row(1, '[人工] na'), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])).includes('missing_applicability'))
})

test('T4-07 机算格置空 → machine_empty（TC-24）', () => {
  assert.ok(codes(table([row(1, '', '', '', PROV), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])).includes('machine_empty'))
  assert.ok(codes(table([row(1, '[机算]', '', '', PROV), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])).includes('machine_empty'))
})

test('T4-08 机算 provenance 缺失 / 与退出码不一致 → machine_overwritten（TC-11）', () => {
  const missing = '[机算] 命令=c；首行=ok；时刻=2026-11-13 10:00:00 +08:00'
  assert.ok(codes(table([row(1, '[机算] hit', '', '', missing), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])).includes('machine_overwritten'))
  const badCode = '[机算] 命令=c；退出码=1；首行=ok；时刻=2026-11-13 10:00:00 +08:00'
  assert.ok(codes(table([row(1, '[机算] hit', '', '', badCode), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])).includes('machine_overwritten'))
})

test('T4-09 合法机算格不判红', () => {
  const text = table([row(1, '[机算] hit', '', '', PROV), ...Array.from({ length: 7 }, (_, i) => row(i + 2))])
  assert.deepEqual(verifyLedger({ text, model: MODEL, kind: KIND }).reds, [])
})

test('T4-10 坏行 → parse_failed', () => {
  assert.ok(codes(`${clean()}\n| 9 | 少列 |`).includes('parse_failed'))
})

test('T4-12 非账本 kind：缺必需列即抛错，不产假红', () => {
  assert.throws(
    () => verifyLedger({ text: '', model: MODEL, kind: 'issue-card' }),
    /缺账本必需列：no, verdict, reason, applicability, evidence/,
  )
})

test('T4-11 CLI：干净 exit 0 / 判红 exit 1 / 只读', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-verify-'))
  try {
    const file = join(dir, 'round-check.md')
    writeFileSync(file, clean(), 'utf8')
    const before = sha(file)
    const ok = spawnSync(process.execPath, [VERIFY, file, '--kind', KIND, '--seat', 'reviewer-audit'], { encoding: 'utf8' })
    assert.equal(ok.status, 0, ok.stderr)
    assert.deepEqual(JSON.parse(ok.stdout).reds, [])
    assert.equal(sha(file), before)

    writeFileSync(file, table([row(1, '[人工] miss'), ...Array.from({ length: 7 }, (_, i) => row(i + 2))]), 'utf8')
    const bad = spawnSync(process.execPath, [VERIFY, file, '--kind', KIND, '--seat', 'reviewer-audit'], { encoding: 'utf8' })
    assert.notEqual(bad.status, 0)
    assert.ok(JSON.parse(bad.stdout).reds.some((r) => r.code === 'missing_reason'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
