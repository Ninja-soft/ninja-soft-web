import type { Config } from "tailwindcss";

// Tokens de marca Ninja Soft (ver UI-NinjaSof.md). Ritmo de bloques estilo apple.com:
// "paper" claro y "night" violeta profundo, un solo acento fuego.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: "#FAF9FD", 2: "#F1EEF8" },
        line: "#E3DDF5",
        ink: { DEFAULT: "#110C22", 2: "#5E5774" },
        night: { DEFAULT: "#0B0720", 2: "#170F36", device: "#1D1540" },
        mist: "#B8AEDC",
        snow: "#F7F7FF",
        flame: { DEFAULT: "#FF4B22", link: "#C2350F", linkDark: "#FF7A2E" },
        food: "#24763A",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Consolas", "monospace"],
      },
      backgroundImage: {
        flame: "linear-gradient(120deg,#FF4B22 0%,#FF8A1F 50%,#FFD21F 100%)",
      },
      borderRadius: { tile: "28px" },
    },
  },
  plugins: [],
};

export default config;
