import { Router, type IRouter } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import {
  db,
  assignmentsTable,
  problemsTable,
  topicsTable,
  lecturesTable,
  practiceAssignmentsTable,
  practiceAssignmentProblemsTable,
  practiceAssignmentAnswersTable,
  practiceAssignmentMessagesTable,
} from "@workspace/db";
import {
  GeneratePracticeAssignmentResponse,
  GetPracticeAssignmentResponse,
  SubmitPracticeAssignmentBody,
  SubmitPracticeAssignmentResponse,
  DiscussPracticeFeedbackBody,
  DiscussPracticeFeedbackResponse,
} from "@workspace/api-zod";
import { chatJson, chatText } from "../lib/ai";
import { gradeAnswerRich } from "../lib/grading";
import { questionDesignBlock } from "../lib/questionDesign";

const router: IRouter = Router();

function parseIdParam(raw: unknown): number {
  const s = Array.isArray(raw) ? raw[0] : (raw as string);
  return parseInt(s ?? "", 10);
}

type Kind = "homework" | "test" | "midterm" | "final";

async function buildPracticePayload(practiceId: number) {
  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(eq(practiceAssignmentsTable.id, practiceId));
  if (!pa) return null;

  const problems = await db
    .select({
      id: practiceAssignmentProblemsTable.id,
      position: practiceAssignmentProblemsTable.position,
      prompt: practiceAssignmentProblemsTable.prompt,
      correctAnswer: practiceAssignmentProblemsTable.correctAnswer,
      topicId: practiceAssignmentProblemsTable.topicId,
      topicTitle: topicsTable.title,
    })
    .from(practiceAssignmentProblemsTable)
    .leftJoin(topicsTable, eq(practiceAssignmentProblemsTable.topicId, topicsTable.id))
    .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, practiceId))
    .orderBy(asc(practiceAssignmentProblemsTable.position));

  const answers = await db
    .select()
    .from(practiceAssignmentAnswersTable)
    .where(eq(practiceAssignmentAnswersTable.practiceAssignmentId, practiceId));
  const byProblem = new Map(answers.map((a) => [a.problemId, a]));

  const messages = await db
    .select()
    .from(practiceAssignmentMessagesTable)
    .where(eq(practiceAssignmentMessagesTable.practiceAssignmentId, practiceId))
    .orderBy(asc(practiceAssignmentMessagesTable.id));

  const submitted = pa.status === "submitted";

  return {
    id: pa.id,
    assignmentId: pa.assignmentId,
    kind: pa.kind as Kind,
    title: pa.title,
    weekNumber: pa.weekNumber,
    status: pa.status as "in_progress" | "submitted",
    scorePercent: pa.scorePercent ?? null,
    instructions: null as string | null,
    problems: problems.map((p) => {
      const a = byProblem.get(p.id);
      return {
        id: p.id,
        position: p.position,
        prompt: p.prompt,
        topicId: p.topicId,
        topicTitle: p.topicTitle ?? null,
        savedAnswer: a?.answer ?? null,
        correct: a?.correct ?? null,
        feedback: a?.feedback ?? null,
        modelAnswer: submitted ? p.correctAnswer : null,
      };
    }),
    messages: messages.map((m) => ({
      problemId: m.problemId ?? null,
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  };
}

router.post(
  "/assignments/:assignmentId/practice",
  async (req, res): Promise<void> => {
    const id = parseIdParam(req.params.assignmentId);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }
    const [a] = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, id));
    if (!a) {
      res.status(404).json({ error: "assignment not found" });
      return;
    }

    const sourceProblems = await db
      .select({
        id: problemsTable.id,
        position: problemsTable.position,
        prompt: problemsTable.prompt,
        correctAnswer: problemsTable.correctAnswer,
        explanation: problemsTable.explanation,
        topicId: problemsTable.topicId,
        topicTitle: topicsTable.title,
      })
      .from(problemsTable)
      .leftJoin(topicsTable, eq(problemsTable.topicId, topicsTable.id))
      .where(eq(problemsTable.assignmentId, id))
      .orderBy(asc(problemsTable.position));

    if (sourceProblems.length === 0) {
      res.status(400).json({ error: "assignment has no problems" });
      return;
    }

    // Lecture text per topic, to keep generated practice grounded in the course.
    const topicIds = [...new Set(sourceProblems.map((p) => p.topicId))];
    const lectureByTopic = new Map<number, string>();
    await Promise.all(
      topicIds.map(async (tid) => {
        const [lec] = await db
          .select({ body: lecturesTable.body })
          .from(lecturesTable)
          .where(eq(lecturesTable.topicId, tid))
          .limit(1);
        if (lec?.body) lectureByTopic.set(tid, lec.body.slice(0, 2400));
      }),
    );

    const [created] = await db
      .insert(practiceAssignmentsTable)
      .values({
        assignmentId: a.id,
        kind: a.kind,
        title: `Practice: ${a.title}`,
        weekNumber: a.weekNumber,
        status: "in_progress",
      })
      .returning();
    if (!created) {
      res.status(500).json({ error: "failed to create practice" });
      return;
    }

    const generated = await Promise.all(
      sourceProblems.map(async (sp) => {
        const lecture = lectureByTopic.get(sp.topicId) ?? "";
        try {
          const out = await chatJson<{
            prompt: string;
            correctAnswer: string;
            explanation: string;
          }>(
            [
              "You are a college Philosophy 101 instructor writing a PARALLEL practice problem for an upcoming graded assignment.",
              "You are given a real graded problem. FIRST, identify the underlying PRINCIPLE or SKILL it is really testing (ignore how it is worded — even if the graded problem asks for a definition, the skill underneath is the ability to APPLY that idea).",
              "THEN write a NEW problem that tests that same underlying skill at the same depth and difficulty, following the rules below. It must NOT be a copy of the graded problem and must NOT be a question that will appear on the graded assignment.",
              "",
              questionDesignBlock(),
              "",
              'OUTPUT: Provide a model answer of several full sentences capturing the central reasoning a strong response must contain. Respond as strict JSON: {"prompt": string, "correctAnswer": string, "explanation": string} where explanation is a 1-2 sentence note on the key reasoning move a strong answer must make.',
            ].join("\n"),
            JSON.stringify({
              topic: sp.topicTitle ?? "",
              graded_problem_to_make_a_parallel_of: sp.prompt,
              graded_problem_model_answer_for_skill_reference: sp.correctAnswer,
              concept_reference_do_not_quote: lecture,
            }),
          );
          if (
            out?.prompt?.trim() &&
            out?.correctAnswer?.trim() &&
            out?.explanation?.trim()
          ) {
            return {
              prompt: out.prompt.trim(),
              correctAnswer: out.correctAnswer.trim(),
              explanation: out.explanation.trim(),
            };
          }
        } catch {
          /* fall through to fallback */
        }
        // Fallback only on generation failure: reuse the source graded
        // problem verbatim. Those problems are already concrete-scenario,
        // application-based questions, so prompt and model answer stay aligned
        // and gradable (unlike an open "invent your own example" prompt, which
        // has no fixed key to grade against).
        return {
          prompt: sp.prompt,
          correctAnswer: sp.correctAnswer,
          explanation: sp.explanation,
        };
      }),
    );

    await db.insert(practiceAssignmentProblemsTable).values(
      generated.map((g, i) => ({
        practiceAssignmentId: created.id,
        sourceProblemId: sourceProblems[i]!.id,
        topicId: sourceProblems[i]!.topicId,
        position: sourceProblems[i]!.position,
        prompt: g.prompt,
        correctAnswer: g.correctAnswer,
        explanation: g.explanation,
      })),
    );

    const payload = await buildPracticePayload(created.id);
    res.json(GeneratePracticeAssignmentResponse.parse(payload));
  },
);

