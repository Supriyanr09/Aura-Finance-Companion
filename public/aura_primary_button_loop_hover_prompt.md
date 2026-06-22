# Aura Primary Button — Continuous Premium Border Motion

## Goal

Update the **primary button** interaction style so the hover-style border animation from the reference button is no longer triggered only on hover.

Instead, the effect should run **continuously in a slow loop** on all primary buttons.

The button should feel premium, calm, and luxurious — not flashy, neon, or gaming-like.

---

## Reference Behavior

The reference button has a moving highlight/border-tracing effect.

The important part is:

- A faint border is always visible.
- A brighter line/shine moves around the button edge.
- The movement feels like a border highlight travelling across the perimeter.
- The text stays stable.
- The button does not jump, shake, or aggressively scale.

For Aura, use the same idea, but make it more elegant and slower.

---

## Aura Interpretation

Aura’s primary button should feel like a **black luxury object with a platinum edge catching light**.

Think:

- Platinum reflection
- Brushed metal edge
- Luxury watch highlight
- Apple hardware reflection
- Premium financial product

Do **not** make it feel like:

- Neon gaming UI
- Crypto dashboard glow
- Loud SaaS animation
- Fast racing border
- Flashy animated gradient

---

## Default Button State

Primary button should have:

- Black or near-black background
- Subtle platinum/silver border
- White or soft platinum text
- Slightly rounded corners consistent with Aura design system
- Soft inner depth if needed
- No heavy glow

Example visual feeling:

```text
┌────────────────────────┐
│      Continue          │
└────────────────────────┘
```

The border should already look premium even before the moving animation is noticed.

---

## Continuous Animation Requirement

The border highlight animation should run **constantly**, even when the user is not hovering.

The animation should:

- Loop infinitely
- Move slowly around the button border
- Feel smooth and calm
- Be subtle enough that it does not distract from the page
- Make the primary CTA feel alive and premium

Recommended duration:

```css
animation-duration: 3.5s to 5s;
```

Preferred starting point:

```css
animation-duration: 4s;
```

The motion should be slower than the reference hover effect.

---

## Hover Behavior

Since the border motion already runs continuously, hover should only enhance the button slightly.

On hover:

- Slightly brighten the platinum border
- Increase the moving highlight opacity a little
- Add a very subtle lift using `translateY(-1px)` or `translateY(-2px)`
- Add a soft shadow if needed
- Do not restart the animation
- Do not make the animation suddenly fast
- Do not scale aggressively

Avoid:

```css
transform: scale(1.05);
```

Acceptable:

```css
transform: translateY(-1px);
```

or

```css
transform: translateY(-2px);
```

---

## Animation Direction

The highlight should feel like it is travelling around the border.

It can be implemented using any clean CSS approach:

1. `::before` / `::after` pseudo-elements
2. Masked conic gradient
3. Border-image animation
4. Rotating gradient layer behind the button
5. SVG stroke animation if cleaner

Preferred approach:

Use a pseudo-element with a rotating conic gradient behind the button, masked so only the border area is visible.

The visible effect should be a small platinum/silver highlight travelling around the edge.

---

## Suggested Visual Tokens

Use Aura-style black/platinum values. Adjust only if existing tokens already exist.

```css
--aura-btn-bg: #050505;
--aura-btn-text: #f4f4f1;
--aura-btn-border: rgba(210, 210, 205, 0.32);
--aura-btn-border-bright: rgba(255, 255, 245, 0.9);
--aura-btn-platinum: rgba(225, 225, 218, 0.75);
--aura-btn-shadow: rgba(255, 255, 255, 0.08);
```

Avoid purple, blue, neon green, or overly colorful gradients.

---

## Expected CSS Direction

Use this as a guide, not necessarily exact final code:

```css
.primary-button {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid rgba(210, 210, 205, 0.32);
  border-radius: 999px;
  background: #050505;
  color: #f4f4f1;
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease;
}

.primary-button::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -1;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 260deg,
    rgba(255, 255, 245, 0.9) 300deg,
    rgba(225, 225, 218, 0.75) 325deg,
    transparent 360deg
  );
  animation: auraPrimaryBorderLoop 4s linear infinite;
}

.primary-button::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: inherit;
  background: #050505;
}

@keyframes auraPrimaryBorderLoop {
  to {
    transform: rotate(360deg);
  }
}

.primary-button:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 245, 0.58);
  box-shadow: 0 14px 32px rgba(255, 255, 255, 0.06);
}
```

Important: refine this code to match the existing Aura button class names, spacing tokens, typography tokens, and radius tokens.

---

## Motion Personality

The motion should feel:

- Slow
- Premium
- Confident
- Calm
- Continuous
- Subtle
- Polished

It should not feel:

- Fast
- Flashy
- Loud
- Distracting
- Like a loading spinner
- Like a gaming border

The user should notice it only as a refined metallic detail.

---

## Accessibility Requirement

Respect reduced motion preferences.

Add support for:

```css
@media (prefers-reduced-motion: reduce) {
  .primary-button::before {
    animation: none;
  }
}
```

When reduced motion is enabled, keep the static platinum border visible.

---

## Where to Apply

Apply this only to **primary CTA buttons**.

Examples:

- Begin your journey
- Continue
- Login
- Save changes
- Confirm
- Ask Aura primary CTA

Do not apply this to every button.

Secondary buttons should remain calm and mostly static.

---

## Final Expectation

The primary button should look like it has a **slow platinum light travelling around its border continuously**.

It should feel like a premium Aura signature interaction.

The loop should be slow enough to feel elegant and not distract users.

