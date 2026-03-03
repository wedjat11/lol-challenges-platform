import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["var(--font-syne)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        base: "#080B11",
        surface: "#0D1117",
        border: "#1C2333",
        gold: "#C89B3C",
        "blue-accent": "#3B82F6",
        "text-primary": "#F0F2F5",
        "text-secondary": "#6B7280",
      },
    },
  },
  plugins: [],
};

export default config;
