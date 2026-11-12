// 错误码 → 进程退出码的唯一映射（P5 从 `validateAgentData.mjs` 抽出；旧卡校验逻辑已随旧链退场）。
// 新码必须先登记本表，否则 `exitCodeFor` 抛「未知错误码」——与旧行为一致。
const EXIT = {
  0: [],
  1: ['MissingSlot', 'MissingPlaceholder', 'InvalidRuleType', 'TemplateSyntaxError',
    'TemplateHardcoded', 'ImpureRender', 'Mismatch', 'DuplicateAgentName', 'InvalidName',
    'FrontmatterFieldMissing', 'ToolsViolation', 'WhenFormatViolation',
    'DescriptionDerivation', 'TriggerMissingRoute', 'TriggerConflict', 'DuplicateWhen',
    'InvalidOutputKind', 'MissingWhen', 'DraftDrift', 'DraftNameConflict', 'TargetDrift',
    'TriggerFieldMisplaced',
    'DanglingSharedRef', 'EmptySharedValue', 'NestedSharedRef', 'CardKeySetMismatch',
    'DutyCategoryMisplaced',
    'CONSTRAINT_NOT_IDS', 'CONSTRAINT_LIST_EMPTY', 'CONSTRAINT_ID_UNKNOWN', 'CONSTRAINT_TEXT_PERMISSION',
    'UnknownPolicyRef', 'LiteralInConfig', 'SeatNameInDefinition', 'ForbiddenGroupGranted',
    'TemplateImpure',
    'GroupLayerMissing', 'GroupLayerInvalid', 'GroupMixedLayer', 'GroupEmpty', 'VerbDuplicated',
    'NonRunGroupGranted',
    // S1 词表/输出校验码（渲染内核仍可能抛出）
    'SubjectiveLabel', 'UnverifiableOutput'],
  2: ['UnregisteredHandwritten', 'InvalidBaseline', 'InvalidBaselinePath', 'DanglingBaselineEntry',
    'BaselineDrift', 'EnvironmentEOL', 'InvalidInputPath', 'InvalidOutputPath',
    'MissingComponentData', 'UnsupportedKind', 'StateFileInvalid', 'GoldenSnapshotUnavailable',
    'EvidenceInvalid', 'InvalidArgs', 'MigrationPhaseClosed', 'DirtyWorkTree'],
  3: ['GeneratedMissing', 'TemplateReadFailed', 'TargetReadFailed', 'WriteFailed', 'DraftNotFound', 'DraftWriteFailed'],
  4: ['NotAuthorized', 'UnapprovedChange'],
}

export function exitCodeFor(code) {
  for (const [exit, codes] of Object.entries(EXIT)) if (codes.includes(code)) return Number(exit)
  throw new Error(`未知错误码：${code}（须先落 §7 映射表）`)
}
