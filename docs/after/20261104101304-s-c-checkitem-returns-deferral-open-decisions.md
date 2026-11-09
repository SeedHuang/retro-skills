# S-C：未完成项（D6 逐项返回押后 + 形状改造已知限制）

> 状态：**未决（押后，未定稿）**｜创建 2026-11-04 10:13｜更新 2026-11-04（追加 §5 = ⑤ 段落点）｜来源：S-C 卡面形状 ② 段议会轮 1 的 `P-1`（产品席，P0）；§5 来源 = ④ 段结论表 §5
> 何时搬走：§1–§4 待 PRD 下一次修订、或出现「逐项判定」的真实消费者（某工具/流程要读 `checkItems[]` 的返回声明）时——把结论并入 PRD 或改判 D16 ④；§5 各条按各自「触发」列，条目关闭后逐行删除。

## 1 为什么押后

- PRD §9 给 S-C 的第 ③ 项大纲是「`checkItem` 返回声明（D5 / D6）」。D6 的原话是「`checkItems` 7 条里 4 条『核对…是否…』缺返回」。
- 但 **D16 ④ 明令不得新增 `checkItem.returns`**（「逐项字段既无码位、无消费者，又会让取值出现第三份副本」）。
- S-C 的实际处置 = **返回类型由「本席清单」表头一处声明**（`VERDICT_HINT`）+ 动作行的「写回」（`duty.action`）。这覆盖了「有明确返回」，但**没有重写那 4 条 criterion 的文案**。
- 重写 97 条 `checkItems[].criterion` 会动 15 席数据里的检查项语义，超出 S-C 的边界（PRD §8 的 S-C 行只写「卡面形状」），且没有任何机械判据能判「重写后的返回是否切题」。

## 2 现状与影响

| 项 | 现状 | 影响 |
|---|---|---|
| `checkItems[].criterion` 的「返回」 | 由表头 `VERDICT_HINT` 一处声明（`hit` / `miss` / `na` + reason 规则） | 逐条 criterion 仍写「核对 X 并写出原文引句」——**读起来像只有动作、没有返回** |
| 消费者 | `tools/observation-check/checks.mjs` 判 `items[].verdict` | 机器侧只认 `verdict` 三值，不读 criterion 文案；故「文案缺返回」不影响机器判定 |
| 人读面 | 15 席的「本席清单」表 | 读者需自行把 criterion 与表头取值连起来（表头已是唯一声明处） |

## 3 触发与谁兜

| 事项 | 触发 | 谁兜 |
|---|---|---|
| 重写那 4 条 criterion 文案（或按 D6 全量重写 97 条） | PRD 下一次修订；或出现「逐项判定」的真实消费者；或 ④ 段抽核连续两批指出「criterion 读不出返回」 | 该次 PRD 修订的产品经理 + 实现该消费者的开发 |
| 若决定给 `checkItem` 加返回字段 | 同上，且须先改 D16 ④（属回 PRD 重签 §0） | 用户（D16 是用户裁定） |

## 4 来源与复算

- 议会卡原文：`docs/reports/2026-11-04-s-c-card-shape-evidence/parliament/cards.md` 的 `P-1`（2026-11-04 S-D T3 由 `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/cards.md` 迁入 git；映射见该目录 `README.md` §1）
- spec 侧裁定：`docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` §11.12（「D6 的『逐项返回文案重写』延后」）
- 取数：`(Select-String -Path tools\docgen\data\seats\*.json -Pattern '"criterion"').Count` → 97 条

## 5 形状改造的已知限制（⑤ 段落点，2026-11-04 追加）

来源：④ 段结论表 `docs/reports/2026-11-04-s-c-card-shape-evidence/quality/quality-4.md` §5（12 条 G1–G12；2026-11-04 S-D T3 由 `.session/reviews/2026-11-04-1328-s-c-quality/quality-4.md` 迁入 git）。本表只给**触发与谁兜**；级别、漏检哪类、该做什么见该表原文。

