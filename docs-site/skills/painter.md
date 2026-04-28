# Painter

Max pro UI/UX design with WebGPU/shader support for GPU-accelerated effects. Handles animation, color, typography, layout, interaction, accessibility, and advanced visual effects.

## Domain

**Craft** — controls visual design, UI/UX, motion, color, typography, layout, interaction design, accessibility, performance, and GPU-accelerated effects of frontend output.

## When to Use

- User wants to design, build, fix, or audit UI
- User says "make it look pro", "fix the ui", "painter analyze"
- Explicit invocation: `/painter [command]`
- Frontend code generation or modification
- Design system creation or enforcement

## Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `/painter paint` | **Godmode** — full pipeline: analyze → diagnose → plan → implement → test → present | `/painter paint` |
| `/painter analyze` | Run full critique (heuristics, slop detection, persona walkthrough) | `/painter analyze` |
| `/painter polish` | Improve existing UI (spacing, typography, color, states) | `/painter polish` |
| `/painter shape` | Design brief via discovery (purpose, content, direction, scope) | `/painter shape` |
| `/painter craft` | Execute design plan (structure → layout → typography → states → motion) | `/painter craft` |
| `/painter audit` | Score UI on 5 dimensions (accessibility, performance, theming, responsive, anti-patterns) | `/painter audit` |
| `/painter animate` | Add motion design (entrances, exits, state changes, micro-interactions) | `/painter animate` |
| `/painter colorize` | Apply color strategy (restrained, committed, full palette, drenched) | `/painter colorize` |
| `/painter typeset` | Typography system (scale, hierarchy, vertical rhythm) | `/painter typeset` |
| `/painter layout` | Spatial design (4pt grid, semantic spacing, self-adjusting grids) | `/painter layout` |
| `/painter bolder` | Amplify design (dramatic scale, extreme contrast, asymmetric layouts) | `/painter bolder` |
| `/painter quieter` | Refine design (reduce saturation, fewer colors, increase whitespace) | `/painter quieter` |
| `/painter distill` | Simplify (one primary action, progressive disclosure, linear flow) | `/painter distill` |
| `/painter harden` | Resilience (extreme inputs, i18n, edge cases) | `/painter harden` |
| `/painter clarify` | Improve comprehension (cognitive load reduction, clear hierarchy) | `/painter clarify` |
| `/painter onboard` | First-run experience (welcome, empty states, tours) | `/painter onboard` |
| `/painter adapt` | Responsive design (mobile, tablet, desktop, print, email) | `/painter adapt` |
| `/painter optimize` | Performance (Core Web Vitals, images, JS, CSS, fonts) | `/painter optimize` |
| `/painter extract` | Generate DESIGN.md (Google Stitch format, tokens, components) | `/painter extract` |
| `/painter delight` | Add polish (micro-interactions, easter eggs, personality) | `/painter delight` |
| `/painter overdrive` | Extraordinary (View Transitions, WebGL, spring physics, scroll-driven) | `/painter overdrive` |
| `/painter gpu` | **NEW:** WebGPU/shader effects. Particle systems (10k+), fluid sims, procedural backgrounds, GPU-accelerated filters. | `/painter gpu` |

## Core Philosophy

**Good design answers three questions:**
1. **What is this?** (Purpose, hierarchy, visual identity)
2. **How do I use it?** (Interaction patterns, affordances, feedback)
3. **What can it do?** (Features, states, edge cases)

## Register Split

- **Brand**: design IS the product (landing, portfolio, campaign). Motion is voice. Image-heavy. Typographic risk welcome.
- **Product**: design SERVES the product (dashboard, tool, settings). Motion conveys state only. 150–250ms. Familiar patterns > surprise.

## Absolute Bans (Slop Test)

Match-and-refuse. If writing any of these, rewrite:
- Side-stripe borders (colored `border-left` >1px on cards/callouts)
- Gradient text (`background-clip: text` + gradient)
- Glassmorphism as default
- Hero-metric template (big number + small label + gradient accent)
- Identical card grids (icon + heading + text, repeated endlessly)
- Modal as first thought (exhaust inline/progressive alternatives first)
- Cyan/purple gradients, neon accents on dark

## Motion Rules

### 100/300/500 Rule
- 100–150ms: feedback/toggle
- 200–300ms: state changes
- 300–500ms: layout changes
- 500–800ms: entrances

### Exit Faster Than Enter
~75% of enter duration.

### Only Two Animated Properties
`transform` + `opacity`. For accordions: `grid-template-rows: 0fr → 1fr`.

### Exponential Curves
`cubic-bezier(0.16, 1, 0.3, 1)` (expo out) for entrances. No bounce. No elastic. EVER.

### Reduced Motion
Not optional. Vestibular disorders ~35% adults over 40.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## WebGPU & GPU-Accelerated Effects

**New in 2026:** WebGPU support for GPU-accelerated UI effects.

### When to Use WebGPU

- Particle systems (10,000+ particles)
- Fluid simulations, organic transitions
- Real-time image/video effects
- Compute shaders (physics, data processing)
- Procedural backgrounds

### Performance Gains

- Rendering: 2-3× faster than WebGL
- Particles: 15-20× faster
- Compute: 15-30× faster
- Example: 15k objects at 15 FPS (WebGL) → 200k objects at 60 FPS (WebGPU)

