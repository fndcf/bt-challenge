/**
 * Regras de participação de cada formato
 */

import {
  Etapa,
  FormatoEtapa,
  TipoFormacaoDupla,
  TipoFormacaoEquipe,
} from "./Etapa";

export interface RegrasFormato {
  /** Com nível na etapa, só entra jogador do mesmo nível */
  inscricaoExigeNivel: boolean;

  /** Etapa mista tem metade das vagas para cada gênero */
  mistoDivideVagas: boolean;

  /** Os grupos são de jogadores, não de duplas ou equipes */
  grupoIndividual: boolean;

  /** A etapa junta níveis diferentes na mesma dupla ou equipe */
  misturaNiveis(etapa: Etapa): boolean;
}

const REGRAS: Record<FormatoEtapa, RegrasFormato> = {
  [FormatoEtapa.DUPLA_FIXA]: {
    inscricaoExigeNivel: true,
    mistoDivideVagas: true,
    grupoIndividual: false,
    misturaNiveis: (etapa) =>
      etapa.tipoFormacaoDupla === TipoFormacaoDupla.BALANCEADO,
  },
  [FormatoEtapa.REI_DA_PRAIA]: {
    inscricaoExigeNivel: true,
    mistoDivideVagas: false,
    grupoIndividual: true,
    misturaNiveis: () => false,
  },
  [FormatoEtapa.SUPER_X]: {
    inscricaoExigeNivel: false,
    mistoDivideVagas: false,
    grupoIndividual: true,
    misturaNiveis: () => false,
  },
  [FormatoEtapa.TEAMS]: {
    inscricaoExigeNivel: true,
    mistoDivideVagas: true,
    grupoIndividual: false,
    misturaNiveis: (etapa) =>
      etapa.tipoFormacaoEquipe === TipoFormacaoEquipe.BALANCEADO,
  },
};

/**
 * Etapa antiga, sem formato gravado, é Dupla Fixa
 */
export const getRegras = (formato?: FormatoEtapa): RegrasFormato =>
  REGRAS[formato ?? FormatoEtapa.DUPLA_FIXA] ?? REGRAS[FormatoEtapa.DUPLA_FIXA];
