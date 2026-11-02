function normalize(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll("â", "a")
    .replaceAll("î", "i")
    .replaceAll("û", "u");
}

function bootGlossary(): void {
  const list = document.getElementById("glossary-list");
  const input = document.getElementById("glossary-search") as HTMLInputElement | null;
  const count = document.getElementById("glossary-count");
  const empty = document.getElementById("glossary-empty");
  const alpha = document.getElementById("alpha");
  if (!list || !input || !count || !empty || !alpha) return;

  const entries = Array.from(
    list.querySelectorAll<HTMLElement>("[data-term-entry]"),
  );
  let letter = "";

  const apply = () => {
    const query = normalize(input.value.trim());
    let visible = 0;
    for (const entry of entries) {
      const matchesLetter = !letter || entry.dataset.initial === letter;
      const matchesQuery =
        !query || (entry.dataset.search ?? "").includes(query);
      const show = matchesLetter && matchesQuery;
      entry.hidden = !show;
      if (show) visible += 1;
    }
    count.textContent = `${visible} terim`;
    empty.hidden = visible > 0;
  };

  input.addEventListener("input", apply);
  alpha.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-letter]");
    if (!button) return;
    letter = button.dataset.letter ?? "";
    alpha
      .querySelectorAll<HTMLButtonElement>("button[data-letter]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", item === button ? "true" : "false"),
      );
    apply();
  });

  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash) {
    const target = document.getElementById(hash);
    if (target?.hasAttribute("data-term-entry")) {
      letter = "";
      input.value = "";
      apply();
      window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootGlossary);
} else {
  bootGlossary();
}

export {};
