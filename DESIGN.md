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
as rails, chips, and full-bleed station headers; expanded grotesk signage; a
serif reading surface with an italic display accent; station codes, tabular
numerals, squared corners. Lesson, unit, and line pages open on a solid line
colour field with white signage type; the reading surface below stays paper.

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
| `--band` | line colour | solid header field per line |
| `--on-line` | `#fff` / `#0c0f0b` | badge chip text, adapts per theme |
| `--board` | `#12150f` | plan departure board |
| `--board-ink` | `#f3f4ec` | board numerals |
| `--board-muted` | `#b9bdb1` | board labels |

Dark replaces the ground with `#0c0f0b`, surface `#12160f`, ink `#edefe5`,
and lifts the six line colours (`#e8eae0`, `#3fb3a4`, `#8aa4f5`, `#74bd79`,
`#ed9560`, `#db7a9e`). Every text/background pair in both themes clears 4.5:1;
line colours clear 4.84:1 on the light ground.

Colour is **field, not garnish**: lesson/unit/line headers are solid line-colour
fields with white text; home badges are line-colour chips; the route rail and
station dots carry the line; the plan summary is a dark departure board with a
six-colour network stripe. Band text is solid white on saturated colour
(minimum 5.36:1); line-coloured words are avoided so small type always clears
AA. Selection uses `--selection`, focus uses `--focus`.

## Type

| Face | Use | Notes |
|---|---|---|
| Archivo variable (wdth 62–125, wght 100–900) | headings, navigation, labels, numbers | `font-stretch: 112–118%`, tracking −0.02 to −0.038em |
| Source Serif 4 variable | lesson prose, ledes, home display accent | 17px mobile / 18px desktop, line-height 1.68, measure 68ch; italic 520wt for “Yolu” |
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

- **Station header** — full line-colour field, white breadcrumb, white display
  title, white meta, and a white station-code plate in line colour. Used on
  every lesson, unit, and line page.
- **Line row** — line-colour code chip, line name, stop count, route rail, stop
  code, stop name. The rail draws in on load, stops pop in sequence. States:
  plain, hover (dot fills), done (dot filled, name muted), current (ring plus a
  slow ping).
- **Lesson rail** — phase stops, current unit's lessons, page list. Current
  lesson is a filled dot + bold title; done lessons fill the dot. Page list
  uses the page's first heading (or question prefix for checks).
- **Unit timetable** — lessons as station stops: a vertical line-colour rail,
  numbered circles, title/sub, time, done state; the rail is the unit's line.
- **Page section** — a hairline rule, a flag with kind + `NN / NN`, then
  content; the flag bar is line-colour for text, blue for code, orange for
  checks, ink for summaries. Check sections sit in a surface panel with a 2px
  warning top rule and a native `<details>` reveal. Summaries get a surface
  panel with an ink top rule.
- **Plan departure board** — four stats on a near-black board, pastel
  six-line stripe on top, white numerals, muted labels; current week remains a
  paper band. On mobile it becomes 2×2.
- **Glossary A–Z** — letters as station buttons (circles, “Tümü” as a pill);
  active is a filled ink station, not a text underline.
- **Search results** — each result carries a line chip (code + phase, colour
  square) from Pagefind metadata.
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

## Guide and source surfaces

- **Guide header** — paper, a six-segment line stripe, a display title with a
  serif italic second line, a lede and a data line. No color field: this page
  is a report, not a station.
- **Verdict** — a top/bottom-ruled statement block, then risk rows; no card.
- **Scenario rows** — numbered border-bottom rows with a four-column
  does/learns/loses/enough grid; risk square on the head row.
- **Guide tables** — 13px sans, tabular numerals, ink header rule; the wrapper
  is a focusable horizontal scroll region on small screens.
- **Source catalog** — sticky filter bar (search, layer, phase, type), then
  one row per source: phase chip, layer, inferred type, description, links,
  lesson. Phase colour is a dot, never coloured small text.
- **Selected picks** — two-column list on paper, one column on mobile.

## Motion

The signature motion is the route: rails draw across (or down) the network and
stops pop in sequence over ~700ms; the current stop has a slow ping. The term
drawer slides on `cubic-bezier(0.16,1,0.3,1)` over 260ms. Buttons, links, dots
and the copy control use 120–200ms colour/transform transitions. The reading
progress rule is a 2px line updated on scroll. `prefers-reduced-motion` removes
the route/ping motion and collapses all durations and smooth scroll.

## Browser surfaces

Text selection uses the selection token; focus is a 2px outline with 3px
offset; scrollbars are thin and tinted from the rule colours; `::marker` uses
the strong rule; `color-scheme` follows the chosen theme. Tables and formulas
scroll inside their own boxes, never the page.

## Print

Masthead, rail, pager, actions, term drawer and footer are removed. Station
header colour fields flatten to black on white; the departure board becomes a
white board with a black rule; checks and summaries avoid page breaks while
long sections may flow; code wraps; external links append their URL only when
the visible text is not already the URL; internal term links never do.

## Accessibility

Semantic landmarks and one `h1` per page; skip link; visible focus; native
`details` for answers; `aria-current` on navigation, rail, and station links;
`aria-pressed` on completion and theme controls; `aria-live` for search and
plan summaries; `inert` on the closed drawer; no content behind hover; all
body text ≥ 4.5:1 in both themes. Band text is solid white on the saturated
line field (≥5.36:1); the plan board uses white on `#12150f` with `#b9bdb1`
labels.
