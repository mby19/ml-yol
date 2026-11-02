import { allLessons, phases, type Phase } from "./course";

export type SourceMode = "companion" | "deepening";

export type SourceKind =
  | "Makale"
  | "Dokümantasyon"
  | "Kitap"
  | "Ders"
  | "Kod deposu"
  | "Yazı"
  | "Video"
  | "Platform"
  | "Bağlantısız bölüm"
  | "Diğer";

export interface SourceEntry {
  id: string;
  lessonId: string;
  lessonTitle: string;
  lessonMinutes: number;
  lessonIndex: number;
  phaseKey: string;
  phaseCode: string;
  phaseName: string;
  mode: SourceMode;
  modeLabel: string;
  description: string;
  urls: string[];
  domains: string[];
  kind: SourceKind;
  search: string;
}

const URL_RE = /https?:\/\/[^\s)]+/g;

function extractSection(markdown: string, heading: string, stops: string[]): string {
  const marker = `**${heading}**`;
  const start = markdown.indexOf(marker);
  if (start < 0) return "";
  const after = markdown.slice(start + marker.length);
  let end = after.length;
  for (const stop of stops) {
    const position = after.indexOf(`**${stop}**`);
    if (position >= 0 && position < end) end = position;
  }
  return after.slice(0, end);
}

function parseBullets(block: string): string[] {
  const items: string[] = [];
  let current: string[] | null = null;
  for (const line of block.split("\n")) {
    if (/^\s*-\s+/.test(line)) {
      if (current) items.push(current.join(" "));
      current = [line.replace(/^\s*-\s+/, "").trim()];
    } else if (current && line.trim()) {
      current.push(line.trim());
    }
  }
  if (current) items.push(current.join(" "));
  return items;
}

function cleanDescription(text: string): string {
  return text
    .replace(URL_RE, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s*[—–-]\s*$/g, "")
    .replace(/\s*[:\s]+$/g, "")
    .replace(/\s*\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const PAPER_HOSTS: string[] = [
  "arxiv.org",
  "aclanthology.org",
  "openreview.net",
  "proceedings.mlr.press",
  "papers.nips.cc",
  "jmlr.org",
  "distill.pub",
];

const BOOK_HOSTS: string[] = [
  "mml-book.github.io",
  "probml.github.io",
  "www.deeplearningbook.org",
  "deeplearningbook.org",
  "d2l.ai",
  "www.statlearning.com",
  "statlearning.com",
];

const COURSE_HOSTS: string[] = [
  "ocw.mit.edu",
  "coursera.org",
  "deeplearning.ai",
  "www.deeplearning.ai",
  "web.stanford.edu",
  "cs231n.github.io",
  "introtodeeplearning.com",
  "course.fast.ai",
  "fast.ai",
  "cs336.stanford.edu",
  "seeing-theory.brown.edu",
  "www.cs.cmu.edu",
  "www.cs.toronto.edu",
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "www.3blue1brown.com",
  "3blue1brown.com",
];

const ARTICLE_HOSTS: string[] = [
  "huyenchip.com",
  "jalammar.github.io",
  "karpathy.ai",
  "sebastianraschka.com",
  "lilianweng.github.io",
  "simonwillison.net",
  "openai.com",
  "anthropic.com",
];

const DOC_HOSTS: string[] = [
  "scikit-learn.org",
  "numpy.org",
  "pandas.pydata.org",
  "pytorch.org",
  "developers.google.com",
  "matplotlib.org",
  "seaborn.pydata.org",
  "keras.io",
  "xgboost.readthedocs.io",
  "lightgbm.readthedocs.io",
  "mlflow.org",
];

function splitUrl(url: string): { host: string; path: string } {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname.replace(/^www\./, ""),
      path: parsed.pathname,
    };
  } catch {
    return { host: "", path: "" };
  }
}

function classify(urls: string[]): SourceKind {
  if (!urls.length) return "Bağlantısız bölüm";
  const { host, path } = splitUrl(urls[0]);
  if (PAPER_HOSTS.includes(host)) return "Makale";
  if (BOOK_HOSTS.includes(host)) return "Kitap";
  if (host === "wesmckinney.com" && path.startsWith("/book")) return "Kitap";
  if (host === "github.com") return "Kod deposu";
  if (host === "youtube.com" || host === "youtu.be" || host === "www.youtube.com") {
    return "Video";
  }
  if (host === "huggingface.co" && path.startsWith("/learn")) return "Ders";
  if (host === "huggingface.co" && path.startsWith("/docs")) return "Dokümantasyon";
  if (
    host.startsWith("docs.") ||
    host.endsWith(".readthedocs.io") ||
    DOC_HOSTS.includes(host)
  ) {
    return "Dokümantasyon";
  }
  if (COURSE_HOSTS.includes(host)) return "Ders";
  if (ARTICLE_HOSTS.includes(host)) return "Yazı";
  if (host === "huggingface.co" || host === "kaggle.com" || host === "colab.research.google.com") {
    return "Platform";
  }
  return "Diğer";
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll("â", "a")
    .replaceAll("î", "i")
    .replaceAll("û", "u");
}