### Browser Support

~70% in 2026 (Chrome, Edge, Firefox, Safari). Always provide fallbacks.

### Three.js Integration

```javascript
import { WebGPURenderer } from 'three/webgpu';

const renderer = new WebGPURenderer({ antialias: true });
await renderer.init(); // async required
```

### Progressive Enhancement

```javascript
if (!navigator.gpu) {
  // Fallback to CSS or WebGL
}
```

**Always:** Respect `prefers-reduced-motion` for GPU effects.

---

## Color

- **Use OKLCH**, not HSL. Perceptually uniform.
- **Tinted neutrals**: even 0.005–0.01 chroma toward brand hue. Pure gray is dead.
- **Strategy**: Restrained (tinted neutrals + one accent ≤10%) / Committed (30–60% one color) / Full palette (3–4 roles) / Drenched (surface IS color).
- **Dark mode**: never pure black (oklch 12–18%). Depth from surface lightness, not shadow.
- **Contrast**: body 4.5:1 (AA), 7:1 (AAA). Large text 3:1 (AA).

## Typography

- **Line length**: cap at 65–75ch for prose.
- **Hierarchy**: scale + weight contrast. ≥1.25 ratio between steps.
- **Vertical rhythm**: line-height is base unit for ALL vertical spacing.
- **System fonts underrated**: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui`.
- **Dark text compensation**: bump lh +0.05–0.1, letter-spacing 0.01–0.02em.

## Spatial Design

- **4pt grid**: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Use `gap`** instead of margins for sibling spacing.
- **Cards are the lazy answer**. Use only when content is truly distinct/actionable.
- **Self-adjusting grid**: `repeat(auto-fit, minmax(280px, 1fr))`.
- **Touch targets**: 44px minimum.

## Interaction Design

- **8 interactive states**: default, hover, focus, active, disabled, loading, error, success.
- **Focus rings**: never `outline: none` without replacement. Use `:focus-visible`. 2–3px thick, offset 2px.
- **Forms**: placeholder ≠ label. Always visible `<label>`.
- **Loading**: skeleton > spinner. Optimistic updates for low-stakes.
- **Undo > confirm**: remove immediately, show undo toast, delete after timeout.

## Godmode: `/painter paint`

Full pipeline:

1. **Analyze**: Run full critique — heuristics scoring, slop detection, persona walkthrough, audit dimensions. Score the current UI.
2. **Diagnose**: If score < Good threshold → identify top P0/P1 issues. If score ≥ Good → identify polish opportunities.
3. **Plan**: Write a design plan (structure, color, typography, layout, motion, interaction fixes) as artifact. Get user confirmation.
4. **Implement**: Execute all fixes. Build order: Structure → Layout → Typography/color → States → Motion → Responsive.
5. **Test**: Re-run analyze. Compare before/after scores. Report improvement. If still < Good, loop back to step 2.
6. **Present**: Show before/after, explain decisions, highlight the 3 biggest wins.

Godmode does NOT stop at "acceptable". It loops until the design scores Good or higher on all dimensions.

## Composability

### Domain Declaration

```yaml
domain: craft
composable: true
yields_to: [voice, process]
```

Painter owns **craft** — visual design, UI/UX, motion, color, typography, layout, interaction design, accessibility, and performance of frontend output.

### When Painter Leads

- Any request to design, build, fix, or audit UI
- Frontend code generation or modification
- Design system creation or enforcement
- Visual critique and scoring

### When Painter Defers

| Other Skill's Domain | What Painter Does |
|---------------------|-------------------|
| **Voice** | Painter doesn't control how things are SAID — only how things LOOK. UX copy (button labels, error messages) is shared territory — painter provides the UX writing rules, voice skill provides the tone. |
| **Density** | Painter's design knowledge is high-density already. NEVER compress CSS values, design tokens, or technical specs. `cubic-bezier(0.16, 1, 0.3, 1)` is not compressible. |
| **Process** | If painter is called within a process skill's workflow, painter provides the craft analysis section but doesn't restructure the overall document. |

### Two Operating Modes

**1. Active Mode** — Painter is directly invoked or the task is UI work.
Full painter capabilities apply. Generate code, run audits, score heuristics.

**2. Advisory Mode** — Another skill leads, but the topic involves UI/design.
Painter provides technical accuracy as reference. Supply correct terminology, validate design claims.

## Tips

1. **Start with `/painter shape`** — get design brief before building
2. **Use `/painter analyze`** — understand current state before changing
3. **Godmode for overhauls** — `/painter paint` for full redesigns
4. **Specific commands for targeted work** — `/painter animate` for motion only
5. **Check slop test** — avoid AI-generated design tells

## Related Skills

- [Harden](./harden) — production patterns (painter for visual, harden for infrastructure)
- [Documenter](./documenter) — content skill that yields to painter for hosted docs
- [Blogger](./blogger) — voice skill that composes with painter for design writing

## Resources

- [Touch Psychology](https://github.com/IsNoobgrammer/skills-for-agents/blob/main/painter/touch-psychology.md) — mobile UX
- [Help](https://github.com/IsNoobgrammer/skills-for-agents/blob/main/painter/help.md) — full command reference
- [SIP Framework](/guide/sip-framework) — how painter composes
