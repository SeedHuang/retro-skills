【no-git-write】Git 写操作必须用户当面点名
触发：命令执行
1. Git 写操作：必须不在禁止清单内（例外：用户点名）
   - 允许：git status / git log / git diff / git show / git branch / git remote -v
   - 禁止：git commit / git push / git pull / git merge / git rebase / git reset / git revert / git cherry-pick / git checkout / git restore / git clean / git stash / git tag / git add / git config / git remote
落点：command-record
