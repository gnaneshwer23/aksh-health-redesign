import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // "Clinic light" (shared with app/site.css): warm greige canvas, white cards, deep teal ink, lime highlight.
        health: {
          surface: "#F2F1EA",
          raised: "#FFFFFF",
          ink: "#121715",
          muted: "#62685F",
          accent: "#2F6A6E",
          line: "rgb(18 23 21 / 0.1)",
        },
        medicom: {
          navy: "#121715",
          emerald: "#2F6A6E",
          accent: "#2F6A6E",
          surface: "#F2F1EA",
        },
        primary: {
          DEFAULT: "#1E4D52",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2F6A6E",
          foreground: "#FFFFFF",
        },
        // Accent stays a text-safe teal (it is used for text and icons); the lime highlight is `lime`/`signal`.
        accent: {
          DEFAULT: "#2F6A6E",
          foreground: "#FFFFFF",
        },
        lime: {
          DEFAULT: "#DCEF55",
          soft: "#F1F8C4",
          ink: "#3D4A00",
        },
        olive: "#C3CC6A",
        sage: "#E7EADB",
        signal: {
          DEFAULT: "#DCEF55",
          ink: "#121715",
        },
        navy: {
          DEFAULT: "#121715",
          dark: "#0B0E0D",
          light: "#EEF1E6",
        },
        emerald: {
          DEFAULT: "#2F6A6E",
          light: "#F1F8C4",
        },
        danger: "#D9534A",
        warning: "#D99A2B",
        steel: "#565C55",
        slate: "#2D3431",
        surface: "#F2F1EA",
        "surface-muted": "#EAE9E0",
        pastel: {
          blue: "#E6EEEA",
          "blue-ink": "#1E4D52",
          mint: "#F1F8C4",
          "mint-ink": "#3D4A00",
          lavender: "#EEEBF5",
          "lavender-ink": "#5B3FA0",
          peach: "#FBE9E6",
          "peach-ink": "#B42318",
          coral: "#FBE9E6",
          "coral-ink": "#C2410C",
          amber: "#FBF0D9",
          "amber-ink": "#8A5A00",
        },
        background: "#F2F1EA",
        card: "#FFFFFF",
        border: "#E3E1D6",
        "border-subtle": "#ECEAE1",
        foreground: "#121715",
        muted: {
          DEFAULT: "#62685F",
          foreground: "#454B44",
        },
      },
      borderRadius: {
        lg: "16px",
        md: "14px",
        sm: "10px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
        frame: "32px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(18 23 21 / 0.04)",
        card: "0 1px 2px rgb(20 32 30 / 0.03), 0 14px 40px -24px rgb(20 32 30 / 0.16)",
        "card-hover": "0 2px 6px rgb(20 32 30 / 0.04), 0 22px 48px -22px rgb(20 32 30 / 0.2)",
        sidebar: "2px 0 24px -8px rgb(20 32 30 / 0.06)",
        frame: "0 1px 2px rgb(20 32 30 / 0.03), 0 28px 64px -36px rgb(20 32 30 / 0.22)",
        soft: "0 1px 2px rgb(20 32 30 / 0.04), 0 10px 24px -14px rgb(20 32 30 / 0.12)",
      },
      spacing: {
        sidebar: "248px",
        "section-mobile": "64px",
        "section-desktop": "112px",
      },
      fontFamily: {
        sans: ["var(--font-aksh-body)", "system-ui", "sans-serif"],
        marketing: ["var(--font-aksh-body)", "system-ui", "sans-serif"],
        display: ["var(--font-aksh-display)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
