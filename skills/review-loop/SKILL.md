---
name: review-loop
description: 循环审查未提交改动或最近 N 次 commit 的代码与文档，直到无矛盾、盲点。**先读本文件，按「模式」表执行，三条命令共用本技能。** Use when the user asks to review changes, 说「review 一下」「审一下改动」「审代码」「审文档」「看看这次改动有没有问题」或提到往死里 review。Do not use for 新写代码、写文档正文、单纯解释某段代码在做什么。
---

# review-loop：改动审查循环

## 这个技能干什么

审查**一个范围**内的改动，把问题找干净并修掉，循环到**核销干净**（每段的清单都审完、都修完）。范围可以是工作区未提交，也可以是最近 N 次 commit。

**审查跑在专门的 review 分支上**：每轮 commit 锁基线——「锁基线」= 把这一轮修完的结果存成一次提交，让下一轮只审「上次提交之后」的新增部分（不重审已修部分）。这是本技能能收敛的前提——不做分支，L1（全量重审）无解。

## 分支前置（每次触发先走这里，不许跳）

1. **当前分支检查**（先看这个，再看残留）：`git branch --show-current`
   - 已在 `review/*` 分支上（如上次会话中断、这次接着审）→ **不建分支**，读 `.session/reviews/<那一次>/progress.md` 恢复「中断在那一轮」→ 继续
   - 不在 → 进下一步
2. **残留检查**：`git branch --list 'review/*'`
   - 有残留 → **阻塞式确认**：报分支名 + 该分支上有几个未合并 commit，问用户「是否删除残留分支 `review/xxx`？（删除不可恢复）」选「是」→ 删除后继续；选「否」→ **终止本次 review**，不降级、不硬来
   - 无残留 → 继续
3. **建 review 分支**：`git checkout -b review/<yyyyMMdd-HHmm>-<短摘要>`（日期防撞车；git 写权限例外见全局规则 `no-git-write` 段 1）
4. **项目类型初始化 + 规则派生**：按 `references/project-type.md` 跑——跑 `review-init.mjs`（初始化全局注册表，幂等）→ 读项目类型指针 `.reviewconfig/project-type`：无 → 走选择流程（用户描述 → 匹配候选 → 唯一命中直接落地 / 多候选列表选 / 无候选新建），落地用 `update-review-project-type.mjs <类型名>`（三步一起：写注册表 + 派生 `.opencodereview/rule.json` + 写指针；类型必须是对象条目，字符串条目会报错）→ 有 → 复用（先 `review-init.mjs --list` 看 `currentHit`：null 且 current 非 null = 指针失效，重新走选择流程）→ 验证 `ocr rules check <文件>` 应显示 `Source: Project`。生成的 `.opencodereview/rule.json` 属审查范围外（OCR 不审它），循环内不 commit，收尾作为**项目配置**一并提交（见第 5 步）
5. **审查环境初始化**：跑 `node review-init.mjs --gitignore`（确保目标仓库 `.gitignore` 含 `.session/`，幂等、缺则自动追加，不靠人记得——实测 2026-10-13：sound-control-tool 缺这条，历史账本脏进 git）。**核销**：① `.opencodereview/rule.json` 与 `.reviewconfig/project-type` 是**项目配置**（L3 产物），应**进 git** 而非忽略——收尾随审查清单提交，与 `.session/` 相反；② 若命令返回 `tracked: true`（`.session/` 已被 git 跟踪，`.gitignore` 对已跟踪文件不生效）→ 转达用户执行 `git rm -r --cached .session` 后提交
6. **建账（调 review-log 技能）**：调 `review-log` 技能建账——按它的规矩在 `.session/reviews/<那一次>/` 下建 **progress.md + problems.md 两个文件**（目录不存在则先建；目录名沿用 review-log 的 `<YYYY-MM-DD-HHMM>-<名字>` 格式；两文件骨架逐字用 review-log 自己的模板，本技能不复制、不缩写），并把「母分支名 = 触发时的当前分支」+ 新建的分支名写进 progress.md。**产出核对：progress.md + problems.md 两个文件都在、progress.md 里母分支名与分支名都写了，缺一 = 分支前置不算完成，回头补建再进下一步。**

> **不支持并行**：同一时间只允许一个 review 运行。残留检查时**排除当前所在分支**（它可能是中断恢复），其余 `review/*` 分支一律视为残留。

## 先读范围规则（决定审什么）

