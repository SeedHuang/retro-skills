# PowerShell 写文本文件禁用 `-Encoding UTF8`

> 承接原 `powershell-file-encoding`（留档 `docs/bak/rules/powershell-file-encoding.md`）。适用：PowerShell 5.1 写 `.md` / `.json` / `.mjs` 等文本文件。

## 判据

禁止用 `-Encoding UTF8`：它会写入 UTF-8 BOM（文件头三字节 `EF BB BF`），让下游解析器报错或行为异常。

## 改用

`[System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding $false))`

## 写完自查

`$b=[IO.File]::ReadAllBytes($p); $hasBom = $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF`

`$hasBom` 必须为 `False`。

## 已踩场景

| 场景 | BOM 导致的症状 |
|---|---|
| `~\.agents\lessons.config.json` | `JSON.parse` 抛错，被误判成指针文件损坏 |
| 技能 `SKILL.md` | `npx skills add` 报 `No skills found`（frontmatter 明明合法） |

## 反例 / 正例

- 反例：`Set-Content -LiteralPath $p -Encoding UTF8` → 文件带 BOM → `npx skills add` 报 `No valid skills found. Skills require a SKILL.md with name and description.`
- 正例：改用 `[System.IO.File]::WriteAllText(..., (New-Object System.Text.UTF8Encoding $false))` → 同一条命令报 `Found 1 skill`。

## 为什么值得留一条

这条曾在代码里被局部修过一次（给 `lessons.mjs` 加剥 BOM 逻辑），但没落成通用约束，所以在新场景又踩了一次。修一处不等于堵住同类。
