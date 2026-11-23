import { tokens } from "./tokens";
import { semantic } from "./semantic";

export const theme = {
  ...tokens,

  // Cores por função (ação, formato, status, texto, superfície)
  semantic,

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

export type Theme = typeof theme;
