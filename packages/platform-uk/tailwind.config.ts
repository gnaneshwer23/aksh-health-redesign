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
        // Medicom design reference (Dribbble): navy hero, emerald accents, soft surfaces.
        // Use medicom.* in marketing/onboarding for brand-consistent polish.
        medicom: {
          navy: "#003D7A",
          emerald: "#006B4F",
          accent: "#00A86B",
          surface: "#F7F8FA",
        },
        primary: {
          DEFAULT: "#003D7A",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#006B4F",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#00A86B",
          foreground: "#FFFFFF",
        },
        navy: {
          DEFAULT: "#003D7A",
          dark: "#001A3D",
          light: "#EBF4FF",
        },
        emerald: {
          DEFAULT: "#006B4F",
          light: "#E8F5F0",
        },
        danger: "#E53E3E",
        warning: "#E67E22",
        steel: "#4A6FA5",
        slate: "#2D3748",
        surface: "#F4F6F9",
        "surface-muted": "#EEF1F6",
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
        background: "#F4F6F9",
        card: "#FFFFFF",
        border: "#E2E8F0",
        "border-subtle": "#E8EDF3",
        foreground: "#2D3748",
        muted: {
          DEFAULT: "#718096",
          foreground: "#4A5568",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "6px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 61 122 / 0.04)",
        card: "0 1px 3px 0 rgb(0 61 122 / 0.06), 0 1px 2px -1px rgb(0 61 122 / 0.04)",
        "card-hover": "0 8px 24px -4px rgb(0 61 122 / 0.1), 0 4px 8px -4px rgb(0 61 122 / 0.06)",
        sidebar: "2px 0 12px -2px rgb(0 61 122 / 0.06)",
      },
      spacing: {
        "sidebar": "240px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
