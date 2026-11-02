import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");
const source = JSON.parse(await readFile(path.join(root, "data", "course.json"), "utf8"));
const area = source.areas[0];

const errors = [];
const lessonIds = area.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
const pageCount = area.units.reduce(
  (sum, unit) => sum + unit.lessons.reduce((n, lesson) => n + lesson.pages.length, 0),
  0,
);

async function read(relative) {
  return readFile(path.join(dist, relative), "utf8");
}

const lessonFiles = await readdir(path.join(dist, "ders"), { withFileTypes: true });
const lessonDirs = lessonFiles.filter((entry) => entry.isDirectory()).length;
if (lessonDirs !== lessonIds.length) {
  errors.push(`ders sayfası ${lessonDirs}, beklenen ${lessonIds.length}`);
}

let sections = 0;
let answers = 0;
let katexErrors = 0;
let termLinks = 0;

for (const id of lessonIds) {
  const html = await read(`ders/${id}/index.html`);
  sections += (html.match(/class="page-section"/g) ?? []).length;
  answers += (html.match(/class="prose check-answer"/g) ?? []).length;
  katexErrors += (html.match(/katex-error/g) ?? []).length;
  termLinks += (html.match(/class="term-link"/g) ?? []).length;
  if (!html.includes("data-pagefind-body")) errors.push(`${id}: pagefind body yok`);
  if ((html.match(/<h1/g) ?? []).length !== 1) errors.push(`${id}: tek h1 yok`);
}

if (sections !== pageCount) errors.push(`sayfa bölümü ${sections}, beklenen ${pageCount}`);
if (katexErrors > 0) errors.push(`${katexErrors} KaTeX hatası`);
if (answers !== area.units.reduce((sum, unit) => sum + unit.lessons.reduce((n, lesson) => n + lesson.pages.filter((p) => p.kind === "check").length, 0), 0)) {
  errors.push(`kontrol cevabı sayısı uyuşmuyor: ${answers}`);
}

const termCount = (await read("sozluk/index.html")).match(/<article class="term"/g)?.length ?? 0;
if (termCount !== area.glossary.length) errors.push(`sözlük ${termCount}, beklenen ${area.glossary.length}`);

const required = [
  "index.html",
  "404.html",
  "plan/index.html",
  "sozluk/index.html",
  "sozluk/veri.json",
  "arama/index.html",
  "hakkinda/index.html",
  "pagefind/pagefind.js",
  ".nojekyll",
];
for (const file of required) {
  try {
    await read(file);
  } catch {
    errors.push(`eksik çıktı: ${file}`);
  }
}

console.log(
  `çıktı: ${lessonDirs} ders · ${sections} sayfa · ${answers} kontrol · ${termCount} terim · ${termLinks} terim bağlantısı · ${katexErrors} KaTeX hatası`,
);

if (errors.length) {
  console.error(`\n${errors.length} hata:`);
  for (const error of errors.slice(0, 30)) console.error(` - ${error}`);
  process.exit(1);
}
console.log("çıktı doğrulandı: 0 hata");
