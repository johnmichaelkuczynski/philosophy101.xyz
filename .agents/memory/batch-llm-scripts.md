---
name: Running long LLM batch jobs in this environment
description: How to run multi-minute, many-call LLM scripts (e.g. bulk content transforms) without losing work.
---

Long-running Node processes started in the background from the shell (`nohup … &`)
get killed before they finish in this environment, and `pgrep -f <script>` will
falsely report "alive" because it matches your own shell command containing the
script name — confirm liveness with `ps -eo pid,etimes,cmd | rg <script>` instead.

**Rule:** make any multi-minute batch job (e.g. transforming N items via N LLM
calls) **resumable + incremental** and run it in the **foreground**:
- write output to disk after EACH unit of work, and on startup skip units already
  present in the output file (keyed by a stable id/title);
- run it foreground in repeated ~120s windows; each run resumes where the last
  was killed.

**Why:** background jobs are reaped and foreground bash calls cap at 120s, so a
60-call job spanning several minutes cannot complete in one shot or survive
backgrounding. Resumable+incremental is the only reliable pattern.

**How to apply:** one-off content generation/transform scripts for an artifact.
To run a TS script that imports workspace packages, bundle it with the artifact's
esbuild first (JSON loader + a `createRequire` banner), then `node` the bundle;
set `NODE_ENV=production` so pino doesn't spawn its pretty-print worker thread.
The OpenAI integration only needs `OPENAI_API_KEY`/`OPENAI_BASE_URL` from env,
which are present in the shell, so no server/route is required.

**Reasoning-model gotcha:** the chat model here (gpt-5.x family) is a reasoning
model — a SINGLE dense generation call can exceed the 120s bash cap on its own,
so the whole window gets SIGKILLed and nothing writes. Two fixes, both needed:
- pass `reasoning_effort: "low"` on generation calls (cuts server-side latency a
  lot; quality stays fine for lecture/problem writing);
- keep CONCURRENCY low (~2). With concurrency 4 a slow wave can have all 4 calls
  in-flight at the 120s kill and lose the entire window's work; at 2 each pair
  reliably finishes and writes within the window. Resumability then makes the
  job converge over ~8-12 windows.
