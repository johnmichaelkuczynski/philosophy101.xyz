---
name: Per-topic practice question grounding
description: Why per-topic practice questions must be grounded in real content, not just the topic title.
---

The per-topic practice generator (the adaptive drill at `/practice/sessions/:id/next`) must build each question from real content, NOT from the topic title alone.

**Why:** Generating from the bare title produced shallow, ambiguous, anti-philosophical prompts — jargon-labeling ("which fallacy is this?", "name the term"), one-word/yes-no answers, and vague interpretive guessing. A philosophy-purist user rejected both the vague-interpretive style AND the shallow jargon-labeling style. He wants questions that make the student DO the discipline: argue a position, mount the strongest objection, draw a distinction and say why it matters — graded on reasoning quality against a multi-sentence model answer.

**How to apply:**
- Ground generation in two sources: the topic's own lecture body, and the relevant slice of the user-supplied source corpus retrieved via the corpus retrieval lib. Inject both as a GROUNDING block and instruct the model to engage the specific arguments/distinctions/examples in that text.
- Keep an explicit BANNED list in the prompt (jargon-labeling, one-word/yes-no/valid-invalid, vague "what is X primarily doing"). Require a several-sentence model answer.
- The grader already handles this — `gradeAnswer` does an exact-match shortcut then semantic LLM grading against the model answer; the answer UI is a full textarea. No grader change is needed for prose answers.
- The corpus is bundled into the api-server via an esbuild `.txt` text `loader` in build.mjs + an ambient `*.txt` type decl. Retrieval parses numbered sections once (cached), scores by keyword overlap, and returns "" below a relevance threshold so unrelated topics (e.g. ethics) get no spurious analytic-philosophy text injected.