| 事项 | 触发 | 谁兜 |
|---|---|---|
| G2（P3）spec §11.14 步 1 的 `git checkout` 清单未点名 ③ 交接词（该件已在 `SC-TC-62` 白名单） | spec 下一次修订 | 主 agent（spec 修订者） |
| G3（P3）用例计数命令缺行首锚点会自命中：`test('SC-TC-` 得 61（多出 `tools/docgen/builders/agents/test/sc-card-shape.test.mjs:3` 注释示例），带锚点得 60 | ④ / ⑤ / 后续复算 | 复跑者用带锚点命令或 `blockCount(SELF_PATH,'SC-TC-')`（`tools/docgen/builders/agents/test/sc-card-shape.test.mjs:931`） |
| G7（P3）testcase 签字件未回填执行结论：8 个用例（7 处全宽标注 + `SC-TC-55` 1 处变体）仍带未施行标注，48 行证据写「施工后核」 | 直接读 testcase 时 | ④ / ⑤ 引用 `quality-4.md` §2 的逐条执行面（签字件不回填） |
| G8（P3）跨条子判据：`SC-TC-26` 的「改前 = 13 项」由 `SC-TC-57` 承担、`SC-TC-58` 的「七段」由 `SC-TC-13` 承担 | 用 `--test-name-pattern` 单跑这两条时 | 复跑者一律跑整文件 |
| G9（P3）`SC-TC-62` 白名单比签字件宽 2 项（A 面 +③ 交接词、M 面 +门行；B 面改 `git ls-tree $BASE` 现算） | spec §11.14 / §11.15 修订时回填这两处实名 | 主 agent（spec 修订） |
| G10（P3）path:line 引用可差 1（`skills/dev-workflow/references/gate-record-template.md` 的 LF / CRLF 混用为根因；本批门行行号曾记成 `:99/:100/:101`，实为 `:100/:101/:102`） | 任何「门行在哪一行」的引用 | 引用者当场打印核对，或引 `check-gate-record` 的 `rows` 数 |
| G11（P3）投影面 0 diff 无机械判据：`docs/agents/**` 16 份中 2 份 0 diff，判「非漏生成」目前靠文字 | docgen 侧加正向断言时 | S-D |
| G12（P3）④ / ⑤ 落行后的 `impact-sheet.md` mtime（R8）：diff 含 `skills/dev-workflow/references/gate-record-template.md` 时须同批 touch 当次 `impact-sheet.md` 再跑 `sweep --check` | 每次落门行 | 落门行者（主 agent） |

### 5.1 已闭合（不再计入未闭合缺口）

| 事项 | 闭合依据 |
|---|---|
| G4（首轮 P1）`SC-TC-55` 恒真算术 | `tools/docgen/builders/agents/test/sc-card-shape.test.mjs:934` 左值改为现场 `blockCount(SELF_PATH,'SC-TC-')`；注入 A（删一块 → `expected 60 / actual 59`）、A2（`expected 1541 / actual 1540`）、C（`actual 1542`）全红 |
| G5（首轮 P1）`SC-TC-56` 本地算术代替真删 | `tools/docgen/builders/agents/test/sc-card-shape.test.mjs:940-957` 改为 `withRepoCopy` 副本真跑 → `rmSync` 真删 → 同命令 exit 非 0 且计数掉落；注入 D（`rmSync` 换 `void 0`）必红 |
| G6（P2）默认档空跑仍计 pass | **S-D T2 闭合（2026-11-04，`93c78cd`）**：`SC-TC-45` / `SC-TC-46` 由 `if (!SHAPE) return` 改 `return t.skip('一次性档未开（SB_SHAPE_ONESHOT≠1）')`；连带同批改 `SKIP_ALLOWLIST`（5 → 7 条）与 S3 spec 两处计数（`:51` / `:132`）。绿档 = 单文件 `# tests 60 / # pass 58 / # skipped 2`、全仓 `# skipped 5 → 7`；红档 = 抽掉名单一项 → `[测试] 名单外 skip：SC-TC-45 …` + `check 未通过` + exit 1 |
| **时限炸弹**（`SC-TC-62` 比对区间为开区间） | **S-D T1 闭合（2026-11-04，`e153d33`）**：判据由 `git diff --name-status $BASE`（到工作树末尾）改为 `$BASE..$BASE_HEAD` 闭区间，`BASE_HEAD` 冻结在 S-C 收口提交 `cda896f`（`SB_BASE_HEAD` 可显式覆盖）。绿档 = `SC-TC-62` 单跑 `name-status: rows 85 / A 5 / A-outside 0 / nonA-outside 0`；**炸弹已拆** = 在 `docs/reports/` 下新建探针文件后复跑仍绿（rows 仍 85 / A 5）；**判据未架空** = 临时删 `NEW_PATHS` 一项 → `A 面出现白名单外路径：docs/handoffs/2026-11-04-s-c-card-shape-impl.md` exit 1 |
| **G1（P3）** 人设身份句的同义资历表述漏检 | **S-E T2 闭合（2026-11-04）**：`tools/docgen/dsl/agents/seats/senior-sdet.json` 的 `rationale` 首句「有十年以上经验的测试开发工程师。」→「测试开发工程师。」；V9 词面由两词面加严为 `资深` + `20 年` + `十年`（`tools/docgen/builders/agents/test/sc-card-shape.test.mjs:605` / `:649`，spec §11.4 `:108` / §11.8 `:151`，testcase §0.2 口径 2 / SC-TC-29 / SC-TC-31）；`--freeze` 后 `counts.I34 = 0`。绿档 = 三面 `资深 0 / 20 年 0 / 十年 0` + `SC-TC-29/31` 单跑绿；红档 = 副本回填该句 → 三面 `十年` ≥ 1 → 必红 |
