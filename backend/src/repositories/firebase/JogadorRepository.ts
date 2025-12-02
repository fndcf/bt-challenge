/**
 * JogadorRepository.ts
 * Implementação Firebase do repository de Jogador
 */

import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  Jogador,
  CriarJogadorDTO,
  AtualizarJogadorDTO,
  FiltrosJogador,
  ListagemJogadores,
  NivelJogador,
  StatusJogador,
  GeneroJogador,
} from "../../models/Jogador";
import { IJogadorRepository } from "../interfaces/IJogadorRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

const COLLECTION = "jogadores";

/**
 * Repository de Jogador - Implementação Firebase
 */
export class JogadorRepository implements IJogadorRepository {
  private collection = db.collection(COLLECTION);

  /**
   * Criar novo jogador
   */
  async criar(
    data: CriarJogadorDTO & { arenaId: string; criadoPor: string }
  ): Promise<Jogador> {
    const agora = Timestamp.now();

    const jogadorData = {
      arenaId: data.arenaId,
      nome: data.nome.trim(),
      email: data.email?.trim().toLowerCase() || undefined,
      telefone: data.telefone?.trim() || undefined,
      dataNascimento: data.dataNascimento || undefined,
      genero: data.genero,
      nivel: data.nivel,
      status: data.status || StatusJogador.ATIVO,
      observacoes: data.observacoes?.trim() || undefined,
      vitorias: 0,
      derrotas: 0,
      pontos: 0,
      criadoEm: agora,
      atualizadoEm: agora,
      criadoPor: data.criadoPor,
    };

    const docRef = await this.collection.add(jogadorData);

    logger.info("Jogador criado", {
      jogadorId: docRef.id,
      nome: jogadorData.nome,
      arenaId: data.arenaId,
    });

    return {
      id: docRef.id,
      ...jogadorData,
    } as Jogador;
  }

