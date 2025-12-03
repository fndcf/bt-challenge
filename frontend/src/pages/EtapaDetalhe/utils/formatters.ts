/**
 * formatters.ts
 *
 * Funções utilitárias para formatação de dados da etapa
 *
 * SOLID aplicado:
 * - SRP: Cada função tem uma única responsabilidade
 * - OCP: Fácil adicionar novos formatos sem modificar existentes
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { FormatoEtapa } from "@/types/etapa";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

/**
 * Formata uma data para o formato brasileiro (dd/MM/yyyy)
 */
export const formatarData = (data: any): string => {
  try {
    // Timestamp do Firebase
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

/**
 * Retorna o label amigável do formato da etapa
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
 * Retorna o label amigável do nível do jogador
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
 * Retorna o label amigável do gênero
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

/**
 * Retorna o label amigável do status da etapa
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
