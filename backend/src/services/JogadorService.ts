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
import { StatusInscricao } from "../models/Inscricao"; // ← ADICIONADO
import { Timestamp } from "firebase-admin/firestore";

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

      console.log(`✅ Jogador criado com sucesso:`, {
        id: docRef.id,
        nome: jogadorData.nome,
        genero: jogadorData.genero,
        arenaId: jogadorData.arenaId,
        nivel: jogadorData.nivel,
      });

      return {
        id: docRef.id,
        ...jogadorData,
      } as Jogador;
    } catch (error: any) {
      console.error("❌ Erro ao criar jogador:", error);

      // Se é erro de validação Zod, lançar direto
      if (error.name === "ZodError") {
        throw error;
      }

      // Se é erro de duplicação, lançar direto (preservar mensagem original)
      if (error.message && error.message.toLowerCase().includes("já existe")) {
        throw error;
      }

      // Outros erros
      console.error("❌ Erro desconhecido:", error.message || error);
      throw new Error("Falha ao criar jogador");
    }
  }

  /**
   * Buscar jogador por ID
   */
  async buscarPorId(id: string, arenaId: string): Promise<Jogador | null> {
    try {
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
    } catch (error) {
      console.error("Erro ao buscar jogador:", error);
      throw new Error("Falha ao buscar jogador");
    }
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
      console.error("Erro ao buscar jogador por nome:", error);
      return null;
    }
  }

  /**
   * Listar jogadores com filtros
   */
  async listar(filtros: FiltrosJogador): Promise<ListagemJogadores> {
    try {
      // Query MÍNIMA - apenas arenaId (SEM orderBy para evitar índice)
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

      // Paginação no client-side
      const limite = filtros.limite || 20;
      const offset = filtros.offset || 0;
      jogadores = jogadores.slice(offset, offset + limite);

      return {
        jogadores,
        total,
        limite,
        offset,
        temMais: offset + limite < total,
      };
    } catch (error) {
      console.error("Erro ao listar jogadores:", error);
      throw new Error("Falha ao listar jogadores");
    }
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

      return jogadorAtualizado;
    } catch (error: any) {
      console.error("Erro ao atualizar jogador:", error);
      if (
        error.message.includes("não encontrado") ||
        error.message.includes("já existe")
      ) {
        throw error;
      }
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

      // VALIDAÇÃO CRÍTICA: Verificar se jogador está inscrito em alguma etapa
      console.log(`🔍 Verificando inscrições do jogador ${id}...`);

      const inscricoesSnapshot = await db
        .collection("inscricoes")
        .where("arenaId", "==", arenaId)
        .where("jogadorId", "==", id)
        .where("status", "==", StatusInscricao.CONFIRMADA) // ← Usando enum
        .get();

      console.log(
        `📊 Total de inscrições confirmadas: ${inscricoesSnapshot.size}`
      );

      if (!inscricoesSnapshot.empty) {
        // Log das inscrições para debug
        inscricoesSnapshot.forEach((doc) => {
          const inscricao = doc.data();
          console.log(`⚠️ Inscrição encontrada:`, {
            id: doc.id,
            etapaId: inscricao.etapaId,
            status: inscricao.status,
          });
        });

        throw new Error(
          "Não é possível excluir este jogador pois ele está inscrito em uma ou mais etapas. " +
            "Cancele as inscrições primeiro."
        );
      }

      console.log(
        `✅ Nenhuma inscrição ativa encontrada. Deletando jogador...`
      );
      await db.collection(this.collection).doc(id).delete();
      console.log(`✅ Jogador ${id} deletado com sucesso`);
    } catch (error: any) {
      console.error("❌ Erro ao deletar jogador:", error);
      if (
        error.message.includes("não encontrado") ||
        error.message.includes("está inscrito")
      ) {
        throw error;
      }
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
      console.error("Erro ao contar jogadores:", error);
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
      console.error("Erro ao contar jogadores por nível:", error);
      return {
        [NivelJogador.INICIANTE]: 0,
        [NivelJogador.INTERMEDIARIO]: 0,
        [NivelJogador.AVANCADO]: 0,
      };
    }
  }
}

export default new JogadorService();
