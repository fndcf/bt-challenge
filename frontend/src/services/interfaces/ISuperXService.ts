/**
 * Interface do serviço Super X
 */

import {
  EstatisticasJogador,
  PartidaReiDaPraia,
  ResultadoPartidaLoteSuperXDTO,
  RegistrarResultadosEmLoteSuperXResponse,
} from "@/types/reiDaPraia";
import { Grupo } from "@/types/chave";

/**
 * Resultado da geração de chaves Super X
 */
export interface ResultadoChavesSuperX {
  jogadores: EstatisticasJogador[];
  grupo: Grupo;
  partidas: PartidaReiDaPraia[];
}

/**
 * Interface do service Super X
 */
export interface ISuperXService {
  /**
   * Gerar chaves no formato Super X
   */
  gerarChaves(etapaId: string): Promise<ResultadoChavesSuperX>;

  /**
   * Cancelar chaves Super X
   */
  cancelarChaves(etapaId: string): Promise<void>;

  /**
   * Buscar estatísticas individuais dos jogadores
   */
  buscarJogadores(etapaId: string): Promise<EstatisticasJogador[]>;

  /**
   * Buscar grupo único da etapa Super X
   */
  buscarGrupo(etapaId: string): Promise<Grupo>;

  /**
   * Buscar partidas da etapa Super X
   */
  buscarPartidas(etapaId: string): Promise<PartidaReiDaPraia[]>;

  /**
   * Registrar resultado de partida Super X (1 SET)
   */
  registrarResultado(
    etapaId: string,
    partidaId: string,
    placar: Array<{
      numero: number;
      gamesDupla1: number;
      gamesDupla2: number;
    }>
  ): Promise<void>;

  /**
   * Registrar múltiplos resultados de partidas em lote
   */
  registrarResultadosEmLote(
    etapaId: string,
    resultados: ResultadoPartidaLoteSuperXDTO[]
  ): Promise<RegistrarResultadosEmLoteSuperXResponse>;
}