router.get(
  "/assignments/practice/:practiceId",
  async (req, res): Promise<void> => {
    const id = parseIdParam(req.params.practiceId);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }
    const payload = await buildPracticePayload(id);
    if (!payload) {
      res.status(404).json({ error: "practice not found" });
      return;
    }
    res.json(GetPracticeAssignmentResponse.parse(payload));
  },
);

router.post(
  "/assignments/practice/:practiceId/submit",
  async (req, res): Promise<void> => {
    const id = parseIdParam(req.params.practiceId);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }
    const parsed = SubmitPracticeAssignmentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [pa] = await db
      .select()
      .from(practiceAssignmentsTable)
      .where(eq(practiceAssignmentsTable.id, id));
    if (!pa) {
      res.status(404).json({ error: "practice not found" });
      return;
    }

    const problems = await db
      .select()
      .from(practiceAssignmentProblemsTable)
      .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, id))
      .orderBy(asc(practiceAssignmentProblemsTable.position));

    const answerMap = new Map(
      parsed.data.answers.map((x) => [x.problemId, x.answer ?? ""]),
    );

    const graded = await Promise.all(
      problems.map(async (p) => {
        const userAnswer = answerMap.get(p.id) ?? "";
        const result = await gradeAnswerRich({
          prompt: p.prompt,
          correctAnswer: p.correctAnswer,
          userAnswer,
        });
        return { p, userAnswer, ...result };
      }),
    );

    let score = 0;
    for (const g of graded) {
      if (g.correct) score += 1;
      const [existing] = await db
        .select()
        .from(practiceAssignmentAnswersTable)
        .where(
          and(
            eq(practiceAssignmentAnswersTable.practiceAssignmentId, id),
            eq(practiceAssignmentAnswersTable.problemId, g.p.id),
          ),
        );
      const values = {
        practiceAssignmentId: id,
        problemId: g.p.id,
        answer: g.userAnswer,
        correct: g.correct,
        feedback: g.feedback,
        updatedAt: new Date(),
      };
      if (existing) {
        await db
          .update(practiceAssignmentAnswersTable)
          .set(values)
          .where(eq(practiceAssignmentAnswersTable.id, existing.id));
      } else {
        await db.insert(practiceAssignmentAnswersTable).values(values);
      }
    }

    const total = problems.length;
    const percent = total === 0 ? 0 : (score / total) * 100;
    await db
      .update(practiceAssignmentsTable)
      .set({ status: "submitted", submittedAt: new Date(), scorePercent: percent })
      .where(eq(practiceAssignmentsTable.id, id));

    let encouragement: string | null = null;
    try {
      const out = await chatJson<{ message: string }>(
        'You are a warm college philosophy tutor. The student just finished a NO-STAKES practice version of an assignment. Write a short (2-3 sentence) encouraging message tailored to their score: celebrate what went well, normalize mistakes as the point of practice, and motivate them to keep practicing (or to attempt the real graded assignment when ready). Respond as strict JSON: {"message": string}.',
        JSON.stringify({ kind: pa.kind, score, total, percent: Math.round(percent) }),
      );
      encouragement = out?.message?.trim() || null;
    } catch {
      encouragement =
        percent >= 70
          ? "Strong practice run — this is exactly the kind of reps that make the graded version feel easy. Keep going."
          : "This is what practice is for — every miss here is one you won't make on the real thing. Run another practice version and watch your score climb.";
    }

    // ---- Evolving profile + surgically-precise focus pointers ----------
    // Build a per-topic profile from ALL logged practice activity (this
    // assignment-practice history + topic drills), blended with how the
    // student did per topic on THIS run, to drive precise prep guidance.
    const topicRows = await db.select().from(topicsTable);
    const topicTitleById = new Map(topicRows.map((t) => [t.id, t.title]));

    const runByTopic = new Map<
      number,
      { title: string; correct: number; total: number }
    >();
    for (const g of graded) {
      const tid = g.p.topicId;
      const cur =
        runByTopic.get(tid) ??
        { title: topicTitleById.get(tid) ?? "Topic", correct: 0, total: 0 };
      cur.total += 1;
      if (g.correct) cur.correct += 1;
      runByTopic.set(tid, cur);
    }

    const histByTopic = new Map<
      number,
      { title: string; n: number; correctSum: number }
    >();
    const addHist = (
      rows: Array<{ topic_id: unknown; n: unknown; acc: unknown }>,
    ) => {
      for (const r of rows) {
        const tid = Number(r.topic_id);
        const n = Number(r.n);
        const acc = Number(r.acc);
        if (!Number.isFinite(tid) || !Number.isFinite(n) || n <= 0) continue;
        const cur =
          histByTopic.get(tid) ??
          { title: topicTitleById.get(tid) ?? "Topic", n: 0, correctSum: 0 };
        cur.n += n;
        cur.correctSum += (Number.isFinite(acc) ? acc : 0) * n;
        histByTopic.set(tid, cur);
      }
    };
    try {
      const r1 = await db.execute(sql`
        select pap.topic_id as topic_id, count(*)::int as n,
          avg(case when paa.correct then 1.0 else 0.0 end) as acc
        from practice_assignment_answers paa
        join practice_assignment_problems pap on pap.id = paa.problem_id
        group by pap.topic_id
      `);
      addHist(r1.rows as Array<{ topic_id: unknown; n: unknown; acc: unknown }>);
      const r2 = await db.execute(sql`
        select topic_id, count(*)::int as n,
          avg(case when correct then 1.0 else 0.0 end) as acc
        from practice_attempts group by topic_id
      `);
      addHist(r2.rows as Array<{ topic_id: unknown; n: unknown; acc: unknown }>);
    } catch {
      /* profile is best-effort; pointers still work from this run */
    }

    const profile = [...histByTopic.entries()]
      .map(([tid, v]) => ({
        topicTitle: v.title,
        lifetimeAttempts: v.n,
        lifetimeAccuracy: Number((v.correctSum / v.n).toFixed(2)),
        thisRun: runByTopic.get(tid)
          ? `${runByTopic.get(tid)!.correct}/${runByTopic.get(tid)!.total}`
          : null,
      }))
      .sort((a, b) => a.lifetimeAccuracy - b.lifetimeAccuracy);

    const missed = graded
      .filter((g) => !g.correct)
      .map((g) => ({
        topic: topicTitleById.get(g.p.topicId) ?? "Topic",
        prompt: g.p.prompt,
        whatStrongAnswerNeeds: g.p.explanation,
      }));

    let focusPointers: Array<{
      topicTitle: string | null;
      priority: string | null;
      pointer: string;
    }> = [];
    let focusSummary: string | null = null;
    try {
      const out = await chatJson<{
        summary: string;
        pointers: Array<{
          topic: string;
          priority: "high" | "medium" | "low";
          pointer: string;
        }>;
      }>(
        'You are an academic coach preparing a college Philosophy 101 student for a GRADED assignment, using their actual performance data. You are given: their lifetime per-topic practice accuracy (the evolving profile), how they did per topic on THIS practice run, and the specific problems they just missed with what a strong answer requires. Produce SURGICALLY PRECISE, analytics-grounded pointers: name the exact concept or skill to drill, cite the data (e.g. "62% lifetime on this topic", "you missed the validity-vs-soundness distinction just now"), and say concretely what to do before the graded version. Never be generic. Rank by priority. Respond as strict JSON: {"summary": string (2-3 sentences naming the single highest-leverage focus), "pointers": [{"topic": string, "priority": "high"|"medium"|"low", "pointer": string (one concrete, specific action tied to the data)}]} with 3 to 6 pointers.',
        JSON.stringify({
          assignmentKind: pa.kind,
          thisRunScore: `${score}/${total}`,
          evolvingProfile: profile,
          missedThisRun: missed,
        }),
      );
      focusSummary = out?.summary?.trim() || null;
      focusPointers = (out?.pointers ?? [])
        .filter((p) => p?.pointer?.trim())
        .map((p) => ({
          topicTitle: p.topic?.trim() || null,
          priority: ["high", "medium", "low"].includes(p.priority)
            ? p.priority
            : null,
          pointer: p.pointer.trim(),
        }));
    } catch {
      /* deterministic fallback below */
    }
    if (focusPointers.length === 0) {
      const weak = profile.filter((p) => p.lifetimeAccuracy < 0.75).slice(0, 3);
      const basis = weak.length > 0 ? weak : profile.slice(0, 3);
      focusPointers = basis.map((p) => ({
        topicTitle: p.topicTitle,
        priority: p.lifetimeAccuracy < 0.5 ? "high" : "medium",
        pointer:
          `You're at ${Math.round(p.lifetimeAccuracy * 100)}% on "${p.topicTitle}" ` +
          `across ${p.lifetimeAttempts} logged practice answer(s). Run another practice ` +
          `version focused here and review the model answers before the graded assignment.`,
      }));
      if (focusSummary == null) {
        focusSummary =
          missed.length === 0
            ? "Clean run — do one more practice version to lock it in, then take the graded assignment."
            : `Focus your prep on ${focusPointers[0]?.topicTitle ?? "your weakest topic"} before the graded version.`;
      }
    }

    res.json(
      SubmitPracticeAssignmentResponse.parse({
        practiceId: id,
        score,
        total,
        percent,
        encouragement,
        focusSummary,
        focusPointers,
        perProblem: graded.map((g) => ({
          problemId: g.p.id,
          correct: g.correct,
          userAnswer: g.userAnswer,
          modelAnswer: g.p.correctAnswer,
          feedback: g.feedback,
        })),
      }),
    );
  },
);

