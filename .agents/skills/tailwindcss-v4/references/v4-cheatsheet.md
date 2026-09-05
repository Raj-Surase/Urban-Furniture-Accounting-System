# Tailwind CSS v4 Cheatsheet & Directive Reference

## 1. Directives Summary

Directive | Description | Example
:--- | :--- | :---
`@import "tailwindcss";` | Imports the core framework and default theme | `@import "tailwindcss";`
`@theme` | Extends default design tokens as CSS variables | `@theme { --color-primary: #3b82f6; }`
`@theme inline` | Inlines theme values without creating global CSS variables | `@theme inline { --font-sans: Inter; }`
`@utility <name>` | Defines a custom utility class with support for variants | `@utility glass { backdrop-filter: blur(12px); }`
`@custom-variant <name>` | Defines custom pseudo-classes or media query variants | `@custom-variant hocus (&:hover, &:focus);`
`@variant <name>` | Applies a variant to a block of styles | `@variant dark { color: white; }`
`@plugin <path>` | Imports JavaScript or CSS-based Tailwind plugins | `@plugin "@tailwindcss/typography";`
`@source <path>` | Explicitly includes external paths for content scanning | `@source "../shared-ui";`

---

## 2. Design Token Namespaces (`@theme`)

Variable Prefix | Utility Classes Affected | Example
:--- | :--- | :---
`--color-*` | `text-*`, `bg-*`, `border-*`, `ring-*`, `fill-*`, `stroke-*` | `--color-brand-500: #6366f1;`
`--font-*` | `font-*` | `--font-sans: 'Inter Variable', sans-serif;`
`--text-*` | `text-*` (font-size + line-height) | `--text-tiny: 0.625rem;`
`--spacing-*` | `p-*`, `m-*`, `gap-*`, `w-*`, `h-*`, `top-*`, etc. | `--spacing-18: 4.5rem;`
`--breakpoint-*` | Responsive variants (`sm:`, `md:`, `lg:`, etc.) | `--breakpoint-xs: 30rem;`
`--radius-*` | `rounded-*` | `--radius-card: 1.25rem;`
`--shadow-*` | `shadow-*` | `--shadow-glow: 0 0 20px rgba(99,102,241,0.5);`
`--inset-shadow-*` | `inset-shadow-*` | `--inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);`
`--drop-shadow-*` | `drop-shadow-*` | `--drop-shadow-3xl: 0 35px 35px rgba(0, 0, 0, 0.25);`
`--ease-*` | `ease-*` | `--ease-fluid: cubic-bezier(0.3, 0, 0, 1);`
`--animate-*` | `animate-*` | `--animate-spin-slow: spin 3s linear infinite;`

---

## 3. New Utilities in v4

### Container Queries
- Class: `@container` (marks parent container)
- Modifiers: `@sm:*`, `@md:*`, `@lg:*`, `@xl:*`, `@2xl:*`
- Min/Max bounds: `@min-[400px]:*`, `@max-[800px]:*`
- Named containers: `@container/sidebar`, `@sm/sidebar:hidden`

### 3D Transforms
- Perspective: `perspective-none`, `perspective-near`, `perspective-distant`
- 3D Rotation: `rotate-x-12`, `rotate-y-45`, `rotate-z-90`
- Translation: `translate-z-8`, `-translate-z-4`
- Style: `transform-flat`, `transform-3d`
- Backface: `backface-visible`, `backface-hidden`

### Color Opacity & Mixing
- Alpha slash notation: `bg-red-500/50`, `text-blue-600/[0.85]`
- Dynamic color opacity with CSS variables: `bg-[var(--my-color)]/20`
- CSS `color-mix()` syntax is handled automatically under the hood

### Grid & Flexbox Modernizations
- Subgrid: `grid-cols-subgrid`, `grid-rows-subgrid`
- Baseline alignment: `items-first-baseline`, `items-last-baseline`

---

## 4. Logical Properties
Tailwind v4 fully embraces modern logical properties:
- `ms-*`, `me-*` (margin-inline-start / margin-inline-end)
- `ps-*`, `pe-*` (padding-inline-start / padding-inline-end)
- `start-*`, `end-*` (inset-inline-start / inset-inline-end)
- `rounded-s-*`, `rounded-e-*` (border-start-start-radius, border-start-end-radius)
