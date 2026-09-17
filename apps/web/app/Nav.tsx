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
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,16,10,0.03), 0 8px 24px rgba(20,16,10,0.06)",
      },
    },
  },
  plugins: [],
};
