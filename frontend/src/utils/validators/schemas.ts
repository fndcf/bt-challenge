/**
 * schemas.ts
 *
 * Schemas de validação pré-definidos
 *
 * SOLID aplicado:
 * - SRP: Arquivo focado em definir schemas
 * - DRY: Schemas reutilizáveis
 */

import { ValidationSchema } from "./types";
import { coreValidators } from "./core";
import { businessValidators } from "./business";

// Combinar validadores para facilitar uso
const validators = { ...coreValidators, ...businessValidators };

/**
 * Schema para login
 */
export const loginSchema: ValidationSchema<{
  email: string;
  password: string;
}> = {
  email: [validators.required("Email é obrigatório"), validators.email()],
  password: [
    validators.required("Senha é obrigatória"),
    validators.minLength(6),
  ],
};

/**
 * Schema para criar jogador
 */
export const createJogadorSchema: ValidationSchema<any> = {
  nome: [
    validators.required("Nome é obrigatório"),
    validators.minLength(3, "Nome deve ter no mínimo 3 caracteres"),
    validators.maxLength(100, "Nome deve ter no máximo 100 caracteres"),
  ],
  email: [validators.email()],
  telefone: [validators.phone()],
  nivel: [validators.required("Nível é obrigatório")],
  genero: [validators.required("Gênero é obrigatório")],
};

/**
 * Schema para criar etapa DUPLA FIXA (formato tradicional)
 */
export const createEtapaDuplaFixaSchema: ValidationSchema<any> = {
  nome: [
    validators.required("Nome é obrigatório"),
    validators.minLength(3),
    validators.maxLength(100),
  ],
  dataInicio: [
    validators.required("Data de início é obrigatória"),
    validators.date(),
  ],
  dataFim: [
    validators.required("Data de fim é obrigatória"),
    validators.date(),
  ],
  dataRealizacao: [
    validators.required("Data de realização é obrigatória"),
    validators.date(),
    validators.futureDate(),
  ],
  maxJogadores: [
    validators.required("Número máximo de jogadores é obrigatório"),
    validators.numeroPar(
      "Número de jogadores deve ser par para formato Dupla Fixa"
    ),
    validators.min(4, "Mínimo de 4 jogadores"),
    validators.max(100, "Máximo de 100 jogadores"),
  ],
  jogadoresPorGrupo: [
    validators.required("Jogadores por grupo é obrigatório"),
    validators.min(2, "Mínimo de 2 jogadores por grupo"),
    validators.max(6, "Máximo de 6 jogadores por grupo"),
  ],
  nivel: [validators.required("Nível da etapa é obrigatório")],
  genero: [validators.required("Gênero é obrigatório")],
  formato: [validators.formatoEtapa()],
};

/**
 * Schema para criar etapa REI DA PRAIA
 */
export const createEtapaReiDaPraiaSchema: ValidationSchema<any> = {
  nome: [
    validators.required("Nome é obrigatório"),
    validators.minLength(3, "Nome deve ter no mínimo 3 caracteres"),
    validators.maxLength(100, "Nome deve ter no máximo 100 caracteres"),
  ],
  dataInicio: [
    validators.required("Data de início é obrigatória"),
    validators.date(),
  ],
  dataFim: [
    validators.required("Data de fim é obrigatória"),
    validators.date(),
  ],
  dataRealizacao: [
    validators.required("Data de realização é obrigatória"),
    validators.date(),
    validators.futureDate(),
  ],
  maxJogadores: [
    validators.required("Número máximo de jogadores é obrigatório"),
    validators.minimoReiDaPraia(
      "Rei da Praia necessita de no mínimo 8 jogadores"
    ),
    validators.multiploQuatro(
      "Número de jogadores deve ser múltiplo de 4 para Rei da Praia"
    ),
    validators.max(100, "Máximo de 100 jogadores"),
  ],
  nivel: [validators.required("Nível da etapa é obrigatório")],
  genero: [validators.required("Gênero é obrigatório")],
  formato: [
    validators.required("Formato é obrigatório"),
    validators.formatoEtapa(),
  ],
};

/**
 * Helper: Selecionar schema baseado no formato
 */
export const getEtapaSchema = (formato: string): ValidationSchema<any> => {
  if (formato === "rei_da_praia") {
    return createEtapaReiDaPraiaSchema;
  }
  return createEtapaDuplaFixaSchema;
};
