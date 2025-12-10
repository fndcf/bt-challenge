/**
 * Service para gerenciar formato Super X (Super 8, Super 10, Super 12)
 *
 * Super X é similar ao Rei da Praia, mas:
 * - Grupo único (sem múltiplos grupos)
 * - Número fixo de jogadores: 8, 10 ou 12
 * - Sem fase eliminatória
 * - Estatísticas individuais por jogador
 * - Tabela de rodadas hardcoded com duplas rotativas
 */

import { StatusEtapa, FaseEtapa } from "../models/Etapa";
import { Inscricao } from "../models/Inscricao";
import { Grupo } from "../models/Grupo";
import { StatusPartida } from "../models/Partida";
import logger from "../utils/logger";

// Utilitários compartilhados
import { embaralhar } from "../utils/arrayUtils";

// Config de schedules
import {
  getSuperXSchedule,
  getTotalRodadas,
  getTotalPartidas,
} from "../config/SuperXSchedules";

// Interfaces dos repositories
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import { IInscricaoRepository } from "../repositories/interfaces/IInscricaoRepository";
import { IGrupoRepository } from "../repositories/interfaces/IGrupoRepository";
import {
  IPartidaReiDaPraiaRepository,
  PartidaReiDaPraia,
  CriarPartidaReiDaPraiaDTO,
} from "../repositories/interfaces/IPartidaReiDaPraiaRepository";
import {
  IEstatisticasJogadorRepository,
  EstatisticasJogador,
} from "../repositories/interfaces/IEstatisticasJogadorRepository";

// Implementações Firebase (para instância default)
import { EtapaRepository } from "../repositories/firebase/EtapaRepository";
import { InscricaoRepository } from "../repositories/firebase/InscricaoRepository";
import { GrupoRepository } from "../repositories/firebase/GrupoRepository";
import { PartidaReiDaPraiaRepository } from "../repositories/firebase/PartidaReiDaPraiaRepository";
import { EstatisticasJogadorRepository } from "../repositories/firebase/EstatisticasJogadorRepository";

// Services auxiliares
import estatisticasJogadorService from "./EstatisticasJogadorService";

/**
 * Usa injeção de dependência para repositories
 */
export class SuperXService {
  constructor(
    private etapaRepository: IEtapaRepository,
    private inscricaoRepository: IInscricaoRepository,
    private grupoRepository: IGrupoRepository,
    private partidaReiDaPraiaRepository: IPartidaReiDaPraiaRepository,
    private estatisticasJogadorRepository: IEstatisticasJogadorRepository
  ) {}

