# Session 交接：retro-skills → 补完 review 能力（2026-10-08）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-08 17:52（本机时区 Asia/Shanghai） |
| 项目根 | `D:\Seed\retro-skills` |
| HEAD | `2a2d71d feat: 新增未完成事项文档管理技能 writing-after-docs`；工作树：**dirty，21 个未提交改动**（详见「现状」逐项） |
| 验证基线 | unit **127/127 pass / 0 fail**（17:52 实跑，取数命令 `node --test skilldependencies/validate.test.mjs skills/managing-lessons-store/scripts/lessons.test.mjs`）＋ typecheck / build / e2e：**本仓无此三项**（纯 Node 脚本库，无 tsconfig、无 e2e） |
| 继任自 | 无（首份写给 review收尾的 handoff。历史交接词见 `docs/handoffs/`，最近一份是 `2026-09-29-session-close.md`） |
| 状态 | **有 2 个开放问题待用户拍板**（见「开放问题」节；第 3 条清账时机已定为流程③，不再是开放问题） |

## 项目定位

`D:\Seed\retro-skills` —— 一套由 skill 组成��复盘工具链（`retro-collect` 采事实 → `retro-analyze` 出问题清单 → `retro-institutionalize` 把结论落成规则 / skill），外加 `managing-lessons-store`（错题集 CLI，脚本在 `skills/managing-lessons-store/scripts/lessons.mjs`）。

## 现状

**已完成**（每条带出处）：

- **review 机制本体已建**（本session 新增，未跟踪文件）：`skills/review-loop/`（三段流程：段一 OCR / 段二 multi-lens-review / 段三 对账）、`skills/review-log/`（过程账技能 + 2 个模板）。依赖清单 `skilldependencies/review-loop.json`、`review-log.json` 已加，`writing-after-docs.json` 加了 `review-log`。
- **9 轮 review 已跑完段一/二/三**（`.session/reviews/2026-10-08-1206-9round-review-loop/progress.md` 轮次账表，含 5 个 OCR session id）。
- **规则体系15 条 → 13 条**：3 条合并为 `how-i-must-reason.md`（`my-rules` 源仓库，`aas doctor` 实测运行时 13 链接全可读、自家残留 0）。**注意这条规则在 `my-rules` 仓库，不在本仓**。
- **文档重复已清**：`review-loop/references/loop.md` 与 `multi-lens-review` 的三态表 / 收敛判据重复已改为指针（实测 L24 / L27 / L215 / L217 均是「权威在 multi-lens-review，本卡不重定义」）。
- **`retro-verify` 与新规则的矛盾已修**：`skills/retro-verify/SKILL.md:35` 现为「先穷尽取证手段，交之前必须说清查了什么、为什么拿不到」。
- **`multi-lens-review` 成本话术已补数字要求**：`skills/multi-lens-review/SKILL.md:104` 现要求「具体几处 + 影响哪些文件 + 取数命令」。
- **`.session/` 机制已落地**：`.gitignore` 含 `.session/`（实测 `git status` 不显示该目录）；封闭清单 2 项（`reviews/` + `README.md`），定义在全局规则 `docs-convention`「临时记录（`.session/`）」一节。

**提交状态**：**两仓全部未提交**，由用户自行commit。

- 本仓 `D:\Seed\retro-skills`：15 个已跟踪文件改动 +1198 / −44（`git diff --stat` 实测）+ 5 个未跟踪（`skills/review-log/`、`skills/review-loop/`、`skilldependencies/review-log.json`、`skilldependencies/review-loop.json`、`docs/superpowers/specs/2026-10-07-moment-context-and-timeline-design.md`）。
- 源仓库 `D:\Seed\my-rules`：`README.md` 改、6 个 `??` 未跟踪规则（`docs-convention` / `global-ask-before-acting` / `how-i-must-reason` / `rules-single-source` / `skill-assets-convention`）、1 个 `D`（`numbers-must-be-measured.md` 已合并删除）。

**工作树异常**：

1. **第 9 轮 review 核销为「否」** —— `progress.md` L66 原文：「本轮新改的代码（正则分支、正则表达式）还没被 OCR 看过」。**`lessons.mjs` 是当前唯一带未核销账的文件。**
2. **`.session/.../problems.md` L72 有悬空指针** —— 仍写「详见 `pending.md`」，而 `pending.md` 已在本 session 删除（待决项全并入 `docs/after/`）。
3. **`problems.md` 记账滞后** —— L52-70 的「待处置」5/6/7/8 四条**实际都已改完**（见「现状」已完成各项），但没按该文件 L3-6 自己定的「已修的立刻移走」清账。
4. 本仓 `git tag` 返回 **0 个** —— 故 `ocr review --commit <tag>` 无法实测，`review-loop` 三处文档已标注「未验证」。

## 过程记录

