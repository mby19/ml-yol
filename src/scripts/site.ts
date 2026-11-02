import { isDone, readProgress, setDone } from "./storage";

const BASE = document.documentElement.dataset.base ?? "";
const href = (path: string) => `${BASE}${path}`;

/* ---------------------------- theme ------------------------------ */

function initTheme(): void {
  const button = document.getElementById("theme-toggle");
  if (!button) return;
  button.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("mlyol.theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
    button.setAttribute(
      "aria-label",
      dark ? "Açık temaya geç" : "Koyu temaya geç",
    );
  });
}

/* ---------------------------- menu ------------------------------- */

function initMenu(): void {
  const button = document.getElementById("menu-toggle");
  const menu = document.getElementById("mobile-nav");
  if (!button || !menu) return;
  const setOpen = (open: boolean) => {
    menu.dataset.open = open ? "true" : "false";
    button.setAttribute("aria-expanded", open ? "true" : "false");
  };
  button.addEventListener("click", () => {
    setOpen(menu.dataset.open !== "true");
  });
  menu.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.dataset.open === "true") {
      setOpen(false);
      button.focus();
    }
  });
}

/* ---------------------------- code copy --------------------------- */

function initCopyCode(): void {
  const blocks = Array.from(document.querySelectorAll<HTMLPreElement>(".prose pre"));
  blocks.forEach((pre) => {
    if (pre.parentElement?.classList.contains("code-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.replaceWith(wrap);
    wrap.appendChild(pre);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code";
    button.textContent = "Kopyala";
    button.setAttribute("aria-label", "Kodu kopyala");
    button.addEventListener("click", async () => {
      const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Kopyalandı";
        button.dataset.copied = "true";
      } catch {
        button.textContent = "Kopyalanamadı";
      }
      window.setTimeout(() => {
        button.textContent = "Kopyala";
        delete button.dataset.copied;
      }, 1800);
    });
    wrap.appendChild(button);
  });
}

/* ---------------------------- progress --------------------------- */

function initLessonToggle(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-complete]");
  if (!button) return;
  const lessonId = button.dataset.complete;
  if (!lessonId) return;
  const state = readProgress();
  const paint = (done: boolean) => {
    button.setAttribute("aria-pressed", done ? "true" : "false");
    const label = button.querySelector("[data-complete-label]");
    if (label) {
      label.textContent = done ? "Ders tamamlandı" : "Dersi tamamladım";
    }
  };
  paint(isDone(state, lessonId));
  button.addEventListener("click", () => {
    const next = button.getAttribute("aria-pressed") !== "true";
    setDone(lessonId, next);
    paint(next);
    paintLists();
    paintContinue();
    paintUnitCounts();
  });
}

function paintLists(): void {
  const state = readProgress();
  document.querySelectorAll<HTMLElement>("[data-lesson-link]").forEach((link) => {
    const id = link.dataset.lessonLink;
    if (!id) return;
    const done = isDone(state, id);
    link.classList.toggle("is-done", done);
    const row = link.closest(".timetable-row");
    if (row) row.classList.toggle("is-done", done);
    const stateNode = link.querySelector("[data-lesson-state]");
    if (stateNode) {
      stateNode.textContent = done ? "Tamam" : "";
    }
  });

  const data = document.getElementById("lesson-list-data");
  let lessons: ContinueLesson[] = [];
  if (data?.textContent) {
    try {
      lessons = JSON.parse(data.textContent) as ContinueLesson[];
    } catch {
      lessons = [];
    }
  }
  const units = new Map<string, { total: number; done: number }>();
  for (const lesson of lessons) {
    const entry = units.get(lesson.unit) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (isDone(state, lesson.id)) entry.done += 1;
    units.set(lesson.unit, entry);
  }
  const nextIncomplete = lessons.find((lesson) => !isDone(state, lesson.id));
  document.querySelectorAll<HTMLElement>("[data-station]").forEach((station) => {
    const unitId = station.dataset.station;
    if (!unitId) return;
    const entry = units.get(unitId);
    if (!entry) return;
    station.classList.toggle("is-done", entry.done === entry.total);
    station.classList.toggle("is-current", nextIncomplete?.unit === unitId);
  });
}

