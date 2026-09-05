---
name: tailwindcss-v4
description: >-
  Use this skill when designing, building, configuring, styling, or debugging web interfaces using Tailwind CSS v4.
  Covers v4 CSS-first configuration (@theme, @utility, @variant, @custom-variant, @source, @plugin), Oxide engine,
  Vite/React integration, OKLCH colors, 3D transforms, container queries, v3 to v4 migration,
  VS Code editor configuration, and real-time documentation search using the tailwindcss MCP server.
---

# Tailwind CSS v4 Guide & Best Practices

Tailwind CSS v4 is a ground-up redesign powered by the Rust-based **Oxide engine**. It shifts configuration from JavaScript (`tailwind.config.js`) directly into CSS using native CSS features, modern cascade layers, and new directives.

---

## 1. Core Paradigms of Tailwind CSS v4

### 1.1 CSS-First Configuration
- **No `tailwind.config.js`**: All theme customizations, colors, fonts, and plugins are defined in your stylesheet using `@theme` and `@plugin`.
- **Single Import**: Replace legacy `@tailwind base; @tailwind components; @tailwind utilities;` with:
  ```css
  @import "tailwindcss";
  ```
- **Zero Configuration Content Detection**: Tailwind v4 automatically scans template files in your project without needing `content: [...]` paths. To include extra files (e.g. external package or submodule), use `@source`:
  ```css
  @source "../node_modules/@my-company/ui";
  ```

### 1.2 The `@theme` Directive
Theme values are defined as standard CSS variables inside `@theme`:
```css
@import "tailwindcss";

@theme {
  /* Colors (generates text-brand, bg-brand, border-brand, etc.) */
  --color-brand: #0ea5e9;
  --color-brand-light: #38bdf8;
  --color-brand-dark: #0284c7;

  /* Typography (generates font-display) */
  --font-display: "Cabinet Grotesk", sans-serif;

  /* Spacing and Dimensions */
  --spacing-128: 32rem;

  /* Custom Breakpoints */
  --breakpoint-3xl: 120rem;

  /* Custom Animations & Keyframes */
  --animate-fade-in: fade-in 0.3s ease-out;
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
```

> [!NOTE]
> By default, variables in `@theme` extend Tailwind's default theme. If you need to override or reset namespace defaults, use `@theme inline` or set namespace properties to `initial`.

### 1.3 Custom Utilities with `@utility`
Instead of using `@layer utilities`, write custom utilities directly with `@utility`:
```css
@utility tab-4 {
  tab-size: 4;
}

@utility content-auto {
  content-visibility: auto;
}
```

### 1.4 Custom Variants with `@custom-variant`
Define custom variants or pseudo-classes:
```css
@custom-variant pointer-coarse (@media (pointer: coarse));
@custom-variant theme-ocean (&:where([data-theme="ocean"] *));
```

### 1.5 Official & Community Plugins
Import plugins using the `@plugin` directive:
```css
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
```

---

## 2. Using the Tailwind CSS MCP Server

Antigravity and VS Code have the `tailwindcss` MCP server installed (`tailwindcss-docs-mcp`), providing real-time local semantic and keyword search across official Tailwind CSS v4 docs.

### When to call MCP tools:
1. **Verifying class names and syntax**:
   ```javascript
   call_mcp_tool({
     ServerName: "tailwindcss",
     ToolName: "search_docs",
     Arguments: { query: "how to create 3d perspective card", version: "v4" }
   })
   ```
2. **Browsing utility categories**:
   ```javascript
   call_mcp_tool({
     ServerName: "tailwindcss",
     ToolName: "list_utilities",
     Arguments: { category: "Layout", version: "v4" }
   })
   ```
3. **Checking status of the documentation cache**:
   ```javascript
   call_mcp_tool({
     ServerName: "tailwindcss",
     ToolName: "check_status",
     Arguments: { version: "v4" }
   })
   ```

---

## 3. Key Built-in Features in v4

### 3.1 Container Queries (No Plugin Required)
Container queries are native in v4:
```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3">
    <!-- Responsive to container size, not viewport -->
  </div>
</div>
```

### 3.2 3D Transforms (Native Support)
```html
<div class="perspective-distant">
  <div class="transform-3d rotate-x-12 rotate-y-6 translate-z-4 hover:rotate-x-0 transition-transform">
    3D Interactive Card
  </div>
</div>
```

### 3.3 OKLCH Wide-Gamut Color Palette
Tailwind v4 uses OKLCH color coordinates by default for brighter, more uniform perceived lightness and contrast:
```html
<!-- Opacity using modern slash syntax -->
<div class="bg-indigo-500/25 text-indigo-950 dark:bg-indigo-900/40 dark:text-indigo-100"></div>
```

### 3.4 Advanced Selectors & Modifiers
- `not-*`: `not-last:border-b`, `not-hover:opacity-75`
- `in-*`: Style children based on container selector: `in-data-[state=open]:rotate-180`
- `has-*`: Target parent elements based on child state: `has-[:checked]:ring-2`
- `@starting-style`: Animate elements as they enter the DOM (`starting:opacity-0`)

---

## 4. Migration Guide (v3 to v4)

When upgrading a v3 project or working with existing codebases:

1. **Automated Upgrade Tool**:
   Run the official upgrade CLI:
   ```bash
   npx @tailwindcss/upgrade@next
   ```
2. **Package Replacement**:
   - For Vite: Replace `tailwindcss` + `postcss` + `autoprefixer` with `@tailwindcss/vite`.
     In `vite.config.ts`:
     ```ts
     import tailwindcss from "@tailwindcss/vite";
     import react from "@vitejs/plugin-react";
     import { defineConfig } from "vite";

     export default defineConfig({
       plugins: [tailwindcss(), react()],
     });
     ```
   - For PostCSS projects: Use `@tailwindcss/postcss`.
3. **CSS Entrypoint**:
   Replace `@tailwind base; @tailwind components; @tailwind utilities;` with `@import "tailwindcss";`.
4. **Remove Unneeded Configs**:
   Delete `postcss.config.js` (if using Vite plugin) and migrate `tailwind.config.js` into CSS `@theme`.

---

## 5. VS Code Configuration

Ensure `.vscode/settings.json` has:
```json
{
  "css.lint.unknownAtRules": "ignore",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": "on"
  }
}
```
Install the official **Tailwind CSS IntelliSense** extension: `bradlc.vscode-tailwindcss` (v0.14.3+).

---

## 6. Further References

For detailed syntax tables, token references, and migration steps:
- [Tailwind CSS v4 Cheatsheet](./references/v4-cheatsheet.md)
- [Migration Runbook (v3 -> v4)](./references/migration-v3-to-v4.md)
- [Theming & Color Systems](./references/theming-and-colors.md)
