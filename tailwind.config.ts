import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // acento — igual en claro y oscuro
        primary: "#5749F4",
        "primary-tint": "var(--primary-tint)",
        danger: "#CC3314",
        // superficies (cambian con el tema)
        bg: "var(--bg)",
        card: "var(--card)",
        surface: "var(--surface)",
        // texto
        ink: "var(--ink)",
        subtle: "var(--subtle)",
        muted: "var(--muted)",
        // líneas
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        // chips / estados semánticos (bg + fg)
        "s-success": "var(--s-success)",
        "s-success-fg": "var(--s-success-fg)",
        "s-error": "var(--s-error)",
        "s-error-fg": "var(--s-error-fg)",
        "s-warning": "var(--s-warning)",
        "s-warning-fg": "var(--s-warning-fg)",
        "s-info": "var(--s-info)",
        "s-info-fg": "var(--s-info-fg)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 16, 24, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