function paintUnitCounts(): void {
  const state = readProgress();
  document.querySelectorAll<HTMLElement>("[data-progress-unit]").forEach((node) => {
    const unitId = node.dataset.progressUnit;
    const total = Number(node.dataset.total ?? 0);
    if (!unitId || !total) return;
    const done = Array.from(
      document.querySelectorAll<HTMLElement>(
        `[data-lesson-link][data-unit-lesson="${unitId}"]`,
      ),
    ).filter((lesson) => {
      const id = lesson.dataset.lessonLink;
      return id ? isDone(state, id) : false;
    }).length;
    node.textContent = `${done}/${total}`;
  });
}

interface ContinueLesson {
  id: string;
  title: string;
  minutes: number;
  unit: string;
  unitTitle?: string;
}

function nextLesson(): ContinueLesson | null {
  const data = document.getElementById("lesson-list-data");
  if (!data?.textContent) return null;
  let lessons: ContinueLesson[];
  try {
    lessons = JSON.parse(data.textContent) as ContinueLesson[];
  } catch {
    return null;
  }
  const state = readProgress();
  return lessons.find((lesson) => !isDone(state, lesson.id)) ?? lessons[lessons.length - 1] ?? null;
}

function paintContinue(): void {
  const root = document.querySelector<HTMLElement>("[data-continue]");
  if (!root) return;
  const lesson = nextLesson();
  if (!lesson) return;
  const title = root.querySelector<HTMLElement>("[data-continue-title]");
  const meta = root.querySelector<HTMLElement>("[data-continue-meta]");
  const link = root.querySelector<HTMLAnchorElement>("[data-continue-link]");
  const state = readProgress();
  const allDone = Object.keys(state.done).length >= Number(root.dataset.total ?? 0);
  if (allDone) {
    if (title) title.textContent = "Bütün dersler işaretli";
    if (meta) meta.textContent = `${root.dataset.total ?? ""} ders tamam · planı gözden geçir`;
    if (link) {
      link.href = href("/plan");
      const label = link.querySelector("span");
      if (label) label.textContent = "Plana git";
    }
    return;
  }
  if (title) title.textContent = lesson.title;
  if (meta) {
    meta.textContent = `${lesson.unitTitle ?? lesson.unit} · ${lesson.minutes} dk · sıradaki`;
  }
  if (link) link.href = href(`/ders/${lesson.id}`);
}

/* ---------------------------- term panel -------------------------- */

interface TermData {
  id: string;
  term: string;
  en: string;
  short: string;
  mdHtml?: string;
  seeAlso?: string[];
}

let termsPromise: Promise<Map<string, TermData>> | null = null;

function loadTerms(): Promise<Map<string, TermData>> {
  if (!termsPromise) {
    termsPromise = fetch(href("/sozluk/veri.json"))
      .then((response) => {
        if (!response.ok) throw new Error("Sözlük verisi yüklenemedi");
        return response.json() as Promise<TermData[]>;
      })
      .then((terms) => new Map(terms.map((term) => [term.id, term])));
  }
  return termsPromise;
}

