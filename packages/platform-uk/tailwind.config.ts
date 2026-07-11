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
        surface: "#F7F8FA",
        background: "#F7F8FA",
        card: "#FFFFFF",
        border: "#E2E8F0",
        foreground: "#2D3748",
        muted: {
          DEFAULT: "#718096",
          foreground: "#4A5568",
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
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
