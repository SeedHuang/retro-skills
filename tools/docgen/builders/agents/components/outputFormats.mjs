// 输出格式合同（spec §6 :157-173）：按 `outputKind` 共享的**结构化**数据，卡面第 7 段直接渲染它。
//
// S4 Task 7 收口：旧模板与 `legacyOutputFormats` 已删除（原散文块留 git 历史），本文件只留结构化合同。

// `evidence` 契约先落成独立对象：`issue-card` 的证据三位从它**展开派生**（S-B spec §11.2.1 R1）。
// 抄一份字面就是第二份真相——改 `evidence.fields` 时 `issue-card` 会静默不跟随，且没有判据能发现
// （判别力由 `SB-TC-02` / `SB-TC-23` 把住）。
const evidence = {
  fields: ['原文摘句', '文件 + 行号', '用途'],
  checks: [
    '摘句能在源文件中检索到，且行号指向的那一行包含它',
    '查找过但没找到的项必须写明查了什么、为什么没找到',
  ],
}

// `issue-card` 的 9 列 = 原 7 列在证据位（第 5 位）展开成三列，其余列与顺序不动
const ISSUE_HEAD = ['编号（Q-轮-序）', '提出角色', '归属维度', '问题描述']
const ISSUE_TAIL = ['严重级别', '建议解法']

