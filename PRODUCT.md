# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro + static output; Pagefind for search; KaTeX for formulas; self-hosted fonts. Deploy target: GitHub Pages (configurable base path). Chosen by the user in this session.

## Users

One reader, the project owner: a working software developer who knows Python and has no ML or university-math background, studying toward a senior ML engineer role. Studies ~15 hours/week. Reads on a phone, runs the code on a PC. Turkish is the working language; English technical terms are introduced in parentheses. (Source: `mufredat/YAZIM-KURALLARI.md`; confirmed by the request "buna çalışacağım".)

## Product Purpose

Turn the single source of truth — `mufredat/ders-ml-yol.json` (32 units, 110 lessons, 991 pages, 655 glossary terms) — into a study site that lets that reader answer three questions at any moment: what is in the curriculum, what do I do next, and what exactly do I do in this lesson. Success means the reader never has to open the JSON or guess an order: every lesson, practice instruction, check question with its answer, code sample, summary, term, unit, and time estimate is reachable and readable.

## Positioning

A curriculum viewer that is also a study instrument: the full authored text is rendered without paraphrase, and the site computes the reading plan from the curriculum's own minutes, tracks per-lesson completion on the device, and surfaces the practice/check/summary structure the author wrote. It does not generate lessons, summarize them, or invent phases.

## Operating Context

- Source file is authored in parts and merged: `parca/*.json` → `ders-ml-yol.json`; it stays the only content authority.
- Lesson pages follow a fixed rhythm: explanation, code, practice task, check questions with answers, summary with sources.
- Code samples are meant to be copied to a PC and run.
- The reader returns over months, often mid-lesson, and needs to resume where they stopped.
- The source JSON covers phases Başlangıç/Araçlar and F0–F3; it contains no F4–F6 units even though lesson u0-l1 names seven phases. The site must show this absence as a fact, not fill it.

## Capabilities and Constraints

- Static site, no accounts, no server. Progress and plan live in `localStorage`.
- All content comes from the JSON verbatim. Site chrome (navigation, plan, glossary shell, search) is written by the build.
- Turkish UI. Markdown supports `term:` links, KaTeX, fenced code.
- 991 content pages must build without hand-written routes; URLs derive from unit/lesson ids.
- Mobile reading is first-class; code blocks must scroll horizontally, not wrap.
- Search must cover lesson prose, practice, check questions and summaries (Pagefind index of built HTML); code blocks, formulas and answers stay out of the index.
- Base path must be configurable for GitHub Pages.
- No fabricated statistics, completion dates, or curriculum material.

## Evidence on Hand

- `/Users/mby/Desktop/proje/mufredat/ders-ml-yol.json` — complete course content (2.3 MB).
- `/Users/mby/Desktop/proje/mufredat/YAZIM-KURALLARI.md` — reader profile and page contract.
- `/Users/mby/Desktop/proje/mufredat/SOZLUK-MEVCUT.md` — glossary id inventory.
- No analytics, testimonials, pricing, or user accounts exist.

## Product Principles

1. The JSON wins. Never rewrite, shorten, or "improve" authored lesson text; chrome may explain, content may not be replaced.
2. Answer "what now" in one click from anywhere: resume, next lesson, current week's work.
3. Time is the unit of planning. Use the authored `minutes`, never invented durations.
4. Missing material is stated plainly, never papered over.
5. Reading comfort outranks decoration; the page must survive months of daily use on a phone.

## Accessibility & Inclusion

Keyboard-navigable lesson list and check reveals; visible focus; WCAG AA contrast for body text; `prefers-reduced-motion` respected; semantic headings; no content locked behind hover.
