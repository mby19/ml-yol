import { readProgress, writeProgress, isDone } from "./storage";

interface PlanLesson {
  id: string;
  order: number;
  title: string;
  minutes: number;
  unit: string;
  unitTitle: string;
  phase: string;
  phaseKey: string;
  track: "main" | "math";
}

interface QueueItem {
  lesson: PlanLesson;
  remaining: number;
  taken: number;
}

interface WeekItem {
  lesson: PlanLesson;
  minutes: number;
  continued: boolean;
  track: "main" | "math";
}

interface Week {
  items: WeekItem[];
  minutes: number;
}

const BASE = document.documentElement.dataset.base ?? "";
const href = (path: string) => `${BASE}${path}`;
const DAY = 86400000;

function parseDay(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY);
}

function fillWeek(
  week: Week,
  queue: QueueItem[],
  budget: number,
): number {
  let used = 0;
  while (budget - used > 0 && queue.length > 0) {
    const current = queue[0];
    const take = Math.min(budget - used, current.remaining);
    week.items.push({
      lesson: current.lesson,
      minutes: take,
      continued: current.taken > 0,
      track: current.lesson.track,
    });
    current.taken += take;
    current.remaining -= take;
    used += take;
    if (current.remaining === 0) queue.shift();
  }
  return used;
}

function toQueue(lessons: PlanLesson[]): QueueItem[] {
  return lessons.map((lesson) => ({
    lesson,
    remaining: lesson.minutes,
    taken: 0,
  }));
}

function buildWeeks(
  lessons: PlanLesson[],
  weeklyMinutes: number,
  mode: "parallel" | "sequential",
): Week[] {
  const weeks: Week[] = [];
  if (mode === "sequential") {
    const queue = toQueue(lessons);
    while (queue.length > 0 && weeks.length < 600) {
      const week: Week = { items: [], minutes: 0 };
      week.minutes = fillWeek(week, queue, weeklyMinutes);
      if (week.items.length === 0) break;
      weeks.push(week);
    }
    return weeks;
  }

  const prep = lessons.filter(
    (lesson) => lesson.phaseKey === "baslangic" || lesson.phaseKey === "araclar",
  );
  const core = lessons.filter(
    (lesson) =>
      lesson.phaseKey === "f1" ||
      lesson.phaseKey === "f2" ||
      lesson.phaseKey === "f3",
  );
  const prepQueue = toQueue(prep);
  const mainQueue = toQueue(core);
  const mathQueue = toQueue(lessons.filter((lesson) => lesson.track === "math"));

  while (prepQueue.length > 0 && weeks.length < 600) {
    const week: Week = { items: [], minutes: 0 };
    week.minutes = fillWeek(week, prepQueue, weeklyMinutes);
    if (week.items.length === 0) break;
    weeks.push(week);
  }

  while ((mainQueue.length > 0 || mathQueue.length > 0) && weeks.length < 600) {
    const week: Week = { items: [], minutes: 0 };
    const mathBudget = mathQueue.length
      ? mainQueue.length
        ? Math.round(weeklyMinutes / 3)
        : weeklyMinutes
      : 0;
    const mathUsed = fillWeek(week, mathQueue, mathBudget);
    const mainUsed = fillWeek(week, mainQueue, weeklyMinutes - mathUsed);
    week.minutes = mathUsed + mainUsed;
    if (week.items.length === 0) break;
    weeks.push(week);
  }
  return weeks;
}

const shortDate = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
});
const longDate = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const monthName = new Intl.DateTimeFormat("tr-TR", { month: "long" });

