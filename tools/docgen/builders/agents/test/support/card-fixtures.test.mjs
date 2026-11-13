import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { coldRepo } from './card-fixtures.mjs'

test('coldRepo keepGit=true 复制 .git', () => {
  coldRepo({ keepGit: true, verify: (copy) => assert.ok(existsSync(join(copy, '.git', 'HEAD'))) })
})

test('coldRepo 默认不含 .git', () => {
  coldRepo({ verify: (copy) => assert.ok(!existsSync(join(copy, '.git'))) })
})
