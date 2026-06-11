---
name: Student diagnostics (fresh comprehension tests)
description: Design constraints for the student-facing Diagnostics feature — a third mode alongside practice and graded.
---

# Student diagnostics — a third assessment mode

The course has THREE assessment modes, not two. Beyond practice (no detection, tutor on) and graded (detection on, tutor off), there is **Diagnostics**: ungraded, no penalty, **no AI detection**, and **regenerated fresh every time**. Six fixed diagnostics — 1 pre_course (general acumen, no course grounding), 1 per unit 1–4 (grounded in that unit's lectures + source corpus), 1 comprehensive final (2 questions per unit × 4 = 8).

**Why:** It's a self-check for the student only. Adding detection or persistence-of-questions would defeat its purpose (a low-pressure, repeatable gauge). The user's hard requirement was "must NOT repeat the previous run's questions."

**How to apply:**
- Freshness is enforced **server-side**, not just prompted: generate, then dedupe candidates (word-set Jaccard ≥ 0.85 catches verbatim + light rewordings) against the last ~2 runs' prompts AND against each other, with bounded retries feeding accepted prompts back as additional "do not reuse" instructions. Merely instructing the LLM is insufficient.
- Enforce the catalog's **exact** question count; never persist a partial run (return 502 instead).
- Submit grades with the warm `gradeAnswerRich` helper only — never wire the detection pipeline into this path.
- Submit is idempotent: completed runs replay stored results; a unique index on `diagnostic_answers(run_id, question_id)` + `onConflictDoNothing` blocks duplicate rows.

**Naming split (easy to confuse):** the *student* feature owns "Diagnostics" at `/diagnostics`. The pre-existing *operator* self-test page was renamed to "System Check" at `/system-check` (its backend endpoints stay at `/api/diagnostics/*`).
