# Painter — Command Reference

Painter is your max-pro UI/UX skill. It doesn't patch — it elevates to `impeccable`.

---

## 🔥 Godmode

| Command | Usage | What It Does |
|---------|-------|--------------|
| `/painter paint` | `/painter paint` | **THE nuclear option.** Runs the full pipeline: Analyze → Diagnose → Plan → Implement → Test → Present. Loops until the design scores Good or higher. Does not stop at "acceptable". |

### Paint Pipeline (6 steps)
1. **Analyze** — Heuristics scoring (Nielsen /40), slop detection, persona walkthrough, audit (/20)
2. **Diagnose** — Identify P0/P1 issues if bad, polish opportunities if good
3. **Plan** — Write design plan as artifact (structure, color, type, layout, motion, interaction). Get user confirmation
4. **Implement** — Execute fixes. Build order: Structure → Layout → Type/color → States → Motion → Responsive
5. **Test** — Re-run analyze, compare before/after scores
6. **Present** — Before/after, explain decisions, highlight 3 biggest wins

---

## Core Workflow

| Command | Usage | Description |
|---------|-------|-------------|
| `/painter shape` | `/painter shape [brief]` | Plan UX/UI before code. Discovery interview → confirmed design brief (audience, tone, constraints, anti-goals). |
| `/painter craft` | `/painter craft` | Full shape-then-build flow. Blank slate → polished UI with visual iteration loops. |
| `/painter analyze` | `/painter analyze` | Deep UX review. Heuristics /40, cognitive load check, emotional journey, persona red flags, AI slop scan. |
| `/painter polish` | `/painter polish` | Final pass. Alignment, spacing tokens, typography, all 8 states, 60fps transitions, copy, a11y, edge cases. 21-item checklist. |

---

## Specialized Commands

| Command | Description |
|---------|-------------|
| `/painter audit` | Technical quality. Scores 5 dimensions (a11y, perf, theming, responsive, anti-patterns) out of /20. Tags issues P0–P3. |
| `/painter animate` | Add purposeful motion. Respects register (brand vs product). 100/300/500 rule, expo easing, reduced-motion fallbacks. |
| `/painter colorize` | Strategic color. OKLCH, semantic roles, 60-30-10 weight rule. Strategy: Restrained/Committed/Full/Drenched. |
| `/painter layout` | Fix spatial rhythm. 4pt grid, kill card abuse, fix z-index, gap over margins, squint test. |
| `/painter typeset` | Fix fonts, modular scale, 65–75ch line length, web font loading, reflex-reject list, pairing by lane. |
| `/painter clarify` | Improve UX copy. Error formula, verb+object buttons, empty states, terminology consistency. |
| `/painter bolder` | Amplify boring designs. Dramatic scale jumps, weight contrast (900 vs 200), asymmetric layouts, entrance choreography. |
| `/painter quieter` | Tone down overstimulation. Reduce saturation 70–85%, flatten nesting, soften motion, increase whitespace. |
| `/painter distill` | Strip to essence. ONE primary action, progressive disclosure, 1–2 colors + neutrals, cut sentences in half. |
| `/painter harden` | Edge case resilience. Long text, empty, RTL, emoji, i18n expansion, error handling, offline mode. |
| `/painter onboard` | First-run flows. Welcome screens, empty states, guided tours (3–7 steps max), progressive disclosure. |
| `/painter adapt` | Cross-context adaptation. Mobile, tablet, desktop, print, email — layout/interaction/content strategies. |
| `/painter optimize` | Performance. Core Web Vitals (LCP <2.5s, INP <200ms, CLS <0.1), images, JS splitting, CSS contain, fonts. |
| `/painter extract` | Pull reusable tokens and components into a design system. Only extract patterns used 3+ times. |
| `/painter delight` | Add moments of joy. Success states, micro-interactions, easter eggs, contextual animation. |
| `/painter overdrive` | Push past conventional. View Transitions, WebGL, scroll-driven animations, spring physics, @property. |

---

## When to Use What

| Situation | Command |
|-----------|---------|
| Starting from scratch | `/painter shape` → `/painter craft` |
| Full overhaul needed | `/painter paint` (godmode) |
| Done building, need review | `/painter analyze` → `/painter polish` |
| Looks boring/generic | `/painter bolder` |
| Looks messy/overstimulating | `/painter quieter` |
| Animations feel cheap | `/painter animate` |
| Colors feel wrong | `/painter colorize` |
| Spacing is off | `/painter layout` |
| Fonts look bad | `/painter typeset` |
| Copy is confusing | `/painter clarify` |
| Need edge case testing | `/painter harden` |
| Need first-run experience | `/painter onboard` |
| Performance issues | `/painter optimize` |
| Want something extraordinary | `/painter overdrive` |

---

## The Painter Promise

- No elastic/bouncy easing in professional UI
- No side-stripe border callouts
- No glassmorphism as default
- No gradient text
- No generic purple-blue gradients
- No "OK" / "Submit" / "Yes/No" buttons
- OKLCH over HSL, always
- 60fps or the animation dies
- `prefers-reduced-motion` respected, always
- Every interactive element has all 8 states
