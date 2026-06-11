import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  useListDiagnosticTests,
  useStartDiagnosticTest,
  useSubmitDiagnosticTest,
  DiagnosticTestSummary,
  DiagnosticTestRun,
  DiagnosticTestResult,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  Stethoscope,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ShieldOff,
} from "lucide-react";

type StartArg = { scope: "pre_course" | "week" | "final"; weekNumber: number | null };

function NoStakesBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-chart-2/30 bg-chart-2/5 p-4">
      <ShieldOff className="w-5 h-5 text-chart-2 mt-0.5 shrink-0" />
      <div className="text-sm">
        <span className="font-semibold">Completely ungraded.</span> Diagnostics never
        affect your grade, carry no penalty, and are{" "}
        <span className="font-semibold">not screened by AI detection</span>. They exist
        only to show you — and only you — what you already understand. Every diagnostic is
        freshly generated each time you take it, so you'll never see the same questions twice.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Catalog                                                            */
/* ------------------------------------------------------------------ */
function CatalogCard({
  test,
  onStart,
}: {
  test: DiagnosticTestSummary;
  onStart: (arg: StartArg) => void;
}) {
  const arg: StartArg = { scope: test.scope, weekNumber: test.weekNumber ?? null };
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-6 gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold">{test.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
          {test.questionCount} Q
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        {test.lastRun ? (
          <span className="text-xs text-muted-foreground">
            Last:{" "}
            <span className="font-semibold text-foreground">
              {Math.round(test.lastRun.scorePercent)}%
            </span>{" "}
            ({test.lastRun.correctCount}/{test.lastRun.totalCount})
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Not taken yet</span>
        )}
        <Button size="sm" onClick={() => onStart(arg)}>
          {test.lastRun ? "Retake (fresh)" : "Start"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Active runner                                                      */
/* ------------------------------------------------------------------ */
function Runner({
  run,
  submitting,
  onSubmit,
  onCancel,
}: {
  run: DiagnosticTestRun;
  submitting: boolean;
  onSubmit: (answers: Record<number, string>) => void;
  onCancel: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const q = run.questions[idx];
  const last = idx === run.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
      <div className="flex justify-between items-start gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Diagnostic · ungraded · no detection
          </span>
          <h1 className="text-2xl font-serif font-bold text-primary">{run.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {idx + 1} of {run.questions.length}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Exit
        </Button>
      </div>

      {q ? (
        <div className="flex flex-col gap-6">
          <div className="prose prose-slate dark:prose-invert max-w-none text-lg">
            <MarkdownRenderer content={q.prompt} />
          </div>

          <textarea
            value={answers[q.id] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
            }
            placeholder="Write your answer in your own words…"
            className="w-full resize-y rounded-md border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary min-h-[180px]"
            data-testid="input-diagnostic-answer"
          />

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIdx((p) => Math.max(0, p - 1))}
              disabled={idx === 0}
            >
              Previous
            </Button>
            {last ? (
              <Button
                onClick={() => onSubmit(answers)}
                disabled={submitting}
                className="bg-chart-2 hover:bg-chart-2/90 text-white"
                data-testid="button-submit-diagnostic"
              >
                {submitting ? "Checking…" : "Submit for feedback"}
              </Button>
            ) : (
              <Button onClick={() => setIdx((p) => Math.min(run.questions.length - 1, p + 1))}>
                Next
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div>Question not found.</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Results                                                            */
/* ------------------------------------------------------------------ */
function Results({
  title,
  result,
  onRetake,
  onDone,
}: {
  title: string;
  result: DiagnosticTestResult;
  onRetake: () => void;
  onDone: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Diagnostic · ungraded
          </span>
          <h1 className="text-3xl font-serif font-bold text-primary mt-1">
            {title} — Results
          </h1>
          <p className="text-muted-foreground">
            {result.correctCount}/{result.totalCount} on target ·{" "}
            {Math.round(result.scorePercent)}%
          </p>
        </div>
        <Button variant="outline" onClick={onDone}>
          Back to Diagnostics
        </Button>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
        <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <span>
          This was just a check-in — nothing here counts against you. Use the feedback to
          decide what to review, then retake for a brand-new set of questions whenever you like.
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {result.results.map((r, i) => (
          <div
            key={r.questionId}
            className={`p-6 rounded-lg border ${
              r.correct
                ? "border-chart-2/50 bg-chart-2/5"
                : "border-chart-4/50 bg-chart-4/5"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                {r.correct ? (
                  <CheckCircle2 className="w-4 h-4 text-chart-2" />
                ) : (
                  <XCircle className="w-4 h-4 text-chart-4" />
                )}
                Question {i + 1}
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  r.correct
                    ? "bg-chart-2/20 text-chart-2"
                    : "bg-chart-4/20 text-chart-4"
                }`}
              >
                {r.correct ? "On target" : "Keep working"}
              </span>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none text-sm mb-4">
              <MarkdownRenderer content={r.prompt} />
            </div>

            <div className="mb-4 rounded-md bg-background/60 p-4 border border-border">
              <span className="text-sm font-semibold text-primary">Feedback:</span>
              <div className="mt-1 text-sm">
                <MarkdownRenderer content={r.feedback} />
              </div>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-primary">
                Show a model answer
              </summary>
              <div className="mt-2 text-sm space-y-2">
                <MarkdownRenderer content={r.correctAnswer} />
                {r.explanation && (
                  <p className="text-xs text-muted-foreground italic">{r.explanation}</p>
                )}
              </div>
            </details>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 justify-center border-t pt-6">
        <Button onClick={onRetake}>Retake (new questions)</Button>
        <Button variant="outline" onClick={onDone}>
          Back to Diagnostics
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function DiagnosticTests() {
  const list = useListDiagnosticTests();
  const start = useStartDiagnosticTest();
  const submit = useSubmitDiagnosticTest();

  const [run, setRun] = useState<DiagnosticTestRun | null>(null);
  const [result, setResult] = useState<DiagnosticTestResult | null>(null);
  const [lastArg, setLastArg] = useState<StartArg | null>(null);

  function startTest(arg: StartArg) {
    setResult(null);
    setRun(null);
    setLastArg(arg);
    start.mutate(
      { data: { scope: arg.scope, weekNumber: arg.weekNumber ?? undefined } },
      { onSuccess: (data) => setRun(data) },
    );
  }

  function handleSubmit(answers: Record<number, string>) {
    if (!run) return;
    submit.mutate(
      {
        runId: run.runId,
        data: {
          answers: run.questions.map((q) => ({
            questionId: q.id,
            answer: answers[q.id] ?? "",
          })),
        },
      },
      { onSuccess: (data) => setResult(data) },
    );
  }

  function reset() {
    setRun(null);
    setResult(null);
    setLastArg(null);
    list.refetch();
  }

  /* ---- Generating ---- */
  if (start.isPending) {
    return (
      <Layout>
        <div className="p-8 max-w-2xl mx-auto w-full flex flex-col gap-6 items-center text-center mt-16">
          <div className="text-5xl">🩺</div>
          <h1 className="text-2xl font-serif font-bold text-primary">
            Building you a fresh diagnostic…
          </h1>
          <p className="text-muted-foreground">
            The AI is writing brand-new questions just for this run — different from any you've
            seen before. This is ungraded and never checked by AI detection.
          </p>
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (start.isError && !run) {
    return (
      <Layout>
        <div className="p-8 max-w-2xl mx-auto w-full flex flex-col gap-4 mt-16 text-center">
          <h1 className="text-2xl font-serif font-bold text-destructive">
            Couldn't build the diagnostic
          </h1>
          <p className="text-muted-foreground">
            Something went wrong generating your questions.
          </p>
          <div className="flex gap-3 justify-center">
            {lastArg && <Button onClick={() => startTest(lastArg)}>Try again</Button>}
            <Button variant="outline" onClick={reset}>
              Back to Diagnostics
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ---- Results ---- */
  if (result && run) {
    return (
      <Layout>
        <div className="p-8">
          <Results
            title={run.title}
            result={result}
            onRetake={() => lastArg && startTest(lastArg)}
            onDone={reset}
          />
        </div>
      </Layout>
    );
  }

  /* ---- Active run ---- */
  if (run) {
    return (
      <Layout>
        <div className="p-8">
          <Runner
            run={run}
            submitting={submit.isPending}
            onSubmit={handleSubmit}
            onCancel={reset}
          />
          {submit.isError && (
            <p className="text-sm text-destructive text-center mt-4">
              Couldn't check your answers — {(submit.error as Error).message}. Try again.
            </p>
          )}
        </div>
      </Layout>
    );
  }

  /* ---- Catalog ---- */
  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="font-serif text-3xl mb-1 flex items-center gap-3">
            <Stethoscope className="w-7 h-7 text-primary" />
            Diagnostics
          </h1>
          <p className="text-muted-foreground">
            Low-pressure comprehension checks that gauge where you stand — before, during,
            and after the course.
          </p>
        </div>

        <NoStakesBanner />

        {list.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : list.isError ? (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">
              Couldn't load diagnostics.{" "}
              <button className="text-primary underline" onClick={() => list.refetch()}>
                Retry
              </button>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(list.data?.tests ?? []).map((test) => (
              <CatalogCard
                key={`${test.scope}-${test.weekNumber ?? "x"}`}
                test={test}
                onStart={startTest}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
