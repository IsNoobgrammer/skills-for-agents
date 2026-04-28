# Color & Typography — Complete Reference

Deep dive into color systems and typographic excellence.

---

## Color

### OKLCH > HSL

**Why OKLCH:**
- Perceptually uniform (equal lightness steps look equal to human eye)
- Better chroma control
- Smoother gradients
- No hue shift when adjusting lightness

**Syntax:**
```css
color: oklch(70% 0.15 180); /* lightness chroma hue */
```

**Conversion:**
- Lightness: 0–100% (0 = black, 100 = white)
- Chroma: 0–0.4 (0 = gray, 0.4 = vivid)
- Hue: 0–360 (same as HSL)

**Rule:** Reduce chroma as lightness approaches 0 or 100.

```css
/* Good */
--blue-900: oklch(20% 0.08 240); /* dark, low chroma */
--blue-500: oklch(60% 0.15 240); /* mid, high chroma */
--blue-100: oklch(95% 0.05 240); /* light, low chroma */

/* Bad */
--blue-900: oklch(20% 0.15 240); /* too saturated for dark */
```

### Tinted Neutrals

Pure gray is dead. Add 0.005–0.01 chroma toward brand hue.

```css
/* Bad: pure gray */
--gray-500: oklch(60% 0 0);

/* Good: tinted toward blue */
--gray-500: oklch(60% 0.008 240);
```

**Why:** Adds warmth/coolness, feels more intentional, harmonizes with brand.

### Never Pure Black or White

```css
/* Bad */
background: #000;
color: #fff;

/* Good */
background: oklch(12% 0.01 240); /* near-black with hint of blue */
color: oklch(98% 0.005 240);     /* near-white */
```

### Color Strategies

**Restrained (Product default):**
- Tinted neutrals + one accent
- Accent used ≤10% of interface
- Example: Notion, Linear

**Committed (Brand-forward):**
- 30–60% one color
- Neutrals support
- Example: Stripe (purple), Figma (purple/pink)

**Full Palette (Multi-role):**
- 3–4 distinct colors with roles
- Primary, secondary, accent, semantic
- Example: Google (blue/red/yellow/green)

**Drenched (Surface IS color):**
- Background itself is colored
- High contrast text
- Example: Spotify (green), Duolingo (green)

**60-30-10 Rule:**
About visual weight, not pixel count.
- 60%: Dominant (usually neutral)
- 30%: Secondary (supporting color)
- 10%: Accent (calls to action)

### Dark Mode

**Surface lightness:**
- Never pure black: oklch 12–18%
- Depth from surface lightness, not shadow
- Lighter surface = higher elevation

```css
/* Light mode */
--surface-1: oklch(100% 0 0);
--surface-2: oklch(98% 0 0);
--surface-3: oklch(96% 0 0);

/* Dark mode */
--surface-1: oklch(15% 0.01 240);
--surface-2: oklch(18% 0.01 240);
--surface-3: oklch(21% 0.01 240);
```

**Text weight:**
Reduce body weight in dark mode (350 vs 400). Lighter weight looks better on dark.

**Desaturated accents:**
Reduce chroma by 20–30% in dark mode.

```css
/* Light mode */
--color-primary: oklch(60% 0.15 240);

/* Dark mode */
--color-primary: oklch(70% 0.10 240); /* lighter, less saturated */
```

### Color Tokens

**Two-tier system:**

**Primitive (raw values):**
```css
--blue-50: oklch(98% 0.02 240);
--blue-100: oklch(95% 0.05 240);
--blue-500: oklch(60% 0.15 240);
--blue-900: oklch(20% 0.08 240);
```

**Semantic (role-based):**
```css
--color-primary: var(--blue-500);
--color-surface: var(--gray-50);
--color-text: var(--gray-900);
```

**Dark mode redefines semantic only:**
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: var(--blue-400);
    --color-surface: var(--gray-900);
    --color-text: var(--gray-100);
  }
}
```

### Alpha is a Design Smell

Use explicit overlay colors instead.

```css
/* Bad */
background: rgba(0, 0, 0, 0.5);

