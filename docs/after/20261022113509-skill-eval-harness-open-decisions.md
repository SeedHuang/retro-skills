# skill-eval-harness-open-decisions

> 状态：**施工已完成（plan Task 1–8 全交付，改动留在工作区、未提交）**｜最后更新：2026-10-23
> 本文只装「还没做完」的事；已落地细节看 spec / testcase / 代码本体，这里不复述。

## 一句话

技能行为评测工装（skill-up 本地化）的 spec/testcase 已定稿（议会第 9 轮通过），plan 的 Task 1–8 已按 subagent-driven-development 施工完成。逐任务 review + 最终整支 review 都过了：最终 review 判 FAIL（0 Critical / 4 Important / 11 Minor）→ 一次修复 → 范围化复审 **4/4 ADDRESSED**，只余 1 条新引入的口径分叉（A1 的 `EXP-11` 与 runner 不同判），已由 controller 直修并补测试。

终态实跑（2026-10-23）：

- `node scripts/check-all.mjs` → `# pass 607 / # fail 0`、`0 findings`、`check 全部通过`、exit 0（2026-10-23 审查修复后复跑）
- `node scripts/check-eval-contract.mjs review-triage` → `findings=0`、`CONTRACT.json 已写入（14 个文件）`、exit 0、**无 SKIP 行**

## 已交付的文件（施工结果，不再列为待办）

| 面 | 产物 |
|---|---|
| 评测样本 | `evals/review-triage/`：`eval.yaml`、`cases/01-checkbox-mechanical.yaml`、`cases/02-command-swap-semantic.yaml`、`expected.md`（机读块 v2）、`frozen-ledger.json`（`{}`）、`fixtures/oracle/*.md`、`fixtures/repos/`、`fixtures/responses/`、`fixtures/RECORD.md`、`fixtures/CONTRACT.json` |
| 脚本 | `scripts/eval-contract-core.mjs`、`scripts/check-eval-contract.mjs`（A1 离线契约闸门）、`scripts/run-eval-core.mjs`、`scripts/run-eval.mjs`（runner） |
| 单测 | `scripts/check-eval-contract.test.mjs`、`scripts/run-eval-core.test.mjs`、`scripts/run-eval.test.mjs` |
| npm script | `package.json` 的 `"eval:review-triage"`（A1 不进 `npm run check`、不加 script） |

## 还没做完（唯一入口）

1. **真跑取证**（唯一阻塞「算不算独立验证」的项）：本机无 `skill-up` 二进制、无模型凭据，所以 `fixtures/RECORD.md` 的第一/三节与验收表 ④⑧ 仍标「未取证」。落地条件：装 skill-up、注入 `EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME`，跑 `npm run eval:review-triage` 首跑，按 spec §3.4 把真输出与样本补进 RECORD。
2. **置 `origin: frozen` 前的三项前置**：① ledger 六字段齐（`frozen_since` / `verified_at` / `arms_snapshot` / `delta_at_verify` / `assert_hash` / `verified_snapshot`）；② `verified_at` 必须指向**进 git** 的 `fixtures/calibration/`；③ A1 尚未做「frozen 用例必须带 `frozen_since`」的**用例级**核对（现有 FROZEN-1/2 只覆盖 ledger 侧）。
3. **deferred minors（真跑后再收）**：M1 机读块缺 `skill` 字段；M2 人工核对区复述派生计数（`3/3` / `4/4` / `2/2`）+ 未写「为何扩到四个禁词」；M9 `task-8-report.md` 的 `check-all` 计数是写作当时的值（581，终态 589），报告属过程记录不改写，以账本「终态实跑」为准；**M10 `expected.md` 人工核对区 7 个 `- [ ]` 待用户签字**；M11 F1 的 `maxDepth` 4→6 魔数待解释。
4. **`REC-6` 的已知盲区**：两条用例的 `must_not_contain` 完全相同，01 / 02 互贴 `assert_hash` 机器放过（本轮靠人工复审抓住并已订正）。要机器判需要「样本 → 用例」映射，那是新契约，须 spec 授权后才做。
5. **本线范围仍只到 `review-triage` 两条用例**——不铺开、不建 CI 门禁。

## 施工期裁决（Ruling 12–15，供下次接手别重犯）

- **Ruling 12**：`skills/managing-lessons-store/scripts/lessons.test.mjs` 的 `maxDepth` 4→6 是**收紧**守卫参数（不是放宽），接受；解释待补（上条第 M11）。
- **Ruling 13**：`fixtures/RECORD.md` **不**纳入 CONTRACT 的六类哈希快照——快照是「判据文件」，RECORD 是取证记录，纳入会让「补一条登记」也触发全量哈希漂移、逼着重跑 A1。防删改改由 `REC-0`（必须存在）+ `REC-6`（逐条复算）+ `REC-7`（样本里真实命中的词必须登记）三条承担。
- **Ruling 14**：删掉 `run-eval-core.mjs` 的死导出 `computeFlaky`——它按 **configuration 组级**判「未判定」，与 spec §3.3-7 情形②（**臂级** `determined=0`）口径不一致，留着会被未来误用；plan 里把它列为「导出签名」属可执行性细节，以 spec 语义优先。
- **Ruling 15**：`REC-6` 只判「哈希 ∈ `must_not_contain` 含该词的用例集合」，不引入样本↔用例映射（同第 4 条）。

## 已知缺口（施工前必读，勿当成「工具会拦」）

- `skills[].path: .` **不会**被 `skill-up validate` 拒绝（实测 exit 0）——路径约束靠结构断言兜，不是工具。
- 报告里的模型名是**配置值**（请求值），CCR 转发成什么从报告读不出——结论必须标「配置模型 + 引擎版本 + 真实后端未验证」。
- 首轮验收是**冒烟口径**（试跑校准），不是独立验证；「事前冻结」从下一个未试跑技能起算。
- `.session/eval-fixture/**` 内的 `git init/add/commit` 属 git 写操作禁令例外（Ruling 10）：该目录已被 gitignore，只影响临时区。
- **实现领先 spec（仅剩「未知 `--flag`」一处）**：runner 对未知 `--flag` 直接 `argError` → 码 4，spec §3.3-3 只写了已知参数形态，没写越界参数怎么处置（本轮未改 §3.3-3）。**`benchmark.json` 里未知 `configuration` 的处置已在 2026-10-23 补进 spec §3.3-6 ③**（归数据不完整 → `INVALID_ENV`，且 ④ 透传优先不变）；同日补进 §3.3-7 的「verdict.md 异常明细段」也已实现（`renderAnomalySection`）并由单测固定。
- **两处已知限制（登记不修）**：① `cases.files` 抽取仍是文件级正则（任意 `- xxx.yaml` 行都会被当用例），靠 A1 的 `YAML-1` 兜底——会报错，但编号指向 cases.files 而非真正写错的地方；② 「装臂是否真装了技能」无任何可观测信号（`benchmark.json` 只有 `metadata.skill_name="evals"`、`skill_path=…\evals`），硬判等于靠路径猜真假。

## 给下一个 session

1. 先跑 `node scripts/check-all.mjs` 与 `node scripts/check-eval-contract.mjs review-triage` 复核（应 607/607、findings=0、exit 0）。
2. 真跑取证是剩下的主任务（上条第 1 项）；拿不到凭据就保持「未取证」，不许把声明值写成实测值。
3. 全程不许自动 commit——改动留在工作区，由用户决定提交方式。
