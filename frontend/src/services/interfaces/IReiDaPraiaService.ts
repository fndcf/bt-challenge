/**
 * Interface para serviço de operações do formato Rei da Praia
 */

import {
  EstatisticasJogador,
  PartidaReiDaPraia,
  ResultadoChavesReiDaPraia,
  ResultadoEliminatoriaReiDaPraia,
  TipoChaveamentoReiDaPraia,
  ResultadoPartidaLoteSuperXDTO,
  RegistrarResultadosEmLoteSuperXResponse,
} from "@/types/reiDaPraia";
import { Grupo } from "@/types/chave";

export interface IReiDaPraiaService {
  /**
   * Gerar chaves no formato Rei da Praia
   * Cria grupos de 4 jogadores com combinações fixas de duplas
   * @param etapaId - ID da etapa
   * @returns Promise com resultado da geração (jogadores, grupos, partidas)
   */
  gerarChaves(etapaId: string): Promise<ResultadoChavesReiDaPraia>;

  /**
   * Buscar estatísticas individuais dos jogadores
   * @param etapaId - ID da etapa
   * @returns Promise com lista de estatísticas dos jogadores
   */
  buscarJogadores(etapaId: string): Promise<EstatisticasJogador[]>;

  /**
   * Buscar grupos da etapa Rei da Praia
   * @param etapaId - ID da etapa
   * @returns Promise com lista de grupos
   */
  buscarGrupos(etapaId: string): Promise<Grupo[]>;

  /**
   * Buscar partidas da etapa Rei da Praia
   * @param etapaId - ID da etapa
   * @returns Promise com lista de partidas
   */
  buscarPartidas(etapaId: string): Promise<PartidaReiDaPraia[]>;

  /**
   * Buscar jogadores de um grupo específico
   * @param etapaId - ID da etapa
   * @param grupoId - ID do grupo
   * @returns Promise com lista de estatísticas dos jogadores do grupo
   */
  buscarJogadoresDoGrupo(
    etapaId: string,
    grupoId: string
  ): Promise<EstatisticasJogador[]>;

  /**
   * Gerar fase eliminatória com duplas fixas
   * @param etapaId - ID da etapa
   * @param data - Configurações (classificadosPorGrupo, tipoChaveamento)
   * @param data.classificadosPorGrupo - Quantos jogadores classificam por grupo
   * @param data.tipoChaveamento - Tipo de chaveamento (melhores_com_melhores, pareamento_por_ranking, sorteio_aleatorio)
   * @returns Promise com resultado da eliminatória (duplas, confrontos)
   */
  gerarEliminatoria(
    etapaId: string,
    data: {
      classificadosPorGrupo: number;
      tipoChaveamento: TipoChaveamentoReiDaPraia;
    }
  ): Promise<ResultadoEliminatoriaReiDaPraia>;

  /**
   * Buscar duplas fixas da fase eliminatória
   * @param etapaId - ID da etapa
   * @returns Promise com lista de duplas eliminatórias
   */
  buscarDuplasEliminatoria(etapaId: string): Promise<any[]>;

  /**
   * Buscar confrontos eliminatórios
   * @param etapaId - ID da etapa
   * @returns Promise com lista de confrontos
   */
  buscarConfrontosEliminatorios(etapaId: string): Promise<any[]>;

  /**
   * Validar se etapa pode gerar chaves Rei da Praia
   * @param etapa - Dados da etapa
   * @returns Objeto com flag podeGerar e mensagem opcional de erro
   */
  validarGeracaoChaves(etapa: any): {
    podeGerar: boolean;
    mensagem?: string;
  };

  /**
   * Validar se pode gerar fase eliminatória
   * @param etapa - Dados da etapa
   * @param grupos - Lista de grupos da etapa
   * @returns Objeto com flag podeGerar e mensagem opcional de erro
   */
  validarGeracaoEliminatoria(
    etapa: any,
    grupos: Grupo[]
  ): {
    podeGerar: boolean;
    mensagem?: string;
  };

  /**
   * Cancelar fase eliminatória
   * @param etapaId - ID da etapa
   * @returns Promise void
   */
  cancelarEliminatoria(etapaId: string): Promise<void>;

  /**
   * Registrar múltiplos resultados de partidas em lote
   * @param etapaId - ID da etapa
   * @param resultados - Array de resultados com partidaId e placar
   * @returns Promise com resposta contendo processados e erros
   */
  registrarResultadosEmLote(
    etapaId: string,
    resultados: ResultadoPartidaLoteSuperXDTO[]
  ): Promise<RegistrarResultadosEmLoteSuperXResponse>;
}