/* Good */
--overlay-dark: oklch(20% 0.01 240);
background: var(--overlay-dark);
```

**Why:** Alpha compounds. Two 50% overlays ≠ 100% opacity. Explicit colors are predictable.

### Contrast Requirements

**WCAG AA (minimum):**
- Body text: 4.5:1
- Large text (18px+ or 14px+ bold): 3:1

**WCAG AAA (enhanced):**
- Body text: 7:1
- Large text: 4.5:1

**Placeholder text:**
Still needs 4.5:1 (not 3:1 like some think).

**Tool:**
```javascript
// Check contrast
function getContrast(color1, color2) {
  // Use APCA or WCAG 2.1 formula
  // Return ratio
}
```

### Dangerous Combos

**Avoid:**
- Light gray on white
- Gray on colored backgrounds (check contrast)
- Red on green (colorblind issue)
- Blue on red (chromatic aberration)
- Yellow on white (low contrast)

---

## Typography

### Line Length

**Cap at 65–75 characters for prose.**

```css
.prose {
  max-width: 65ch; /* ch = width of '0' character */
}
```

**Why:** Longer lines tire the eye. Shorter lines break flow.

### Hierarchy

**Scale + weight contrast.**

**Minimum ratio:** 1.25× between steps.

```css
/* Bad: flat scale */
--text-sm: 14px;
--text-base: 15px;
--text-lg: 16px;

/* Good: clear scale */
--text-sm: 14px;
--text-base: 16px;
--text-lg: 20px;
--text-xl: 25px;
--text-2xl: 31px;
```

**Weight contrast:**
```css
h1 { font-weight: 700; }
h2 { font-weight: 600; }
body { font-weight: 400; }
caption { font-weight: 350; }
```

### Vertical Rhythm

**Line-height is base unit for ALL vertical spacing.**

```css
:root {
  --text-base: 16px;
  --line-height: 1.5; /* 24px */
  --space-unit: calc(var(--text-base) * var(--line-height)); /* 24px */
}

.element {
  margin-block: calc(var(--space-unit) * 2); /* 48px */
}
```

**Body line-height:** 1.5 for 16px = 24px.

**Headings:** Tighter (1.1–1.3).

**Code:** Looser (1.6–1.8).

### System Fonts

**Underrated for apps:**

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
             'Fira Sans', 'Droid Sans', 'Helvetica Neue', 
             sans-serif;
```

**Why:**
- Zero load time
- Native feel
- Excellent rendering
- Familiar to users

**When to use:**
- Dashboards, tools, settings
- Performance-critical apps
- When brand doesn't require custom font

### Product vs Brand Typography

**Product (apps, dashboards):**
- Fixed rem scale (1.125–1.2 step ratio)
- System fonts legitimate
- Consistency > expression

```css
:root {
  --text-xs: 0.75rem;   /* 12px */
  --text-sm: 0.875rem;  /* 14px */
  --text-base: 1rem;    /* 16px */
  --text-lg: 1.125rem;  /* 18px */
  --text-xl: 1.25rem;   /* 20px */
  --text-2xl: 1.5rem;   /* 24px */
}
```

**Brand (landing, marketing):**
- Fluid clamp() for headings
- Custom fonts expected
- Expression > consistency

```css
h1 {
  font-size: clamp(2rem, 5vw, 4rem);
}
```

**Keep max ≤ ~2.5× min:**
```css
/* Good */
font-size: clamp(2rem, 5vw, 5rem); /* 2× to 2.5× */

/* Bad */
font-size: clamp(1rem, 10vw, 10rem); /* 1× to 10× — too extreme */
```

### Web Font Loading

**font-display: swap**

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* show fallback immediately, swap when loaded */
}
```

**Match fallback metrics:**

```css
@font-face {
  font-family: 'CustomFont-fallback';
  src: local('Arial');
  ascent-override: 95%;
  descent-override: 25%;
  line-gap-override: 0%;
  size-adjust: 105%;
}

