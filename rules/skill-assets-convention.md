# 技能目录语义遵循官方标准，产物骨架不内联进 SKILL.md

> 来源：L-021｜证据：2026-10-02 落地 userwords 时实测——retro-analyze / retro-collect 的 SKILL.md 各内联 27 / 30 行模板，且 facts 模板在 SKILL.md 与 spec §5.1 两处已不一致（一处七节、一处六节）｜落地：2026-10-02

**技能目录的语义遵循官方 Agent Skills 标准（skill-creator / agentskills），不自创判据**：

| 目录 | 官方语义 | 例子 |
|---|---|---|
| `scripts\` | 可执行代码（agent RUN，不用加载即可执行） | 校验脚本、工具脚本 |
| `references\` | 按需加载进上下文的**文档**（agent READ） | 差异卡、流程口径、协议 |
| `assets\` | **输出用的文件**（templates / 图标 / 字体） | 产物模板、fixture 用的模板 |

**两条硬约束**：

1. **骨架不内联进 SKILL.md**——能外移的模板/文档一律外移到上面对应目录，`SKILL.md` 只留「用哪个」+ 指针。为什么：SKILL.md 是每轮都要读的入口，骨架占篇幅会挤掉判断规则；更麻烦的是骨架散落后会跟 spec 里的旧版**悄悄分叉**（facts 模板就曾两处不一致，一处七节一处六节）。
2. **判据按文件用途，不按「能不能填空」**——模板（输出用）→ `assets\`；流程/口径/差异卡（agent 读的指引）→ `references\`；描述性清单（八要素表、口径表、五档标准）留在 SKILL.md。

- **正例**：`retro-analyze/assets/retro-template.md` 存复盘骨架（输出模板），SKILL.md 只写一行指针；`evolving-skills/references/card-rule.md` 存 rule 差异卡（agent 读的指引）。
- **反例**：把 27 行复盘模板直接贴进 `retro-analyze/SKILL.md`（2026-10-02 前就是这么写的）；把差异卡放 `assets\`（曾这么干，按官方语义错了）。
- **搬完必须扫引用**；spec / plan / handoff 里的旧路径属历史记录，**保留不改**。
- **外部权威优先**：装进来的官方 skill（如 `skill-creator`）是「怎么写 skill」的标准，本规则只约束「我们仓库里技能的组织」，不重复官方规范。