function weekRange(start: Date): string {
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${monthName.format(end)}`;
  }
  return `${shortDate.format(start)} – ${shortDate.format(end)}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} dk`;
  return rest ? `${hours} sa ${rest} dk` : `${hours} sa`;
}

function lessonLabel(lesson: PlanLesson): string {
  const suffix = lesson.track === "math" ? "Matematik" : "Ana hat";
  return `${suffix} · ${lesson.unitTitle}`;
}

function bootPlan(): void {
  const form = document.getElementById("plan-form") as HTMLFormElement | null;
  const startInput = document.getElementById("plan-start") as HTMLInputElement | null;
  const hoursInput = document.getElementById("plan-hours") as HTMLInputElement | null;
  const modeInput = document.getElementById("plan-mode") as HTMLSelectElement | null;
  const summary = document.getElementById("plan-summary");
  const todayPanel = document.getElementById("plan-today");
  const weekList = document.getElementById("week-list");
  const dataNode = document.getElementById("plan-data");
  if (
    !form ||
    !startInput ||
    !hoursInput ||
    !modeInput ||
    !summary ||
    !todayPanel ||
    !weekList ||
    !dataNode?.textContent
  ) {
    return;
  }

  let lessons: PlanLesson[];
  try {
    lessons = JSON.parse(dataNode.textContent) as PlanLesson[];
  } catch {
    return;
  }
  if (!lessons.length) return;

  const saved = readProgress().plan;
  startInput.value = saved.start;
  hoursInput.value = String(saved.hours);
  modeInput.value = saved.mode;

  const persist = () => {
    const state = readProgress();
    state.plan = {
      start: startInput.value || saved.start,
      hours: Math.min(60, Math.max(1, Number(hoursInput.value) || 15)),
      mode: modeInput.value === "sequential" ? "sequential" : "parallel",
    };
    writeProgress(state);
  };

  const render = () => {
    const hours = Math.min(60, Math.max(1, Number(hoursInput.value) || 15));
    const mode = modeInput.value === "sequential" ? "sequential" : "parallel";
    const start = parseDay(startInput.value || saved.start);
    const weekly = hours * 60;
    const weeks = buildWeeks(lessons, weekly, mode);
    const state = readProgress();
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const currentIndex = Math.floor((today.getTime() - start.getTime()) / (7 * DAY));

    const doneIds = new Set(lessons.filter((lesson) => isDone(state, lesson.id)).map((l) => l.id));
    const doneCount = doneIds.size;
    const percent = Math.round((doneCount / lessons.length) * 100);

    const finish = weeks.length ? addDays(start, weeks.length * 7 - 1) : start;

    summary.replaceChildren();
    const stats: [string, string, string][] = [
      [String(weeks.length), "hafta", `${hours} sa/hafta`],
      [
        longDate.format(finish),
        "bitiş",
        `${weeks.reduce((sum, week) => sum + week.minutes, 0).toLocaleString("tr-TR")} dk planlandı`,
      ],
      [`${doneCount}/${lessons.length}`, "ders tamam", `${percent}%`],
      [
        currentIndex < 0
          ? "Başlamadı"
          : weeks[currentIndex]
            ? weekRange(addDays(start, currentIndex * 7))
            : "Bitti",
        "bu hafta",
        currentIndex < 0
          ? longDate.format(start)
          : currentIndex < weeks.length
            ? `Hafta ${currentIndex + 1}`
            : "takvim dışı",
      ],
    ];
    for (const [value, label, sub] of stats) {
      const box = document.createElement("div");
      box.className = "plan-stat";
      const labelNode = document.createElement("span");
      labelNode.className = "label";
      labelNode.textContent = label;
      const valueNode = document.createElement("div");
      valueNode.className = "plan-stat-value";
      valueNode.textContent = value;
      const subNode = document.createElement("div");
      subNode.className = "plan-stat-sub";
      subNode.textContent = sub;
      box.append(labelNode, valueNode, subNode);
      summary.appendChild(box);
    }

    renderToday(todayPanel, {
      weeks,
      currentIndex,
      start,
      lessons,
      doneIds,
      mode,
    });

    weekList.replaceChildren();
    weeks.forEach((week, index) => {
      const li = document.createElement("li");
      li.className = "week";
      li.id = `hafta-${index + 1}`;
      if (index === currentIndex) li.classList.add("is-current");

      const no = document.createElement("div");
      no.className = "week-no";
      no.textContent = `Hafta ${index + 1}`;
      const range = document.createElement("strong");
      range.textContent = weekRange(addDays(start, index * 7));
      no.appendChild(range);

      const items = document.createElement("div");
      items.className = "week-items";
      const ordered = [...week.items].sort((a, b) => a.lesson.order - b.lesson.order);
      for (const item of ordered) {
        const link = document.createElement("a");
        link.className = "week-item";
        link.href = href(`/ders/${item.lesson.id}`);
        if (doneIds.has(item.lesson.id)) link.classList.add("is-done");
        const title = document.createElement("span");
        title.className = "week-item-title";
        title.textContent = item.lesson.title;
        const meta = document.createElement("span");
        meta.className = "week-item-meta";
        const parts = [lessonLabel(item.lesson), formatDuration(item.minutes)];
        if (item.continued) parts.push("devam");
        meta.textContent = parts.join(" · ");
        link.append(title, meta);
        items.appendChild(link);
      }

      const load = document.createElement("div");
      load.className = "week-load";
      const strong = document.createElement("strong");
      strong.textContent = formatDuration(week.minutes);
      load.append(strong, ` ${week.items.length} parça`);

      li.append(no, items, load);
      weekList.appendChild(li);
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    persist();
    render();
  });
  hoursInput.addEventListener("change", () => {
    persist();
    render();
  });
  modeInput.addEventListener("change", () => {
    persist();
    render();
  });
  startInput.addEventListener("change", () => {
    persist();
    render();
  });
  window.addEventListener("mlyol:progress", render);

  render();
}

interface TodayContext {
  weeks: Week[];
  currentIndex: number;
  start: Date;
  lessons: PlanLesson[];
  doneIds: Set<string>;
  mode: "parallel" | "sequential";
}

function renderToday(root: HTMLElement, context: TodayContext): void {
  root.replaceChildren();
  const next = context.lessons.find((lesson) => !context.doneIds.has(lesson.id));
  const week = context.weeks[context.currentIndex];

  const nextBox = document.createElement("div");
  nextBox.className = "today-next";
  const nextLabel = document.createElement("span");
  nextLabel.className = "label";
  nextLabel.textContent = "Sıradaki ders";
  const nextTitle = document.createElement("a");
  nextTitle.className = "today-title";
  if (next) {
    nextTitle.href = href(`/ders/${next.id}`);
    nextTitle.textContent = next.title;
  } else {
    nextTitle.textContent = "Bütün dersler tamamlandı.";
  }
  const nextMeta = document.createElement("p");
  nextMeta.className = "today-meta";
  nextMeta.textContent = next
    ? `${lessonLabel(next)} · ${formatDuration(next.minutes)}`
    : `${context.lessons.length} dersin tamamı işaretli.`;
  nextBox.append(nextLabel, nextTitle, nextMeta);

  const weekBox = document.createElement("div");
  weekBox.className = "today-week";
  const weekLabel = document.createElement("span");
  weekLabel.className = "label";
  weekLabel.textContent = week
    ? `Durum · Hafta ${context.currentIndex + 1}`
    : "Durum";
  weekBox.appendChild(weekLabel);

  if (!week) {
    const message = document.createElement("p");
    message.className = "today-status";
    message.textContent =
      context.currentIndex < 0
        ? `Plan ${longDate.format(context.start)} tarihinde başlıyor. İlk hafta ${context.weeks[0]?.items.length ?? 0} parça içeriyor.`
        : "Plan takvimi bitti. Sıradaki dersle devam edebilirsin.";
    weekBox.appendChild(message);
  } else {
    const remainingItems = week.items.filter(
      (item) => !context.doneIds.has(item.lesson.id),
    );
    const remainingMinutes = remainingItems.reduce((sum, item) => sum + item.minutes, 0);
    const behind = new Set<string>();
    for (let index = 0; index < context.currentIndex; index += 1) {
      for (const item of context.weeks[index].items) {
        if (!context.doneIds.has(item.lesson.id)) behind.add(item.lesson.id);
      }
    }

    const status = document.createElement("p");
    status.className = "today-status";
    status.textContent = `${weekRange(addDays(context.start, context.currentIndex * 7))} · bu hafta ${week.items.length} parça, ${formatDuration(week.minutes)}.`;
    const behindNode = document.createElement("p");
    behindNode.className = "today-status";
    behindNode.textContent =
      behind.size > 0
        ? `Planda geride kalan ${behind.size} ders var.`
        : "Planda geride kalan ders yok.";
    const jump = document.createElement("a");
    jump.className = "today-jump";
    jump.href = `#hafta-${context.currentIndex + 1}`;
    jump.textContent = "Bu haftanın listesine git →";
    if (remainingItems.length < week.items.length) {
      const remaining = document.createElement("p");
      remaining.className = "today-status";
      remaining.innerHTML = `Kalan: <strong>${remainingItems.length} parça · ${formatDuration(remainingMinutes)}</strong>`;
      weekBox.append(status, remaining, behindNode, jump);
    } else {
      weekBox.append(status, behindNode, jump);
    }
  }
  root.append(nextBox, weekBox);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootPlan);
} else {
  bootPlan();
}
