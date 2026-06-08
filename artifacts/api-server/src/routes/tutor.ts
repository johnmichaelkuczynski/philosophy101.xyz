import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, lecturesTable } from "@workspace/db";
import { AskTutorBody, AskTutorResponse } from "@workspace/api-zod";
import { chatText, chatJson, FAST_MODEL } from "../lib/ai";
import { questionDesignBlock } from "../lib/questionDesign";

const router: IRouter = Router();

router.get("/tutor/suggestions/:lectureId", async (req, res): Promise<void> => {
  const lectureId = Number(req.params.lectureId);
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

  try {
    const out = await chatJson<{ questions: string[] }>(
      [
        'You are an encouraging college philosophy tutor. Reply as strict JSON of the form {"questions": string[]} with NO other keys.',
        "",
        "You are writing 6 starter prompts a student can bring to you (the tutor) after reading a lecture. These are NOT definition questions and NOT trivia about the reading — they are invitations to DO philosophy together on a concrete case.",
        "",
        questionDesignBlock(),
        "",
        "Each starter prompt must be in the student's first-person voice (e.g. \"Here's a case — help me figure out...\", \"I think X about this situation, am I reasoning correctly?\", \"How would I handle this example...\"), present or set up a concrete situation, and be answerable by anyone who understands the principle — not only someone who read this exact lecture. Keep each to one or two sentences. Cover several different ideas from the lecture (use the lecture only to choose WHICH skills to exercise, never to quote its examples). Inline math uses $...$ if needed.",
      ].join("\n"),
      `LECTURE TITLE: ${lecture.title}\n\nLECTURE BODY (for choosing which skills to exercise — do not quote its examples):\n"""\n${lecture.body}\n"""`,
      FAST_MODEL,
    );
    const questions = Array.isArray(out?.questions)
      ? out.questions.filter((q) => typeof q === "string" && q.trim().length > 0).slice(0, 8)
      : [];
    res.json({ questions });
  } catch {
    res.json({ questions: [] });
  }
});

router.post("/tutor/ask", async (req, res): Promise<void> => {
  const parsed = AskTutorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { message, selectedLectureText } = parsed.data;

  const sys =
    "You are an encouraging college philosophy tutor. Explain step by step, use clear examples and thought experiments, and define key terms (e.g. validity, soundness, a priori, qualia) when they come up. Keep replies short (3-6 sentences) unless the student asks for more detail. Never just give the answer — guide them.";
  const user = selectedLectureText
    ? `Context from the lecture the student is reading:\n"""\n${selectedLectureText}\n"""\n\nStudent question: ${message}`
    : message;

  let text = "";
  try {
    text = await chatText(sys, user);
  } catch {
    text =
      "I'm having trouble reaching the tutor service right now. Try again in a moment, and consider re-reading the relevant section of the lecture.";
  }
  res.json(AskTutorResponse.parse({ text, audioUrl: null }));
});

export default router;
