# PowerShell 写文本文件禁用 `-Encoding UTF8`

> 来源：KB 教训（2026-09-27 首见，2026-09-28 复查时**再次踩中**）｜证据：`skills add` 对带 BOM 的 `SKILL.md` 直接报 `No skills found`；去掉 BOM 后同一命令立即报 `Found 1 skill`｜落地：2026-09-28

用 PowerShell 5.1 写文本文件时，**禁止**用 `-Encoding UTF8`——它会写入 **UTF-8 BOM**（文件头三字节 `EF BB BF`），让下游解析器报错或行为异常。

**改用**（明确指定"不带 BOM"）：

`[System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding $false))`

**写完自查**：

`$b=[IO.File]::ReadAllBytes($p); $hasBom = $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF`

**已踩过的两处**（说明它不是个别现象）：

| 场景 | BOM 导致的症状 |
|---|---|
| `~\.agents\lessons.config.json`（错题集指针） | `JSON.parse` 抛错 → 被误判成"指针文件损坏" |
| 技能 `SKILL.md` | `npx skills add` 报 `No skills found`（明明有合法 frontmatter） |

**注意**：这条规则曾在代码里被"修掉"过一次（给 `lessons.mjs` 加了剥 BOM 的逻辑），但**没落成通用规则**，所以在新场景（PowerShell 直接写技能文件）又踩了一次。

**反例（本次真实触发）**：`Set-Content -LiteralPath $p -Encoding UTF8` → 文件带 BOM → `npx skills add` 报 `No valid skills found. Skills require a SKILL.md with name and description.`（而文件里 name/description 都在，真正的原因是 BOM）。

**正例**：改用 `[System.IO.File]::WriteAllText(...)` 显式不带 BOM → 同一条命令立刻报 `Found 1 skill`。
