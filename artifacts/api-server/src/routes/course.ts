import { Router, type IRouter } from "express";
import { eq, asc, sql } from "drizzle-orm";
import {
  db,
  topicsTable,
  lecturesTable,
  assignmentsTable,
  attemptsTable,
} from "@workspace/db";
import {
  GetCourseOverviewResponse,
  GetWeekResponse,
  GetLectureResponse,
  ListTopicsResponse,
  ExpandLectureBody,
  ExpandLectureResponse,
} from "@workspace/api-zod";
import { chatText } from "../lib/ai";

const router: IRouter = Router();

const WEEK_TITLES: Record<number, { title: string; summary: string }> = {
  1: {
    title: "Language, Logic, and Analysis",
    summary:
      "What philosophy is and how it analyzes thought: logical form and conceptual analysis, meaning and reference, definite descriptions, sense and the limits of definition, and how language connects to the world.",
  },
  2: {
    title: "Knowledge and Epistemology",
    summary:
      "Justified true belief and beyond: the sources and structure of justification, a priori and a posteriori knowledge, acquaintance and self-knowledge, Gettier-style cases, and skepticism about the foundations of knowledge.",
  },
  3: {
    title: "Mind, Freedom, and Metaphysics",
    summary:
      "Determinism and predictability, compatibilist freedom and the will, personal and objectual identity, and causality, explanation, and the structure of the modal categories.",
  },
  4: {
    title: "Ethics, Value, and Law",
    summary:
      "Intrinsic good and the right, emotivism and its collapse, moral conventionalism and nihilism, flourishing and welfare, Kantian rationality and autonomy, religion and the Euthyphro, and moral protection in law.",
  },
};

async function buildWeek(weekNumber: number) {
  const lectures = await db
    .select({
      id: lecturesTable.id,
      title: lecturesTable.title,
      topicId: lecturesTable.topicId,
    })
    .from(lecturesTable)
    .where(eq(lecturesTable.weekNumber, weekNumber))
    .orderBy(asc(lecturesTable.id));

  const assignments = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.weekNumber, weekNumber))
    .orderBy(asc(assignmentsTable.position));

  const assignmentSummaries = await Promise.all(
    assignments.map(async (a) => {
      const counts = await db.execute(
        sql`select count(*)::int as n from problems where assignment_id = ${a.id}`,
      );
      const n = (counts.rows[0] as { n?: number } | undefined)?.n ?? 0;
      const attempts = await db
        .select()
        .from(attemptsTable)
        .where(eq(attemptsTable.assignmentId, a.id))
        .orderBy(asc(attemptsTable.id));
      const submitted = attempts.filter((x) => x.status === "submitted");
      const inProgress = attempts.find((x) => x.status === "in_progress");
      const best = submitted.reduce(
        (best, x) =>
          x.scorePercent != null && x.scorePercent > best ? x.scorePercent : best,
        -1,
      );
      const status: "not_started" | "in_progress" | "submitted" = inProgress
        ? "in_progress"
        : submitted.length > 0
        ? "submitted"
        : "not_started";
      const last = attempts[attempts.length - 1];
      return {
        id: a.id,
        kind: a.kind as "homework" | "test" | "midterm" | "final",
        title: a.title,
        weekNumber: a.weekNumber,
        problemCount: n,
        isTimed: a.isTimed,
        timeLimitMinutes: a.timeLimitMinutes,
        status,
        bestScore: best < 0 ? null : best,
        lastAttemptId: last?.id ?? null,
      };
    }),
  );

  const meta = WEEK_TITLES[weekNumber] ?? {
    title: `Week ${weekNumber}`,
    summary: "",
  };

  return {
    weekNumber,
    title: meta.title,
    summary: meta.summary,
    lectures,
    assignments: assignmentSummaries,
  };
}

router.get("/course/overview", async (_req, res) => {
  const weeks = await Promise.all([1, 2, 3, 4].map(buildWeek));
  const assignmentsTotal = weeks.reduce((s, w) => s + w.assignments.length, 0);
  const assignmentsCompleted = weeks.reduce(
    (s, w) => s + w.assignments.filter((a) => a.status === "submitted").length,
    0,
  );
  const practiceCountRow = await db.execute(
    sql`select count(*)::int as n from practice_attempts`,
  );
  const practiceCount =
    (practiceCountRow.rows[0] as { n?: number } | undefined)?.n ?? 0;

  res.json(
    GetCourseOverviewResponse.parse({
      title: "Philosophy 101",
      weeks,
      totals: { assignmentsCompleted, assignmentsTotal, practiceCount },
    }),
  );
});

