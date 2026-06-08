import { chatJson } from "./ai";

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u2212\u2010-\u2015]/g, "-")
    .replace(/[$,]/g, "")
    .replace(/[)(\[\]{}]/g, "")
    .replace(/\s*=\s*/g, "=");
}

function asNumber(s: string): number | null {
  const cleaned = s.replace(/[$,%\s]/g, "").replace(/[\u2212]/g, "-");
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) return parseFloat(cleaned);
  const frac = cleaned.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac) {
    const n = parseFloat(frac[1]!);
    const d = parseFloat(frac[2]!);
    if (d !== 0) return n / d;
  }
  return null;
}

export async function gradeAnswer(opts: {
  prompt: string;
  correctAnswer: string;
  userAnswer: string;
}): Promise<{ correct: boolean; explanation: string }> {
  const user = opts.userAnswer ?? "";
  const correct = opts.correctAnswer ?? "";

  if (normalize(user) === normalize(correct)) {
    return {
      correct: true,
      explanation: `Correct. ${correct}`,
    };
  }

  const u = asNumber(user);
  const c = asNumber(correct);
  if (u != null && c != null) {
    const tol = Math.max(0.01, Math.abs(c) * 0.01);
    if (Math.abs(u - c) <= tol) {
      return { correct: true, explanation: `Correct. The expected answer is ${correct}.` };
    }
  }

  try {
    const out = await chatJson<{ correct: boolean; explanation: string }>(
      "You grade college Philosophy 101 short-answer/essay responses against a model answer. These are substantive questions that ask the student to explain, distinguish, or argue in a few sentences. Mark the answer correct if it captures the central point(s) and reasoning of the model answer — accept paraphrases, synonyms, different but valid examples, and answers that omit minor secondary details, as long as the main thesis and key justification are present and accurate. Mark it incorrect if it misses or misstates the central point, is vacuous/off-topic, or asserts the conclusion with no relevant reasoning. Be lenient about wording and phrasing but strict about substantive understanding. Output strict JSON {\"correct\": boolean, \"explanation\": string} where explanation is 1-3 short sentences of feedback that names what was right or missing and states the key idea of the correct answer.",
      JSON.stringify({
        prompt: opts.prompt,
        correct_answer: correct,
        student_answer: user,
      }),
    );
    return {
      correct: !!out.correct,
      explanation: out.explanation || `The correct answer is ${correct}.`,
    };
  } catch {
    return {
      correct: false,
      explanation: `The correct answer is ${correct}.`,
    };
  }
}

export async function gradeAnswerRich(opts: {
  prompt: string;
  correctAnswer: string;
  userAnswer: string;
}): Promise<{ correct: boolean; feedback: string }> {
  const user = (opts.userAnswer ?? "").trim();
  const correct = opts.correctAnswer ?? "";

  if (user.length === 0) {
    return {
      correct: false,
      feedback:
        "You left this one blank. In practice that's fine — but try writing even a rough attempt next time. Here's the key idea to aim for: " +
        correct,
    };
  }

  try {
    const out = await chatJson<{
      correct: boolean;
      whatYouGotRight: string;
      whatsMissing: string;
      nextStep: string;
    }>(
      "You are a warm, rigorous college Philosophy 101 tutor grading a student's PRACTICE answer (no stakes — your job is to teach, not to punish). Compare the student's answer to the model answer. Mark `correct` true if the answer captures the central point(s) and reasoning of the model answer (accept paraphrases, synonyms, different but valid examples, omission of minor details); mark false if it misses/misstates the central point, is vacuous, or asserts a conclusion with no relevant reasoning. Then write GENEROUS, specific feedback in three fields: `whatYouGotRight` (1-2 sentences naming concretely what the student did well, or what part of the idea they touched even if wrong — never empty), `whatsMissing` (1-3 sentences naming precisely the gap or error and the correct idea), and `nextStep` (1 sentence: a concrete thing to do or a question to consider to improve). Be encouraging and concrete, never generic. Output strict JSON {\"correct\": boolean, \"whatYouGotRight\": string, \"whatsMissing\": string, \"nextStep\": string}.",
      JSON.stringify({
        prompt: opts.prompt,
        model_answer: correct,
        student_answer: user,
      }),
    );
    const parts: string[] = [];
    if (out.whatYouGotRight?.trim())
      parts.push(`**What you got right:** ${out.whatYouGotRight.trim()}`);
    if (out.whatsMissing?.trim())
      parts.push(`**What's missing or off:** ${out.whatsMissing.trim()}`);
    if (out.nextStep?.trim())
      parts.push(`**Next step:** ${out.nextStep.trim()}`);
    return {
      correct: !!out.correct,
      feedback: parts.join("\n\n") || `The key idea to aim for: ${correct}`,
    };
  } catch {
    return {
      correct: false,
      feedback: `I couldn't reach the grader just now. Compare your answer to the key idea and try again: ${correct}`,
    };
  }
}
