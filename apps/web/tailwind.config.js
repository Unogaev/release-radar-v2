/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm, light stone/ivory — a private, expensive room, not a
        // flat white "SaaS" background.
        ink: {
          950: "#f6f3ee",
          900: "#efe9e0",
          800: "#ded5c4",
          700: "#b8ab92",
          600: "#6b5f4d",
        },
        // Restrained brass/gold accent — used sparingly (primary actions,
        // BUY_NOW), never as decoration everywhere.
        ember: {
          500: "#a97c3f",
          400: "#c79a5e",
        },
        // Status colors kept deep and desaturated for readability on a
        // light background.
        status: {
          buy: "#5c6b45",
          apply: "#5c6b45",
          prepare: "#8a6a1e",
          watch: "#6b6b73",
          skip: "#7a3f3f",
          verify: "#3f5a8a",
        },
      },
      fontFamily: {
        // Elegant serif for headings/status labels — the "private club"
        // register.
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
