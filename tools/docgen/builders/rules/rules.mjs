// rules.mjs —— 「rule 正文 = 判据投影」的唯一实现（严格按 rule-dsl 模式）
// 为什么不再有 carriers / 散文数据：data + script 的目的是防漂移 / 保执行力 / 可测。
// 正文由**判据 json**经解释器渲染产出（散文只是投影，不是数据），手改正文即红。
// 注册：rules.json 列出「哪些判据 id 需要额外投影成 rules/<id>.md」。
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { interpreters } from './interpreters.mjs'

const DIR = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(DIR, '..', '..', '..', '..') // copy-aware：在副本里跑时 REPO = 副本根
// 判据数据与构建器分居两地：json 在 dsl/rules（唯一数据源），引擎与投影在 builders/rules
const DATA_REL_DIR = ['tools', 'docgen', 'dsl', 'rules']
const strip = (t) => t.replace(/^\uFEFF/, '')
const RULE_PROJECTION = () => interpreters.find((i) => i.id === 'rule')

export function listRuleIds() {
  const p = join(REPO, ...DATA_REL_DIR, 'rules.json')
  if (!existsSync(p)) return []
  return JSON.parse(strip(readFileSync(p, 'utf8'))).rules ?? []
}

export function loadRule(id, root = REPO) {
  return JSON.parse(strip(readFileSync(join(root, ...DATA_REL_DIR, `${id}.json`), 'utf8')))
}

/** 纯渲染（入参已加载的判据数据；校验器在 `--root` 临时根里必须用这一版） */
export function renderRuleData(rule) {
  const it = RULE_PROJECTION()
  if (!it) throw new Error('解释器 rule 未注册')
  return it.render(rule)
}

export function renderRule(id, root = REPO) {
  return renderRuleData(loadRule(id, root))
}

export function writeRule(id, root = REPO) {
  const p = join(root, 'rules', `${id}.md`)
  writeFileSync(p, renderRule(id, root), 'utf8')
  return p
}