function parseLesson(lesson: (typeof allLessons)[number]): SourceEntry[] {
  const summary = lesson.pages.find((page) => page.kind === "summary");
  if (!summary) return [];
  const definitions: { mode: SourceMode; heading: string; stops: string[] }[] = [
    { mode: "companion", heading: "Bu derse eşlik eden", stops: ["Derinleşmek için", "Süre:"] },
    { mode: "deepening", heading: "Derinleşmek için", stops: ["Süre:"] },
];
  const entries: SourceEntry[] = [];
  for (const definition of definitions) {
    const bullets = parseBullets(extractSection(summary.md, definition.heading, definition.stops));
    bullets.forEach((bullet, index) => {
      const urls = Array.from(
        new Set(
          (bullet.match(URL_RE) ?? []).map((url) => url.replace(/[).,;]+$/, "")),
        ),
      );
      const domains = Array.from(
        new Set(urls.map((url) => splitUrl(url).host).filter(Boolean)),
      );
      const description = cleanDescription(bullet) || "Bağlantı";
      const kind = classify(urls);
      const modeLabel = definition.mode === "deepening" ? "Derinleşmek için" : "Bu derse eşlik eden";
      entries.push({
        id: `${lesson.id}-${definition.mode}-${index}`,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonMinutes: lesson.minutes,
        lessonIndex: lesson.globalIndex,
        phaseKey: lesson.phase.key,
        phaseCode: lesson.phase.code,
        phaseName: lesson.phase.name,
        mode: definition.mode,
        modeLabel,
        description,
        urls,
        domains,
        kind,
        search: normalize(
          `${lesson.title} ${lesson.phase.name} ${modeLabel} ${description} ${kind} ${domains.join(" ")}`,
        ),
      });
    });
  }
  return entries;
}

export const sourceEntries: SourceEntry[] = allLessons
  .flatMap(parseLesson)
  .sort((a, b) => {
    const phaseDiff =
      (phases.findIndex((phase) => phase.key === a.phaseKey) ?? 0) -
      (phases.findIndex((phase) => phase.key === b.phaseKey) ?? 0);
    if (phaseDiff) return phaseDiff;
    if (a.lessonIndex !== b.lessonIndex) return a.lessonIndex - b.lessonIndex;
    if (a.mode !== b.mode) return a.mode === "companion" ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

const companion = sourceEntries.filter((entry) => entry.mode === "companion");
const deepening = sourceEntries.filter((entry) => entry.mode === "deepening");
const allUrls = new Set(sourceEntries.flatMap((entry) => entry.urls));
const companionUrls = new Set(companion.flatMap((entry) => entry.urls));
const deepeningUrls = new Set(deepening.flatMap((entry) => entry.urls));
const deepeningOnly = new Set(
  deepening.flatMap((entry) => entry.urls).filter((url) => !companionUrls.has(url)),
);
const deepeningLessonIds = new Set(deepening.map((entry) => entry.lessonId));

const byType = new Map<SourceKind, number>();
for (const entry of sourceEntries) {
  byType.set(entry.kind, (byType.get(entry.kind) ?? 0) + 1);
}

const byPhase = phases.map((phase: Phase) => {
  const phaseDeepening = deepening.filter((entry) => entry.phaseKey === phase.key);
  return {
    phase,
    entries: phaseDeepening.length,
    unique: new Set(phaseDeepening.flatMap((entry) => entry.urls)).size,
    lessons: phase.lessons.length,
    lessonsWithDeepening: new Set(phaseDeepening.map((entry) => entry.lessonId)).size,
  };
});

const topDomains = new Map<string, number>();
for (const entry of sourceEntries) {
  for (const domain of entry.domains) {
    topDomains.set(domain, (topDomains.get(domain) ?? 0) + 1);
  }
}

export const sourceStats = {
  entries: sourceEntries.length,
  companionEntries: companion.length,
  deepeningEntries: deepening.length,
  uniqueUrls: allUrls.size,
  companionUrls: companionUrls.size,
  deepeningUrls: deepeningUrls.size,
  overlapUrls: Array.from(deepeningUrls).filter((url) => companionUrls.has(url)).length,
  deepeningOnlyUrls: deepeningOnly.size,
  noLinkEntries: sourceEntries.filter((entry) => entry.urls.length === 0).length,
  noLinkDeepening: deepening.filter((entry) => entry.urls.length === 0).length,
  lessons: allLessons.length,
  lessonsWithDeepening: deepeningLessonIds.size,
  lessonsWithoutDeepening: allLessons.filter((lesson) => !deepeningLessonIds.has(lesson.id)),
  byPhase,
  byType: Array.from(byType.entries()).sort((a, b) => b[1] - a[1]),
  topDomains: Array.from(topDomains.entries()).sort((a, b) => b[1] - a[1]),
};

export function phaseLineClass(key: string): string {
  if (key === "baslangic") return "line-b";
  if (key === "araclar") return "line-a";
  return `line-${key}`;
}