body {
  font-family: 'CustomFont', 'CustomFont-fallback', sans-serif;
}
```

**Preload critical weight only:**

```html
<link rel="preload" href="/fonts/custom-regular.woff2" as="font" type="font/woff2" crossorigin>
```

### Variable Fonts

**Single file smaller than 3+ static weights.**

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-variable.woff2') format('woff2-variations');
  font-weight: 100 900; /* range */
}

h1 { font-weight: 700; }
body { font-weight: 400; }
caption { font-weight: 350; } /* any value in range */
```

### Dark Mode Text Compensation

**Bump line-height +0.05–0.1:**
```css
@media (prefers-color-scheme: dark) {
  body {
    line-height: 1.6; /* vs 1.5 in light */
  }
}
```

**Letter-spacing +0.01–0.02em:**
```css
@media (prefers-color-scheme: dark) {
  body {
    letter-spacing: 0.01em;
  }
}
```

**Optionally step weight up:**
```css
@media (prefers-color-scheme: dark) {
  body {
    font-weight: 450; /* vs 400 in light */
  }
}
```

**Why:** Light text on dark bleeds more (halation). Compensation improves readability.

### Rendering Polish

**text-wrap: balance (headings):**
```css
h1, h2, h3 {
  text-wrap: balance; /* balances line lengths */
}
```

**text-wrap: pretty (prose):**
```css
p {
  text-wrap: pretty; /* avoids orphans */
}
```

**font-optical-sizing: auto:**
```css
body {
  font-optical-sizing: auto; /* adjusts for size */
}
```

**ALL-CAPS letter-spacing:**
```css
.uppercase {
  text-transform: uppercase;
  letter-spacing: 0.08em; /* +5–12% */
}
```

### Reflex-Reject Fonts

**Training-data defaults (avoid):**
- Fraunces, Newsreader, Lora, Crimson
- Playfair Display, Cormorant
- Syne, IBM Plex, Space Mono, Space Grotesk
- Inter, DM Sans, DM Serif, Outfit
- Plus Jakarta Sans, Instrument Sans, Instrument Serif

**Why:** Overused in AI-generated designs. Signals "template".

### Font Pairing by Lane

**Editorial/luxury:**
- Display serif + sans body
- Example: Tiempos Headline + Suisse Int'l

**Tech/dev/fintech:**
- One committed sans
- Custom-tight tracking
- Strong weight contrast
- Example: Söhne Mono (all weights)

**Consumer/food/travel:**
- Humanist sans + script or display serif
- Example: Freight Sans + Freight Display

**Creative studios:**
- Rule-breaking
- Mono-only, display-only, custom-drawn
- Example: Whyte Inktrap (all caps, all the time)

---

## Checklist

### Color
- [ ] Using OKLCH, not HSL?
- [ ] Tinted neutrals (not pure gray)?
- [ ] No pure #000 or #fff?
- [ ] Dark mode: surface lightness for depth?
- [ ] Dark mode: reduced text weight?
- [ ] Dark mode: desaturated accents?
- [ ] Semantic tokens for dark mode switching?
- [ ] All text meets 4.5:1 contrast (AA)?
- [ ] No dangerous combos (red/green, light gray on white)?

### Typography
- [ ] Line length ≤75ch for prose?
- [ ] Scale ratio ≥1.25×?
- [ ] Vertical rhythm based on line-height?
- [ ] System fonts considered for product?
- [ ] Web fonts: font-display: swap?
- [ ] Web fonts: fallback metrics matched?
- [ ] Web fonts: preload critical weight only?
- [ ] Dark mode: line-height +0.05–0.1?
- [ ] Dark mode: letter-spacing +0.01–0.02em?
- [ ] text-wrap: balance on headings?
- [ ] text-wrap: pretty on prose?
- [ ] ALL-CAPS: +5–12% letter-spacing?
- [ ] Avoiding reflex-reject fonts?
