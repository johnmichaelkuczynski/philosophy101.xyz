---
name: Question design — application over recall
description: The non-negotiable shape every question in the course must take, and where it is enforced.
---

Every question surfaced anywhere in the course — tutor starter questions,
per-topic practice drills, practice-assignment problems, and the graded seed
assignments — must:
1. present a SPECIFIC, CONCRETE, NOVEL scenario/case (an argument, a claim
   someone makes, a situation);
2. test APPLICATION of a principle to that scenario (evaluate / diagnose /
   decide / defend / construct);
3. NEVER ask for a definition ("what is X", "explain the concept of X",
   "difference between X and Y" as the task);
4. be TEXT-INDEPENDENT — invent fresh scenarios, never cite a lecture's own
   examples (e.g. "the rabbit"); answerable by anyone who understands the
   principle;
5. be graded on reasoning/application quality.

**Why:** the user considers definition-recall and example-citing questions
worthless ("shit") and explicitly demanded the question content be rebuilt to
test understanding-in-use, not memory.

**How to apply:** the canonical rules live in `lib/questionDesign.ts`
(`questionDesignBlock()`) and MUST be imported by every generator prompt rather
than re-stated, so all generators stay in lock-step. Generators use the
lecture/corpus only to pick the concept/skill, never to reuse its examples.
The graded seed problems are stored pre-transformed in
`src/content/graded-assignments.json` (imported by seed.ts) — if you ever
regenerate them, keep them in this same shape. When in doubt, a definition
question is a bug.
