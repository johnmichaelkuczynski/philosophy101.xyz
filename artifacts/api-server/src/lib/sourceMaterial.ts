import corpus from "../content/source-material.txt";

export interface SourceSection {
  id: string;
  title: string;
  body: string;
  haystack: string;
}

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "had",
  "her", "was", "one", "our", "out", "his", "has", "what", "when", "which",
  "with", "that", "this", "from", "they", "their", "them", "into", "than",
  "then", "some", "such", "have", "does", "about", "between", "philosophy",
  "philosophical", "philosopher", "philosophers", "concept", "concepts",
  "idea", "ideas", "question", "questions", "thing", "things",
]);

function parseSections(raw: string): SourceSection[] {
  const lines = raw.split(/\r?\n/);
  const headerRe = /^(\d+(?:\.\d+)+)\.?\s*(.*)$/;
  const sections: SourceSection[] = [];
  let current: SourceSection | null = null;
  for (const line of lines) {
    const m = line.match(headerRe);
    if (m) {
      if (current) sections.push(current);
      const id = m[1] ?? "";
      const title = (m[2] ?? "").trim();
      current = { id, title, body: "", haystack: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) sections.push(current);
  for (const s of sections) {
    s.body = s.body.trim();
    s.haystack = `${s.title}\n${s.body}`.toLowerCase();
  }
  return sections.filter((s) => s.body.length > 120);
}

let cached: SourceSection[] | null = null;
function sections(): SourceSection[] {
  if (!cached) cached = parseSections(corpus);
  return cached;
}

function keywords(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of query.toLowerCase().split(/[^a-z]+/)) {
    if (tok.length < 4 || STOPWORDS.has(tok) || seen.has(tok)) continue;
    seen.add(tok);
    out.push(tok);
  }
  return out;
}

/**
 * Find the section(s) of the source corpus most relevant to a query (a topic
 * title, optionally plus a lecture excerpt). Returns a concatenated excerpt
 * capped at `maxChars`, or "" when nothing is relevant enough — so unrelated
 * course topics never get spurious analytic-philosophy text injected.
 */
export function findRelevantMaterial(query: string, maxChars = 2800): string {
  const kws = keywords(query);
  if (kws.length === 0) return "";
  const scored = sections().map((s) => {
    let score = 0;
    for (const kw of kws) {
      const inTitle = s.title.toLowerCase().includes(kw);
      const occurrences = s.haystack.split(kw).length - 1;
      if (occurrences > 0) score += occurrences + (inTitle ? 5 : 0);
    }
    const distinctHits = kws.filter((kw) => s.haystack.includes(kw)).length;
    return { s, score, distinctHits };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  // Require a real match: at least two distinct keyword hits AND a meaningful
  // cumulative score, so unrelated topics get no spurious material injected.
  if (!top || top.distinctHits < 2 || top.score < 4) return "";

  const picked: string[] = [];
  let used = 0;
  for (const { s, distinctHits } of scored) {
    if (distinctHits < 2) break;
    const header = `[§${s.id} ${s.title}]\n`;
    const remaining = maxChars - used;
    if (remaining < 400) break;
    const slice = (header + s.body).slice(0, remaining);
    picked.push(slice);
    used += slice.length;
    if (picked.length >= 2) break;
  }
  return picked.join("\n\n---\n\n").trim();
}
