import { db } from "../config/firebase";
import {
  Etapa,
  CriarEtapaDTO,
  AtualizarEtapaDTO,
  InscreverJogadorDTO,
  FiltrosEtapa,
  ListagemEtapas,
  StatusEtapa,
  FaseEtapa,
  EstatisticasEtapa,
  CriarEtapaSchema,
  AtualizarEtapaSchema,
  InscreverJogadorSchema,
} from "../models/Etapa";
import { Inscricao, StatusInscricao } from "../models/Inscricao";
import { Timestamp } from "firebase-admin/firestore";
import jogadorService from "./JogadorService";
import { Dupla } from "../models/Dupla";

/**
 * Service para gerenciar etapas
 */
export class EtapaService {
  private collectionEtapas = "etapas";
  private collectionInscricoes = "inscricoes";

  /**
   * Criar nova etapa
   */
  async criar(
    arenaId: string,
    adminUid: string,
    data: CriarEtapaDTO
  ): Promise<Etapa> {
    try {
      // Validar dados
      const dadosValidados = CriarEtapaSchema.parse(data);

      // Validar datas
      const dataInicio = new Date(dadosValidados.dataInicio);
      const dataFim = new Date(dadosValidados.dataFim);
      const dataRealizacao = new Date(dadosValidados.dataRealizacao);

      if (dataFim <= dataInicio) {
        throw new Error("Data fim deve ser posterior à data início");
      }

      if (dataRealizacao <= dataFim) {
        throw new Error(
          "Data de realização deve ser posterior ao fim das inscrições"
        );
      }

      // Validar maxJogadores (deve ser par)
      if (dadosValidados.maxJogadores % 2 !== 0) {
        throw new Error("Número máximo de jogadores deve ser par");
      }

      const agora = Timestamp.now();

      // Calcular quantidade de grupos
      const totalDuplas = dadosValidados.maxJogadores / 2;
      const qtdGrupos = Math.ceil(
        totalDuplas / dadosValidados.jogadoresPorGrupo
      );

      const etapaData = {
        arenaId,
        nome: dadosValidados.nome.trim(),
        descricao: dadosValidados.descricao?.trim() || undefined,
        nivel: dadosValidados.nivel, // ← ADICIONADO
        genero: dadosValidados.genero,
        dataInicio: Timestamp.fromDate(dataInicio),
        dataFim: Timestamp.fromDate(dataFim),
        dataRealizacao: Timestamp.fromDate(dataRealizacao),
        local: dadosValidados.local?.trim() || undefined,
        maxJogadores: dadosValidados.maxJogadores,
        jogadoresPorGrupo: dadosValidados.jogadoresPorGrupo,
        qtdGrupos,
        status: StatusEtapa.INSCRICOES_ABERTAS,
        faseAtual: FaseEtapa.GRUPOS,
        totalInscritos: 0,
        jogadoresInscritos: [],
        chavesGeradas: false,
        dataGeracaoChaves: undefined,
        criadoEm: agora,
        atualizadoEm: agora,
        criadoPor: adminUid,
        finalizadoEm: undefined,
      };

      const docRef = await db.collection(this.collectionEtapas).add(etapaData);

      return {
        id: docRef.id,
        ...etapaData,
      } as Etapa;
    } catch (error: any) {
      console.error("Erro ao criar etapa:", error);
      throw error;
    }
  }

  /**
   * Buscar etapa por ID
   */
  async buscarPorId(id: string, arenaId: string): Promise<Etapa | null> {
    try {
      const doc = await db.collection(this.collectionEtapas).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();

      if (data?.arenaId !== arenaId) {
        return null;
      }

      return {
        id: doc.id,
        ...data,
      } as Etapa;
    } catch (error) {
      console.error("Erro ao buscar etapa:", error);
      throw new Error("Falha ao buscar etapa");
    }
  }

