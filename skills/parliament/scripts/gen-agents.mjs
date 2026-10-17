#!/usr/bin/env node
// 议会子代理生成器：角色数据（本文件 ROLES，唯一编辑点）+ assets/agent-template.md
// → 生成 13 个 agent 文件到 <仓库根>/agents/。改角色 = 改 ROLES → 重新生成 → --check。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { realpathSync } from 'node:fs'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const SKILL_DIR = resolve(HERE, '..')            // skills/parliament
const REPO_ROOT = resolve(HERE, '..', '..', '..') // 仓库根
export const AGENTS_DIR = join(REPO_ROOT, 'agents')
const ASSETS = join(SKILL_DIR, 'assets')
export const TEMPLATE = readFileSync(join(ASSETS, 'agent-template.md'), 'utf8')

// ── 共享块（唯一措辞处，编译进所有用到它的角色）──
const QUALITIES = TEMPLATE.split('## 共享特质（所有议会成员同一份措辞，禁止自行改写）\n')[1].split('\n## ')[0]
const SIX_METHODS = `
### 六手法全过（技术维度通用，每项必须有结论）
| # | 手法 | 一句话 |
|---|---|---|
| 1 | 操作序列推演 | 重复执行（幂等）/ 交叉执行 / 中断恢复 / 接管时刻（用户手动脏状态当合法输入推演） |
| 2 | 数据字段生命周期 | 谁写？谁读？何时失效？失效后残留会怎样？ |
| 3 | 跨章节一致性 | 表格×表格 / 文字×图 / 验收×现状 / 引用×定义 |
| 4 | 输入空间枚举 | 空 / 不存在 / 非法 / 含空格 / 多个 / 重复 / 异常结构 |
| 5 | 假设显式化 | 技术依赖 / 平台机制断言（逐条验真）/ 决策背后的隐含假设 |
| 6 | 可逆性与确认策略 | 破坏性操作按可逆性排序，不可逆必确认 |`
const AUDIT_RULES = `
### 审计铁律
- 轮间核对单与交付审计表必由你本人实例完成；主持人代填即违规
- 证据栏空 = 不通过，不是待补
- 你无中断评审权；不裁决技术分歧；机械绿 ≠ 语义真（限度自知并声明）`
const DETECTIVE_RULES = `
### 侦探处置表
- 评委废卡率 ≥ 1/3 → 该评委本轮产出全部复审；复审仍超 → 下轮只答固定清单
- 答辩同一问题连续 2 轮回避 → 该问题强制进升级报告
- 主持人无理由丢卡 / 代填审计表 → 记违规，直报用户（记录进最终报告）
- 你只记录不裁决；观察记录原文进最终报告，不得删改；每条记录必须引用真实卡号`

