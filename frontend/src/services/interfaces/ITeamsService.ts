/**
 * Interface do serviço TEAMS (Equipes)
 */

import {
  Equipe,
  ConfrontoEquipe,
  PartidaTeams,
  SetPlacarTeams,
  GerarEquipesDTO,
  FormarEquipesManualDTO,
  DefinirPartidasManualDTO,
  GerarEquipesResponse,
  RegistrarResultadoResponse,
  RegistrarResultadosEmLoteResponse,
  ResultadoPartidaLoteDTO,
  GerarPartidasResponse,
  GerarDeciderResponse,
} from "@/types/teams";

/**
 * Interface do service TEAMS
 */
export interface ITeamsService {
  // ============================================
  // EQUIPES
  // ============================================

  /**
   * Gerar equipes automaticamente
   */
  gerarEquipes(etapaId: string, dto?: GerarEquipesDTO): Promise<GerarEquipesResponse>;

  /**
   * Formar equipes manualmente
   */
  formarEquipesManual(etapaId: string, dto: FormarEquipesManualDTO): Promise<GerarEquipesResponse>;

  /**
   * Buscar equipes da etapa
   */
  buscarEquipes(etapaId: string): Promise<Equipe[]>;

  /**
   * Renomear uma equipe
   */
  renomearEquipe(etapaId: string, equipeId: string, nome: string): Promise<void>;

  // ============================================
  // CONFRONTOS
  // ============================================

  /**
   * Buscar confrontos da etapa
   */
  buscarConfrontos(etapaId: string): Promise<ConfrontoEquipe[]>;

  // ============================================
  // PARTIDAS
  // ============================================

  /**
   * Gerar partidas de um confronto (sorteio automático)
   */
  gerarPartidasConfronto(etapaId: string, confrontoId: string): Promise<GerarPartidasResponse>;

  /**
   * Definir partidas manualmente
   */
  definirPartidasManual(
    etapaId: string,
    confrontoId: string,
    dto: DefinirPartidasManualDTO
  ): Promise<GerarPartidasResponse>;

  /**
   * Buscar partidas de um confronto
   */
  buscarPartidasConfronto(etapaId: string, confrontoId: string): Promise<PartidaTeams[]>;

  /**
   * Definir jogadores de uma partida vazia (formação manual)
   */
  definirJogadoresPartida(
    etapaId: string,
    partidaId: string,
    dupla1JogadorIds: [string, string],
    dupla2JogadorIds: [string, string]
  ): Promise<PartidaTeams>;

  // ============================================
  // RESULTADO
  // ============================================

  /**
   * Registrar resultado de uma partida
   */
  registrarResultado(
    etapaId: string,
    partidaId: string,
    placar: SetPlacarTeams[]
  ): Promise<RegistrarResultadoResponse>;

  /**
   * Registrar múltiplos resultados de partidas em lote
   */
  registrarResultadosEmLote(
    etapaId: string,
    resultados: ResultadoPartidaLoteDTO[]
  ): Promise<RegistrarResultadosEmLoteResponse>;

  // ============================================
  // DECIDER
  // ============================================

  /**
   * Gerar decider quando empate 1-1 em TEAMS_4
   */
  gerarDecider(etapaId: string, confrontoId: string): Promise<GerarDeciderResponse>;

  // ============================================
  // CANCELAR / RESETAR
  // ============================================

  /**
   * Cancelar chaves TEAMS (remove equipes, confrontos e partidas)
   */
  cancelarChaves(etapaId: string): Promise<void>;

  /**
   * Resetar partidas TEAMS (mantém equipes e confrontos, remove partidas e resultados)
   */
  resetarPartidas(etapaId: string): Promise<void>;

  // ============================================
  // CLASSIFICACAO
  // ============================================

  /**
   * Recalcular classificacao das equipes
   */
  recalcularClassificacao(etapaId: string): Promise<Equipe[]>;
}