  /**
   * Inscrever jogador na etapa
   */
  async inscreverJogador(
    etapaId: string,
    arenaId: string,
    data: InscreverJogadorDTO
  ): Promise<Inscricao> {
    try {
      const dadosValidados = InscreverJogadorSchema.parse(data);

      // Buscar etapa
      const etapa = await this.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      // Verificar se inscrições estão abertas
      if (etapa.status !== StatusEtapa.INSCRICOES_ABERTAS) {
        throw new Error("Inscrições não estão abertas para esta etapa");
      }

      // Verificar se atingiu limite
      if (etapa.totalInscritos >= etapa.maxJogadores) {
        throw new Error("Etapa atingiu o número máximo de jogadores");
      }

      // Verificar se jogador existe
      const jogador = await jogadorService.buscarPorId(
        dadosValidados.jogadorId,
        arenaId
      );
      if (!jogador) {
        throw new Error("Jogador não encontrado");
      }

      // VALIDAÇÃO CRÍTICA: Verificar se o nível do jogador é compatível com a etapa
      if (jogador.nivel !== etapa.nivel) {
        throw new Error(
          `Este jogador não pode se inscrever nesta etapa. ` +
            `Etapa para jogadores ${etapa.nivel}, jogador é ${jogador.nivel}`
        );
      }

      // ✅ NOVA VALIDAÇÃO: GÊNERO
      if (jogador.genero !== etapa.genero) {
        throw new Error(
          `Este jogador não pode se inscrever nesta etapa. ` +
            `Etapa ${etapa.genero}, jogador é ${jogador.genero}`
        );
      }

      // Verificar se jogador já está inscrito
      if (etapa.jogadoresInscritos.includes(dadosValidados.jogadorId)) {
        throw new Error("Jogador já está inscrito nesta etapa");
      }

      const agora = Timestamp.now();

      // Criar inscrição
      const inscricaoData = {
        etapaId,
        arenaId,
        jogadorId: dadosValidados.jogadorId,
        jogadorNome: jogador.nome,
        jogadorNivel: jogador.nivel,
        jogadorGenero: jogador.genero,
        status: StatusInscricao.CONFIRMADA,
        duplaId: undefined,
        parceiroId: undefined,
        parceiroNome: undefined,
        grupoId: undefined,
        grupoNome: undefined,
        criadoEm: agora,
        atualizadoEm: agora,
        canceladoEm: undefined,
      };

      const inscricaoRef = await db
        .collection(this.collectionInscricoes)
        .add(inscricaoData);

      // Atualizar etapa
      await db
        .collection(this.collectionEtapas)
        .doc(etapaId)
        .update({
          totalInscritos: etapa.totalInscritos + 1,
          jogadoresInscritos: [
            ...etapa.jogadoresInscritos,
            dadosValidados.jogadorId,
          ],
          atualizadoEm: agora,
        });

      return {
        id: inscricaoRef.id,
        ...inscricaoData,
      } as Inscricao;
    } catch (error: any) {
      console.error("Erro ao inscrever jogador:", error);
      throw error;
    }
  }

  /**
   * Cancelar inscrição
   */
  async cancelarInscricao(
    inscricaoId: string,
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    try {
      console.log(
        `🔄 Cancelando inscrição ${inscricaoId} da etapa ${etapaId}...`
      );

      // Buscar inscrição
      const inscricaoDoc = await db
        .collection(this.collectionInscricoes)
        .doc(inscricaoId)
        .get();

      if (!inscricaoDoc.exists) {
        throw new Error("Inscrição não encontrada");
      }

      const inscricao = inscricaoDoc.data() as Inscricao;
      console.log(`📋 Inscrição atual:`, {
        id: inscricaoDoc.id,
        jogadorId: inscricao.jogadorId,
        jogadorNome: inscricao.jogadorNome,
        status: inscricao.status,
      });

      if (inscricao.arenaId !== arenaId || inscricao.etapaId !== etapaId) {
        throw new Error("Inscrição não encontrada");
      }

      // Buscar etapa
      const etapa = await this.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      // Verificar se chaves já foram geradas
      if (etapa.chavesGeradas) {
        throw new Error(
          "Não é possível cancelar inscrição após geração de chaves"
        );
      }

      const agora = Timestamp.now();

      // Cancelar inscrição
      console.log(`💾 Atualizando status para CANCELADA...`);
      await db.collection(this.collectionInscricoes).doc(inscricaoId).update({
        status: StatusInscricao.CANCELADA,
        canceladoEm: agora,
        atualizadoEm: agora,
      });
      console.log(`✅ Status atualizado para CANCELADA`);

      // Atualizar etapa
      const jogadoresAtualizados = etapa.jogadoresInscritos.filter(
        (id) => id !== inscricao.jogadorId
      );

      console.log(`📊 Atualizando contadores da etapa...`);
      await db
        .collection(this.collectionEtapas)
        .doc(etapaId)
        .update({
          totalInscritos: etapa.totalInscritos - 1,
          jogadoresInscritos: jogadoresAtualizados,
          atualizadoEm: agora,
        });
      console.log(`✅ Inscrição cancelada com sucesso!`);
    } catch (error: any) {
      console.error("❌ Erro ao cancelar inscrição:", error);
      throw error;
    }
  }

