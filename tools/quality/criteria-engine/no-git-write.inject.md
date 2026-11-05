【no-git-write】Git 写操作必须用户当面点名
触发：command 非空
要求：command 未命中禁止命令（最长允许前缀优先）（例外：userNamed 等于 true）
禁止：git commit / git push / git pull / git merge / git rebase / git reset / git revert / git cherry-pick / git checkout / git restore / git clean / git stash / git tag / git add / git config / git remote
允许：git status / git log / git diff / git show / git branch / git remote -v
产物：command-record
