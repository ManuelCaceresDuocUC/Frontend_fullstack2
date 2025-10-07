export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 900: "#111111", 700: "#2b2b2b", 500: "#6b6b6b" },
        paper: { 50: "#faf9f7", 100: "#f5f4f2" },
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      letterSpacing: { wide2: "0.08em" },
      borderRadius: { subtle: "6px" },
    },
  },
  plugins: [],
};
