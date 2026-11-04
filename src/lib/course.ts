import courseJson from "../../data/course.json";
import derinJson from "../../data/derin.json";

export type PageKind = "text" | "code" | "check" | "summary" | "choice" | "input";

export interface CoursePage {
  id: string;
  kind: PageKind;
  md: string;
  answer?: string;
  options?: { id?: string; md: string; why?: string }[];
  correct?: string | string[];
  accept?: string[];
  explain?: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  minutes: number;
  pages: CoursePage[];
}

export interface CourseUnit {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  en: string;
  short: string;
  md?: string;
  seeAlso?: string[];
}

interface CourseArea {
  id: string;
  title: string;
  glossary: GlossaryTerm[];
  units: CourseUnit[];
}

export interface Course {
  type: string;
  version: number;
  areas: CourseArea[];
}

export interface Phase {
  key: string;
  code: string;
  name: string;
  longName: string;
  units: CourseUnit[];
  lessons: LessonRef[];
  minutes: number;
  index: number;
}

export interface LessonRef {
  id: string;
  title: string;
  minutes: number;
  pages: CoursePage[];
  unit: CourseUnit;
  phase: Phase;
  station: string;
  stationCode: string;
  lessonIndex: number;
  globalIndex: number;
  area: "yol" | "derin";
}

const course = courseJson as Course;
const area = course.areas[0];
const derinArea = (derinJson as Course).areas[0];

/** Katmanlar: ağın sütunları. Sıra = müfredattaki faz sırası. */
const PHASE_DEFS = [
  { key: "baslangic", code: "B", name: "Başlangıç", longName: "Başlangıç", test: (u: CourseUnit) => u.id.startsWith("u") },
  { key: "araclar", code: "A", name: "Araçlar", longName: "Araçlar", test: (u: CourseUnit) => /^a\d/.test(u.id) },
  { key: "f0", code: "F0", name: "Matematik", longName: "F0 · Matematik", test: (u: CourseUnit) => u.id.startsWith("f0-") },
  { key: "f1", code: "F1", name: "Klasik ML", longName: "F1 · Klasik ML", test: (u: CourseUnit) => u.id.startsWith("f1-") },
  { key: "f2", code: "F2", name: "Derin öğrenme", longName: "F2 · Derin öğrenme", test: (u: CourseUnit) => u.id.startsWith("f2-") },
  { key: "f3", code: "F3", name: "Transformer ve LLM", longName: "F3 · Transformer ve LLM", test: (u: CourseUnit) => u.id.startsWith("f3-") },
  { key: "f4", code: "F4", name: "MLOps", longName: "F4 · MLOps ve production", test: (u: CourseUnit) => u.id.startsWith("f4-") },
  { key: "f5", code: "F5", name: "Sistemler", longName: "F5 · Sistemler ve ölçekleme", test: (u: CourseUnit) => u.id.startsWith("f5-") },
  { key: "f6", code: "F6", name: "Sistem tasarımı", longName: "F6 · Sistem tasarımı ve senior", test: (u: CourseUnit) => u.id.startsWith("f6-") },
];

const phases: Phase[] = [];
const phaseByKey = new Map<string, Phase>();
PHASE_DEFS.forEach((def, index) => {
  const units = area.units.filter(def.test);
  if (!units.length) return;
  const phase: Phase = { key: def.key, code: def.code, name: def.name, longName: def.longName, units, lessons: [], minutes: 0, index };
  phases.push(phase);
  phaseByKey.set(def.key, phase);
});

const mappedUnits = phases.reduce((sum, phase) => sum + phase.units.length, 0);
if (mappedUnits !== area.units.length) {
  throw new Error(`Eşlenmeyen ünite var: ${area.units.length} ünitenin ${mappedUnits} tanesi bir katmana bağlandı. src/lib/course.ts içindeki PHASE_DEFS güncellenmeli.`);
}

function phaseOf(unit: CourseUnit): Phase {
  const def = PHASE_DEFS.find((d) => d.test(unit))!;
  return phaseByKey.get(def.key)!;
}

/** Okuma sırası = dosyadaki ünite sırası (matematik ML ünitelerinin arasına dağılmış durur). */
const allLessons: LessonRef[] = [];
const unitCodes = new Map<string, string>();
area.units.forEach((unit) => {
  const phase = phaseOf(unit);
  const code = `${phase.code}-${String(phase.units.indexOf(unit) + 1).padStart(2, "0")}`;
  unitCodes.set(unit.id, code);
  unit.lessons.forEach((lesson, i) => {
    const ref: LessonRef = {
      id: lesson.id, title: lesson.title, minutes: lesson.minutes, pages: lesson.pages,
      unit, phase, station: shortUnitTitle(unit), stationCode: code, lessonIndex: i + 1,
      globalIndex: allLessons.length, area: "yol",
    };
    allLessons.push(ref);
    phase.lessons.push(ref);
    phase.minutes += lesson.minutes;
  });
});