- `D:\Seed\retro-skills\.session\reviews\2026-10-08-1206-9round-review-loop\progress.md`（**先读尾部**「本轮结论」+「未验证 / 无法验证的项」两节）
- `D:\Seed\retro-skills\.session\reviews\2026-10-08-1206-9round-review-loop\problems.md`（问题漏斗，「不改」3 条 + 「误报」1 条 + 待处置若干）
- `D:\Seed\retro-skills\docs\after\collect-requirements-exploration.md`（collect 侧未完成项，**五条待决未拍板**）
- 历史交接词：`docs/handoffs/` 内5 份，最近 `2026-09-29-session-close.md`（本session 无链式继任）

## 本次任务

**补完 review 能力**：把 review 能力补完整。分两轮跑：**先用文档模式（`/review-md-to-death`）核销文档，再单文件跑代码模式审 `lessons.mjs`**（含第 9 轮欠下的账）。

流程：`① /review-md-to-death 核销 18 个 md（段二 + 段三自动）→ ② /review-code-to-death 单文件审 lessons.mjs（段一，第 9 轮欠账在这）→ ③ 清 review 账本欠账（**必须在 ①② 之后**，理由见下）→ ④ review 补完后才进 collect 改造 → ⑤ analyze 最后`；**起点：①**。

**为什么先 md 后 code（别调换）**：段三是「文档断言 → 代码取证」，**文档还没定稿时问出来的「与代码不符」可能只是文档还没改**，会把段二未做完的活错记成段三的问题。**先让文档定稿，再对账。**

**为什么清账排在 ③ 而不是 ① 之前**（**别提前清**，三条依据）：

1. **先清没有收益** —— `problems.md` 在 `.session/`，md 模式扫不到（实测：未跟踪 md 清单 8 个全来自 `docs/` 和 `skills/`），「先清以免污染 md 清单」这个理由不成立；
2. **会销早** —— 那 4 条「已改完」的判定，依赖的正是 md review 要审的文件（`loop.md`、`retro-verify/SKILL.md`、`multi-lens-review/SKILL.md`，实测全在 18 个 md 清单里）。**md review 可能给出不同结论**（例：第 8 条数字要求的措辞被判不合格 → 那是「没改完」）；
3. **账销了、问题还在** —— 先清等于在被审对象上先动手脚，且收尾扫「声明它的地方」时分不清账是 md review 之前还是之后的账。

**顺带收益**：md review 报出来的问题若正好覆盖这 4 条，可**一次清完**，不用清两遍。

⚠️ **md 模式消不掉 `lessons.mjs` 的账**：段三只查「文档与代码是否一致」，**不查代码本身对不对**。按 `loop.md` §1 分段判据，`lessons.mjs` 的核销属段一（OCR），md 模式不覆盖 —— 进度条上第 9 轮那笔账（「核销为否」）跑完 md 仍然挂着。

用户明确排序（2026-10-08 原话）：「我要先把 review 的能力先补充完毕，在进行 collect 的优化」，且「analyze 是更后面的活」「这次我会用 /review-md-to-death 这个能力进行单独 md 的 review」。

## 范围依据

**要读**：

- `skills/review-loop/SKILL.md`（全篇，尤其「每一轮的开场动作」相关约定）
- `skills/review-loop/references/loop.md`（三段各自判据、增量范围约定；L27 段二收敛判据不外借给段一/三）
- `.session/reviews/2026-10-08-1206-9round-review-loop/progress.md` L13-25（轮次账表，含 5 个 OCR session id）、L86-92（未验证项）
- `skills/managing-lessons-store/scripts/lessons.mjs`（本轮唯一审的代码文件）
- 规则 `my-rules\rules\how-i-must-reason.md` §4（先判性质：漏 case vs 机制错）、§6（数字一律实测）
- `docs/after/collect-requirements-exploration.md` §7（**只在 review 完成后**才需要看，五条待决）

**勿重做**（已完成的，文件级）：

- `skills/review-loop/` 与 `skills/review-log/` —— 本session 新建，已落地，勿重建
- `skills/review-loop/references/loop.md` L24/ L27 / L102 / L215-225 的去重复述 —— **2026-10-08 已收敛为指针**，勿再改
- `skills/retro-verify/SKILL.md:35` ——已修，勿重复改
- `skills/multi-lens-review/SKILL.md:103-104` —— 已补数字要求，勿重复改
- `my-rules\rules\how-i-must-reason.md` —— 15→13 的合并已完成，`aas doctor` 实测残留 0，勿再合并

## 开放问题

1. **（开工第一问）代码那一轮的范围取「只审 lessons.mjs」还是「全量 diff」？**
   - 推断：**只审 `lessons.mjs` 单文件**。依据：`progress.md` L70-76 记着第 8/9 轮报同一批 3 条、我处置了两遍，病根就是范围一直是全量 diff，且当时写下的根治方案是「一轮只审一个文件」。
   - 已定：**文档那一轮走 `/review-md-to-death`（工作区范围，18 个 md）**，不再问。本条只问代码那一轮的范围。
   - 请用户：确认 / 纠正。
