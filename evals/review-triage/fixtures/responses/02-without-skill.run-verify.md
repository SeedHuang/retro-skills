**需要实跑验证后提交**

- `scripts/precommit.mjs` — precommit 门禁命令从 `check` 换成 `check:all`，属行为变更：提交前需实跑一次 `npm run check:all` 确认通过，并顺带确认 `package.json` 里确实定义了该脚本、耗时在可接受范围（门禁会阻塞之后每次提交）。本工作区没有仓库文件，我无法替你核实这两点。
