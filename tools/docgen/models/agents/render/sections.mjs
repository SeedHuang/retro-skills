import { TIERS } from '../../../builders/agents/policy/definitions/tiers.mjs'
import { SEATS } from '../../../builders/agents/policy/definitions/seats.mjs'
import { writeScopes } from '../../../builders/agents/policy/definitions/writeScopes.mjs'
import { renderAuthority, renderBan, renderAftermath } from '../../../builders/agents/components/renderBoundary.mjs'
import { DEFAULT_BOUNDARY } from '../../../builders/agents/components/patternRegistry.mjs'
import { h1, h2, para, notes, bullets, blank, raw } from '../../../render/index.mjs'

const cn = (a, b) => (/[A-Za-z0-9)]$/.test(a) ? a + ' ' + b : a + b)

// 落点单源：artifact（有 defaultLanding）/ file（真写盘但无 artifact id）/ ledger（只记入账本）
function landingOf(M, h, subject = '判定') {
  if (M.defaultLanding) return { kind: 'artifact', text: h.F[M.defaultLanding].text }
  const a = M.duty.action
  const label = a.landingLabel || subject
  return { kind: a.landingMode === 'file' ? 'file' : 'ledger', text: label }
}

export function makeHelpers(M, shared) {
  const R = M.records
  const F = M.forms
  const fieldLabel = (rec, f) => {
    const s = (R[rec]?.shape || []).find((x) => x.id === f)
    return s ? s.label : f
  }
  const recLabel = (id) => R[id]?.label || id

  const OP = {
    fieldNonEmpty: (o) => `${fieldLabel(o.ofRef, o.field)}非空`,
    fieldEmpty: (o) => `${fieldLabel(o.ofRef, o.field)}为空`,
    fieldEnumIn: (o) => `${fieldLabel(o.ofRef, o.field)}取值`,
    fieldsEq: (o) => `${fieldLabel(o.ofRef, o.left)} = ${fieldLabel(o.ofRef, o.right)}`,
    eachCarries: (o) => cn(recLabel(o.ofRef), `各带${fieldLabel(o.ofRef, o.carries)}`),
    allExist: (o) => `${o.field ? fieldLabel(o.ofRef, o.field) : recLabel(o.ofRef)}全在`,
    coversAll: (o) => `${fieldLabel(o.ofRef, o.field)}覆盖必填`,
    setSubset: (o) => `${fieldLabel(o.ofRef, o.field)}全部在本轮清单`,
    lineExists: (o) => (o.ofRef === 'allPass' ? '该行必须存在' : cn(recLabel(o.ofRef), '行存在')),
    lineAbsent: (o) => cn(recLabel(o.ofRef), '无声明行'),
    quoteInLine: (o) => cn(recLabel(o.ofRef), '摘句行号'),
    countGte: (o) => cn(recLabel(o.ofRef), ` 计数 ≥ ${o.value}`),
    distinctGte: (o) => cn(recLabel(o.ofRef), ` 来自 ≥ ${o.value} 个不同${o.byLabel || o.by}`),
    whenEq: (o) => `${fieldLabel(o.ofRef, o.field)} = ${o.value} 时${o.then ? `，${renderObs(o.then)}` : ''}`,
    whenEmpty: (o) => cn(recLabel(o.ofRef), `为空时，${o.then ? renderObs(o.then) : ''}`),
    eachHas: (o) => `${fieldLabel(o.ofRef, o.field)}每项含 ${o.hint || o.pattern}`,
    fieldMissing: (o) => `${fieldLabel(o.ofRef, o.field)}缺项`,
    fieldNeq: (o) => `${fieldLabel(o.ofRef, o.left)} ≠ ${fieldLabel(o.ofRef, o.right)}`,
    fieldTrue: (o) => `${fieldLabel(o.ofRef, o.field)}为真`,
    fieldNotIn: (o) => `${fieldLabel(o.ofRef, o.field)}取值越界`,
    textMatches: (o) => cn(recLabel(o.ofRef), ' 出现评审结论词'),
    refExists: (o) => `${fieldLabel(o.ofRef, o.field)}存在`,
  }
  const renderObs = (o) => (OP[o.op] ? OP[o.op](o) : o.op)

  const ACTION = { verify: '核对', recount: '复算', spotCheck: '抽查', replay: '重放', compare: '比对' }
  const renderCriterion = (c) => {
    const obs = c.observable.map(renderObs).join('、')
    const mode = c.mode === 'any' ? '任一成立' : '全部成立'
    return `${ACTION[c.action] || c.action}：${obs}（${mode} = hit）`
  }
  // 执行主体具名：命令 → 写命令；manual → 抽检人；其余 → 本席
  const judgeOf = (c) => {
    const r = c.residual || {}
    const o = c.objective || r.objective || {}
    if (o.target === 'manual') return r.who ? `抽检：${r.who}` : '抽检'
    if (o.machineCmd) return '`' + o.machineCmd + '`'
    return '本席'
  }
  const renderRule = (rule, isMust) => {
    const p = M.predicates[rule.criterion]
    const phrase = isMust ? p.ok : p.bad
    const slots = (p.slots || []).map((s) => renderObs(s)).join('、')
    const guard = p.guard ? `（和${renderObs(p.guard)}）` : ''
    return isMust ? `要求${phrase}——${slots}${guard}` : `不得${phrase}——${slots}${guard}`
  }

  const t = M.timing
  const timingText = `${M.vocab.repeat[t.repeat]}${M.vocab.moment[t.moment]}时，针对${shared.timing.scenes[t.scene] || t.scene}`

  const seatDesc = (() => {
    const ts = M.seat.triggers
    const one = ts[0]
    const isElement = ts.length === 1 && (one.objects || one.perspective || one.action || one.timing || one.schedule)
    if (isElement) {
      const pre = (s) => (/^[A-Za-z0-9]/.test(s) ? ' ' : '') + s
      const fill = {
        objects: pre((one.objects || []).map((o) => shared.objectKinds?.[o] || o).join(M.seat.description.joiner || '、')),
        perspective: pre(shared.perspectives?.[one.perspective] || one.perspective || ''),
        scope: one.scope || '',
        action: shared.actions?.[one.action] || one.action || '',
        timing: one.timing
          ? shared.vocab.repeat[one.timing.repeat] + shared.timing.scenes[one.timing.scene] + shared.vocab.moment[one.timing.moment] + '后'
          : '',
        schedule: shared.schedules?.[one.schedule] || one.schedule || '',
      }
      let s = M.seat.description.template
      for (const [k, v] of Object.entries(fill)) s = s.replaceAll('{' + k + '}', v)
      return s
    }
    const parts = ts.map((x) => x.text || shared.triggerPhrases?.[x.id] || x.id)
    const joined = parts.length > 1 ? parts.slice(0, -1).join(M.seat.description.joiner) + M.seat.description.lastJoiner + parts.at(-1) : parts[0]
    return M.seat.description.template.replace('{triggers}', joined)
  })()

  const tools = TIERS[M.seat.tier] || []

  return { R, F, fieldLabel, recLabel, cn, renderObs, renderCriterion, judgeOf, renderRule, timingText, seatDesc, tools, OP }
}

