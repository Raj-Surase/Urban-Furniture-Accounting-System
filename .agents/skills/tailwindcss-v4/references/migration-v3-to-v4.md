# Migration Guide: Tailwind CSS v3 to v4

This runbook outlines steps and considerations when upgrading existing projects from Tailwind CSS v3 to v4.

---

## 1. Automated Upgrade

Tailwind provides an official upgrade tool that updates your `package.json`, migrates `tailwind.config.js` into CSS `@theme`, and handles renamed utility classes:

```bash
npx @tailwindcss/upgrade@next
```

Review git diff after running the upgrade tool to ensure proper transformation.

---

## 2. Manual Migration Steps

### 2.1 Update Dependencies
For Vite projects:
```bash
npm uninstall tailwindcss postcss autoprefixer
npm install tailwindcss @tailwindcss/vite
```
In `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
});
```
Delete `postcss.config.js` or `postcss.config.cjs` if it only contained `tailwindcss` and `autoprefixer`.

---

### 2.2 Update CSS Entry File (`index.css` or `globals.css`)
**Old (v3):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**New (v4):**
```css
@import "tailwindcss";
```

---

### 2.3 Migrate `tailwind.config.js` to `@theme`
Move custom themes into CSS `@theme` block:

**Old `tailwind.config.js`:**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    }
  }
}
```

**New CSS `@theme`:**
```css
@import "tailwindcss";

@theme {
  --color-brand-50: #f0f9ff;
  --color-brand-500: #0ea5e9;
  --font-sans: 'Inter', sans-serif;
}
```

---

## 3. Notable Breaking Changes & Renamed Utilities

Old Syntax (v3) | New Syntax (v4) | Notes
:--- | :--- | :---
`bg-opacity-*` | `bg-*/[opacity]` or `bg-*/50` | Opacity utility replaced with slash syntax
`text-opacity-*` | `text-*/[opacity]` or `text-*/80` | Slash syntax
`border-opacity-*` | `border-*/[opacity]` | Slash syntax
`shadow-sm` | `shadow-xs` / `shadow-sm` | Shadow scale adjusted to match standard design tiers
`rounded-sm` | `rounded-xs` / `rounded-sm` | Radius scale adjusted
`@layer utilities` | `@utility <name>` | Use `@utility` directive for new utilities
`overflow-ellipsis` | `text-ellipsis` | Standardized naming
`flex-grow` / `flex-shrink` | `grow` / `shrink` | Deprecated aliases removed

---

## 4. Third-Party Plugin Compatibility

- **HeroUI**: HeroUI v3 natively requires Tailwind CSS v4. If using HeroUI v2 with Tailwind v3, plan the upgrade in coordination with HeroUI v3 components.
- **daisyUI**: daisyUI v5+ supports Tailwind CSS v4 via `@plugin "daisyui";`.
- **Typography & Forms**: Use `@plugin "@tailwindcss/typography";` and `@plugin "@tailwindcss/forms";`.
