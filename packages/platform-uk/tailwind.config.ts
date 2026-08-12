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
          surface: "#F7F8FA",
          raised: "#FFFFFF",
          ink: "#14201E",
          muted: "#5B6B66",
          accent: "#00A88E",
          line: "rgb(20 32 30 / 0.1)",
        },
        // Nightingale soft-medical reference (Dribbble 24869741): cool mist surfaces,
        // seafoam teal actions, coral/lavender metric accents — mapped onto Aksh spruce ink.
        medicom: {
          navy: "#14201E",
          emerald: "#0A7A68",
          accent: "#00A88E",
          surface: "#F7F8FA",
        },
        // Aksh × Nightingale: spruce brand ink + seafoam action teal.
        primary: {
          DEFAULT: "#0B4A42",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0A7A68",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#00A88E",
          foreground: "#FFFFFF",
        },
        signal: {
          DEFAULT: "#5ED4B8",
          ink: "#0B4A42",
        },
        navy: {
          DEFAULT: "#14201E",
          dark: "#0C1513",
          light: "#E8F3F0",
        },
        emerald: {
          DEFAULT: "#0A7A68",
          light: "#E6F7F3",
        },
        danger: "#E85D5D",
        warning: "#E5A43B",
        steel: "#4A635C",
        slate: "#1E2E2A",
        surface: "#F7F8FA",
        "surface-muted": "#EEF1F4",
        // Nightingale metric pastels (soft medical category tints).
        pastel: {
          blue: "#E8F3FE",
          "blue-ink": "#2563EB",
          mint: "#E6F7F3",
          "mint-ink": "#0A7A68",
          lavender: "#F1EDFB",
          "lavender-ink": "#6D28D9",
          peach: "#FDECEC",
          "peach-ink": "#DC2626",
          coral: "#FCE8E8",
          "coral-ink": "#E85D5D",
          amber: "#FFF6E5",
          "amber-ink": "#B45309",
        },
        background: "#F7F8FA",
        card: "#FFFFFF",
        border: "#E2E8ED",
        "border-subtle": "#EBEEF2",
        foreground: "#14201E",
        muted: {
          DEFAULT: "#6B7A75",
          foreground: "#3F534D",
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
        sm: "0 1px 2px 0 rgb(20 32 30 / 0.04)",
        card: "0 1px 2px rgb(20 32 30 / 0.03), 0 14px 40px -24px rgb(20 32 30 / 0.16)",
        "card-hover": "0 2px 6px rgb(20 32 30 / 0.04), 0 22px 48px -22px rgb(20 32 30 / 0.2)",
        sidebar: "2px 0 24px -8px rgb(20 32 30 / 0.06)",
        frame: "0 1px 2px rgb(20 32 30 / 0.03), 0 28px 64px -36px rgb(20 32 30 / 0.22)",
        soft: "0 8px 32px -12px rgb(0 168 142 / 0.18)",
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
  plugins: [require("tailwindcss-animate")],
};

export default config;
