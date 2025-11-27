/**
 * JogadorService.ts
 * Service para gerenciar jogadores
 */

import { db } from "../config/firebase";
import {
  Jogador,
  CriarJogadorDTO,
  AtualizarJogadorDTO,
  FiltrosJogador,
  ListagemJogadores,
  NivelJogador,
  StatusJogador,
  CriarJogadorSchema,
  AtualizarJogadorSchema,
} from "../models/Jogador";
import { StatusInscricao } from "../models/Inscricao";
import { Timestamp } from "firebase-admin/firestore";
import logger from "../utils/logger";

/**
 * Service para gerenciar jogadores
 */
export class JogadorService {
  private collection = "jogadores";

  /**
   * Criar novo jogador
   */
  async criar(
    arenaId: string,
    adminUid: string,
    data: CriarJogadorDTO
  ): Promise<Jogador> {
    try {
      // Validar dados
      const dadosValidados = CriarJogadorSchema.parse(data);

      // Verificar se já existe jogador com mesmo nome na arena
      const jogadorExistente = await this.buscarPorNome(
        arenaId,
        dadosValidados.nome
      );
      if (jogadorExistente) {
        throw new Error("Já existe um jogador com este nome nesta arena");
      }

      const agora = Timestamp.now();

      const jogadorData = {
        arenaId,
        nome: dadosValidados.nome.trim(),
        email: dadosValidados.email?.trim().toLowerCase() || undefined,
        telefone: dadosValidados.telefone?.trim() || undefined,
        dataNascimento: dadosValidados.dataNascimento || undefined,
        genero: dadosValidados.genero,
        nivel: dadosValidados.nivel,
        status: dadosValidados.status || StatusJogador.ATIVO,
        observacoes: dadosValidados.observacoes?.trim() || undefined,
        vitorias: 0,
        derrotas: 0,
        pontos: 0,
        criadoEm: agora,
        atualizadoEm: agora,
        criadoPor: adminUid,
      };

      const docRef = await db.collection(this.collection).add(jogadorData);

      const novoJogador = {
        id: docRef.id,
        ...jogadorData,
      } as Jogador;

      logger.info("Jogador criado", {
        jogadorId: novoJogador.id,
        nome: novoJogador.nome,
        genero: novoJogador.genero,
        nivel: novoJogador.nivel,
        arenaId,
      });

      return novoJogador;
    } catch (error: any) {
      // Se é erro de validação Zod, lançar direto
      if (error.name === "ZodError") {
        throw error;
      }

      // Se é erro de duplicação, lançar direto
      if (error.message && error.message.toLowerCase().includes("já existe")) {
        throw error;
      }

      // Outros erros
      logger.error(
        "Erro ao criar jogador",
        {
          arenaId,
          nome: data.nome,
        },
        error
      );
      throw new Error("Falha ao criar jogador");
    }
  }

