// 席数据（spec §3.2）：slug → { display, clause?, escalationWriter?: { slug, artifact } }。
// 显示名只许出现在本文件；`__default__` 是保留键、不可授予，不进 SEAT_NAMES。
// 可选槽缺省（`clause` / `escalationWriter` 未声明）≠ 显式传 `undefined`（后者判 TemplateImpure）。
export const SEATS = {
  'reviewer-audit': {
    display: '审计',
    // ⑨ 职责：写入范围含审计表 + 核转录逐字一致（卡级子句，J01 判 `scope:'card'`）
    clause: '、审计表；你在 `round-check.md` 核转录逐字一致',
    escalationWriter: { slug: 'reviewer-audit', artifact: 'round-check.md' },
  },
  'detective-observer': {
    display: '侦探',
    // ⑩ 职责：产物形态 + 本席不核签（卡级子句，J02 判 `scope:'card'`）
    clause: '（轮初 / 轮末快照原文、观察记录、比对结论），且本席不核签',
    escalationWriter: { slug: 'reviewer-audit', artifact: 'round-check.md' },
  },
  'senior-sdet': {
    display: '测试开发',
    // S6-B（2026-11-05）：写作用域 + 旧专用句第三段（不改别人的判定）落 clause；边界句由渲染器产出
    writeScope: 'spec.testcase',
    clause: '不改别人的判定：spec 或实现有问题，写进「给开发的建议」，不代改、不参与议会裁决',
  },
  'speaker': {
    display: '议长',
    writeScope: 'review.host',
  },
  'respondent-architect': {
    display: '架构答辩',
  },
  'respondent-dev': {
    display: '研发答辩',
  },
  // 下列三席此前走 `__default__`；卡面已声明产物（取证 / 问题卡），故按「只登记与默认不同的席」补登记。
  'evidence-reader': {
    display: '取证',
  },
  'reviewer-actuary': {
    display: '精算',
  },
  'reviewer-ai': {
    display: 'AI',
  },
  __default__: { display: '默认席', clause: '' },
};

export const SEAT_NAMES = Object.keys(SEATS).filter((k) => k !== '__default__');
