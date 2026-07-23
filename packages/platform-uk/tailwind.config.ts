import type { Config } from "tailwindcss";

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
        health: {
          surface: "#F8F6F1",
          raised: "#FFFFFF",
          ink: "#10211D",
          muted: "#52635E",
          accent: "#075F50",
          line: "rgb(16 33 29 / 0.12)",
        },
        // Medicom design reference (Dribbble): navy hero, emerald accents, soft surfaces.
        // Use medicom.* in marketing/onboarding for brand-consistent polish.
        medicom: {
          navy: "#003D7A",
          emerald: "#006B4F",
          accent: "#00A86B",
          surface: "#F7F8FA",
        },
        // Aksh "Clinical Signal": spruce brand ink + electric signal accent.
        primary: {
          DEFAULT: "#0B4A42",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0A5F53",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#0B9E7F",
          foreground: "#FFFFFF",
        },
        signal: {
          DEFAULT: "#14E0A4",
          ink: "#06201C",
        },
        navy: {
          DEFAULT: "#0A2A25",
          dark: "#06201C",
          light: "#E6F0EC",
        },
        emerald: {
          DEFAULT: "#0A5F53",
          light: "#E4F1EC",
        },
        danger: "#E53E3E",
        warning: "#E67E22",
        steel: "#3F6E63",
        slate: "#22322E",
        surface: "#EEF4F8",
        "surface-muted": "#E4ECF1",
        // Pastel capability-card tints inspired by the healthcare landing reference.
        pastel: {
          blue: "#EAF2FE",
          "blue-ink": "#1D4ED8",
          mint: "#E7F8EF",
          "mint-ink": "#047857",
          lavender: "#F1EDFB",
          "lavender-ink": "#6D28D9",
          peach: "#FDEEE7",
          "peach-ink": "#C2410C",
        },
        // Mist surface (Beefit pale-blue calm → Clinical Signal mist)
        background: "#EEF4F8",
        card: "#FFFFFF",
        border: "#D5E0E6",
        "border-subtle": "#E2EAEF",
        foreground: "#17302B",
        muted: {
          DEFAULT: "#5F726C",
          foreground: "#3F534D",
        },
      },
      borderRadius: {
        lg: "14px",
        md: "12px",
        sm: "8px",
        xl: "18px",
        "2xl": "22px",
        frame: "28px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(11 74 66 / 0.04)",
        card: "0 1px 2px rgb(11 74 66 / 0.03), 0 12px 32px -20px rgb(11 74 66 / 0.14)",
        "card-hover": "0 2px 4px rgb(11 74 66 / 0.04), 0 18px 40px -18px rgb(11 74 66 / 0.18)",
        sidebar: "2px 0 18px -6px rgb(11 74 66 / 0.08)",
        frame: "0 1px 2px rgb(16 33 29 / 0.04), 0 24px 64px -36px rgb(16 33 29 / 0.32)",
      },
      spacing: {
        "sidebar": "248px",
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
  plugins: [require("tailwindcss-animate")],
};

export default config;
