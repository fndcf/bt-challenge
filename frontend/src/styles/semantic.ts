/**
 * Cores semânticas (cores por função)
 *
 * Os componentes usam estas cores, nunca a paleta crua nem hex fixo.
 * Cada cor tem um papel só:
 * - acao: botões principais, links e foco (igual em todos os formatos)
 * - formato: identidade de cada tipo de etapa (cabeçalho, aba ativa,
 *   cabeçalho de grupo, número da posição, selo do formato)
 * - status: situação (finalizado, aguardando, erro, neutro, info)
 * - genero: masculino e feminino (sempre com símbolo e texto)
 * - medalha: destaque de colocação (ouro, prata, bronze)
 * - texto / superficie: base neutra
 *
 * Regras de uso: docs/ARCHITECTURE.md > "Cores por funcao".
 * Contraste AA travado em __tests__/styles/semantic.test.ts.
 */

import { FormatoEtapa } from "@/types/etapa";
import { tokens } from "./tokens";

export interface CoresFormato {
  nome: string;
  solido: string; // Fundo com texto branco (cabeçalhos)
  claro: string; // Fundo de selo
  borda: string;
  suave: string; // Fundo do número da posição
  texto: string; // Texto na cor do formato (sobre branco, claro ou suave)
}

export interface CoresStatus {
  texto: string;
  fundo: string;
  borda: string;
}

const formato = {
  duplaFixa: {
    nome: "Dupla Fixa",
    solido: "#1D4ED8",
    claro: "#EFF6FF",
    borda: "#BFDBFE",
    suave: "#DBEAFE",
    texto: "#1E3A8A",
  },
  reiDaPraia: {
    nome: "Rei da Praia",
    solido: "#6D28D9",
    claro: "#F5F3FF",
    borda: "#DDD6FE",
    suave: "#EDE9FE",
    texto: "#4C1D95",
  },
  superX: {
    nome: "Super X",
    solido: "#BE185D",
    claro: "#FDF2F8",
    borda: "#FBCFE8",
    suave: "#FCE7F3",
    texto: "#831843",
  },
  teams: {
    nome: "Teams",
    solido: "#C2410C",
    claro: "#FFF7ED",
    borda: "#FED7AA",
    suave: "#FFEDD5",
    texto: "#7C2D12",
  },
} satisfies Record<string, CoresFormato>;

const status = {
  sucesso: { texto: "#166534", fundo: "#DCFCE7", borda: "#BBF7D0" },
  aviso: { texto: "#92400E", fundo: "#FEF3C7", borda: "#FCD34D" },
  erro: { texto: "#B91C1C", fundo: "#FEE2E2", borda: "#FECACA" },
  neutro: { texto: "#3F3F46", fundo: "#F4F4F5", borda: "#E4E4E7" },
  info: {
    texto: tokens.colors.primary[500],
    fundo: tokens.colors.primary[100],
    borda: tokens.colors.primary[200],
  },
} satisfies Record<string, CoresStatus>;

// Gênero do jogador. Azul-céu e magenta, para não se confundirem com o azul da
// Dupla Fixa e o rosa do Super X; só em selo claro, nunca em cabeçalho.
const genero = {
  masculino: { texto: "#075985", fundo: "#E0F2FE", borda: "#7DD3FC" },
  feminino: { texto: "#86198F", fundo: "#FAE8FF", borda: "#F0ABFC" },
} satisfies Record<string, CoresStatus>;

// Destaque de colocação (1º, 2º, 3º). Texto escuro: os degradês antigos com
// texto branco reprovavam no contraste (ouro 1.7:1). O bronze fica bege para
// não se confundir com o laranja do Teams.
const medalha = {
  ouro: { texto: "#713F12", fundo: "#FDE68A", borda: "#FCD34D" },
  prata: { texto: "#3F3F46", fundo: "#E4E4E7", borda: "#D4D4D8" },
  bronze: { texto: "#6B3A1E", fundo: "#EAD3BF", borda: "#D6B595" },
} satisfies Record<string, CoresStatus>;

export const semantic = {
  acao: {
    primaria: tokens.colors.primary[500],
    primariaHover: tokens.colors.primary[600],
    fundoClaro: tokens.colors.primary[100],
    perigo: "#B91C1C",
    perigoHover: "#991B1B",
    textoSobreAcao: "#FFFFFF",
  },
  formato,
  status,
  genero,
  medalha,
  texto: {
    principal: "#18181B",
    // Cinza mais claro permitido para texto: 4.8:1 até no fundo de página.
    // (#71717A passava no branco mas reprovava no fundo #F4F4F5)
    secundario: "#6B6B74",
    inverso: "#FFFFFF",
    desabilitado: "#A1A1AA", // Só para elementos desabilitados (isentos de contraste)
  },
  superficie: {
    fundo: "#FFFFFF",
    fundoAlternativo: "#FAFAFA",
    pagina: "#F4F4F5",
    borda: "#E4E4E7",
    bordaForte: "#D4D4D8",
    // Chip/selo sobre fundo colorido (cabeçalho do formato)
    sobreposicaoEscura: "rgba(0, 0, 0, 0.25)",
  },
} as const;

const chavePorFormato: Record<FormatoEtapa, keyof typeof formato> = {
  [FormatoEtapa.DUPLA_FIXA]: "duplaFixa",
  [FormatoEtapa.REI_DA_PRAIA]: "reiDaPraia",
  [FormatoEtapa.SUPER_X]: "superX",
  [FormatoEtapa.TEAMS]: "teams",
};

/**
 * Cores de identidade do formato da etapa
 *
 * Sem formato (etapas antigas), usa Dupla Fixa: é o formato padrão no backend.
 */
export const getCoresFormato = (
  formatoEtapa?: FormatoEtapa | null
): CoresFormato => {
  const chave = formatoEtapa ? chavePorFormato[formatoEtapa] : undefined;
  return formato[chave ?? "duplaFixa"];
};
