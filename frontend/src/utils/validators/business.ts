/**
 * business.ts
 *
 * Validadores específicos de regras de negócio
 *
 * SOLID aplicado:
 * - SRP: Validadores focados em regras de negócio específicas
 * - OCP: Aberto para extensão (novas regras podem ser adicionadas)
 * - DIP: Depende de abstrações (ValidationRule)
 */

import { ValidationRule } from "./types";

/**
 * Validadores de negócio para torneios de beach tennis
 */
export const businessValidators = {
  /**
   * Gênero válido (masculino ou feminino)
   */
  genero: (
    message: string = "Gênero inválido. Deve ser 'masculino' ou 'feminino'"
  ): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const generosValidos = ["masculino", "feminino"];
      return generosValidos.includes(value.toLowerCase());
    },
    message,
  }),

  /**
   * Múltiplo de 4 (para Rei da Praia)
   */
  multiploQuatro: (
    message: string = "Número de jogadores deve ser múltiplo de 4"
  ): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value % 4 === 0;
    },
    message,
  }),

  /**
   * Mínimo 8 jogadores (para Rei da Praia)
   */
  minimoReiDaPraia: (
    message: string = "Rei da Praia necessita de no mínimo 8 jogadores"
  ): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value >= 8;
    },
    message,
  }),

  /**
   * Número par (para duplas)
   */
  numeroPar: (
    message: string = "Número de jogadores deve ser par"
  ): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value % 2 === 0;
    },
    message,
  }),

  /**
   * Validar formato de etapa (Rei da Praia ou Dupla Fixa)
   */
  formatoEtapa: (
    message: string = "Formato inválido. Deve ser 'rei_da_praia' ou 'dupla_fixa'"
  ): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const formatosValidos = ["rei_da_praia", "dupla_fixa"];
      return formatosValidos.includes(value.toLowerCase());
    },
    message,
  }),
};

/**
 * Validações complexas de negócio
 */

/**
 * Validar número de jogadores vs inscritos (específico para Rei da Praia)
 */
export const validateReiDaPraiaInscritos = (
  totalInscritos: number,
  maxJogadores: number
): { isValid: boolean; message?: string } => {
  if (totalInscritos !== maxJogadores) {
    return {
      isValid: false,
      message: `Esta etapa está configurada para ${maxJogadores} jogadores, mas possui apenas ${totalInscritos} inscrito(s). Para gerar chaves com menos jogadores, primeiro edite a etapa e ajuste o número máximo de jogadores para ${totalInscritos}.`,
    };
  }

  if (totalInscritos < 8) {
    return {
      isValid: false,
      message: "Necessário no mínimo 8 jogadores inscritos",
    };
  }

  if (totalInscritos % 4 !== 0) {
    return {
      isValid: false,
      message: "Número de jogadores deve ser múltiplo de 4",
    };
  }

  return { isValid: true };
};
