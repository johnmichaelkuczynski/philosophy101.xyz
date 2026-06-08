/**
 * Canonical question-design rules, shared by EVERY question generator in the
 * app (tutor starter questions, per-topic practice drills, practice-assignment
 * problems). One source of truth so all questions share the same philosophy:
 *
 *   A good question makes the student DO philosophy on a concrete case — never
 *   recite a memorized definition, and never depend on having read one specific
 *   text.
 */

export const QUESTION_RULES = `RULES FOR THE QUESTION (these are absolute):
1. CONCRETE SCENARIO. The question must center on a specific, concrete case you invent: a short argument, a claim someone makes, an exchange between two people, an example, or a situation. The student reasons about THAT case.
2. APPLICATION, NOT RECALL. The task is to APPLY a principle to the case — diagnose what has gone wrong, decide what follows, judge whether an inference holds, defend or attack a position, construct a counterexample, or fix a flawed argument. Understanding is demonstrated by what the student DOES with the principle, not by stating it.
3. NEVER ASK FOR A DEFINITION. Do NOT write "what is X", "define X", "explain what X is", "what is X trying to do", "describe the concept of X", or "explain the difference between X and Y" as the task. A student must not be able to answer by reciting a memorized definition. (It is fine if applying the principle REQUIRES knowing a definition — but the definition must be the tool, never the deliverable.)
4. TEXT-INDEPENDENT. Invent your OWN fresh scenario. NEVER reference an example, name, character, or case from any particular lecture or reading (e.g. do not mention "the rabbit from the text"). Anyone who genuinely understands the principle must be able to answer WITHOUT having read any specific lecture.
5. SELF-CONTAINED. State the whole case inside the question so it can be answered with no other materials in front of the student. There may be more than one defensible answer; what is judged is the quality of the reasoning.`;

export const BANNED_QUESTION_PATTERNS = `BANNED — never write any of these:
- "What is X?" / "Define X" / "Explain what X is" / "What is X trying to do?" / "Describe X" / "Explain the difference between X and Y" as the task itself.
- One-word, yes/no, true/false, or fill-in-the-term answers.
- "Name the fallacy" / "what is the technical term for..." / any pure labeling task.
- Vague interpretive guessing: "what is this person primarily/mainly doing?", "what best describes...".
- Anything answerable by reciting a textbook definition, or anything that references a specific lecture's own examples.`;

/**
 * A worked example of the transformation we want, to anchor the model.
 */
export const QUESTION_TRANSFORM_EXAMPLE = `TRANSFORMATION EXAMPLE (do this kind of move):
- BAD (definition recall): "Explain the difference between validity and soundness."
- GOOD (concrete application): "A friend says: 'My argument has to be true — every step follows logically from the last!' Their reasoning is indeed airtight in form, but you suspect the conclusion is false. Explain how that is possible, and tell your friend exactly what they would need to check to know whether the conclusion is actually true."
- BAD (definition recall): "What is the ad hominem fallacy?"
- GOOD (concrete application): "In a debate, Sam responds to Dana's argument for a carbon tax by pointing out that Dana flies on private jets. Sam claims this defeats Dana's argument. Say whether Sam's response gives any reason to reject the argument's conclusion, and defend your verdict."`;

/** Assemble the full design block for a generator prompt. */
export function questionDesignBlock(): string {
  return [QUESTION_RULES, "", BANNED_QUESTION_PATTERNS, "", QUESTION_TRANSFORM_EXAMPLE].join("\n");
}
