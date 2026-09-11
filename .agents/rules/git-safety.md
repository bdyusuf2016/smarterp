# GIT/GITHUB SAFETY RULE — STRICT

Never execute any GitHub remote operation without the user's explicit permission.

The following ALWAYS require explicit confirmation immediately before execution:
- `git push`
- `git pull`
- `git fetch`
- GitHub Pull Request creation/merge
- Any GitHub API write operation
- Any action that uploads, synchronizes, or changes code on the remote repository

Do NOT infer permission from instructions such as "continue", "fix it", "complete the task", or "update the project".

Before any remote operation, STOP and ask:
**"This requires `<command/action>`. Do you explicitly authorize me to proceed?"**

Only proceed after the user explicitly approves that specific remote operation.
NEVER PUSH OR PULL AUTOMATICALLY.
