import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  topicsTable,
  lecturesTable,
  practiceSessionsTable,
  practiceProblemsTable,
  practiceAttemptsTable,
} from "@workspace/db";
import {
  StartPracticeSessionBody,
  StartPracticeSessionResponse,
  NextPracticeProblemBody,
  NextPracticeProblemResponse,
  GradePracticeAnswerBody,
  GradePracticeAnswerResponse,
} from "@workspace/api-zod";
import { chatJson } from "../lib/ai";
import { gradeAnswer } from "../lib/grading";
import { findRelevantMaterial } from "../lib/sourceMaterial";

const router: IRouter = Router();

function parseIdParam(raw: unknown): number {
  const s = Array.isArray(raw) ? raw[0] : (raw as string);
  return parseInt(s ?? "", 10);
}

async function pickTopicId(
  weekNumber: number | null | undefined,
  preferred: number | null | undefined,
  focusOnWeaknesses: boolean,
): Promise<{ id: number; title: string; weekNumber: number }> {
  if (preferred != null) {
    const [t] = await db.select().from(topicsTable).where(eq(topicsTable.id, preferred));
    if (t) return { id: t.id, title: t.title, weekNumber: t.weekNumber };
  }
  const candidates = weekNumber
    ? await db.select().from(topicsTable).where(eq(topicsTable.weekNumber, weekNumber))
    : await db.select().from(topicsTable);

  if (focusOnWeaknesses) {
    const stats = await db.execute(sql`
      select topic_id, count(*)::int as n, avg(case when correct then 1.0 else 0.0 end) as acc
      from practice_attempts group by topic_id
    `);
    const byId = new Map<number, { n: number; acc: number }>();
    for (const r of stats.rows as Array<{ topic_id: number; n: number; acc: number }>) {
      byId.set(Number(r.topic_id), { n: Number(r.n), acc: Number(r.acc) });
    }
    // weight = (1 - accuracy) + small bonus for low-attempted topics
    const scored = candidates.map((t) => {
      const s = byId.get(t.id);
      const acc = s?.acc ?? 0.5;
      const n = s?.n ?? 0;
      const weight = (1 - acc) * 2 + (n < 3 ? 1 : 0) + Math.random() * 0.3;
      return { t, weight };
    });
    scored.sort((a, b) => b.weight - a.weight);
    const choice = scored[0]?.t ?? candidates[Math.floor(Math.random() * candidates.length)]!;
    return { id: choice.id, title: choice.title, weekNumber: choice.weekNumber };
  }
  const choice = candidates[Math.floor(Math.random() * candidates.length)]!;
  return { id: choice.id, title: choice.title, weekNumber: choice.weekNumber };
}

router.post("/practice/sessions", async (req, res): Promise<void> => {
  const parsed = StartPracticeSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { weekNumber, topicId, tutorEnabled, focusOnWeaknesses, initialDifficulty } =
    parsed.data;
  const startDifficulty =
    typeof initialDifficulty === "number" && !Number.isNaN(initialDifficulty)
      ? Math.max(1, Math.min(5, initialDifficulty))
      : 2.0;
  const [created] = await db
    .insert(practiceSessionsTable)
    .values({
      weekNumber: weekNumber ?? null,
      topicId: topicId ?? null,
      tutorEnabled,
      focusOnWeaknesses: focusOnWeaknesses ?? true,
      difficulty: startDifficulty,
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "failed" });
    return;
  }
  res.json(
    StartPracticeSessionResponse.parse({
      id: created.id,
      tutorEnabled: created.tutorEnabled,
      difficulty: created.difficulty,
      weekNumber: created.weekNumber,
      topicId: created.topicId,
      focusOnWeaknesses: created.focusOnWeaknesses,
    }),
  );
});