  /**
   * Gerar chaves no formato Super X
   */
  async gerarChaves(
    etapaId: string,
    arenaId: string
  ): Promise<{
    jogadores: EstatisticasJogador[];
    grupo: Grupo;
    partidas: PartidaReiDaPraia[];
  }> {
    try {
      const etapa = await this.etapaRepository.buscarPorIdEArena(
        etapaId,
        arenaId
      );
      if (!etapa) throw new Error("Etapa não encontrada");

      if (etapa.status !== StatusEtapa.INSCRICOES_ENCERRADAS) {
        throw new Error("Inscrições devem estar encerradas");
      }

      if (etapa.chavesGeradas) {
        throw new Error("Chaves já foram geradas");
      }

      // Validar variante (apenas 8 e 12 - Super 10 removido por impossibilidade matemática)
      const variant = etapa.varianteSuperX as 8 | 12;
      if (![8, 12].includes(variant)) {
        throw new Error("Variante Super X inválida. Deve ser 8 ou 12.");
      }

      // Validar número de jogadores
      if (etapa.totalInscritos !== variant) {
        throw new Error(
          `Super ${variant} requer exatamente ${variant} jogadores. Atualmente há ${etapa.totalInscritos} inscritos.`
        );
      }

      if (etapa.totalInscritos !== etapa.maxJogadores) {
        throw new Error(
          `Etapa configurada para ${etapa.maxJogadores} jogadores, mas possui ${etapa.totalInscritos}`
        );
      }

      // Buscar inscrições via repository
      const inscricoes = await this.inscricaoRepository.buscarConfirmadas(
        etapaId,
        arenaId
      );

      // Criar estatísticas para cada jogador
      const jogadores = await this.criarEstatisticasJogadores(
        etapaId,
        arenaId,
        inscricoes,
        variant
      );

      // Criar grupo único
      const grupo = await this.criarGrupoUnico(
        etapaId,
        arenaId,
        jogadores,
        variant
      );

      // Atualizar grupoId em cada jogador
      for (const jogador of jogadores) {
        await estatisticasJogadorService.atualizarGrupo(
          jogador.jogadorId,
          etapaId,
          grupo.id,
          grupo.nome
        );
      }

      // Gerar partidas usando o schedule
      const partidas = await this.gerarPartidas(
        etapaId,
        arenaId,
        grupo,
        jogadores,
        variant
      );

      // Marcar chaves como geradas
      await this.etapaRepository.marcarChavesGeradas(etapaId, true);

      logger.info("Chaves Super X geradas", {
        etapaId,
        arenaId,
        variant,
        totalJogadores: jogadores.length,
        totalRodadas: getTotalRodadas(variant),
        totalPartidas: partidas.length,
      });

      return { jogadores, grupo, partidas };
    } catch (error: any) {
      logger.error(
        "Erro ao gerar chaves Super X",
        {
          etapaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Criar estatísticas para cada jogador
   */
  private async criarEstatisticasJogadores(
    etapaId: string,
    arenaId: string,
    inscricoes: Inscricao[],
    variant: 8 | 10 | 12
  ): Promise<EstatisticasJogador[]> {
    try {
      const jogadores: EstatisticasJogador[] = [];
      const grupoNome = `Super ${variant}`;

      // Embaralhar para distribuição aleatória
      const inscricoesEmbaralhadas = embaralhar([...inscricoes]);

      for (const inscricao of inscricoesEmbaralhadas) {
        const estatisticas = await estatisticasJogadorService.criar({
          etapaId,
          arenaId,
          jogadorId: inscricao.jogadorId,
          jogadorNome: inscricao.jogadorNome,
          jogadorNivel: inscricao.jogadorNivel,
          jogadorGenero: inscricao.jogadorGenero,
          grupoNome,
        });

        jogadores.push(estatisticas as unknown as EstatisticasJogador);
      }

      return jogadores;
    } catch (error) {
      logger.error(
        "Erro ao criar estatísticas dos jogadores",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao criar estatísticas dos jogadores");
    }
  }

  /**
   * Criar grupo único para Super X
   */
  private async criarGrupoUnico(
    etapaId: string,
    arenaId: string,
    jogadores: EstatisticasJogador[],
    variant: 8 | 10 | 12
  ): Promise<Grupo> {
    try {
      const grupo = await this.grupoRepository.criar({
        etapaId,
        arenaId,
        nome: `Super ${variant}`,
        ordem: 1,
        duplas: jogadores.map((j) => j.id),
        totalDuplas: jogadores.length,
      });

      return grupo;
    } catch (error) {
      logger.error(
        "Erro ao criar grupo",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao criar grupo");
    }
  }

  /**
   * Gerar partidas usando o schedule hardcoded
   */
  private async gerarPartidas(
    etapaId: string,
    arenaId: string,
    grupo: Grupo,
    jogadores: EstatisticasJogador[],
    variant: 8 | 12
  ): Promise<PartidaReiDaPraia[]> {
    try {
      const schedule = getSuperXSchedule(variant);
      const todasPartidas: PartidaReiDaPraia[] = [];
      const partidasIds: string[] = [];

      for (const rodada of schedule) {
        for (const partida of rodada.partidas) {
          const jogador1A = jogadores[partida.dupla1[0]];
          const jogador1B = jogadores[partida.dupla1[1]];
          const jogador2A = jogadores[partida.dupla2[0]];
          const jogador2B = jogadores[partida.dupla2[1]];

          const partidaDTO: CriarPartidaReiDaPraiaDTO = {
            etapaId,
            arenaId,
            fase: FaseEtapa.GRUPOS,
            grupoId: grupo.id,
            grupoNome: grupo.nome,
            rodada: rodada.rodada,
            jogador1AId: jogador1A.jogadorId,
            jogador1ANome: jogador1A.jogadorNome,
            jogador1BId: jogador1B.jogadorId,
            jogador1BNome: jogador1B.jogadorNome,
            dupla1Nome: `${jogador1A.jogadorNome} & ${jogador1B.jogadorNome}`,
            jogador2AId: jogador2A.jogadorId,
            jogador2ANome: jogador2A.jogadorNome,
            jogador2BId: jogador2B.jogadorId,
            jogador2BNome: jogador2B.jogadorNome,
            dupla2Nome: `${jogador2A.jogadorNome} & ${jogador2B.jogadorNome}`,
          };

          const partidaCriada =
            await this.partidaReiDaPraiaRepository.criar(partidaDTO);
          todasPartidas.push(partidaCriada);
          partidasIds.push(partidaCriada.id);
        }
      }

      // Atualizar grupo com total de partidas
      const totalPartidas = getTotalPartidas(variant);
      await this.grupoRepository.atualizarContadores(grupo.id, {
        totalPartidas,
      });

      // Adicionar partidas ao grupo
      for (const partidaId of partidasIds) {
        await this.grupoRepository.adicionarPartida(grupo.id, partidaId);
      }

      return todasPartidas;
    } catch (error) {
      logger.error(
        "Erro ao gerar partidas",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao gerar partidas");
    }
  }

  /**
   * Registrar resultado de partida
   * Reutiliza a mesma lógica do Rei da Praia
   */
  async registrarResultadoPartida(
    partidaId: string,
    arenaId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void> {
    try {
      // Buscar partida via repository
      let partida = await this.partidaReiDaPraiaRepository.buscarPorIdEArena(
        partidaId,
        arenaId
      );

      if (!partida) {
        throw new Error("Partida não encontrada");
      }

      const isEdicao = partida.status === StatusPartida.FINALIZADA;

      // Se for edição, reverter estatísticas anteriores
      if (isEdicao && partida.placar && partida.placar.length > 0) {
        await this.reverterEstatisticasJogadores(partida);

        partida = await this.partidaReiDaPraiaRepository.buscarPorIdEArena(
          partidaId,
          arenaId
        );

        if (!partida) {
          throw new Error("Partida não encontrada após reversão");
        }

        logger.info("Estatísticas revertidas, partida re-buscada", {
          partidaId,
        });
      }

      // Validar placar (apenas 1 set no Super X)
      if (placar.length !== 1) {
        throw new Error("Placar inválido: deve ter apenas 1 set");
      }

      const set = placar[0];
      const setsDupla1 = set.gamesDupla1 > set.gamesDupla2 ? 1 : 0;
      const setsDupla2 = set.gamesDupla1 > set.gamesDupla2 ? 0 : 1;
      const vencedorDupla = setsDupla1 > setsDupla2 ? 1 : 2;

      // Atualizar partida via repository
      await this.partidaReiDaPraiaRepository.atualizar(partidaId, {
        placar,
        setsDupla1,
        setsDupla2,
        vencedorDupla,
        status: StatusPartida.FINALIZADA,
      });

      // Atualizar estatísticas dos jogadores
      const dupla1Venceu = vencedorDupla === 1;

      // Jogadores da dupla 1
      await estatisticasJogadorService.atualizarAposPartidaGrupo(
        partida.jogador1AId,
        partida.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: setsDupla1,
          setsPerdidos: setsDupla2,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      );

      await estatisticasJogadorService.atualizarAposPartidaGrupo(
        partida.jogador1BId,
        partida.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: setsDupla1,
          setsPerdidos: setsDupla2,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      );

      // Jogadores da dupla 2
      await estatisticasJogadorService.atualizarAposPartidaGrupo(
        partida.jogador2AId,
        partida.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: setsDupla2,
          setsPerdidos: setsDupla1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      );

      await estatisticasJogadorService.atualizarAposPartidaGrupo(
        partida.jogador2BId,
        partida.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: setsDupla2,
          setsPerdidos: setsDupla1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      );

      // Recalcular classificação do grupo
      if (partida.grupoId) {
        await this.recalcularClassificacao(partida.grupoId, partida.etapaId);

        // Verificar se grupo está completo
        await this.verificarGrupoCompleto(partida.grupoId);
      }

      logger.info("Resultado Super X registrado", {
        partidaId,
        vencedorDupla,
        placar,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultado Super X",
        {
          partidaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Reverter estatísticas dos jogadores (para edição de resultado)
   */
  private async reverterEstatisticasJogadores(
    partida: PartidaReiDaPraia
  ): Promise<void> {
    if (!partida.placar || partida.placar.length === 0) return;

    const set = partida.placar[0];
    const dupla1Venceu = partida.vencedorDupla === 1;

    const gamesVencidosDupla1 = set.gamesDupla1;
    const gamesPerdidosDupla1 = set.gamesDupla2;
    const gamesVencidosDupla2 = set.gamesDupla2;
    const gamesPerdidosDupla2 = set.gamesDupla1;

    const setsDupla1 = partida.setsDupla1 || 0;
    const setsDupla2 = partida.setsDupla2 || 0;

    // Reverter jogadores da dupla 1
    await estatisticasJogadorService.reverterAposPartida(
      partida.jogador1AId,
      partida.etapaId,
      {
        venceu: dupla1Venceu,
        setsVencidos: setsDupla1,
        setsPerdidos: setsDupla2,
        gamesVencidos: gamesVencidosDupla1,
        gamesPerdidos: gamesPerdidosDupla1,
      }
    );

    await estatisticasJogadorService.reverterAposPartida(
      partida.jogador1BId,
      partida.etapaId,
      {
        venceu: dupla1Venceu,
        setsVencidos: setsDupla1,
        setsPerdidos: setsDupla2,
        gamesVencidos: gamesVencidosDupla1,
        gamesPerdidos: gamesPerdidosDupla1,
      }
    );

    // Reverter jogadores da dupla 2
    await estatisticasJogadorService.reverterAposPartida(
      partida.jogador2AId,
      partida.etapaId,
      {
        venceu: !dupla1Venceu,
        setsVencidos: setsDupla2,
        setsPerdidos: setsDupla1,
        gamesVencidos: gamesVencidosDupla2,
        gamesPerdidos: gamesPerdidosDupla2,
      }
    );

    await estatisticasJogadorService.reverterAposPartida(
      partida.jogador2BId,
      partida.etapaId,
      {
        venceu: !dupla1Venceu,
        setsVencidos: setsDupla2,
        setsPerdidos: setsDupla1,
        gamesVencidos: gamesVencidosDupla2,
        gamesPerdidos: gamesPerdidosDupla2,
      }
    );
  }

  /**
   * Recalcular classificação do grupo
   */
  private async recalcularClassificacao(
    grupoId: string,
    _etapaId: string
  ): Promise<void> {
    const jogadores =
      await this.estatisticasJogadorRepository.buscarPorGrupo(grupoId);

    // Ordenar por critérios de desempate
    const jogadoresOrdenados = [...jogadores].sort((a, b) => {
      // 1. Pontos (vitórias × 3)
      if (a.pontosGrupo !== b.pontosGrupo) {
        return (b.pontosGrupo || 0) - (a.pontosGrupo || 0);
      }

      // 2. Saldo de games
      if (a.saldoGamesGrupo !== b.saldoGamesGrupo) {
        return (b.saldoGamesGrupo || 0) - (a.saldoGamesGrupo || 0);
      }

      // 3. Saldo de sets
      if (a.saldoSetsGrupo !== b.saldoSetsGrupo) {
        return (b.saldoSetsGrupo || 0) - (a.saldoSetsGrupo || 0);
      }

      // 4. Games vencidos
      if (a.gamesVencidosGrupo !== b.gamesVencidosGrupo) {
        return (b.gamesVencidosGrupo || 0) - (a.gamesVencidosGrupo || 0);
      }

      return 0;
    });

    // Atualizar posição de cada jogador
    for (let i = 0; i < jogadoresOrdenados.length; i++) {
      await this.estatisticasJogadorRepository.atualizar(
        jogadoresOrdenados[i].id,
        {
          posicaoGrupo: i + 1,
        }
      );
    }
  }

  /**
   * Verificar se o grupo está completo (todas as partidas finalizadas)
   */
  private async verificarGrupoCompleto(grupoId: string): Promise<void> {
    const grupo = await this.grupoRepository.buscarPorId(grupoId);
    if (!grupo) return;

    const partidas =
      await this.partidaReiDaPraiaRepository.buscarPorGrupo(grupoId);
    const partidasFinalizadas = partidas.filter(
      (p) => p.status === StatusPartida.FINALIZADA
    );

    if (partidasFinalizadas.length === partidas.length && partidas.length > 0) {
      await this.grupoRepository.atualizar(grupoId, {
        completo: true,
        partidasFinalizadas: partidasFinalizadas.length,
      });
    } else {
      await this.grupoRepository.atualizar(grupoId, {
        completo: false,
        partidasFinalizadas: partidasFinalizadas.length,
      });
    }
  }

  /**
   * Buscar jogadores da etapa Super X
   */
  async buscarJogadores(
    etapaId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]> {
    return this.estatisticasJogadorRepository.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar partidas da etapa Super X
   */
  async buscarPartidas(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia[]> {
    return this.partidaReiDaPraiaRepository.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar partidas por rodada
   */
  async buscarPartidasPorRodada(
    etapaId: string,
    arenaId: string,
    rodada: number
  ): Promise<PartidaReiDaPraia[]> {
    const partidas = await this.partidaReiDaPraiaRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );
    return partidas.filter((p) => p.rodada === rodada);
  }

  /**
   * Buscar grupo da etapa Super X
   */
  async buscarGrupo(etapaId: string, arenaId: string): Promise<Grupo | null> {
    const grupos = await this.grupoRepository.buscarPorEtapa(etapaId, arenaId);
    return grupos.length > 0 ? grupos[0] : null;
  }

  /**
   * Cancelar chaves Super X (resetar tudo)
   */
  async cancelarChaves(etapaId: string, arenaId: string): Promise<void> {
    try {
      const etapa = await this.etapaRepository.buscarPorIdEArena(
        etapaId,
        arenaId
      );
      if (!etapa) throw new Error("Etapa não encontrada");

      if (!etapa.chavesGeradas) {
        throw new Error("Chaves ainda não foram geradas");
      }

      // Buscar grupos
      const grupos = await this.grupoRepository.buscarPorEtapa(etapaId, arenaId);

      // Deletar partidas de cada grupo
      for (const grupo of grupos) {
        const partidas =
          await this.partidaReiDaPraiaRepository.buscarPorGrupo(grupo.id);
        for (const partida of partidas) {
          await this.partidaReiDaPraiaRepository.deletar(partida.id);
        }
      }

      // Deletar estatísticas dos jogadores
      const estatisticas =
        await this.estatisticasJogadorRepository.buscarPorEtapa(
          etapaId,
          arenaId
        );
      for (const est of estatisticas) {
        await this.estatisticasJogadorRepository.deletar(est.id);
      }

      // Deletar grupos
      for (const grupo of grupos) {
        await this.grupoRepository.deletar(grupo.id);
      }

      // Desmarcar chaves como geradas
      await this.etapaRepository.marcarChavesGeradas(etapaId, false);

      // Voltar status para inscrições encerradas
      await this.etapaRepository.atualizarStatus(
        etapaId,
        StatusEtapa.INSCRICOES_ENCERRADAS
      );

      logger.info("Chaves Super X canceladas", {
        etapaId,
        arenaId,
        gruposRemovidos: grupos.length,
        jogadoresRemovidos: estatisticas.length,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao cancelar chaves Super X",
        {
          etapaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }
}

// Instância default com repositories Firebase
const etapaRepositoryInstance = new EtapaRepository();
const inscricaoRepositoryInstance = new InscricaoRepository();
const grupoRepositoryInstance = new GrupoRepository();
const partidaReiDaPraiaRepositoryInstance = new PartidaReiDaPraiaRepository();
const estatisticasJogadorRepositoryInstance =
  new EstatisticasJogadorRepository();

export default new SuperXService(
  etapaRepositoryInstance,
  inscricaoRepositoryInstance,
  grupoRepositoryInstance,
  partidaReiDaPraiaRepositoryInstance,
  estatisticasJogadorRepositoryInstance
);
