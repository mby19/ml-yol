import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import GithubSlugger from "github-slugger";
import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import { createHighlighter, type Highlighter, type ThemeRegistration } from "shiki";
import type { Root, Heading, Link, Code, Html } from "mdast";
import type { Element, Root as HastRoot } from "hast";
import type { CourseLesson, CoursePage } from "./course";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface TocEntry {
  id: string;
  text: string;
  depth: number;
}

export interface RenderedPage {
  id: string;
  kind: CoursePage["kind"];
  html: string;
  answerHtml?: string;
  toc: TocEntry[];
  label: string;
}

export interface RenderedLesson {
  pages: RenderedPage[];
  toc: TocEntry[];
}

const LIGHT_THEME: ThemeRegistration = {
  name: "ml-yol-light",
  type: "light",
  colors: {
    "editor.background": "#f2f3ec",
    "editor.foreground": "#1a1d17",
  },
  settings: [
    { settings: { foreground: "#1a1d17" } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#5c6357", fontStyle: "italic" },
    },
    {
      scope: ["keyword", "storage", "storage.type", "keyword.control"],
      settings: { foreground: "#8c1c56" },
    },
    {
      scope: ["string", "string.quoted", "string.template"],
      settings: { foreground: "#2b7233" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character"],
      settings: { foreground: "#b4440d" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#1f49c9" },
    },
    {
      scope: ["entity.name.type", "support.type", "entity.name.class"],
      settings: { foreground: "#006b66" },
    },
    {
      scope: ["punctuation", "keyword.operator"],
      settings: { foreground: "#5c6357" },
    },
    { scope: ["invalid"], settings: { foreground: "#b4440d" } },
  ],
};

const DARK_THEME: ThemeRegistration = {
  name: "ml-yol-dark",
  type: "dark",
  colors: {
    "editor.background": "#171c13",
    "editor.foreground": "#e6e9df",
  },
  settings: [
    { settings: { foreground: "#e6e9df" } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#9ea695", fontStyle: "italic" },
    },
    {
      scope: ["keyword", "storage", "storage.type", "keyword.control"],
      settings: { foreground: "#db7a9e" },
    },
    {
      scope: ["string", "string.quoted", "string.template"],
      settings: { foreground: "#74bd79" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character"],
      settings: { foreground: "#ed9560" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#8aa4f5" },
    },
    {
      scope: ["entity.name.type", "support.type", "entity.name.class"],
      settings: { foreground: "#3fb3a4" },
    },
    {
      scope: ["punctuation", "keyword.operator"],
      settings: { foreground: "#9ea695" },
    },
    { scope: ["invalid"], settings: { foreground: "#ed9560" } },
  ],
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [LIGHT_THEME, DARK_THEME],
      langs: ["python", "bash", "json", "markdown", "text"],
    });
  }
  return highlighterPromise;
}

/**
 * Escapes `<` outside code spans, code fences and math so that prose such as
 * `<unk>` or `<belge id="3">` is displayed instead of being swallowed as HTML.
 * Content deliberately contains no raw HTML; math and code must keep `<`.
 */
export function escapeAngleBrackets(markdown: string): string {
  let out = "";
  let i = 0;
  const length = markdown.length;
  let fence: string | null = null;

  while (i < length) {
    if (i === 0 || markdown[i - 1] === "\n") {
      const lineEnd = markdown.indexOf("\n", i);
      const line = markdown.slice(i, lineEnd === -1 ? length : lineEnd);
      const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (fenceMatch) {
        const marker = fenceMatch[1][0].repeat(3);
        if (!fence) {
          fence = marker;
          out += line;
          i += line.length;
          continue;
        }
        if (fence === marker) {
          fence = null;
          out += line;
          i += line.length;
          continue;
        }
      }
    }

    if (fence) {
      const char = markdown[i];
      out += char;
      i += 1;
      continue;
    }

    const char = markdown[i];

    if (char === "`") {
      let run = 1;
      while (markdown[i + run] === "`") run += 1;
      const ticks = "`".repeat(run);
      const close = markdown.indexOf(ticks, i + run);
      if (close !== -1) {
        out += markdown.slice(i, close + run);
        i = close + run;
        continue;
      }
      out += ticks;
      i += run;
      continue;
    }

    if (char === "$") {
      if (markdown[i + 1] === "$") {
        const close = markdown.indexOf("$$", i + 2);
        if (close !== -1) {
          out += markdown.slice(i, close + 2);
          i = close + 2;
          continue;
        }
        out += "$$";
        i += 2;
        continue;
      }
      if (markdown[i - 1] !== "\\") {
        let j = i + 1;
        while (j < length && markdown[j] !== "\n") {
          if (markdown[j] === "$" && markdown[j - 1] !== "\\") break;
          j += 1;
        }
        if (j < length && markdown[j] === "$") {
          out += markdown.slice(i, j + 1);
          i = j + 1;
          continue;
        }
      }
      out += char;
      i += 1;
      continue;
    }

    if (char === "<") {
      out += "&lt;";
      i += 1;
      continue;
    }

    out += char;
    i += 1;
  }

  return out;
}

function remarkTermLinks() {
  return (tree: Root) => {
    visit(tree, "link", (node: Link) => {
      if (!node.url.startsWith("term:")) return;
      const id = node.url.slice("term:".length);
      node.url = `${BASE}/sozluk/#${id}`;
      node.data = {
        hProperties: {
          className: ["term-link"],
          "data-term": id,
        },
      };
    });
  };
}

function remarkHeadings(options: {
  slugger: GithubSlugger;
  toc: TocEntry[];
  shift: number;
}) {
  return (tree: Root) => {
    visit(tree, "heading", (node: Heading) => {
      const text = toString(node).trim();
      if (!text) return;
      if (node.depth + options.shift <= 6) node.depth = (node.depth + options.shift) as Heading["depth"];
      const id = options.slugger.slug(text);
      node.data = { hProperties: { id } };
      options.toc.push({ id, text, depth: node.depth });
    });
  };
}

function rehypePagefind() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      const classes = node.properties?.className;
      const isKatex =
        node.tagName === "span" &&
        Array.isArray(classes) &&
        classes.includes("katex");
      if (node.tagName === "pre" || isKatex) {
        node.properties = { ...node.properties, "data-pagefind-ignore": "" };
      }
    });
  };
}

