// 定论复现守卫：README「定论」中的读取量 / 写侧代写字数必须与 measure 脚本一致。
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SCRIPT = fileURLToPath(new URL('../scripts/measure-token-efficiency.mjs', import.meta.url))

test('T6-04 账本效率定论可复现（--check + --json）', () => {
  const root = mkdtempSync(join(tmpdir(), 'ledger-measure-'))
  try {
    const check = spawnSync(process.execPath, [SCRIPT, '--root', root, '--check'], { encoding: 'utf8' })
    assert.equal(check.status, 0, check.stdout + check.stderr)
    assert.match(check.stdout, /measure ok/)

    const json = spawnSync(process.execPath, [SCRIPT, '--root', root, '--json'], { encoding: 'utf8' })
    assert.equal(json.status, 0, json.stderr)
    const m = JSON.parse(json.stdout)
    assert.deepEqual(m.long, { lines: 134, chars: 3662, default3: 1486, minimal3: 536 })
    assert.deepEqual(m.short, { lines: 32, chars: 1402, default3: 1608, minimal3: 624 })
    assert.deepEqual(m.write, { rows: 8, rowsChars: 762, templateChars: 639, evidenceChars: 121 })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
