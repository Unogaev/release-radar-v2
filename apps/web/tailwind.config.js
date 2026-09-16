/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep, near-black charcoal — not pure black (flat, cheap-looking)
        // and not a "SaaS blue" — this is meant to feel like a private room,
        // not a public product landing page.
        ink: {
          950: "#0a0a0c",
          900: "#111114",
          800: "#1a1a1f",
          700: "#242429",
          600: "#33333a",
        },
        // Restrained warm accent — used sparingly (primary actions, BUY_NOW),
        // never as a decorative brand color splashed everywhere.
        ember: {
          500: "#c08a4e",
          400: "#d4a56c",
        },
        // Status colors kept desaturated — urgency without looking like a
        // consumer app's cheerful palette.
        status: {
          buy: "#8a9a6f",
          apply: "#8a9a6f",
          prepare: "#c0a24e",
          watch: "#5a5a63",
          skip: "#6e4a4a",
          verify: "#4e6ec0",
        },
      },
      fontFamily: {
        // Serif display for headings/status labels — gives the "private
        // club" register instead of a typical grotesque SaaS sans.
        display: ["'Fraunces'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
