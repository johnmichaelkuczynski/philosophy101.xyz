import { Link } from "wouter";
import {
  Scale,
  BookOpen,
  MessagesSquare,
  Target,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Three-Depth Lectures",
    body: "Read any topic Short, Medium, or Long — same examples, your pace.",
  },
  {
    icon: MessagesSquare,
    title: "Section-Scoped Tutor",
    body: "Ask about the exact passage you're on and get a live, grounded answer.",
  },
  {
    icon: Target,
    title: "Adaptive Practice",
    body: "Problems that get harder on a streak and ease off after a miss.",
  },
  {
    icon: ClipboardCheck,
    title: "AI-Graded Work",
    body: "Homework, tests, a midterm, and a final — each with written feedback.",
  },
  {
    icon: ShieldCheck,
    title: "Built-In Integrity",
    body: "Every submission is screened for AI authorship, with a clear verdict.",
  },
  {
    icon: Scale,
    title: "Four Units, 29 Topics",
    body: "From how to argue to what exists, the mind, God, and how to live.",
  },
];

const units = [
  { n: 1, title: "Logic and Critical Reasoning" },
  { n: 2, title: "Knowledge and Reality" },
  { n: 3, title: "Philosophy of Mind" },
  { n: 4, title: "Metaphysics, God, and Ethics" },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-serif font-bold text-sm">
            101
          </div>
          <span className="font-serif font-semibold text-lg tracking-tight">
            Philosophy 101
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <button
              className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors"
              data-testid="button-sign-in"
            >
              Sign in
            </button>
          </Link>
          <Link href="/sign-up">
            <button
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              data-testid="button-sign-up"
            >
              Get started
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-6">
            <Scale className="w-3.5 h-3.5" />
            A four-unit college Philosophy 101 course
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary leading-tight mb-5">
            Read the idea. Ground the idea. Write the idea.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            A self-paced Philosophy 101 course that teaches, tutors, drills, and
            grades you — from how to build an argument all the way to what exists,
            what minds are, and how we ought to live.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/sign-up">
              <button
                className="px-6 py-3 rounded-md text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                data-testid="button-cta-start"
              >
                Sign in with Google to start
              </button>
            </Link>
            <Link href="/sign-in">
              <button
                className="px-6 py-3 rounded-md text-base font-medium border border-border hover:bg-secondary transition-colors"
                data-testid="button-cta-signin"
              >
                I already have an account
              </button>
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-border bg-card p-6 flex flex-col gap-3"
              >
                <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-primary">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 pb-24">
          <h2 className="text-center font-serif font-semibold text-xl mb-6">
            The Curriculum
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {units.map((u) => (
              <div
                key={u.n}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-5"
              >
                <div className="w-10 h-10 shrink-0 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold">
                  {u.n}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Unit {u.n}
                  </div>
                  <div className="font-medium">{u.title}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        Philosophy 101 — where the curriculum, the tutor, the grader, and the
        integrity check all live in one room.
      </footer>
    </div>
  );
}
