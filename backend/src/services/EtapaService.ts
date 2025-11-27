/**
 * EtapaService.ts
 * Service para gerenciar etapas
 */

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
import logger from "../utils/logger";

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

      if (dadosValidados.maxJogadores % 2 !== 0) {
        throw new Error("Número máximo de jogadores deve ser par");
      }

      const agora = Timestamp.now();

      const totalDuplas = dadosValidados.maxJogadores / 2;
      const qtdGrupos = Math.ceil(
        totalDuplas / dadosValidados.jogadoresPorGrupo
      );

      const etapaData = {
        arenaId,
        nome: dadosValidados.nome.trim(),
        descricao: dadosValidados.descricao?.trim() || undefined,
        nivel: dadosValidados.nivel,
        genero: dadosValidados.genero,
        formato: dadosValidados.formato,
        tipoChaveamento: dadosValidados.tipoChaveamento || undefined,
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

      const novaEtapa = {
        id: docRef.id,
        ...etapaData,
      } as Etapa;

      logger.info("Etapa criada", {
        etapaId: novaEtapa.id,
        nome: novaEtapa.nome,
        nivel: novaEtapa.nivel,
        genero: novaEtapa.genero,
        formato: novaEtapa.formato,
        maxJogadores: novaEtapa.maxJogadores,
        qtdGrupos,
        arenaId,
      });

      return novaEtapa;
    } catch (error: any) {
      logger.error(
        "Erro ao criar etapa",
        {
          arenaId,
          nome: data.nome,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Buscar etapa por ID
   */
  async buscarPorId(id: string, arenaId: string): Promise<Etapa | null> {
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
  }

  /**
   * Buscar uma inscrição específica
   */
  async buscarInscricao(
    etapaId: string,
    arenaId: string,
    inscricaoId: string
  ): Promise<Inscricao | null> {
    const doc = await db.collection("inscricoes").doc(inscricaoId).get();

    if (!doc.exists) {
      return null;
    }

    const inscricao = { id: doc.id, ...doc.data() } as Inscricao;

    if (inscricao.etapaId !== etapaId || inscricao.arenaId !== arenaId) {
      return null;
    }

    return inscricao;
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

      const etapa = await this.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.status !== StatusEtapa.INSCRICOES_ABERTAS) {
        throw new Error("Inscrições não estão abertas para esta etapa");
      }

      if (etapa.totalInscritos >= etapa.maxJogadores) {
        throw new Error("Etapa atingiu o número máximo de jogadores");
      }

      const jogador = await jogadorService.buscarPorId(
        dadosValidados.jogadorId,
        arenaId
      );
      if (!jogador) {
        throw new Error("Jogador não encontrado");
      }

      if (jogador.nivel !== etapa.nivel) {
        throw new Error(
          `Este jogador não pode se inscrever nesta etapa. ` +
            `Etapa para jogadores ${etapa.nivel}, jogador é ${jogador.nivel}`
        );
      }

      if (jogador.genero !== etapa.genero) {
        throw new Error(
          `Este jogador não pode se inscrever nesta etapa. ` +
            `Etapa ${etapa.genero}, jogador é ${jogador.genero}`
        );
      }

      if (etapa.jogadoresInscritos.includes(dadosValidados.jogadorId)) {
        throw new Error("Jogador já está inscrito nesta etapa");
      }

      const agora = Timestamp.now();

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

      const novaInscricao = {
        id: inscricaoRef.id,
        ...inscricaoData,
      } as Inscricao;

      logger.info("Jogador inscrito na etapa", {
        inscricaoId: novaInscricao.id,
        etapaId,
        jogadorId: dadosValidados.jogadorId,
        jogadorNome: jogador.nome,
        totalInscritos: etapa.totalInscritos + 1,
        maxJogadores: etapa.maxJogadores,
      });

      return novaInscricao;
    } catch (error: any) {
      logger.error(
        "Erro ao inscrever jogador",
        {
          etapaId,
          jogadorId: data.jogadorId,
        },
        error
      );
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
      const inscricaoDoc = await db
        .collection(this.collectionInscricoes)
        .doc(inscricaoId)
        .get();

      if (!inscricaoDoc.exists) {
        throw new Error("Inscrição não encontrada");
      }

      const inscricao = inscricaoDoc.data() as Inscricao;

      if (inscricao.arenaId !== arenaId || inscricao.etapaId !== etapaId) {
        throw new Error("Inscrição não encontrada");
      }

      const etapa = await this.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.chavesGeradas) {
        throw new Error(
          "Não é possível cancelar inscrição após geração de chaves"
        );
      }

      const agora = Timestamp.now();

      await db.collection(this.collectionInscricoes).doc(inscricaoId).update({
        status: StatusInscricao.CANCELADA,
        canceladoEm: agora,
        atualizadoEm: agora,
      });

      const jogadoresAtualizados = etapa.jogadoresInscritos.filter(
        (id) => id !== inscricao.jogadorId
      );

      await db
        .collection(this.collectionEtapas)
        .doc(etapaId)
        .update({
          totalInscritos: etapa.totalInscritos - 1,
          jogadoresInscritos: jogadoresAtualizados,
          atualizadoEm: agora,
        });

      logger.info("Inscrição cancelada", {
        inscricaoId,
        etapaId,
        jogadorId: inscricao.jogadorId,
        jogadorNome: inscricao.jogadorNome,
        totalInscritos: etapa.totalInscritos - 1,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao cancelar inscrição",
        {
          inscricaoId,
          etapaId,
        },
        error
      );
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
    const snapshot = await db
      .collection(this.collectionInscricoes)
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("status", "==", StatusInscricao.CONFIRMADA)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Inscricao[];
  }

  /**
   * Listar etapas com filtros
   */
  async listar(filtros: FiltrosEtapa): Promise<ListagemEtapas> {
    const snapshot = await db
      .collection(this.collectionEtapas)
      .where("arenaId", "==", filtros.arenaId)
      .get();

    let etapas = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as Etapa[];

    if (filtros.status) {
      etapas = etapas.filter((e) => e.status === filtros.status);
    }

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

      if (etapa.chavesGeradas) {
        throw new Error("Não é possível editar etapa após geração de chaves");
      }

      if (etapa.totalInscritos > 0) {
        if (dadosValidados.nivel && dadosValidados.nivel !== etapa.nivel) {
          throw new Error(
            "Não é possível alterar o nível da etapa após ter inscritos"
          );
        }

        if (dadosValidados.genero && dadosValidados.genero !== etapa.genero) {
          throw new Error(
            "Não é possível alterar o gênero da etapa após ter inscritos"
          );
        }

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

      if (
        dadosValidados.maxJogadores &&
        dadosValidados.maxJogadores !== etapa.maxJogadores
      ) {
        const totalDuplas = dadosValidados.maxJogadores / 2;
        let jogadoresPorGrupo = 3;
        let qtdGrupos = Math.ceil(totalDuplas / jogadoresPorGrupo);

        if (qtdGrupos === 1 && totalDuplas > 5) {
          qtdGrupos = 2;
        }

        if (totalDuplas / qtdGrupos < 3 && qtdGrupos > 1) {
          qtdGrupos = Math.max(1, Math.floor(totalDuplas / 3));
        }

        jogadoresPorGrupo = Math.ceil(totalDuplas / qtdGrupos);

        dadosAtualizacao.qtdGrupos = qtdGrupos;
        dadosAtualizacao.jogadoresPorGrupo = jogadoresPorGrupo;
      }

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

      Object.keys(dadosAtualizacao).forEach((key) => {
        if (dadosAtualizacao[key] === undefined) {
          delete dadosAtualizacao[key];
        }
      });

      await db
        .collection(this.collectionEtapas)
        .doc(id)
        .update(dadosAtualizacao);

      const etapaAtualizada = await this.buscarPorId(id, arenaId);
      if (!etapaAtualizada) {
        throw new Error("Erro ao recuperar etapa atualizada");
      }

      logger.info("Etapa atualizada", {
        etapaId: id,
        arenaId,
        camposAtualizados: Object.keys(dadosAtualizacao).filter(
          (k) => k !== "atualizadoEm"
        ),
      });

      return etapaAtualizada;
    } catch (error: any) {
      logger.error(
        "Erro ao atualizar etapa",
        {
          etapaId: id,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Deletar etapa
   */
  async deletar(id: string, arenaId: string): Promise<void> {
    try {
      const etapa = await this.buscarPorId(id, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.totalInscritos > 0) {
        throw new Error(
          `Não é possível excluir esta etapa pois ela possui ${etapa.totalInscritos} jogador(es) inscrito(s). ` +
            "Cancele todas as inscrições primeiro."
        );
      }

      if (etapa.chavesGeradas) {
        throw new Error("Não é possível excluir etapa após geração de chaves");
      }

      const cabecasSnapshot = await db
        .collection("cabecas_de_chave")
        .where("arenaId", "==", arenaId)
        .where("etapaId", "==", id)
        .get();

      if (!cabecasSnapshot.empty) {
        const batch = db.batch();
        cabecasSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      await db.collection(this.collectionEtapas).doc(id).delete();

      logger.info("Etapa deletada", {
        etapaId: id,
        nome: etapa.nome,
        arenaId,
        cabecasRemovidas: cabecasSnapshot.size,
      });
    } catch (error: any) {
      if (
        error.message.includes("não encontrada") ||
        error.message.includes("possui") ||
        error.message.includes("chaves")
      ) {
        throw error;
      }
      logger.error(
        "Erro ao deletar etapa",
        {
          etapaId: id,
          arenaId,
        },
        error
      );
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

      logger.info("Inscrições encerradas", {
        etapaId: id,
        nome: etapa.nome,
        totalInscritos: etapa.totalInscritos,
        arenaId,
      });

      return etapaAtualizada;
    } catch (error: any) {
      logger.error(
        "Erro ao encerrar inscrições",
        {
          etapaId: id,
          arenaId,
        },
        error
      );
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

      logger.info("Inscrições reabertas", {
        etapaId: id,
        nome: etapa.nome,
        arenaId,
      });

      return etapaAtualizada;
    } catch (error: any) {
      logger.error(
        "Erro ao reabrir inscrições",
        {
          etapaId: id,
          arenaId,
        },
        error
      );
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
   * MÉTODO CRÍTICO - Distribui pontos finais
   */
  async encerrarEtapa(id: string, arenaId: string): Promise<void> {
    try {
      const etapa = await this.buscarPorId(id, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.status === StatusEtapa.FINALIZADA) {
        throw new Error("Etapa já está finalizada");
      }

      const configDoc = await db.collection("config").doc("global").get();
      const pontuacao = configDoc.data()?.pontuacaoColocacao || {
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      };

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

      // CENÁRIO 1: GRUPO ÚNICO
      if (grupos.length === 1) {
        const grupo = grupos[0] as any;

        if (!grupo.completo) {
          throw new Error(
            "Não é possível encerrar a etapa. O grupo ainda possui partidas pendentes."
          );
        }

        const duplasSnapshot = await db
          .collection("duplas")
          .where("grupoId", "==", grupo.id)
          .orderBy("posicaoGrupo", "asc")
          .get();

        const duplas = duplasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Dupla[];

        if (duplas.length === 0) {
          throw new Error("Nenhuma dupla encontrada no grupo");
        }

        const tabelaColocacoes = [
          { colocacao: "campeao", pontos: pontuacao.campeao },
          { colocacao: "vice", pontos: pontuacao.vice },
          { colocacao: "semifinalista", pontos: pontuacao.semifinalista },
          { colocacao: "quartas", pontos: pontuacao.quartas },
          { colocacao: "participacao", pontos: pontuacao.participacao },
        ];

        for (let i = 0; i < duplas.length; i++) {
          const dupla = duplas[i];
          const { colocacao, pontos } =
            tabelaColocacoes[i] ||
            tabelaColocacoes[tabelaColocacoes.length - 1];

          await this.atribuirPontosParaDupla(dupla.id, id, pontos, colocacao);
        }

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

        logger.info("Etapa encerrada (grupo único)", {
          etapaId: id,
          nome: etapa.nome,
          campeaoNome: `${campeao.jogador1Nome} & ${campeao.jogador2Nome}`,
          totalDuplas: duplas.length,
          arenaId,
        });

        return;
      }

      // CENÁRIO 2: COM ELIMINATÓRIA
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

      // Campeão
      const campeaoDuplaId = confrontoFinal.vencedoraId;
      await this.atribuirPontosParaDupla(
        campeaoDuplaId,
        id,
        pontuacao.campeao,
        "campeao"
      );

      // Vice
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

      // Semifinalistas
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

      // Quartas
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

      // Oitavas
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

      // Participação
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

      await db.collection("etapas").doc(id).update({
        status: StatusEtapa.FINALIZADA,
        dataFinalizacao: Timestamp.now(),
        campeaoId: confrontoFinal.vencedoraId,
        campeaoNome: confrontoFinal.vencedoraNome,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Etapa encerrada (com eliminatória)", {
        etapaId: id,
        nome: etapa.nome,
        campeaoNome: confrontoFinal.vencedoraNome,
        totalGrupos: grupos.length,
        arenaId,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao encerrar etapa",
        {
          etapaId: id,
          arenaId,
        },
        error
      );
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
      const duplaDoc = await db.collection("duplas").doc(duplaId).get();
      if (!duplaDoc.exists) {
        logger.warn("Dupla não encontrada para atribuir pontos", {
          duplaId,
          etapaId,
        });
        return;
      }

      const dupla = duplaDoc.data();

      if (!dupla) {
        logger.warn("Dados da dupla não encontrados", {
          duplaId,
          etapaId,
        });
        return;
      }

      await this.atribuirPontosParaJogador(
        dupla.jogador1Id,
        etapaId,
        pontos,
        colocacao
      );

      await this.atribuirPontosParaJogador(
        dupla.jogador2Id,
        etapaId,
        pontos,
        colocacao
      );

      logger.info("Pontos atribuídos para dupla", {
        duplaId,
        etapaId,
        jogadores: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
        pontos,
        colocacao,
      });
    } catch (error) {
      logger.error(
        "Erro ao atribuir pontos para dupla",
        {
          duplaId,
          etapaId,
        },
        error as Error
      );
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
      const snapshot = await db
        .collection("estatisticas_jogador")
        .where("jogadorId", "==", jogadorId)
        .where("etapaId", "==", etapaId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        logger.warn("Estatísticas não encontradas para atribuir pontos", {
          jogadorId,
          etapaId,
        });
        return;
      }

      const estatisticasDoc = snapshot.docs[0];

      await estatisticasDoc.ref.update({
        pontos: pontos,
        colocacao: colocacao,
        atualizadoEm: Timestamp.now(),
      });
    } catch (error) {
      logger.error(
        "Erro ao atribuir pontos para jogador",
        {
          jogadorId,
          etapaId,
        },
        error as Error
      );
    }
  }
}

export default new EtapaService();