  /**
   * Buscar jogador por ID
   */
  async buscarPorId(id: string): Promise<Jogador | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Jogador;
  }

  /**
   * Buscar jogador por ID com validação de arena
   */
  async buscarPorIdEArena(id: string, arenaId: string): Promise<Jogador | null> {
    const jogador = await this.buscarPorId(id);

    if (!jogador || jogador.arenaId !== arenaId) {
      return null;
    }

    return jogador;
  }

  /**
   * Buscar jogador por nome
   */
  async buscarPorNome(arenaId: string, nome: string): Promise<Jogador | null> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("nome", "==", nome.trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Jogador;
  }

  /**
   * Atualizar jogador
   */
  async atualizar(id: string, data: AtualizarJogadorDTO): Promise<Jogador> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Jogador não encontrado");
    }

    const updateData: any = {
      ...data,
      atualizadoEm: Timestamp.now(),
    };

    // Limpar valores undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Formatar campos
    if (updateData.nome) {
      updateData.nome = updateData.nome.trim();
    }
    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
    }
    if (updateData.telefone) {
      updateData.telefone = updateData.telefone.trim();
    }

    await docRef.update(updateData);

    const updated = await this.buscarPorId(id);
    if (!updated) {
      throw new NotFoundError("Jogador não encontrado após atualização");
    }

    logger.info("Jogador atualizado", {
      jogadorId: id,
      camposAtualizados: Object.keys(updateData).filter((k) => k !== "atualizadoEm"),
    });

    return updated;
  }

  /**
   * Deletar jogador
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Jogador não encontrado");
    }

    await this.collection.doc(id).delete();

    logger.info("Jogador deletado", { jogadorId: id });
  }

  /**
   * Verificar se jogador existe
   */
  async existe(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Listar jogadores com filtros e paginação
   */
  async listar(filtros: FiltrosJogador): Promise<ListagemJogadores> {
    // Query base - apenas arenaId para evitar índices complexos
    const snapshot = await this.collection
      .where("arenaId", "==", filtros.arenaId)
      .get();

    let jogadores = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Jogador[];

    // Aplicar filtros no client-side
    if (filtros.nivel) {
      jogadores = jogadores.filter((j) => j.nivel === filtros.nivel);
    }

    if (filtros.status) {
      jogadores = jogadores.filter((j) => j.status === filtros.status);
    }

    if (filtros.genero) {
      jogadores = jogadores.filter((j) => j.genero === filtros.genero);
    }

    // Busca por texto
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase().trim();
      jogadores = jogadores.filter(
        (j) =>
          j.nome.toLowerCase().includes(termo) ||
          j.email?.toLowerCase().includes(termo) ||
          j.telefone?.includes(termo)
      );
    }

    // Ordenação
    const ordenarPor = filtros.ordenarPor || "nome";
    const ordem = filtros.ordem || "asc";

    jogadores.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (ordenarPor) {
        case "nome":
          valorA = a.nome.toLowerCase();
          valorB = b.nome.toLowerCase();
          break;
        case "criadoEm":
          valorA = (a.criadoEm as Timestamp)?.seconds || 0;
          valorB = (b.criadoEm as Timestamp)?.seconds || 0;
          break;
        case "pontos":
          valorA = a.pontos || 0;
          valorB = b.pontos || 0;
          break;
        case "vitorias":
          valorA = a.vitorias || 0;
          valorB = b.vitorias || 0;
          break;
        default:
          valorA = a.nome.toLowerCase();
          valorB = b.nome.toLowerCase();
      }

      if (typeof valorA === "string") {
        return ordem === "desc"
          ? valorB.localeCompare(valorA)
          : valorA.localeCompare(valorB);
      }

      return ordem === "desc" ? valorB - valorA : valorA - valorB;
    });

    // Total após filtros
    const total = jogadores.length;

    // Paginação
    const limite = filtros.limite || total;
    const offset = filtros.offset || 0;
    jogadores = jogadores.slice(offset, offset + limite);

    return {
      jogadores,
      total,
      limite,
      offset,
      temMais: offset + limite < total,
    };
  }

  /**
   * Buscar jogadores por IDs
   */
  async buscarPorIds(ids: string[], arenaId: string): Promise<Jogador[]> {
    if (ids.length === 0) return [];

    // Firestore limita "in" a 30 elementos
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) {
      chunks.push(ids.slice(i, i + 30));
    }

    const jogadores: Jogador[] = [];

    for (const chunk of chunks) {
      const snapshot = await this.collection
        .where("arenaId", "==", arenaId)
        .where("__name__", "in", chunk)
        .get();

      snapshot.docs.forEach((doc) => {
        jogadores.push({
          id: doc.id,
          ...doc.data(),
        } as Jogador);
      });
    }

    return jogadores;
  }

  /**
   * Buscar jogadores por nível
   */
  async buscarPorNivel(arenaId: string, nivel: NivelJogador): Promise<Jogador[]> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("nivel", "==", nivel)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Jogador[];
  }

  /**
   * Buscar jogadores por status
   */
  async buscarPorStatus(arenaId: string, status: StatusJogador): Promise<Jogador[]> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("status", "==", status)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Jogador[];
  }

  /**
   * Buscar jogadores por gênero
   */
  async buscarPorGenero(arenaId: string, genero: GeneroJogador): Promise<Jogador[]> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("genero", "==", genero)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Jogador[];
  }

  /**
   * Buscar jogadores ativos
   */
  async buscarAtivos(arenaId: string): Promise<Jogador[]> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("status", "==", StatusJogador.ATIVO)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Jogador[];
  }

  /**
   * Atualizar estatísticas do jogador
   */
  async atualizarEstatisticas(
    id: string,
    estatisticas: {
      vitorias?: number;
      derrotas?: number;
      pontos?: number;
    }
  ): Promise<void> {
    const updateData: any = {
      ...estatisticas,
      atualizadoEm: Timestamp.now(),
    };

    // Remover undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await this.collection.doc(id).update(updateData);
  }

  /**
   * Incrementar vitórias
   */
  async incrementarVitorias(id: string): Promise<void> {
    const jogador = await this.buscarPorId(id);
    if (!jogador) {
      throw new NotFoundError("Jogador não encontrado");
    }

    await this.collection.doc(id).update({
      vitorias: (jogador.vitorias || 0) + 1,
      pontos: (jogador.pontos || 0) + 3,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Incrementar derrotas
   */
  async incrementarDerrotas(id: string): Promise<void> {
    const jogador = await this.buscarPorId(id);
    if (!jogador) {
      throw new NotFoundError("Jogador não encontrado");
    }

    await this.collection.doc(id).update({
      derrotas: (jogador.derrotas || 0) + 1,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Contar jogadores de uma arena
   */
  async contar(arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Contar jogadores por nível
   */
  async contarPorNivel(arenaId: string): Promise<Record<NivelJogador, number>> {
    const snapshot = await this.collection.where("arenaId", "==", arenaId).get();

    const contagem: Record<NivelJogador, number> = {
      [NivelJogador.INICIANTE]: 0,
      [NivelJogador.INTERMEDIARIO]: 0,
      [NivelJogador.AVANCADO]: 0,
    };

    snapshot.docs.forEach((doc) => {
      const nivel = doc.data().nivel as NivelJogador;
      if (nivel && contagem[nivel] !== undefined) {
        contagem[nivel]++;
      }
    });

    return contagem;
  }

  /**
   * Contar jogadores por gênero
   */
  async contarPorGenero(arenaId: string): Promise<Record<GeneroJogador, number>> {
    const snapshot = await this.collection.where("arenaId", "==", arenaId).get();

    const contagem: Record<GeneroJogador, number> = {
      [GeneroJogador.MASCULINO]: 0,
      [GeneroJogador.FEMININO]: 0,
    };

    snapshot.docs.forEach((doc) => {
      const genero = doc.data().genero as GeneroJogador;
      if (genero && contagem[genero] !== undefined) {
        contagem[genero]++;
      }
    });

    return contagem;
  }

  /**
   * Verificar se nome já existe na arena
   */
  async nomeExiste(arenaId: string, nome: string, excluirId?: string): Promise<boolean> {
    const jogador = await this.buscarPorNome(arenaId, nome);

    if (!jogador) {
      return false;
    }

    // Se estamos excluindo um ID (atualização), verificar se é o mesmo
    if (excluirId && jogador.id === excluirId) {
      return false;
    }

    return true;
  }
}

// Exportar instância única
export const jogadorRepository = new JogadorRepository();
