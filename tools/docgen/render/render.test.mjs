import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { h1, h2, h3, para, notes, bullets, ordered, blank, raw, renderBlocks } from './index.mjs'
import { renderRule } from '../builders/rules/rules.mjs'

test('块级渲染：标题/段落/引用/列表/空行/raw', () => {
  const text = renderBlocks([
    h1('一'), blank(), h2('二'), blank(), h3('三'), blank(),
    para('段落'), blank(), notes('注'), blank(),
    bullets(['甲', '乙']), blank(), ordered(['丙', '丁']), blank(), raw(['原样1', '原样2']),
  ])
  assert.equal(text, '# 一\n\n## 二\n\n### 三\n\n段落\n\n> 注\n\n- 甲\n- 乙\n\n1. 丙\n2. 丁\n\n原样1\n原样2')
})

test('renderBlocks 不自动加尾换行', () => {
  assert.equal(renderBlocks([para('x')]), 'x')
})

const IDS = ['evidence-before-conclusion', 'observable-criteria', 'import-guard', 'no-git-write', 'no-unverified-number']

test('5 份 rule 投影逐字节相等', () => {
  for (const id of IDS) {
    const onDisk = readFileSync(join('tools', 'docgen', 'builders', 'rules', `${id}.md`), 'utf8')
    assert.equal(renderRule(id), onDisk, `DIFF ${id}`)
  }
})