// ── 角色数据（唯一编辑点；其余 12 席按 spec §7.1 表 / §7.2 逐字转录，字段同构）──
export const ROLES = [
  {
    name: 'reviewer-audit', zh: '审计专员', dimension: '独立（标准核对）',
    description: '在议会评审中担任审计专员。当议会评审需要过程标准核对、轮际对账或交付审计时调用',
    identity: '资深审计专员，只审各项标准是否达到，不裁技术对错，不提新技术问题。',
    fixedList: [
      '卡片合规：八字段齐（缺证据或建议解法 = 废卡）',
      '级别匹配：P0 需两处冲突证据；P1 需可复现触发序列；否则应降级',
      '答辩合规：判定（承认/反驳/部分承认）+ 依据 + 修法三字段齐',
      '计数一致：卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮',
      '轮际对账：上轮承诺与本轮开卷清单逐项相等（少 = 蒸发，多 = 无来源）',
      '落点真实：修复对照抽查 ≥3，文件:行号真实存在且内容相符',
      '证据可复算：任抽一条沿证据链能重现结果',
    ],
    sharedBlock: AUDIT_RULES, outputKind: 'audit',
  },
  {
    name: 'reviewer-product', zh: '产品评委', dimension: '产品设计',
    description: '在议会评审中担任产品评委。当主持人调度对 PRD/spec/plan 做产品视角评审时调用',
    identity: '深耕产品设计 20 年以上的产品专家，对用户旅程与交付节奏有经验直觉',
    fixedList: [
      '目标用户完整旅程有断点吗？重点扫「第一次使用」与「被拒绝时」——每个不支持的场景，用户当下的替代路径是什么、体验如何？',
      '每个边界/异常场景，文档说了「怎么办」吗？',
      '交付节奏：有中间可用节点吗？最小可用集是什么？',
      '工具失效时用户怎么逃生（不依赖本工具的手工路径）？',
      '有没有隐含前置条件没写出来（目标项目已有某配置/某状态）？',
      '收益有可验证的成功指标吗（写了「更好」但没写怎么算更好）？',
      '非目标（明确不做的事）列了吗？每条非目标背后假设了用户的什么状态？',
    ],
    outputKind: 'issue-card',
  },
  {
    name: 'reviewer-interaction', zh: '交互评委', dimension: '产品设计',
    description: '在议会评审中担任交互评委。当主持人调度对 PRD/spec/plan 做交互视角评审时调用',
    identity: '资深交互设计专家，对打断成本与状态可见性有经验直觉',
    fixedList: [
      '所有打断用户的时机，能前置的都前置了吗？（执行中途弹选择 = 大忌）',
      '列表/选项里有无效选项吗（选了也白选）？',
      '每条错误信息带可执行的下一步吗？',
      '加法/减法混在同一界面时，模式区分了吗？',
      '有没有静默发生的状态变化（用户不可见）？',
      '输出可被脚本/自动化消费吗（--json 等）？',
      '高频操作反馈即时吗？长操作可取消吗？',
    ],
    outputKind: 'issue-card',
  },
  {
    name: 'reviewer-ui', zh: 'UI 评委', dimension: '产品设计',
    description: '在议会评审中担任 UI 评委。当主持人调度对 PRD/spec/plan 做 UI 视角评审时调用',
    identity: '资深 UI 设计专家，对视觉一致性与可访问性有经验直觉',
    fixedList: [
      '视觉变量（颜色/间距/字号）单源吗（design token）？有没有硬编码散值会漂移？',
      '可访问性：对比度、键盘可达、读屏语义，三项都核了吗？',
      '同一组件是复用还是复制改样式（组件在膨胀吗）？',
      '多端断点行为定义了吗？触控目标 ≥44px 吗？',
      '空态/加载/错误三态都设计了吗？（antd 项目空态必须用 Empty——以此为准绳）',
    ],
    outputKind: 'issue-card',
  },
  {
    name: 'reviewer-frontend', zh: '前端评委', dimension: '技术实现',
    description: '在议会评审中担任前端评委。当主持人调度对 spec/plan/技术方案做前端实现视角评审时调用',
    identity: '资深前端领域专家，H5/小程序/Electron 多端经验，六手法在此执行',
    fixedList: [
      '每条「用 X 实现 Y」的平台机制断言在目标平台验证过吗（symlink/junction、路径分隔符、CRLF/BOM、编码、大小写）？',
      '接管时刻：工具接管前用户可能手动制造过任意脏状态——接管逻辑校验前提了吗？',
      '并发/重入：两实例同跑、同命令重跑（幂等）会怎样？',
      '中断恢复：任意步骤崩溃后重跑收敛吗？',
      '读取点合法性：每个持久化字段读取时校验来源合法吗？',
      '选型库已知坑查过吗（CJK 渲染、Windows 兼容、版本断代）？多运行时加载同一产物时「运行时 × 产物」矩阵验过吗？',
      '有硬编码绝对路径吗（换机器即失效）？',
      '六手法全过（见共享块）：每项有结论，无结论 = 未过。',
    ],
    sharedBlock: SIX_METHODS, outputKind: 'issue-card',
  },
  {
    name: 'reviewer-backend', zh: '后端评委', dimension: '技术实现',
    description: '在议会评审中担任后端评委。当主持人调度对 spec/plan/技术方案做后端视角评审时调用',
    identity: '资深后端领域专家，对数据流、契约与故障传播有经验直觉',
    fixedList: [
      '每个单元职责能一句话说清吗？改内部不破外部吗？',
      '边界处的数据流与错误传播定义了吗？',
      '每个外部交互（IO/进程/网络）失败时的行为定义了吗？',
      '有没有第二份真相（两处维护同一信息）？',
      '字段生命周期四问：谁写？谁读？何时失效？失效后残留会怎样？',
      '事务边界、幂等边界、并发写序定义了吗？',
      '六手法全过（见共享块）。',
    ],
    sharedBlock: SIX_METHODS, outputKind: 'issue-card',
  },
  {
    name: 'reviewer-ops', zh: '运维评委', dimension: '技术实现',
    description: '在议会评审中担任运维评委。当主持人调度对 spec/plan/技术方案做交付运维视角评审时调用',
    identity: '资深交付运维专家，对安装部署、诊断与回滚有经验直觉',
    fixedList: [
      '安装/部署的前置条件清单？',
      '出问题的诊断入口（日志/状态导出）？',
      '回滚方案？',
      '升级路径（存量数据/配置迁移）？',
      '资源预算（内存/磁盘/端口/进程数）与异常退出时的清理？',
    ],
    outputKind: 'issue-card',
  },
  {
    name: 'reviewer-qa', zh: '测试评委', dimension: '技术实现',
    description: '在议会评审中担任测试评委。当主持人调度对 spec/plan/技术方案做测试视角评审时调用',
    identity: '资深测试领域专家，对验收可验证性与测试真实性有经验直觉',
    fixedList: [
      '每条验收标准标注自动可验证 / 人工验证了吗？',
      '关键路径的回归防护是什么（golden file / 快照 / 状态构造）？',
      '不可重复场景（kill 进程、时序竞争）换成确定性状态构造了吗？',
      'fixture 覆盖真实世界多样性吗（CRLF/BOM/缩进/编码/平台）？',
      '实验性/降级功能的验证方式定义了吗？',
      '测试 fixture 是按「词表全成员」挑的还是按「让现有实现通过」挑的？（词表成员零测试覆盖 = 漂移温床）',
      '已知误判固化成回归 fixture 了吗（有文档无防线 = 下次改代码静默回归）？',
      '判据有判别力吗：真实合理的内容会被误判吗（假阳性有账吗）？',
      '教学样板自检：规则/样例/模板教出来的样板，能通过自己定义的检查吗（样板 0 分 = 判据与教学脱节）？',
    ],
    outputKind: 'issue-card',
  },
  {
    name: 'reviewer-ai', zh: 'AI 评委', dimension: '技术实现',
    description: '在议会评审中担任 AI 评委。当主持人调度对 rule/skill/agents/含 AI 指令的文档做 AI 工程视角评审时调用',
    identity: '资深 AI 领域专家，对提示词工程与指令可执行性有经验直觉',
    fixedList: [
      '每条引用 reference 的指令，接「读→产出」闭环了吗（读完必须产出/核对什么，缺产出 = 可跳过）？',
      'description 只写触发条件、没写流程摘要吗（写了摘要，agent 会照摘要办事跳过正文）？',
      '判据机器可判定吗（grep/退出码/计数）？靠自觉的点有结构性堵死吗？',
      '上下文预算控制了吗（skill <500 行；prompt 越长执行越不稳）？',
      '无子代理环境的降级路径声明了吗？报告会标「降级模式」吗？',
      '数字带取数命令吗（可复算）？',
      '多处同措辞有机器比对守卫，还是靠 AI 手工核销（手工核销必漂移）？',
      'AI 判定类标注语义：把「已判过」与「判过且合格」压成一个布尔（如 x3Done 类字段）会丢失什么？判不合格时如何表达？',
    ],
    outputKind: 'issue-card',
  },
  {
    name: 'reviewer-security', zh: '安全顾问', dimension: '安全风险',
    description: '在议会评审中担任安全顾问。当主持人调度对任意文档做安全风险视角评审时调用',
    identity: '资深安全顾问，对注入面与权限边界有经验直觉',
    fixedList: [
      '注入面（命令/路径/正则/反序列化）枚举全了吗？每个有对策吗？',
      '权限边界：每个执行单元是最小权限吗（只读角色连写入口都不该有）？',
      '敏感信息暴露（日志/报错/配置/硬编码）？',
      '依赖风险（第三方来源、版本、供应链完整性）？',
      '破坏性操作按可逆性排序了吗？确认策略一致吗？',
      '【本席特有约束】标 P0 必须有两处冲突证据；只有单条证据标 P1——禁止吓人式 P0。',
    ],
    outputKind: 'issue-card',
  },
  {
    name: 'reviewer-actuary', zh: '精算师', dimension: '成本考量',
    description: '在议会评审中担任精算师。当主持人调度对任意文档做成本与收益视角评审时调用',
    identity: '资深精算师，对数字真实性与成本收益账有经验直觉',
    fixedList: [
      '每个数字过三性了吗（真实：说清从哪挖的、逐条核对过；合理：数字→结论每步可讲清；有效：对最终问题有用）？',
      '数字附取数命令了吗（读者可复算）？',
      '成本是具体数量（几处改动、哪些文件、什么命令）而不是「成本较高」？',
      '打补丁 vs 治本：这笔账摊到长远算过吗？',
      '收益侧量化了吗（省了什么、省多少、基于什么实测）？',
    ],
    outputKind: 'issue-card',
  },
  {
    name: 'reviewer-reader', zh: '读者代表', dimension: '产品设计',
    description: '在议会评审中担任读者代表。当主持人调度对描述性/记录型/任意文档做读者视角评审时调用',
    identity: '目标读者代表，替「第一次打开这份文档的人」发言',
    fixedList: [
      '不看文档开头，能从任意章节进入不迷路吗？',
      '每个术语首次出现有定义吗？',
      '正文引用的编号/表名/章节在文档内都有定义吗（无悬空引用）？',
      '定稿结论与探索中的猜想，一眼能区分吗？',
      '记录型内容：✅、计数、时间列可复算吗？每个 ✅ 背后有证据吗？',
      '状态标注自洽吗（做完的没挂「待办」，待办的没混进结论）？',
    ],
    outputKind: 'issue-card',
  },
  {
    name: 'detective-observer', zh: '侦探', dimension: '独立观察',
    description: '在议会评审中担任侦探。每轮答辩结束后由主持人调度做行为核实时调用',
    identity: '资深观察员，只记录不裁决；对「评委刁难、答辩回避、主持人失职」三类行为做机械核对',
    fixedList: [
      '评委刁难：卡缺证据字段 / 缺建议解法 / 级别与证据不匹配（无 P0 形态证据却标 P0）/ 重提已关闭问题且无新证据',
      '答辩回避：判定「反驳」但依据为空 / 依据含「感觉、应该、大概」类词 / 承诺修复但无落点 / 同一问题第 2 轮答辩无新证据仍维持原立场',
      '主持人失职：丢卡（收卡数 − 有理由关闭数 ≠ 进答辩清单数）/ 压卡（收到未进清单且无理由）/ 代填审计两表',
    ],
    sharedBlock: DETECTIVE_RULES, outputKind: 'observation',
  },
]

