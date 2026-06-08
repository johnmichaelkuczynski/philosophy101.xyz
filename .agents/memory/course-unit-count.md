---
name: Course unit count is hardcoded in several places
description: Changing the number of units/weeks requires edits in multiple non-obvious spots, not just the seed data.
---

The number of units ("weeks") is NOT derived from the data — it is hardcoded in several places. Changing it (e.g. 4 → 5 units) requires updating ALL of:

- `artifacts/api-server/src/routes/course.ts` — `WEEK_TITLES` map (per-unit title + summary), the `/course/overview` loop (`[1,2,3,4,...]` array passed to `buildWeek`), and the `/course/weeks/:weekNumber` range guard (`weekNumber > N`).
- `lib/api-spec/openapi.yaml` — the `/course/weeks/{weekNumber}` path param `maximum`. After editing, run `pnpm --filter @workspace/api-spec run codegen` so `getWeekPathWeekNumberMax` in the generated zod updates.
- `artifacts/philosophy-101/src/pages/Landing.tsx` — the static `units` array + any "N-unit" marketing copy.
- `artifacts/philosophy-101/src/pages/Dashboard.tsx` — the loading-skeleton count `Array.from({ length: N })`.
- Demo video (`artifacts/philosophy-101-demo/src/components/video/video_scenes/Scene1/Scene2`) — static unit cards/narration, if keeping the demo consistent.

**Why:** unit titles and counts are presentation metadata kept out of the topics/lectures tables, so the DB seed alone does not change the visible structure; missing one of these silently drops a whole unit (e.g. the overview loop only iterating 1–4 hid Unit 5's 9 lectures even though `/course/topics` returned all of them).

**How to apply:** any time the curriculum's unit/week count changes, grep for the old count and the hardcoded `[1, 2, 3, 4` loop, and re-run codegen after the openapi edit.
