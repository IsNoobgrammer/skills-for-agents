# Motion Design — Complete Reference

Comprehensive motion design rules for UI/UX.

---

## Core Timing Rules

### 100/300/500 Rule

- **100–150ms**: Instant feedback (button press, toggle, checkbox)
- **200–300ms**: State changes (tab switch, dropdown open, tooltip)
- **300–500ms**: Layout changes (accordion, modal, sidebar)
- **500–800ms**: Entrances (page load, hero animation)

**Exit faster than enter:** ~75% of enter duration.

---

## Easing Functions

### Standard Curves

**Enter (ease-out):**
```css
cubic-bezier(0.16, 1, 0.3, 1) /* expo out — THE default */
```

**Exit (ease-in):**
```css
cubic-bezier(0.7, 0, 0.84, 0) /* expo in */
```

**Toggle (ease-in-out):**
```css
cubic-bezier(0.87, 0, 0.13, 1) /* expo in-out */
```

### Why Exponential?

Human eye expects objects to decelerate as they settle, matching physical reality. Linear and default `ease` feel mechanical.

**NEVER use:**
- `ease` (too generic, feels lazy)
- Bounce (unprofessional, distracting)
- Elastic (same)

### Micro-Interaction Curves

For very fast animations (50–150ms):
- `ease-out-quart`: `cubic-bezier(0.25, 1, 0.5, 1)`
- `ease-out-quint`: `cubic-bezier(0.22, 1, 0.36, 1)`
- `ease-out-expo`: `cubic-bezier(0.16, 1, 0.3, 1)`

---

## Animation Properties

### Only Animate These

**Performant (GPU-accelerated):**
- `transform` (translate, scale, rotate)
- `opacity`

**Acceptable for specific cases:**
- `filter` (blur, brightness — use sparingly, can be slow)
- `clip-path` (for reveals)
- `grid-template-rows` (for accordions: `0fr → 1fr`)

**NEVER animate:**
- `width`, `height` (causes layout thrash)
- `top`, `left`, `right`, `bottom` (use `transform` instead)
- `margin`, `padding` (use `transform` or `gap`)

### Accordion Pattern

```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.accordion-content.open {
  grid-template-rows: 1fr;
}

.accordion-content > * {
  overflow: hidden;
}
```

---

## Stagger

### Pattern

```css
.item {
  animation-delay: calc(var(--i, 0) * 50ms);
}
```

```html
<div class="item" style="--i: 0">Item 1</div>
<div class="item" style="--i: 1">Item 2</div>
<div class="item" style="--i: 2">Item 3</div>
```

### Rules

- **40–60ms per item** for reading speed
- **Cap total stagger time**: 10 items × 50ms = 500ms max
- **Stagger after container settles**, not simultaneously
- **Direction matters**: stagger top-to-bottom, left-to-right (reading order)

---

## Reduced Motion

### Mandatory Implementation

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Why:** ~35% of adults over 40 have vestibular disorders. Motion can cause nausea, dizziness, migraines.

**What to preserve:**
- State changes (still show the result, just instantly)
- Focus indicators
- Loading states (use static instead of spinning)

**What to remove:**
- Parallax
- Continuous animations
- Entrance choreography
- Scroll-triggered animations

---

## Perceived Performance

### 80ms Threshold

Anything under 80ms feels instant. Use this for:
- Button press feedback
- Checkbox toggle
- Input focus

### Skeleton > Spinner

**Why:** Skeleton previews content shape. Spinner is generic and gives no information.

```html
<!-- Bad -->
<div class="spinner"></div>

<!-- Good -->
<div class="skeleton">
  <div class="skeleton-header"></div>
  <div class="skeleton-text"></div>
  <div class="skeleton-text"></div>
</div>
```

### Optimistic UI

For low-stakes actions, update UI immediately and sync later.

```javascript
// Optimistic like
function handleLike() {
  setLiked(true); // instant UI update
  setCount(count + 1);
  
  api.like(postId).catch(() => {
    // Revert on error
    setLiked(false);
    setCount(count - 1);
    showError('Failed to like');
  });
}
```

