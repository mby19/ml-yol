# Design system — ML Yolu

The site is the curriculum drawn as a **neural network**. Each phase is a
layer, each unit a neuron, and the reading order is the forward pass. The
metaphor earns its place because every fact it draws exists in the source
JSON: layers come from unit id prefixes, neurons from units, edges from the
file's unit order, the lit state from the reader's completed lessons.

## Direction

THESIS: Progress you can see as activation. Completed units light up, signal
flows along the reading path to the next neuron, and the next neuron beats.
The site refuses the course-card grid, progress rings and the landing hero.

OWN-WORLD: Night-blue field (`#071226`), a cool-to-warm activation spectrum
for the nine layers, cyan signal (`#59d0ff`) as the only "live" colour,
glowing cores, pill controls, 14px radii. Bricolage Grotesque for interface
and display, Literata for reading, JetBrains Mono for code.

STORY: The reader opens the site at night on a phone, sees the whole network
and where the signal stopped, taps the next neuron, and reads a calm lesson
surface whose header shows the unit's lessons as a neuron chain.

FIRST VIEWPORT: Title and figures on top; the full network (9 layers, 53
neurons, derinleşme satellites under each layer) as the body of the screen;
HUD bottom-left (hovered or next unit), "Kaldığın yer" panel bottom-right.

## Palette

Dark is the primary theme (night reading); light is a daytime variant. The
home stage and all page headers stay night-blue in both themes.

| Token | Dark | Light | Role |
|---|---|---|---|
| `--ground` | `#050a14` | `#f2f4fa` | page ground |
| `--surface` | `#0a1222` | `#ffffff` | panels, cards |
| `--ink` | `#eaf1ff` | `#0a1430` | strong text |
| `--ink-soft` | `#c3cfe8` | `#27324f` | prose |
| `--muted` | `#8d9cbd` | `#55607c` | metadata |
| `--signal` | `#59d0ff` | `#1f7bff` | live state, links, progress |
| `--field` | `#071226` | `#0b1736` | stage and header field |
| `--done` | `#4fe0b0` | `#0f8a6a` | completed controls |

Layer spectrum (dark / light): B `#a8b4d4`/`#5a6788`, A `#3fe0e6`/`#0a8f96`,
F0 `#6aa4ff`/`#2357e8`, F1 `#9d8cff`/`#5546e0`, F2 `#c98bff`/`#8a35d6`,
F3 `#ff79c0`/`#c42a7c`, F4 `#ff9a63`/`#c94a10`, F5 `#ffc95a`/`#a86a00`,
F6 `#d6f25c`/`#5d7a00`. A class `layer-<key>` (or legacy `line-*`) sets
`--layer`; chips, header glows, page-flag dots and rail dots read it.

## Type

| Face | Use |
|---|---|
| Bricolage Grotesque variable (wght 200–800, wdth 75–100) | display, headings, navigation, labels, numbers; `font-stretch: 92%`, tracking −0.025em |
| Literata variable (wght 200–900, italic) | lesson prose 1.06rem / 1.72; display accent "Yolu" in italic signal colour |
| JetBrains Mono | code only |

Numerals are tabular where they are data. Display `clamp(2.6rem, 6vw, 5.2rem)`,
home desktop `clamp(2.4rem, 4.2vw, 3.9rem)`.

## Components

- **Neural map** (`NeuralMap.astro`): horizontal SVG ≥761px, vertical SVG on
  phones. Layers = phases with code and name; neurons = units (link to unit
  page); faint full mesh between adjacent layers; reading-path edges in file
  order (math units interleave with ML units, so the path zigzags); satellite
  dots = derinleşme units per phase. States from `localStorage` progress:
  `todo`, `partial`, `done` (cyan core + halo), `current` (white core, beating
  ring). Lit edges glow; the edge into the current neuron flows; particles
  ride lit edges (max 14). Hover/focus traces the incoming path and updates
  the HUD.
- **Activation header**: lesson, unit, line and derinleşme headers are a
  night field with a radial glow in the layer colour; white title; layer chip
  for codes.
- **Activation strip**: the unit's lessons as connected neurons under the
  lesson title; done lessons filled in the layer colour, current one white
  and beating.
- **Reading surface**: unchanged page rhythm (text, code, practice, checks,
  summary); each page flag carries a glowing dot (layer, signal for code,
  warn for checks, ink for summary).
- **Rail**: lessons as a vertical neuron chain.
- **Complete button**: pill; on completion it turns green and emits a
  shock-ring.
- **Continue panel**: translucent night panel, pinging cyan dot, cyan pill
  action.
- **Derinleşme page**: sticky phase chips (horizontal scroll on phones), then
  phase groups of unit rows with a glowing layer dot.

## Motion

One authored moment: the **forward pass** on the home map. A cyan band sweeps
across the layers while the mesh fades in, the reading path draws edge by edge,
and neurons pop in layer by layer (~2s, spring easing). After that only state
motion remains: the current neuron beats, the edge into it flows, particles
ride lit edges. Elsewhere: 0.2–0.45s spring/ease-out transforms on hover.
`prefers-reduced-motion` shows the finished network with no animation.

## Accessibility

Map has a screen-reader heading, each neuron is a labelled link and focusable;
the HUD is `aria-live`. Body text clears 4.5:1 in both themes; header text is
white on night field. Focus ring is 2px `--focus` with 3px offset.
