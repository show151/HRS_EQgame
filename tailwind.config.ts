import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1b2a3d",
        muted: "#708096",
        canvas: "#f5f8fc",
        forest: "#1e4d91",
        lime: "#c8e5ff",
        line: "#e3eaf2",
      },
      boxShadow: {
        card: "0 16px 40px rgba(31, 55, 43, 0.06)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Noto Sans JP", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp .45s ease-out both",
        "pop-in": "popIn .35s cubic-bezier(.2,.8,.2,1) both",
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        popIn: { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};

export default config;