  /**
   * Listar inscrições de uma etapa
   */
  async listarInscricoes(
    etapaId: string,
    arenaId: string
  ): Promise<Inscricao[]> {
    try {
      const snapshot = await db
        .collection(this.collectionInscricoes)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("status", "==", StatusInscricao.CONFIRMADA)
        .get();

      const inscricoes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Inscricao[];

      return inscricoes;
    } catch (error) {
      console.error("Erro ao listar inscrições:", error);
      throw new Error("Falha ao listar inscrições");
    }
  }

  /**
   * Listar etapas com filtros
   */
  async listar(filtros: FiltrosEtapa): Promise<ListagemEtapas> {
    try {
      const snapshot = await db
        .collection(this.collectionEtapas)
        .where("arenaId", "==", filtros.arenaId)
        .get();

      let etapas = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Etapa[];

      // Filtros client-side
      if (filtros.status) {
        etapas = etapas.filter((e) => e.status === filtros.status);
      }

      // Ordenar
      if (filtros.ordenarPor === "dataRealizacao") {
        etapas.sort((a, b) => {
          const dataA = (a.dataRealizacao as Timestamp).toDate().getTime();
          const dataB = (b.dataRealizacao as Timestamp).toDate().getTime();
          return filtros.ordem === "desc" ? dataB - dataA : dataA - dataB;
        });
      } else {
        etapas.sort((a, b) => {
          const dataA = (a.criadoEm as Timestamp).toDate().getTime();
          const dataB = (b.criadoEm as Timestamp).toDate().getTime();
          return filtros.ordem === "desc" ? dataB - dataA : dataA - dataB;
        });
      }

      const total = etapas.length;
      const limite = filtros.limite || 20;
      const offset = filtros.offset || 0;
      etapas = etapas.slice(offset, offset + limite);

      return {
        etapas,
        total,
        limite,
        offset,
        temMais: offset + limite < total,
      };
    } catch (error) {
      console.error("Erro ao listar etapas:", error);
      throw new Error("Falha ao listar etapas");
    }
  }