function remarkHighlight() {
  return async (tree: Root) => {
    const codeNodes: Code[] = [];
    visit(tree, "code", (node: Code) => codeNodes.push(node));
    if (!codeNodes.length) return;
    const highlighter = await getHighlighter();
    const loaded = new Set(highlighter.getLoadedLanguages());
    const rendered = new Map<Code, string>();
    for (const node of codeNodes) {
      const requested = (node.lang || "text").toLowerCase();
      const lang = loaded.has(requested) ? requested : "text";
      let html: string;
      try {
        html = highlighter.codeToHtml(node.value.replace(/\n$/, ""), {
          lang,
          themes: { light: "ml-yol-light", dark: "ml-yol-dark" },
          defaultColor: false,
        });
      } catch {
        html = `<pre class="shiki"><code>${node.value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</code></pre>`;
      }
      // Shiki output is raw HTML, so the rehype pass cannot see the <pre>.
      rendered.set(node, html.replace("<pre ", "<pre data-pagefind-ignore "));
    }
    visit(tree, "code", (node: Code, index, parent) => {
      if (!parent || index === undefined) return;
      const html = rendered.get(node);
      if (html === undefined) return;
      parent.children[index] = { type: "html", value: html } satisfies Html;
    });
  };
}

function createProcessor(slugger: GithubSlugger, toc: TocEntry[], shift: number) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkTermLinks)
    .use(remarkHeadings, { slugger, toc, shift })
    .use(remarkHighlight)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypePagefind)
    .use(rehypeStringify, { allowDangerousHtml: true });
}

export async function renderMarkdown(
  markdown: string,
  options: { slugger?: GithubSlugger; shift?: number; toc?: TocEntry[] } = {},
): Promise<{ html: string; toc: TocEntry[] }> {
  const toc = options.toc ?? [];
  const slugger = options.slugger ?? new GithubSlugger();
  const processor = createProcessor(slugger, toc, options.shift ?? 0);
  const file = await processor.process(escapeAngleBrackets(markdown));
  return { html: String(file), toc };
}

const lessonCache = new Map<string, Promise<RenderedLesson>>();

export function renderLesson(lesson: CourseLesson): Promise<RenderedLesson> {
  const cached = lessonCache.get(lesson.id);
  if (cached) return cached;

  const promise = (async () => {
    const slugger = new GithubSlugger();
    const pages: RenderedPage[] = [];
    const toc: TocEntry[] = [];

    for (const page of lesson.pages) {
      const pageToc: TocEntry[] = [];
      const { html } = await renderMarkdown(page.md, {
        slugger,
        shift: 1,
        toc: pageToc,
      });
      let answerHtml: string | undefined;
      if (page.kind === "check" && page.answer) {
        const rendered = await renderMarkdown(page.answer, {
          slugger: new GithubSlugger(),
          shift: 1,
        });
        answerHtml = rendered.html;
      }
      const rawLabel =
        page.kind === "check"
          ? page.md
              .replace(/[#*_`>$]/g, " ")
              .replace(/\\[a-zA-Z]+/g, " ")
              .replace(/[{}]/g, " ")
              .replace(/\s+/g, " ")
              .trim()
          : pageToc[0]?.text ?? "";
      const label =
        rawLabel.length > 74 ? `${rawLabel.slice(0, 71).trimEnd()}…` : rawLabel;
      pages.push({ id: page.id, kind: page.kind, html, answerHtml, toc: pageToc, label });
      toc.push(...pageToc);
    }

    return { pages, toc };
  })();

  lessonCache.set(lesson.id, promise);
  return promise;
}

export async function renderGlossaryMarkdown(markdown: string): Promise<string> {
  const { html } = await renderMarkdown(markdown, { shift: 0 });
  return html;
}
