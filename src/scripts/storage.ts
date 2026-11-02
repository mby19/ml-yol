export type PlanMode = "parallel" | "sequential";

export interface PlanSettings {
  start: string;
  hours: number;
  mode: PlanMode;
}

export interface ProgressState {
  v: 1;
  done: Record<string, string>;
  plan: PlanSettings;
  last?: { lesson: string; at: string };
}

const KEY = "mlyol.v1";

export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function defaults(): ProgressState {
  return {
    v: 1,
    done: {},
    plan: { start: todayISO(), hours: 15, mode: "parallel" },
  };
}

export function readProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults();
    const record = parsed as Partial<ProgressState>;
    const done = record.done && typeof record.done === "object" ? record.done : {};
    const plan = record.plan ?? defaults().plan;
    return {
      v: 1,
      done,
      plan: {
        start:
          typeof plan.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(plan.start)
            ? plan.start
            : todayISO(),
        hours: Number(plan.hours) > 0 ? Number(plan.hours) : 15,
        mode: plan.mode === "sequential" ? "sequential" : "parallel",
      },
      last: record.last,
    };
  } catch {
    return defaults();
  }
}

export function writeProgress(state: ProgressState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage can be unavailable in private modes */
  }
  window.dispatchEvent(new CustomEvent("mlyol:progress", { detail: state }));
}

export function setDone(lessonId: string, done: boolean): void {
  const state = readProgress();
  if (done) state.done[lessonId] = new Date().toISOString();
  else delete state.done[lessonId];
  state.last = { lesson: lessonId, at: new Date().toISOString() };
  writeProgress(state);
}

export function isDone(state: ProgressState, lessonId: string): boolean {
  return Boolean(state.done[lessonId]);
}