export const sections = {
  frontmatter(M, shared, h) {
    return [
      raw(['---']),
      para(`name: ${M.seat.id}`),
      para(`description: ${h.seatDesc}`),
      para(`tools: ${h.tools.join(', ')}`),
      raw(['---']),
      blank(),
      h1(`角色卡：${M.seat.id}`),
      blank(),
    ]
  },

  duty(M, shared, h) {
    const a = M.duty.action
    const subject = typeof a.landingSubject === 'string' ? a.landingSubject : a.emit[a.landingSubject.index]
    // 有 outputs 时按 artifact 列表；无 outputs 时走 landingOf（file = 真写盘，ledger = 只记入账本）
    const land = landingOf(M, h, subject)
    const landingText = M.outputs.items.length
      ? M.outputs.items.map((i) => `${h.F[i.artifact].text}（${i.phase}）`).join(a.landingJoiner || '与 ')
      : land.kind === 'ledger' ? `${land.text}（只记入评审账本，不写文件）` : land.text
    const pm = M.permissions
    const allow = pm.action.allow.map((x) => shared.actions[x]).join('、')
    const forbids = pm.action.forbid.map((x) => '不' + (M.permissionGroups[x]?.label || shared.actions[x] || x)).join('，')
    return [
      h2('职责'),
      para(`触发：${h.seatDesc}`),
      para(`动作：对${a.objects.join('与')}做${a.scope}${a.verb}，逐条给出${a.emit.join('与')}，${subject}写回 ${landingText}。`),
      para(`约束：只${allow}，${forbids}。`),
      blank(),
    ]
  },

  must(M, shared, h) {
    if (!M.must?.length) return []
    const blocks = [h2('一定会'), notes(`时机：${h.timingText}。`)]
    for (const g of M.globalRules) blocks.push(notes(g.text))
    const land = landingOf(M, h)
    blocks.push(notes(land.kind === 'ledger'
      ? '判定只记入本轮评审账本，不写盘。'
      : `判定写回 ${land.text}。`), blank())
    const items = []
    let n = 0
    for (const rule of M.must) {
      for (const target of rule.targets) {
        n += 1
        items.push(`${n}｜${M.vocab.object[target.object]}｜${h.renderRule({ ...rule, targets: [target] }, true)}。`)
      }
    }
    blocks.push(bullets(items), blank())
    return blocks
  },

  never(M, shared, h) {
    if (!M.never?.length) return []
    const items = []
    let n = 0
    for (const rule of M.never) {
      for (const target of rule.targets) {
        n += 1
        items.push(`${n}｜${h.renderRule({ ...rule, targets: [target] }, false)}（针对${M.vocab.object[target.object]}）；出现即违反。`)
      }
    }
    return [h2('禁止'), bullets(items), blank()]
  },

  conflict(M, shared, h) {
    const out = ['## 冲突裁决', `- 优先级：${M.conflict.order.map((r) => M.conflict.rankLabels[r]).join(' > ')}。`]
    for (const c of M.conflict.decision.cases) {
      if (!c.result) continue
      const p = M.conflict.phrases[c.result]
      out.push(`- ${p.label}：${p.direction}判断与本席冲突时${p.verb}，并写明${h.recLabel(p.mustCarry.record)}。`)
    }
    out.push('')
    return out
  },

  checklist(M, shared, h) {
    const v = M.verdicts
    const enumText = v.enum.map((x) => `${x.id}（${x.label}）`).join('、')
    const requireReason = v.enum.filter((x) => x.requireReason).map((x) => x.id).join(' 与 ')
    const requireApp = v.enum.filter((x) => x.requireApplicability).map((x) => x.id).join(' 与 ')
    const note = `判定取值：${enumText}；${requireReason} 须写 ${v.reasonField}，缺 ${v.reasonField} = ${v.onMissingReason.label}；${requireApp} 还须写明${v.applicabilityPrompt}`
    const out = ['## 本席清单', `| # | 条目 | 判据（${note}） | 判定方 |`, '|---|---|---|---|']
    for (const it of M.checklist.items) {
      const c = M.checkCriteria[it.criterion]
      out.push(`| ${it.no} | ${it.seatPrefix}：${it.category} | ${h.renderCriterion(c)} | ${h.judgeOf(c)} |`)
    }
    out.push('')
    return out
  },

  outputFormat(M, shared, h) {
    const o = M.outputFormat
    if (!o) return []
    const out = [`## ${o.title}`, '必填字段：', '', '| # | 字段 |', '|---|---|']
    o.requiredFields.forEach((f, i) => out.push(`| ${i + 1} | ${f.label} |`))
    out.push('', '校验：', '')
    for (const c of o.checks || []) out.push(`- ${h.renderObs(c.observable)}`)
    out.push('')
    return out
  },
  outputs(M, shared, h) {
    if (!M.outputs.items.length) return []
    const out = ['## 产出']
    for (const o of M.outputs.items) {
      const tpl = M.templates[o.template]
      out.push(`- ${o.phase}：按 \`${tpl.skill}\` 技能的${tpl.label}${M.enums.action.labels[o.action]}，写回 \`${h.F[o.artifact].path}\``)
    }
    out.push(`- 字段名只用 ${M.outputKeys.join(' / ')}；自造键不合规`, '')
    return out
  },

  permissions(M, shared, h) {
    const pm = M.permissions
    // 事实归属（2026-11-12）：允许写什么、允许跑什么只在「权限」段展开；边界段只给指针。
    const meta = SEATS[M.seat.id] ?? {}
    const scope = writeScopes[meta.writeScope ?? 'review.ledger'] ?? {}
    const out = []
    // 三段化（2026-11-13）：policy 席的身份 / 档位 / 平台限制归「权限」段首
    if (M.boundary?.kind === 'policy') out.push(...renderAuthority(M.seat.id, M).split('\n'), '')
    if (!pm.write.allow.length) {
      // 档位含 Write 但无 artifact 级白名单 = 写作用域由本席 writeScope 约束，≠ 不能写
      const canWrite = (TIERS[M.seat.tier] || []).includes('Write')
      out.push(canWrite ? `- 写文件：只限${scope.location ?? '本轮账本目录'}` : '- 写文件：不得写任何文件')
    } else out.push(`- 写文件：只许 ${pm.write.allow.map((id) => h.F[id].text).join('、')}（落点：${scope.location ?? '本轮账本目录'}）`)
    if (typeof meta.clause === 'string' && meta.clause.trim() !== '') out.push(`- 职责：${meta.clause.trim()}`)
    if (!pm.command.allow.length) out.push('- 跑命令：不跑任何命令')
    else out.push(`- 跑命令：只许跑\n${pm.command.allow.map((id) => `  - ${h.F[id].text}`).join('\n')}`)
    out.push('')
    return ['## 权限', ...out]
  },

  ban(M) {
    if (M.boundary?.kind !== 'policy') return []
    return ['## 禁止事项', renderBan(M.seat.id, M), '']
  },

  escalation(M, shared, h) {
    // 三段化（2026-11-13）：policy 恒出「越界处置」= 模型步骤（有则加）+ 边界后处理正文
    if (M.boundary?.kind !== 'policy') return []
    const esc = M.escalation
    const out = ['## 越界处置']
    if (esc) {
      for (const [i, s] of esc.steps.entries()) {
        const n = i + 1
        if (s.kind === 'halt') out.push(`${n}. ${s.text}`)
        if (s.kind === 'report') out.push(`${n}. 越权信息报${esc.recipients[s.to]}：${esc.report.fields.map((f) => h.R[esc.report.record].shape.find((x) => x.id === f).label).join('、')}。`)
        if (s.kind === 'voidRound') out.push(`${n}. 本轮结论作废，报${esc.recipients[s.to]}。`)
      }
    }
    out.push(renderAftermath(M.seat.id, M), '')
    return out
  },
  boundary(M) {
    const b = M.boundary || {}
    if (b.kind === 'policy') return []
    const body =
      b.kind === 'literal' ? b.text
      : b.kind === 'default' ? DEFAULT_BOUNDARY
      : (() => { throw new Error('BOUNDARY_KIND_UNKNOWN ' + b.kind) })()
    return ['## 边界', body, '']
  },
}
