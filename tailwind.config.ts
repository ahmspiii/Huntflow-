import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--bg-ink) / <alpha-value>)",
        panel: "rgb(var(--bg-panel) / <alpha-value>)",
        raised: "rgb(var(--bg-raised) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        steel: "#5aa9d6",
        suspected: "#e0a84b",
        confirmed: "#4fb69a",
        danger: "#e06c6c",
        accent: "#7c5cbf",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
} satisfies Config;
