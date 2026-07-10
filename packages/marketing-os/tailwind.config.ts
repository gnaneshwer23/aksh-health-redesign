import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
        danger: "#E53E3E",
        warning: "#E67E22",
        background: "#F7F8FA",
        card: "#FFFFFF",
        border: "#E2E8F0",
        foreground: "#2D3748",
        muted: {
          DEFAULT: "#718096",
          foreground: "#4A5568",
        },
        navy: {
          dark: "#001A3D",
        },
        layer: {
          sky: "#E0F2FE",
          purple: "#6B46C1",
          teal: "#0D9488",
          slate: "#1A202C",
        },
      },
      borderRadius: {
        lg: "8px",
        md: "8px",
        sm: "4px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
