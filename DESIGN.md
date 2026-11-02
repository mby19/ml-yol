# Design system — ML Yolu

The site is a **wayfinding system for a long curriculum**, not a course
marketplace. Its visual world is a metropolitan transit network: six lines,
station codes, a route diagram, timetables. The metaphor earns its place
because the product's actual questions are navigational ("where am I, what is
next, how long does it take") and because every fact it displays — line, stop,
minutes, order — exists in the source JSON.

## Direction

THESIS: A curriculum rendered as a transit network you can read for months;
the page refuses the landing-page hero, the course-card grid, and the
dashboard-of-progress-rings.

OWN-WORLD: Cool paper ground, ink-black rules, six saturated line colours used
as rails and stops, expanded grotesk signage, a serif reading surface, station
codes, tabular numerals, squared corners.

STORY: The reader sees the whole network first, understands that each stop is a
unit and each line a phase, then enters a lesson that reads like a printed
chapter with practice, checks, and a summary.

FIRST VIEWPORT: Title and one-line promise on the left, a "where you left off"
panel on the right, and directly beneath them the live network: six lines, 32
stops, 357 authored hours, a filled current stop, and a gate that says which
parts are absent.

FORM: Transit diagram + printed reader. Navigation is diagrammatic; content is
typographic. No decorative illustration, no shadows as decoration, no cards.

## Palette

Light (default tokens in `:root`):

| Token | Value | Role |
|---|---|---|
| `--ground` | `#eef0e9` | page ground, cool paper |
| `--surface` | `#fbfbf7` | reading/check/summary panels |
| `--ink` | `#12150f` | body-strong, rules, buttons |
| `--ink-soft` | `#373d33` | prose |
| `--muted` | `#5c6357` | metadata (5.4:1 on ground) |
| `--rule` | `#c7ccbf` | hairlines |
| `--rule-strong` | `#8b9385` | interactive borders |
| `--line-b` | `#1b1d19` | Başlangıç |
| `--line-a` | `#006b66` | Araçlar |
| `--line-f0` | `#1f49c9` | Matematik |
| `--line-f1` | `#2b7233` | Klasik ML |
| `--line-f2` | `#b4440d` | Derin öğrenme |
| `--line-f3` | `#8c1c56` | Transformer/LLM |

Dark replaces the ground with `#0c0f0b`, surface `#12160f`, ink `#edefe5`,
and lifts the six line colours (`#e8eae0`, `#3fb3a4`, `#8aa4f5`, `#74bd79`,
`#ed9560`, `#db7a9e`). Every text/background pair in both themes clears 4.5:1;
line colours clear 4.84:1 on the light ground.

Colour is **field, not garnish**: the rail is the line, the header carries a
2px line rule, the badge carries a short line-colour bar, and the stations use
the line colour. Label text stays ink/muted so small type always clears AA;
the line is identified by its field, not by coloured words. Selection uses `--selection`, focus uses `--focus`.

## Type

| Face | Use | Notes |
|---|---|---|
| Archivo variable (wdth 62–125, wght 100–900) | headings, navigation, labels, numbers | `font-stretch: 112–118%`, tracking −0.02 to −0.038em |
| Source Serif 4 variable | lesson prose, ledes | 17px mobile / 18px desktop, line-height 1.68, measure 68ch |
| JetBrains Mono | code | 13–13.5px, 1.6 line-height; custom Shiki palette from the line colours |
| KaTeX fonts | formulas | `katex/dist/katex.min.css` |

Numerals are tabular wherever they are data (minutes, dates, counts, station
codes). Display sizes: home title `clamp(2.75rem, 6.6vw, 5.4rem)`, lesson
`clamp(2rem, 4.4vw, 3.35rem)`, unit/line up to 4rem. No eyebrow/kicker above a
heading; labels exist only as data labels or section flags inside a lesson.

## Grid and layout

- Page max 1320px, side padding `clamp(1rem, 3vw, 2.5rem)`.
- Reading measure 68ch. Lesson shell: 270px rail + fluid article, 5vw gap;
  rail collapses below 1000px, article becomes full width of the wrap.
- Route diagram: label column 220px + station field. Stations distribute
  evenly; one/two-stop lines are capped. Below 900px each line turns vertical:
  line head above a left rail with stop name and code.
- Week plan: 8.5rem week + fluid items + 8rem load; single column below 900px.
- Long docs: 68ch body + 260px facts rail; facts rail moves above the body
  below 1000px.
- Glossary: two columns above 760px, one below; sticky filter row on desktop.

## Components and states

- **Line row** — badge (line colour bar + code), line name, stop count, route
  rail, stop code, stop name. States: plain, hover (dot fills), done (dot
  filled, name muted), current (ring around filled dot).
- **Lesson rail** — phase stops, current unit's lessons, page list. Current
  lesson is a filled dot + bold title; done lessons fill the dot. Page list
  uses the page's first heading (or question prefix for checks).
- **Page section** — a hairline rule, a flag with kind + `NN / NN`, then
  content. Check sections sit in a surface panel with a 2px warning top rule
  and a native `<details>` reveal. Summaries get a surface panel with an ink
  top rule.
- **Buttons** — square 2px radius; solid ink primary, hairline ghost. Copy
  code appears on hover/focus and on touch.
- **Continue panel** — top rule, label row, next lesson, minutes, a full-width
  link with an arrow that shifts on hover.
- **Term drawer** — 420px / 92vw modal-style drawer behind a flat scrim, ink
  left rule, off-canvas with `translateX`, `inert`/`aria-hidden` while closed,
  page regions inert while open, close on Esc/scrim; terms link to the glossary
  when JS is unavailable.
- **Plan** — form fields with hints, a four-stat summary, a current-week
  status block, and a week list. Current week gets a surface band; completed
  lessons are struck through.
- **Empty/error** — no-results text for search and glossary filters; a 404
  page with the same network grammar.

## Motion

One authored transition: the term drawer slides on `cubic-bezier(0.16,1,0.3,1)`
over 260ms. Buttons, links, dots and the copy control use 120–200ms
colour/transform transitions. The reading progress rule is a 2px line updated
on scroll. `prefers-reduced-motion` collapses all durations and smooth scroll.

## Browser surfaces

Text selection uses the selection token; focus is a 2px outline with 3px
offset; scrollbars are thin and tinted from the rule colours; `::marker` uses
the strong rule; `color-scheme` follows the chosen theme. Tables and formulas
scroll inside their own boxes, never the page.

## Print

Masthead, rail, pager, actions, term drawer and footer are removed. Lesson
head keeps the line rule; sections avoid page breaks; code wraps; external
links append their URL only when the visible text is not already the URL;
internal term links never do.

## Accessibility

Semantic landmarks and one `h1` per page; skip link; visible focus; native
`details` for answers; `aria-current` on navigation, rail, and station links;
`aria-pressed` on completion and theme controls; `aria-live` for search and
plan summaries; `inert` on the closed drawer; no content behind hover; all
body text ≥ 4.5:1 in both themes.
