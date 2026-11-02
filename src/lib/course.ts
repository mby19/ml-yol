import courseJson from "../../data/course.json";

export type PageKind = "text" | "code" | "check" | "summary";

export interface CoursePage {
  id: string;
  kind: PageKind;
  md: string;
  answer?: string;
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

export interface Course {
  type: string;
  version: number;
  areas: {
    id: string;
    title: string;
    glossary: GlossaryTerm[];
    units: CourseUnit[];
  }[];
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
}

const course = courseJson as Course;
const area = course.areas[0];

const PHASE_DEFS = [
  { key: "baslangic", code: "B", name: "Başlangıç", longName: "Başlangıç", test: (u: CourseUnit) => u.id.startsWith("u0-") },
  { key: "araclar", code: "A", name: "Araçlar", longName: "Araçlar", test: (u: CourseUnit) => u.id.startsWith("a") && !u.id.startsWith("f") },
  { key: "f0", code: "F0", name: "Matematik", longName: "F0 · Matematik", test: (u: CourseUnit) => u.id.startsWith("f0-") },
  { key: "f1", code: "F1", name: "Klasik ML", longName: "F1 · Klasik ML", test: (u: CourseUnit) => u.id.startsWith("f1-") },
  { key: "f2", code: "F2", name: "Derin öğrenme", longName: "F2 · Derin öğrenme", test: (u: CourseUnit) => u.id.startsWith("f2-") },
  { key: "f3", code: "F3", name: "Transformer ve LLM", longName: "F3 · Transformer ve LLM", test: (u: CourseUnit) => u.id.startsWith("f3-") },
];

const phases: Phase[] = [];

PHASE_DEFS.forEach((def, index) => {
  const units = area.units.filter(def.test);
  if (!units.length) return;
  const lessons: LessonRef[] = [];
  const phase: Phase = {
    key: def.key,
    code: def.code,
    name: def.name,
    longName: def.longName,
    units,
    lessons,
    minutes: 0,
    index,
  };
  phases.push(phase);
  units.forEach((unit, unitIndex) => {
    const station = shortUnitTitle(unit);
    const stationCode = `${def.code}-${String(unitIndex + 1).padStart(2, "0")}`;
    unit.lessons.forEach((lesson) => {
      lessons.push({
        id: lesson.id,
        title: lesson.title,
        minutes: lesson.minutes,
        pages: lesson.pages,
        unit,
        phase,
        station,
        stationCode,
        lessonIndex: unit.lessons.indexOf(lesson) + 1,
        globalIndex: 0,
      });
    });
    phase.minutes += unit.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  });
});

const mappedUnits = phases.reduce((sum, phase) => sum + phase.units.length, 0);
if (mappedUnits !== area.units.length) {
  throw new Error(
    `Eşlenmeyen ünite var: ${area.units.length} ünitenin ${mappedUnits} tanesi bir hatta bağlandı. ` +
      "Yeni faz eklendiyse src/lib/course.ts içindeki PHASE_DEFS ve hat rengi güncellenmeli.",
  );
}

const allLessons: LessonRef[] = phases.flatMap((phase) => phase.lessons);
allLessons.forEach((lesson, index) => (lesson.globalIndex = index));

const glossary = [...area.glossary].sort((a, b) =>
  a.term.localeCompare(b.term, "tr"),
);
const lessonById = new Map(allLessons.map((lesson) => [lesson.id, lesson]));

export const courseInfo = {
  title: area.title,
  id: area.id,
  version: course.version,
  units: area.units.length,
  lessons: allLessons.length,
  pages: allLessons.reduce((sum, lesson) => sum + lesson.pages.length, 0),
  minutes: allLessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
  terms: glossary.length,
  checks: allLessons.reduce(
    (sum, lesson) => sum + lesson.pages.filter((page) => page.kind === "check").length,
    0,
  ),
  codePages: allLessons.reduce(
    (sum, lesson) => sum + lesson.pages.filter((page) => page.kind === "code").length,
    0,
  ),
};

export { area, phases, allLessons, glossary, lessonById };

export function shortUnitTitle(unit: CourseUnit): string {
  const afterDash = unit.title.split("—").pop()?.trim() ?? unit.title;
  return afterDash.split("·").pop()?.trim() ?? unit.title;
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
