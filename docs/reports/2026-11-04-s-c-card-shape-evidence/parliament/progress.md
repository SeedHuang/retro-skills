# 议会账本：S-C 卡面形状 spec + testcase（② 段）

> 目录：`.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/`（不进 git；收口后结论进 `gate-record.md` 的 `②@S-C` 行）
> 评审对象：`docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` + `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md`（一件交付）
> 上游：`docs/prd/20261102212627-card-data-contract-and-proof/index.md`（只引用编号，不改写）

## 轮次

| 轮次 | 时间 | 做了什么 | 结论 |
|---|---|---|---|
| 0 | 2026-11-04 08:40 | 建账；开工前基线实测（`# tests 1481 / # pass 1476 / # fail 0 / # skipped 5`、`baseline 38/38`、`rows 68 bad 0`、`sweep ok`、`check-observable ok`） | 基线 = 交接词元信息表，一致 |
| 0b | 2026-11-04 08:56 | spec 起草完成（198 行 / ≤350）；首次派 sdet 写 testcase 被中断（**未落盘**，无残留） | 重派独立实例 |
| 1 | 2026-11-04 09:20 | testcase 首版交付（887 行 / 59 条 = 正 20 / 负 18 / 边界 21；46 条「未施行（施工后核）」）+ 7 条异议 + 8 条施工建议 | **抓出 3 个真问题**：D-2 计数口径（行 vs 次数）、D-3 渲染总数 28→30、D-7 大写插值静默不展开 |
| 1b | 2026-11-04 09:34 | **D-1 自查**：`# fail 4` 的根因不是 spec 基线错，而是**本批自建 impact-sheet 只写了 K1–K3、漏了 33 个口径 ID** → `sweep` 报「清单缺口径」并带红 4 条 sweep 用例。补全清单（33 ID + 18 命中文件）后 `sweep ok`、`npm run check` 回到 `1481 / 1476 / 0 / 5` + 末行 `check 全部通过` | 已把这条教训写进 spec §11.9（本批必须自建覆盖 33 ID 的清单） |
| 1c | 2026-11-04 09:40 | spec 逐条裁定 testcase 的 7 条异议 + 8 条建议，回填 §11.3 / §11.5 / §11.6 / §11.7 / §11.8 / §11.9 / §11.11（未决 = 0） | 派 `senior-sdet@…-02` 做修订轮 2 |
| 1d | 2026-11-04 09:44 | `check-plan size` → `spec 223/350 tc 59/80 rounds 1/3 => ok` | 预算内 |
| 2 | 2026-11-04 09:5x | **议会轮 1 出卡**：5 席全 FAIL，**23 张**（P0 9 / P1 10 / P2 4），族 8 组（`problems.md`） | 驳回点中最实的三条：A-1（「缺 reason = 废卡」丢了）、B-1（漏 4 处既有断言）、Q-1..Q-4（testcase 判据缺陷） |
| 2b | 2026-11-04 09:5x | **侦探核对**（`detective-round1.md`）：废卡 1/23、回避 1（R-4 缺行号）、丢卡 0、越权 0、台账 3 处计数错 | 逐条已处置（补 `PRD:43` / 桶 22+1 / §11.11 标题 / 答辩补 B-4 / 终稿重记基线） |
| 3 | 2026-11-04 10:05 | **答辩 + 修复**：spec 整篇重写（223 → 268 行），新增 §11.14 回退面 / §11.9 两条硬约束 / §11.12 D6 延期 / §11.10 观测项；R2 重写、R6 补 5 处、R8 加 ③④、R9 加抽核 | 12 条异议 + 23 张卡全部有裁定（未决 = 0） |
| 3b | 2026-11-04 10:08 | **testcase 修订轮 3**（`…-03`）：967 行 / 59 条（正 21 / 负 17 / 边界 21）；Q-1 新增 `SC-TC-61`、Q-2 改 `bad 15`、Q-3 归 `SHAPE`、Q-4 加手写串步、Q-5 定 COPY 口径；合并 2 条旧案（`SC-TC-03→02`、`SC-TC-19→06`） | 又抓出 2 处漏项（`pilot-data.test.mjs:15` 旧 action 断言、`tool-tiers.test.mjs:624` 构造子串）→ 已补进 R6 |
| 3c | 2026-11-04 10:13 | 建 `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`（D6 延期落点，议会 P-1） | 落点由「指名 docs/after」变为「实名文件」 |
| 3d | 2026-11-04 10:15 | `npm run check` 绿（`④ 399 个文件 / 1709 张表`、末行 `check 全部通过`）；`size: spec 268/350 tc 59/80 rounds 2/3 => ok` | 修了两处机械错：spec:22 反引号不配对、`cli.mjs` 重名（改全路径） |

## 未完成

- [x] 组队（path B：`agents/<角色>.md` 贴入 Task 子代理）—— 5 席 + 侦探 + 审计
- [x] 首轮出卡（23 张，`cards.md`）
- [x] 答辩（`problems.md`「答辩记录」22 行 + 复核轮 5 行）
- [x] 侦探核对（`detective-round1.md`）
- [x] 复核轮（轮 2：`reviewer-qa` PASS / `reviewer-backend` FAIL→BB-1 已修）
- [x] 终核（轮 3：`reviewer-backend` 抓新 P0 `CC-1`「`??` 面恰 N 项」→ 修订轮 6 改判 `git diff --name-status $BASE`）
- [x] 审计终局（首轮「不过」→ 复核轮再抓 P0-2 → 终局轮 **P0 = 0 / 过**）
- [x] 收口（P0 = 0）：`gate-record.md` 新增 `②@S-C` 与 `②→③@S-C` 两行（`rows 70 bad 0`）；`npm run check` 末行 `check 全部通过`

## 收口说明

- **议会插点用尽**：评审轮 1（5 席）、轮 2（复核 2 席）、轮 3（终核 1 席）= **3 轮**（`size --rounds 3` 上限）。轮 3 仍抓出 1 张新 P0（`CC-1`），按 `dev-workflow` 规则应「升级用户 + 评审继续」；实际处置 = 当轮由 sdet 修订轮 6 机械修复（改判 `git diff --name-status $BASE`），再交**审计**（非评审轮）复核确认闭合 → **P0 = 0**。**用户 2026-11-04 已确认接受此处置（原话：「按这个方案执行审计并 commit」）**，故**不开第 4 评审轮**。
- **本批已提交**（2026-11-04，用户指令「按这个方案执行审计并 commit」）：spec / testcase / plan / `docs/after/…` / 交接词 / `gate-record.md` 两行；`.session/` 账本不进 git。
- **`.session/` 不进 git**：本目录的 5 份过程账（`progress.md` / `cards.md` / `problems.md` / `detective-round1.md` / `submission.md`）换机即失；结论已进 `gate-record.md`。

## 取数命令（本轮用过的，供复算）

```
node scripts/check-gate-record.mjs
node scripts/scope-sweep.mjs --check
node scripts/check-observable.mjs --check
node -e "const t=require('fs').readFileSync('docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md','utf8');console.log('lines',t.split(/\r?\n/).length)"
```