### Preemptive Start

Show skeleton UI before data arrives. User perceives faster load.

---

## Purpose-Driven Motion

### When to Animate

**Guide attention:**
Animate the element that changed.

```css
/* New message appears */
.message {
  animation: slideIn 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Confirm action:**
Animate both trigger and result.

```css
/* Button press → success checkmark */
.button { transform: scale(0.95); }
.checkmark { animation: pop 400ms cubic-bezier(0.16, 1, 0.3, 1); }
```

**Show progress:**
Animate continuity (skeleton → content).

```css
.skeleton { opacity: 1; }
.content { opacity: 0; }

.loaded .skeleton { opacity: 0; }
.loaded .content { opacity: 1; transition: opacity 200ms; }
```

### When NOT to Animate

- Decoration (no purpose)
- Every single element (overwhelming)
- Critical information (don't hide behind animation)
- Repeated actions (gets annoying fast)

**Test:** If removing the animation hurts comprehension, keep it. Otherwise, kill it.

---

## Spatial Truth

### Objects Enter From Where They Came

**Modal from button:**
```css
.modal {
  transform-origin: var(--trigger-x) var(--trigger-y);
  animation: modalEnter 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
}
```

**Dropdown from trigger:**
```css
.dropdown {
  transform-origin: top;
  animation: dropdownEnter 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes dropdownEnter {
  from {
    opacity: 0;
    transform: scaleY(0.8) translateY(-8px);
  }
}
```

### Objects Exit Toward Where They Go

**Deleted item collapses:**
```css
.item.deleting {
  animation: collapse 300ms cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

@keyframes collapse {
  to {
    opacity: 0;
    transform: scaleY(0);
    margin-block: 0;
  }
}
```

### Depth = Importance

**Elevate what demands attention:**
```css
.modal {
  transform: scale(1.02);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
```

**Never animate in two conflicting directions:**
```css
/* Bad: moving up AND down */
.bad {
  animation: moveUp 300ms, moveDown 300ms;
}

/* Good: one clear direction */
.good {
  animation: slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## Hierarchy of Motion

### One Primary Animation

Per viewport change, one element is the star. Others support.

**Example: Modal open**
- Primary: Modal slides up and fades in (400ms)
- Secondary: Backdrop fades in (200ms, starts immediately)
- Tertiary: Modal content fades in (200ms, starts after 100ms)

### Container First, Then Children

```css
.container {
  animation: containerEnter 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.container > .child {
  animation: childEnter 200ms cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: 150ms; /* after container settles */
}
```

### Max 3 Properties Per Element

```css
/* Good */
.element {
  transition: transform 300ms, opacity 300ms;
}

/* Bad: too many */
.element {
  transition: transform 300ms, opacity 300ms, color 300ms, 
              background 300ms, border 300ms;
}
```

### Background Subtle, Foreground Decisive

```css
/* Background: subtle parallax */
.background {
  transform: translateY(calc(var(--scroll) * 0.1));
}

/* Foreground: clear entrance */
.foreground {
  animation: slideIn 400ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## Stateful Animation

### Define Every State

- `idle` → `hover` → `active` → `loading` → `success/error` → `disabled`

**Button example:**
```css
.button {
  transition: transform 150ms, background 150ms;
}

.button:hover {
  transform: translateY(-2px);
  background: var(--color-primary-hover);
}

.button:active {
  transform: translateY(0);
}

.button.loading {
  pointer-events: none;
}

.button.loading::after {
  content: '';
  animation: spin 1s linear infinite;
}

.button.success {
  background: var(--color-success);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Reversible Mid-Animation

Transitions must be interruptible.

```css
/* Good: transition handles interruption */
.element {
  transform: translateX(0);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.element:hover {
  transform: translateX(10px);
}

/* Bad: animation can't be interrupted */
.element:hover {
  animation: slideRight 300ms forwards;
}
```

---

## Motion Patterns

### Entrance

**Standard:**
```css
@keyframes enter {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
}

.element {
  animation: enter 400ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Hero (no stagger, direct presence):**
```css
@keyframes heroEnter {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
}

.hero {
  animation: heroEnter 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Exit

**Standard:**
```css
@keyframes exit {
  to {
    opacity: 0;
    transform: translateY(-16px);
  }
}

.element {
  animation: exit 250ms cubic-bezier(0.7, 0, 0.84, 0) forwards;
}
```

**Modal (reverse entrance):**
```css
@keyframes modalExit {
  to {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
}
```

### State Change

**Switch:**
```css
.switch-knob {
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.switch.on .switch-knob {
  transform: translateX(20px);
}

.switch-bg {
  transition: background 200ms;
}
```

**Checkbox:**
```css
.checkbox-path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  transition: stroke-dashoffset 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.checkbox:checked .checkbox-path {
  stroke-dashoffset: 0;
}
```

**Tab underline:**
```css
.tab-underline {
  transform: translateX(var(--tab-x));
  width: var(--tab-width);
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1),
              width 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Loading

**Skeleton:**
```css
@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.skeleton {
  animation: pulse 1.5s ease-in-out infinite;
}
```

**Spinner:**
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 0.8s linear infinite;
}
```

**Progress bar:**
```css
.progress-bar {
  transform: scaleX(var(--progress));
  transform-origin: left;
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Scroll Reveal

**Trigger at 80–90% viewport:**
```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1, rootMargin: '-10% 0px' }
);
```

**One-time for content:**
```css
.reveal {
  opacity: 0;
  transform: translateY(32px);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Continuous scrub (decorative only):**
```css
.parallax {
  transform: translateY(calc(var(--scroll) * 0.15));
}
```

**Parallax limits:**
- ±15% translateY max
- Never on text (readability)
- Only on decorative elements

### Page Transition

**Out:**
```css
.page-exit {
  animation: fadeOut 250ms cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateY(-16px);
  }
}
```

**In:**
```css
.page-enter {
  animation: fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
}
```

**Shared element (FLIP pattern):**
```javascript
// First: measure before
const first = element.getBoundingClientRect();

// Last: measure after
element.classList.add('moved');
const last = element.getBoundingClientRect();

// Invert: calculate difference
const deltaX = first.left - last.left;
const deltaY = first.top - last.top;

// Play: animate from inverted to final
element.animate([
  { transform: `translate(${deltaX}px, ${deltaY}px)` },
  { transform: 'translate(0, 0)' }
], {
  duration: 400,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
});
```

---

## Performance

### 60fps Target

**Monitor:**
```javascript
let lastTime = performance.now();
function checkFPS() {
  const now = performance.now();
  const fps = 1000 / (now - lastTime);
  if (fps < 55) console.warn('FPS drop:', fps);
  lastTime = now;
  requestAnimationFrame(checkFPS);
}
```

### will-change

**Use sparingly:**
```css
/* Good: only during animation */
.element.animating {
  will-change: transform;
}

/* Bad: always on */
.element {
  will-change: transform; /* wastes GPU memory */
}
```

### Composite Layers

**Force GPU layer (last resort):**
```css
.element {
  transform: translateZ(0); /* or translate3d(0, 0, 0) */
}
```

**When to use:**
- Element animates frequently
- Complex animation that causes repaints
- After profiling shows benefit

**When NOT to use:**
- Every element (memory waste)
- Static elements
- Before measuring impact

---

## Checklist

- [ ] Duration appropriate for element size?
- [ ] Easing asymmetric (expo out for enter, expo in for exit)?
- [ ] Stagger respects reading speed (40–60ms)?
- [ ] Reduced-motion fallback exists?
- [ ] Runs at 60fps on mid-tier mobile?
- [ ] Motion reversible if interrupted?
- [ ] ≤3 properties animating per element?
- [ ] Animation answers "what changed?"
- [ ] Spatial truth (enters from logical origin)?
- [ ] One primary animation per viewport change?
