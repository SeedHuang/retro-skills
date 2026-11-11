// BaseModel：所有 agent 卡共有字段
// 字段格式：[类型, 必填]
export const VALUE_CHECKS = {
  Seat: (o, p) => req(o, ['id', 'display', 'triggers', 'description', 'artifacts'], p),
  Trigger: (o, p) => {
    const el = ['objects', 'perspective', 'scope', 'action', 'timing', 'schedule'].some((k) => k in o)
    return el || 'id' in o ? [] : [`MISSING:${p}.(element|id)`]
  },
  Timing: (o, p) => req(o, ['scene', 'moment', 'repeat'], p),
  Description: (o, p) => req(o, ['template', 'joiner', 'lastJoiner'], p),
  Duty: (o, p) => req(o, ['trigger', 'action'], p),
  Checklist: (o, p) =>
    req(o, ['items'], p).concat((o.items || []).flatMap((x, i) => req(x, ['no', 'seatPrefix', 'category', 'criterion'], `${p}.items[${i}]`))),
  Criterion: (o, p) => req(o, ['action', 'mode', 'observable', 'negative', 'residual'], p),
  Observable: (o, p) => req(o, ['op', 'ofRef'], p),
  Negative: (o, p) => req(o, ['input', 'expect', 'failsOn'], p),
  Residual: (o, p) => req(o, ['who', 'sample', 'fields', 'objective'], p),
  Objective: (o, p) =>
    (!('target' in o) ? [`MISSING:${p}.target`] : []).concat('machineCmd' in o || 'reason' in o ? [] : [`MISSING:${p}.(machineCmd|reason)`]),
  Record: (o, p) => req(o, ['label', 'unit', 'source', 'shape'], p),
  Field: (o, p) => req(o, ['id', 'label', 'type', 'required'], p),
  Source: (o, p) => (!('kind' in o) ? [`MISSING:${p}.kind`] : []),
  Form: (o, p) =>
    req(o, ['text', 'kind'], p).concat(['path', 'prefix', 'match'].some((k) => k in o) ? [] : [`MISSING:${p}.(path|prefix|match)`]),
  Template: (o, p) => req(o, ['skill', 'label', 'columns'], p),
  Outputs: (o, p) => req(o, ['items'], p).concat((o.items || []).flatMap((x, i) => req(x, ['phase', 'artifact', 'template', 'action', 'mode'], `${p}.items[${i}]`))),
  Permissions: (o, p) => req(o, ['policy', 'action', 'write', 'command'], p),
  Rule: (o, p) => req(o, ['id', 'criterion', 'targets'], p),
  Predicate: (o, p) => req(o, ['ok', 'bad', 'slots'], p),
  Escalation: (o, p) => req(o, ['title', 'recipients', 'report', 'steps'], p),
}

function req(o, keys, p) {
  return keys.filter((k) => !(k in o)).map((k) => `MISSING:${p}.${k}`)
}

function checkShape(type, v, p) {
  const fn = VALUE_CHECKS[type]
  if (!fn) return null
  if (v === null || typeof v !== 'object') return `TYPE:${p}!=${type}`
  return fn(v, p)[0] || null
}

function checkValue(type, v, p) {
  if (type === 'string|null') return v === null || typeof v === 'string' ? null : `TYPE:${p}!=string|null`
  if (type === 'Escalation|null') return v === null ? null : checkShape('Escalation', v, p)
  if (type.startsWith('Map<')) {
    const inner = type.slice(4, -1)
    for (const [k, x] of Object.entries(v || {})) {
      const e = checkShape(inner, x, `${p}.${k}`)
      if (e) return e
    }
    return null
  }
  if (type.endsWith('[]')) {
    const inner = type.slice(0, -2)
    for (let i = 0; i < (v || []).length; i++) {
      const e = checkShape(inner, v[i], `${p}[${i}]`)
      if (e) return e
    }
    return null
  }
  return checkShape(type, v, p)
}

export class BaseModel {
  static typeName = 'BaseModel'

  static fields = {
    version: ['number', true],
    id: ['string', true],
    extends: ['string', true],
    modelType: ['string', false],
    seat: ['Seat', true],
    duty: ['Duty', true],
    timing: ['Timing', true],
    defaultLanding: ['string|null', true],
    checklist: ['Checklist', true],
    checkCriteria: ['Map<Criterion>', true],
    templates: ['Map<Template>', true],
    outputs: ['Outputs', true],
    forms: ['Map<Form>', true],
    records: ['Map<Record>', true],
    permissions: ['Permissions', true],
    escalation: ['Escalation|null', true],
    must: ['Rule[]', true],
    predicates: ['Map<Predicate>', true],
    outputFormat: ['object', false],
  }

  /** 子类实现：是否为该类型 */
  static matches() {
    return false
  }

  /** 子类实现：类型专属约束 */
  static extra() {
    return []
  }

  static validate(obj) {
    const errs = []
    for (const [k, [type, required]] of Object.entries(this.fields)) {
      if (!(k in obj)) {
        if (required) errs.push(`MISSING:${k}`)
        continue
      }
      const e = checkValue(type, obj[k], k)
      if (e) errs.push(e)
    }
    // 显式类型只接受三个已知类型名；不写则不校验（退回特征推断）
    if ('modelType' in obj && !['ReviewerModel', 'AuditorModel', 'RespondentModel'].includes(obj.modelType)) {
      errs.push(`MODELTYPE_UNKNOWN:${obj.modelType}`)
    }
    return errs.concat(this.extra(obj))
  }
}
