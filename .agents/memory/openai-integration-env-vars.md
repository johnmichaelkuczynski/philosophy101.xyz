---
name: OpenAI integration env var names
description: The custom env var names this repo's OpenAI client lib expects from setupReplitAIIntegrations
---

The OpenAI client lib in `lib/integrations-openai-ai-server` reads **custom** env var names, not the defaults.

**Rule:** When calling `setupReplitAIIntegrations`, pass `providerApiKeyEnvVarName="OPENAI_API_KEY"` and `providerUrlEnvVarName="OPENAI_BASE_URL"` — these are the names the lib's client.ts reads.

**Why:** The lib does not use the integration's default env var names; mismatched names make every OpenAI call fail at runtime even though setup "succeeds".

**How to apply:** If AI features (tutor, grading, practice gen, diagnostics) fail with auth/connection errors after restoring the integration, verify these two env var names match what client.ts expects. Do NOT modify `lib/integrations-openai-ai-server/src/client.ts`.