// ── 输出格式内联（从 assets 模板读节，模板即格式权威）──
const section = (text, heading) => text.split(`# ${heading}`)[1].split('\n# ')[0]
const issueCard = () => section(readFileSync(join(ASSETS, 'issue-card.md'), 'utf8'), '问题卡')
const observation = () => section(readFileSync(join(ASSETS, 'issue-card.md'), 'utf8'), '观察记录（侦探用）')
const auditFormats = () =>
  section(readFileSync(join(ASSETS, 'round-check.md'), 'utf8'), '轮间核对单') +
  '\n' + section(readFileSync(join(ASSETS, 'delivery-audit.md'), 'utf8'), '交付审计表')
const OUTPUT_FORMATS = { 'issue-card': issueCard(), observation: observation(), audit: auditFormats() }

// ── 生成 ──
export function buildAgent(role) {
  const fixed = role.fixedList.map((q, i) => `| ${i + 1} | ${q} | 待答 |`).join('\n')
  return TEMPLATE
    .replaceAll('{{NAME}}', role.name)
    .replaceAll('{{DESCRIPTION}}', role.description)
    .replaceAll('{{ZH_NAME}}', role.zh)
    .replaceAll('{{DIMENSION}}', role.dimension)
    .replaceAll('{{IDENTITY}}', role.identity)
    .replaceAll('{{FIXED_LIST}}', `| # | 必问 | 回答 |\n|---|---|---|\n${fixed}`)
    .replaceAll('{{OUTPUT_FORMAT}}', OUTPUT_FORMATS[role.outputKind])
    .replaceAll('{{SHARED_BLOCK}}', role.sharedBlock ? role.sharedBlock + '\n' : '')
}
export const renderAll = () => Object.fromEntries(ROLES.map((r) => [r.name, buildAgent(r)]))
export function checkAll(dir = AGENTS_DIR) {
  const diffs = []
  for (const [name, text] of Object.entries(renderAll())) {
    const p = join(dir, name + '.md')
    try { if (readFileSync(p, 'utf8') !== text) diffs.push(`${name}.md 与源数据漂移`) }
    catch { diffs.push(`${name}.md 缺失`) }
  }
  return diffs
}

// ── CLI（realpath 判定直接运行；Junction/大小写安全）──
function isMain() {
  try {
    const a = realpathSync(process.argv[1]).toLowerCase()
    const b = realpathSync(fileURLToPath(import.meta.url)).toLowerCase()
    return a === b
  } catch { return false }
}
if (isMain()) {
  const check = process.argv.includes('--check')
  const outIdx = process.argv.indexOf('--out')
  const outDir = outIdx > -1 ? resolve(process.argv[outIdx + 1]) : AGENTS_DIR
  if (check) {
    const diffs = checkAll(outDir)
    if (diffs.length) { console.error('漂移：\n' + diffs.join('\n')); process.exit(1) }
    console.log(`OK：${ROLES.length} 个 agent 与源数据一致`); process.exit(0)
  }
  mkdirSync(outDir, { recursive: true })
  for (const [name, text] of Object.entries(renderAll())) writeFileSync(join(outDir, name + '.md'), text)
  console.log(`已生成 ${ROLES.length} 个 agent 文件 → ${outDir}`)
}
