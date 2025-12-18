/**
 * Service orquestrador para geração de chaves
 *
 * Services utilizados:
 * - DuplaService: formação de duplas
 * - GrupoService: criação de grupos
 * - PartidaGrupoService: partidas da fase de grupos
 * - EliminatoriaService: fase eliminatória
 * - ClassificacaoService: cálculos de classificação
 */

import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { StatusEtapa, FaseEtapa } from "../models/Etapa";
import { Dupla } from "../models/Dupla";
import { Grupo } from "../models/Grupo";
import { Partida } from "../models/Partida";
import { ConfrontoEliminatorio, TipoFase } from "../models/Eliminatoria";

// Services especializados
import duplaService, { IDuplaService } from "./DuplaService";
import grupoService, { IGrupoService } from "./GrupoService";
import partidaGrupoService, {
  IPartidaGrupoService,
} from "./PartidaGrupoService";
import {
  ResultadoPartidaLoteDTO,
  RegistrarResultadosEmLoteResponse,
} from "../models/Partida";
import eliminatoriaService, {
  IEliminatoriaService,
} from "./EliminatoriaService";
import etapaService from "./EtapaService";
import estatisticasJogadorService from "./EstatisticasJogadorService";
import historicoDuplaService from "./HistoricoDuplaService";
import logger from "../utils/logger";

/**
 * Interface para injeção de dependência
 */
export interface IChaveService {
  gerarChaves(
    etapaId: string,
    arenaId: string
  ): Promise<{ duplas: Dupla[]; grupos: Grupo[]; partidas: Partida[] }>;

  excluirChaves(etapaId: string, arenaId: string): Promise<void>;

  registrarResultadosEmLote(
    arenaId: string,
    resultados: ResultadoPartidaLoteDTO[]
  ): Promise<RegistrarResultadosEmLoteResponse>;

  gerarFaseEliminatoria(
    etapaId: string,
    arenaId: string,
    classificadosPorGrupo?: number
  ): Promise<{ confrontos: ConfrontoEliminatorio[] }>;

  registrarResultadoEliminatorio(
    confrontoId: string,
    arenaId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void>;

  cancelarFaseEliminatoria(etapaId: string, arenaId: string): Promise<void>;

  // Métodos de busca
  buscarDuplas(etapaId: string, arenaId: string): Promise<Dupla[]>;
  buscarGrupos(etapaId: string, arenaId: string): Promise<Grupo[]>;
  buscarPartidas(etapaId: string, arenaId: string): Promise<Partida[]>;
  buscarConfrontosEliminatorios(
    etapaId: string,
    arenaId: string,
    fase?: TipoFase
  ): Promise<ConfrontoEliminatorio[]>;
}

/**
 * ChaveService - Orquestrador
 * Coordena os services especializados para operações complexas
 */
export class ChaveService implements IChaveService {
  constructor(
    private duplas: IDuplaService = duplaService,
    private grupos: IGrupoService = grupoService,
    private partidasGrupo: IPartidaGrupoService = partidaGrupoService,
    private eliminatoria: IEliminatoriaService = eliminatoriaService
  ) {}

  /**
   * Gerar chaves completas (duplas + grupos + partidas)
   *
   * FLUXO:
   * 1. Validar etapa
   * 2. Formar duplas (respeitando cabeças de chave)
   * 3. Criar estatísticas dos jogadores
   * 4. Criar grupos (distribuindo cabeças uniformemente)
   * 5. Gerar partidas (todos contra todos)
   * 6. Atualizar status da etapa
   */
  async gerarChaves(
    etapaId: string,
    arenaId: string
  ): Promise<{ duplas: Dupla[]; grupos: Grupo[]; partidas: Partida[] }> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();

    try {
      // 1. Validar etapa
      let inicio = Date.now();
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }
      this.validarEtapaParaGeracaoChaves(etapa);
      tempos["buscarEtapa"] = Date.now() - inicio;

      // 2. Buscar inscrições
      inicio = Date.now();
      const inscricoes = await etapaService.listarInscricoes(etapaId, arenaId);
      tempos["buscarInscricoes"] = Date.now() - inicio;

      // 3. Formar duplas
      inicio = Date.now();
      const duplas = await this.duplas.formarDuplasComCabecasDeChave(
        etapaId,
        etapa.nome,
        arenaId,
        inscricoes
      );
      tempos["formarDuplas"] = Date.now() - inicio;

