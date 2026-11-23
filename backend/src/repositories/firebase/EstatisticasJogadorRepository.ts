/**
 * Implementação Firebase do repository de EstatisticasJogador
 */

import { FieldValue, Query, Timestamp } from "firebase-admin/firestore";
import { db } from "../../config/firebase";
import {
  CriarEstatisticasJogadorDTO,
  EstatisticasJogador,
} from "../../models/EstatisticasJogador";
import { IncrementosDaPartida } from "../../utils/estatisticas";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";
import {
  AtualizarPontuacaoEmLoteDTO,
  IEstatisticasJogadorRepository,
} from "../interfaces/IEstatisticasJogadorRepository";

// Limite de gravações por lote e de valores no "in" do Firestore
const TAMANHO_LOTE = 500;
const TAMANHO_IN = 30;

const dividir = <T>(itens: T[], tamanho: number): T[][] => {
  const partes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    partes.push(itens.slice(i, i + tamanho));
  }
  return partes;
};

/**
 * Implementação Firebase do repository de EstatisticasJogador
 */
export class EstatisticasJogadorRepository
  implements IEstatisticasJogadorRepository
{
  private collection = db.collection("estatisticas_jogador");

  private async listar(consulta: Query): Promise<EstatisticasJogador[]> {
    const snapshot = await consulta.get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as EstatisticasJogador
    );
  }

  /**
   * Dados gravados de uma estatística nova
   */
  private montarNova(
    dto: CriarEstatisticasJogadorDTO,
    agora: Timestamp
  ): Omit<EstatisticasJogador, "id"> {
    return {
      etapaId: dto.etapaId,
      arenaId: dto.arenaId,
      jogadorId: dto.jogadorId,
      jogadorNome: dto.jogadorNome,
      jogadorNivel: dto.jogadorNivel,
      jogadorGenero: dto.jogadorGenero,
      grupoId: dto.grupoId,
      grupoNome: dto.grupoNome,
      // Classificação do grupo
      jogosGrupo: 0,
      vitoriasGrupo: 0,
      derrotasGrupo: 0,
      pontosGrupo: 0,
      setsVencidosGrupo: 0,
      setsPerdidosGrupo: 0,
      saldoSetsGrupo: 0,
      gamesVencidosGrupo: 0,
      gamesPerdidosGrupo: 0,
      saldoGamesGrupo: 0,
      // Totais da etapa
      jogos: 0,
      vitorias: 0,
      derrotas: 0,
      pontos: 0,
      setsVencidos: 0,
      setsPerdidos: 0,
      gamesVencidos: 0,
      gamesPerdidos: 0,
      saldoSets: 0,
      saldoGames: 0,
      classificado: false,
      criadoEm: agora,
      atualizadoEm: agora,
    };
  }

  /**
   * Criar estatísticas zeradas
   */
  async criar(dto: CriarEstatisticasJogadorDTO): Promise<EstatisticasJogador> {
    const nova = this.montarNova(dto, Timestamp.now());
    const docRef = await this.collection.add(nova);

    return { id: docRef.id, ...nova };
  }

  /**
   * Criar estatísticas zeradas de vários jogadores
   */
  async criarEmLote(
    dtos: CriarEstatisticasJogadorDTO[]
  ): Promise<EstatisticasJogador[]> {
    const agora = Timestamp.now();
    const criadas: EstatisticasJogador[] = [];

    for (const parte of dividir(dtos, TAMANHO_LOTE)) {
      const batch = db.batch();

      for (const dto of parte) {
        const docRef = this.collection.doc();
        const nova = this.montarNova(dto, agora);
        batch.set(docRef, nova);
        criadas.push({ id: docRef.id, ...nova });
      }

      await batch.commit();
    }

    return criadas;
  }

  /**
   * Buscar estatísticas por etapa
   */
  async buscarPorEtapa(
    etapaId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]> {
    return this.listar(
      this.collection
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
    );
  }

  /**
   * Buscar estatísticas da arena, de um nível ou de todos
   */
  async buscarPorArena(
    arenaId: string,
    nivel?: string
  ): Promise<EstatisticasJogador[]> {
    const daArena = this.collection.where("arenaId", "==", arenaId);

    return this.listar(
      nivel ? daArena.where("jogadorNivel", "==", nivel) : daArena
    );
  }

  /**
   * Buscar estatísticas de um jogador em uma etapa
   */
  async buscarPorJogadorEEtapa(
    jogadorId: string,
    etapaId: string
  ): Promise<EstatisticasJogador | null> {
    const [estatistica] = await this.listar(
      this.collection
        .where("jogadorId", "==", jogadorId)
        .where("etapaId", "==", etapaId)
        .limit(1)
    );

    return estatistica ?? null;
  }

  /**
   * Buscar estatísticas de vários jogadores em uma etapa
   */
  async buscarPorJogadoresDaEtapa(
    jogadorIds: string[],
    etapaId: string
  ): Promise<EstatisticasJogador[]> {
    const partes = await Promise.all(
      dividir(jogadorIds, TAMANHO_IN).map((ids) =>
        this.listar(
          this.collection
            .where("etapaId", "==", etapaId)
            .where("jogadorId", "in", ids)
        )
      )
    );

    return partes.flat();
  }

  /**
   * Buscar todas as estatísticas de um jogador na arena
   */
  async buscarPorJogador(
    jogadorId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]> {
    return this.listar(
      this.collection
        .where("jogadorId", "==", jogadorId)
        .where("arenaId", "==", arenaId)
    );
  }

  /**
   * Buscar estatísticas por grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<EstatisticasJogador[]> {
    return this.listar(this.collection.where("grupoId", "==", grupoId));
  }

  /**
   * Buscar estatísticas por grupo ordenadas por posição
   */
  async buscarPorGrupoOrdenado(
    grupoId: string
  ): Promise<EstatisticasJogador[]> {
    const estatisticas = await this.buscarPorGrupo(grupoId);

    // Ordenar no client-side para evitar índice composto
    return estatisticas.sort(
      (a, b) => (a.posicaoGrupo || 999) - (b.posicaoGrupo || 999)
    );
  }

  /**
   * Buscar os primeiros colocados de um grupo
   */
  async buscarClassificados(
    grupoId: string,
    limite: number
  ): Promise<EstatisticasJogador[]> {
    return this.listar(
      this.collection
        .where("grupoId", "==", grupoId)
        .orderBy("posicaoGrupo", "asc")
        .limit(limite)
    );
  }

  /**
   * Atualizar estatísticas
   */
  async atualizar(
    id: string,
    dados: Partial<EstatisticasJogador>
  ): Promise<EstatisticasJogador> {
    const docRef = this.collection.doc(id);

    if (!(await docRef.get()).exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    await docRef.update({ ...dados, atualizadoEm: Timestamp.now() });

    const atualizado = await docRef.get();
    return { id, ...atualizado.data() } as EstatisticasJogador;
  }

  /** Grava em lotes, com a data de atualização */
  private async gravarEmLote<T>(
    itens: T[],
    paraGravacao: (item: T) => { id: string; dados: object }
  ): Promise<void> {
    const atualizadoEm = Timestamp.now();

    for (const parte of dividir(itens, TAMANHO_LOTE)) {
      const batch = db.batch();

      parte.map(paraGravacao).forEach(({ id, dados }) => {
        batch.update(this.collection.doc(id), { ...dados, atualizadoEm });
      });

      await batch.commit();
    }
  }

  /**
   * Atualizar vários registros
   */
  async atualizarEmLote(
    itens: { id: string; dados: Partial<EstatisticasJogador> }[]
  ): Promise<void> {
    await this.gravarEmLote(itens, (item) => item);
  }

  /**
   * Somar valores em vários registros (soma feita pelo banco)
   */
  async incrementarEmLote(
    itens: { id: string; incrementos: IncrementosDaPartida }[]
  ): Promise<void> {
    await this.gravarEmLote(itens, ({ id, incrementos }) => ({
      id,
      dados: Object.fromEntries(
        Object.entries(incrementos).map(([campo, valor]) => [
          campo,
          FieldValue.increment(valor),
        ])
      ),
    }));
  }

  /**
   * Atualizar pontuação em lote
   */
  async atualizarPontuacaoEmLote(
    items: AtualizarPontuacaoEmLoteDTO[]
  ): Promise<void> {
    await this.gravarEmLote(items, ({ estatisticaId, pontos, colocacao }) => ({
      id: estatisticaId,
      dados: { pontos, colocacao },
    }));

    logger.info("Pontuações atualizadas em lote", { quantidade: items.length });
  }

  /**
   * Deletar estatísticas
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    await this.collection.doc(id).delete();

    logger.info("Estatísticas deletadas", { id });
  }

  /**
   * Deletar todas as estatísticas de uma etapa
   */
  async deletarPorEtapa(etapaId: string, arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logger.info("Estatísticas deletadas por etapa", {
      etapaId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }
}

// Instância singleton
export const estatisticasJogadorRepository =
  new EstatisticasJogadorRepository();
