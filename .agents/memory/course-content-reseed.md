---
name: Course content re-seed gotcha
description: How to make seed.ts content changes actually appear in the DB.
---

`seedIfEmpty()` (api-server, runs on boot from index.ts) short-circuits when the
`topics` table already has rows. Editing the TOPICS/ASSIGNMENTS arrays in
`artifacts/api-server/src/lib/seed.ts` therefore has NO visible effect until the
course tables are wiped.

**To apply content changes:** TRUNCATE the course tables then restart the api-server
workflow (it re-seeds on boot):
`TRUNCATE TABLE answers, attempts, problems, assignments, lectures, practice_attempts, practice_problems, practice_sessions, topics RESTART IDENTITY CASCADE;`

**Why:** the seed is idempotent-by-skip, not idempotent-by-upsert. `assignments` has
no FK to `topics`, so truncating only `topics` leaves stale assignments — truncate
both root tables (plus dependents) together.

**How to apply:** any time lecture or assignment content in seed.ts changes and you
need it reflected in the running app or before a screenshot/QC check.
