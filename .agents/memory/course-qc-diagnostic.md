---
name: Course answer-key QC diagnostic
description: How the OpenAI answer-key quality-control diagnostic must judge keys for a course grounded in a specific source text
---

# Answer-key quality-control diagnostic — grounding rule

**Rule:** An LLM-based answer-key QC/legitimacy check for this course MUST judge each key against the course's own lecture content (join `problemsTable.topicId` → `lecturesTable.body`), not against the model's generic/mainstream knowledge.

**Why:** The curriculum is grounded in a specific source text ("Some Fundamental Principles Relating to Ethics") whose framework and terminology diverge from mainstream philosophy. Judged against generic knowledge, correct course-specific keys get false-flagged at high confidence — e.g. the text defines the "two kinds of intrinsic goods" as *commendable vs. not commendable* (mainstream would say subjective vs. objective), and teaches that freeing slaves pre-Civil-War was *moral* (so "was it immoral?" → key "no" is correct, but a polarity-confused model flags it).

**How to apply:**
- Feed the relevant lecture body into BOTH the blind re-derivation phase and the judging phase, and instruct the model to use the lecture's definitions/terminology, not outside theory.
- Keep the QC rubric aligned with the grader's semantic-equivalence philosophy (accept any correct on-topic short answer; flag only genuinely defective keys). An over-strict rubric ("ambiguous or only partially correct") causes nondeterministic false flags on sound short-answer keys — do NOT respond by whack-a-mole editing the keys.
- Two-phase design (blind re-derive, then judge) is intentional: it stops the judge from rubber-stamping the key. Watch yes/no and negated prompts for polarity errors.