  /**
   * Atualizar etapa
   */
  async atualizar(
    id: string,
    arenaId: string,
    data: AtualizarEtapaDTO
  ): Promise<Etapa> {
    try {
      const dadosValidados = AtualizarEtapaSchema.parse(data);

      const etapa = await this.buscarPorId(id, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      // VALIDAÇÕES: Não pode editar certas coisas após ter inscritos ou chaves geradas
      if (etapa.chavesGeradas) {
        throw new Error("Não é possível editar etapa após geração de chaves");
      }

      if (etapa.totalInscritos > 0) {
        // Se tem inscritos, não pode mudar o nível
        if (dadosValidados.nivel && dadosValidados.nivel !== etapa.nivel) {
          throw new Error(
            "Não é possível alterar o nível da etapa após ter inscritos"
          );
        }

        // ✅ NOVA VALIDAÇÃO: Não pode mudar gênero
        if (dadosValidados.genero && dadosValidados.genero !== etapa.genero) {
          throw new Error(
            "Não é possível alterar o gênero da etapa após ter inscritos"
          );
        }

        // Se tem inscritos, não pode diminuir maxJogadores
        if (
          dadosValidados.maxJogadores &&
          dadosValidados.maxJogadores < etapa.totalInscritos
        ) {
          throw new Error(
            `Não é possível diminuir o máximo de jogadores para ${dadosValidados.maxJogadores}. ` +
              `Já existem ${etapa.totalInscritos} jogadores inscritos.`
          );
        }
      }

      const dadosAtualizacao: any = {
        ...dadosValidados,
        atualizadoEm: Timestamp.now(),
      };

      // Converter datas se fornecidas
      if (dadosValidados.dataInicio) {
        dadosAtualizacao.dataInicio = Timestamp.fromDate(
          new Date(dadosValidados.dataInicio)
        );
      }
      if (dadosValidados.dataFim) {
        dadosAtualizacao.dataFim = Timestamp.fromDate(
          new Date(dadosValidados.dataFim)
        );
      }
      if (dadosValidados.dataRealizacao) {
        dadosAtualizacao.dataRealizacao = Timestamp.fromDate(
          new Date(dadosValidados.dataRealizacao)
        );
      }

      // Limpar valores undefined
      Object.keys(dadosAtualizacao).forEach((key) => {
        if (dadosAtualizacao[key] === undefined) {
          delete dadosAtualizacao[key];
        }
      });

      console.log(`✏️ Atualizando etapa ${id}...`);
      await db
        .collection(this.collectionEtapas)
        .doc(id)
        .update(dadosAtualizacao);

      const etapaAtualizada = await this.buscarPorId(id, arenaId);
      if (!etapaAtualizada) {
        throw new Error("Erro ao recuperar etapa atualizada");
      }

      console.log(`✅ Etapa ${id} atualizada com sucesso`);
      return etapaAtualizada;
    } catch (error: any) {
      console.error("❌ Erro ao atualizar etapa:", error);
      throw error;
    }
  }

  /**
   * Deletar etapa
   */
  async deletar(id: string, arenaId: string): Promise<void> {
    try {
      console.log(`🗑️ Tentando deletar etapa ${id}...`);

      const etapa = await this.buscarPorId(id, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      // VALIDAÇÃO CRÍTICA: Não pode deletar se tem inscritos
      if (etapa.totalInscritos > 0) {
        throw new Error(
          `Não é possível excluir esta etapa pois ela possui ${etapa.totalInscritos} jogador(es) inscrito(s). ` +
            "Cancele todas as inscrições primeiro."
        );
      }

      // VALIDAÇÃO: Não pode deletar se chaves já foram geradas
      if (etapa.chavesGeradas) {
        throw new Error("Não é possível excluir etapa após geração de chaves");
      }

      // Deletar a etapa
      await db.collection(this.collectionEtapas).doc(id).delete();
      console.log(`✅ Etapa ${id} deletada com sucesso`);
    } catch (error: any) {
      console.error("❌ Erro ao deletar etapa:", error);
      if (
        error.message.includes("não encontrada") ||
        error.message.includes("possui") ||
        error.message.includes("chaves")
      ) {
        throw error;
      }
      throw new Error("Falha ao deletar etapa");
    }
  }

  /**
   * Encerrar inscrições
   */
  async encerrarInscricoes(id: string, arenaId: string): Promise<Etapa> {
    try {
      const etapa = await this.buscarPorId(id, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.status !== StatusEtapa.INSCRICOES_ABERTAS) {
        throw new Error("Etapa não está com inscrições abertas");
      }

      await db.collection(this.collectionEtapas).doc(id).update({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        atualizadoEm: Timestamp.now(),
      });

      const etapaAtualizada = await this.buscarPorId(id, arenaId);
      if (!etapaAtualizada) {
        throw new Error("Erro ao recuperar etapa");
      }

      return etapaAtualizada;
    } catch (error: any) {
      console.error("Erro ao encerrar inscrições:", error);
      throw error;
    }
  }

  /**
   * Reabrir inscrições
   */
  async reabrirInscricoes(id: string, arenaId: string): Promise<Etapa> {
    try {
      const etapa = await this.buscarPorId(id, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.status !== StatusEtapa.INSCRICOES_ENCERRADAS) {
        throw new Error("Etapa não está com inscrições encerradas");
      }

      if (etapa.chavesGeradas) {
        throw new Error("Não é possível reabrir inscrições após gerar chaves");
      }

      await db.collection(this.collectionEtapas).doc(id).update({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        atualizadoEm: Timestamp.now(),
      });

      const etapaAtualizada = await this.buscarPorId(id, arenaId);
      if (!etapaAtualizada) {
        throw new Error("Erro ao recuperar etapa");
      }

      return etapaAtualizada;
    } catch (error: any) {
      console.error("Erro ao reabrir inscrições:", error);
      throw error;
    }
  }

  /**
   * Obter estatísticas
   */
  async obterEstatisticas(arenaId: string): Promise<EstatisticasEtapa> {
    try {
      const snapshot = await db
        .collection(this.collectionEtapas)
        .where("arenaId", "==", arenaId)
        .get();

      let totalEtapas = 0;
      let inscricoesAbertas = 0;
      let emAndamento = 0;
      let finalizadas = 0;
      let totalParticipacoes = 0;

      snapshot.forEach((doc) => {
        totalEtapas++;
        const data = doc.data();
        totalParticipacoes += data.totalInscritos || 0;

        switch (data.status) {
          case StatusEtapa.INSCRICOES_ABERTAS:
            inscricoesAbertas++;
            break;
          case StatusEtapa.EM_ANDAMENTO:
          case StatusEtapa.CHAVES_GERADAS:
            emAndamento++;
            break;
          case StatusEtapa.FINALIZADA:
            finalizadas++;
            break;
        }
      });

      return {
        totalEtapas,
        inscricoesAbertas,
        emAndamento,
        finalizadas,
        totalParticipacoes,
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      return {
        totalEtapas: 0,
        inscricoesAbertas: 0,
        emAndamento: 0,
        finalizadas: 0,
        totalParticipacoes: 0,
      };
    }
  }

  /**
   * Encerrar etapa e atribuir pontos
   * Suporta 2 cenários:
   * 1. GRUPO ÚNICO (sem eliminatória) - pontos pela classificação do grupo
   * 2. COM ELIMINATÓRIA - pontos pelas fases eliminatórias
   */
  async encerrarEtapa(id: string, arenaId: string): Promise<void> {
    try {
      console.log(`🏁 Encerrando etapa ${id}...`);

      // Buscar etapa
      const etapa = await this.buscarPorId(id, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      // Verificar se já está finalizada
      if (etapa.status === StatusEtapa.FINALIZADA) {
        throw new Error("Etapa já está finalizada");
      }

      // Buscar configuração de pontos
      const configDoc = await db.collection("config").doc("global").get();
      const pontuacao = configDoc.data()?.pontuacaoColocacao || {
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      };

      // ============== VERIFICAR NÚMERO DE GRUPOS ==============
      const gruposSnapshot = await db
        .collection("grupos")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .get();

      if (gruposSnapshot.empty) {
        throw new Error("Nenhum grupo encontrado para esta etapa");
      }

      const grupos = gruposSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`📊 Total de grupos: ${grupos.length}`);

      // ============== CENÁRIO 1: GRUPO ÚNICO ==============
      if (grupos.length === 1) {
        console.log(
          "🏆 GRUPO ÚNICO - Atribuindo pontos pela classificação do grupo"
        );

        const grupo = grupos[0] as any;

        // Verificar se grupo está completo
        if (!grupo.completo) {
          throw new Error(
            "Não é possível encerrar a etapa. O grupo ainda possui partidas pendentes."
          );
        }

        // Buscar duplas ordenadas por posição
        const duplasSnapshot = await db
          .collection("duplas")
          .where("grupoId", "==", grupo.id)
          .orderBy("posicaoGrupo", "asc")
          .get();

        const duplas = duplasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Dupla[];

        console.log(`👥 ${duplas.length} duplas no grupo`);

        if (duplas.length === 0) {
          throw new Error("Nenhuma dupla encontrada no grupo");
        }

        // Definir colocações e pontos
        const tabelaColocacoes = [
          { colocacao: "campeao", pontos: pontuacao.campeao },
          { colocacao: "vice", pontos: pontuacao.vice },
          { colocacao: "semifinalista", pontos: pontuacao.semifinalista },
          { colocacao: "quartas", pontos: pontuacao.quartas },
          { colocacao: "participacao", pontos: pontuacao.participacao },
        ];

        // Atribuir pontos a cada dupla
        for (let i = 0; i < duplas.length; i++) {
          const dupla = duplas[i];
          const { colocacao, pontos } =
            tabelaColocacoes[i] ||
            tabelaColocacoes[tabelaColocacoes.length - 1];

          console.log(
            `   📍 ${i + 1}º lugar: ${dupla.jogador1Nome} & ${
              dupla.jogador2Nome
            } - ${colocacao} (${pontos} pts)`
          );

          await this.atribuirPontosParaDupla(dupla.id, id, pontos, colocacao);
        }

        // Atualizar etapa
        const campeao = duplas[0] as any;
        if (!campeao) {
          throw new Error("Nenhum campeão encontrado");
        }
        await db
          .collection("etapas")
          .doc(id)
          .update({
            status: StatusEtapa.FINALIZADA,
            dataFinalizacao: Timestamp.now(),
            campeaoId: campeao.id,
            campeaoNome: `${campeao.jogador1Nome} & ${campeao.jogador2Nome}`,
            atualizadoEm: Timestamp.now(),
          });

        console.log("✅ Etapa encerrada com sucesso (grupo único)!");
        console.log(
          `🏆 Campeão: ${campeao.jogador1Nome} & ${campeao.jogador2Nome}`
        );
        return;
      }

      // ============== CENÁRIO 2: COM ELIMINATÓRIA ==============
      console.log("🏆 COM ELIMINATÓRIA - Atribuindo pontos pelas fases");

      // Buscar final
      const confrontosSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .where("fase", "==", "final")
        .limit(1)
        .get();

      if (confrontosSnapshot.empty) {
        throw new Error("Não há fase eliminatória para esta etapa");
      }

      const confrontoFinal = confrontosSnapshot.docs[0].data();

      if (confrontoFinal.status !== "finalizada") {
        throw new Error("A final ainda não foi finalizada");
      }

      console.log("🏆 Atribuindo pontos de colocação...");

      // 1. CAMPEÃO (vencedor da final) = 100 pontos
      const campeaoDuplaId = confrontoFinal.vencedoraId;
      await this.atribuirPontosParaDupla(
        campeaoDuplaId,
        id,
        pontuacao.campeao,
        "campeao"
      );

      // 2. VICE (perdedor da final) = 70 pontos
      const viceDuplaId =
        confrontoFinal.dupla1Id === campeaoDuplaId
          ? confrontoFinal.dupla2Id
          : confrontoFinal.dupla1Id;
      await this.atribuirPontosParaDupla(
        viceDuplaId,
        id,
        pontuacao.vice,
        "vice"
      );

      // 3. SEMIFINALISTAS (perdedores das semis) = 50 pontos
      const semisSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .where("fase", "==", "semifinal")
        .where("status", "==", "finalizada")
        .get();

      for (const doc of semisSnapshot.docs) {
        const confronto = doc.data();
        const perdedorId =
          confronto.vencedoraId === confronto.dupla1Id
            ? confronto.dupla2Id
            : confronto.dupla1Id;
        await this.atribuirPontosParaDupla(
          perdedorId,
          id,
          pontuacao.semifinalista,
          "semifinalista"
        );
      }

      // 4. QUARTAS (perdedores das quartas) = 30 pontos
      const quartasSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .where("fase", "==", "quartas")
        .where("status", "==", "finalizada")
        .get();

      for (const doc of quartasSnapshot.docs) {
        const confronto = doc.data();
        const perdedorId =
          confronto.vencedoraId === confronto.dupla1Id
            ? confronto.dupla2Id
            : confronto.dupla1Id;
        await this.atribuirPontosParaDupla(
          perdedorId,
          id,
          pontuacao.quartas,
          "quartas"
        );
      }

      // 5. OITAVAS (perdedores das oitavas) = 20 pontos
      const oitavasSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .where("fase", "==", "oitavas")
        .where("status", "==", "finalizada")
        .get();

      for (const doc of oitavasSnapshot.docs) {
        const confronto = doc.data();
        const perdedorId =
          confronto.vencedoraId === confronto.dupla1Id
            ? confronto.dupla2Id
            : confronto.dupla1Id;
        await this.atribuirPontosParaDupla(
          perdedorId,
          id,
          pontuacao.oitavas,
          "oitavas"
        );
      }

      // 6. PARTICIPAÇÃO (não classificados para eliminatória) = 10 pontos
      const duplasSnapshot = await db
        .collection("duplas")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .where("classificada", "==", false)
        .get();

      for (const doc of duplasSnapshot.docs) {
        await this.atribuirPontosParaDupla(
          doc.id,
          id,
          pontuacao.participacao,
          "participacao"
        );
      }

      // Atualizar etapa para finalizada
      await db.collection("etapas").doc(id).update({
        status: StatusEtapa.FINALIZADA,
        dataFinalizacao: Timestamp.now(),
        campeaoId: confrontoFinal.vencedoraId,
        campeaoNome: confrontoFinal.vencedoraNome,
        atualizadoEm: Timestamp.now(),
      });

      console.log("✅ Etapa encerrada com sucesso (com eliminatória)!");
      console.log(`🏆 Campeão: ${confrontoFinal.vencedoraNome}`);
    } catch (error: any) {
      console.error("Erro ao encerrar etapa:", error);
      throw error;
    }
  }

  /**
   * Atribuir pontos de colocação para os 2 jogadores de uma dupla
   */
  private async atribuirPontosParaDupla(
    duplaId: string,
    etapaId: string,
    pontos: number,
    colocacao: string
  ): Promise<void> {
    try {
      // Buscar dupla
      const duplaDoc = await db.collection("duplas").doc(duplaId).get();
      if (!duplaDoc.exists) {
        console.warn(`Dupla ${duplaId} não encontrada`);
        return;
      }

      const dupla = duplaDoc.data();

      if (!dupla) {
        console.warn(`Dados da dupla ${duplaId} não encontrados`);
        return;
      }

      // Atribuir pontos para jogador 1
      await this.atribuirPontosParaJogador(
        dupla.jogador1Id,
        etapaId,
        pontos,
        colocacao
      );

      // Atribuir pontos para jogador 2
      await this.atribuirPontosParaJogador(
        dupla.jogador2Id,
        etapaId,
        pontos,
        colocacao
      );

      console.log(
        `   ✅ ${pontos} pts (${colocacao}): ${dupla.jogador1Nome} & ${dupla.jogador2Nome}`
      );
    } catch (error) {
      console.error(`Erro ao atribuir pontos para dupla ${duplaId}:`, error);
    }
  }

  /**
   * Atribuir pontos de colocação para um jogador individual
   */
  private async atribuirPontosParaJogador(
    jogadorId: string,
    etapaId: string,
    pontos: number,
    colocacao: string
  ): Promise<void> {
    try {
      // Buscar estatísticas do jogador nesta etapa
      const snapshot = await db
        .collection("estatisticas_jogador")
        .where("jogadorId", "==", jogadorId)
        .where("etapaId", "==", etapaId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(
          `Estatísticas não encontradas para jogador ${jogadorId} na etapa ${etapaId}`
        );
        return;
      }

      const estatisticasDoc = snapshot.docs[0];

      // Atualizar pontos e colocação
      await estatisticasDoc.ref.update({
        pontos: pontos,
        colocacao: colocacao,
        atualizadoEm: Timestamp.now(),
      });
    } catch (error) {
      console.error(
        `Erro ao atribuir pontos para jogador ${jogadorId}:`,
        error
      );
    }
  }
}

export default new EtapaService();
