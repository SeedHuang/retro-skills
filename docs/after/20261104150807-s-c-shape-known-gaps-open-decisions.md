# S-C 卡面形状：已知限制与承接项（open-decisions）

状态：**未决**（未完成 / 待触发）。定稿口径 = `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md`；执行结论 = ④ 段结论表 `.session/reviews/2026-11-04-1328-s-c-quality/quality-4.md` §2 / §5。
本文件是 ⑤ 段出口判据 3（「未完成项 / 已知限制有明确落点」）的落点载体。条目关闭后应整段删除，只留仍等待的项。

## 谁解得开哪一条（判据）

每一行必须能回答三件事：**等什么**（具体条件，不是「以后再看」）、**谁来满足**、**怎么发现它到点了**（触发信号）。

## 承接项（P2）

| # | 已知限制 | 等什么 | 谁满足 | 触发信号 |
|---|---|---|---|---|
| G6 | 默认档**空跑但计 pass**：`tools/docgen/test/sc-card-shape.test.mjs:681`（SC-TC-45）、`:699`（SC-TC-46）在非 `SB_SHAPE_ONESHOT=1` 档一条断言都不跑，`# skipped 0` 掩盖；`SC-TC-13` 非 SHAPE 分支是 `assert.ok(true)`（`:277`） | 下一批（S-D）把三条改为 `t.skip()`（进 `# skipped` 计数）或「提前返回 + 显式 skip 名」；本批真判由一次性档 `SB_SHAPE_ONESHOT=1` 实跑兜住 | 下一批施工者（S-D），改判授权归用户 | `node --test tools/docgen/test/sc-card-shape.test.mjs` 的默认档汇总行出现 `# skipped ≥ 3`（现为 0）即已改到 |

## 承接项（P3，记录层 / 文档层）

| # | 已知限制 | 等什么 | 谁满足 | 触发信号 |
|---|---|---|---|---|
| G1 | 「人设身份句」同义资历表述漏检：V9 词面只有 `资深` / `20 年`，`docs/agents/senior-sdet.md:9`「有十年以上经验的测试开发工程师。」逃过词面门禁；另两席（`evidence-reader.md:9` / `reviewer-reader.md:9`）首句是角色定位句，非职责句 | 把 V9 判据改成**位置型**（首句须主语 + 动作，禁「有…经验 / 是…角色」句式）+ 补同义资历词面；须与 spec §11.8 同批改（改判授权归用户） | 用户（授权）＋ 下一批（S-D）施工 | 在 `docs/agents/*.md` 首句植入「十年以上经验」类句式后门禁仍绿 = 该条仍未改到 |
| G2 | `spec §11.14 步 1` 的 `git checkout` 清单未点名 ③ 交接词 `docs/handoffs/2026-11-04-s-c-card-shape-impl.md`（该件已在 SC-TC-62 白名单，`tools/docgen/test/sc-card-shape.test.mjs:964-965`），差集 = 1 | spec 下一次修订时把该实名写进步 1 清单（本批签字件不改） | 主 agent（spec 修订者） | spec §11.14 步 1 出现该文件名字面 |
| G3 | 用例计数命令缺行首锚点会自命中：`test('SC-TC-` 无 `^` 得 **61**（多出 `tools/docgen/test/sc-card-shape.test.mjs:3` 注释示例）；`^\s*test\('SC-TC-` 得 **60** | 计数一律用带锚点形态，或复用 `blockCount(SELF_PATH,'SC-TC-')`（`tools/docgen/test/sc-card-shape.test.mjs:931`）——本批口径已在用，无需改实现 | ④ / ⑤ 复跑者每次复算按带锚点命令 | 复算得 61 而文件内实际块数为 60 |
| G7 | testcase **签字件未回填执行结论**：**8 个用例**带未施行标注（7 处全宽 `（未施行）`：SC-TC-10/11/12/33/34/35/36 + SC-TC-55 的 1 处变体）＋ **48** 行红绿证据写 `未施行（施工后核）` | 按「签字件不改」不回填；执行结论唯一出口 = `quality-4.md` §2 | ④ / ⑤ 引用 §2 而非 testcase 标注 | 直接读 testcase 见到「未施行」字样即走查 §2（不是缺陷复发） |
| G8 | **跨条子判据**：SC-TC-26 的「改前 = 13 项」由 SC-TC-57（`:890`）承担；SC-TC-58 的「七段」由 SC-TC-13（`:275`）承担 → 单跑一条会缺子判据 | 保留（总表口径已全覆盖）；文档层在 testcase 各条写明「该子判据由 SC-TC-xx 承担」 | ④ / ⑤ 复跑者一律跑整文件、不单跑 | 用 `--test-name-pattern` 单跑 SC-TC-26/58 时该子判据无断言 |
| G9 | SC-TC-62 白名单比签字件宽 **2 项**（A 面 +`docs/handoffs/2026-11-04-s-c-card-shape-impl.md`、M 面 +`skills/dev-workflow/references/gate-record.md`），B 面由「`A ⊇ 7 项` 写死」改为 `git ls-tree $BASE` 现算；用户 2026-11-04 已裁定补入 | spec §11.14 步 1 与 §11.15 在下次修订回填这两处实名 | 主 agent（spec 修订） | spec 两节出现这两处路径字面 |
| G10 | **path:line 引用漂移**：同一条目跨工具记的行号可差 1（该文件 LF / CRLF 混用）；本批门行行号曾记成 `:99/:100/:101`，实为 `:100/:101/:102`（`:99` 是空行） | 任何「门行在哪一行」的引用一律**当场打印核对**，或引 `check-gate-record` 的 `rows` 数 | ④ / ⑤ 引用门行者 | 引用的行号打印后不是门行 |
| G11 | **投影面 0 diff 无判据**：`docs/agents/**` 16 份中 2 份 0 diff，③ 门行判「投影面所致、非漏生成」全靠文字，无机械判据 | docgen 侧加一条正向断言（「投影面 2 份不变 ⇒ 该两席本批未被改」），或在 ⑤ 抽 1 份 0 diff 文件核其内容与渲染器输出一致 | 下一批（S-D）的 docgen 断言候选 | 该断言落地后，人为造一份「该改却 0 diff」仍绿 = 断言无判别力 |
| G12 | **④ / ⑤ 落行后的 `impact-sheet.md` mtime**（R8）：只要当批 diff 含 `gate-record.md`，同批须 touch 当次 `impact-sheet.md` 再跑 `sweep --check` | 每次落门行时执行（本批 ④ 轮已做；⑤ 轮同规则） | 主 agent（落门行者） | `node scripts/scope-sweep.mjs --check` 报 `FAIL: impact-sheet 早于被扫文件` |

## 已闭合（不再计入未闭合缺口）

| # | 原级别 | 闭合依据 |
|---|---|---|
| G4 | 首轮 P1 | `tools/docgen/test/sc-card-shape.test.mjs:934` 左值改为现场 `blockCount(SELF_PATH,'SC-TC-')`；注入 A（删一块 → `expected 60 / actual 59`）、A2（执行到 `tools/docgen/test/sc-card-shape.test.mjs:934` → `expected 1541 / actual 1540`）、C（`BASELINE_TESTS 1481→1482` → `actual 1542`）全红 |
| G5 | 首轮 P1 | `tools/docgen/test/sc-card-shape.test.mjs:940-957` 改为 `withRepoCopy` 副本真跑 → `rmSync` 真删 → 同命令再跑 exit 非 0 且计数掉落；注入 D（`rmSync` 换 `void 0` → 报「必须 exit 非 0」）必红 |
