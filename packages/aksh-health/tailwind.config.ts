import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: "#003D7A", dark: "#001A3D", light: "#EBF4FF" },
        emerald: { DEFAULT: "#006B4F", light: "#E8F5F0" },
        accent:  { DEFAULT: "#00A86B" },
        danger:  { DEFAULT: "#E53E3E", light: "#FEF2F2" },
        warning: { DEFAULT: "#E67E22", light: "#FEF3E2" },
        steel:   { DEFAULT: "#4A6FA5" },
        slate:   { DEFAULT: "#2D3748" },
        border:  { DEFAULT: "#E2E8F0" },
        surface: { DEFAULT: "#F7F8FA" },
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
    },
  },
  plugins: [],
}
export default config
