import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0F",
        bg2: "#12121A",
        bg3: "#1A1A26",
        violet: "#7B5FFF",
        peach: "#FF7A45",
        teal: "#00D4A8",
        yellow: "#FFD166",
        pink: "#FF5FA0",
      },
      fontFamily: {
        heading: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(123, 95, 255, 0.2), 0 0 20px rgba(123, 95, 255, 0.1)" },
          "100%": { boxShadow: "0 0 10px rgba(123, 95, 255, 0.4), 0 0 40px rgba(123, 95, 255, 0.2)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
