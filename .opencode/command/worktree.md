---
description: Crea un worktree git en .worktrees/<nombre>.
---

Ejecuta EXACTAMENTE este comando:

git worktree add ".worktrees/$ARGUMENTS"

- `$ARGUMENTS` es sustituido por el texto literal que escribas tras /worktree (puede o no contener espacios; se usa tal cual).
- No analices el contexto ni modifiques el nombre.
- No cambies de directorio y no ejecutes ninguna otra acción.
- Si los argumentos son largos, acortalos a un nombre con formato kebab-case.