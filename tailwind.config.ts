import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5749F4",
        "primary-tint": "#ECEAFF",
        ink: "#2A2933",
        subtle: "#616167",
        muted: "#939399",
        line: "#C5C5CB",
        "line-soft": "#D9D9DB",
        surface: "#F5F5F5",
        // chips / estados semánticos (bg + fg)
        "s-success": "#A1E5A1",
        "s-success-fg": "#003300",
        "s-error": "#FFBFB2",
        "s-error-fg": "#590F00",
        "s-warning": "#FFD9B2",
        "s-warning-fg": "#4D2700",
        "s-info": "#C9D6F0",
        "s-info-fg": "#001133",
        danger: "#CC3314",
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
