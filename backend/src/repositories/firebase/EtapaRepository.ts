/**
 * Implementação Firebase do repository de Etapa
 */

import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  Etapa,
  CriarEtapaDTO,
  AtualizarEtapaDTO,
  FiltrosEtapa,
  ListagemEtapas,
  StatusEtapa,
  FaseEtapa,
  FormatoEtapa,
  EstatisticasEtapa,
} from "../../models/Etapa";
import { IEtapaRepository } from "../interfaces/IEtapaRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

const COLLECTION = "etapas";

/**
 * Repository de Etapa - Implementação Firebase
 */
export class EtapaRepository implements IEtapaRepository {
  private collection = db.collection(COLLECTION);

  /**
   * Criar nova etapa
   */
  async criar(
    data: CriarEtapaDTO & { arenaId: string; criadoPor: string }
  ): Promise<Etapa> {
    const agora = Timestamp.now();

    // Log para debug - verificar valor recebido
    console.log("[EtapaRepository] contaPontosRanking recebido:", data.contaPontosRanking, "tipo:", typeof data.contaPontosRanking);

    const etapaData = {
      arenaId: data.arenaId,
      nome: data.nome,
      descricao: data.descricao || "",
      nivel: data.nivel,
      genero: data.genero,
      formato: data.formato || FormatoEtapa.DUPLA_FIXA,
      tipoChaveamento: data.tipoChaveamento,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      dataRealizacao: data.dataRealizacao,
      local: data.local || "",
      maxJogadores: data.maxJogadores,
      jogadoresPorGrupo: data.jogadoresPorGrupo,
      qtdGrupos: Math.ceil(data.maxJogadores / 2 / data.jogadoresPorGrupo),
      status: StatusEtapa.INSCRICOES_ABERTAS,
      faseAtual: FaseEtapa.GRUPOS,
      totalInscritos: 0,
      jogadoresInscritos: [],
      chavesGeradas: false,
      contaPontosRanking: data.contaPontosRanking ?? true, // Por padrão conta pontos
      criadoEm: agora,
      atualizadoEm: agora,
      criadoPor: data.criadoPor,
    };

    // Log para debug - verificar valor final
    console.log("[EtapaRepository] contaPontosRanking final:", etapaData.contaPontosRanking);

    const docRef = await this.collection.add(etapaData);

    return {
      id: docRef.id,
      ...etapaData,
    } as Etapa;
  }

