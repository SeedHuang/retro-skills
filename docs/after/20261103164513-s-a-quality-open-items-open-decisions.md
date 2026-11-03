# S-A ④ 段遗留（未决）：质量保证轮留下的 4 笔账

- 状态：**未决**（④ 段已判「过」，以下均为不阻断的已知缺口）
- 来源：`.session/reviews/2026-11-03-1626-s-a-quality/quality-4.md`（sdet）§5 缺口表 + `quality-4-audit.md`（审计）§3/§7
- 何时搬走：逐条做完即从本文件删除该条；全部做完后本文件按 `docs-convention` 迁入 `-done.md` 或删除
- 判据：每条必须写「现状 / 触发 / 该做 / 谁兜」，无「暂无」

| # | 现状 | 触发 | 该做 | 谁兜 |
|---|---|---|---|---|
| S-A-Q-1 | `TC-028` 只落 ①②③（`evidence.renderSha256` / 两席 `lastWrittenHash` / `baseline.json` 无哈希字段）；④ `TargetDrift`（目标漂移码）、⑤ `EvidenceInvalid`（凭证不符码）**无任何构造**——「基线只更新一半」这类错改在本批全绿，要到下一次 `replace` 才炸 | ⑤ 段交付前；或下次改 `tools/docgen/cli.mjs` 的基线 / replace 段时 | `change` 相位 + 盘上 target 追加 1 字节 → 判 `TargetDrift`；`migration` 相位 + `renderSha256` 置 0 → 判 `EvidenceInvalid`；两条都落 `sa-data-layer.test.mjs` | 下次动该流程的施工者（⑤ 段若不做，交接时点名） |
| S-A-Q-2 | `TC-003③`「第二份 12 键名单探针」缺位：`seatLoader.mjs` / `check-shared-refs.mjs` 若被手写 12 键字面替换，该用例仍绿 | 下次改这两文件的 import 面 / 键集面时 | 在 `sa-data-layer.test.mjs` 加一条源码探针：两文件内 12 键字面序列 0 命中（testcase TC-003 步骤 ③ 原文） | 该测试文件下一任修改者 |
| S-A-Q-3 | `TC-026` 的「把 `...s` 前置再跑 `TT`」注入面未落：`sa-data-layer` 只断言「薄壳先 import」；判别力实际由 `tool-tiers.test.mjs:705-716` 的 `S5-TC-D10` 承担（审计已实测：`...s` 前置 → `TT` 红，`gate` 仍绿——15 席 JSON 无 `tools` 键） | 下次改 `tool-tiers.test.mjs` 的 `S5-TC-D10` 或改装配顺序时 | 在仓副本里注入前置顺序 + 跑 `--test-name-pattern S5-TC-D10`，把该执行面也落到 `sa-data-layer.test.mjs` | ④ 段后续 / 施工者 |
| S-A-Q-4 | 偶发红：`S6-TC-D06`（`policy-pure-source.test.mjs:886`）在 `withRepoCopy` 的 `cpSync` 上偶发 `ENOENT …/docs/agents`，复跑即绿；同族先例 `S6-TC-D03` 早前 1 次（两次全量：1 红 → 0 红） | 再次出现（累计 ≥2 次即应修，不必等第三次） | `tools/docgen/test/support/dev-workflow-checks.mjs:241-254` 的 `withRepoCopy` 加「拷贝失败重试一次」或把 `docs/agents` 改成按需拷贝；根因优先查并发拷贝 | 该支撑文件维护者 |
| S-A-Q-5 | ④ 段记录项（P3）：`quality-4.md:164` / `:179` 的「`quality-4-audit.md` 184 行」是**写入时点快照**，复核轮追加 §7 后现为 240 行；两处数字同源但时点不同 | 下次修订该结论表 / 复核表时；或再有人以「184」为计数依据时 | 在该两处加「（时点快照；现 240 行）」后缀，或把行数改成取数式（`(Get-Content …).Count`） | ④ 段后续修订者（sdet 实例） |
| S-A-Q-6 | ④ 段记录项（P3）：`.session/reviews/2026-11-03-1626-s-a-quality/` 尚未归档到 `docs/superpowers/reviews/`——直接迁移会被 ⑥ 观察产物门禁判 `ArtifactMissing`（该目录无 `observation-rN` 产物） | 本批收尾归档时；或被要求「按 `docs-convention` 迁 reviews/」时 | 二选一：① 只迁 `-4.md` / `-4-audit.md` 两份正文并在 `docs/superpowers/reviews/<次>/` 补 observation 产物；② 不迁，登记本行为长期保留（`.session/` 不进 git，换机即失） | 本批收尾人（主 agent / 用户裁定） |
| S-A-Q-7 | ⑤ 段交付审计 P3：`0bb0a33`（T2 交接文档的提交）未在 plan 的「执行记录」表里单列一行——它改的是 `docs/handoffs/`，不是 Task 步骤，属记录归属问题而非漏施工 | 下次修订该 plan / 复盘该批提交链时 | 在 `T6-补` 行或表后补一句「`0bb0a33` = T2 交接件，不计入 Task 步骤」，或不再维护 plan-commit 一一对应 | 该 plan 下一任修改者 |

## 已在本批闭合、不在此列的

- `TC-024` 步骤①「删 `lessons/`」与 spec R6 冲突（删 `DETECTION_BLIND_SPOTS` 即违规）：处置 = 构造换件（改删「其他评审目录」同机制），已在 `quality-4.md` §2 记明。
- spec R6 的 `paths.mjs:27` 笔误：已改 `:26`（实测 `lessons/` 命中 3 行 = `:4` / `:5` 注释 + `:26` 数组）。
