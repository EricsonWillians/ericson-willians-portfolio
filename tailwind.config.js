// tailwind.config.js
import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        terminal: {
          black: "#000000",
          green: {
            DEFAULT: "#00FF00",
            dark: "#003300",
            darker: "#001100",
            light: "#90EE90",
            muted: "#00CC00",
          },
          glow: {
            DEFAULT: "rgba(0, 255, 0, 0.7)",
            strong: "rgba(0, 255, 0, 0.9)",
            weak: "rgba(0, 255, 0, 0.3)",
          },
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        mono: [
          'Fira Code',
          'Monaco',
          'Consolas',
          ...fontFamily.mono
        ],
      },
      keyframes: {
        "terminal-blink": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
        "terminal-glow": {
          "0%, 100%": {
            textShadow: "0 0 5px rgba(0, 255, 0, 0.7)",
          },
          "50%": {
            textShadow: "0 0 15px rgba(0, 255, 0, 0.9), 0 0 20px rgba(0, 255, 0, 0.4)",
          },
        },
        "terminal-scanline": {
          "0%": {
            transform: "translateY(-100%)",
          },
          "100%": {
            transform: "translateY(100%)",
          },
        },
        "terminal-flicker": {
          "0%, 100%": {
            opacity: 1,
          },
          "33%": {
            opacity: 0.9,
          },
          "66%": {
            opacity: 0.95,
          },
        },
        "ambient-glow": {
          "0%, 100%": {
            boxShadow: "0 0 15px rgba(0, 255, 0, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(0, 255, 0, 0.5)",
          },
        },
      },
      animation: {
        "terminal-blink": "terminal-blink 1s step-end infinite",
        "terminal-glow": "terminal-glow 2s ease-in-out infinite",
        "terminal-scanline": "terminal-scanline 8s linear infinite",
        "terminal-flicker": "terminal-flicker 5s linear infinite",
        "ambient-glow": "ambient-glow 3s ease-in-out infinite",
      },
      backgroundImage: {
        "terminal-gradient": "radial-gradient(circle at center, rgba(0, 20, 0, 0.95), rgba(0, 0, 0, 0.98))",
        "terminal-noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.99' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Optional: Add custom plugins for additional effects
    function({ addUtilities }) {
      const newUtilities = {
        '.text-glow': {
          textShadow: '0 0 5px rgba(0, 255, 0, 0.7)',
        },
        '.text-glow-strong': {
          textShadow: '0 0 10px rgba(0, 255, 0, 0.9), 0 0 15px rgba(0, 255, 0, 0.5)',
        },
        '.terminal-effect': {
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 255, 0, 0.05) 50%)',
            backgroundSize: '100% 4px',
            pointerEvents: 'none',
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
};