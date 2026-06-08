---
name: Practice vs graded assignment asymmetry
description: Intentional design differences between practice-assignment mode and graded attempts in Philosophy 101.
---

Practice assignments (the unlimited, AI-generated parallel versions of each homework/test/midterm/final) are intentionally asymmetric to graded attempts:

- **No AI-authorship detection on practice submits.** The practice submit path grades only (gradeAnswerRich) and never calls `detect()`. Graded attempts DO run detection.
- **Live tutor is on-screen ONLY during practice**, never during a graded attempt.
- Each "generate practice" call mints a brand-new instance + freshly AI-generated problems — practice is unlimited by design; do not cache/reuse one instance.

**Why:** Practice is no-stakes learning; surveillance + answer-hiding belong only to graded work. A future change that "adds detection to practice for consistency" or "shows the tutor in graded mode" would break the product's core promise.

**How to apply:** Keep the practice routes detection-free and tutor-enabled; keep graded routes detection-on and tutor-off.
