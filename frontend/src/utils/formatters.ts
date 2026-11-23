import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

// ============================================
// FORMATAÇÃO DE JOGADORES
// ============================================

/**
 * Converte nível de jogador para label amigável
 */
export const getNivelLabel = (nivel: NivelJogador | string): string => {
  switch (nivel) {
    case NivelJogador.INICIANTE:
      return "Iniciante";
    case NivelJogador.INTERMEDIARIO:
      return "Intermediário";
    case NivelJogador.AVANCADO:
      return "Avançado";
    default:
      return nivel;
  }
};

/**
 * Nível abreviado em 3 letras, para selos
 */
export const getNivelAbrev = (nivel: NivelJogador | string): string => {
  switch (nivel) {
    case NivelJogador.INICIANTE:
      return "INI";
    case NivelJogador.INTERMEDIARIO:
      return "INT";
    case NivelJogador.AVANCADO:
      return "AVA";
    default:
      return nivel.substring(0, 3).toUpperCase();
  }
};

/**
 * Converte gênero de jogador para label amigável
 */
export const getGeneroLabel = (genero: GeneroJogador | string): string => {
  switch (genero) {
    case GeneroJogador.FEMININO:
      return "Feminino";
    case GeneroJogador.MASCULINO:
      return "Masculino";
    case GeneroJogador.MISTO:
      return "Misto";
    default:
      return genero;
  }
};

// ============================================
// FORMATAÇÃO DE DATAS
// ============================================

/**
 * Formata data do Firebase ou ISO string para formato brasileiro
 */
export const formatarData = (data: unknown): string => {
  try {
    // Data do Firestore com _seconds
    if (data && typeof data === "object" && "_seconds" in data) {
      const date = new Date(Number(data._seconds) * 1000);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    }

    // String ISO
    if (typeof data === "string") {
      return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
    }

    // Date object
    if (data instanceof Date) {
      return format(data, "dd/MM/yyyy", { locale: ptBR });
    }

    return "Data inválida";
  } catch {
    return "Data inválida";
  }
};