  /**
   * Buscar etapa por ID
   */
  async buscarPorId(id: string): Promise<Etapa | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Etapa;
  }

  /**
   * Buscar etapa por ID com validação de arena
   */
  async buscarPorIdEArena(id: string, arenaId: string): Promise<Etapa | null> {
    const etapa = await this.buscarPorId(id);

    if (!etapa || etapa.arenaId !== arenaId) {
      return null;
    }

    return etapa;
  }

  /**
   * Atualizar etapa
   */
  async atualizar(id: string, data: AtualizarEtapaDTO): Promise<Etapa> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Etapa não encontrada");
    }

    const updateData: any = {
      ...data,
      atualizadoEm: Timestamp.now(),
    };

    // Remover undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await docRef.update(updateData);

    const updated = await this.buscarPorId(id);
    if (!updated) {
      throw new NotFoundError("Etapa não encontrada após atualização");
    }

    return updated;
  }

  /**
   * Deletar etapa
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Etapa não encontrada");
    }

    await this.collection.doc(id).delete();
  }

  /**
   * Verificar se etapa existe
   */
  async existe(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Listar etapas com filtros e paginação
   * NOTA: Ordenação feita no client-side para evitar índices compostos
   */
  async listar(filtros: FiltrosEtapa): Promise<ListagemEtapas> {
    // Query base - apenas arenaId (sem orderBy para evitar índice composto)
    const snapshot = await this.collection
      .where("arenaId", "==", filtros.arenaId)
      .get();

    let etapas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Etapa[];

    // Filtros no client-side
    if (filtros.status) {
      etapas = etapas.filter((e) => e.status === filtros.status);
    }

    if (filtros.nivel) {
      etapas = etapas.filter((e) => e.nivel === filtros.nivel);
    }

    if (filtros.genero) {
      etapas = etapas.filter((e) => e.genero === filtros.genero);
    }

    if (filtros.formato) {
      etapas = etapas.filter((e) => e.formato === filtros.formato);
    }

    // Ordenação no client-side
    const ordenarPor = (filtros.ordenarPor || "dataRealizacao") as string;
    const ordem = filtros.ordem || "desc";

    etapas.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (ordenarPor) {
        case "dataRealizacao":
          valorA = (a.dataRealizacao as Timestamp)?.seconds || 0;
          valorB = (b.dataRealizacao as Timestamp)?.seconds || 0;
          break;
        case "criadoEm":
          valorA = (a.criadoEm as Timestamp)?.seconds || 0;
          valorB = (b.criadoEm as Timestamp)?.seconds || 0;
          break;
        case "nome":
          valorA = a.nome?.toLowerCase() || "";
          valorB = b.nome?.toLowerCase() || "";
          break;
        case "totalInscritos":
          valorA = a.totalInscritos || 0;
          valorB = b.totalInscritos || 0;
          break;
        default:
          valorA = (a.dataRealizacao as Timestamp)?.seconds || 0;
          valorB = (b.dataRealizacao as Timestamp)?.seconds || 0;
      }

      if (typeof valorA === "string") {
        return ordem === "desc"
          ? valorB.localeCompare(valorA)
          : valorA.localeCompare(valorB);
      }

      return ordem === "desc" ? valorB - valorA : valorA - valorB;
    });

    // Total após filtros
    const total = etapas.length;

    // Paginação
    const limite = filtros.limite || total;
    const offset = filtros.offset || 0;
    etapas = etapas.slice(offset, offset + limite);

    return {
      etapas,
      total,
      limite,
      offset,
      temMais: offset + limite < total,
    };
  }

  /**
   * Buscar etapas por status
   * NOTA: Ordenação feita no client-side para evitar índices compostos
   */
  async buscarPorStatus(
    arenaId: string,
    status: StatusEtapa
  ): Promise<Etapa[]> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("status", "==", status)
      .get();

    const etapas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Etapa[];

    // Ordenar no client-side
    etapas.sort((a, b) => {
      const dataA = (a.dataRealizacao as Timestamp)?.seconds || 0;
      const dataB = (b.dataRealizacao as Timestamp)?.seconds || 0;
      return dataB - dataA; // desc
    });

    return etapas;
  }

  /**
   * Buscar etapas ativas (não finalizadas)
   */
  async buscarAtivas(arenaId: string): Promise<Etapa[]> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("status", "!=", StatusEtapa.FINALIZADA)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Etapa[];
  }

  /**
   * Atualizar status da etapa
   */
  async atualizarStatus(id: string, status: StatusEtapa): Promise<Etapa> {
    const updateData: any = {
      status,
      atualizadoEm: Timestamp.now(),
    };

    if (status === StatusEtapa.FINALIZADA) {
      updateData.finalizadoEm = Timestamp.now();
    }

    await this.collection.doc(id).update(updateData);

    const updated = await this.buscarPorId(id);
    if (!updated) {
      throw new NotFoundError("Etapa não encontrada");
    }

    logger.info("Status da etapa atualizado", { etapaId: id, status });

    return updated;
  }

  /**
   * Marcar chaves como geradas
   */
  async marcarChavesGeradas(id: string, geradas: boolean): Promise<void> {
    const updateData: any = {
      chavesGeradas: geradas,
      atualizadoEm: Timestamp.now(),
    };

    if (geradas) {
      updateData.dataGeracaoChaves = Timestamp.now();
      updateData.status = StatusEtapa.CHAVES_GERADAS;
    }

    await this.collection.doc(id).update(updateData);

    logger.info("Chaves da etapa marcadas", { etapaId: id, geradas });
  }

  /**
   * Incrementar total de inscritos
   */
  async incrementarInscritos(id: string, jogadorId: string): Promise<void> {
    const etapa = await this.buscarPorId(id);
    if (!etapa) {
      throw new NotFoundError("Etapa não encontrada");
    }

    const jogadoresInscritos = [...etapa.jogadoresInscritos, jogadorId];

    await this.collection.doc(id).update({
      jogadoresInscritos,
      totalInscritos: jogadoresInscritos.length,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Decrementar total de inscritos
   */
  async decrementarInscritos(id: string, jogadorId: string): Promise<void> {
    const etapa = await this.buscarPorId(id);
    if (!etapa) {
      throw new NotFoundError("Etapa não encontrada");
    }

    const jogadoresInscritos = etapa.jogadoresInscritos.filter(
      (j) => j !== jogadorId
    );

    await this.collection.doc(id).update({
      jogadoresInscritos,
      totalInscritos: jogadoresInscritos.length,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Definir campeão da etapa
   */
  async definirCampeao(
    id: string,
    campeaoId: string,
    campeaoNome: string
  ): Promise<void> {
    await this.collection.doc(id).update({
      campeaoId,
      campeaoNome,
      status: StatusEtapa.FINALIZADA,
      dataEncerramentoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    });

    logger.info("Campeão definido", { etapaId: id, campeaoId, campeaoNome });
  }

  /**
   * Obter estatísticas das etapas
   */
  async obterEstatisticas(arenaId: string): Promise<EstatisticasEtapa> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .get();

    const estatisticas: EstatisticasEtapa = {
      totalEtapas: 0,
      inscricoesAbertas: 0,
      emAndamento: 0,
      finalizadas: 0,
      totalParticipacoes: 0,
    };

    snapshot.docs.forEach((doc) => {
      const etapa = doc.data() as Etapa;
      estatisticas.totalEtapas++;
      estatisticas.totalParticipacoes += etapa.totalInscritos || 0;

      switch (etapa.status) {
        case StatusEtapa.INSCRICOES_ABERTAS:
          estatisticas.inscricoesAbertas++;
          break;
        case StatusEtapa.EM_ANDAMENTO:
        case StatusEtapa.CHAVES_GERADAS:
        case StatusEtapa.FASE_ELIMINATORIA:
          estatisticas.emAndamento++;
          break;
        case StatusEtapa.FINALIZADA:
          estatisticas.finalizadas++;
          break;
      }
    });

    return estatisticas;
  }

  /**
   * Contar etapas de uma arena
   */
  async contar(arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Verificar se jogador está inscrito
   */
  async jogadorInscrito(id: string, jogadorId: string): Promise<boolean> {
    const etapa = await this.buscarPorId(id);
    if (!etapa) {
      return false;
    }

    return etapa.jogadoresInscritos.includes(jogadorId);
  }
}

// Exportar instância única
export const etapaRepository = new EtapaRepository();
