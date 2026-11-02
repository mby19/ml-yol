import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(root, "data", "course.json");
const raw = JSON.parse(await readFile(file, "utf8"));

const errors = [];
const ids = new Set();
const idPattern = /^[a-z0-9][a-z0-9-]*$/;

function checkId(id, where) {
  if (typeof id !== "string" || !idPattern.test(id)) {
    errors.push(`${where}: geçersiz id ${JSON.stringify(id)}`);
    return;
  }
  if (ids.has(id)) errors.push(`${where}: yinelenen id ${id}`);
  ids.add(id);
}

if (raw.type !== "course") errors.push(`type course değil: ${raw.type}`);
if (!Array.isArray(raw.areas) || raw.areas.length !== 1) {
  errors.push("areas tek alan içermeli");
}

const area = raw.areas?.[0];
const terms = new Map();
for (const term of area?.glossary ?? []) {
  checkId(term.id, "glossary");
  if (!term.term || !term.en || !term.short) errors.push(`terim eksik alan: ${term.id}`);
  if (term.short.length > 240) errors.push(`terim short > 240: ${term.id}`);
  terms.set(term.id, term);
}
for (const term of area?.glossary ?? []) {
  for (const related of term.seeAlso ?? []) {
    if (!terms.has(related)) errors.push(`${term.id}: seeAlso hedefi yok ${related}`);
  }
}

const pages = [];
for (const unit of area?.units ?? []) {
  checkId(unit.id, "unit");
  if (!unit.title) errors.push(`ünite başlığı yok: ${unit.id}`);
  if (!Array.isArray(unit.lessons) || unit.lessons.length === 0) {
    errors.push(`ünite ders içermiyor: ${unit.id}`);
  }
  for (const lesson of unit.lessons ?? []) {
    checkId(lesson.id, "lesson");
    if (!lesson.title) errors.push(`ders başlığı yok: ${lesson.id}`);
    if (!(lesson.minutes > 0)) errors.push(`ders minutes pozitif değil: ${lesson.id}`);
    if (!Array.isArray(lesson.pages) || lesson.pages.length === 0) {
      errors.push(`ders sayfa içermiyor: ${lesson.id}`);
    }
    for (const page of lesson.pages ?? []) {
      checkId(page.id, "page");
      if (!["text", "code", "check", "summary"].includes(page.kind)) {
        errors.push(`bilinmeyen sayfa türü: ${page.id} ${page.kind}`);
      }
      if (typeof page.md !== "string" || page.md.trim() === "") {
        errors.push(`boş markdown: ${page.id}`);
      }
      if (page.kind === "check" && !(page.answer ?? "").trim()) {
        errors.push(`kontrol cevabı yok: ${page.id}`);
      }
      pages.push(page);
    }
  }
}

const termLink = /\]\(term:([a-z0-9-]+)\)/g;
let termLinks = 0;
for (const page of pages) {
  for (const text of [page.md, page.answer ?? ""]) {
    for (const match of text.matchAll(termLink)) {
      termLinks += 1;
      if (!terms.has(match[1])) errors.push(`${page.id}: sözlükte olmayan terim ${match[1]}`);
    }
  }
}

const kinds = pages.reduce((acc, page) => {
  acc[page.kind] = (acc[page.kind] ?? 0) + 1;
  return acc;
}, {});

console.log(
  [
    `ünite: ${area?.units?.length ?? 0}`,
    `ders: ${(area?.units ?? []).reduce((n, unit) => n + unit.lessons.length, 0)}`,
    `sayfa: ${pages.length}`,
    `terim: ${terms.size}`,
    `term bağlantısı: ${termLinks}`,
    `türler: ${JSON.stringify(kinds)}`,
  ].join(" · "),
);

if (errors.length) {
  console.error(`\n${errors.length} hata:`);
  for (const error of errors.slice(0, 40)) console.error(` - ${error}`);
  process.exit(1);
}
console.log("kaynak doğrulandı: 0 hata");
