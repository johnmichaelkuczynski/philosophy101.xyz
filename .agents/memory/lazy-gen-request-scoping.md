---
name: Lazy on-demand generation must be request-scoped to the view
description: Why async generate-and-persist responses (e.g. lecture depth expansion) must be ignored when the user navigated away
---

When a page lazily generates+persists content on open (e.g. LectureView prefetching
medium/long lecture depths via the expand endpoint) and writes the result into shared
local component state, a late response from a previous item can bleed into the new item.

**Rule:** Capture the entity id at call time and guard every setState in `.then/.catch/.finally`
with a `currentRef.current === capturedId` check; reset `currentRef` in the per-entity reset effect.

**Why:** Resetting state on navigation is not enough — an in-flight promise from item A
resolves after switching to B and overwrites B's state (showing A's content, or marking
unavailable depths as available). Architect flagged this as a severe cross-lecture bleed.

**How to apply:** Any "generate on view, store in component state" flow where the user can
navigate between sibling items faster than generation completes.
