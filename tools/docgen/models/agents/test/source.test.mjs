import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  MODELS_DIR, listSeats, modelSeats, renderSeatText, renderAllSeats, modelWithShared,
  triggerKindsOf, collectModelFindings, NON_PARL_SEATS,
} from '../source.mjs'

test('source：18 席模型齐、席名唯一、模型文件存在', () => {
  const seats = listSeats()
  assert.equal(seats.length, 18)
  assert.equal(new Set(seats).size, seats.length)
  for (const seat of seats) assert.ok(existsSync(join(MODELS_DIR, seat, 'index.json')), seat)
})

test('source：SEAT_ORDER 与 models 目录双向相等（新增模型不得静默漏检）', () => {
  assert.deepEqual(modelSeats(), listSeats().slice().sort())
})

test('source：agents/*.md 与模型渲染逐字节相等，且两次渲染同字节（I2）', () => {
  for (const { seat, text } of renderAllSeats()) {
    assert.equal(readFileSync(`agents/${seat}.md`, 'utf8'), text, `${seat}: 盘上卡必须等于模型渲染`)
    assert.equal(renderSeatText(seat), text, `${seat}: 两次渲染必须同字节`)
  }
})

test('source：description 缺口已补齐（senior-sdet / speaker 的「当」前缀 + sdet 的「不用于」）', () => {
  const desc = (seat) => /^description:\s*(.+)$/m.exec(renderSeatText(seat))?.[1]?.trim()
  assert.ok(desc('speaker').startsWith('当议会评审轮需要'))
  assert.ok(desc('senior-sdet').startsWith('当需要为 PRD、spec 设计并编写测试用例'))
  assert.ok(desc('senior-sdet').endsWith('（那走 reviewer-qa）'))
  assert.ok(desc('senior-sdet').includes('；不用于：'))
})

test('source：trigger.kind 四型齐全，非议会席只许 need', () => {
  const four = new Set(['dispatch', 'occasion', 'moment', 'need'])
  for (const seat of listSeats()) {
    const kinds = [...new Set(triggerKindsOf(seat))]
    assert.equal(kinds.length, 1, `${seat}: 同席 kind 必须唯一（实得 ${kinds.join('+')}）`)
    assert.ok(four.has(kinds[0]), `${seat}: kind 不在四值内（${kinds[0]}）`)
    if (NON_PARL_SEATS.includes(seat)) assert.equal(kinds[0], 'need', `${seat}: 非议会席只许 need`)
  }
})

test('source：modelWithShared 带共享层 verdicts，collectModelFindings 零 findings', () => {
  const m = modelWithShared('reviewer-backend')
  assert.ok(Array.isArray(m.verdicts.enum) && m.verdicts.enum.length === 3)
  assert.deepEqual(collectModelFindings(), [])
})
