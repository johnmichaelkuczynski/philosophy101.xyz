import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
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
            'You are a college Philosophy 101 instructor writing a PARALLEL practice problem. Given a real graded problem (its prompt and model answer) and the relevant lecture text, write a NEW problem that tests the exact same concept and skill at the same depth and difficulty, but with a different scenario, example, or framing so it is not a copy. The new problem must be a substantive, essay/short-answer style question that asks the student to explain, distinguish, apply, or argue (never a one-word or yes/no recall question). Provide a model answer of several full sentences capturing the central point and reasoning. Respond as strict JSON: {"prompt": string, "correctAnswer": string, "explanation": string} where explanation is a 1-2 sentence note on what a strong answer must contain.',
            JSON.stringify({
              topic: sp.topicTitle ?? "",
              real_problem_prompt: sp.prompt,
              real_problem_model_answer: sp.correctAnswer,
              lecture_excerpt: lecture,
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
        // Fallback only on generation failure: reframe the original so the
        // practice problem is never a verbatim copy of the graded one.
        return {
          prompt:
            `Practice variant (same concept as the graded problem): ${sp.prompt}\n\n` +
            `Answer in your own words, with your own example where one is asked for.`,
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

    res.json(
      SubmitPracticeAssignmentResponse.parse({
        practiceId: id,
        score,
        total,
        percent,
        encouragement,
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
