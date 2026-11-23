/**
 * Implementação de cada formato de etapa
 */

import { FormatoEtapa } from "../../models/Etapa";
import { DuplaFixaFormato } from "./DuplaFixaFormato";
import { FormatoTorneio } from "./FormatoTorneio";
import { ReiDaPraiaFormato } from "./ReiDaPraiaFormato";
import { SuperXFormato } from "./SuperXFormato";
import { TeamsFormato } from "./TeamsFormato";

export type { Encerramento, FormatoTorneio } from "./FormatoTorneio";

// Formato novo no enum sem implementação aqui não compila
const FORMATOS: Record<FormatoEtapa, FormatoTorneio> = {
  [FormatoEtapa.DUPLA_FIXA]: new DuplaFixaFormato(),
  [FormatoEtapa.REI_DA_PRAIA]: new ReiDaPraiaFormato(),
  [FormatoEtapa.SUPER_X]: new SuperXFormato(),
  [FormatoEtapa.TEAMS]: new TeamsFormato(),
};

/**
 * Etapa antiga, sem formato gravado, é Dupla Fixa
 */
export const getFormato = (formato?: FormatoEtapa): FormatoTorneio =>
  FORMATOS[formato ?? FormatoEtapa.DUPLA_FIXA] ??
  FORMATOS[FormatoEtapa.DUPLA_FIXA];
