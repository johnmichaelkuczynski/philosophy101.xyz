/**
 * One-off course generator — Philosophy 101 (4 units / 24 topics).
 *
 * The course structure is FIXED: 24 topics across 4 units, exactly as approved
 * by the user (1.1–1.8, 2.1–2.6, 3.1–3.4, 4.1–4.6). It is NOT derived from the
 * book's chapter count.
 *
 * Each lecture is generated from the user-approved TEN key bullet points for
 * that topic (the authoritative spine), grounded ONLY in the relevant source
 * text from the uploaded book. The model develops exactly those ten points, in
 * order, into a dense lecture. Assignments are generated from the produced
 * lectures.
 *
 * Bundle with scripts/build-gen.mjs, then run the resulting .mjs with node.
 * Resumable + incremental: re-running skips topics/assignments already written.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { openai } from "@workspace/integrations-openai-ai-server";
import { questionDesignBlock } from "../src/lib/questionDesign";

// Minimal concurrency limiter (avoids depending on p-limit, which is not
// resolvable from this package).
function pLimit(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    if (active >= concurrency) return;
    const run = queue.shift();
    if (run) {
      active++;
      run();
    }
  };
  return function <T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      };
      queue.push(run);
      next();
    });
  };
}

const TEXT_MODEL = "gpt-5.4";

const WS = "/home/runner/workspace";
const BOOK = path.join(
  WS,
  "attached_assets/Pasted--PART-I-The-Analysis-of-Analysis-Chapter-1-Analytic-Phi_1780961071154.txt",
);
const BULLETS = path.join(
  WS,
  "attached_assets/Philosophy101_BulletPoints_TEN_per_topic.txt",
);
const CONTENT_DIR = path.join(WS, "artifacts/api-server/src/content");
const TOPICS_OUT = path.join(CONTENT_DIR, "topics.json");
const ASSIGN_OUT = path.join(CONTENT_DIR, "graded-assignments.json");

const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 0; // 0 = all
const PHASE = process.env.PHASE ?? "all"; // "lectures" | "assignments" | "all"
const ONLY = process.env.ONLY ? process.env.ONLY.split(",").map((s) => s.trim()) : null; // codes e.g. "1.1,2.3"
const FORCE = process.env.FORCE === "1";
const CONCURRENCY = process.env.CONCURRENCY ? parseInt(process.env.CONCURRENCY, 10) : 4;

// ---------------- Course structure (fixed) ----------------

const UNIT_TITLES: Record<number, string> = {
  1: "Language, Logic, and Analysis",
  2: "Knowledge and Epistemology",
  3: "Mind, Freedom, and Metaphysics",
  4: "Ethics, Value, and Law",
};

// Book chapter line ranges in BOOK (1-indexed, end inclusive).
const CH: Record<number, [number, number]> = {
  1: [10, 860],
  2: [861, 1139],
  3: [1140, 1394],
  4: [1400, 1739],
  5: [1740, 1885],
  6: [1886, 2170],
  7: [2171, 2535],
  8: [2536, 3138],
  9: [3139, 3447],
  10: [3453, 3857],
  11: [3858, 4153],
  12: [4154, 4326],
  13: [4327, 4734],
  14: [4740, 4849],
  15: [4850, 5144],
  16: [5145, 5582],
  17: [5583, 6225],
  18: [6226, 6639],
  19: [6647, 6864],
  20: [6865, 6983],
  21: [6984, 7166],
  22: [7167, 7418],
  23: [7419, 7574],
  24: [7575, 7726],
  25: [7727, 8020],
  26: [8021, 8096],
  27: [8097, 9168],
};

type TopicSpec = {
  code: string; // "1.1"
  unit: number;
  title: string;
  chapters: number[]; // source chapters for grounding
};

// 24 topics. `chapters` maps each topic to the book chapter(s) whose source
// text best grounds it (the ten bullets are the authoritative spine; the
// source text supplies authentic examples/phrasing).
const TOPIC_SPECS: TopicSpec[] = [
  // Unit 1 — Language, Logic, and Analysis
  { code: "1.1", unit: 1, title: "What Philosophy Is and How It Differs from Science", chapters: [1, 2, 3] },
  { code: "1.2", unit: 1, title: "The Meaning of Meaning", chapters: [4, 3] },
  { code: "1.3", unit: 1, title: "Language and Thought", chapters: [5, 8] },
  { code: "1.4", unit: 1, title: "Do We Think in Words?", chapters: [5] },
  { code: "1.5", unit: 1, title: "Perception and Conception", chapters: [8, 9] },
  { code: "1.6", unit: 1, title: "Names, Reference, and Literal vs. Implied Meaning", chapters: [6, 8] },
  { code: "1.7", unit: 1, title: "Necessity, Possibility, and the Analytic\u2013Synthetic Distinction", chapters: [18] },
  { code: "1.8", unit: 1, title: "Deduction, Induction, and Inference", chapters: [12, 11] },
  // Unit 2 — Knowledge and Epistemology
  { code: "2.1", unit: 2, title: "Knowledge as Justified True Belief", chapters: [10] },
  { code: "2.2", unit: 2, title: "Sources of Justification and Testimony", chapters: [10, 11] },
  { code: "2.3", unit: 2, title: "A Priori vs. A Posteriori Knowledge", chapters: [13, 18] },
  { code: "2.4", unit: 2, title: "Knowledge by Acquaintance, Self-Knowledge, and the Intuitive vs. Discursive", chapters: [10, 3] },
  { code: "2.5", unit: 2, title: "Skepticism and the Foundations of Knowledge", chapters: [11, 12] },
  { code: "2.6", unit: 2, title: "Empiricism vs. Rationalism", chapters: [13, 2] },
  // Unit 3 — Mind, Freedom, and Metaphysics
  { code: "3.1", unit: 3, title: "The Mind\u2013Body Problem: Dualism vs. Materialism", chapters: [16, 15] },
  { code: "3.2", unit: 3, title: "Free Will, Determinism, and the Libet Experiment", chapters: [14, 15] },
  { code: "3.3", unit: 3, title: "Personal Identity", chapters: [16] },
  { code: "3.4", unit: 3, title: "Causation", chapters: [17] },
  // Unit 4 — Ethics, Value, and Law
  { code: "4.1", unit: 4, title: "What Ethics Is", chapters: [19] },
  { code: "4.2", unit: 4, title: "Emotivism, Moral Realism, and Flourishing", chapters: [20, 21, 22] },
  { code: "4.3", unit: 4, title: "Utilitarianism, Hedonism, Egoism, and Kant's Ethics", chapters: [24, 23] },
  { code: "4.4", unit: 4, title: "Philosophy of Religion and Existentialism", chapters: [25, 26] },
  { code: "4.5", unit: 4, title: "Philosophy of Law", chapters: [27] },
  { code: "4.6", unit: 4, title: "Capstone Synthesis", chapters: [1, 3] },
];

function slugForCode(code: string): string {
  return `t${code.replace(".", "-")}`;
}

// ---------------- Source + bullets ----------------

const bookLines = readFileSync(BOOK, "utf8").split("\n");
function chapterText(n: number): string {
  const range = CH[n];
  if (!range) return "";
  return bookLines.slice(range[0] - 1, range[1]).join("\n").trim();
}

const SOURCE_CAP_TOTAL = 18000;
function sourceForTopic(spec: TopicSpec): string {
  const perChapter = Math.floor(SOURCE_CAP_TOTAL / spec.chapters.length);
  return spec.chapters
    .map((n) => `--- Source (book chapter ${n}) ---\n${chapterText(n).slice(0, perChapter)}`)
    .join("\n\n");
}

// Parse the approved ten-bullet file into { code -> bullets[] }.
function loadBullets(): Map<string, string[]> {
  const lines = readFileSync(BULLETS, "utf8").split("\n");
  const map = new Map<string, string[]>();
  let current: string | null = null;
  const headerRe = /^(\d+\.\d+)\s+\S/;
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    const h = line.match(headerRe);
    if (h) {
      current = h[1]!;
      map.set(current, []);
      continue;
    }
    if (current && line.startsWith("- ")) {
      map.get(current)!.push(line.slice(2).trim());
    }
  }
  return map;
}

type Topic = {
  slug: string;
  title: string;
  weekNumber: number;
  blurb: string;
  lectureTitle: string;
  body: string;
  // internal
  _code: string;
  _order: number;
};

type Problem = {
  topicSlug: string;
  prompt: string;
  correctAnswer: string;
  explanation: string;
  hint?: string;
};

type Assignment = {
  kind: "homework" | "test" | "midterm" | "final";
  title: string;
  weekNumber: number;
  isTimed: boolean;
  timeLimitMinutes: number | null;
  instructions: string;
  problems: Problem[];
};

function log(msg: string): void {
  const t = new Date().toISOString().slice(11, 19);
  console.log(`[${t}] ${msg}`);
}

// ---------------- Lecture generation ----------------

const LECTURE_SYS = `You are a distinguished professor writing ONE lecture for a rigorous, upper-level university course in analytic philosophy. The course is taught strictly from a single assigned book.

YOUR TASK: Develop the TEN KEY POINTS the user gives you — in the order given — into one dense, flowing lecture. Each of the ten points is a thesis this course holds; teach it, argue for it, and illustrate it. Do not merely restate the bullets: explain WHY each holds, walk through the supporting argument step by step, and connect the points into a single coherent line of thought.

ABSOLUTE GROUNDING RULE: Teach ONLY from the assigned book. Use ONLY the ideas, distinctions, arguments, examples, terminology, and named thinkers found in the TEN KEY POINTS and the SOURCE TEXT provided. Do NOT import outside philosophy, do NOT invent your own examples, do NOT soften or popularize away from the source. This book argues for specific, sometimes non-standard positions (e.g. that there is no necessary a posteriori, that determinism is a prerequisite for freedom, that flourishing is the sole non-derivative good) — present THOSE positions as the lecture's view; you are teaching this author's course, not a neutral survey. Use the source's own examples (e.g. "the present King of France", "square circle", "Hesperus is Phosphorus", Larry, Smith vs. Brown) where they fit.

DENSITY: Write a dense, substantive lecture of roughly 2200-3200 words. Define every technical term on first appearance, preserve logical structure (premises -> conclusion, objection -> reply), and prefer depth over breadth.

TONE: Authoritative, precise, and clear — a brilliant lecturer making hard material followable. No filler, no "in this lecture we will", no exercises, no questions, no closing exhortations.

OUTPUT FORMAT — respond in EXACTLY this shape and nothing else:
BLURB: <one sentence, max 140 characters, catalog-style description of the lecture>
===BODY===
<GitHub-flavored Markdown. Begin with a single H1 ("# <the exact title given>"). Use ## section headers, **bold** for key technical terms on first use, and numbered/bulleted lists for argument steps. Do not include any exercises or questions.>`;

async function generateLecture(
  spec: TopicSpec,
  bullets: string[],
): Promise<{ blurb: string; body: string }> {
  const src = sourceForTopic(spec);
  const tenPoints = bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");
  const user = `TOPIC: ${spec.code} ${spec.title}
UNIT: ${spec.unit} — ${UNIT_TITLES[spec.unit]}

TEN KEY POINTS to develop, in this order (each is a thesis to teach and defend):
${tenPoints}

SOURCE TEXT from the assigned book (the ONLY material you may teach from; use it for arguments, examples, and terminology):

${src}

Write the lecture now. The H1 must read exactly: "# ${spec.title}".`;
  const resp = await openai.chat.completions.create({
    model: TEXT_MODEL,
    max_completion_tokens: 6500,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: LECTURE_SYS },
      { role: "user", content: user },
    ],
  });
  const out = resp.choices[0]?.message?.content?.trim() ?? "";
  const blurbM = out.match(/^BLURB:\s*(.+)$/m);
  const bodyIdx = out.indexOf("===BODY===");
  const body = (bodyIdx >= 0 ? out.slice(bodyIdx + "===BODY===".length) : out).trim();
  const blurb = blurbM?.[1]?.trim().replace(/[*#]/g, "") || "";
  if (body.length < 1200) {
    throw new Error(`${spec.code}: body too short (${body.length} chars) — likely a bad generation`);
  }
  return { blurb, body };
}

function loadTopics(): Topic[] {
  if (existsSync(TOPICS_OUT)) {
    try {
      return JSON.parse(readFileSync(TOPICS_OUT, "utf8")) as Topic[];
    } catch {
      return [];
    }
  }
  return [];
}

function writeTopics(topics: Topic[]): void {
  const ordered = [...topics].sort((a, b) => a._order - b._order);
  for (const t of ordered) {
    t.lectureTitle = `${t._code} ${t.title}`;
  }
  writeFileSync(TOPICS_OUT, JSON.stringify(ordered, null, 2) + "\n");
}

async function runLectures(): Promise<Topic[]> {
  const bulletMap = loadBullets();
  let specs = TOPIC_SPECS;
  if (ONLY) specs = specs.filter((s) => ONLY.includes(s.code));
  if (LIMIT > 0) specs = specs.slice(0, LIMIT);

  const existing = loadTopics();
  const bySlug = new Map<string, Topic>(existing.map((t) => [t.slug, t]));

  const limit = pLimit(CONCURRENCY);
  let done = 0;
  await Promise.all(
    specs.map((spec, idx) =>
      limit(async () => {
        const slug = slugForCode(spec.code);
        const bullets = bulletMap.get(spec.code);
        if (!bullets || bullets.length < 5) {
          throw new Error(`${spec.code}: missing/short bullets (${bullets?.length ?? 0}) in approved file`);
        }
        if (!FORCE && bySlug.get(slug)?.body) {
          log(`skip ${spec.code} (already generated)`);
          done++;
          return;
        }
        log(`generating ${spec.code} (unit ${spec.unit}) "${spec.title}"...`);
        const { blurb, body } = await generateLecture(spec, bullets);
        const topic: Topic = {
          slug,
          title: spec.title,
          weekNumber: spec.unit,
          blurb,
          lectureTitle: `${spec.code} ${spec.title}`,
          body,
          _code: spec.code,
          _order: TOPIC_SPECS.indexOf(spec) >= 0 ? TOPIC_SPECS.indexOf(spec) : idx,
        };
        bySlug.set(slug, topic);
        writeTopics([...bySlug.values()]); // incremental save
        done++;
        log(`  done ${spec.code}: "${spec.title}" (${body.length} chars) [${done}/${specs.length}]`);
      }),
    ),
  );
  const all = [...bySlug.values()].sort((a, b) => a._order - b._order);
  writeTopics(all);
  log(`lectures complete: ${all.length} topics`);
  return all;
}

// ---------------- Assignment generation ----------------

function unitContext(topics: Topic[], units: number[], perTopicChars: number): { text: string; slugs: string[] } {
  const subset = topics.filter((t) => units.includes(t.weekNumber));
  const slugs = subset.map((t) => t.slug);
  const text = subset
    .map((t) => `### topicSlug: ${t.slug} — ${t.title}\n${t.body.slice(0, perTopicChars)}`)
    .join("\n\n");
  return { text, slugs };
}

function probSys(n: number, slugs: string[]): string {
  return `You are writing exam problems for a rigorous analytic-philosophy course, based ONLY on the lecture material the user provides.

Output STRICT JSON of the form:
{"problems":[{"topicSlug":"...","prompt":"...","correctAnswer":"...","explanation":"...","hint":"..."}]}

${questionDesignBlock()}

ADDITIONAL RULES:
- Produce EXACTLY ${n} problems.
- "topicSlug" MUST be one of: ${slugs.join(", ")}. Distribute problems across several of these topics.
- Ground every problem in the principles taught in the supplied lecture material (use that material's own distinctions and positions to decide what a correct answer is). Do not introduce outside philosophy. But the SCENARIO in each prompt must be fresh and invented, never one of the lecture's own examples.
- "correctAnswer": a model answer of 150-300 words that a strong student would write, in prose, reasoning from the course's positions.
- "explanation": 1-2 sentences naming the principle being tested and what a strong answer must show.
- "hint" is optional; include it only when genuinely useful.
Return ONLY the JSON object.`;
}

async function generateProblems(n: number, units: number[], topics: Topic[], perTopicChars: number): Promise<Problem[]> {
  const { text, slugs } = unitContext(topics, units, perTopicChars);
  const resp = await openai.chat.completions.create({
    model: TEXT_MODEL,
    max_completion_tokens: 7000,
    reasoning_effort: "low",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: probSys(n, slugs) },
      { role: "user", content: `LECTURE MATERIAL (the only source you may use):\n\n${text}` },
    ],
  });
  const raw = resp.choices[0]?.message?.content?.trim() ?? "{}";
  let parsed: { problems?: Problem[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Problem JSON parse failed for units ${units.join(",")}`);
  }
  const allowed = new Set(slugs);
  const problems = (parsed.problems ?? []).filter((p) => p && allowed.has(p.topicSlug) && p.prompt && p.correctAnswer);
  if (problems.length === 0) throw new Error(`No valid problems for units ${units.join(",")}`);
  return problems.map((p) => ({
    topicSlug: p.topicSlug,
    prompt: p.prompt,
    correctAnswer: p.correctAnswer,
    explanation: p.explanation ?? "",
    ...(p.hint ? { hint: p.hint } : {}),
  }));
}

type AssignSpec = {
  kind: Assignment["kind"];
  title: string;
  weekNumber: number;
  isTimed: boolean;
  timeLimitMinutes: number | null;
  instructions: string;
  count: number;
  units: number[];
  perTopicChars: number;
};

function assignmentSpecs(): AssignSpec[] {
  const specs: AssignSpec[] = [];
  for (const u of [1, 2, 3, 4]) {
    specs.push({
      kind: "homework",
      title: `Homework ${u} — ${UNIT_TITLES[u]}`,
      weekNumber: u,
      isTimed: false,
      timeLimitMinutes: null,
      instructions: "Untimed practice. Answer each question in a few complete sentences, in your own words.",
      count: 5,
      units: [u],
      perTopicChars: 4000,
    });
    specs.push({
      kind: "test",
      title: `Unit ${u} Test — ${UNIT_TITLES[u]}`,
      weekNumber: u,
      isTimed: true,
      timeLimitMinutes: 45,
      instructions: "Timed test. Answer each question thoroughly and in your own words.",
      count: 5,
      units: [u],
      perTopicChars: 4000,
    });
    if (u === 2) {
      specs.push({
        kind: "midterm",
        title: "Midterm Examination — Units 1–2",
        weekNumber: 2,
        isTimed: true,
        timeLimitMinutes: 90,
        instructions: "Timed midterm covering Units 1–2. Answer each question thoroughly in your own words.",
        count: 6,
        units: [1, 2],
        perTopicChars: 1800,
      });
    }
  }
  specs.push({
    kind: "final",
    title: "Final Examination — Comprehensive",
    weekNumber: 4,
    isTimed: true,
    timeLimitMinutes: 120,
    instructions: "Timed comprehensive final covering all four units. Answer each question thoroughly in your own words.",
    count: 8,
    units: [1, 2, 3, 4],
    perTopicChars: 1300,
  });
  return specs;
}

function loadAssignments(): Assignment[] {
  if (existsSync(ASSIGN_OUT)) {
    try {
      const data = JSON.parse(readFileSync(ASSIGN_OUT, "utf8")) as Assignment[];
      if (Array.isArray(data)) return data;
    } catch {
      // ignore — will regenerate
    }
  }
  return [];
}

function writeAssignments(byTitle: Map<string, Assignment>): void {
  const order: Record<string, number> = { homework: 0, test: 1, midterm: 2, final: 3 };
  const sorted = [...byTitle.values()].sort(
    (a, b) => a.weekNumber - b.weekNumber || order[a.kind]! - order[b.kind]!,
  );
  writeFileSync(ASSIGN_OUT, JSON.stringify(sorted, null, 2) + "\n");
}

async function runAssignments(topics: Topic[]): Promise<Assignment[]> {
  const specs = assignmentSpecs();
  const existing = loadAssignments();
  // Only treat prior assignments as resumable if they already match the new schema
  // (i.e. one of our generated titles). Legacy content is dropped.
  const validTitles = new Set(specs.map((s) => s.title));
  const byTitle = new Map<string, Assignment>(
    existing.filter((a) => validTitles.has(a.title) && a.problems?.length).map((a) => [a.title, a]),
  );

  const limit = pLimit(CONCURRENCY);
  let done = byTitle.size;
  await Promise.all(
    specs.map((spec) =>
      limit(async () => {
        if (byTitle.has(spec.title)) {
          log(`skip assignment "${spec.title}" (already generated)`);
          return;
        }
        log(`generating assignment "${spec.title}"...`);
        const problems = await generateProblems(spec.count, spec.units, topics, spec.perTopicChars);
        byTitle.set(spec.title, {
          kind: spec.kind,
          title: spec.title,
          weekNumber: spec.weekNumber,
          isTimed: spec.isTimed,
          timeLimitMinutes: spec.timeLimitMinutes,
          instructions: spec.instructions,
          problems,
        });
        writeAssignments(byTitle); // incremental save
        done++;
        log(`  done "${spec.title}" (${problems.length} problems) [${done}/${specs.length}]`);
      }),
    ),
  );

  writeAssignments(byTitle);
  const all = [...byTitle.values()];
  log(`assignments complete: ${all.length} assignments, ${all.reduce((n, a) => n + a.problems.length, 0)} problems`);
  return all;
}

// ---------------- Main ----------------

async function main(): Promise<void> {
  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });
  log(`PHASE=${PHASE} LIMIT=${LIMIT} ONLY=${ONLY?.join(",") ?? "-"} FORCE=${FORCE} CONCURRENCY=${CONCURRENCY}`);

  let topics: Topic[] = [];
  if (PHASE === "lectures" || PHASE === "all") {
    topics = await runLectures();
  } else {
    topics = loadTopics();
  }

  if (PHASE === "assignments" || PHASE === "all") {
    if (topics.length === 0) topics = loadTopics();
    await runAssignments(topics);
  }

  log("ALL DONE");
}

main().catch((err) => {
  console.error("GENERATION FAILED:", err);
  process.exit(1);
});
