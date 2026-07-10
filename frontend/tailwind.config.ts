import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        duo: {
          green: "#58CC02", greenDark: "#46A302",
          blue: "#1CB0F6", blueDark: "#1899D6",
          red: "#FF4B4B", redDark: "#EA2B2B",
          yellow: "#FFC800", yellowDark: "#E6B000",
          purple: "#CE82FF", purpleDark: "#A568D9",
          orange: "#FF9600",
        },
        bg: "var(--bg)",
        panel: "var(--panel)",
        line: "var(--line)",
        ink: "var(--ink)",
        mut: "var(--mut)",
      },
      fontFamily: { display: ["var(--font-baloo)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