      // 4. Criar estatísticas dos jogadores
      inicio = Date.now();
      const estatisticasDTOs = duplas.flatMap((dupla) => [
        {
          etapaId,
          arenaId,
          jogadorId: dupla.jogador1Id,
          jogadorNome: dupla.jogador1Nome,
          jogadorNivel: dupla.jogador1Nivel,
          jogadorGenero: dupla.jogador1Genero,
          grupoId: dupla.grupoId,
          grupoNome: dupla.grupoNome,
        },
        {
          etapaId,
          arenaId,
          jogadorId: dupla.jogador2Id,
          jogadorNome: dupla.jogador2Nome,
          jogadorNivel: dupla.jogador2Nivel,
          jogadorGenero: dupla.jogador2Genero,
          grupoId: dupla.grupoId,
          grupoNome: dupla.grupoNome,
        },
      ]);
      await estatisticasJogadorService.criarEmLote(estatisticasDTOs);
      tempos["criarEstatisticas"] = Date.now() - inicio;

      // 5. Criar grupos
      inicio = Date.now();
      const grupos = await this.grupos.criarGrupos(
        etapaId,
        arenaId,
        duplas,
        etapa.jogadoresPorGrupo
      );
      tempos["criarGrupos"] = Date.now() - inicio;

      // 6. Gerar partidas
      inicio = Date.now();
      const partidas = await this.partidasGrupo.gerarPartidas(
        etapaId,
        arenaId,
        grupos
      );
      tempos["gerarPartidas"] = Date.now() - inicio;

