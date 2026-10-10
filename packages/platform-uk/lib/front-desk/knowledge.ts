/**
 * Answers: retrieval over a curated, non-clinical practice knowledge base (hazard H-ACC-2).
 * Lexical BM25 with citations. No generation: the answer is the matched article text.
 * Clinical questions are detected first and handed to a clinician, never answered here.
 */

export type KnowledgeArticle = { id: string; title: string; body: string; keywords: string[] };

export const PRACTICE_KNOWLEDGE: KnowledgeArticle[] = [
  {
    id: "kb-hours",
    title: "Opening hours",
    body: "The surgery is open 8am to 6:30pm, Monday to Friday. Outside these hours, call NHS 111 or use 111.nhs.uk. In an emergency, call 999.",
    keywords: ["open", "opening", "hours", "close", "closing", "weekend", "saturday", "sunday", "evening"],
  },
  {
    id: "kb-repeat",
    title: "Repeat prescriptions",
    body: "Order repeat medicines through the patient app, your online account, or your community pharmacy. Allow two working days before collecting. The practice team handles anything that isn’t on your repeat list.",
    keywords: ["repeat", "prescription", "prescriptions", "medication", "order", "pharmacy", "refill"],
  },
  {
    id: "kb-results",
    title: "Test results",
    body: "Your results are reviewed by a clinician first. You can see many results in the patient app. If a clinician needs to talk to you, the practice will contact you. Results aren’t given over this line.",
    keywords: ["result", "results", "blood", "test", "tests", "back"],
  },
  {
    id: "kb-fasting",
    title: "Preparing for a blood test",
    body: "Some blood tests need you to fast. If your appointment letter or text says fasting, have nothing to eat for 10 to 12 hours before; water is fine. Keep taking your usual medicines unless a clinician has told you otherwise.",
    keywords: ["fast", "fasting", "eat", "before", "blood", "prepare", "preparation"],
  },
  {
    id: "kb-diabetes-review",
    title: "Your diabetes review",
    body: "Your annual diabetes review usually has two parts: a blood test and urine sample first, then a review with the nurse about a week later. Please bring your meter or readings and a list of your medicines.",
    keywords: ["diabetes", "review", "annual", "check", "bring", "meter", "readings", "urine"],
  },
  {
    id: "kb-fitnote",
    title: "Fit notes",
    body: "You can self-certify for the first seven days off work. After that, request a fit note through the practice website or the patient app and a clinician will review it.",
    keywords: ["fit", "note", "sick", "work", "certificate", "off"],
  },
  {
    id: "kb-register",
    title: "Registering with the practice",
    body: "You can register online through the practice website. You don’t need proof of address or ID to register with a GP practice.",
    keywords: ["register", "registering", "join", "new", "patient", "sign", "up"],
  },
  {
    id: "kb-cancel",
    title: "Cancelling appointments",
    body: "Please let us know as early as you can if you can’t make an appointment, so someone else can use it. You can cancel with me now, in the patient app, or by text reply.",
    keywords: ["cancel", "cancellation", "can't", "make", "miss", "missed"],
  },
  {
    id: "kb-access",
    title: "Accessibility and parking",
    body: "The building is step-free with an accessible toilet and a hearing loop at reception. There are two disabled parking bays at the front. Tell us if you need an interpreter and we’ll book one.",
    keywords: ["parking", "park", "wheelchair", "access", "accessible", "interpreter", "hearing", "loop"],
  },
  {
    id: "kb-vaccines",
    title: "Flu and COVID vaccinations",
    body: "Eligible patients are invited by text or letter each autumn. You can also book at a community pharmacy. If you’re not sure whether you’re eligible, I can pass you to the team.",
    keywords: ["flu", "covid", "vaccine", "vaccination", "jab", "booster"],
  },
];

/** Questions that need a clinician, not a knowledge article. */
const CLINICAL_PATTERNS = [
  /should i (take|stop|start|increase|reduce|double)/,
  /\b(dose|dosage|how much (insulin|metformin))\b/,
  /\bside effects?\b/,
  /\bis it (safe|normal|serious)\b/,
  /\bwhat does (my|this) (result|reading|number) mean\b/,
  /\b(diagnos|do i have)\b/,
];

const STOP = new Set(["the", "a", "an", "i", "my", "is", "are", "do", "you", "to", "of", "for", "and", "how", "what", "can", "it", "me", "in", "on", "at", "be", "with", "when", "your", "have"]);

function tokens(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

export type KnowledgeAnswer =
  | { kind: "answer"; article: KnowledgeArticle; score: number }
  | { kind: "clinical"; reason: string }
  | { kind: "no_match" };

export function isClinicalQuestion(text: string) {
  const t = text.toLowerCase();
  return CLINICAL_PATTERNS.some((re) => re.test(t));
}

export function answerQuestion(question: string, minScore = 1.2): KnowledgeAnswer {
  if (isClinicalQuestion(question)) {
    return { kind: "clinical", reason: "Clinical question: needs a clinician, not a knowledge article" };
  }
  const q = tokens(question);
  if (!q.length) return { kind: "no_match" };

  const docs = PRACTICE_KNOWLEDGE.map((a) => ({ a, t: [...tokens(`${a.title} ${a.body}`), ...a.keywords, ...a.keywords] }));
  const N = docs.length;
  const avgdl = docs.reduce((n, d) => n + d.t.length, 0) / N;
  const k1 = 1.2;
  const b = 0.75;
  const df = (term: string) => docs.filter((d) => d.t.includes(term)).length;

  let best: { a: KnowledgeArticle; score: number } | null = null;
  for (const d of docs) {
    let score = 0;
    for (const term of new Set(q)) {
      const n = df(term);
      if (!n) continue;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const tf = d.t.filter((x) => x === term).length;
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.t.length) / avgdl)));
    }
    if (!best || score > best.score) best = { a: d.a, score };
  }
  if (!best || best.score < minScore) return { kind: "no_match" };
  return { kind: "answer", article: best.a, score: Math.round(best.score * 100) / 100 };
}