export const outputFormats = {
  audit: {
    fields: [
      '核对项',
      '核对内容',
      '结果',
      '证据',
      'A 节 过程闭环',
      'A1 终态对账',
      'A2 P0P1 清零',
      'A3 落点抽查 ≥3',
      'A4 P2 三态齐',
      'A5 数字一致',
      'A6 升级项终裁',
      'B 节 按完成判据逐交付物核对',
      'B 列 交付物',
      'B 列 完成判据核对',
      'B 列 结果',
      'B 列 证据',
      '结论',
      '打回清单',
    ],
    checks: [
      '每一核对项逐行填「结果」与「证据」，任一行空 = 本轮核对不成立',
      '卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮（取数命令复算）',
      '落点抽查 ≥3 条：文件行号真实存在且内容相符',
      '交付物完成判据逐行核对：每个交付物一行 + 证据位（缺证据 = 该行不成立）',
    ],
    docs: [
      {
        file: 'round-check.md',
        blocks: [
          { h1: '轮间核对单' },
          {
            notes: [
              '声明：本核对单必由审计专员本人实例完成；主持人代填即违规；证据栏空 = 不通过，不是待补。',
              '机械计数项（第 3、5 项）证据栏必须写「取数命令 + 输出」，缺命令或输出 = 证据栏空 = 不通过（防主持人靠心算数数——心算必错，实测数错 3 次被拦）。',
              '转录行口径：主持人转录的每个时刻 / 计数，必须写「**谁取数 + 具体时刻**」（例：「审计 12:48:46 自跑 `time.mjs`」「主持人 12:54:13 取数」），**禁止只写轮次数或裸时刻**（「三轮」「12:54:13」均不合格）；审计核转录时逐条比对本行，缺「谁」或缺时刻 = 该行转录不通过。',
            ],
          },
          { h2: '取数命令' },
          { bullets: [
            '数字（第 3、5 项）：`scs ledger numbers <评审目录>`',
            '落点：`scs check landings --ledger <评审目录> --root <项目根>`',
            '轮次账：`scs ledger gate <评审目录>/progress.md`',
            '时刻：`scs time`',
          ] },
          { h2: '核对项' },
          {
            table: {
              columns: ['项', '核对内容', '结果', '证据'],
              rows: [
                ['第 0 项 轮际对账', '上轮承诺 vs 本轮开卷清单（以送审说明 §2 为准）逐项相等', '', ''],
                ['第 1 项 卡片字段齐', '八字段，缺证据或建议解法 = 废卡', '', ''],
                ['第 2 项 答辩字段齐', '判定 + 依据 + 修法', '', ''],
                ['第 3 项 本轮终态对账', '卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮', '', '写 `已修=N 关闭=N 候选=N 升级=N 带往下轮=N`'],
                ['第 4 项 侦探观察存在且卡号真实', '', '', ''],
                ['第 5 项 汇总未丢卡', '', '', ''],
              ],
            },
          },
          { h2: '结论' },
          { para: '过 / 不过+打回清单' },
          { notes: ['机械计数由审计员自跑命令（已授 `producer` 档），主持人代跑或代填一律判无效；审计员核对并抽查 1-2 项语义。'] },
        ],
      },
      {
        file: 'delivery-audit.md',
        blocks: [
          { h1: '交付审计表' },
          { notes: ['声明：本审计表必由审计专员本人实例完成；主持人代填即违规；证据栏空 = 不通过，不是待补。'] },
          { h2: 'A 节 过程闭环' },
          {
            table: {
              columns: ['项', '核对内容', '结果', '证据'],
              rows: [
                ['A1 终态对账', '', '', ''],
                ['A2 P0P1 清零', '', '', ''],
                ['A3 落点抽查 ≥3', '', '', ''],
                ['A4 P2 三态齐（采纳/关闭/候选）', '', '', ''],
                ['A5 数字一致', '', '', ''],
                ['A6 升级项有终裁', '', '', ''],
              ],
            },
          },
          { h2: 'B 节 按完成判据逐交付物核对' },
          { para: '走 `parliament` 技能的文档分类完成判据，逐交付物一行 + 证据栏：' },
          { table: { columns: ['交付物', '完成判据核对', '结果', '证据'], rows: [['', '', '', '']] } },
          { h2: '结论' },
          { bullets: ['通过', '有条件通过（候选项 + 触发信号列明）：', '不通过（打回清单）：'] },
        ],
      },
    ],
  },
  'issue-card': {
    fields: [...ISSUE_HEAD, ...evidence.fields, ...ISSUE_TAIL],
    checks: [
      '证据三列（原文摘句 / 文件 + 行号 / 用途）缺任一 = 废卡，三列须由 check-quotes 验真',
      '建议解法栏空 = 废卡',
      'P0 需两处冲突证据；P1 需可复现触发序列',
    ],
    docs: [
      {
        file: 'issue-card.md',
        blocks: [
          { h1: '问题卡' },
          { h2: '八字段表' },
          {
            table: {
              columns: ['字段', '内容'],
              rows: [
                ['编号（Q-轮-序）', ''],
                ['提出角色', ''],
                ['归属维度', ''],
                ['问题描述', ''],
                ['证据（必填，引用文件:行号或命令输出）', ''],
                ['严重级别（P0·P1·P2，判据见下）', ''],
                ['建议解法【必填】', ''],
                ['无问题时的显式声明格式（「固定 N 条全过，自由 M 条，均无问题」）', ''],
              ],
            },
          },
          { h2: '严重级别判据' },
          { bullets: ['P0：两处规定冲突 / 不可逆损坏 / 自相矛盾', 'P1：场景真实会发生但未定义行为', 'P2：逻辑成立但可更好'] },
          { h1: '观察记录（侦探用）' },
          { h2: '五字段表' },
          {
            table: {
              columns: ['字段', '内容'],
              rows: [
                ['卡号（必须引用真实卡号）', ''],
                ['对象（评委 / 答辩方 / 主持人）', ''],
                ['行为类型（评委刁难 / 答辩回避 / 主持人失职）', ''],
                ['判定依据（引用原文，必填）', ''],
                ['处置建议', ''],
              ],
            },
          },
        ],
      },
    ],
  },
  observation: {
    fields: ['卡号', '对象', '行为类型', '判定依据', '处置建议'],
    checks: [
      '卡号必须能在本轮卡片目录里找到',
      '判定依据必须引用原文（不得转述）',
    ],
  },
  evidence,
  testcase: {
    fields: ['覆盖', '前置', '步骤', '预期', '判据'],
    checks: [
      'node --test "<测试文件>"：exit 非 0 即失败',
      'spec-testcase-gate 五条判据逐条核对（命名 / 独立性 / 五要素与负例比例 / 外链 / 一起送审）',
    ],
  },
  // S3-A：议长程序账与答辩记录的共享合同（结构见 spec §8；逐字文案不设字面量断言）
  proceeding: {
    fields: [
      '轮次号',
      '起止（HH:MM:SS）',
      '席位',
      '收卡数',
      '丢卡与压卡及理由',
      '点名',
      '判结束依据',
      '落盘路径',
    ],
    checks: [
      '每轮一行，轮次号与起止时间齐全',
      '丢卡与压卡逐张写明理由，理由栏不得为空',
      '收卡数与卡片目录实数一致（由计数命令复算）',
      '时间取 scs time 的输出，不手填',
    ],
  },
  defense: {
    fields: [
      '卡号',
      '核实结论（确认存在｜确认不存在）',
      '证据（原文摘句 + 文件 + 行号）',
      '立场（承认｜带依据反驳｜部分承认）',
      '修法落点',
      '署名席',
    ],
    checks: [
      '每张问题卡都写明核实结论，不得留空',
      '证据三列（原文摘句 / 文件 + 行号 / 用途）逐条非空',
      '带依据反驳的立场必须附上可复算证据',
      '四席核实表逐条可追到署名席',
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// kind 注册表（spec §3「配置归属」）
// 列的唯一真相在 kind 级：产物表头渲 `label`，脚本校验按 `id` 对齐。
// `blocks` 为表正文块（标题 / 说明 / 取数命令节），由 `ledger.mjs` 生成 assets。
// ─────────────────────────────────────────────────────────────────────────────

// 账本型 kind 的 8 列（spec §3 对照表定版）；其它 kind 各用自己的列。
const LEDGER_COLUMNS = [
  { id: 'no', label: '项' },
  { id: 'item', label: '核对内容' },
  { id: 'criterion', label: '判据' },
  { id: 'kind', label: '类型' },
  { id: 'verdict', label: '结果' },
  { id: 'reason', label: '理由' },
  { id: 'applicability', label: '适用性' },
  { id: 'evidence', label: '证据' },
]

export const kinds = {
  'round-check': {
    columns: LEDGER_COLUMNS,
    blocks: outputFormats.audit.docs[0].blocks,
  },
  'delivery-audit': {
    columns: LEDGER_COLUMNS,
    blocks: outputFormats.audit.docs[1].blocks,
  },
  'issue-card': {
    columns: [
      { id: 'cardNo', label: '编号（Q-轮-序）' },
      { id: 'proposer', label: '提出角色' },
      { id: 'dimension', label: '归属维度' },
      { id: 'description', label: '问题描述' },
      { id: 'quote', label: '原文摘句' },
      { id: 'location', label: '文件 + 行号' },
      { id: 'purpose', label: '用途' },
      { id: 'severity', label: '严重级别' },
      { id: 'suggestion', label: '建议解法' },
    ],
    blocks: outputFormats['issue-card'].docs[0].blocks,
  },
  'defense-record': {
    columns: [
      { id: 'cardNo', label: '卡号' },
      { id: 'verdict', label: '核实结论' },
      { id: 'evidence', label: '证据' },
      { id: 'stance', label: '立场' },
      { id: 'fixLanding', label: '修法落点' },
      { id: 'signer', label: '署名席' },
    ],
    blocks: [],
  },
  detective: {
    columns: [
      { id: 'cardNo', label: '卡号' },
      { id: 'object', label: '对象' },
      { id: 'behavior', label: '行为类型' },
      { id: 'basis', label: '判定依据' },
      { id: 'suggestion', label: '处置建议' },
    ],
    blocks: [],
  },
  'fact-summary': {
    columns: [
      { id: 'quote', label: '原文摘句' },
      { id: 'location', label: '文件 + 行号' },
      { id: 'purpose', label: '用途' },
    ],
    blocks: [],
  },
  progress: {
    columns: [
      { id: 'round', label: '轮次号' },
      { id: 'span', label: '起止（HH:MM:SS）' },
      { id: 'seats', label: '席位' },
      { id: 'count', label: '收卡数' },
      { id: 'dropReason', label: '丢卡与压卡及理由' },
      { id: 'lineup', label: '点名' },
      { id: 'endBasis', label: '判结束依据' },
      { id: 'path', label: '落盘路径' },
    ],
    blocks: [],
  },
}
