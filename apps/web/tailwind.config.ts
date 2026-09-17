/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#f6f3ee",
          900: "#efe9e0",
          800: "#ded5c4",
          700: "#b8ab92",
          600: "#6b5f4d",
        },
        espresso: "#2a2521",
        ember: {
          500: "#a97c3f",
          400: "#c79a5e",
        },
        status: {
          buy: "#5c6b45",
          apply: "#5c6b45",
          prepare: "#8a6a1e",
          watch: "#6b6b73",
          skip: "#7a3f3f",
          verify: "#3f5a8a",
        },
        graphite: {
          950: "#0b0c0e",
          900: "#111214",
          800: "#1a1c1f",
          700: "#26282c",
          600: "#3a3d42",
          500: "#54585f",
          400: "#7a7f88",
          300: "#a8adb5",
          200: "#d4d7dc",
          100: "#eceef1",
          50: "#f5f6f8",
        },
        lime: {
          DEFAULT: "#c8ff4d",
          dim: "#9fd93a",
        },
        rr: {
          bg: "#0b0a09",
          surface: "#100e0c",
          "surface-hi": "#141110",
          frame: "#17140f",
          deep: "#0a0908",

          text: "#f1eee8",
          "text-dim": "#b5aea3",
          muted: "#8a8379",
          faint: "#7d776e",
          stencil: "#6b665e",
          ghost: "#5d5952",

          accent: "#d8b878",
          "accent-hi": "#efd9a8",
          "accent-soft": "rgba(216,184,120,0.05)",
          "accent-chip": "rgba(216,184,120,0.11)",

          warn: "#e8a06a",
          ok: "#8fae8a",
          client: "#bcd6e2",
          "client-bg": "rgba(126,162,178,0.22)",

          hair: "rgba(241,238,232,0.07)",
          well: "rgba(241,238,232,0.06)",
        },
      },
      fontFamily: {
        display: ["'Inter'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        "rr-sans": ["var(--font-rr-sans)", "Helvetica Neue", "sans-serif"],
        "rr-display": ["var(--font-rr-display)", "var(--font-rr-sans)", "serif"],
        "rr-mono": ["var(--font-rr-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,16,10,0.03), 0 8px 24px rgba(20,16,10,0.06)",
      },
    },
  },
  plugins: [],
};
