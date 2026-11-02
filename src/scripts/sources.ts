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

function bootSources(): void {
  const list = document.getElementById("source-list");
  const input = document.getElementById("source-search") as HTMLInputElement | null;
  const phase = document.getElementById("source-phase") as HTMLSelectElement | null;
  const type = document.getElementById("source-type") as HTMLSelectElement | null;
  const count = document.getElementById("source-count");
  const empty = document.getElementById("source-empty");
  if (!list || !input || !phase || !type || !count || !empty) return;

  const entries = Array.from(
    list.querySelectorAll<HTMLElement>("[data-source-entry]"),
  );
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-mode-filter]"),
  );
  let mode = "all";

  const apply = () => {
    const query = normalize(input.value.trim());
    let visible = 0;
    for (const entry of entries) {
      const matchesMode = mode === "all" || entry.dataset.mode === mode;
      const matchesPhase = phase.value === "all" || entry.dataset.phase === phase.value;
      const matchesType = type.value === "all" || entry.dataset.kind === type.value;
      const matchesQuery = !query || (entry.dataset.search ?? "").includes(query);
      const show = matchesMode && matchesPhase && matchesType && matchesQuery;
      entry.hidden = !show;
      if (show) visible += 1;
    }
    count.textContent = `${visible} / ${entries.length} kaynak`;
    empty.hidden = visible > 0;
  };

  input.addEventListener("input", apply);
  phase.addEventListener("change", apply);
  type.addEventListener("change", apply);
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.modeFilter ?? "all";
      buttons.forEach((item) =>
        item.setAttribute("aria-pressed", item === button ? "true" : "false"),
      );
      apply();
    });
  });

  apply();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootSources);
} else {
  bootSources();
}

export {};
