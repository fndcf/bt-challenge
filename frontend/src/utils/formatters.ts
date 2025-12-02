/**
 * formatters.ts
 * Fun��es utilit�rias para formata��o de dados
 *
 * Responsabilidade �nica: Transformar dados em formatos leg�veis
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { FormatoEtapa } from "@/types/etapa";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

// ============================================
// FORMATA��O DE ETAPAS
// ============================================

/**
 * Converte formato de etapa para label amig�vel
 */
export const getFormatoLabel = (formato: FormatoEtapa | string): string => {
  switch (formato) {
    case FormatoEtapa.DUPLA_FIXA:
      return "Dupla Fixa";
    case FormatoEtapa.REI_DA_PRAIA:
      return "Rei da Praia";
    default:
      return formato;
  }
};

/**
 * Converte status de etapa para label amig�vel
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
// FORMATA��O DE JOGADORES
// ============================================

/**
 * Converte n�vel de jogador para label amig�vel
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
 * Converte g�nero de jogador para label amig�vel
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
// FORMATA��O DE DATAS
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