  /**
   * Buscar jogador por ID
   */
  async buscarPorId(id: string, arenaId: string): Promise<Jogador | null> {
    const doc = await db.collection(this.collection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    // Verificar se pertence à arena
    if (data?.arenaId !== arenaId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    } as Jogador;
  }

  /**
   * Buscar jogador por nome (case-insensitive)
   */
  private async buscarPorNome(
    arenaId: string,
    nome: string
  ): Promise<Jogador | null> {
    try {
      const snapshot = await db
        .collection(this.collection)
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
    } catch (error) {
      return null;
    }
  }

  /**
   * Listar jogadores com filtros
   */
  async listar(filtros: FiltrosJogador): Promise<ListagemJogadores> {
    // Query mínima - apenas arenaId (sem orderBy para evitar índice)
    const snapshot = await db
      .collection(this.collection)
      .where("arenaId", "==", filtros.arenaId)
      .get();

    let jogadores = snapshot.docs.map((doc: any) => ({
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

    // Aplicar busca por texto
    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase().trim();
      jogadores = jogadores.filter((jogador) => {
        return (
          jogador.nome.toLowerCase().includes(termoBusca) ||
          jogador.email?.toLowerCase().includes(termoBusca) ||
          jogador.telefone?.includes(termoBusca)
        );
      });
    }

    // Ordenar no client-side
    if (filtros.ordenarPor === "nome" || !filtros.ordenarPor) {
      jogadores.sort((a, b) => {
        const nomeA = a.nome.toLowerCase();
        const nomeB = b.nome.toLowerCase();
        return filtros.ordem === "desc"
          ? nomeB.localeCompare(nomeA)
          : nomeA.localeCompare(nomeB);
      });
    } else if (filtros.ordenarPor === "criadoEm") {
      jogadores.sort((a, b) => {
        const dataA = a.criadoEm?.seconds || 0;
        const dataB = b.criadoEm?.seconds || 0;
        return filtros.ordem === "desc" ? dataB - dataA : dataA - dataB;
      });
    }

    // Total após filtros
    const total = jogadores.length;

    // Paginação opcional
    let jogadoresPaginados = jogadores;
    let limite = total;
    let offset = 0;
    let temMais = false;

    if (filtros.limite && filtros.limite > 0) {
      limite = filtros.limite;
      offset = filtros.offset || 0;
      jogadoresPaginados = jogadores.slice(offset, offset + limite);
      temMais = offset + limite < total;
    }

    return {
      jogadores: jogadoresPaginados,
      total,
      limite,
      offset,
      temMais,
    };
  }

  /**
   * Atualizar jogador
   */
  async atualizar(
    id: string,
    arenaId: string,
    data: AtualizarJogadorDTO
  ): Promise<Jogador> {
    try {
      // Validar dados
      const dadosValidados = AtualizarJogadorSchema.parse(data);

      // Verificar se jogador existe
      const jogadorExistente = await this.buscarPorId(id, arenaId);
      if (!jogadorExistente) {
        throw new Error("Jogador não encontrado");
      }

      // Se alterou o nome, verificar se não existe outro com o mesmo nome
      if (
        dadosValidados.nome &&
        dadosValidados.nome !== jogadorExistente.nome
      ) {
        const outroJogador = await this.buscarPorNome(
          arenaId,
          dadosValidados.nome
        );
        if (outroJogador && outroJogador.id !== id) {
          throw new Error("Já existe outro jogador com este nome nesta arena");
        }
      }

      const dadosAtualizacao: any = {
        ...dadosValidados,
        atualizadoEm: Timestamp.now(),
      };

      // Limpar valores undefined
      Object.keys(dadosAtualizacao).forEach((key) => {
        if (dadosAtualizacao[key] === undefined) {
          delete dadosAtualizacao[key];
        }
      });

      await db.collection(this.collection).doc(id).update(dadosAtualizacao);

      // Buscar jogador atualizado
      const jogadorAtualizado = await this.buscarPorId(id, arenaId);
      if (!jogadorAtualizado) {
        throw new Error("Erro ao recuperar jogador atualizado");
      }

      logger.info("Jogador atualizado", {
        jogadorId: id,
        arenaId,
        camposAtualizados: Object.keys(dadosAtualizacao).filter(
          (k) => k !== "atualizadoEm"
        ),
      });

      return jogadorAtualizado;
    } catch (error: any) {
      if (
        error.message.includes("não encontrado") ||
        error.message.includes("já existe")
      ) {
        throw error;
      }
      logger.error(
        "Erro ao atualizar jogador",
        {
          jogadorId: id,
          arenaId,
        },
        error
      );
      throw new Error("Falha ao atualizar jogador");
    }
  }

  /**
   * Deletar jogador
   */
  async deletar(id: string, arenaId: string): Promise<void> {
    try {
      // Verificar se jogador existe
      const jogador = await this.buscarPorId(id, arenaId);
      if (!jogador) {
        throw new Error("Jogador não encontrado");
      }

      // Verificar se jogador está inscrito em alguma etapa
      const inscricoesSnapshot = await db
        .collection("inscricoes")
        .where("arenaId", "==", arenaId)
        .where("jogadorId", "==", id)
        .where("status", "==", StatusInscricao.CONFIRMADA)
        .get();

      if (!inscricoesSnapshot.empty) {
        throw new Error(
          "Não é possível excluir este jogador pois ele está inscrito em uma ou mais etapas. " +
            "Cancele as inscrições primeiro."
        );
      }

      await db.collection(this.collection).doc(id).delete();

      logger.info("Jogador deletado", {
        jogadorId: id,
        nome: jogador.nome,
        arenaId,
        inscricoesVerificadas: inscricoesSnapshot.size,
      });
    } catch (error: any) {
      if (
        error.message.includes("não encontrado") ||
        error.message.includes("está inscrito")
      ) {
        throw error;
      }
      logger.error(
        "Erro ao deletar jogador",
        {
          jogadorId: id,
          arenaId,
        },
        error
      );
      throw new Error("Falha ao deletar jogador");
    }
  }

  /**
   * Contar jogadores de uma arena
   */
  async contar(arenaId: string): Promise<number> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Contar jogadores por nível
   */
  async contarPorNivel(arenaId: string): Promise<Record<NivelJogador, number>> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .get();

      const contagem: Record<string, number> = {
        [NivelJogador.INICIANTE]: 0,
        [NivelJogador.INTERMEDIARIO]: 0,
        [NivelJogador.AVANCADO]: 0,
      };

      snapshot.forEach((doc) => {
        const nivel = doc.data().nivel;
        if (nivel && contagem[nivel] !== undefined) {
          contagem[nivel]++;
        }
      });

      return contagem as Record<NivelJogador, number>;
    } catch (error) {
      return {
        [NivelJogador.INICIANTE]: 0,
        [NivelJogador.INTERMEDIARIO]: 0,
        [NivelJogador.AVANCADO]: 0,
      };
    }
  }
}

export default new JogadorService();
