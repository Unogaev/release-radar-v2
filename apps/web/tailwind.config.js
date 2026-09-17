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
      },
      fontFamily: {
        display: ["'Inter'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,16,10,0.03), 0 8px 24px rgba(20,16,10,0.06)",
      },
    },
  },
  plugins: [],
};
