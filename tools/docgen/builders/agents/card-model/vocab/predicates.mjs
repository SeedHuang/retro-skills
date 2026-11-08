// 谓词登记表（spec §3 :63）：`criterion` 的合法取值集合。
// 值形状写死 `{ label, impl, observable, negativeSample, residual }`；`impl` 只取 `'script'` / `'manual'`——`manual` = 由 AI 判、无脚本实现，
// 不是「未实现」（S1 `MissingCriterionImpl` 的豁免面）。
// `label` = **判据句**（`核心语义——可判句`，spec §2）；破折号后段必须可观察（S3 C-8）。
// `observable` = 运行时能逐条二值判的断言（≥1，每个元素命中 ≥1 可观察标记，S3 C-4 / D5）；
// `negativeSample` = 具体不合格样例；`residual` = 机器判不死的残余由谁抽几条。
// 新增条目 = 新增判据 id，必须同批出现在某条 `must` / `never` 的 `criterion` 上，否则是死数据。
const pred = (label, observable, negativeSample, who, sample) => Object.freeze({
  label,
  impl: 'manual',
  observable: Object.freeze(observable),
  negativeSample,
  residual: Object.freeze({ who, sample }),
})

export const PREDICATES = Object.freeze({
  'impartial-long-term': pred(
    '立场不偏、按项目长期判断——结论段依据条 计数 ≥ 2，且各带 path:line、来自 ≥2 个不同文件',
    ['依据条 计数 ≥ 2', '不同文件数 ≥ 2（各依据带 path:line）'],
    '结论只写「综合判断可行」，依据 0 条',
    'reviewer-qa（抽 3 条结论核「是否只堆本席视角」）',
    3,
  ),
  'evidence-recomputable': pred(
    '结论附可复算证据——path:line 指向的文件存在，且该行含被引摘句；缺一 = 不合规',
    ['每条结论行含 path:line', 'path:line 指向文件存在且该行含被引摘句'],
    '结论写「已核实」但无 path:line 与命令输出',
    'reviewer-audit（抽 3 条结论复跑 path:line）',
    3,
  ),
  'plain-expression': pred(
    '非专业读者能听懂——英文术语首现行含中文解释，未解释术语 计数 = 0',
    ['英文 token（[A-Za-z_]{3,}）首现行含 ≥1 个汉字', '未解释英文 token 计数 = 0'],
    '正文直接写 runtime / schema 而无中文解释',
    'reviewer-reader（抽 3 段正文核读者可读性）',
    3,
  ),
  'no-fake-problem': pred(
    '无问题时显式写「全过、无问题」——findings 集合为空时该行必须存在',
    ['audit 产物的结论列含「全过」行（findings 集合为空时）', 'findings 非空时不得只写「全过」'],
    '没发现问题却只写「未发现问题」或干脆不写',
    'reviewer-audit（抽 3 轮收尾核「全过」行）',
    3,
  ),
  'issue-without-solution': pred(
    '只提问题不给解法——问题卡「建议解法」栏为空',
    ['问题卡「建议解法」栏非空', '问题卡三字段（证据 / 严重级别 / 建议解法）各非空'],
    '问题卡只有问题描述，「建议解法」栏空',
    'reviewer-qa（抽 3 张问题卡核解法可执行）',
    3,
  ),
  'out-of-scope-self-disposal': pred(
    '越出职责自行处置——越界处置动作 计数 ≥1 且正文无「声明」行',
    ['git status --porcelain 路径集中的越界处置动作 计数 = 0', '越界时正文含「声明」行且带 path:line'],
    '发现越界后自行改文件，未声明',
    'reviewer-audit（抽 3 席：按卡面「边界」段逐条核交付路径是否越界）',
    3,
  ),
  'blank-evidence': pred(
    '证据栏留空——结论行证据栏无 path:line 与命令首行',
    ['结论行证据栏非空', '证据栏含 path:line 或命令首行原文'],
    '证据栏留空并写「待补」',
    'reviewer-audit（抽 3 条结论核证据栏）',
    3,
  ),
  'proxy-fill': pred(
    '代他人填写其本人应填的表——签名字段所记名称 != 该实例名',
    ['签名字段所记名称 == 该实例名', '不符行 计数 = 0'],
    '代他人填评审结论并签其名',
    'reviewer-audit（抽 3 个签名字段核落笔方）',
    3,
  ),
})
