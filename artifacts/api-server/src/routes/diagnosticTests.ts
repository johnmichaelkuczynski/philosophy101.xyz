import { Router, type IRouter } from "express";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  lecturesTable,
  diagnosticRunsTable,
  diagnosticQuestionsTable,
  diagnosticAnswersTable,
} from "@workspace/db";
import {
  StartDiagnosticTestBody,
  StartDiagnosticTestResponse,
  SubmitDiagnosticTestBody,
  SubmitDiagnosticTestResponse,
  ListDiagnosticTestsResponse,
} from "@workspace/api-zod";
import { chatJson } from "../lib/ai";
import { gradeAnswerRich } from "../lib/grading";
import { findRelevantMaterial } from "../lib/sourceMaterial";
import { questionDesignBlock } from "../lib/questionDesign";

const router: IRouter = Router();

type Scope = "pre_course" | "week" | "final";

const UNIT_TITLES: Record<number, string> = {
  1: "Language, Logic, and Analysis",
  2: "Knowledge and Epistemology",
  3: "Mind, Freedom, and Metaphysics",
  4: "Ethics, Value, and Law",
};

const PRE_COUNT = 6;
const WEEK_COUNT = 6;
const FINAL_PER_UNIT = 2; // 4 units × 2 = 8 questions on the comprehensive final

const PRE_FRAMING =
  "These questions test GENERAL philosophical acumen — the kind of careful reasoning, argument analysis, and conceptual distinction-drawing a thoughtful newcomer could attempt BEFORE taking the course. Do NOT assume any specific course content, terminology, named theories, or readings. Favor everyday scenarios that reward clear thinking about arguments, evidence, definitions, ambiguity, and values.";

type CatalogEntry = {
  scope: Scope;
  weekNumber: number | null;
  title: string;
  description: string;
  count: number;
};

const CATALOG: CatalogEntry[] = [
  {
    scope: "pre_course",
    weekNumber: null,
    title: "Course Readiness Diagnostic",
    description:
      "A no-stakes warm-up that gauges your general philosophical reasoning before you begin — no course material required.",
    count: PRE_COUNT,
  },
  ...[1, 2, 3, 4].map<CatalogEntry>((n) => ({
    scope: "week",
    weekNumber: n,
    title: `Unit ${n} Diagnostic`,
    description: `Check your grasp of Unit ${n}: ${UNIT_TITLES[n]}.`,
    count: WEEK_COUNT,
  })),
  {
    scope: "final",
    weekNumber: null,
    title: "Comprehensive Final Diagnostic",
    description:
      "A whole-course self-check spanning all four units — see where you stand before the real thing.",
    count: FINAL_PER_UNIT * 4,
  },
];

function catalogEntry(scope: Scope, weekNumber: number | null): CatalogEntry {
  const match = CATALOG.find(
    (c) => c.scope === scope && (scope !== "week" || c.weekNumber === weekNumber),
  );
  return (
    match ?? {
      scope,
      weekNumber,
      title: "Diagnostic",
      description: "",
      count: WEEK_COUNT,
    }
  );
}

function parseIdParam(raw: unknown): number {
  const s = Array.isArray(raw) ? raw[0] : (raw as string);
  return parseInt(s ?? "", 10);
}

type GenQ = { prompt: string; correctAnswer: string; explanation: string };

