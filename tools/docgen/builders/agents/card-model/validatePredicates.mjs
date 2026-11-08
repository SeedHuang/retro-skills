// 判据表校验器（S3 spec §4）：`validatePredicates(predicates)` → `{ ok, errors }`。
// 纯函数：**函数体内零 IO**、零环境依赖、不改入参；词表与标记表在模块加载时读（与 `validateCardModel` 同形）。
// `path` 形态定死（**不带 `predicates[<id>]` 前缀**）：`label` / `observable` / `observable[<i>]` /
// `negativeSample` / `residual.who` / `residual.sample`；报文行 `predicates[<id>].<path>：<message>` 由 `gate` 拼。
// **0 新码**：只复用既有两码（D1 → `SubjectiveLabel`；D2–D5 → `UnverifiableOutput`）。
import { readFileSync } from 'node:fs'
import { subjectiveHit } from './vocab/subjective-terms.mjs'

const OBSERVABLE = JSON.parse(
  readFileSync(new URL('../../../../quality/observable-terms.json', import.meta.url), 'utf8'),
)
const MARKERS = OBSERVABLE.markers
const isString = (v) => typeof v === 'string'
const blank = (v) => !isString(v) || v.trim() === ''
const hasMarker = (s) => MARKERS.some((m) => new RegExp(m.pattern).test(s))

export function validatePredicates(predicates) {
  const errors = []
  const push = (code, path, message) => errors.push({ code, path, message })
  const map = predicates !== null && typeof predicates === 'object' ? predicates : {}
  for (const p of Object.values(map)) {
    const one = p !== null && typeof p === 'object' ? p : {}
    // D1：label 命中主观词 → 红（observable 写满不豁免）
    if (subjectiveHit(one.label)) {
      push('SubjectiveLabel', 'label', 'label 命中主观词表（observable 写满不豁免，S3 D1）')
    }
    // D2：observable 非数组 / 长度 0 / 含空串或非字符串
    if (!Array.isArray(one.observable)) {
      push('UnverifiableOutput', 'observable', 'observable 必须是数组且非空（S3 D2）')
    } else if (one.observable.length === 0) {
      push('UnverifiableOutput', 'observable', 'observable 长度不得为 0（S3 D2）')
    } else {
      one.observable.forEach((item, i) => {
        // D2 元素面 + D5：元素必须是字符串，且命中 ≥1 可观察标记
        if (blank(item)) {
          push('UnverifiableOutput', `observable[${i}]`, 'observable 元素必须是非空字符串（S3 D2）')
        } else if (!hasMarker(item)) {
          push('UnverifiableOutput', `observable[${i}]`, 'observable 元素未命中任何可观察标记（S3 D5）')
        }
      })
    }
    // D3：negativeSample 缺 / 空
    if (blank(one.negativeSample)) {
      push('UnverifiableOutput', 'negativeSample', 'negativeSample 缺或去空白为空（S3 D3）')
    }
    // D4：residual 缺 / who 空 / sample 非正整数
    const r = one.residual
    if (r === null || typeof r !== 'object') {
      push('UnverifiableOutput', 'residual.who', 'residual 缺或非对象（S3 D4）')
    } else {
      if (blank(r.who)) push('UnverifiableOutput', 'residual.who', 'residual.who 缺或去空白为空（S3 D4）')
      if (!Number.isInteger(r.sample) || r.sample <= 0) {
        push('UnverifiableOutput', 'residual.sample', 'residual.sample 必须是正整数（S3 D4）')
      }
    }
  }
  return { ok: errors.length === 0, errors }
}