/* ---------- ML Derinleşme ---------- */
export interface DerinGroup {
  key: string;
  label: string;
  phase?: Phase;
  units: CourseUnit[];
  minutes: number;
}
const DERIN_TUR: Record<string, string> = { "rh-": "Kitap rehberi", "d2l-": "D2L", "mk-": "Makaleler", "dr-": "Derinleştirme", "uz-": "Uzmanlık", "vk-": "Vaka" };
export function derinKind(unit: CourseUnit): string {
  const k = Object.keys(DERIN_TUR).find((p) => unit.id.startsWith(p));
  return k ? DERIN_TUR[k] : "Derinleşme";
}
export function derinTag(unit: CourseUnit): string {
  return unit.title.match(/\[([^\]]+)\]/)?.[1] ?? "";
}
const derinGroups: DerinGroup[] = [];
const derinLessons: LessonRef[] = [];
derinArea.units.forEach((unit) => {
  const tag = derinTag(unit);
  const lead = tag.match(/^(Araçlar|F\d)/)?.[1] ?? "F1";
  const phase = lead === "Araçlar" ? phaseByKey.get("araclar") : phaseByKey.get(lead.toLowerCase());
  let g = derinGroups.find((x) => x.key === tag);
  if (!g) {
    g = { key: tag, label: tag, phase, units: [], minutes: 0 };
    derinGroups.push(g);
  }
  g.units.push(unit);
  unit.lessons.forEach((lesson, i) => {
    g!.minutes += lesson.minutes;
    derinLessons.push({
      id: lesson.id, title: lesson.title, minutes: lesson.minutes, pages: lesson.pages, unit,
      phase: phase ?? phases[0], station: shortUnitTitle(unit), stationCode: derinKind(unit),
      lessonIndex: i + 1, globalIndex: derinLessons.length, area: "derin",
    });
  });
});

/* Sözlük: iki alanın birleşimi; ana yolun tanımı önceliklidir. */
const termMap = new Map<string, GlossaryTerm>();
[...area.glossary, ...derinArea.glossary].forEach((t) => {
  if (!termMap.has(t.id)) termMap.set(t.id, t);
});
const glossary = [...termMap.values()].sort((a, b) => a.term.localeCompare(b.term, "tr"));
const lessonById = new Map([...allLessons, ...derinLessons].map((lesson) => [lesson.id, lesson]));
const unitById = new Map([...area.units, ...derinArea.units].map((u) => [u.id, u]));

const count = (list: LessonRef[], kind: PageKind) => list.reduce((s, l) => s + l.pages.filter((p) => p.kind === kind).length, 0);

export const courseInfo = {
  title: area.title,
  id: area.id,
  version: course.version,
  units: area.units.length,
  lessons: allLessons.length,
  pages: allLessons.reduce((sum, lesson) => sum + lesson.pages.length, 0),
  minutes: allLessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
  terms: glossary.length,
  checks: count(allLessons, "check"),
  codePages: count(allLessons, "code"),
};

export const derinInfo = {
  title: derinArea.title,
  units: derinArea.units.length,
  lessons: derinLessons.length,
  pages: derinLessons.reduce((s, l) => s + l.pages.length, 0),
  minutes: derinLessons.reduce((s, l) => s + l.minutes, 0),
  checks: count(derinLessons, "check"),
};

export { area, derinArea, phases, allLessons, derinLessons, derinGroups, glossary, lessonById, unitById, unitCodes, phaseOf };

export function shortUnitTitle(unit: CourseUnit): string {
  const clean = unit.title.replace(/\s*\[[^\]]+\]\s*$/, "");
  const afterDash = clean.split("—").pop()?.trim() ?? clean;
  return afterDash.split("·").pop()?.trim() ?? clean;
}

export function pagesOfKind(lesson: CourseLesson, kind: PageKind): CoursePage[] {
  return lesson.pages.filter((page) => page.kind === kind);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} sa ${rest} dk` : `${hours} sa`;
}

export function formatHours(minutes: number): string {
  return `${Math.round(minutes / 60).toLocaleString("tr-TR")} sa`;
}