router.get("/course/weeks/:weekNumber", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.weekNumber)
    ? req.params.weekNumber[0]
    : req.params.weekNumber;
  const weekNumber = parseInt(raw ?? "", 10);
  if (!Number.isFinite(weekNumber) || weekNumber < 1 || weekNumber > 4) {
    res.status(400).json({ error: "invalid weekNumber" });
    return;
  }
  const week = await buildWeek(weekNumber);
  res.json(GetWeekResponse.parse(week));
});

router.get("/course/lectures/:lectureId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.lectureId)
    ? req.params.lectureId[0]
    : req.params.lectureId;
  const lectureId = parseInt(raw ?? "", 10);
  if (!Number.isFinite(lectureId)) {
    res.status(400).json({ error: "invalid lectureId" });
    return;
  }
  const [lecture] = await db
    .select()
    .from(lecturesTable)
    .where(eq(lecturesTable.id, lectureId));
  if (!lecture) {
    res.status(404).json({ error: "lecture not found" });
    return;
  }
  res.json(GetLectureResponse.parse(lecture));
});

// Generate (and persist) the medium or long version of a lecture on demand.
// Lazy-cached: once generated it's stored on the lecture row so future
// requests are instant. The UI prefetches both depths on lecture open so
// the depth toggle is "already there" with no waiting.
router.post(
  "/course/lectures/:lectureId/expand",
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.lectureId)
      ? req.params.lectureId[0]
      : req.params.lectureId;
    const lectureId = parseInt(raw ?? "", 10);
    if (!Number.isFinite(lectureId)) {
      res.status(400).json({ error: "invalid lectureId" });
      return;
    }
    const parsed = ExpandLectureBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const level = parsed.data.level;

    const [lecture] = await db
      .select()
      .from(lecturesTable)
      .where(eq(lecturesTable.id, lectureId));
    if (!lecture) {
      res.status(404).json({ error: "lecture not found" });
      return;
    }

    // Already generated — return as-is (instant).
    const existing = level === "medium" ? lecture.bodyMedium : lecture.bodyLong;
    if (existing && existing.trim()) {
      res.json(GetLectureResponse.parse(lecture));
      return;
    }

    const target =
      level === "medium"
        ? {
            words: "roughly 1.6 to 2x the length of the short version",
            style:
              "Expand the SHORT lecture into a MEDIUM-depth version: keep every example, term, and learning objective from the short version, but add more explanation, intuition, and a worked example or two. Stay focused and readable.",
          }
        : {
            words: "roughly 3 to 4x the length of the short version",
            style:
              "Expand the SHORT lecture into a LONG, textbook-depth version: keep every example, term, and learning objective from the short version, then go deep — fuller motivation, historical context, multiple worked examples, common misconceptions, objections and replies, and a short recap. It should read like a thorough chapter.",
          };

    let generated = "";
    try {
      generated = await chatText(
        "You are a college Philosophy 101 textbook author. You rewrite a lecture at greater depth WITHOUT changing its meaning, its examples, or its learning objectives. Preserve the same concepts and the same running examples; only add depth, clarity, and detail. Output clean Markdown with headings and short paragraphs. Do not add a title (the page already shows it).",
        `${target.style}\n\nLength target: ${target.words}.\n\nLECTURE TITLE: ${lecture.title}\n\nSHORT VERSION:\n${lecture.body}`,
      );
    } catch {
      generated = "";
    }

    if (!generated.trim()) {
      res
        .status(502)
        .json({ error: "could not generate expanded lecture, please retry" });
      return;
    }

    const [updated] = await db
      .update(lecturesTable)
      .set(
        level === "medium"
          ? { bodyMedium: generated.trim() }
          : { bodyLong: generated.trim() },
      )
      .where(eq(lecturesTable.id, lectureId))
      .returning();

    res.json(ExpandLectureResponse.parse(updated ?? lecture));
  },
);

router.get("/course/topics", async (_req, res) => {
  const rows = await db
    .select()
    .from(topicsTable)
    .orderBy(asc(topicsTable.position));
  res.json(ListTopicsResponse.parse(rows));
});

export default router;
