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
   * Validar etapa
   * Formar duplas (respeitando cabeças de chave)
   * Criar estatísticas dos jogadores
   * Criar grupos (distribuindo cabeças uniformemente)
   * Gerar partidas (todos contra todos)
   * Atualizar status da etapa
   */
  async gerarChaves(
    etapaId: string,
    arenaId: string
  ): Promise<{ duplas: Dupla[]; grupos: Grupo[]; partidas: Partida[] }> {
    try {
      // Validar etapa
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }
      this.validarEtapaParaGeracaoChaves(etapa);

      // Buscar inscrições
      const inscricoes = await etapaService.listarInscricoes(etapaId, arenaId);

      // Formar duplas (passa tipoFormacaoDupla se houver)
      const duplas = await this.duplas.formarDuplasComCabecasDeChave(
        etapaId,
        etapa.nome,
        arenaId,
        inscricoes,
        etapa.tipoFormacaoDupla
      );

      // Criar estatísticas dos jogadores
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

      // Criar grupos
      const grupos = await this.grupos.criarGrupos(
        etapaId,
        arenaId,
        duplas,
        etapa.jogadoresPorGrupo
      );

      // Gerar partidas
      const partidas = await this.partidasGrupo.gerarPartidas(
        etapaId,
        arenaId,
        grupos
      );

      // Atualizar status da etapa
      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: true,
        dataGeracaoChaves: Timestamp.now(),
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Chaves geradas com sucesso", {
        etapaId,
        inscritos: inscricoes.length,
        duplas: duplas.length,
        grupos: grupos.length,
        partidas: partidas.length,
      });

      return { duplas, grupos, partidas };
    } catch (error: any) {
      logger.error("Erro ao gerar chaves", { etapaId, arenaId }, error);
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
    try {
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);

      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (!etapa.chavesGeradas) {
        throw new Error("Esta etapa não possui chaves geradas");
      }

      // Cancelar fase eliminatória se existir (precisa rodar primeiro)
      try {
        await this.eliminatoria.cancelarFaseEliminatoria(etapaId, arenaId);
      } catch {
        // Ignorar se não existir fase eliminatória
      }

      // Executar todas as deleções em paralelo (são independentes)
      await Promise.all([
        (async () => {
          await this.deletarPartidasGrupos(etapaId, arenaId);
        })(),
        (async () => {
          await this.grupos.deletarPorEtapa(etapaId, arenaId);
        })(),
        (async () => {
          await this.duplas.deletarPorEtapa(etapaId, arenaId);
        })(),
        (async () => {
          await this.deletarPartidasReiDaPraia(etapaId, arenaId);
        })(),
        (async () => {
          await this.deletarEstatisticas(etapaId, arenaId);
        })(),
        (async () => {
          await historicoDuplaService.limparDaEtapa(arenaId, etapaId);
        })(),
      ]);

      // Atualizar etapa
      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: false,
        dataGeracaoChaves: null,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Chaves excluídas", { etapaId, arenaId });
    } catch (error: any) {
      logger.error("Erro ao excluir chaves", { etapaId, arenaId }, error);
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
