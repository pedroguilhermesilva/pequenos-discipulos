import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pergaminho: "#F8F4EE",
        tinta: "#1E293B",
        oliva: "#64748B",
        dourado: "#FBBF24",
        amber: "#FBBF24",
        ceu: "#0284C7",
        "ceu-claro": "#E0F2FE",
        vida: "#D97706",
        "vida-dark": "#B45309",
        borda: "#E8E2D8",
        "borda-escura": "#3D3528",
        "pergaminho-escuro": "#F3EDE4",
        "painel-escuro": "#1E1A14",
        laranja: "#F97316",
        "laranja-claro": "#FFFBEB",
        "laranja-suave": "#FFF7ED",
        aprovado: "#B45309",
        "aprovado-claro": "#FEF3C7",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        story: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: {
        livro: "1.25rem",
        "livro-xl": "1.5rem",
      },
      boxShadow: {
        livro: "0 4px 24px rgba(44, 36, 22, 0.08)",
        "livro-lg": "0 8px 40px rgba(44, 36, 22, 0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        shimmer: "shimmer 2s ease-in-out infinite",
      },
    },
  },
  plugins: [forms],
};
export default config;