// Build the grounding block for a unit from its own lectures plus the source
// corpus. Used ONLY to fix which concepts to test — never to be quoted.
async function unitConceptBlock(weekNumber: number): Promise<string> {
  const lecs = await db
    .select({ title: lecturesTable.title, body: lecturesTable.body })
    .from(lecturesTable)
    .where(eq(lecturesTable.weekNumber, weekNumber))
    .orderBy(asc(lecturesTable.id));
  const excerpt = lecs
    .map((l) => `## ${l.title}\n${(l.body ?? "").slice(0, 900)}`)
    .join("\n\n")
    .slice(0, 6000);
  const source = findRelevantMaterial(`${UNIT_TITLES[weekNumber] ?? ""}\n${excerpt}`);
  return [
    source
      ? `REFERENCE (use this ONLY to understand the concepts/principles at stake — do NOT reuse its wording, examples, names, or cases):\n${source}`
      : "",
    excerpt
      ? `WHAT THIS UNIT TEACHES (for your understanding only — never quote or reference it in a question):\n${excerpt}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// The prompts from the most recent prior runs of the same diagnostic, so a fresh
// run can be explicitly told not to repeat them.
async function priorPrompts(
  scope: Scope,
  weekNumber: number | null,
): Promise<string[]> {
  const cond =
    scope === "week" && weekNumber != null
      ? and(
          eq(diagnosticRunsTable.scope, "week"),
          eq(diagnosticRunsTable.weekNumber, weekNumber),
        )
      : eq(diagnosticRunsTable.scope, scope);
  const runs = await db
    .select({ id: diagnosticRunsTable.id })
    .from(diagnosticRunsTable)
    .where(cond)
    .orderBy(desc(diagnosticRunsTable.id))
    .limit(2);
  if (runs.length === 0) return [];
  const qs = await db
    .select({ prompt: diagnosticQuestionsTable.prompt })
    .from(diagnosticQuestionsTable)
    .where(
      inArray(
        diagnosticQuestionsTable.runId,
        runs.map((r) => r.id),
      ),
    );
  return qs.map((q) => q.prompt).slice(0, 16);
}

// Two prompts count as "the same question" when their normalized word sets
// overlap heavily — this catches both verbatim repeats and light rewordings.
function normWords(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 0),
  );
}

function isDuplicatePrompt(a: string, b: string): boolean {
  const wa = normWords(a);
  const wb = normWords(b);
  if (wa.size === 0 || wb.size === 0) return false;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  const union = wa.size + wb.size - inter;
  return union > 0 && inter / union >= 0.85;
}

const MAX_GEN_ATTEMPTS = 3;

// Generates `count` questions that are NOVEL — none duplicate `avoidPrompts`
// (the previous runs' questions) or each other. Retries the shortfall, feeding
// already-accepted prompts back in as additional "do not reuse" instructions,
// so freshness is enforced server-side rather than merely requested of the model.
async function generateFreshSet(opts: {
  count: number;
  framing: string;
  conceptBlock: string;
  avoidPrompts: string[];
}): Promise<GenQ[]> {
  const { count, framing, conceptBlock, avoidPrompts } = opts;
  const accepted: GenQ[] = [];
  for (let attempt = 0; attempt < MAX_GEN_ATTEMPTS && accepted.length < count; attempt++) {
    const need = count - accepted.length;
    const avoid = [...avoidPrompts, ...accepted.map((q) => q.prompt)];
    const batch = await generateDiagnosticQuestions({
      count: need,
      framing,
      conceptBlock,
      avoidPrompts: avoid,
    });
    for (const q of batch) {
      if (accepted.length >= count) break;
      const dup =
        avoid.some((p) => isDuplicatePrompt(p, q.prompt)) ||
        accepted.some((a) => isDuplicatePrompt(a.prompt, q.prompt));
      if (!dup) accepted.push(q);
    }
  }
  return accepted.slice(0, count);
}

async function generateDiagnosticQuestions(opts: {
  count: number;
  framing: string;
  conceptBlock: string;
  avoidPrompts: string[];
}): Promise<GenQ[]> {
  const { count, framing, conceptBlock, avoidPrompts } = opts;
  const system = [
    `You are a college Philosophy 101 instructor writing a DIAGNOSTIC comprehension check (ungraded, low-stakes — its ONLY purpose is to reveal how well the student understands the material, not to punish). Write EXACTLY ${count} DISTINCT questions, each targeting a different idea.`,
    "",
    framing,
    "",
    questionDesignBlock(),
    "",
    conceptBlock
      ? "Use the reference material below ONLY to fix the concepts/skills to test, then invent your OWN concrete scenarios. Never quote, name, or reuse any example from the reference."
      : "",
    conceptBlock,
    "",
    'For EACH question provide: "prompt" (the self-contained scenario plus the task), "correctAnswer" (a MODEL ANSWER of several full sentences describing what a strong response must establish and the reasoning behind it — not a single phrase), and "explanation" (1-2 sentences naming the key reasoning move a good answer must make).',
    avoidPrompts.length
      ? `FRESHNESS REQUIREMENT — do NOT reuse or lightly reword any of these previously-asked prompts; invent brand-new scenarios on different sub-points:\n${JSON.stringify(
          avoidPrompts,
        )}`
      : "",
    `Respond as strict JSON: {"questions": [{"prompt": string, "correctAnswer": string, "explanation": string}]}.`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const out = await chatJson<{ questions: GenQ[] }>(
    system,
    `Generate ${count} fresh diagnostic questions now.`,
  );
  const raw = Array.isArray(out.questions) ? out.questions : [];
  return raw
    .filter(
      (q) =>
        q &&
        typeof q.prompt === "string" &&
        q.prompt.trim() &&
        typeof q.correctAnswer === "string" &&
        q.correctAnswer.trim(),
    )
    .map((q) => ({
      prompt: q.prompt.trim(),
      correctAnswer: q.correctAnswer.trim(),
      explanation:
        (typeof q.explanation === "string" ? q.explanation.trim() : "") ||
        "A strong answer applies the relevant principle to the specific case.",
    }))
    .slice(0, count);
}

// ---------- List the six diagnostics + their most recent run ----------
router.get("/diagnostic-tests", async (_req, res): Promise<void> => {
  const tests = await Promise.all(
    CATALOG.map(async (entry) => {
      const cond =
        entry.scope === "week" && entry.weekNumber != null
          ? and(
              eq(diagnosticRunsTable.scope, "week"),
              eq(diagnosticRunsTable.weekNumber, entry.weekNumber),
            )
          : eq(diagnosticRunsTable.scope, entry.scope);
      const [last] = await db
        .select()
        .from(diagnosticRunsTable)
        .where(and(cond, eq(diagnosticRunsTable.status, "completed")))
        .orderBy(desc(diagnosticRunsTable.id))
        .limit(1);
      return {
        scope: entry.scope,
        weekNumber: entry.weekNumber,
        title: entry.title,
        description: entry.description,
        questionCount: entry.count,
        lastRun: last
          ? {
              runId: last.id,
              scorePercent: last.scorePercent ?? 0,
              correctCount: last.correctCount ?? 0,
              totalCount: last.totalCount ?? 0,
              takenAt: (last.completedAt ?? last.createdAt).toISOString(),
            }
          : null,
      };
    }),
  );
  res.json(ListDiagnosticTestsResponse.parse({ tests }));
});

// ---------- Start a fresh diagnostic (never repeats the previous run) ----------
router.post("/diagnostic-tests/start", async (req, res): Promise<void> => {
  const parsed = StartDiagnosticTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const scope = parsed.data.scope as Scope;
  let weekNumber: number | null = null;
  if (scope === "week") {
    const wn = parsed.data.weekNumber;
    if (wn == null || wn < 1 || wn > 4) {
      res.status(400).json({ error: "weekNumber (1-4) is required for week scope" });
      return;
    }
    weekNumber = wn;
  }
  res.setTimeout(5 * 60 * 1000);

  const entry = catalogEntry(scope, weekNumber);
  const expectedCount = entry.count;
  const avoid = await priorPrompts(scope, weekNumber);

  let questions: GenQ[] = [];
  try {
    if (scope === "final") {
      const perUnit = await Promise.all(
        [1, 2, 3, 4].map(async (n) => {
          const conceptBlock = await unitConceptBlock(n);
          return generateFreshSet({
            count: FINAL_PER_UNIT,
            framing: `This is part of a COMPREHENSIVE final diagnostic spanning the whole course. These questions check comprehension of Unit ${n}: ${UNIT_TITLES[n]}.`,
            conceptBlock,
            avoidPrompts: avoid,
          });
        }),
      );
      // Dedupe across units too, so the assembled final never repeats itself.
      const merged: GenQ[] = [];
      for (const q of perUnit.flat()) {
        if (!merged.some((m) => isDuplicatePrompt(m.prompt, q.prompt))) merged.push(q);
      }
      questions = merged;
    } else if (scope === "week" && weekNumber != null) {
      const conceptBlock = await unitConceptBlock(weekNumber);
      questions = await generateFreshSet({
        count: WEEK_COUNT,
        framing: `These questions check comprehension of Unit ${weekNumber}: ${UNIT_TITLES[weekNumber]}. Spread them across the different ideas taught in this unit.`,
        conceptBlock,
        avoidPrompts: avoid,
      });
    } else {
      questions = await generateFreshSet({
        count: PRE_COUNT,
        framing: PRE_FRAMING,
        conceptBlock: "",
        avoidPrompts: avoid,
      });
    }
  } catch {
    questions = [];
  }

  // Enforce the catalog's exact question count — never persist a partial run.
  if (questions.length < expectedCount) {
    res.status(502).json({
      error: "Could not generate a complete fresh diagnostic just now. Please try again.",
    });
    return;
  }
  questions = questions.slice(0, expectedCount);

  const [run] = await db
    .insert(diagnosticRunsTable)
    .values({
      scope,
      weekNumber,
      title: entry.title,
      status: "in_progress",
      totalCount: questions.length,
    })
    .returning();
  if (!run) {
    res.status(500).json({ error: "failed to create run" });
    return;
  }

  const inserted = await db
    .insert(diagnosticQuestionsTable)
    .values(
      questions.map((q, i) => ({
        runId: run.id,
        position: i + 1,
        prompt: q.prompt,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    )
    .returning();

  res.json(
    StartDiagnosticTestResponse.parse({
      runId: run.id,
      scope,
      weekNumber,
      title: entry.title,
      questions: inserted
        .sort((a, b) => a.position - b.position)
        .map((q) => ({ id: q.id, position: q.position, prompt: q.prompt })),
    }),
  );
});

// ---------- Submit for ungraded feedback (no penalty, no AI detection) ----------
router.post("/diagnostic-tests/:runId/submit", async (req, res): Promise<void> => {
  const runId = parseIdParam(req.params.runId);
  const parsed = SubmitDiagnosticTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.setTimeout(5 * 60 * 1000);

  const [run] = await db
    .select()
    .from(diagnosticRunsTable)
    .where(eq(diagnosticRunsTable.id, runId));
  if (!run) {
    res.status(404).json({ error: "diagnostic run not found" });
    return;
  }
  const questions = await db
    .select()
    .from(diagnosticQuestionsTable)
    .where(eq(diagnosticQuestionsTable.runId, runId))
    .orderBy(asc(diagnosticQuestionsTable.position));
  if (questions.length === 0) {
    res.status(409).json({ error: "run has no questions" });
    return;
  }

  // Idempotent: a completed run returns its stored results instead of regrading.
  if (run.status === "completed") {
    const stored = await db
      .select()
      .from(diagnosticAnswersTable)
      .where(eq(diagnosticAnswersTable.runId, runId));
    const byQ = new Map(stored.map((a) => [a.questionId, a]));
    res.json(
      SubmitDiagnosticTestResponse.parse({
        runId,
        scorePercent: run.scorePercent ?? 0,
        correctCount: run.correctCount ?? 0,
        totalCount: run.totalCount ?? questions.length,
        results: questions.map((q) => ({
          questionId: q.id,
          prompt: q.prompt,
          correct: byQ.get(q.id)?.correct ?? false,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          feedback: byQ.get(q.id)?.feedback ?? "",
        })),
      }),
    );
    return;
  }

  const ansByQ = new Map(
    parsed.data.answers.map((a) => [a.questionId, String(a.answer ?? "")]),
  );
  const graded = await Promise.all(
    questions.map(async (q) => {
      const userAnswer = ansByQ.get(q.id) ?? "";
      const g = await gradeAnswerRich({
        prompt: q.prompt,
        correctAnswer: q.correctAnswer,
        userAnswer,
      });
      return { q, userAnswer, correct: g.correct, feedback: g.feedback };
    }),
  );

  await db
    .insert(diagnosticAnswersTable)
    .values(
      graded.map((r) => ({
        runId,
        questionId: r.q.id,
        answer: r.userAnswer,
        correct: r.correct,
        feedback: r.feedback,
      })),
    )
    // A concurrent/duplicate submit can't create duplicate answer rows.
    .onConflictDoNothing({
      target: [diagnosticAnswersTable.runId, diagnosticAnswersTable.questionId],
    });

  const correctCount = graded.filter((r) => r.correct).length;
  const totalCount = questions.length;
  const scorePercent = totalCount ? (correctCount / totalCount) * 100 : 0;
  await db
    .update(diagnosticRunsTable)
    .set({
      status: "completed",
      scorePercent,
      correctCount,
      totalCount,
      completedAt: new Date(),
    })
    .where(eq(diagnosticRunsTable.id, runId));

  res.json(
    SubmitDiagnosticTestResponse.parse({
      runId,
      scorePercent,
      correctCount,
      totalCount,
      results: graded.map((r) => ({
        questionId: r.q.id,
        prompt: r.q.prompt,
        correct: r.correct,
        correctAnswer: r.q.correctAnswer,
        explanation: r.q.explanation,
        feedback: r.feedback,
      })),
    }),
  );
});

export default router;