      // 7. Atualizar status da etapa
      inicio = Date.now();
      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: true,
        dataGeracaoChaves: Timestamp.now(),
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });
      tempos["atualizarEtapa"] = Date.now() - inicio;

      tempos["TOTAL"] = Date.now() - inicioTotal;

      // Log detalhado de tempos
      logger.info("⏱️ TEMPOS gerarChaves", {
        etapaId,
        inscritos: inscricoes.length,
        duplas: duplas.length,
        grupos: grupos.length,
        partidas: partidas.length,
        tempos,
      });

      return { duplas, grupos, partidas };
    } catch (error: any) {
      tempos["TOTAL_COM_ERRO"] = Date.now() - inicioTotal;
      logger.error("Erro ao gerar chaves", { etapaId, arenaId, tempos }, error);
      throw error;
    }
  }

  /**
   * Validar etapa para geração de chaves
   */
  private validarEtapaParaGeracaoChaves(etapa: any): void {
    if (etapa.status !== StatusEtapa.INSCRICOES_ENCERRADAS) {
      throw new Error("Inscrições devem estar encerradas para gerar chaves");
    }

    if (etapa.chavesGeradas) {
      throw new Error("Chaves já foram geradas para esta etapa");
    }

    if (etapa.totalInscritos < 4) {
      throw new Error("Necessário no mínimo 4 jogadores inscritos");
    }

    if (etapa.totalInscritos % 2 !== 0) {
      throw new Error("Número de jogadores deve ser par");
    }

    if (etapa.totalInscritos !== etapa.maxJogadores) {
      throw new Error(
        `Esta etapa está configurada para ${etapa.maxJogadores} jogadores, mas possui apenas ${etapa.totalInscritos} inscrito(s). ` +
          `Para gerar chaves com menos jogadores, primeiro edite a etapa e ajuste o número máximo de jogadores para ${etapa.totalInscritos}.`
      );
    }
  }

  /**
   * Excluir todas as chaves da etapa
   */
  async excluirChaves(etapaId: string, arenaId: string): Promise<void> {
    const timings: Record<string, number> = {};
    const startTotal = Date.now();

    try {
      let start = Date.now();
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      timings["buscarEtapa"] = Date.now() - start;

      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (!etapa.chavesGeradas) {
        throw new Error("Esta etapa não possui chaves geradas");
      }

      // Cancelar fase eliminatória se existir (precisa rodar primeiro)
      try {
        start = Date.now();
        await this.eliminatoria.cancelarFaseEliminatoria(etapaId, arenaId);
        timings["cancelarFaseEliminatoria"] = Date.now() - start;
      } catch {
        timings["cancelarFaseEliminatoria"] = Date.now() - start;
        // Ignorar se não existir fase eliminatória
      }

      // Executar todas as deleções em paralelo (são independentes)
      const startParalelo = Date.now();
      const [
        partidasGruposResult,
        gruposResult,
        duplasResult,
        partidasReiResult,
        estatisticasResult,
        historicoResult,
      ] = await Promise.all([
        (async () => {
          const s = Date.now();
          await this.deletarPartidasGrupos(etapaId, arenaId);
          return Date.now() - s;
        })(),
        (async () => {
          const s = Date.now();
          await this.grupos.deletarPorEtapa(etapaId, arenaId);
          return Date.now() - s;
        })(),
        (async () => {
          const s = Date.now();
          await this.duplas.deletarPorEtapa(etapaId, arenaId);
          return Date.now() - s;
        })(),
        (async () => {
          const s = Date.now();
          await this.deletarPartidasReiDaPraia(etapaId, arenaId);
          return Date.now() - s;
        })(),
        (async () => {
          const s = Date.now();
          await this.deletarEstatisticas(etapaId, arenaId);
          return Date.now() - s;
        })(),
        (async () => {
          const s = Date.now();
          await historicoDuplaService.limparDaEtapa(arenaId, etapaId);
          return Date.now() - s;
        })(),
      ]);

      timings["deletarPartidasGrupos"] = partidasGruposResult;
      timings["deletarGrupos"] = gruposResult;
      timings["deletarDuplas"] = duplasResult;
      timings["deletarPartidasReiDaPraia"] = partidasReiResult;
      timings["deletarEstatisticas"] = estatisticasResult;
      timings["limparHistoricoDuplas"] = historicoResult;
      timings["deletarTodos_PARALELO"] = Date.now() - startParalelo;

      // Atualizar etapa
      start = Date.now();
      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: false,
        dataGeracaoChaves: null,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        atualizadoEm: Timestamp.now(),
      });
      timings["atualizarEtapa"] = Date.now() - start;

      timings["TOTAL"] = Date.now() - startTotal;
      logger.info("⏱️ TIMING excluirChaves", { timings, etapaId, arenaId });
      logger.info("Chaves excluídas", { etapaId, arenaId });
    } catch (error: any) {
      timings["TOTAL"] = Date.now() - startTotal;
      logger.error(
        "Erro ao excluir chaves",
        { etapaId, arenaId, timings },
        error
      );
      throw error;
    }
  }

  /**
   * Registrar múltiplos resultados de partidas em lote
   */
  async registrarResultadosEmLote(
    arenaId: string,
    resultados: ResultadoPartidaLoteDTO[]
  ): Promise<RegistrarResultadosEmLoteResponse> {
    return this.partidasGrupo.registrarResultadosEmLote(arenaId, resultados);
  }

  /**
   * Gerar fase eliminatória
   */
  async gerarFaseEliminatoria(
    etapaId: string,
    arenaId: string,
    classificadosPorGrupo: number = 2
  ): Promise<{ confrontos: ConfrontoEliminatorio[] }> {
    return this.eliminatoria.gerarFaseEliminatoria(
      etapaId,
      arenaId,
      classificadosPorGrupo
    );
  }

  /**
   * Registrar resultado de confronto eliminatório
   */
  async registrarResultadoEliminatorio(
    confrontoId: string,
    arenaId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void> {
    await this.eliminatoria.registrarResultado(confrontoId, arenaId, placar);
  }

  /**
   * Cancelar fase eliminatória
   */
  async cancelarFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    await this.eliminatoria.cancelarFaseEliminatoria(etapaId, arenaId);
  }

  // ==================== MÉTODOS DE BUSCA ====================

  /**
   * Buscar duplas de uma etapa
   */
  async buscarDuplas(etapaId: string, arenaId: string): Promise<Dupla[]> {
    return this.duplas.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar grupos de uma etapa
   */
  async buscarGrupos(etapaId: string, arenaId: string): Promise<Grupo[]> {
    return this.grupos.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar partidas de uma etapa
   */
  async buscarPartidas(etapaId: string, arenaId: string): Promise<Partida[]> {
    return this.partidasGrupo.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar confrontos eliminatórios
   */
  async buscarConfrontosEliminatorios(
    etapaId: string,
    arenaId: string,
    fase?: TipoFase
  ): Promise<ConfrontoEliminatorio[]> {
    return this.eliminatoria.buscarConfrontos(etapaId, arenaId, fase);
  }

  // ==================== MÉTODOS AUXILIARES DE LIMPEZA ====================

  /**
   * Deletar partidas de grupos
   */
  private async deletarPartidasGrupos(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    const snapshot = await db
      .collection("partidas")
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", FaseEtapa.GRUPOS)
      .get();

    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  /**
   * Deletar partidas Rei da Praia
   */
  private async deletarPartidasReiDaPraia(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    const snapshot = await db
      .collection("partidas_rei_da_praia")
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  /**
   * Deletar estatísticas
   */
  private async deletarEstatisticas(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    const snapshot = await db
      .collection("estatisticas_jogador")
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }
}

// Exportar instância padrão
export default new ChaveService();