2. **两仓共 21 个未提交改动要不要先 commit 一次再开工？**
   - 推断：**建议 commit**。依据：不 commit 则下个 session 面对的还是同一坨未提交 diff，`review-loop` 的增量范围判据依赖「上一轮修完后的 diff 增量」；且第 9 轮之所以能「核销为否」，根源就是改动混在一起无法切分。
   - 请用户：确认 / 纠正（按全局规则 `no-git-write`，未经明确指示不执行任何 git 写操作）。
3. **`.session/.../problems.md` 清账 —— 已定：做，但排在 ①② 之后（流程③），不是开工前。**
   - 推断：**做，排在「本次任务」流程③**。依据：L52-70 四条「待处置」实际已改完（逐条核实过），按该文件 L3-6 自定的规则「已修的立刻移走」应当移出；另 L72 的 `pending.md` 指针已悬空。
   - **为什么不提前**：那 4 条「已改完」的判定依赖 md review 要审的文件（见「本次任务」节三条依据），提前销 = 用旧结论销账。
   - 状态：时机已定，**不需要再问**；到流程③ 动手即可。

## 既定约束（不要重新讨论、不要重新选型）

- **review 的停机判据是「清单核销干净」，不是「轮数够了」** —— 出处：`progress.md` L96-98；「连续 2 轮零新增」只管段二，不外借给段一/段三（`loop.md` L27）。
- **判据不许是「感觉」或「规模」** —— 出处：规则 `how-i-must-reason` §3；禁止「成本太高/ 改动太大 / 要改好几处」，必须给具体几处 + 影响哪些文件 + 取数命令。
- **一个用途只能有一个地方** —— 出处：规则 `docs-convention` 硬约束 2；待决事项只进 `docs/after/`，不设第二落点。
- **待办文件里不许有 ✅ 档，做完即删** —— 出处：规则 `docs-convention`「待办文件的语义」；一份待办超一半是✅ 即已变成历史档案。
- **不 commit、不 push** —— 出处：用户全局规则 `no-git-write`。
- **改动已有规则只改源、不改运行时** —— 出处：规则 `rules-single-source`；运行时是链接，改源即生效；新增/删除规则才需 `aas sync`。
- **OCR 报的机理与后果要分开验** —— 出处：`problems.md` L41-46；第 9 轮实测 OCR 说的机理成立但后果夸大。

## 遗留裁决与留观项

- `parsedFlags` 不支持嵌套括号形态（`argOf(getFlag('--x'))`）—— 来源：`problems.md` L33-35「不改」区；收敛时机：真出现该写法时。**刻意不加复杂度。**
- `CLI_FLAGS` 全局混了 `verify record` 的单字母 flag（`--a`/`--b`/`--n`/`--p`）—— 来源：`problems.md` L21-26「不改」区；实测是「告警 + 拒记账」非静默丢字；取舍已写进 `skills/managing-lessons-store/assets/moments-template.md`。**不改。**
- `ocr review --commit <tag>` 未实测 —— 来源：`progress.md` L90；本仓 0 个 tag（实测 `git tag|Measure-Object` = 0）；替代路径 `git rev-parse <tag>^{commit}` 换 hash。
- 改动分类方案（按扩展名 vs 按「执行行为会不会变」）—— 来源：`docs/after/collect-requirements-exploration.md` §6，已parking；**方向已认可（用户已认可 ① 执行逻辑 ② 计算逻辑 ③ 验证 ⑤ 新增规范），④ 纯记述悬置**。触发时机：真正要用「§5 第 3 条」时。**不要走回头路按文件格式分类。**

## 开工前先做

1. `git status --short`（两仓各一次：`D:\Seed\retro-skills`、`D:\Seed\my-rules`）确认工作树与开放问题 2 一致；`git diff --stat` 取当前 diff 作基线。
2. 读 `.session/reviews/2026-10-08-1206-9round-review-loop/progress.md` L13-25（轮次账表）——**轮次编号从表里数，不许口头数**（这是第 8/9 轮重复劳动的直接原因）。
3. 读 `skills/review-loop/SKILL.md` + `references/loop.md` L1-30，确认三段流程与增量范围怎么定。
4. 重跑基线：`node --test skilldependencies/validate.test.mjs skills/managing-lessons-store/scripts/lessons.test.mjs`（17:52 实测 127/127pass），确认交接后无人改坏。
5. 跑 `/review-md-to-death`（**文档那一轮，起点**）。⚠️ **不要在这一步之前清 `problems.md`** —— 排在「本次任务」流程③，理由见那节（会销早、且账销了问题还在）。

⚠️ **`.session/` 扫不到，别指望 md 模式自动发现账本滞后**：`.gitignore` 含 `.session/`，故 `git ls-files --others --exclude-standard -- '*.md'` 返回的未跟踪 md 里**没有一个来自 `.session/`**（实测）。段二扫的是「本次范围内的 md」，`.session/.../problems.md` 不在范围内 —— **开工第 5 项那条清账动作只有人读交接文档才会发生**。

## 开场话术

读 `docs/handoffs/2026-10-08-review-loop-finish.md`，按交接词继续：先跑 `/review-md-to-death` 核销 18 个 md，再单文件 code 模式审 `lessons.mjs`（含第 9 轮欠账），然后才进 collect 改造。
