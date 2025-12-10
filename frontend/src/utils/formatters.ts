import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { FormatoEtapa } from "@/types/etapa";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

// ============================================
// FORMATAÇÃO DE ETAPAS
// ============================================

/**
 * Converte formato de etapa para label amigável
 */
export const getFormatoLabel = (
  formato: FormatoEtapa | string,
  varianteSuperX?: number
): string => {
  switch (formato) {
    case FormatoEtapa.DUPLA_FIXA:
    case "dupla_fixa":
      return "Dupla Fixa";
    case FormatoEtapa.REI_DA_PRAIA:
    case "rei_da_praia":
      return "Rei da Praia";
    case FormatoEtapa.SUPER_X:
    case "super_x":
      if (varianteSuperX === 8) return "Super 8";
      if (varianteSuperX === 12) return "Super 12";
      return "Super X";
    default:
      return formato;
  }
};

/**
 * Converte status de etapa para label amigável
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "aberta":
      return "Inscrições Abertas";
    case "em_andamento":
      return "Em Andamento";
    case "finalizada":
      return "Finalizada";
    case "planejada":
      return "Em Breve";
    default:
      return status;
  }
};

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
 * Converte gênero de jogador para label amigável
 */
export const getGeneroLabel = (genero: GeneroJogador | string): string => {
  switch (genero) {
    case GeneroJogador.FEMININO:
      return "Feminino";
    case GeneroJogador.MASCULINO:
      return "Masculino";
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
export const formatarData = (data: any): string => {
  try {
    // Data do Firestore com _seconds
    if (data && typeof data === "object" && "_seconds" in data) {
      const date = new Date(data._seconds * 1000);
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
