# Theming & Color Systems in Tailwind CSS v4

Tailwind CSS v4 revolutionizes how themes and colors work by leveraging native CSS variables and the modern OKLCH color space.

---

## 1. OKLCH Color Space

Tailwind v4's default colors are authored in **OKLCH** (`oklch(L C H)`), which provides:
- **Perceptual Uniformity**: Colors of the same lightness step (e.g. `blue-500` and `red-500`) have the same perceived luminance to the human eye.
- **Wide Color Gamut**: Supports Display P3 screens without clipping or distortion.
- **Better Color Interpolation**: Gradients and blends look cleaner with fewer muddy gray transitions.

Example of defining OKLCH colors in `@theme`:
```css
@theme {
  --color-accent-500: oklch(0.65 0.24 260);
  --color-surface-dark: oklch(0.18 0.02 240);
}
```

---

## 2. Dynamic Colors & CSS Custom Properties

In v4, Tailwind classes seamlessly integrate with runtime CSS variables.

### Using CSS Variables in Utilities
```html
<!-- Automatically supports opacity modifiers on CSS variables -->
<div style="--brand: #3b82f6;" class="bg-[var(--brand)]/20 text-[var(--brand)]">
  Dynamic Tinted Card
</div>
```

### Mapping Dark Mode via CSS Variables
```css
@theme {
  --color-bg-base: var(--bg-base);
  --color-text-base: var(--text-base);
}

:root {
  --bg-base: #ffffff;
  --text-base: #0f172a;
}

[data-theme="dark"],
.dark {
  --bg-base: #090d16;
  --text-base: #f8fafc;
}
```
Now `bg-bg-base` and `text-text-base` automatically adapt to light and dark themes.

---

## 3. Extending vs Resetting Themes

### Extending (Default Behavior)
Defining any `--color-*` or `--spacing-*` token inside `@theme` extends the existing palette:
```css
@theme {
  --color-primary: #6366f1; /* Added alongside gray, red, blue, etc. */
}
```

### Overriding Namespaces
To clear out the default color palette and only use your brand tokens:
```css
@theme {
  --color-*: initial; /* Clears all default colors */
  --color-black: #000;
  --color-white: #fff;
  --color-brand: #0ea5e9;
}
```

---

## 4. Fonts and Typography Tokens

```css
@theme {
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font size scale */
  --text-xs: 0.75rem;
  --text-xs--line-height: 1rem;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.25rem;
  --text-base: 1rem;
  --text-base--line-height: 1.5rem;
  --text-lg: 1.125rem;
  --text-lg--line-height: 1.75rem;
}
```