router.post("/practice/sessions/:sessionId/next", async (req, res): Promise<void> => {
  const sessionId = parseIdParam(req.params.sessionId);
  const parsed = NextPracticeProblemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db
    .select()
    .from(practiceSessionsTable)
    .where(eq(practiceSessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "session not found" });
    return;
  }

  const topic = await pickTopicId(
    session.weekNumber,
    parsed.data.topicId ?? session.topicId,
    session.focusOnWeaknesses,
  );

  const lastProblems = await db
    .select({ prompt: practiceProblemsTable.prompt })
    .from(practiceProblemsTable)
    .where(
      and(
        eq(practiceProblemsTable.sessionId, sessionId),
        eq(practiceProblemsTable.topicId, topic.id),
      ),
    )
    .orderBy(desc(practiceProblemsTable.id))
    .limit(3);

  const difficulty = Math.max(1, Math.min(5, session.difficulty));
  const difficultyLabel =
    difficulty <= 1.7
      ? "very easy"
      : difficulty <= 2.5
      ? "easy"
      : difficulty <= 3.3
      ? "medium"
      : difficulty <= 4.1
      ? "hard"
      : "challenging";

  // Ground the question in substantive content: the topic's lecture and, when
  // relevant, the analytic-philosophy source corpus. Questions generated from a
  // bare topic title come out shallow and jargon-y — grounding fixes that.
  const [lec] = await db
    .select({ body: lecturesTable.body })
    .from(lecturesTable)
    .where(eq(lecturesTable.topicId, topic.id))
    .limit(1);
  const lectureExcerpt = (lec?.body ?? "").slice(0, 1800).trim();
  const sourceExcerpt = findRelevantMaterial(`${topic.title}\n${lectureExcerpt}`);

  const groundingBlock = [
    sourceExcerpt
      ? `SOURCE MATERIAL (authoritative — base the question on the SPECIFIC arguments, distinctions, examples, and moves in this text, not on generic knowledge):\n${sourceExcerpt}`
      : "",
    lectureExcerpt
      ? `LECTURE CONTEXT (the student has been reading this):\n${lectureExcerpt}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const userRequest = parsed.data.request?.trim() || "";
  let generated: { prompt: string; correctAnswer: string; explanation: string };
  try {
    generated = await chatJson<{
      prompt: string;
      correctAnswer: string;
      explanation: string;
    }>(
      [
        `You are a college Philosophy 101 instructor writing ONE substantive practice question on the topic "${topic.title}" at difficulty "${difficultyLabel}" (${difficulty.toFixed(
          1,
        )}/5).`,
        "",
        "GOAL: The question must make the student DO PHILOSOPHY — reason, argue, draw a distinction and explain why it matters, evaluate a position, or apply a concept to a fresh case and defend that application. It is graded on the QUALITY OF REASONING in a few sentences of prose, not on recall.",
        "",
        groundingBlock
          ? "GROUNDING: Build the question around the actual ideas in the material below. Engage a real argument, distinction, example, or move it contains — do not write a generic question that ignores it."
          : "",
        groundingBlock,
        groundingBlock ? "" : "",
        "BANNED — these are anti-philosophical and you must NOT write them:",
        "- Jargon-labeling / naming: 'which fallacy is this?', 'name the fallacy', 'what is the technical term for...'. Asking a student to slap a label on something is recall, not philosophy.",
        "- One-word / yes-no / valid-invalid / fill-in-the-term answers.",
        "- Vague interpretive guessing: 'what is this person primarily/mainly doing?', 'what best describes...'.",
        "- Anything whose answer is just a definition recited from a textbook.",
        "",
        "WRITE INSTEAD a question that demands genuine philosophical work, e.g.:",
        "- Pose a concrete case and ask the student to argue for a position on it and give the reason that does the work.",
        "- Give a claim or argument and ask the student to mount the STRONGEST objection to it, then say how a defender might reply.",
        "- Ask the student to draw a distinction between two concepts AND explain, with an example, why the distinction matters philosophically.",
        "- Ask whether a proposed analysis/principle succeeds, and to defend the verdict with a reason or counterexample of the student's own.",
        "",
        "The question must be self-contained: state any argument, case, or claim it refers to in full so the student can answer without the source in front of them. There can be more than one defensible answer; what is graded is whether the student reasons well and engages the core issue.",
        "",
        'Provide a MODEL ANSWER of several full sentences ("correctAnswer") that lays out what a strong response must establish and the reasoning behind it — not a single phrase. The "explanation" is a 1-2 sentence note on the key move a good answer must make.',
        `Respond as strict JSON: {"prompt": string, "correctAnswer": string, "explanation": string}.`,
        `Do not repeat any of these recent prompts: ${JSON.stringify(lastProblems.map((p) => p.prompt))}.`,
      ]
        .filter((line) => line !== "")
        .join("\n"),
      userRequest || `Generate a new ${difficultyLabel} problem on ${topic.title}.`,
    );
  } catch {
    generated = {
      prompt: `Consider the sentence "Nothing is a square circle." Everyone agrees it is true, yet read on the model of "Smith is a lawyer" it seems to say that some object — a "non-entity" — is a circle, which is absurd. Explain what has gone wrong in that reading, and give a better account of what the sentence actually claims. Why does this matter for how we should do philosophy?`,
      correctAnswer:
        "The absurd reading mistakes grammatical form for logical form: 'nothing' is not a name picking out a strange object, the way 'Smith' names a person. Properly analyzed, the sentence says that the property of being both square and circular is uninstantiated — that the set of square circles is empty — so it attributes a property to a property rather than positing a mysterious non-entity. This matters because it shows philosophical confusion can be dissolved by analyzing what a statement really claims, rather than by inventing exotic entities to make the surface grammar come out true.",
      explanation:
        "A strong answer must distinguish grammatical form from logical form and recast the claim as being about whether a property is instantiated, not about a special object.",
    };
  }

  const [stored] = await db
    .insert(practiceProblemsTable)
    .values({
      sessionId,
      topicId: topic.id,
      prompt: generated.prompt,
      correctAnswer: generated.correctAnswer,
      explanation: generated.explanation,
      difficulty,
    })
    .returning();
  if (!stored) {
    res.status(500).json({ error: "failed" });
    return;
  }

  res.json(
    NextPracticeProblemResponse.parse({
      id: stored.id,
      prompt: stored.prompt,
      topicId: topic.id,
      topicTitle: topic.title,
      difficulty,
    }),
  );
});

router.post("/practice/sessions/:sessionId/grade", async (req, res): Promise<void> => {
  const sessionId = parseIdParam(req.params.sessionId);
  const parsed = GradePracticeAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { problemId, answer, trace } = parsed.data;
  const [session] = await db
    .select()
    .from(practiceSessionsTable)
    .where(eq(practiceSessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "session not found" });
    return;
  }
  const [problem] = await db
    .select()
    .from(practiceProblemsTable)
    .where(
      and(
        eq(practiceProblemsTable.id, problemId),
        eq(practiceProblemsTable.sessionId, sessionId),
      ),
    );
  if (!problem) {
    res.status(404).json({ error: "problem not found in this session" });
    return;
  }

  const graded = await gradeAnswer({
    prompt: problem.prompt,
    correctAnswer: problem.correctAnswer,
    userAnswer: answer,
  });

  await db.insert(practiceAttemptsTable).values({
    sessionId,
    problemId,
    topicId: problem.topicId,
    answer,
    correct: graded.correct,
    difficulty: problem.difficulty,
    trace,
  });

  const delta = graded.correct ? 0.4 : -0.5;
  const newDifficulty = Math.max(1, Math.min(5, session.difficulty + delta));
  await db
    .update(practiceSessionsTable)
    .set({ difficulty: newDifficulty })
    .where(eq(practiceSessionsTable.id, sessionId));

  let tutorTip: string | null = null;
  if (session.tutorEnabled && !graded.correct) {
    try {
      tutorTip = (
        await chatJson<{ tip: string }>(
          "You are a kind, concise philosophy tutor. Given a problem, the correct answer, and the student's wrong attempt, give ONE focused next-step tip (2 sentences max). Respond as strict JSON: {\"tip\": string}.",
          JSON.stringify({
            prompt: problem.prompt,
            correctAnswer: problem.correctAnswer,
            studentAnswer: answer,
          }),
        )
      ).tip;
    } catch {
      tutorTip = null;
    }
  }

  res.json(
    GradePracticeAnswerResponse.parse({
      problemId,
      correct: graded.correct,
      correctAnswer: problem.correctAnswer,
      explanation: graded.explanation || problem.explanation,
      newDifficulty,
      tutorTip,
    }),
  );
});

export default router;
