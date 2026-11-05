// rule schema 层：字段白名单 + 封闭算子表 + 判定 + 结构校验
// 这是数据的唯一语义（基类）：判定实现只有这一份，任何解释器只消费、不定义判据
// 判据与测试分离：rule json 只装判据（白名单 7 必填字段 + 选填 type），cases 在 <id>.testcase.json
// 2026-11-05（阶段 2 V-3）：新增选填 `type`（判据类型，枚举三值）——原 7 字段仍全部必填，白名单扩为 8
export const ALLOWED_KEYS = ['id', 'impl', 'title', 'type', 'when', 'assert', 'residual', 'landing']
export const CRITERION_TYPES = ['持续适用', '条件触发', '模式门控']

export const OPS = {
  eq: { label: '等于', fn: (v, a) => v === a.value },
  nonEmpty: { label: '非空', fn: (v) => String(v ?? '').trim() !== '' },
  containsAny: { label: '包含任一字面量', fn: (v, a) => a.values.some((x) => String(v ?? '').includes(x)) },
  notForbiddenCommand: {
    label: '未命中禁止命令（最长允许前缀优先）',
    fn: (v, a) => {
      const cmd = String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
      const allowHit = a.allow.filter((x) => cmd.startsWith(String(x).trim().replace(/\s+/g, ' ').toLowerCase()))
      const forbidHit = a.forbid.filter((x) => cmd.startsWith(String(x).trim().replace(/\s+/g, ' ').toLowerCase()))
      if (forbidHit.length === 0) return true
      const longest = (arr) => arr.reduce((m, x) => Math.max(m, String(x).length), 0)
      if (a.conflict === 'longestAllowWins' && longest(allowHit) > longest(forbidHit)) return true
      return false
    },
  },
}

const norm = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
const evalCond = (c, input) => OPS[c.op].fn(input[c.field], c)

// 判定：唯一实现。when 不成立 = 不触发 = pass；when 成立则 assert 全部成立才 pass
export function judge(rule, input) {
  if (!evalCond(rule.when, input)) return 'pass'
  for (const a of rule.assert) {
    if (a.unless && evalCond(a.unless, input)) continue
    if (!evalCond(a, input)) return 'fail'
  }
  return 'pass'
}

function checkCond(cond, where, file, errors) {
  if (typeof cond !== 'object' || cond === null) { errors.push(`${file}: ${where} 必须是对象`); return }
  if (!OPS[cond.op]) errors.push(`${file}: ${where}.op 未注册 → ${JSON.stringify(cond.op)}（算子表封闭，散文不允许）`)
}

export function check(rule, file, errors) {
  for (const k of Object.keys(rule)) {
    if (!ALLOWED_KEYS.includes(k)) errors.push(`${file}: 未登记字段 ${k}（描述性字段不允许，判据只许写在 when/assert）`)
  }
  for (const k of ALLOWED_KEYS) {
    if (rule[k] === undefined) errors.push(`${file}: 缺字段 ${k}`)
  }
  if (rule.impl !== 'script') errors.push(`${file}: 本执行器只接受 impl=script`)
  if (rule.type !== undefined && !CRITERION_TYPES.includes(rule.type)) {
    errors.push(`${file}: type 非法枚举 → ${JSON.stringify(rule.type)}（只许 ${CRITERION_TYPES.join(' / ')}）`)
  }
  if (String(rule.title ?? '').includes('——')) errors.push(`${file}: title 不得含「——」（不许把判据复述进标题）`)
  checkCond(rule.when, 'when', file, errors)
  if (!Array.isArray(rule.assert) || rule.assert.length === 0) errors.push(`${file}: assert 必须是非空数组`)
  const knownFields = new Set([rule.when?.field])
  for (const [i, a] of (rule.assert ?? []).entries()) {
    checkCond(a, `assert[${i}]`, file, errors)
    knownFields.add(a.field)
    if (a.unless) { checkCond(a.unless, `assert[${i}].unless`, file, errors); knownFields.add(a.unless.field) }
    if (a.op === 'notForbiddenCommand') {
      if (!a.allow?.length || !a.forbid?.length) errors.push(`${file}: assert[${i}] allow/forbid 不得为空`)
      for (const x of a.allow ?? []) for (const y of a.forbid ?? []) {
        if (norm(x) === norm(y)) errors.push(`${file}: assert[${i}] allow 与 forbid 同项冲突 → ${x}`)
      }
      if (a.conflict !== 'longestAllowWins') errors.push(`${file}: assert[${i}].conflict 非法枚举`)
    }
  }
  if (!Number.isInteger(rule.residual?.sample) || rule.residual.sample <= 0) errors.push(`${file}: residual.sample 必须是正整数`)
  for (const f of rule.residual?.fields ?? []) {
    if (!knownFields.has(f)) errors.push(`${file}: residual.fields[${f}] 不在 when/assert 字段集内（残余必须指向判据判不死的字段）`)
  }
}

export function checkTestcase(tc, file, ruleIds, errors) {
  if (!ruleIds.has(tc.rule)) errors.push(`${file}: 引用的 rule 不存在 → ${tc.rule}`)
  if (!Array.isArray(tc.cases) || tc.cases.length === 0) errors.push(`${file}: cases 必须是非空数组`)
  if (!(tc.cases ?? []).some((c) => c.expect === 'pass')) errors.push(`${file}: 缺正例（防误拦无验证）`)
  if (!(tc.cases ?? []).some((c) => c.expect === 'fail')) errors.push(`${file}: 缺反例（防漏判无验证）`)
  for (const [i, c] of (tc.cases ?? []).entries()) {
    if (!['pass', 'fail'].includes(c.expect)) errors.push(`${file}: cases[${i}].expect 只许 pass/fail`)
  }
}

export const renderCond = (c) => `${c.field ?? ''} ${OPS[c.op]?.label ?? c.op}${c.value !== undefined ? ' ' + JSON.stringify(c.value) : (c.values ? ' ' + c.values.join(' / ') : '')}`