| 用户给的 | 范围 | 代码侧命令 |
|---|---|---|
| 只说「review 一下」/ 未指定 | **工作区未提交**（staged + unstaged + untracked） | `ocr review` |
| 一个数字 N（如「3」「最近 3 次」） | **最近 N 次 commit** | `ocr review --from HEAD~N --to HEAD` |
| 一个 commit hash | **那一个** commit | `ocr review --commit <hash>` |
| 一个 tag | **那一个** commit（⚠️ **本仓 0 个 tag，`--commit <tag>` 没实测过**——git 能把 tag 解析成 commit，OCR 收不收得下没测过） | 先 `git rev-parse <tag>^{commit}` 换成 hash，再用上一行 |

**不用用户去 `git log` 抄 hash**：数字 N / hash / tag 都能直接从用户那句话里取。
**「一个 hash」和「N 次」不是一回事**：前者是那一次（`--commit`），后者是 N 次的合计（`--from/--to`，一个文件中间改过多轮只留净额）。文档侧取数、以及 commit 范围内读文件要注意什么，都在 `references/loop.md` §2。
**⚠️ N 模式的滑动陷阱**：`HEAD~N` 是相对引用，一旦本轮有**前置 commit**（见下节「OCR 前置工程检测」），它会滑一格 → 最老那个 commit 被静默挤出范围。**先 `git rev-parse HEAD~N HEAD` 把两端落成 hash 再 commit**，跑 OCR 时用 hash。hash / tag 模式不受影响。

## OCR 前置工程检测（每次触发必跑，先于段一）

**跑 OCR 之前，先跑 `npm run check`**——把可机械判定的问题（工程闸门：语法 / markdown / 测试 / 守卫）用工程工具先修掉，**不进入 OCR 范围**（OCR 是 LLM，审这类问题是浪费 token）。

1. `npm run check` 全绿 → 直接进「三种模式」选段跑。
2. 有红 → **先修**：语法错改语法、markdown 坏改格式、测试红改代码、守卫 findings 改技能文档——修完重跑 `npm run check` 直到全绿，才进 OCR。
   - **目标仓没有配 `check` script** → 跳过本节，在报告里写明「无工程闸门」，直接进 OCR，不阻塞审查。
3. 机械问题修完的改动，**在 OCR 之前的收尾一并锁基线**（同一轮 commit，message 按 `references/loop.md` §3 格式写，**写完核对 `<标准前缀>: 【review】` 两个都在，缺一不可**；只 add 本次机械修复涉及的文件）。
   - **N 模式必须先把范围两端落成 hash 再 commit**：`--from HEAD~N` 里的 `HEAD~N` 会随前置 commit 滑一格，最老那个 commit 被静默挤出范围、而机械修复 commit 反而进了 OCR 范围。先 `git rev-parse HEAD~N HEAD` 记下两端，跑 OCR 时用 hash 而非 `HEAD~N`。hash / tag 模式天然不受影响（「一个 hash」和「N 次」不是一回事，见上方范围表）。
   - **项目配置文件例外**：`.opencodereview/rule.json` 与 `.reviewconfig/project-type` 按分支前置第 4 步的规矩留到收尾提交，不进这个前置 commit。
4. 机械问题**不算 OCR 评论**——不喂给 OCR 重复审，也不进 problems.md 的 OCR 处置流程。

**不因来源豁免**：子代理、脚本执行本技能时同样先过 `npm run check`。

**为什么前置**：机械问题用工程工具查得又快又准（实测全仓语法检查 209ms + 测试 866ms vs OCR 单次 ~74 万 token / 4m39s）；把机械层剥离后，OCR 只审它真正擅长的逻辑 / 语义 / 跨文件一致性。

## 三种模式（决定走哪几段）

| 模式（命令里叫「代码模式」/「文档模式」/「全部模式」） | 走哪几段 |
|---|---|
| **code**（代码模式） | 只跑段一 |
| **md**（文档模式） | 跑段二；**若清单里同时有文档和代码改动，自动加跑段三** |
| **all**（全部模式） | 三段全跑 |

「文档和代码同时在场」时第三段必跑——只有这时候文档断言才可能和代码事实对不上。纯代码/纯文档范围下自动空转跳过，**但要在报告里写明「空转」，不能算「已跑」**。**空转 ≠ 本轮无改动**：段一空转只是没跑 OCR，本轮修过的文档同样要按「必须遵守」第一条（每轮收尾 commit 到 review 分支）锁基线。

## 一轮 = 三段各走一遍

**一轮之内不回头重跑任何一段；要重跑就是进下一轮。**段一 / 段二 / 段三的编号永不改变。

停机判据按段分开定，**不是「轮数够了」**——见 `references/loop.md` §1。

## 三段流程

### 段一 · 代码（OCR）

