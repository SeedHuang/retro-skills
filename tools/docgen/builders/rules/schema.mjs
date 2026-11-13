// rule schema 层：字段白名单 + 18 算子 + 递归判定 + 结构校验 + 渲染原语
// 这是数据的唯一语义（基类）：判定实现只有这一份，任何解释器只消费、不定义判据
// 判据与测试分离：rule json 只装判据，cases 在 <id>.testcase.json
// 阶段 2b：逻辑组合（anyOf / allOf / oneOf / not）、18 算子、probe 判定动作、渲染常量表
export const ALLOWED_KEYS = ['id', 'impl', 'type', 'scope', 'title', 'when', 'assert', 'residual', 'refs', 'landing']
export const CRITERION_TYPES = ['持续适用', '条件触发', '模式门控']

const COMBO_KEYS = ['anyOf', 'allOf', 'oneOf', 'not']
const VALUES_OPS = ['containsAny', 'notContains', 'startsWithAny', 'includesAll', 'includesAny']
const norm = (x) => String(x ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
const num = (v) => {
  if (v === null || v === undefined) return NaN
  if (typeof v === 'string' && v.trim() === '') return NaN
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}
const cmp = (v, a, ok) => Number.isFinite(num(v)) && ok(num(v), a.value)

// 18 个算子：fn 是判定语义（唯一实现），label 只服务触发条件的紧凑渲染
export const OPS = {
  eq: { label: (a) => `等于 ${JSON.stringify(a.value)}`, fn: (v, a) => v === a.value },
  nonEmpty: { label: () => '非空', fn: (v) => String(v ?? '').trim() !== '' },
  empty: { label: () => '为空', fn: (v) => String(v ?? '').trim() === '' },
  containsAny: { label: (a) => `包含任一：${a.values.join(' / ')}`, fn: (v, a) => a.values.some((x) => String(v ?? '').includes(x)) },
  notContains: { label: (a) => `不含任一：${a.values.join(' / ')}`, fn: (v, a) => !a.values.some((x) => String(v ?? '').includes(x)) },
  startsWithAny: {
    label: (a) => `以任一开头：${a.values.join(' / ')}`,
    fn: (v, a) => {
      const s = norm(v)
      return a.values.some((x) => s.startsWith(norm(x)))
    },
  },
  matches: { label: (a) => `匹配 ${a.pattern}`, fn: (v, a) => new RegExp(a.pattern).test(String(v ?? '')) },
  notMatches: { label: (a) => `不匹配 ${a.pattern}`, fn: (v, a) => !new RegExp(a.pattern).test(String(v ?? '')) },
  gt: { label: (a) => `> ${a.value}`, fn: (v, a) => cmp(v, a, (n, x) => n > x) },
  gte: { label: (a) => `>= ${a.value}`, fn: (v, a) => cmp(v, a, (n, x) => n >= x) },
  lt: { label: (a) => `< ${a.value}`, fn: (v, a) => cmp(v, a, (n, x) => n < x) },
  lte: { label: (a) => `<= ${a.value}`, fn: (v, a) => cmp(v, a, (n, x) => n <= x) },
  countEq: { label: (a) => `计数等于 ${a.value}`, fn: (v, a) => cmp(v, a, (n, x) => n === x) },
  countLte: { label: (a) => `计数 <= ${a.value}`, fn: (v, a) => cmp(v, a, (n, x) => n <= x) },
  countGte: { label: (a) => `计数 >= ${a.value}`, fn: (v, a) => cmp(v, a, (n, x) => n >= x) },
  includesAll: { label: (a) => `包含全部：${a.values.join(' / ')}`, fn: (v, a) => a.values.every((x) => Array.isArray(v) && v.includes(x)) },
  includesAny: { label: (a) => `包含任一：${a.values.join(' / ')}`, fn: (v, a) => a.values.some((x) => Array.isArray(v) && v.includes(x)) },
  notForbiddenCommand: {
    label: () => '不在禁止清单内',
    fn: (v, a) => {
      const cmd = norm(v)
      const hit = (list) => (list ?? []).filter((x) => cmd.startsWith(norm(x)))
      const allowHit = hit(a.allow)
      const forbidHit = hit(a.forbid)
      if (forbidHit.length === 0) return true
      const longest = (arr) => arr.reduce((m, x) => Math.max(m, norm(x).length), 0)
      return a.conflict === 'longestAllowWins' && longest(allowHit) > longest(forbidHit)
    },
  },
}

export const LOGIC_LABELS = {
  anyOf: { head: '以下任一', sep: ' 或 ' },
  allOf: { head: '全部满足', sep: ' 且 ' },
  oneOf: { head: '恰好一个', sep: ' 或 ' },
  not: { head: '不得' },
}

export const PREDICATE = {
  eq: (a) => (a.value === true ? '必须成立' : a.value === false ? '必须不成立' : `必须等于 ${JSON.stringify(a.value)}`),
  nonEmpty: () => '必须非空',
  empty: () => '必须为空',
  containsAny: (a) => `必须包含以下任一：${a.values.join(' / ')}`,
  notContains: (a) => `不得包含以下任一：${a.values.join(' / ')}`,
  startsWithAny: (a) => `必须以以下任一项开头：${a.values.join(' / ')}`,
  matches: (a) => `必须匹配 \`${a.pattern}\``,
  notMatches: (a) => `不得匹配 \`${a.pattern}\``,
  gt: (a) => `必须大于 ${a.value}`,
  gte: (a) => `必须 ≥ ${a.value}`,
  lt: (a) => `必须小于 ${a.value}`,
  lte: (a) => `必须 ≤ ${a.value}`,
  countEq: (a) => `计数必须等于 ${a.value}`,
  countLte: (a) => `计数必须 ≤ ${a.value}`,
  countGte: (a) => `计数必须 ≥ ${a.value}`,
  includesAll: (a) => `必须包含全部：${a.values.join(' / ')}`,
  includesAny: (a) => `必须包含以下任一项：${a.values.join(' / ')}`,
  notForbiddenCommand: () => '必须不在禁止清单内',
}

export const PROBE_TEXT = {
  'command:exit': (p) => `运行 \`${p.run}\`，取退出码`,
  'command:stdout': (p) => `运行 \`${p.run}\`，取输出首行`,
  'file:exists': (p) => `检查 \`${p.path}\` 是否存在`,
  'file:content': (p) => `读取 \`${p.path}\` 内容`,
  'glob:count': (p) => `统计 \`${p.path}\` 的文件数`,
  'glob:names': (p) => `列出文件名（\`${p.path}\`）`,
}

const PROBE_KINDS = {
  command: { required: ['run'], takes: ['exit', 'stdout'] },
  file: { required: ['path'], takes: ['exists', 'content'] },
  glob: { required: ['path'], takes: ['count', 'names'] },
  manual: { required: [], takes: null },
}

const comboKeysOf = (n) => (n && typeof n === 'object' ? COMBO_KEYS.filter((k) => n[k] !== undefined) : [])
const comboTypeOf = (n) => comboKeysOf(n)[0]
const isCombo = (n) => comboKeysOf(n).length > 0

// 判定：唯一实现。when 不成立 = 不触发 = pass；when 成立则 assert 全部成立才 pass
export function evalCond(c, input) {
  if (!c || typeof c !== 'object') return false
  if (c.unless && evalCond(c.unless, input)) return true
  if (Array.isArray(c.anyOf) && c.anyOf.length) return c.anyOf.some((x) => evalCond(x, input))
  if (Array.isArray(c.allOf) && c.allOf.length) return c.allOf.every((x) => evalCond(x, input))
  if (Array.isArray(c.oneOf) && c.oneOf.length) return c.oneOf.filter((x) => evalCond(x, input)).length === 1
  if (c.not !== undefined) return !evalCond(c.not, input)
  if (c.always === true) return true
  return OPS[c.op] ? OPS[c.op].fn(input[c.field], c) : false
}

export function judge(rule, input) {
  if (!evalCond(rule.when, input)) return 'pass'
  for (const a of rule.assert ?? []) if (!evalCond(a, input)) return 'fail'
  return 'pass'
}

// ---------- 渲染原语 ----------

function renderProbeSegment(probe) {
  if (!probe || probe.kind === 'manual') return ''
  const fn = PROBE_TEXT[`${probe.kind}:${probe.take}`]
  return fn ? `${fn(probe)}；` : ''
}

function renderChild(node, parentType) {
  if (isCombo(node)) {
    const body = renderComboBody(node)
    const type = comboTypeOf(node)
    if (type === 'not') return body
    return type === parentType ? body : `（${body}）`
  }
  return node.name ?? node.field
}

function renderComboBody(node) {
  if (node.not !== undefined) {
    const inner = isCombo(node.not) ? renderComboBody(node.not) : node.not.name ?? node.not.field
    return `不得（${inner}）`
  }
  const type = comboTypeOf(node)
  const { head, sep } = LOGIC_LABELS[type]
  return `${head}：${node[type].map((x) => renderChild(x, type)).join(sep)}`
}

/** 触发文案：always → 始终适用；有 label → label；否则紧凑渲染（叶子例：flag 等于 true） */
export function renderTrigger(rule) {
  const w = rule?.when
  if (!w || typeof w !== 'object') return ''
  if (w.always === true) return '始终适用'
  if (typeof w.label === 'string' && w.label.trim() !== '') return w.label
  return renderNode(w)
}

function renderNode(node) {
  if (isCombo(node)) {
    if (node.not !== undefined) return `不得（${isCombo(node.not) ? renderNode(node.not) : renderNode(node.not)}）`
    const type = comboTypeOf(node)
    const { head, sep } = LOGIC_LABELS[type]
    return `${head}：${node[type].map((x) => (isCombo(x) ? renderNode(x) : x.name ?? x.field)).join(sep)}`
  }
  return `${node.field} ${OPS[node.op].label(node)}`
}

/** 顶层义务行（含 `N. ` 前缀）；组合子项按 name → field 取名，嵌套组合不渲染 label */
export function renderObligation(node, index) {
  const label = node.label ?? ''
  let line
  if (isCombo(node)) {
    line = `${label}（${renderComboBody(node)}）`
  } else {
    line = `${label}：${renderProbeSegment(node.probe)}${PREDICATE[node.op](node)}`
  }
  if (node.unless) line += `（例外：${node.unless.label ?? renderNode(node.unless)}）`
  let text = `${index + 1}. ${line}`
  if (node.op === 'notForbiddenCommand') {
    text += `\n   - 允许：${(node.allow ?? []).join(' / ')}`
    text += `\n   - 禁止：${(node.forbid ?? []).join(' / ')}`
  }
  return text
}

// ---------- 校验 ----------

const SCOPE_RE = /^(project|skill):[a-z0-9][a-z0-9-]*$/
const LABEL_LOGIC_WORDS = ['或', '且', '任一', '全部', '至少', '恰好', '之一']
const LABEL_MODAL_WORDS = ['必须', '须', '应当', '需要', '不得', '不许', '请', '给出', '写出', '附上', '贴出', '执行', '跑', '确认']
const LABEL_PUNCT = /[，。；：、！？,.;:!?/]/
const FIX_TEXT = 'label 只许名词短语（≤12 字符、不含逻辑词/情态词/标点）；谓词由算子产出'

function checkLabel(label, where, out) {
  const s = String(label).trim()
  const logic = LABEL_LOGIC_WORDS.find((w) => s.includes(w))
  if (logic) {
    out.push({ code: 'LogicWordInLabel', message: `${where} label 含逻辑连接词「${logic}」` })
    return
  }
  const modal = LABEL_MODAL_WORDS.find((w) => s.includes(w))
  if (modal || LABEL_PUNCT.test(s) || s.length > 12) {
    const why = modal ? `含情态/祈使词「${modal}」` : LABEL_PUNCT.test(s) ? '含标点' : `长度 ${s.length} > 12`
    out.push({ code: 'LabelShape', message: `${where} label ${why}；${FIX_TEXT}` })
  }
}

function walkCond(node, where, depth, out, fields) {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    out.push({ code: 'Schema', message: `${where} 必须是对象` })
    return
  }
  if (node.always === true) return
  const keys = comboKeysOf(node)
  if (keys.length > 1) {
    out.push({ code: 'LogicConflict', message: `${where} 同一节点出现多个逻辑键：${keys.join(' / ')}` })
    return
  }
  if (keys.length === 1) {
    const k = keys[0]
    const next = depth + 1
    if (next > 3) out.push({ code: 'DepthExceeded', message: `${where} 组合深度 ${next} > 3（顶层组合 = 1，not 也计 1 层）` })
    if (k === 'not') {
      if (typeof node.not !== 'object' || node.not === null || Array.isArray(node.not)) {
        out.push({ code: 'Schema', message: `${where}.not 必须是条件对象` })
      } else {
        walkCond(node.not, `${where}.not`, next, out, fields)
      }
    } else {
      const arr = node[k]
      if (!Array.isArray(arr)) {
        out.push({ code: 'Schema', message: `${where}.${k} 必须是数组` })
      } else {
        if (arr.length < 2) out.push({ code: 'LogicArity', message: `${where}.${k} 至少 2 项` })
        for (const [i, x] of arr.entries()) walkCond(x, `${where}.${k}[${i}]`, next, out, fields)
      }
    }
    if (node.unless) walkCond(node.unless, `${where}.unless`, depth, out, fields)
    return
  }
  // 叶子
  if (typeof node.field !== 'string' || node.field === '') out.push({ code: 'Schema', message: `${where} 缺字段 field` })
  else fields.add(node.field)
  if (!node.op || !OPS[node.op]) {
    out.push({ code: 'Schema', message: `${where}.op 未注册 → ${JSON.stringify(node.op)}（算子表封闭，散文不允许）` })
  } else {
    if (VALUES_OPS.includes(node.op) && (!Array.isArray(node.values) || node.values.length === 0)) {
      out.push({ code: 'Schema', message: `${where}.values 不得为空` })
    }
    if (node.op === 'matches' || node.op === 'notMatches') {
      if (typeof node.pattern !== 'string' || node.pattern === '') {
        out.push({ code: 'Schema', message: `${where}.pattern 不得为空` })
      } else {
        try { new RegExp(node.pattern) } catch { out.push({ code: 'Schema', message: `${where}.pattern 非法正则` }) }
      }
    }
    if (node.op === 'notForbiddenCommand') {
      if (!Array.isArray(node.allow) || node.allow.length === 0) out.push({ code: 'Schema', message: `${where}.allow 不得为空` })
      if (!Array.isArray(node.forbid) || node.forbid.length === 0) out.push({ code: 'Schema', message: `${where}.forbid 不得为空` })
      if (node.conflict !== 'longestAllowWins') out.push({ code: 'Schema', message: `${where}.conflict 只许 longestAllowWins` })
    }
  }
  if (node.unless) walkCond(node.unless, `${where}.unless`, depth, out, fields)
}

