import { db } from "@workspace/db";
import {
  topicsTable,
  lecturesTable,
  assignmentsTable,
  problemsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

type SeedTopic = {
  slug: string;
  title: string;
  weekNumber: number;
  blurb: string;
  lectureTitle: string;
  body: string;
};

const TOPICS: SeedTopic[] = [
  // Unit 1 — Logic and Critical Reasoning
  {
    slug: "what-is-philosophy",
    title: "What is philosophy?",
    weekNumber: 1,
    blurb: "The activity of reasoned inquiry into fundamental questions.",
    lectureTitle: "1.1 What is philosophy?",
    body: `# What is philosophy?

The word **philosophy** comes from the Greek *philosophia* — "love of wisdom." But that etymology only points at the activity; it does not define it.

## Philosophy as reasoned inquiry

Philosophy is the discipline that asks **fundamental questions** and tries to answer them through **careful reasoning** rather than through experiment, revelation, or authority. Its questions are the ones that lie underneath the other disciplines: *What can we know? What exists? What is a mind? What makes an action right? What is justice?*

Other fields can take certain things for granted. A physicist assumes there is an external world to measure; a historian assumes some testimony is reliable. Philosophy steps back and examines the assumptions themselves.

## How philosophy differs from neighboring fields

- **From science:** science settles questions by observation and experiment. Philosophy works on questions where no experiment can decide the issue — what *counts* as knowledge, or whether we have free will.
- **From religion:** religion may answer fundamental questions by appeal to faith or sacred authority. Philosophy insists the answer be supported by reasons anyone could in principle evaluate.
- **From mere opinion:** everyone has opinions about right and wrong. Philosophy demands that those opinions be defended with **arguments** and tested against objections.

## The four areas of this course

Most introductory philosophy is organized around four families of questions, which structure this course:

1. **Logic and critical reasoning** — how to argue well.
2. **Epistemology** — what and how we can know.
3. **Philosophy of mind** — what minds are.
4. **Metaphysics and ethics** — what exists, whether God exists, and how we ought to live.

The common thread is **argument**: a philosophical claim is only as good as the reasoning offered for it. That is why we begin with logic.`,
  },
  {
    slug: "arguments-premises-conclusions",
    title: "Arguments, premises, and conclusions",
    weekNumber: 1,
    blurb: "The basic anatomy of an argument.",
    lectureTitle: "1.2 Arguments, premises, and conclusions",
    body: `# Arguments, premises, and conclusions

In ordinary speech an "argument" is a quarrel. In philosophy an **argument** is something different and constructive: a set of statements in which some (the **premises**) are offered as **reasons to believe** another (the **conclusion**).

## Statements

The building blocks are **statements** (or *propositions*) — sentences that are either true or false. "Socrates is mortal" is a statement. "Shut the door" and "What time is it?" are not, because they are not the kind of thing that can be true or false.

## Premises and conclusion

- A **premise** is a statement offered in support.
- The **conclusion** is the statement the premises are meant to establish.

The classic example:

1. All humans are mortal. *(premise)*
2. Socrates is a human. *(premise)*
3. Therefore, Socrates is mortal. *(conclusion)*

## Spotting the structure

Certain words signal the parts of an argument:

- **Conclusion indicators:** *therefore, thus, hence, so, it follows that.*
- **Premise indicators:** *because, since, given that, for, as.*

These signposts help you find the conclusion (what is being claimed) and separate it from the premises (the support).

## Arguments vs. assertions

Simply asserting a claim is not arguing for it. "Capital punishment is wrong" is an assertion. It becomes an argument only when reasons are attached: "Capital punishment is wrong *because* it risks executing the innocent, and the state should never knowingly risk killing an innocent person." The discipline of philosophy is the discipline of always asking, of any claim, **"What is the argument?"**`,
  },
  {
    slug: "validity-soundness",
    title: "Validity and soundness",
    weekNumber: 1,
    blurb: "Two standards for evaluating deductive arguments.",
    lectureTitle: "1.3 Validity and soundness",
    body: `# Validity and soundness

To evaluate a deductive argument we ask two separate questions: is it **valid**, and is it **sound**?

## Validity

An argument is **valid** when *if the premises were true, the conclusion would have to be true*. Validity is about the **logical structure** — the connection between premises and conclusion — not about whether the premises are actually true.

Validity is hypothetical: it says the truth of the premises would *guarantee* the truth of the conclusion. A valid argument cannot have all true premises and a false conclusion at the same time.

## A valid argument with false premises

Consider:

1. All fish can fly.
2. All salmon are fish.
3. Therefore, all salmon can fly.

Premise 1 is false, so the conclusion is false. Yet the argument is **valid**: *if* the premises were true, the conclusion would have to be true. Validity is purely about form.

## Soundness

An argument is **sound** when it is **both valid and has all true premises**. A sound argument therefore *must* have a true conclusion — that is exactly what makes soundness the gold standard.

The salmon argument is valid but **unsound** (premise 1 is false). The Socrates argument from the last section is valid *and* has true premises, so it is sound.

## Why the distinction matters

Two different things can go wrong with an argument:

- The **form** is broken — the premises don't actually support the conclusion (invalid).
- The form is fine but a **premise is false** (unsound despite being valid).

A good critic identifies *which* problem an argument has. To refute a valid argument you must reject one of its premises; attacking the conclusion directly is not enough.`,
  },
  {
    slug: "deductive-inductive",
    title: "Deductive vs. inductive reasoning",
    weekNumber: 1,
    blurb: "Conclusive proof vs. reasoning that raises probability.",
    lectureTitle: "1.4 Deductive vs. inductive reasoning",
    body: `# Deductive vs. inductive reasoning

There are two broad kinds of argument, distinguished by **how strongly** the premises are meant to support the conclusion.

## Deductive reasoning

In a **deductive** argument, the premises are meant to *guarantee* the conclusion. If the argument is valid and the premises are true, the conclusion is **certain**. Deduction is the logic of mathematics and formal proof.

> All bachelors are unmarried. John is a bachelor. Therefore, John is unmarried.

There is no possible way for the premises to be true and the conclusion false.

## Inductive reasoning

In an **inductive** argument, the premises are meant to make the conclusion **probable**, not certain. Good induction gives you strong reasons, but the conclusion could still turn out false even if the premises are true.

> Every swan anyone has observed has been white. Therefore, all swans are white.

For centuries this looked compelling — until black swans were discovered in Australia. The premises were true and the conclusion false. That is the signature of induction: it goes **beyond** the evidence.

## Strong vs. weak (not valid vs. invalid)

We don't call inductive arguments "valid" or "invalid." We call them **strong** or **weak**, depending on how probable the premises make the conclusion. A strong inductive argument with true premises is called **cogent**.

## Where each is used

- **Deduction:** mathematics, logic, and many philosophical arguments aiming for proof.
- **Induction:** science, everyday prediction, and reasoning from samples to general claims.

Most real-world reasoning — including most scientific reasoning — is inductive. Recognizing which kind you are dealing with tells you what standard to hold it to: certainty for deduction, probability for induction.`,
  },
  {
    slug: "logical-fallacies",
    title: "Common logical fallacies",
    weekNumber: 1,
    blurb: "Recurring patterns of bad reasoning.",
    lectureTitle: "1.5 Common logical fallacies",
    body: `# Common logical fallacies

A **fallacy** is a recurring *error in reasoning* — an argument that may feel persuasive but does not actually support its conclusion. Learning the standard fallacies lets you name what has gone wrong.

## Formal vs. informal fallacies

- A **formal fallacy** is a flaw in the logical *structure* (e.g., affirming the consequent: "If it rained, the ground is wet; the ground is wet; therefore it rained" — the ground could be wet for other reasons).
- An **informal fallacy** is a flaw in the *content or context*, even when the form looks fine.

## A starter catalog of informal fallacies

- **Ad hominem:** attacking the person instead of the argument. "You can't trust her economics — she's been divorced twice."
- **Straw man:** distorting an opponent's view into a weaker one, then refuting that. 
- **Appeal to authority (illegitimate):** citing an authority outside their expertise, or a non-expert.
- **Appeal to popularity (*ad populum*):** "Most people believe it, so it's true."
- **False dilemma:** presenting two options as if they were the only ones. "Either we cut the program or we go bankrupt."
- **Slippery slope:** claiming one small step must inevitably lead to an extreme outcome, with no argument for the chain.
- **Begging the question:** assuming the conclusion in the premises (circular reasoning).
- **Appeal to ignorance:** "No one has proven it false, so it's true."
- **Hasty generalization:** drawing a sweeping conclusion from too small a sample.

## Why naming them matters

Fallacies are common precisely because they are *psychologically* persuasive — they exploit emotion, loyalty, or impatience. Putting a name to the move ("that's a straw man") is the first step to dismantling it. But a caution: pointing out that an argument *contains* a fallacy shows the argument fails, **not** that its conclusion is false. A badly argued claim might still be true for other reasons.`,
  },
  {
    slug: "reconstructing-arguments",
    title: "Reading and reconstructing arguments",
    weekNumber: 1,
    blurb: "Extracting and charitably rebuilding an argument from a text.",
    lectureTitle: "1.6 Reading and reconstructing arguments",
    body: `# Reading and reconstructing arguments

Real arguments rarely arrive in tidy premise-conclusion form. They are buried in paragraphs, with steps left unstated. **Reconstruction** is the skill of pulling the argument out and laying it bare.

## The steps of reconstruction

1. **Find the conclusion.** What is the author ultimately trying to convince you of? Look for conclusion indicators.
2. **List the premises.** What reasons are given? Strip away rhetoric, examples, and repetition.
3. **Supply hidden premises.** Many arguments rely on an **unstated assumption** (a *suppressed premise*) needed to make the reasoning work.
4. **Put it in standard form.** Number the premises, then the conclusion.

## Hidden premises

Consider: "Socrates is human, so Socrates is mortal." As stated this is not valid — it needs the suppressed premise *"All humans are mortal."* A fair reconstruction makes such assumptions explicit, because hidden premises are often where an argument is weakest.

## The principle of charity

When more than one reading is possible, the **principle of charity** says to interpret the argument in its **strongest plausible form**. Don't saddle an author with an obviously stupid premise if a reasonable one was clearly intended. Charity is not naivety — it makes your eventual criticism *stronger*, because you have defeated the best version, not a straw man.

## Why it matters

Reconstruction turns a vague passage into something you can evaluate with the tools of the previous sections — validity, soundness, strength. You cannot fairly judge an argument until you have stated it clearly. Most philosophical disputes that seem hopeless dissolve, or sharpen into a real disagreement, once both sides' arguments are reconstructed side by side.`,
  },
  {
    slug: "philosophical-method",
    title: "Philosophical method and analysis",
    weekNumber: 1,
    blurb: "Thought experiments, counterexamples, and conceptual analysis.",
    lectureTitle: "1.7 Philosophical method and analysis",
    body: `# Philosophical method and analysis

Philosophy has its own toolkit. Beyond constructing and evaluating arguments, philosophers use a handful of characteristic moves to test ideas.

## Conceptual analysis

Much philosophy aims to **analyze a concept** — to state the conditions something must meet to fall under it. A classic target: *knowledge*. The proposed analysis "knowledge = justified true belief" says a person knows that P if and only if (i) P is true, (ii) they believe P, and (iii) they are justified in believing P. Analysis tries to make our implicit concepts explicit.

## Counterexamples

The standard way to test an analysis or a general claim is to hunt for a **counterexample** — a single case that satisfies the proposed conditions but clearly isn't an instance of the concept (or vice versa). One good counterexample can refute a universal claim. (As we'll see, Gettier cases are exactly counterexamples to "knowledge = justified true belief.")

## Thought experiments

A **thought experiment** is an imagined scenario designed to isolate an intuition. You can't build a teleporter, but you can *imagine* one and ask: would the person who steps out be the same person? Thought experiments — the brain in a vat, the trolley problem, Mary the color scientist — let philosophers run "experiments" that no laboratory could.

## Reflective equilibrium

Philosophers move back and forth between **general principles** and **particular judgments**, adjusting each to fit the other until they reach a stable, coherent fit — a state called **reflective equilibrium**. If a principle clashes with a strong intuition, you must either revise the principle or give up the intuition, with reasons either way.

## The temperament

Underneath the methods is an attitude: take **every** claim, including your own, as something to be questioned; follow the argument where it leads; and prize clarity over cleverness. These methods carry through every unit that follows.`,
  },

  // Unit 2 — Knowledge and Reality (Epistemology)
  {
    slug: "epistemology",
    title: "What can we know? (epistemology)",
    weekNumber: 2,
    blurb: "The theory of knowledge and its central questions.",
    lectureTitle: "2.1 What can we know? (epistemology)",
    body: `# What can we know?

**Epistemology** is the branch of philosophy that studies **knowledge** — what it is, where it comes from, and how far it extends. The name comes from the Greek *epistēmē* (knowledge) and *logos* (account).

## Three kinds of knowledge

The English word "know" hides distinctions:

- **Propositional knowledge** — knowing *that* something is the case ("I know that Paris is in France"). This is epistemology's main concern.
- **Procedural knowledge** — knowing *how* to do something ("I know how to ride a bike").
- **Acquaintance** — knowing a person or place directly ("I know Maria").

## The central questions

Epistemology asks:

1. **What is knowledge?** How does it differ from mere true belief, lucky guessing, or opinion?
2. **What can we know?** Is there anything we can be *certain* of, or could we be mistaken about everything?
3. **What are the sources of knowledge?** Reason? Sense experience? Testimony? Memory?
4. **How is belief justified?** What makes a belief reasonable rather than arbitrary?

## Knowledge vs. true belief

A first key point: **knowledge is more than true belief**. Suppose you believe it will rain tomorrow on a whim, and it happens to rain. Your belief was true — but you did not *know* it would rain; you got lucky. Knowledge seems to require that the belief be held **for good reasons** — that it not be true by accident. Pinning down exactly what that extra ingredient is occupies much of this unit.

## Why it matters

Every other field rests on claims to know things. Epistemology audits those claims. It is also where philosophy confronts its most unsettling possibility — that we know far less than we assume — which is the subject of skepticism, two sections from now.`,
  },
  {
    slug: "rationalism-empiricism",
    title: "Rationalism vs. empiricism",
    weekNumber: 2,
    blurb: "Is the ultimate source of knowledge reason or experience?",
    lectureTitle: "2.2 Rationalism vs. empiricism",
    body: `# Rationalism vs. empiricism

Where does knowledge ultimately come from? Two great traditions give opposite answers.

## Rationalism

**Rationalists** hold that **reason** is the primary source of knowledge — that some substantial truths about reality can be known **a priori**, independent of sense experience. Figures like Descartes, Spinoza, and Leibniz pointed to mathematics: we don't discover that 7 + 5 = 12 by running experiments; we grasp it by thought alone.

Many rationalists also held a doctrine of **innate ideas** — that the mind comes equipped with certain concepts or principles not derived from experience.

## Empiricism

**Empiricists** — Locke, Berkeley, Hume — hold that **sense experience** is the ultimate source of knowledge. Locke called the newborn mind a *tabula rasa*, a blank slate: there are no innate ideas, and everything we know is built up from what the senses deliver. On this view, even our most abstract concepts are assembled out of experiential raw material.

## A priori vs. a posteriori

The debate turns on a distinction:

- **A priori** knowledge is justified independently of experience ("all bachelors are unmarried"; "7 + 5 = 12").
- **A posteriori** knowledge depends on experience ("water boils at 100°C at sea level").

Empiricists tend to argue that genuine *a priori* truths are merely **analytic** — true by the meanings of words — and tell us nothing new about the world. Rationalists insist some *a priori* truths are **synthetic** — substantive claims about reality grasped by reason.

## The stakes

The disagreement is not academic. If the empiricists are right, then claims that outrun all possible experience — about God, the soul, or the ultimate nature of reality — are suspect. If the rationalists are right, reason can reach truths the senses never could. Kant would later try to fuse the two, arguing that knowledge requires *both* sensory input and the mind's own organizing structure.`,
  },
  {
    slug: "skepticism",
    title: "Skepticism and the problem of doubt",
    weekNumber: 2,
    blurb: "Can we be certain of anything at all?",
    lectureTitle: "2.3 Skepticism and the problem of doubt",
    body: `# Skepticism and the problem of doubt

**Skepticism** is the view that we know much less than we think — in its most radical form, that we cannot have knowledge at all. Even if no one fully *believes* radical skepticism, its arguments are remarkably hard to refute, and grappling with them is how epistemology earns its keep.

## Descartes' method of doubt

René Descartes set out to find something **absolutely certain** by deliberately doubting everything he could. His strategy: if a belief *could possibly* be false, set it aside, and see what survives.

1. **The senses sometimes deceive** (illusions, mirages), so the senses can't be fully trusted.
2. **Dreams** can feel exactly like waking life — so how do you know you're not dreaming right now?
3. The **evil demon**: suppose an all-powerful deceiver is feeding you false experiences of an external world that isn't there. Could you tell?

The modern version is the **brain in a vat**: a brain kept alive in fluid, fed electrical signals that perfectly simulate ordinary life. Everything would seem exactly the same. So how do you know *you* aren't one?

## The cogito

From the wreckage Descartes salvages one certainty. Even if a demon deceives me about everything, **there must be a "me" being deceived**. I cannot doubt that I am thinking, for doubting is itself thinking. *Cogito, ergo sum* — "I think, therefore I am." My own existence as a thinking thing is indubitable.

## The lasting problem

The cogito is secure, but notice how little it gives: it does not prove the external world, other minds, or the past. Skeptical scenarios like the vat are designed so that no observation could distinguish them from reality — which is exactly what makes them so stubborn. The skeptical challenge sets the agenda: any theory of knowledge must say *something* about why we are entitled to trust experience at all.`,
  },
  {
    slug: "jtb-gettier",
    title: "Justified true belief and Gettier problems",
    weekNumber: 2,
    blurb: "The classic analysis of knowledge and its famous counterexamples.",
    lectureTitle: "2.4 Justified true belief and Gettier problems",
    body: `# Justified true belief and Gettier problems

For over two thousand years the standard analysis of knowledge was the **JTB** account: knowledge is **justified true belief**.

## The JTB analysis

A subject S **knows** that P if and only if:

1. **P is true** — you can't know something false.
2. **S believes P** — you can't know what you don't even believe.
3. **S is justified in believing P** — the belief rests on good reasons, not luck.

Each condition rules out a way of falling short of knowledge: false belief, a true claim you don't accept, and lucky guessing.

## Gettier's bombshell

In 1963 Edmund Gettier published a **three-page paper** that upended this. He described cases where all three conditions are met — a justified, true belief — yet we would *not* call it knowledge, because the belief is true **by luck** in a way that slips through the justification.

**A Gettier case:** Smith has strong evidence that Jones will get the job, and that Jones has ten coins in his pocket. He concludes, "the person who will get the job has ten coins in his pocket." In fact *Smith himself* gets the job — and, unknown to him, Smith also has ten coins in his pocket. Smith's belief is **true** and **justified**, but it is true by coincidence (his evidence was about Jones). Intuitively, Smith did not *know*.

## Why it matters

Gettier cases show that JTB is **not sufficient** for knowledge: justification can attach to a true belief while the truth is still a matter of luck. The lesson is the broader theme of the unit — **knowledge excludes luck** — but stating exactly *which* kind of luck is fatal proved extraordinarily hard.

## Attempts to fix it

Philosophers proposed extra conditions: "no false premises" in your reasoning, a **reliabilist** requirement that the belief be produced by a reliable process, or that the belief **track** the truth. Each handles some cases and stumbles on others. The "Gettier problem" remains a live, unsettled research area — a vivid demonstration of how one well-built counterexample can reopen a question everyone thought was closed.`,
  },
  {
    slug: "perception-reality",
    title: "Perception and reality",
    weekNumber: 2,
    blurb: "Do we perceive the world directly, or only our own ideas of it?",
    lectureTitle: "2.5 Perception and reality",
    body: `# Perception and reality

We seem to perceive the world directly — to *see* the tree, *hear* the bell. But philosophers since the seventeenth century have asked: **what do we actually perceive?**

## Naive realism

**Naive (or direct) realism** is the commonsense view: perception puts us in immediate contact with mind-independent objects and their properties. The tree is green, and you see *the tree's* greenness directly.

## The problem of perceptual variation

Naive realism faces pressure from how perception varies:

- A coin looks elliptical from an angle, round head-on.
- Water feels warm to a cold hand and cool to a hot one.
- A stick half in water looks bent.

In each case the object doesn't change, but the perception does. This suggests what we are *immediately* aware of is not the object itself but something mental.

## The sense-data theory

This motivates the **sense-data** theory: what we are directly aware of are private mental items — *sense-data* — caused by external objects. We perceive the physical world only **indirectly**, by way of these inner representations. This is **indirect (representative) realism**.

## Primary and secondary qualities

Locke drew a related distinction:

- **Primary qualities** (shape, size, motion, number) really belong to objects.
- **Secondary qualities** (color, taste, sound, smell) are *powers* in objects to produce sensations in us — they exist fully only in the perceiving mind.

## Berkeley's idealism

Berkeley pushed further: if we only ever access ideas, what reason have we to believe in mind-independent matter at all? His radical answer was **idealism** — *esse est percipi*, "to be is to be perceived." There are only minds and ideas; physical objects just *are* stable collections of perceptions.

## The lasting worry

Once perception is treated as a representation, a gap opens between **appearance and reality**, and the skeptic's question returns: if we only ever meet our own ideas, how can we know they match a world beyond them? Theories of perception are, in part, attempts to close that gap.`,
  },
  {
    slug: "theories-of-truth",
    title: "Truth and theories of truth",
    weekNumber: 2,
    blurb: "What does it mean for a belief to be true?",
    lectureTitle: "2.6 Truth and theories of truth",
    body: `# Truth and theories of truth

Knowledge requires truth — but *what is truth*? Three classic theories give competing accounts of what makes a statement true.

## The correspondence theory

The oldest and most intuitive: a statement is true when it **corresponds to the facts** — when it matches the way the world actually is. "Snow is white" is true because, out in the world, snow is in fact white.

Its appeal is obvious; its difficulty is explaining what a "fact" is and what the mysterious relation of "correspondence" amounts to. How does a sentence "match" a chunk of reality?

## The coherence theory

A statement is true when it **coheres** — fits consistently — with a whole system of other beliefs we hold. On this view truth is a property of a belief's *relations to other beliefs*, not its relation to an external world.

The worry: a story can be perfectly coherent yet false (a well-constructed novel). Mere internal consistency seems too weak to guarantee truth.

## The pragmatic theory

Associated with William James and C.S. Peirce: a belief is true if it **works** — if acting on it is useful, fruitful, and survives the test of experience over the long run. Truth is "what it is good for us to believe."

The worry: useful beliefs can be false, and inconvenient truths are still true. Usefulness and truth seem to come apart.

## Deflationism

A more recent, minimalist option: there is no deep property of "truth" to analyze. To say "'Snow is white' is true" is just to say *snow is white*. The truth predicate is a useful linguistic device, nothing metaphysically heavyweight.

## Why it matters

Your theory of truth shapes your epistemology. If truth is correspondence, knowledge must somehow reach a mind-independent reality, and skepticism bites hard. If truth is coherence or pragmatic success, the bar is set differently. The question "what is truth?" is not idle — it determines what we are even *aiming at* when we seek knowledge.`,
  },
  {
    slug: "faith-reason",
    title: "Faith, reason, and knowledge",
    weekNumber: 2,
    blurb: "Can religious belief be knowledge? How do faith and reason relate?",
    lectureTitle: "2.7 Faith, reason, and knowledge",
    body: `# Faith, reason, and knowledge

A long-running question sits at the border of epistemology and philosophy of religion: **how do faith and reason relate**, and can beliefs held on faith count as knowledge?

## Three broad positions

- **Rationalism about religion (faith must answer to reason):** religious beliefs should be accepted only if supported by argument and evidence, like any other belief. Aquinas argued that reason can establish much about God; W.K. Clifford pressed the strict **evidentialist** maxim: "it is wrong always, everywhere, and for anyone to believe anything upon insufficient evidence."
- **Fideism (faith above reason):** central religious truths are matters of faith and are not — and need not be — established by reason. Kierkegaard saw faith precisely as a passionate commitment that *outruns* the evidence; Tertullian's spirit is "I believe because it is absurd."
- **Compatibilism (faith and reason as partners):** the two occupy different but harmonious domains. Reason clears the ground and answers objections; faith goes beyond where proof stops.

## The evidentialist challenge

Clifford's principle, if accepted, makes faith without evidence a kind of intellectual vice. William **James** replied in "The Will to Believe": for certain "live, forced, and momentous" options that evidence cannot settle, we have the right to believe — indeed, refusing to decide is itself a decision with consequences.

## Is faith a route to knowledge?

Recall JTB: knowledge needs truth, belief, and justification. Faith readily supplies **belief**; whether it supplies **justification** is exactly the dispute. Some philosophers (e.g., Alvin Plantinga) argue belief in God can be **"properly basic"** — rational without being inferred from other beliefs, much as belief in the external world is. Critics reply this licenses too much.

## Why it matters

This debate is a test case for the whole unit. It forces us to ask what justification really requires, whether all knowledge must rest on evidence, and where — if anywhere — reasonable belief can outrun proof. How you answered the rationalism/empiricism and skepticism questions will shape your answer here.`,
  },

  // Unit 3 — Philosophy of Mind
  {
    slug: "mind-body-problem",
    title: "The mind-body problem",
    weekNumber: 3,
    blurb: "How do mind and body relate?",
    lectureTitle: "3.1 The mind-body problem",
    body: `# The mind-body problem

You have a body — physical, measurable, made of matter. You also have a **mind** — thoughts, sensations, feelings, a point of view. The **mind-body problem** asks: *what is the relationship between the two?*

## Why there's a problem at all

Mental and physical states seem to have wildly different features:

- Physical states have a **location, size, and mass**; thoughts do not. Where, exactly, is your belief that Paris is in France, and how much does it weigh?
- Mental states have **"aboutness"** (intentionality) — a hope is *about* something — and a **felt quality** (what it is *like* to taste coffee). Physical descriptions of neurons seem to leave these out.

Yet mind and body clearly **interact**: a pin (physical) causes pain (mental); a decision (mental) moves your arm (physical). How can two such different things causally affect each other?

## The two big camps

The proposed answers fall into two families, which the next sections examine:

- **Dualism** — mind and body are **two fundamentally different kinds of thing** (or property). The mind is not merely physical.
- **Monism** — there is ultimately **one kind of thing**. The dominant monist view today is **materialism/physicalism**: the mind just *is* the brain, or what the brain does. (A rarer monism, idealism, says all is mental.)

## The hard core

The deepest version is sometimes called the **"hard problem of consciousness"** (David Chalmers): even a complete physical account of the brain seems to leave unexplained *why there is something it is like* to be you — why all that neural processing is accompanied by inner experience at all.

## Why it matters

How you answer shapes everything downstream: whether the self could survive death, whether your choices are free, and whether a machine could ever genuinely think. The mind-body problem is the hinge of this entire unit.`,
  },
  {
    slug: "dualism",
    title: "Dualism",
    weekNumber: 3,
    blurb: "The mind is a non-physical thing distinct from the body.",
    lectureTitle: "3.2 Dualism",
    body: `# Dualism

**Dualism** holds that the mind and the body are **two fundamentally different kinds of thing**. The mind is not just the brain; it is something non-physical.

## Substance dualism

The classic version is **substance dualism**, associated with Descartes. There are two kinds of substance: **physical substance** (extended in space, the body and brain) and **mental substance** (the thinking, non-extended mind or soul). You are essentially the mental substance; the body is something you *have*.

## Descartes' argument from doubt

Descartes argued: *I can doubt that my body exists* (the evil demon might be deceiving me), but *I cannot doubt that my mind exists* (doubting is thinking). Since mind and body have different properties — one dubitable, one indubitable — they cannot be the same thing. (Critics note this may confuse what I can *imagine* with what is really the case.)

## The conceivability argument

A sharper version: I can clearly conceive of my mind existing **without** my body (as a disembodied consciousness). What is conceivable in this way is possible. So mind and body are *distinct*, since one could exist without the other.

## The argument from qualia

Conscious experiences have a **felt quality** — *qualia*, what it is like to see red or feel pain. No description of physical brain states, however complete, seems to capture *what it is like*. If experience has features the physical lacks, the mental isn't purely physical.

## The fatal objection: interaction

Dualism's greatest weakness is the **interaction problem**. If the mind is non-physical — no location, no energy — *how* does it move the physical body, and how does a physical pin produce a mental pain? Causation seems to require contact or energy transfer, which a non-physical mind cannot supply. Descartes' guess (the pineal gland) satisfied no one.

## Variants

To dodge interaction, some dualists become **epiphenomenalists** (the body affects the mind, but the mind has no causal power over the body) or **parallelists** (mind and body run in pre-established harmony without interacting). Each saves dualism at a steep cost. The difficulty of explaining interaction is the main reason many philosophers turn to materialism.`,
  },
  {
    slug: "materialism-physicalism",
    title: "Materialism and physicalism",
    weekNumber: 3,
    blurb: "The mind is nothing over and above the physical brain.",
    lectureTitle: "3.3 Materialism and physicalism",
    body: `# Materialism and physicalism

**Materialism** (or **physicalism**) is the view that **everything that exists is physical** — including the mind. There is no separate mental substance; mental states are brain states, or functions of the brain.

## The motivation

Materialism's great advantage is that it **avoids the interaction problem**. If the mind just *is* the brain, there's no mystery about how thoughts move bodies — it's all physical causation. It also fits the scientific picture: neuroscience keeps tying specific mental capacities to specific brain activity.

## Versions of materialism

- **Identity theory:** each type of mental state is *identical* to a type of brain state — pain just *is* C-fiber firing. The mind-brain relation is like the water-H₂O relation: one thing, two descriptions.
- **Behaviorism:** mental talk is really talk about **behavior and dispositions to behave**. To be in pain is to wince, groan, and avoid the cause. (Objection: this leaves out the inner *feel*, and a perfect actor could fake the behavior with no pain.)
- **Functionalism:** what makes a state mental is its **causal role** — its relations to inputs, outputs, and other states — not what it's made of. Pain is whatever is caused by injury and causes avoidance. This is the dominant view today.

## Multiple realizability

A key argument *for* functionalism and *against* the strict identity theory: pain could be realized in human neurons, in an octopus's very different brain, or perhaps in silicon. If the same mental state can be **realized in different physical stuff**, then it can't be identical to one specific brain state. Mind is more like **software** than like a particular piece of hardware.

## The objections materialism must answer

- **Qualia / the explanatory gap:** even a complete physical account seems to leave out *what it is like* to have the experience.
- **Mary's Room (the knowledge argument):** Mary knows every physical fact about color vision but has lived in a black-and-white room. When she first sees red, she seems to learn something new — *what red looks like*. If she learns a new fact, not all facts are physical.

Materialists reply in various ways (Mary gains a new *ability* or *concept*, not a new fact). Whether these replies succeed is one of the central debates in philosophy of mind.`,
  },
  {
    slug: "personal-identity",
    title: "Personal identity over time",
    weekNumber: 3,
    blurb: "What makes you the same person across a lifetime?",
    lectureTitle: "3.4 Personal identity over time",
    body: `# Personal identity over time

You today and you at age five share almost no atoms, look different, and hold different beliefs. Yet you are, somehow, **the same person**. What makes that true? This is the problem of **personal identity over time**.

## Why it's puzzling

Identity here means **numerical** identity — being one and the same individual, not merely *similar*. The challenge is to state the **criterion**: what relation must a person at one time bear to a person at another for them to be the very same person?

## The body theory

Perhaps you are the same person because you have the **same body** (or same brain). But intuitions push back: in a brain transplant, most of us think the *person* goes with the brain, not the empty body — which suggests the body alone isn't what matters.

## The soul theory

A dualist answer: you persist because you have the **same immaterial soul**. But souls are unobservable; we have no way to tell whether the "same" soul persists, so the theory can't actually explain the continuity we experience.

## Locke's memory (psychological) theory

John Locke argued that personal identity is a matter of **psychological continuity**, especially **memory**. You are the same person as the one who did X if you can *remember* doing X. Person-identity is tied to a continuous chain of consciousness, not to substance.

Locke's **prince and the cobbler**: if the prince's memories and personality woke up in the cobbler's body, we'd judge the *prince* now inhabits the cobbler — identity follows the psychology.

## Problems with the memory theory

- **Reid's brave officer:** an old general remembers his brave deed as a young officer; the young officer remembered being a boy who stole apples; but the general can't recall the apple-stealing. By memory-chains he both is and isn't that boy — a contradiction. (Fixed by appealing to *overlapping* chains.)
- **False or duplicate memories:** memory can be mistaken, and you can't define identity in terms of memory without circularity, since *genuine* memory already presupposes it's really you.

## Parfit: identity isn't what matters

Derek Parfit argued, via teleporter and split-brain thought experiments, that in puzzle cases there may be **no determinate answer** to "is it still me?" — and that this is fine, because what we really care about (psychological continuity and connectedness) can hold *without* a deep further fact of identity. The unsettling upshot: the self you're so attached to may be less metaphysically solid than it feels.`,
  },
  {
    slug: "free-will-determinism",
    title: "Free will and determinism",
    weekNumber: 3,
    blurb: "If everything is caused, can our choices be free?",
    lectureTitle: "3.5 Free will and determinism",
    body: `# Free will and determinism

We feel we make **free choices** and are **responsible** for them. But we also believe every event has a cause. Can both be true?

## Determinism

**Determinism** is the thesis that **every event, including every human choice, is fully caused by prior events** together with the laws of nature. Given the state of the universe a million years ago and the laws, only one future was ever possible — including everything you will "decide" today.

## The dilemma

This sets up the classic problem:

- If **determinism is true**, your choices were fixed before you were born — so how can they be free, or you responsible for them?
- If **determinism is false** and choices are **undetermined**, they happen by *randomness* — but a random twitch isn't a free, responsible action either.

Either way, free will seems to be in trouble. This is the **dilemma of determinism**.

## The three positions

- **Hard determinism:** determinism is true, so free will is an **illusion** and no one is ultimately responsible. (We may still need praise and blame as social tools.)
- **Libertarianism** (the metaphysical kind, not the political): we **do** have genuine free will, so determinism must be false — at least some choices are not fully caused by prior events but originate with the agent. The challenge is explaining how that avoids mere randomness.
- **Compatibilism:** free will and determinism are **compatible**. This is the most widely held view.

## Compatibilism

Compatibilists (Hume, and many today) argue the whole problem rests on a confusion about what "free" means. To act freely is **not** to act *uncaused*; it is to act **according to your own desires, without external compulsion**. A prisoner in chains is unfree; a person choosing what to eat is free — *even if* that choice is causally determined. Freedom is the *absence of constraint*, not the absence of causation.

Critics (the "consequence argument") reply that this isn't *deep* enough freedom: if your desires themselves were determined by factors outside your control, choosing "according to your desires" doesn't make you their ultimate author.

## Why it matters

The stakes are enormous: moral responsibility, praise and blame, punishment, regret, and the very idea that you are the author of your life all depend on how this question is answered.`,
  },
  {
    slug: "consciousness-self",
    title: "Consciousness and the self",
    weekNumber: 3,
    blurb: "The hard problem of experience and the nature of the 'I'.",
    lectureTitle: "3.6 Consciousness and the self",
    body: `# Consciousness and the self

Two of the deepest puzzles in philosophy of mind concern **consciousness** — the fact of inner experience — and the **self** — the "I" that seems to have those experiences.

## The "easy" and "hard" problems

David Chalmers distinguished:

- The **easy problems**: explaining cognitive functions — how the brain discriminates stimuli, integrates information, controls behavior, reports its states. Hard in practice, but clearly the kind of thing science can tackle.
- The **hard problem**: explaining **why there is subjective experience at all** — why all that information-processing is accompanied by *something it is like* to undergo it. Why isn't it all happening "in the dark," with no inner feel?

## The zombie thought experiment

Imagine a **philosophical zombie**: a being physically and functionally identical to you — same brain, same behavior, says "ouch" when pricked — but with **no inner experience whatsoever**. Nothing it is like to be it. If such a zombie is even *conceivable*, then consciousness is not captured by the physical and functional facts. Materialists reply that zombies only *seem* conceivable; whether they're genuinely possible is hotly disputed.

## The unity and "what-it's-like"

Conscious experience is **unified** (sights, sounds, and thoughts come together in a single field) and **subjective** (accessible from the inside, in a way a brain scan never reaches). Thomas Nagel's "What Is It Like to Be a Bat?" argues that even complete knowledge of bat echolocation wouldn't tell us *what it is like* for the bat — there's an irreducibly first-person fact science seems to miss.

## The self

Is there a single, persisting **self** that owns all your experiences? Two answers:

- **The ego/substantial-self view:** yes — a unified subject underlies and unifies experience.
- **The bundle theory** (Hume, and Buddhist philosophy): no. When Hume "looked inward," he found only a *bundle* of perceptions — sensations, feelings, thoughts — but never a separate "self" having them. The self is a useful fiction, a construction the mind imposes on a stream of mental events.

## Why it matters

Consciousness is the one thing we know most intimately and explain least. It is where materialism faces its sharpest test, where the reality of the self is most in doubt, and — as the next section shows — where the question of whether machines could think becomes most pressing.`,
  },
  {
    slug: "artificial-minds",
    title: "Artificial minds and machine thought",
    weekNumber: 3,
    blurb: "Could a machine genuinely think or be conscious?",
    lectureTitle: "3.7 Artificial minds and the question of machine thought",
    body: `# Artificial minds and machine thought

Could a **machine** genuinely *think* — or even be *conscious*? The question is no longer science fiction, and it brings together everything in this unit.

## The Turing Test

Alan Turing sidestepped the vague question "can machines think?" and proposed a practical test (the **imitation game**): if a human judge, conversing by text with a machine and a human, cannot reliably tell which is which, the machine should count as intelligent. Turing's point was **behaviorist**: thinking should be judged by performance, not by hidden inner essence.

## Strong vs. weak AI

- **Weak AI:** machines can *simulate* thinking and be powerful tools — uncontroversial.
- **Strong AI:** a suitably programmed computer would *literally have a mind* — real understanding and perhaps consciousness, not just a simulation. This is the claim under dispute.

## Searle's Chinese Room

John Searle's famous argument against strong AI: imagine a man who knows no Chinese locked in a room with a giant rulebook. Chinese symbols come in; following the rules, he sends correct Chinese symbols out. To outsiders the room "speaks Chinese" perfectly — it would pass the Turing Test — yet the man **understands nothing**. He's just manipulating symbols by their shapes (**syntax**) with no grasp of their **meaning** (**semantics**).

Searle's conclusion: **a program is all syntax and no semantics**, so running the right program can never, by itself, produce genuine understanding. Computation is not enough for a mind.

## Replies

- **The systems reply:** the *man* doesn't understand, but the *whole system* (man + rulebook + room) does. Searle: let the man memorize the entire rulebook — still no understanding.
- **The robot reply:** put the program in a robot that perceives and acts in the world, grounding the symbols in real causal contact. Maybe semantics comes from embodiment.
- **The brain-simulator reply:** if the program simulated an actual Chinese-speaker's neurons exactly, denying it understands seems to deny the brain does.

## Connecting the unit

How you answer depends on your stance on the mind-body problem. A **functionalist** is open to genuine machine minds — if mind is a matter of the right causal organization, the substrate (silicon or neurons) shouldn't matter. A defender of **qualia** or the **hard problem** will doubt that any amount of processing yields real *experience*. The question of machine thought is thus a mirror: what we're willing to grant a machine reveals what we think a mind ultimately *is*.`,
  },

  // Unit 4 — Metaphysics, God, and Ethics
  {
    slug: "metaphysics",
    title: "What exists? (metaphysics)",
    weekNumber: 4,
    blurb: "The study of the fundamental nature of reality.",
    lectureTitle: "4.1 What exists? (metaphysics)",
    body: `# What exists?

**Metaphysics** is the branch of philosophy that asks the most general possible question: **what is there, and what is it like?** It investigates the fundamental nature of reality, beneath and behind what any particular science studies.

## Ontology: the catalog of being

The core of metaphysics is **ontology** — the study of what kinds of things *exist*. Are there only physical objects? Also numbers, properties, minds, possibilities, God? Some entries are uncontroversial (rocks); others are fiercely disputed (do numbers *exist*, or are they useful fictions?).

## Universals and particulars

A classic problem: many different apples are all **red**. Is there a single property, *redness*, that they all share — a **universal** that exists over and above the individual apples?

- **Realists** (Plato) say yes: universals are real, abstract entities. Plato placed them in a separate realm of **Forms**, more real than the changing physical things that "participate" in them.
- **Nominalists** say no: only **particular** things exist; "redness" is just a name we apply to similar particulars. There is no extra entity.

## Other central questions

- **Existence:** what does it even mean to say something "exists"? Do fictional and merely possible things have any kind of being?
- **Causation:** what *is* the relation between cause and effect? Hume argued we never observe a necessary connection — only one thing *followed by* another — and project the "must" from habit.
- **Time:** is the passage of time real, or is past/present/future just a perspective on a "block" universe where all times are equally real?
- **Identity:** what makes a thing the *same* thing over time despite change (the Ship of Theseus — replace every plank, is it the same ship)?

## Why it matters and why it's hard

Metaphysics can't be settled by experiment — its questions are about what experiment itself presupposes. Critics (the logical positivists) once dismissed it as meaningless because untestable. But the questions keep returning, because every worldview — scientific, religious, commonsense — rests on metaphysical assumptions about what is real. Metaphysics simply drags those assumptions into the light.`,
  },
  {
    slug: "arguments-god",
    title: "Arguments for and against God's existence",
    weekNumber: 4,
    blurb: "The cosmological, design, and ontological arguments and their critics.",
    lectureTitle: "4.2 Arguments for and against God's existence",
    body: `# Arguments for and against God's existence

Whether God exists is among philosophy's oldest questions. Here we examine the major **arguments for** God's existence and the standard objections. (The strongest argument *against* — the problem of evil — gets its own section next.)

## The cosmological argument

From the existence of the universe to a first cause. **Everything that begins to exist has a cause; the universe began to exist; therefore the universe has a cause** — God. A related version: a chain of causes can't regress infinitely, so there must be a **first, uncaused cause** (Aquinas's "unmoved mover").

**Objection:** why must the chain stop at God rather than regress forever or end in the universe itself? And if everything needs a cause, what caused God? (If God can be uncaused, why not the universe?)

## The design (teleological) argument

The universe and living things show **order, complexity, and apparent purpose** — like a watch, which implies a watchmaker (Paley). Such fine-tuned order is best explained by an intelligent **designer**.

**Objection:** Hume noted the analogy is weak (the universe isn't much like a watch), and Darwin supplied a rival explanation — **natural selection** can produce the appearance of design without a designer. Fine-tuning arguments face the "multiverse" and observer-selection replies.

## The ontological argument

The boldest: it tries to prove God **a priori**, from the concept alone. Anselm: God is "that than which nothing greater can be conceived." A being that exists in reality is greater than one existing only in the mind. So if God exists only in the mind, we can conceive of something greater — a contradiction. Therefore God must exist **in reality**.

**Objection:** Kant's famous reply — **"existence is not a predicate."** Saying a thing exists adds nothing to its concept; you can't define something into existence. Gaunilo parodied it by "proving" a perfect island must exist.

## Where the arguments leave us

None is universally accepted as a proof. But notice the variety of strategies: the cosmological argument is *a posteriori* (from the world's existence), the design argument *a posteriori* (from the world's features), the ontological argument *a priori* (from a concept). Evaluating them is a master class in the logic tools from Unit 1 — checking validity, hunting suppressed premises, and weighing the design argument's *inductive* strength against its rivals.`,
  },
  {
    slug: "problem-of-evil",
    title: "The problem of evil",
    weekNumber: 4,
    blurb: "Can an all-good, all-powerful God coexist with evil?",
    lectureTitle: "4.3 The problem of evil",
    body: `# The problem of evil

The **problem of evil** is the most powerful argument *against* the existence of God as traditionally conceived. It asks: if God is **all-powerful, all-knowing, and all-good**, why is there so much **evil and suffering**?

## The logical problem

Stated as an apparent contradiction (Epicurus, Mackie):

1. God is **omnipotent** (could prevent any evil).
2. God is **omniscient** (knows of every evil).
3. God is **omnibenevolent** (would *want* to prevent every evil).
4. Yet **evil exists**.

If a being could prevent evil, knew of it, and wanted to prevent it, there would be no evil. So a being with all three attributes seems **incompatible** with the evil we observe. The logical version claims this is a strict contradiction.

## The evidential problem

A subtler version concedes God's existence isn't *logically* ruled out, but argues the **sheer amount and distribution** of suffering — especially the apparently **gratuitous** suffering of innocents and animals — makes God's existence **improbable**. Even if *some* evil could be justified, *this much*, *like this*?

## Theodicies: replies on God's behalf

A **theodicy** tries to show how God and evil can coexist:

- **The free will defense** (Plantinga): much evil is **moral evil**, caused by the free choices of creatures. A world with genuinely free agents — capable of love and goodness — is more valuable than a world of puppets, even though freedom makes evil possible. God couldn't create free beings *and* guarantee they never sin.
- **The soul-making theodicy** (Hick): a world with hardship and challenge is necessary for **moral and spiritual growth** — courage, compassion, and character can only develop in a world that contains real adversity.
- **Greater-good / unknown-purpose defenses:** apparent evils may serve goods we can't see; our vantage point is too limited to declare any suffering truly pointless.

## The remaining pressure

The hardest case for every theodicy is **natural evil** — earthquakes, disease, the suffering of animals — which the free will defense doesn't obviously cover, and the seemingly **pointless** suffering that soul-making struggles to justify. The problem of evil remains the central battleground of philosophy of religion precisely because both the argument and the replies are serious.`,
  },
  {
    slug: "consequentialism",
    title: "Ethical theories: consequentialism",
    weekNumber: 4,
    blurb: "Right action is whatever produces the best outcomes.",
    lectureTitle: "4.4 Ethical theories: consequentialism",
    body: `# Consequentialism

We now turn from *what exists* to *how we ought to live*. **Normative ethics** seeks a general theory of right action. The first family is **consequentialism**: the rightness of an act depends *entirely* on its **consequences**.

## The core idea

For a consequentialist, **the ends justify the means** — or more precisely, an act is right if and only if it produces **the best overall outcome** available. Nothing else matters intrinsically: not your intentions, not the kind of act, only the results.

## Utilitarianism

The most famous version is **utilitarianism** (Bentham and Mill): the right action is the one that produces the **greatest happiness for the greatest number** — maximizing pleasure/well-being and minimizing suffering, counting **everyone's** interests equally.

- **Bentham** measured outcomes by the *quantity* of pleasure (his "hedonic calculus").
- **Mill** insisted on the *quality* of pleasures too: "it is better to be Socrates dissatisfied than a fool satisfied." Higher (intellectual, moral) pleasures outrank mere bodily ones.

## Act vs. rule utilitarianism

- **Act utilitarianism:** apply the principle to **each individual act** — do whatever maximizes utility right now.
- **Rule utilitarianism:** follow the **rules** whose general adoption maximizes utility (e.g., "keep promises"), even when breaking the rule would help in a single case. This blunts some objections by stabilizing trust.

## The strengths

Consequentialism is impartial, secular, and practical: it gives a clear decision procedure, takes suffering seriously, and counts everyone equally — a radical, progressive idea in its time.

## The objections

- **Justice and rights:** maximizing total happiness can demand horrors — framing an innocent person to prevent a riot, or harvesting one person's organs to save five. The theory seems to permit injustice if the numbers work out.
- **Demandingness:** it seems to require you to sacrifice almost everything whenever doing so produces marginally more good for others.
- **The calculation problem:** we can't actually foresee and total up all the consequences of our actions.
- **Integrity:** by focusing only on outcomes, it can require you to violate your deepest commitments whenever the math favors it.

These objections set up the rival theory — deontology — which insists that *some acts are simply wrong, whatever the consequences.*`,
  },
  {
    slug: "deontology",
    title: "Ethical theories: deontology",
    weekNumber: 4,
    blurb: "Some acts are right or wrong in themselves, regardless of consequences.",
    lectureTitle: "4.5 Ethical theories: deontology",
    body: `# Deontology

**Deontology** (from the Greek *deon*, "duty") holds that morality is a matter of **duties and rules**, and that **some acts are right or wrong in themselves** — independent of their consequences. Where the consequentialist looks forward to results, the deontologist looks at the **nature of the act**.

## Kant's ethics

The towering deontologist is **Immanuel Kant**. For Kant, the only thing good without qualification is a **good will** — acting from **duty**, for the sake of what is right, not from inclination or self-interest or even desirable outcomes.

## The Categorical Imperative

Kant's supreme moral principle, the **Categorical Imperative**, is *categorical* (it commands unconditionally, not "if you want X, do Y"). He gave several formulations:

- **The Universal Law formulation:** *"Act only on that maxim you can will to become a universal law."* Ask: could everyone act on my reason without contradiction? Lying fails — if everyone lied freely, the very institution of promising would collapse, so the maxim is self-defeating.
- **The Humanity formulation:** *"Treat humanity, whether in yourself or another, always as an end in itself, never merely as a means."* People have **dignity**, not a price; using them as mere tools is the core wrong.

## Strengths

- It **protects individuals and rights** absolutely — it forbids the organ-harvesting and innocent-framing that trouble utilitarianism. Some things you simply may not do to a person, no matter the payoff.
- It honors the intuition that **motives and respect for persons** matter, not just results.
- It treats all rational beings as equal in dignity.

## Objections

- **Absolutism / conflicting duties:** Kant held some rules exceptionless — *never* lie. But should you lie to a murderer asking where your friend is hiding? Inflexible rules can yield monstrous results, and when two duties conflict (don't lie vs. protect the innocent), the theory struggles to adjudicate.
- **Ignoring consequences:** refusing to lie even to prevent a catastrophe strikes many as a failure of the theory, not a triumph.
- **Emptiness / formalism:** critics charge the Categorical Imperative is too abstract to settle hard cases on its own.

## The contrast

Deontology and consequentialism are the two great rivals of modern ethics: outcomes vs. rules, the greater good vs. inviolable rights. Each captures something the other seems to miss — which motivates a third approach that shifts the question entirely.`,
  },
  {
    slug: "virtue-ethics",
    title: "Ethical theories: virtue ethics",
    weekNumber: 4,
    blurb: "Focus on character: what kind of person should I be?",
    lectureTitle: "4.6 Ethical theories: virtue ethics",
    body: `# Virtue ethics

Consequentialism and deontology both ask **"what should I *do*?"** — they focus on actions and rules. **Virtue ethics**, rooted in Aristotle, reframes the question: **"what kind of *person* should I *be*?"** The focus shifts from acts to **character**.

## Aristotle's framework

For Aristotle, ethics aims at **eudaimonia** — usually translated "happiness," but better rendered **"flourishing"** or living well as a complete human life. Eudaimonia is the highest good, pursued for its own sake.

We achieve it by developing **virtues** — stable traits of character (courage, honesty, generosity, justice, temperance) — and avoiding **vices**. A virtue is an excellence that lets a thing perform its characteristic function well; for humans, whose distinctive function is **reason**, flourishing means living a life governed by reason and virtue.

## The doctrine of the mean

A virtue is a **mean between two extremes** — one of excess, one of deficiency:

- **Courage** lies between *cowardice* (deficiency of confidence) and *recklessness* (excess).
- **Generosity** lies between *stinginess* and *wastefulness*.

The mean is not a fixed midpoint but is **relative to the situation** and found by **practical wisdom** (*phronesis*) — the developed capacity to perceive what the situation calls for.

## How virtue is acquired

We aren't born virtuous; we become so by **habituation** — practice. "We become just by doing just acts, brave by doing brave acts." Character is built like a skill, through repetition until acting well becomes second nature. The genuinely virtuous person does the right thing **gladly**, not through gritted-teeth self-control.

## Strengths

- It captures the importance of **moral character, emotion, and motivation** that rule-based theories sideline.
- It's **realistic about moral development** — we *do* learn ethics by example and habit, not by memorizing principles.
- It offers a holistic picture of the good *life*, not just isolated decisions.

## Objections

- **Action guidance:** "be virtuous" doesn't clearly tell you **what to do** in a specific dilemma the way "maximize utility" or "don't lie" does. (Reply: do what the *practically wise person* would do.)
- **Which virtues?** Different cultures and eras prize different traits — is the list objective or relative?
- **Circularity:** a right act is what a virtuous person does, and a virtuous person is one who does right acts.

Virtue ethics, consequentialism, and deontology are best seen as three lenses on morality — outcomes, duties, and character — each illuminating part of the whole.`,
  },
  {
    slug: "political-philosophy",
    title: "Justice, rights, and political philosophy",
    weekNumber: 4,
    blurb: "What makes a society and its laws just?",
    lectureTitle: "4.7 Justice, rights, and political philosophy",
    body: `# Justice, rights, and political philosophy

Ethics asks how an individual should live; **political philosophy** asks how we should live **together** — what makes a state legitimate, laws binding, and a society **just**.

## The social contract

A central tradition explains political authority through a **social contract**: legitimate government rests on the (actual or hypothetical) **agreement of the governed**. To picture what we're agreeing to leave behind, theorists imagine a **state of nature** — life without government:

- **Hobbes:** the state of nature is a "war of all against all," life "solitary, poor, nasty, brutish, and short." To escape it, people surrender power to a strong sovereign for security.
- **Locke:** people have **natural rights** to life, liberty, and property even in the state of nature; government exists to **protect** those rights and is legitimate only with the people's consent — justifying revolution when it fails.
- **Rousseau:** legitimate authority expresses the **general will**, the common good the people will collectively.

## Theories of justice

What is a **just distribution** of society's benefits and burdens?

- **Rawls (justice as fairness):** imagine choosing society's basic rules from behind a **"veil of ignorance"** — not knowing your race, class, talents, or gender. Rational people so situated would choose (1) equal basic **liberties** for all, and (2) the **difference principle**: inequalities are just only if they benefit the **least advantaged**. Justice is what we'd agree to if we couldn't rig the rules in our own favor.
- **Nozick (libertarian / entitlement):** justice is about **how holdings came about**, not patterns. If you acquired your property justly (without theft or fraud) and transferred it freely, the distribution is just — and redistributive taxation violates rights. "Liberty upsets patterns."
- **Utilitarian:** the just arrangement is whatever maximizes overall welfare.

## Rights and liberty

What rights do individuals have against the state, and where does legitimate authority **stop**? Mill's **harm principle** offers one boundary: power may be exercised over an individual against their will **only to prevent harm to others** — not for their own good. This grounds modern defenses of free speech and personal liberty.

## Why it matters

These aren't museum pieces: debates over taxation, liberty, equality, civil disobedience, and the limits of state power are live applications of exactly these frameworks. Political philosophy is where the ethical theories of the previous sections meet the realities of power and shared life.`,
  },
  {
    slug: "capstone",
    title: "Capstone synthesis",
    weekNumber: 4,
    blurb: "Drawing the four units into a single picture of doing philosophy.",
    lectureTitle: "4.8 Capstone synthesis",
    body: `# Capstone synthesis

We end by drawing the course together. The four units were not separate subjects but **four angles on a single activity**: subjecting our deepest assumptions to **reasoned scrutiny**.

## The thread running through everything

Every unit was, at bottom, an exercise in **argument**:

- **Unit 1 (Logic)** gave us the tools — premises and conclusions, validity and soundness, deduction and induction, fallacies, charitable reconstruction, counterexamples, and thought experiments.
- **Unit 2 (Epistemology)** turned those tools on **knowledge itself** — and found that knowledge is more than true belief, that skepticism is hard to refute, and that even "justified true belief" cracks under a Gettier counterexample.
- **Unit 3 (Philosophy of mind)** applied them to the **mind** — weighing dualism against materialism, probing personal identity, free will, consciousness, and whether a machine could think.
- **Unit 4 (Metaphysics & ethics)** asked **what exists**, whether God exists, and **how we ought to live** — comparing consequentialism, deontology, and virtue ethics, then scaling ethics up to justice.

## How the units talk to each other

The divisions are artificial. Your **metaphysics** of mind (Unit 3) shapes whether free will and moral responsibility (Unit 4) are even possible. Your **epistemology** (Unit 2) determines what you can claim to *know* about God or right and wrong. Your grasp of **logic** (Unit 1) is what lets you evaluate any of it. Philosophy is a web, not a list.

## What you should carry away

Not a set of final answers — philosophy's signature is that its central questions stay open. What you should carry away is a **method and a temperament**:

1. Always ask, of any claim, **"What is the argument?"**
2. Seek the **strongest** version of a view before criticizing it (charity).
3. Test general claims against **counterexamples** and **thought experiments**.
4. Distinguish what you **know** from what you merely **believe** or **want to be true**.
5. Follow the argument **where it leads**, even when the destination is uncomfortable.

## The point of the whole enterprise

Socrates said "the unexamined life is not worth living." The aim of this course was never to tell you *what* to think but to make you better at *how* to think — to give you the wisdom philosophy was named for: not a stock of answers, but the disciplined, honest, lifelong practice of examining the beliefs you live by.`,
  },
];

type SeedAssignment = {
  kind: "homework" | "test" | "midterm" | "final";
  title: string;
  weekNumber: number;
  isTimed: boolean;
  timeLimitMinutes: number | null;
  instructions: string;
  problems: Array<{
    topicSlug: string;
    prompt: string;
    correctAnswer: string;
    explanation: string;
    hint?: string;
  }>;
};

const ASSIGNMENTS: SeedAssignment[] = [
  // Unit 1
  {
    kind: "homework",
    title: "Homework 1.1 — Arguments, validity, and soundness",
    weekNumber: 1,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice. Answer in your own words in the answer box.",
    problems: [
      { topicSlug: "what-is-philosophy", prompt: "How does philosophy primarily try to answer its questions — by experiment, by appeal to authority, or by reasoning? Answer in one word.", correctAnswer: "reasoning", explanation: "Philosophy answers fundamental questions through careful reasoning and argument rather than experiment or authority." },
      { topicSlug: "arguments-premises-conclusions", prompt: "In an argument, what do we call the statement the premises are meant to support?", correctAnswer: "the conclusion", explanation: "The conclusion is the claim the premises are offered as reasons to believe." },
      { topicSlug: "validity-soundness", prompt: "An argument has a false premise but its form guarantees the conclusion if the premises were true. Is it valid? Answer yes or no.", correctAnswer: "yes", explanation: "Validity is about form: if the premises were true the conclusion would have to be true, regardless of whether they actually are." },
      { topicSlug: "validity-soundness", prompt: "What two conditions must an argument meet to be sound?", correctAnswer: "it must be valid and have all true premises", explanation: "A sound argument is valid and has all true premises, so its conclusion must be true." },
    ],
  },
  {
    kind: "homework",
    title: "Homework 1.2 — Reasoning, fallacies, and method",
    weekNumber: 1,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "deductive-inductive", prompt: "Does a deductive argument aim to make its conclusion certain or merely probable? Answer in one word.", correctAnswer: "certain", explanation: "Deductive arguments aim to guarantee the conclusion; inductive ones aim only to make it probable." },
      { topicSlug: "logical-fallacies", prompt: "Attacking the person making an argument instead of the argument itself is which fallacy?", correctAnswer: "ad hominem", explanation: "The ad hominem fallacy targets the arguer rather than the argument." },
      { topicSlug: "reconstructing-arguments", prompt: "What principle says you should interpret an argument in its strongest plausible form?", correctAnswer: "the principle of charity", explanation: "Charity means engaging the best version of an argument, which makes any criticism stronger." },
      { topicSlug: "philosophical-method", prompt: "What do we call a single case that refutes a general claim or proposed definition?", correctAnswer: "a counterexample", explanation: "One good counterexample can refute a universal claim or an analysis." },
    ],
  },
  {
    kind: "test",
    title: "Unit 1 Test — Logic and Critical Reasoning",
    weekNumber: 1,
    isTimed: true,
    timeLimitMinutes: 30,
    instructions: "Timed. 30 minutes. Pasting is disabled; keystrokes are screened for AI use.",
    problems: [
      { topicSlug: "arguments-premises-conclusions", prompt: "In one sentence, define a philosophical argument.", correctAnswer: "An argument is a set of statements in which the premises are offered as reasons to support a conclusion.", explanation: "Premises support a conclusion." },
      { topicSlug: "validity-soundness", prompt: "Explain the difference between a valid and a sound argument in one sentence.", correctAnswer: "A valid argument's form guarantees the conclusion if the premises are true, while a sound argument is valid and also has all true premises.", explanation: "Validity is about form; soundness adds true premises." },
      { topicSlug: "deductive-inductive", prompt: "Give one example of inductive reasoning and explain why it is not deductive.", correctAnswer: "Concluding all swans are white because every observed swan is white; it is inductive because the premises make the conclusion probable but not certain, and it can be false.", explanation: "Induction goes beyond the evidence, so the conclusion is only probable." },
      { topicSlug: "logical-fallacies", prompt: "Distorting an opponent's position to make it easier to attack is which fallacy?", correctAnswer: "straw man", explanation: "The straw man fallacy refutes a weakened misrepresentation of a view." },
      { topicSlug: "philosophical-method", prompt: "Name the philosophical method that uses an imagined scenario to isolate an intuition.", correctAnswer: "a thought experiment", explanation: "Thought experiments test ideas through imagined cases like the brain in a vat." },
    ],
  },

  // Unit 2
  {
    kind: "homework",
    title: "Homework 2.1 — Knowledge, sources, and skepticism",
    weekNumber: 2,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "epistemology", prompt: "Is knowledge the same as true belief? Answer yes or no, then give the reason in one phrase.", correctAnswer: "no; knowledge cannot be true by luck", explanation: "A lucky true guess is not knowledge; knowledge needs more than truth and belief." },
      { topicSlug: "rationalism-empiricism", prompt: "Which tradition holds that sense experience is the ultimate source of knowledge — rationalism or empiricism?", correctAnswer: "empiricism", explanation: "Empiricists hold experience is the source; rationalists emphasize reason." },
      { topicSlug: "skepticism", prompt: "State Descartes' one indubitable certainty in Latin or English.", correctAnswer: 'cogito ergo sum / "I think, therefore I am"', explanation: "Even a deceiver cannot make me doubt that I, the doubter, exist." },
      { topicSlug: "skepticism", prompt: "Name the modern version of Descartes' evil demon scenario.", correctAnswer: "the brain in a vat", explanation: "A brain fed simulated experiences is the contemporary skeptical scenario." },
    ],
  },
  {
    kind: "homework",
    title: "Homework 2.2 — Gettier, perception, and truth",
    weekNumber: 2,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "jtb-gettier", prompt: "What three conditions make up the JTB analysis of knowledge?", correctAnswer: "justified, true, belief", explanation: "Knowledge is traditionally analyzed as justified true belief." },
      { topicSlug: "jtb-gettier", prompt: "In one sentence, what do Gettier cases show about JTB?", correctAnswer: "They show that justified true belief is not sufficient for knowledge, because the belief can be true by luck.", explanation: "Gettier cases meet all three conditions yet aren't knowledge." },
      { topicSlug: "perception-reality", prompt: "Locke called color and taste which kind of quality — primary or secondary?", correctAnswer: "secondary", explanation: "Secondary qualities are powers to produce sensations; primary qualities like shape belong to the object itself." },
      { topicSlug: "theories-of-truth", prompt: "Which theory says a statement is true when it matches the way the world is?", correctAnswer: "the correspondence theory", explanation: "Correspondence ties truth to matching the facts; coherence and pragmatism are the alternatives." },
    ],
  },
  {
    kind: "midterm",
    title: "Midterm — Units 1 & 2",
    weekNumber: 2,
    isTimed: true,
    timeLimitMinutes: 60,
    instructions: "Cumulative midterm covering Units 1–2. 60 minutes. Pasting disabled; keystrokes screened.",
    problems: [
      { topicSlug: "what-is-philosophy", prompt: "Name the four areas of philosophy covered in this course.", correctAnswer: "logic/critical reasoning, epistemology, philosophy of mind, and metaphysics and ethics", explanation: "The course is organized into these four families of questions." },
      { topicSlug: "validity-soundness", prompt: "Can a valid argument have a false conclusion? Answer yes or no and explain in one phrase.", correctAnswer: "yes; if at least one premise is false", explanation: "Validity only guarantees the conclusion if the premises are true; with a false premise a valid argument can have a false conclusion." },
      { topicSlug: "deductive-inductive", prompt: "Are inductive arguments evaluated as valid/invalid or as strong/weak?", correctAnswer: "strong/weak", explanation: "We reserve valid/invalid for deduction; induction is strong or weak." },
      { topicSlug: "epistemology", prompt: "Distinguish propositional knowledge from procedural knowledge in one sentence.", correctAnswer: "Propositional knowledge is knowing that something is the case, while procedural knowledge is knowing how to do something.", explanation: "Knowing-that vs. knowing-how." },
      { topicSlug: "rationalism-empiricism", prompt: "Define a priori knowledge in one sentence.", correctAnswer: "A priori knowledge is knowledge justified independently of sense experience.", explanation: "E.g., that 7 + 5 = 12, grasped by reason alone." },
      { topicSlug: "jtb-gettier", prompt: "What is the broad lesson Gettier cases teach about knowledge and luck?", correctAnswer: "Knowledge must exclude luck — a belief that is true only by luck is not knowledge even if justified.", explanation: "The fatal feature of Gettier cases is luck slipping through the justification." },
      { topicSlug: "skepticism", prompt: "Why are skeptical scenarios like the brain in a vat so hard to refute? Answer in one sentence.", correctAnswer: "Because they are designed so that no observation could distinguish them from ordinary reality.", explanation: "Everything would seem exactly the same, so experience can't rule them out." },
      { topicSlug: "theories-of-truth", prompt: "State one objection to the coherence theory of truth.", correctAnswer: "A set of beliefs can be perfectly coherent yet false, like a consistent novel.", explanation: "Internal consistency doesn't guarantee correspondence to reality." },
    ],
  },

  // Unit 3
  {
    kind: "homework",
    title: "Homework 3.1 — Mind, dualism, and materialism",
    weekNumber: 3,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "mind-body-problem", prompt: "What is the chief objection to interactionist dualism — the problem of explaining what?", correctAnswer: "how a non-physical mind interacts with a physical body", explanation: "The interaction problem asks how mind and body causally affect each other if they are fundamentally different." },
      { topicSlug: "dualism", prompt: "Substance dualism says there are how many fundamentally different kinds of substance?", correctAnswer: "two", explanation: "Physical substance (body) and mental substance (mind/soul)." },
      { topicSlug: "materialism-physicalism", prompt: "Which materialist theory says mental states are defined by their causal role rather than their physical make-up?", correctAnswer: "functionalism", explanation: "Functionalism identifies mental states by their causal/functional role, allowing multiple realizability." },
      { topicSlug: "materialism-physicalism", prompt: "In the Mary's Room argument, does Mary seem to learn something new when she first sees red? Answer yes or no.", correctAnswer: "yes", explanation: "She seems to learn what red looks like, suggesting not all facts are physical." },
    ],
  },
  {
    kind: "homework",
    title: "Homework 3.2 — Identity, free will, and machine minds",
    weekNumber: 3,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "personal-identity", prompt: "Locke's theory says personal identity over time consists mainly in what kind of continuity?", correctAnswer: "psychological continuity / memory", explanation: "Locke tied identity to a continuous chain of consciousness and memory." },
      { topicSlug: "free-will-determinism", prompt: "Which position holds that free will and determinism are compatible?", correctAnswer: "compatibilism", explanation: "Compatibilists say freedom is acting from your own desires without compulsion, which is consistent with determinism." },
      { topicSlug: "consciousness-self", prompt: "What is the 'hard problem of consciousness'? Answer in one sentence.", correctAnswer: "The problem of explaining why there is subjective experience at all — why physical processing is accompanied by something it is like to undergo it.", explanation: "The hard problem concerns the existence of felt experience, not cognitive function." },
      { topicSlug: "artificial-minds", prompt: "In Searle's Chinese Room, the man manipulates symbols by their shape but lacks what — syntax or semantics?", correctAnswer: "semantics", explanation: "He has syntax (symbol manipulation) but no semantics (understanding of meaning)." },
    ],
  },
  {
    kind: "test",
    title: "Unit 3 Test — Philosophy of Mind",
    weekNumber: 3,
    isTimed: true,
    timeLimitMinutes: 40,
    instructions: "Timed. 40 minutes. Pasting disabled; keystrokes screened.",
    problems: [
      { topicSlug: "mind-body-problem", prompt: "In one sentence, state what the mind-body problem asks.", correctAnswer: "It asks what the relationship is between the mind and the physical body.", explanation: "The core question is how mental and physical states relate." },
      { topicSlug: "dualism", prompt: "What is the strongest objection to substance dualism?", correctAnswer: "the interaction problem — explaining how a non-physical mind can causally affect the physical body", explanation: "Causation seems to require contact or energy a non-physical mind lacks." },
      { topicSlug: "materialism-physicalism", prompt: "What does 'multiple realizability' suggest about the mind? Answer in one sentence.", correctAnswer: "That the same mental state can be realized in different physical substrates, so the mind is more like software than specific hardware.", explanation: "It argues against strict identity theory and for functionalism." },
      { topicSlug: "free-will-determinism", prompt: "State the dilemma of determinism in one sentence.", correctAnswer: "If determinism is true our choices are fixed and unfree, but if choices are undetermined they are merely random and still not free or responsible.", explanation: "Either horn seems to threaten free will." },
      { topicSlug: "artificial-minds", prompt: "What does Searle's Chinese Room aim to show about strong AI?", correctAnswer: "That running the right program (syntax) is not sufficient for genuine understanding (semantics).", explanation: "Computation alone can't produce a mind, on Searle's view." },
    ],
  },

  // Unit 4
  {
    kind: "homework",
    title: "Homework 4.1 — Metaphysics, God, and evil",
    weekNumber: 4,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "metaphysics", prompt: "What is the branch of metaphysics concerned with what kinds of things exist?", correctAnswer: "ontology", explanation: "Ontology studies what exists and what kinds of being there are." },
      { topicSlug: "arguments-god", prompt: "The cosmological argument concludes that the universe requires what?", correctAnswer: "a first cause / an uncaused cause", explanation: "It argues from the existence of the universe to a first or uncaused cause, identified with God." },
      { topicSlug: "arguments-god", prompt: "Kant objected to the ontological argument by denying that existence is a what?", correctAnswer: "a predicate", explanation: "Kant argued existence adds nothing to a concept, so you can't define a thing into existence." },
      { topicSlug: "problem-of-evil", prompt: "Which theodicy explains moral evil as the price of creatures having genuine free choice?", correctAnswer: "the free will defense", explanation: "The free will defense says a world with free agents is more valuable even though freedom permits evil." },
    ],
  },
  {
    kind: "homework",
    title: "Homework 4.2 — The ethical theories and justice",
    weekNumber: 4,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "consequentialism", prompt: "According to utilitarianism, the right action produces the greatest what for the greatest number?", correctAnswer: "happiness", explanation: "Utilitarianism maximizes overall happiness or well-being, counting everyone equally." },
      { topicSlug: "deontology", prompt: "Kant's Humanity formulation says to treat people never merely as a means but always as an what?", correctAnswer: "an end (in itself)", explanation: "Persons have dignity and must be treated as ends in themselves, not mere tools." },
      { topicSlug: "virtue-ethics", prompt: "Aristotle says a virtue is a mean between two extremes; courage is the mean between cowardice and what?", correctAnswer: "recklessness", explanation: "Courage lies between the deficiency (cowardice) and the excess (recklessness)." },
      { topicSlug: "political-philosophy", prompt: "Rawls asks us to choose society's rules from behind what device?", correctAnswer: "the veil of ignorance", explanation: "Behind the veil of ignorance you don't know your own social position, ensuring fair principles." },
    ],
  },
  {
    kind: "final",
    title: "Final Exam — All units",
    weekNumber: 4,
    isTimed: true,
    timeLimitMinutes: 90,
    instructions: "Cumulative final covering Units 1–4. 90 minutes. Pasting disabled; keystrokes screened.",
    problems: [
      { topicSlug: "validity-soundness", prompt: "Define a sound argument in one sentence.", correctAnswer: "A sound argument is a valid argument with all true premises, so its conclusion must be true.", explanation: "Soundness = validity + all true premises." },
      { topicSlug: "deductive-inductive", prompt: "Which kind of reasoning aims for certainty — deductive or inductive?", correctAnswer: "deductive", explanation: "Deduction guarantees the conclusion; induction only makes it probable." },
      { topicSlug: "jtb-gettier", prompt: "Is justified true belief sufficient for knowledge? Answer yes or no.", correctAnswer: "no", explanation: "Gettier cases show JTB can be met while the belief is true only by luck." },
      { topicSlug: "skepticism", prompt: "Whose method of doubt led to 'I think, therefore I am'?", correctAnswer: "Descartes", explanation: "Descartes' method of doubt salvaged the cogito as the one certainty." },
      { topicSlug: "dualism", prompt: "What is the main problem facing substance dualism?", correctAnswer: "the interaction problem", explanation: "Explaining how a non-physical mind affects a physical body." },
      { topicSlug: "free-will-determinism", prompt: "Compatibilism defines acting freely as acting how?", correctAnswer: "according to your own desires, without external compulsion", explanation: "Freedom is the absence of constraint, not the absence of causation." },
      { topicSlug: "consequentialism", prompt: "Give one standard objection to utilitarianism.", correctAnswer: "It can permit injustice, such as punishing an innocent person, if doing so maximizes overall happiness.", explanation: "Maximizing total welfare can override individual rights and justice." },
      { topicSlug: "deontology", prompt: "State Kant's Universal Law formulation of the Categorical Imperative.", correctAnswer: "Act only on a maxim you can will to become a universal law.", explanation: "A maxim that can't be universalized without contradiction is forbidden." },
      { topicSlug: "virtue-ethics", prompt: "What question does virtue ethics focus on, compared to act-focused theories?", correctAnswer: "What kind of person should I be? (character rather than which act to do)", explanation: "Virtue ethics centers on character and flourishing (eudaimonia)." },
      { topicSlug: "problem-of-evil", prompt: "Why is natural evil especially hard for theodicies? Answer in one sentence.", correctAnswer: "Because suffering from earthquakes, disease, and animal pain is not caused by human free choices, so the free will defense doesn't obviously cover it.", explanation: "Natural evil resists the most common theodicy." },
    ],
  },
];

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.execute(sql`select count(*)::int as n from topics`);
  const row = (existing.rows[0] ?? {}) as { n?: number };
  if ((row.n ?? 0) > 0) {
    logger.info("Seed: already populated, skipping");
    return;
  }
  logger.info("Seed: populating course content");

  // Topics + lectures
  const slugToTopicId = new Map<string, number>();
  for (let i = 0; i < TOPICS.length; i++) {
    const t = TOPICS[i]!;
    const [inserted] = await db
      .insert(topicsTable)
      .values({
        slug: t.slug,
        title: t.title,
        weekNumber: t.weekNumber,
        blurb: t.blurb,
        position: i,
      })
      .returning();
    if (!inserted) throw new Error(`Failed to insert topic ${t.slug}`);
    slugToTopicId.set(t.slug, inserted.id);
    await db.insert(lecturesTable).values({
      topicId: inserted.id,
      weekNumber: t.weekNumber,
      title: t.lectureTitle,
      body: t.body,
    });
  }

  // Assignments + problems
  for (let i = 0; i < ASSIGNMENTS.length; i++) {
    const a = ASSIGNMENTS[i]!;
    const [inserted] = await db
      .insert(assignmentsTable)
      .values({
        kind: a.kind,
        title: a.title,
        weekNumber: a.weekNumber,
        position: i,
        isTimed: a.isTimed,
        timeLimitMinutes: a.timeLimitMinutes,
        instructions: a.instructions,
      })
      .returning();
    if (!inserted) throw new Error(`Failed to insert assignment ${a.title}`);
    for (let p = 0; p < a.problems.length; p++) {
      const prob = a.problems[p]!;
      const topicId = slugToTopicId.get(prob.topicSlug);
      if (!topicId) throw new Error(`Unknown topic slug ${prob.topicSlug}`);
      await db.insert(problemsTable).values({
        assignmentId: inserted.id,
        topicId,
        position: p,
        prompt: prob.prompt,
        correctAnswer: prob.correctAnswer,
        explanation: prob.explanation,
        hint: prob.hint ?? null,
      });
    }
  }

  logger.info({ topics: TOPICS.length, assignments: ASSIGNMENTS.length }, "Seed complete");
}
