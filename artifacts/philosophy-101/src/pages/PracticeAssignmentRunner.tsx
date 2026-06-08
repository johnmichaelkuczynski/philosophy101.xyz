import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "wouter";
import {
  useGeneratePracticeAssignment,
  useSubmitPracticeAssignment,
  useDiscussPracticeFeedback,
  useAskTutor,
  PracticeAssignment,
  PracticeAssignmentResult,
  KeystrokeTrace,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnswerInput } from "@/components/AnswerInput";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

type ChatTurn = { role: "user" | "tutor"; text: string };

/* ------------------------------------------------------------------ */
/* Live tutor pane — visible THROUGHOUT practice (never during graded) */
/* ------------------------------------------------------------------ */
function LiveTutorPane({ problemPrompt }: { problemPrompt?: string }) {
  const ask = useAskTutor();
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history, ask.isPending]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setHistory((h) => [...h, { role: "user", text }]);
    ask.mutate(
      {
        data: {
          message: text,
          selectedLectureText: problemPrompt
            ? `The student is working on this practice problem:\n${problemPrompt}`
            : undefined,
        },
      },
      {
        onSuccess: (res) =>
          setHistory((h) => [...h, { role: "tutor", text: res.text }]),
        onError: (e) =>
          setHistory((h) => [
            ...h,
            { role: "tutor", text: `Tutor error: ${(e as Error).message}` },
          ]),
      },
    );
  }

  return (
    <div className="flex flex-col h-full border border-border rounded-lg bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-secondary/50">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
          <h3 className="font-serif font-semibold text-sm">Live Tutor</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Stuck? Ask for a hint or a nudge — I'm here the whole time you practice.
        </p>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[200px]">
        {history.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Try: "I don't know where to start" or "Is my reasoning on the right track?"
          </p>
        )}
        {history.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg px-3 py-2 max-w-[92%] ${
              m.role === "user"
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-secondary text-secondary-foreground"
            }`}
          >
            {m.role === "tutor" ? <MarkdownRenderer content={m.text} /> : m.text}
          </div>
        ))}
        {ask.isPending && (
          <div className="self-start text-sm text-muted-foreground italic">Tutor is thinking…</div>
        )}
      </div>
      <div className="p-3 border-t flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask the tutor…"
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[42px] max-h-28"
          rows={1}
        />
        <Button size="sm" onClick={send} disabled={ask.isPending || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Per-problem discussion thread on the feedback                       */
/* ------------------------------------------------------------------ */
function DiscussThread({
  practiceId,
  problemId,
}: {
  practiceId: number;
  problemId: number;
}) {
  const discuss = useDiscussPracticeFeedback();
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setHistory((h) => [...h, { role: "user", text }]);
    discuss.mutate(
      { practiceId, data: { problemId, message: text } },
      {
        onSuccess: (res) =>
          setHistory((h) => [...h, { role: "tutor", text: res.reply }]),
        onError: (e) =>
          setHistory((h) => [
            ...h,
            { role: "tutor", text: `Tutor error: ${(e as Error).message}` },
          ]),
      },
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 text-sm font-medium text-primary hover:underline"
      >
        💬 Discuss this feedback with the tutor
      </button>
    );
  }

  return (
    <div className="mt-4 border-t pt-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {history.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg px-3 py-2 max-w-[92%] ${
              m.role === "user"
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-secondary text-secondary-foreground"
            }`}
          >
            {m.role === "tutor" ? <MarkdownRenderer content={m.text} /> : m.text}
          </div>
        ))}
        {discuss.isPending && (
          <div className="self-start text-sm text-muted-foreground italic">Tutor is thinking…</div>
        )}
        {history.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Ask why your answer was marked the way it was, or push back if you disagree.
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask about this feedback…"
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[42px] max-h-28"
          rows={1}
        />
        <Button size="sm" onClick={send} disabled={discuss.isPending || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main runner                                                         */
/* ------------------------------------------------------------------ */
export default function PracticeAssignmentRunner() {
  const params = useParams();
  const assignmentId = Number(params.id);

  const generate = useGeneratePracticeAssignment();
  const submit = useSubmitPracticeAssignment();

  const [practice, setPractice] = useState<PracticeAssignment | null>(null);
  const [result, setResult] = useState<PracticeAssignmentResult | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answer: string; trace: KeystrokeTrace }>>({});
  const startedRef = useRef(false);

  function startPractice() {
    setPractice(null);
    setResult(null);
    setIdx(0);
    setAnswers({});
    generate.mutate(
      { assignmentId },
      { onSuccess: (data) => setPractice(data) },
    );
  }

  useEffect(() => {
    if (assignmentId && !startedRef.current) {
      startedRef.current = true;
      startPractice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  function handleAnswerChange(problemId: number, val: string, trace: KeystrokeTrace) {
    setAnswers((prev) => ({ ...prev, [problemId]: { answer: val, trace } }));
  }

  function handleSubmit() {
    if (!practice) return;
    submit.mutate(
      {
        practiceId: practice.id,
        data: {
          answers: practice.problems.map((p) => ({
            problemId: p.id,
            answer: answers[p.id]?.answer ?? "",
            trace: answers[p.id]?.trace,
          })),
        },
      },
      { onSuccess: (data) => setResult(data) },
    );
  }

  /* ---- Generating state ---- */
  if (generate.isPending || (!practice && !generate.isError)) {
    return (
      <Layout>
        <div className="p-8 max-w-2xl mx-auto w-full flex flex-col gap-6 items-center text-center mt-16">
          <div className="text-5xl">📝</div>
          <h1 className="text-2xl font-serif font-bold text-primary">
            Building you a fresh practice set…
          </h1>
          <p className="text-muted-foreground">
            The AI is writing brand-new problems that test the same skills as the real assignment.
            Every practice run is unique — and unlimited.
          </p>
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (generate.isError || !practice) {
    return (
      <Layout>
        <div className="p-8 max-w-2xl mx-auto w-full flex flex-col gap-4 mt-16 text-center">
          <h1 className="text-2xl font-serif font-bold text-destructive">
            Couldn't generate practice
          </h1>
          <p className="text-muted-foreground">Something went wrong building your practice set.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={startPractice}>Try again</Button>
            <Link href="/assignments">
              <Button variant="outline">Back to Assignments</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  /* ---- Results / rich feedback state ---- */
  if (result) {
    return (
      <Layout>
        <div className="p-8 max-w-3xl mx-auto w-full flex flex-col gap-8">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Practice · no stakes
              </span>
              <h1 className="text-3xl font-serif font-bold text-primary mt-1">
                {practice.title} — Feedback
              </h1>
              <p className="text-muted-foreground">
                {result.score}/{result.total} on target · {Math.round(result.percent)}%
              </p>
            </div>
            <Link href="/assignments">
              <Button variant="outline">Back to Assignments</Button>
            </Link>
          </div>

          {result.encouragement && (
            <div className="p-5 rounded-lg bg-chart-2/10 border border-chart-2/30">
              <MarkdownRenderer content={result.encouragement} />
            </div>
          )}

          <div className="flex flex-col gap-6">
            {result.perProblem.map((pr, i) => {
              const problem = practice.problems.find((p) => p.id === pr.problemId);
              return (
                <div
                  key={pr.problemId}
                  className={`p-6 rounded-lg border ${
                    pr.correct
                      ? "border-chart-2/50 bg-chart-2/5"
                      : "border-chart-4/50 bg-chart-4/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Problem {i + 1}</h3>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        pr.correct
                          ? "bg-chart-2/20 text-chart-2"
                          : "bg-chart-4/20 text-chart-4"
                      }`}
                    >
                      {pr.correct ? "On target" : "Keep working"}
                    </span>
                  </div>

                  {problem && (
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm mb-4">
                      <MarkdownRenderer content={problem.prompt} />
                    </div>
                  )}

                  <div className="mb-4">
                    <span className="text-sm font-semibold">Your answer:</span>
                    <div className="mt-1 text-sm whitespace-pre-wrap">
                      {pr.userAnswer || <em className="text-muted-foreground">No answer</em>}
                    </div>
                  </div>

                  <div className="mb-4 rounded-md bg-background/60 p-4 border border-border">
                    <span className="text-sm font-semibold text-primary">Feedback:</span>
                    <div className="mt-1 text-sm">
                      <MarkdownRenderer content={pr.feedback} />
                    </div>
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold text-primary">
                      Show a model answer
                    </summary>
                    <div className="mt-2 text-sm">
                      <MarkdownRenderer content={pr.modelAnswer} />
                    </div>
                  </details>

                  <DiscussThread practiceId={practice.id} problemId={pr.problemId} />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 justify-center border-t pt-6">
            <Button onClick={startPractice}>Practice again (new problems)</Button>
            <Link href={`/assignments/${assignmentId}`}>
              <Button variant="outline">I'm ready — take the graded version</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  /* ---- Active practice state (live tutor visible) ---- */
  const currentProblem = practice.problems[idx];

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Main column */}
        <div className="flex flex-col gap-6 pb-24">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Practice · unlimited · no stakes
              </span>
              <h1 className="text-2xl font-serif font-bold text-primary">{practice.title}</h1>
              <p className="text-sm text-muted-foreground">
                Problem {idx + 1} of {practice.problems.length}
              </p>
            </div>
          </div>

          {currentProblem ? (
            <div className="flex flex-col gap-8">
              <div className="prose prose-slate dark:prose-invert max-w-none text-lg">
                <MarkdownRenderer content={currentProblem.prompt} />
              </div>

              <AnswerInput
                value={answers[currentProblem.id]?.answer || ""}
                onChange={(val, trace) => handleAnswerChange(currentProblem.id, val, trace)}
              />

              <div className="flex justify-between mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIdx((p) => Math.max(0, p - 1))}
                  disabled={idx === 0}
                >
                  Previous
                </Button>
                {idx < practice.problems.length - 1 ? (
                  <Button onClick={() => setIdx((p) => Math.min(practice.problems.length - 1, p + 1))}>
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="bg-chart-2 hover:bg-chart-2/90 text-white"
                    disabled={submit.isPending}
                  >
                    {submit.isPending ? "Grading…" : "Submit for feedback"}
                  </Button>
                )}
              </div>

              {submit.isError && (
                <p className="text-sm text-destructive text-right">
                  Couldn't grade your practice — {(submit.error as Error).message}. Try submitting again.
                </p>
              )}
            </div>
          ) : (
            <div>Problem not found.</div>
          )}
        </div>

        {/* Live tutor sidebar — sticky, always visible during practice */}
        <div className="lg:sticky lg:top-6 h-[calc(100vh-8rem)]">
          <LiveTutorPane problemPrompt={currentProblem?.prompt} />
        </div>
      </div>
    </Layout>
  );
}
