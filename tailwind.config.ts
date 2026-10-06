import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        g1: {
          bg: "#0A0A0B",
          surface: "#141416",
          border: "#232326",
          text: "#F5F5F7",
          muted: "#8A8A8F",
          accent: "#3B82F6",
          accent2: "#8B5CF6"
        }
      }
    }
  },
  plugins: []
};

export default config;