import { glossary } from "./course";
import { renderGlossaryMarkdown } from "./markdown";

const cache = new Map<string, Promise<string>>();

export function termHtml(termId: string, markdown: string): Promise<string> {
  const cached = cache.get(termId);
  if (cached) return cached;
  const rendered = renderGlossaryMarkdown(markdown);
  cache.set(termId, rendered);
  return rendered;
}

export async function glossaryWithHtml() {
  return Promise.all(
    glossary.map(async (term) => ({
      id: term.id,
      term: term.term,
      en: term.en,
      short: term.short,
      seeAlso: term.seeAlso,
      mdHtml: term.md ? await termHtml(term.id, term.md) : undefined,
    })),
  );
}