router.post(
  "/assignments/practice/:practiceId/discuss",
  async (req, res): Promise<void> => {
    const id = parseIdParam(req.params.practiceId);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }
    const parsed = DiscussPracticeFeedbackBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { problemId, message } = parsed.data;
    const [pa] = await db
      .select()
      .from(practiceAssignmentsTable)
      .where(eq(practiceAssignmentsTable.id, id));
    if (!pa) {
      res.status(404).json({ error: "practice not found" });
      return;
    }

    let problemContext = "";
    if (problemId != null) {
      const [p] = await db
        .select()
        .from(practiceAssignmentProblemsTable)
        .where(
          and(
            eq(practiceAssignmentProblemsTable.id, problemId),
            eq(practiceAssignmentProblemsTable.practiceAssignmentId, id),
          ),
        );
      if (p) {
        const [ans] = await db
          .select()
          .from(practiceAssignmentAnswersTable)
          .where(
            and(
              eq(practiceAssignmentAnswersTable.practiceAssignmentId, id),
              eq(practiceAssignmentAnswersTable.problemId, problemId),
            ),
          );
        problemContext =
          `The student is asking about this practice problem.\n` +
          `PROBLEM: ${p.prompt}\n` +
          `MODEL ANSWER: ${p.correctAnswer}\n` +
          `STUDENT'S ANSWER: ${ans?.answer || "(blank)"}\n` +
          `FEEDBACK THEY RECEIVED: ${ans?.feedback || "(not yet graded)"}\n\n`;
      }
    }

    // Recent dialogue for continuity (last 8 messages for this scope).
    const priorAll = await db
      .select()
      .from(practiceAssignmentMessagesTable)
      .where(eq(practiceAssignmentMessagesTable.practiceAssignmentId, id))
      .orderBy(asc(practiceAssignmentMessagesTable.id));
    const prior = priorAll
      .filter((m) => (problemId == null ? true : m.problemId === problemId))
      .slice(-8)
      .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
      .join("\n");

    const sys =
      "You are an encouraging, rigorous college Philosophy 101 tutor having a back-and-forth conversation with a student about the feedback on their practice answer. Engage directly with what they ask: clarify the concept, work through their reasoning with them, offer examples and thought experiments, and define key terms. Guide them toward understanding rather than just restating the model answer. Keep replies focused (3-6 sentences) unless they ask for more.";
    const user =
      problemContext +
      (prior ? `Conversation so far:\n${prior}\n\n` : "") +
      `Student: ${message}`;

    let reply = "";
    try {
      reply = await chatText(sys, user);
    } catch {
      reply =
        "I'm having trouble reaching the tutor service right now — try again in a moment.";
    }

    await db.insert(practiceAssignmentMessagesTable).values([
      { practiceAssignmentId: id, problemId: problemId ?? null, role: "user", content: message },
      { practiceAssignmentId: id, problemId: problemId ?? null, role: "assistant", content: reply },
    ]);

    res.json(DiscussPracticeFeedbackResponse.parse({ reply }));
  },
);

export default router;