```powershell
ocr review                      # 工作区
ocr review --commit HEAD        # 最近 1 次
ocr review --from HEAD~N --to HEAD   # 最近 N 次
ocr review --preview            # 只看会审哪些文件，不花 LLM
```

`--preview` 建议**每次先跑**，确认范围对了再正式跑。
规则对症通过项目内 `.opencodereview/rule.json`（分支前置第 4 步派生）生效；命令**不带** `--background-file`（实现版 v1 不做背景层）。

### 段二 · 文档逻辑（parliament）

调用 **skill `parliament`**，范围 = 本次审查范围内的所有未提交/涉及的 `.md`。收敛协议、输出格式、修复纪律全部按那个技能自己的规矩走，本技能不重定义。

### 段三 · 断言取证

读 `references/mode-all.md` 照它跑。**前两段之外单独一节报告。**

## 共享口径（停机判据 / 取数 / 硬约束 / 输出）

读 `references/loop.md`。三条命令共用那一份，**本文件不重复**。

> `references/mode-all.md` 是**另一回事**：它只是**段三**的走法（怎么列断言、怎么取证），只有会跑到段三的模式才需要它——`code` 模式用不上。三条命令真正共用的口径**只有 `references/loop.md` 这一个文件**。

## 必须遵守（摘要，**完整清单在 `references/loop.md` §3**）

- **每轮收尾 = commit 到 review 分支**（message 必须按 `references/loop.md` §3 的格式写，写完核对 `<标准前缀>: 【review】` 两个都在，缺一不可；只 add 本次审查清单内文件，禁止 `git add -A`）——这是锁基线的动作，是流程必需，**不许问「要不要提交」**。**执行本技能时，「每轮 commit 锁基线」是全局规则 no-git-write 的唯一结构性例外——不得用「不主动 commit」的惯性回避它。**
- **先过滤再处置**——每轮 OCR 评论先对照 `problems.md` 的「不改/误报」锚点过滤（规则匹配 + 语义裁决），重复的直接吞掉，不修、不计入本轮问题数；**只过滤「不改/误报」，「已修」再报必须按新问题处置**（细节见 `references/loop.md` §1「处置前的重复判定过滤」）
- **修复纪律 A1/A2/A3/A4**——修复前列全失败面、样式级评论判不改、修完真实场景实测、修复前先做评论关联分析（把本轮要修的评论当一个整体，合并同文件 / 按依赖排序契约链），完整清单见 `references/loop.md` §1「修复纪律」（防 18 轮式自伤回归）
- **不 push、不 merge、不 reset**——review 分支不推送远程；收尾合回母分支用 **rebase**，且必须用户确认后才做
- **不许手动判断「应该没问题了」提前停**——停机判据在 `references/loop.md` §1：**修复轮 + 复查轮都干净才停**，轮内自审（手法 3 重跑 / 同族扫描）不算复查
- **不许跳段**——指定哪段就跑哪段
- **不碰审查范围外的文件**
- **改了实现就回头扫一遍声明它的地方**（文档 / 注释 / README 的旧说法不会自动跟着变）
- **工具没输出时查它的状态，别干等也别打断**——见 `references/loop.md` §1 末（OCR 用 `ocr session list` 看 STATUS）
- **不许在循环里停下来问用户**——顺序是「先查 → 再定 → 最后才问」，见 `references/loop.md` §1.5

上面前三条（每轮 commit / 不 push 不 merge / 不许提前停）是从 `references/loop.md` §3 挑出来的**最容易犯且后果最重**的；后几条同样在 §3 里。**以 §3 为准，本表是摘要、不完整**——要动手前照 §3 读一遍。

## 收尾（核销干净之后必做）

1. **工作区检查**：`git status --porcelain`——若有未提交改动，区分「审查清单内」（应已 commit 完，不该有）与「清单外」（用户插队改的），清单外的先列出逐项问用户
2. **范围预检**：`git diff <母分支>..<review分支>` 只应包含本次审查涉及的文件；超出范围的改动先单独列出，逐项问用户
3. **展示 + 确认**：把改动摘要给用户看 → 用户点头才合（**这是唯一允许问「是否提交/合并」的场景**）
4. **合并**：切回母分支 → rebase review 分支（git 写权限例外见全局规则 `no-git-write` 段 2）
5. **删分支**：合并成功后删除 review 分支，progress.md 记「已合并删除」
6. **异常**：rebase 冲突 → 停下，把冲突文件列给用户等裁决；用户弃合 → `rebase --abort` 恢复原状，改动留 review 分支不动

## 收了工还要记账

后续发现「本应审出来但没审出来」的问题时，按 `references/loop.md` §5 走：**先记账、一句告知、不当场改**。改技能是用户在 lessons 发起的事。