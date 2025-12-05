import { tokens } from "./tokens";

export const theme = {
  ...tokens,

  // Componentes específicos
  components: {
    button: {
      height: {
        sm: "2rem", // 32px
        md: "2.5rem", // 40px
        lg: "3rem", // 48px
      },
      padding: {
        sm: "0.5rem 1rem",
        md: "0.75rem 1.5rem",
        lg: "1rem 2rem",
      },
    },
    input: {
      height: {
        sm: "2rem",
        md: "2.5rem",
        lg: "3rem",
      },
    },
    card: {
      padding: {
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
      },
    },
  },

  // Gradientes
  gradients: {
    primary: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
    primaryHover: "linear-gradient(135deg, #5568D3 0%, #6D3D99 100%)",
    glass:
      "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
  },
} as const;

// Funções utilitárias para media queries
export const media = {
  xs: `@media (min-width: ${tokens.breakpoints.xs})`,
  sm: `@media (min-width: ${tokens.breakpoints.sm})`,
  md: `@media (min-width: ${tokens.breakpoints.md})`,
  lg: `@media (min-width: ${tokens.breakpoints.lg})`,
  xl: `@media (min-width: ${tokens.breakpoints.xl})`,
  "2xl": `@media (min-width: ${tokens.breakpoints["2xl"]})`,
} as const;

// Função helper para acessar cores
export const getColor = (color: string): string => {
  const [category, shade] = color.split(".");
  if (category && shade) {
    const colorCategory = tokens.colors[category as keyof typeof tokens.colors];

    // Verificar se é um objeto (não string primitiva como white/black)
    if (colorCategory && typeof colorCategory === "object") {
      return (colorCategory as any)[shade] || color;
    }
  }
  return color;
};

export type Theme = typeof theme;
