import { BaseModel } from './base.mjs'

const artifactsOf = (m) => new Set((m.outputs?.items || []).map((i) => i.artifact))

export class ReviewerModel extends BaseModel {
  static typeName = 'ReviewerModel'

  static matches(m) {
    return artifactsOf(m).has('artifact.issueCard')
  }

  static extra(m) {
    return m.predicates?.['issue-without-solution'] ? [] : ['MISSING:predicates.issue-without-solution']
  }
}

export class AuditorModel extends BaseModel {
  static typeName = 'AuditorModel'

  static matches(m) {
    const a = artifactsOf(m)
    return a.has('artifact.roundCheck') || a.has('artifact.deliveryAudit')
  }

  static extra(m) {
    return m.records?.roundCheck ? [] : ['MISSING:records.roundCheck']
  }
}

export class RespondentModel extends BaseModel {
  static typeName = 'RespondentModel'

  static matches(m) {
    const a = artifactsOf(m)
    return ['artifact.factSummary', 'artifact.defenseRecord', 'artifact.detective'].some((x) => a.has(x))
  }

  static extra(m) {
    return artifactsOf(m).has('artifact.issueCard') ? ['CONFLICT:artifact.issueCard'] : []
  }
}