function checkProbe(probe, where, out) {
  if (!probe || typeof probe !== 'object') {
    out.push({ code: 'ProbeSchema', message: `${where}.probe 缺` })
    return
  }
  const spec = PROBE_KINDS[probe.kind]
  if (!spec) {
    out.push({ code: 'ProbeSchema', message: `${where}.probe.kind ${JSON.stringify(probe.kind)} 非法` })
    return
  }
  for (const k of spec.required) {
    if (typeof probe[k] !== 'string' || probe[k].trim() === '') out.push({ code: 'ProbeSchema', message: `${where}.probe.${probe.kind} 缺 ${k}` })
  }
  if (spec.takes && !spec.takes.includes(probe.take)) {
    out.push({ code: 'ProbeSchema', message: `${where}.probe.${probe.kind}.take ${JSON.stringify(probe.take)} 非法（只许 ${spec.takes.join(' / ')}）` })
  }
}

/** 结构校验：把 finding 追加到 out（{code,message}），不做 I/O */
export function check(rule, file, out) {
  if (typeof rule !== 'object' || rule === null || Array.isArray(rule)) {
    out.push({ code: 'Schema', message: '判据必须是对象' })
    return
  }
  for (const k of Object.keys(rule)) {
    if (!ALLOWED_KEYS.includes(k)) out.push({ code: 'Schema', message: `未登记字段 ${k}（描述性字段不允许，判据只许写在 when/assert）` })
  }
  // scope / type 各有专属 code，不进泛化缺字段检查
  for (const k of ['id', 'impl', 'title', 'when', 'assert', 'residual', 'landing']) {
    if (rule[k] === undefined) out.push({ code: 'Schema', message: `缺字段 ${k}` })
  }
  if (rule.id !== undefined && (typeof rule.id !== 'string' || rule.id.trim() === '')) out.push({ code: 'Schema', message: '缺字段 id' })
  if (rule.impl !== undefined && rule.impl !== 'script') out.push({ code: 'Schema', message: '本执行器只接受 impl=script' })
  if (typeof rule.title === 'string' && rule.title.includes('——')) out.push({ code: 'Schema', message: 'title 不得含「——」（不许把判据复述进标题）' })
  if (rule.refs !== undefined && (!Array.isArray(rule.refs) || rule.refs.some((x) => typeof x !== 'string'))) {
    out.push({ code: 'Schema', message: 'refs 必须是字符串数组' })
  }

  if (rule.type === undefined) out.push({ code: 'TypeMissing', message: `缺字段 type（只许 ${CRITERION_TYPES.join(' / ')}）` })
  else if (!CRITERION_TYPES.includes(rule.type)) out.push({ code: 'TypeInvalid', message: `type 非法枚举 → ${JSON.stringify(rule.type)}（只许 ${CRITERION_TYPES.join(' / ')}）` })

  if (rule.scope === undefined) out.push({ code: 'ScopeMissing', message: '缺字段 scope（只许 global / project:<name> / skill:<name>）' })
  else if (rule.scope !== 'global' && !SCOPE_RE.test(rule.scope)) out.push({ code: 'ScopeInvalid', message: `scope 非法 → ${JSON.stringify(rule.scope)}（只许 global / project:<name> / skill:<name>，name 匹配 ^[a-z0-9][a-z0-9-]*$）` })

  const fields = new Set()
  if (rule.when !== undefined) walkCond(rule.when, 'when', 0, out, fields)

  if (!Array.isArray(rule.assert) || rule.assert.length === 0) {
    out.push({ code: 'Schema', message: 'assert 必须是非空数组' })
  } else {
    for (const [i, a] of rule.assert.entries()) {
      walkCond(a, `assert[${i}]`, 0, out, fields)
      if (typeof a?.label !== 'string' || a.label.trim() === '') out.push({ code: 'AssertLabelMissing', message: `assert[${i}] 缺 label` })
      else checkLabel(a.label, `assert[${i}]`, out)
      if (a?.unless) {
        if (typeof a.unless.label !== 'string' || a.unless.label.trim() === '') out.push({ code: 'UnlessLabelMissing', message: `assert[${i}] 的 unless 缺 label（例外必须命名）` })
        else checkLabel(a.unless.label, `assert[${i}].unless`, out)
      }
      if (!a?.probe) out.push({ code: 'RuleWithoutProbe', message: `${rule.id} assert[${i}] 缺 probe（全部判据都要求顶层 probe）` })
      else checkProbe(a.probe, `assert[${i}]`, out)
    }
  }

  const res = rule.residual
  if (typeof res !== 'object' || res === null) {
    out.push({ code: 'Schema', message: '缺字段 residual' })
  } else {
    if (typeof res.who !== 'string' || res.who.trim() === '') out.push({ code: 'ResidualWhoMissing', message: 'residual.who 不得为空' })
    if (!Number.isInteger(res.sample) || res.sample <= 0) out.push({ code: 'ResidualSampleInvalid', message: 'residual.sample 必须是正整数' })
    if (typeof res.objectivePath !== 'string' || res.objectivePath.trim() === '') out.push({ code: 'ResidualObjectivePathMissing', message: 'residual.objectivePath 不得为空' })
    for (const f of res.fields ?? []) {
      if (!fields.has(f)) out.push({ code: 'FieldLabelMissing', message: `residual.fields 指向未知字段 ${f}（残余必须指向 when/assert 里出现过的字段）` })
    }
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

/**
 * 门面：schema 判定 + testcase 校验，统一返回 Finding[]，不抛。
 * checkTestcase 产字符串，这里包成 {code:'Testcase'}；无 testcase 追加 MissingTestcase。
 */
export function validate(rule, { testcase, ruleIds } = {}) {
  const findings = []
  const name = rule?.id ?? 'rule'
  check(rule, name, findings)
  if (!testcase || Object.keys(testcase).length === 0) {
    findings.push({ code: 'MissingTestcase', message: `缺 testcase：${name}.testcase.json` })
    return findings
  }
  const raw = []
  checkTestcase(testcase, name, ruleIds ?? new Set([rule.id]), raw)
  for (const message of raw) findings.push({ code: 'Testcase', message })
  return findings
}

export const RuleModel = {
  typeName: 'RuleModel',
  fields: ['id', 'impl', 'type', 'scope', 'title', 'when', 'assert', 'residual', 'refs', 'landing'],
  validate,
}
