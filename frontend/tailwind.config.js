import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/**/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Inter",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderColor: {
        DEFAULT: "hsl(var(--border))",
        border: "hsl(var(--border))",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        obsidian: {
          DEFAULT: "#121216",
          canvas: "#0b0b0f",
          card: "#18181f",
          "card-hover": "#202029",
          pill: "#1c1c23",
          "pill-hover": "#252530",
          subtle: "#24242e",
          border: "rgba(255, 255, 255, 0.08)",
        },
        "purple-brand": {
          DEFAULT: "#7042f4",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7042f4",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          glow: "rgba(112, 66, 244, 0.45)",
        },
        lavender: {
          DEFAULT: "#c084fc",
          light: "#ddd6fe",
          deep: "#a855f7",
        },
        "lime-chart": {
          DEFAULT: "#c6f135",
          glow: "rgba(198, 241, 53, 0.35)",
        },
        "cyan-badge": {
          DEFAULT: "#22d3ee",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
        "4xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        medium: "var(--shadow-medium)",
        strong: "var(--shadow-strong)",
        glass: "0 8px 32px hsla(220, 15%, 20%, 0.1), inset 0 1px 0 hsla(0, 0%, 100%, 0.1)",
        "hero-card": "var(--shadow-card)",
        "hero-card-hover": "var(--shadow-card-hover)",
        "hero-dropdown": "var(--shadow-dropdown)",
        "hero-modal": "var(--shadow-modal)",
        "hero-glow": "0 0 24px -4px var(--primary-glow)",
        "obsidian-glow": "0 0 50px -10px rgba(112, 66, 244, 0.35)",
        "obsidian-card": "var(--shadow-obsidian-card, 0 8px 32px -4px rgba(0, 0, 0, 0.5))",
        "obsidian-hover": "var(--shadow-obsidian-hover, 0 16px 40px -6px rgba(0, 0, 0, 0.65))",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#F4F6F8",
            foreground: "#0F172A",
            primary: {
              DEFAULT: "#4F46E5",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#64748B",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            background: "#141414",
            foreground: "#FAFAFA",
            primary: {
              DEFAULT: "#5D6EF8",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#27272A",
              foreground: "#FFFFFF",
            },
          },
        },
      },
      layout: {
        radius: {
          small: "8px",
          medium: "12px",
          large: "16px",
        },
      },
    }),
  ],
};
