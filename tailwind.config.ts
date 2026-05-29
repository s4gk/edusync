import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5749F4",
        ink: "#2A2933",
        subtle: "#616167",
        line: "#C5C5CB",
        success: "#003300",
        surface: "#F5F5F5",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
