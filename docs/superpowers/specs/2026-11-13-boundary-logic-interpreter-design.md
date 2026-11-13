# 设计：边界段逻辑建模 + 解释器（可测化）

> 状态：定稿（2026-11-13）。依据用户裁决：四类逻辑全做、可测标准 = 场景表 + 文案一致性、允许调整措辞（本设计目标仍为逐字节不变）。

## 1. 问题

`tools/docgen/builders/agents/templates/boundary.md.tpl` 里残留四类**逻辑描述**没有可执行载体：

| # | 逻辑 | 现状 |
|---|---|---|
| 1 | 写判定（席 + 路径 → 允许/拒绝） | 句子是散文；禁写清单由槽拼，但 deny-by-default 语义无代码 |
| 2 | 命令判定（席 + 命令 → 允许/拒绝） | 白名单/禁止组是数据，但无「给定命令判是否放行」的函数 |
| 3 | 检测可见性（写场景 → git status 是否可见） | 「只能看 tracked 工作区」「已提交写与写后还原看不见」是断言，无法验证 |
| 4 | 越权处置义务（越权场景 → 谁做什么） | 四句固定散文；可复原/不可复原分支不可执行 |

后果：规则自洽只能靠人读卡面，改一处规则无法用测试证明卡面同步。

## 2. 决策

| # | 决策 | 理由 |
|---|---|---|
| D1 | 新增 `policy/definitions/boundaryRules.mjs` 承载规则结构、文案模板与指针；清单字面仍归 `paths.mjs` / `commands.mjs` / `writeScopes.mjs` | 不造第二真相：模型只表达「去哪取数、按什么顺序判」 |
| D2 | 新增 `policy/boundaryInterpreter.mjs` 提供四个纯函数 + `boundaryFacts` | 判定与渲染分离；纯函数可直接喂场景表 |
| D3 | 模板 4 处散文改为槽：`ACTION_FORBID` / `WRITE_DEFAULT` / `ESCALATION_OBLIGATIONS` / `DETECTION_LIMIT`；`FORBIDDEN_PATHS` / `ESCALATION_WRITER` / `DETECTION_PATHS` 并入随句槽并从 `SLOTS` 删除 | 槽集恰合不变量（`validatePolicy.mjs:293-301`）保持成立 |
| D4 | 渲染输出逐字节不变（golden 不重冻结） | 现卡面每句都能从模型无歧义导出；零重生成、零重判风险 |
| D5 | 测试两件套：场景表（解释器）+ 文案一致性（卡面句子 ↔ 判定方向 + 变异负例） | 只测「模型生成模型」= 自证；变异负例证明文案确实来自模型 |

## 3. 模型结构（`boundaryRules.mjs`）

```js
export const boundaryRules = {
  write: { policy: 'denyByDefault', allowSource: 'permissions.write.allow',
    denySources: ['pathGroups', 'SIGNOFF_LEDGER', 'gitignore'],
    form: '除「权限」段所列落点外，任何写文件或重定向一律禁止（禁写集合 = 策略源 {sources}）。' },
  command: { allowSource: 'permissions.command.allow', denySource: 'forbiddenGroups',
    envGroup: 'env.assign', match: 'longestPrefix' },
  fixedProhibitions: [
    { id: 'adjudicate', form: '不{label}' },
    { id: 'interrupt', form: '无{label}的权力' },
  ],
  detection: {
    states: [
      { id: 'tracked-dirty', label: 'tracked 未提交', visible: true },
      { id: 'staged', label: 'staged', visible: true },
      { id: 'committed', label: '已提交写', visible: false },
      { id: 'restored', label: '写后还原', visible: false },
      { id: 'ignored', label: '被 gitignore 的路径', visible: false },
    ],
    form: '{ignored}、{committed}与{restored}都看不见——检测门强化留待后续任务。',
  },
  escalation: {
    recordFields: ['文件', '改前/改后 sha256', '是否可复原', '命令原文'],
    obligations: [
      { id: 'record', actor: 'violator', when: 'always' },
      { id: 'recompute', actor: 'independent', when: 'always' },
      { id: 'restore', actor: 'user', when: 'recoverable', agentForbiddenVerbs: ['checkout', 'restore'] },
      { id: 'baseline', actor: 'violator', when: 'unrecoverable' },
    ],
    forms: {
      record: '越权清单（{fields}）**由越权者写进本人产物**（只限「权限」段所列产物）。{writer}',
      recompute: '复算由独立于越权者的另一席完成（不得自证），复算结论随该席产物一并留档。',
      restore: '可复原（tracked）→ 复原命令由你给出、用户执行（禁 agent 自跑 {verbs}）。',
      baseline: '不可复原（gitignored）→ 以轮初快照（本轮开始时记录的原文）为基线，能比对就比对，不能就明写「不可复原 + 缺失基线」。',
    },
  },
}
```

## 4. 解释器 API（`boundaryInterpreter.mjs`）

| 函数 | 输入 | 输出 |
|---|---|---|
| `decideWrite(seat, path, { model, ignored })` | 席、相对路径、可选注入 | `{ decision, ruleId, reason }` |
| `decideCommand(seat, cmd, { model })` | 席、命令原文 | `{ decision, ruleId, matched }` |
| `visibility(stateId)` | 状态 id | `{ visible, reason }`；未知状态抛错 |
| `escalationObligations({ recoverable })` | 是否可复原 | `{ obligations: [{ id, actor, when, text }] }` |
| `boundaryFacts(seat, model)` | 席、展开模型 | `{ ACTION_FORBID, WRITE_DEFAULT, ESCALATION_OBLIGATIONS, DETECTION_LIMIT }` |

判定顺序（写）：允许产物 → 禁写源 → gitignore → 默认拒绝。
判定顺序（命令）：`forbiddenGroups`（含 `env.assign` 五形态）→ 允许组 verb 前缀 → 默认拒绝；冲突按最长前缀（同 `schema.mjs:44-55`）。

## 5. 验收

1. `boundary-parts` 的 golden 逐字节测试保持绿（9 席），`agents/*.md` 零 diff。
2. 场景表测试覆盖：写 5 例、命令 4 例、可见性 5 例、越权义务 4 例（见计划 §测试）。
3. 文案一致性测试：每个禁写源代表路径判 deny、每个允许产物判 allow、每个允许组 verb 判 allow、每个禁止组 verb 判 deny；检测限度句与 `visibility` 同向；越权段义务 id 集合 = 解释器输出。
4. 变异负例：内存改一条规则后重新渲染，卡面必须随之变化。
5. `npm run check` 全绿、`npm run agents:verify` 输出 `agents 18/18` / `baseline 19/19`。

## 6. 非目标

- 不改模型 JSON 业务字段、不改 `boundary.kind` 分型、不动 default 席 `DEFAULT_BOUNDARY`。
- 不恢复 rule / skill 文件生成（PRD D19）。
- 不做运行时拦截（解释器只服务渲染与测试）。
