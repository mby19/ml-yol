interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: { title?: string; hat?: string };
}

interface PagefindSearch {
  results: { data: () => Promise<PagefindResultData> }[];
}

interface PagefindApi {
  options?: (options: Record<string, unknown>) => Promise<void>;
  search: (query: string) => Promise<PagefindSearch>;
}

const BASE = document.documentElement.dataset.base ?? "";

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

function withBase(url: string): string {
  if (!BASE) return url;
  if (url.startsWith(`${BASE}/`)) return url;
  return `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function bootSearch(): Promise<void> {
  const input = document.getElementById("search-input") as HTMLInputElement | null;
  const status = document.getElementById("search-status");
  const results = document.getElementById("search-results");
  const hint = document.getElementById("search-hint");
  if (!input || !status || !results) return;

  let pagefind: PagefindApi;
  try {
    // pagefind.js is generated after the Astro build by the pagefind CLI, so it
    // cannot be a static import: the file does not exist at author time.
    const module = (await import(
      /* @vite-ignore */ `${BASE}/pagefind/pagefind.js`
    )) as PagefindApi;
    pagefind = module;
    if (pagefind.options) {
      await pagefind.options({ excerptLength: 36, noWorker: true });
    }
  } catch {
    status.textContent =
      "Arama dizini bulunamadı. Dizin üretim derlemesinde oluşur: npm run build, ardından npm run preview.";
    if (hint) hint.hidden = true;
    return;
  }

  let timer = 0;
  let requestId = 0;

  const clear = () => {
    results.replaceChildren();
  };

  const run = async (query: string) => {
    const trimmed = query.trim();
    const current = ++requestId;
    window.clearTimeout(timer);
    if (!trimmed) {
      clear();
      status.textContent = "Aramak için bir kelime yaz.";
      return;
    }
    status.textContent = "Aranıyor…";
    try {
      const search = await pagefind.search(trimmed);
      if (current !== requestId) return;
      const raw = await Promise.all(
        search.results.slice(0, 30).map((result) => result.data()),
      );
      if (current !== requestId) return;
      // Pagefind tolerates unrelated fuzzy matches; keep only results whose
      // title or excerpt actually contains a query token.
      const tokens = normalize(trimmed)
        .split(/\s+/)
        .filter((token) => token.length > 1);
      const items =
        tokens.length === 0
          ? raw
          : raw.filter((item) => {
              const text = normalize(
                `${item.meta.title ?? ""} ${item.excerpt.replace(/<[^>]*>/g, " ")}`,
              );
              return tokens.some((token) => text.includes(token));
            });
      clear();
      if (!items.length) {
        status.textContent = `“${trimmed}” için sonuç yok. Daha kısa bir kelime dene.`;
        return;
      }
      status.textContent = `${items.length} sonuç${
        raw.length > 30 ? " · ilk 30 sonuç tarandı" : ""
      }`;
      for (const item of items) {
        const li = document.createElement("li");
        li.className = "search-result";
        const link = document.createElement("a");
        link.href = withBase(item.url);
        const title = document.createElement("h2");
        title.textContent = item.meta.title ?? "Ders";
        const excerpt = document.createElement("p");
        excerpt.innerHTML = item.excerpt;
        const hat = item.meta.hat?.trim();
        if (hat) {
          const chip = document.createElement("span");
          chip.className = "hat-chip";
          chip.textContent = hat;
          link.dataset.hat = hat.split(" ")[0];
          link.append(chip, title, excerpt);
        } else {
          link.append(title, excerpt);
        }
        li.appendChild(link);
        results.appendChild(li);
      }
    } catch {
      if (current !== requestId) return;
      status.textContent = "Arama sırasında bir hata oluştu. Sayfayı yenileyip tekrar dene.";
    }
  };

  const params = new URLSearchParams(window.location.search);
  const initial = params.get("q") ?? "";
  input.value = initial;
  if (initial.trim()) void run(initial);

  input.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void run(input.value);
      const next = new URL(window.location.href);
      if (input.value.trim()) next.searchParams.set("q", input.value.trim());
      else next.searchParams.delete("q");
      window.history.replaceState(null, "", next);
    }, 160);
  });

  const form = document.getElementById("search-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    void run(input.value);
  });

  if (!initial.trim()) input.focus();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void bootSearch());
} else {
  void bootSearch();
}

export {};
