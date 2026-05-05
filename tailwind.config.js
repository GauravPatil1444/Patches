/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        pulseHint: {
          "0%, 100%": { transform: "scale(1)" },
          "50%":       { transform: "scale(1.55)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeOverlay: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
      animation: {
        "pulse-hint": "pulseHint 0.5s ease-in-out 3",
        "fade-in-up": "fadeInUp 0.15s ease",
        "slide-up":   "slideUp 0.25s ease",
        "fade-overlay": "fadeOverlay 0.2s ease",
      },
    },
  },
  plugins: [],
};