function initTermPanel(): void {
  const panel = document.getElementById("term-panel");
  const body = document.getElementById("term-body");
  const close = document.getElementById("term-close");
  const scrim = document.getElementById("term-scrim");
  if (!panel || !body || !close || !scrim) return;
  let lastTrigger: HTMLElement | null = null;
  let bodyOverflow = "";

  const regions = Array.from(
    document.querySelectorAll<HTMLElement>(".masthead, main, .site-foot"),
  );

  const closePanel = (restore = true) => {
    panel.dataset.open = "false";
    scrim.dataset.open = "false";
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");
    scrim.setAttribute("aria-hidden", "true");
    regions.forEach((region) => region.removeAttribute("inert"));
    document.body.style.overflow = bodyOverflow;
    if (restore && lastTrigger) lastTrigger.focus();
  };

  const render = (term: TermData) => {
    body.replaceChildren();
    const title = document.createElement("h2");
    title.id = "term-title";
    title.textContent = term.term;
    const en = document.createElement("p");
    en.className = "term-en";
    en.textContent = term.en;
    const short = document.createElement("p");
    short.className = "term-short";
    short.textContent = term.short;
    body.append(title, en, short);

    if (term.mdHtml) {
      const md = document.createElement("div");
      md.className = "term-md";
      md.innerHTML = term.mdHtml;
      body.appendChild(md);
    }
    if (term.seeAlso?.length) {
      loadTerms().then((terms) => {
        const see = document.createElement("div");
        see.className = "term-see";
        const label = document.createElement("span");
        label.className = "label";
        label.textContent = "Ayrıca bak";
        see.appendChild(label);
        term.seeAlso?.forEach((id) => {
          const related = terms.get(id);
          const link = document.createElement("a");
          link.href = href(`/sozluk/#${id}`);
          link.dataset.term = id;
          link.textContent = related?.term ?? id;
          see.appendChild(link);
        });
        body.appendChild(see);
      });
    }
    body.scrollTop = 0;
  };

  const open = async (id: string, trigger: HTMLElement) => {
    if (!trigger.closest("#term-panel")) lastTrigger = trigger;
    if (panel.dataset.open !== "true") {
      bodyOverflow = document.body.style.overflow;
    }
    panel.dataset.open = "true";
    scrim.dataset.open = "true";
    panel.setAttribute("aria-hidden", "false");
    panel.removeAttribute("inert");
    scrim.setAttribute("aria-hidden", "false");
    regions.forEach((region) => region.setAttribute("inert", ""));
    document.body.style.overflow = "hidden";
    body.innerHTML = '<p class="term-short">Yükleniyor…</p>';
    try {
      const terms = await loadTerms();
      const term = terms.get(id);
      if (!term) {
        body.textContent = "Bu terim sözlükte bulunamadı.";
        return;
      }
      render(term);
      close.focus();
    } catch {
      body.textContent = "Sözlük verisi yüklenemedi. Sözlük sayfasını açabilirsin.";
    }
  };

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>("a[data-term]");
    if (link) {
      const id = link.dataset.term;
      if (id) {
        event.preventDefault();
        void open(id, link);
      }
      return;
    }
    if (panel.dataset.open === "true" && !target.closest("#term-panel")) {
      closePanel(false);
    }
  });

  close.addEventListener("click", () => closePanel());
  scrim.addEventListener("click", () => closePanel());
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.dataset.open === "true") closePanel();
  });
}

/* ---------------------------- scroll progress --------------------- */

function initScrollProgress(): void {
  const bar = document.querySelector<HTMLElement>(".read-progress");
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${progress})`;
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

/* ---------------------------- tables ------------------------------ */

function initTables(): void {
  document.querySelectorAll<HTMLTableElement>(".prose table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-scroll")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-scroll";
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Tablo; yatay kaydırmak için kaydırın");
    table.replaceWith(wrap);
    wrap.appendChild(table);
  });
}

/* ---------------------------- print links ------------------------- */

function initPrintLinks(): void {
  document
    .querySelectorAll<HTMLAnchorElement>(".prose a[href^='http']")
    .forEach((link) => {
      if (link.textContent?.trim() !== link.href) link.classList.add("print-url");
    });
}

/* ---------------------------- shortcuts --------------------------- */

function initShortcuts(): void {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      return;
    }
    const input = document.getElementById("search-input") as HTMLInputElement | null;
    event.preventDefault();
    if (input) input.focus();
    else window.location.href = href("/arama");
  });
}

/* ---------------------------- boot -------------------------------- */

function boot(): void {
  initTheme();
  initMenu();
  initCopyCode();
  initTables();
  initPrintLinks();
  initLessonToggle();
  initTermPanel();
  initScrollProgress();
  initShortcuts();
  paintLists();
  paintContinue();
  paintUnitCounts();
  window.addEventListener("mlyol:progress", () => {
    paintLists();
    paintContinue();
    paintUnitCounts();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
