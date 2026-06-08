---
name: Renaming an artifact directory
description: How to rename/move an artifact dir given immutable artifact IDs, and the backup-dir re-registration trap.
---

# Renaming an artifact directory

Artifact IDs are immutable. `verifyAndReplaceArtifactToml` rejects any id change
(INVALID_ARTIFACT_ID), and the id is bound to the directory path. So you cannot
rename an artifact dir in place and keep it registered.

**To rename `artifacts/old` → `artifacts/new`:**
1. Stash the real source somewhere, then `createArtifact({ slug: "new", ... })`
   to scaffold + register a fresh artifact at the new path (gets a NEW id and a
   NEW port — `.replit`/proxy are managed for you).
2. Overlay the real source onto the fresh scaffold, EXCLUDING `.replit-artifact`
   (keep the new id/port), `node_modules`, and `dist`. `rsync` is NOT installed —
   use `cp`. Bring over the real `package.json` (so its slug-matching name and real
   deps win), `vite.config.ts`, `tsconfig.json`, `src/`, `public/`, etc.
3. `pnpm install`, restart the new workflow(s), typecheck, verify preview.

**Why:** vite.config reads `PORT`/`BASE_PATH` from env (set by the new artifact
toml), so a new port "just works" — no need to chase old `.replit [[ports]]`.

**Trap — the artifact scanner registers ANY directory containing
`.replit-artifact/artifact.toml`.** If you stash the old source (with its toml)
inside the repl (e.g. `.philo-backup/`), it gets auto-registered as a phantom
artifact occupying the old previewPath, causing `createArtifact` to fail with
DUPLICATE_PREVIEW_PATH (e.g. "/" already used). Fix: delete the stash's
`.replit-artifact/` (de-registers it) before recreating, then remove the stash
entirely once the overlay is done.

**Also:** a failed `createArtifact` may still leave the scaffolded dir behind, so a
retry fails with "already exists" — `rm -rf` the dir before retrying.
