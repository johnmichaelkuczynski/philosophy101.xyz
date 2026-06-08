---
name: Demo video answer scripts
description: Why philosophy-101-demo scenes can show contradictory Q&A after a content swap
---

The philosophy-101-demo scenes (e.g. Scene5.tsx) animate a fake student typing an answer.
The typed text is built up across a chain of `setTimeout` calls that call `setTypedAnswer(...)`,
and is **separate** from the displayed question prompt and the "Correct!" explanation text.

**Why:** During a course content conversion it's easy to update the visible question/feedback
JSX but miss the typed-answer timer script (and the sidebar monogram in VideoTemplate.tsx),
producing a demo where the student types an answer that doesn't match the question shown.

**How to apply:** When rebranding/reskinning the demo video, grep each Scene for
`setTypedAnswer` and reconcile the full typed string with the on-screen question and the
graded explanation. Also check VideoTemplate.tsx for the hardcoded monogram.
