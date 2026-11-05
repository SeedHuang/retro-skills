> 状态：**已归档**｜日期：2026-11-05（阶段 1 退役）｜归档原因：下沉——条件触发；执行由 check-observable.mjs + 门禁第 ⑦ 段承担｜承接位置：carrier-conventions 的「判据可观察形态」references
# 判据必须写成可观察形态（规则）

> 来源：PRD `docs/prd/20261031202331-observable-criteria-rollout/index.md`（F-02 / F-10 先行产物）｜spec `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design.md` §6｜落地：2026-11-01

**一句话**：判据里写下的每一个评价，都要能被机器用一次退出码判死；判不死的，改写成能判的形式，或进豁免清单并写明为什么它只能这样写。

## 范围

- 管什么：`rules/**/*.md` 与 `skills/**/*.md` 的**正文行**（S1 分期；卡面与 `predicates` 面归 S3）。
- 不管什么：标题行（`^#+ ` 是索引，不是判据正文）、围栏代码块里的行、仓内其它目录（`docs/` 等由各自规则管）。
- 词表与标记表**不在本文件**：唯一源是 `tools/quality/observable-terms.json`。本文件不复述任何词面或正则 —— 复述即第二份真相。

## 条件

写或改上述范围内的正文行时；把规则 / 技能送审、或让它们进 plan 之前。

## 动作

1. **跑一次**：`node scripts/check-observable.mjs --check`（等价于 `npm run check:observable`）。
2. **看红**：每条红都给 `path:line` 与命中的词，并注明「所在最小语义块内没有任何可观察标记」。
3. **三选一处置**（逐行，不许整文件放行）：
   - **改文案**：把该行换成能被机器判死的表述（比较式、文件行号锚、退出码、`diff` 结果、计数、空 / 非空、带字面量的枚举）。优先这一档。
   - **已合格**：该行所在块里本来就有上述可判形态 → 什么都不做（不要为它补豁免）。
   - **进豁免**：只有「术语引用 / 词表自身」才许留（例：某个词在本仓已是规则概念名、或它本身就是 `rule-inspector` 的术语）。每条必须写清「这是术语引用，不是评价」+ 该术语的出处。
4. **判不了就别留**：改不动的，说明为什么只能这样写；说不出来的，按上面第 3 条第一档处理。

## 宾语

命中的正文行（一行一条，按行计；同一行命中多个词仍算一行）。

## 触发时机

- 写或改 `rules/` / `skills/` 下任一正文行时；
- 跑 `npm run check`（第 ⑦ 段）时——它每次都会跑本规则；
- 复核 / 审计一份判据类交付物时。

## 验证

| 判据 | 怎么判 |
|---|---|
| 无未豁免命中 | `node scripts/check-observable.mjs --check` 末行 `check-observable ok`、exit 0 |
| 计数单源 | `--json` 的 `scanned` / `hits` / `exemptedLines` / `stale`；门禁第 ⑦ 段只搬这四个数，不重算 |
| 豁免不空转 | `stale` 为 0（豁免条目写的锚点在文件里 0 命中 = 该条已失效，必须删或改） |
| 豁免结构 | 四字段齐（`path` / `contains` / `reason` / `reviewed`）；同一文件内锚点唯一；`reviewed` 不早于 `2026-01-01` |
| 本文件自身 | 本文件在 `rules/` 下必然被扫：它必须 `hits = 0`，且**不得新增豁免条目** |

**豁免清单**：`tools/quality/observable-exempt.json`（行级白名单，结构错 = 校验器前置红、exit 2；锚点失效 = exit 1）。

## 两条声明

- **本规则不因来源豁免**：子代理、脚本、模板、AI 生成的产物同样要过。
- **与豁免清单冲突时，以豁免清单为准**（它比零散的现场理由更可核）；清单本身的结构错由校验器的前置断言兜。

## 去哪查

| 要查什么 | 去哪 |
|---|---|
| 词表 / 标记表 / 正反例 | `tools/quality/observable-terms.json` |
| 豁免条目 | `tools/quality/observable-exempt.json` |
| 最近一次分诊结论（S1 首日基线） | `docs/reports/2026-10-31-observable-s1-triage.md` |
| 判定实现 | `scripts/check-observable.mjs`（唯一实现点） |
| 门禁接入 | `scripts/check-all.mjs` 第 ⑦ 段（不可经 `CHECK_BYPASS` 旁路） |
## 承接对照表

| 原节 | 去向 | 承接文件 |
|---|---|---|
| `## 范围` | 下沉 | carrier-conventions 的「判据可观察形态」references |
| `## 条件` | 下沉 | carrier-conventions 的「判据可观察形态」references |
| `## 动作` | 下沉 | carrier-conventions 的「判据可观察形态」references |
| `## 宾语` | 下沉 | carrier-conventions 的「判据可观察形态」references |
| `## 触发时机` | 下沉 | carrier-conventions 的「判据可观察形态」references |
| `## 验证` | 下沉 | carrier-conventions 的「判据可观察形态」references |
| `## 两条声明` | 下沉 | carrier-conventions 的「判据可观察形态」references |
| `## 去哪查` | 下沉 | carrier-conventions 的「判据可观察形态」references |
