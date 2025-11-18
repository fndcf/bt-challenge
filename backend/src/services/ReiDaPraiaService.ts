/**
 * ReiDaPraiaService.ts - VERSÃO ATUALIZADA
 *
 * MUDANÇAS:
 * - Usa EstatisticasJogadorService compartilhado
 * - Collection: "estatisticas_jogador" (não "jogadores_individuais")
 * - Compatível com Dupla Fixa
 */

import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { StatusEtapa, FaseEtapa } from "../models/Etapa";
import { Inscricao } from "../models/Inscricao";
import { EstatisticasJogador } from "../models/EstatisticasJogador";
import { Grupo } from "../models/Grupo";
import { PartidaReiDaPraia } from "../models/PartidaReiDaPraia";
import { StatusPartida } from "../models/Partida";
import etapaService from "./EtapaService";
import estatisticasJogadorService from "./EstatisticasJogadorService";
import { TipoChaveamentoReiDaPraia } from "../models/TipoChaveamentoReiDaPraia";
import { Dupla } from "../models/Dupla";
import {
  TipoFase,
  StatusConfrontoEliminatorio,
  ConfrontoEliminatorio,
} from "../models/Eliminatoria";

export class ReiDaPraiaService {
  private collectionGrupos = "grupos";
  private collectionPartidas = "partidas_rei_da_praia";

  /**
   * Gerar chaves no formato Rei da Praia
   */
  async gerarChaves(
    etapaId: string,
    arenaId: string
  ): Promise<{
    jogadores: EstatisticasJogador[];
    grupos: Grupo[];
    partidas: PartidaReiDaPraia[];
  }> {
    try {
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) throw new Error("Etapa não encontrada");

      if (etapa.status !== StatusEtapa.INSCRICOES_ENCERRADAS) {
        throw new Error("Inscrições devem estar encerradas");
      }

      if (etapa.chavesGeradas) {
        throw new Error("Chaves já foram geradas");
      }

      if (etapa.totalInscritos < 8) {
        throw new Error("Necessário no mínimo 8 jogadores");
      }

      if (etapa.totalInscritos % 4 !== 0) {
        throw new Error("Número de jogadores deve ser múltiplo de 4");
      }

      if (etapa.totalInscritos !== etapa.maxJogadores) {
        throw new Error(
          `Etapa configurada para ${etapa.maxJogadores} jogadores, mas possui ${etapa.totalInscritos}`
        );
      }

      const inscricoes = await etapaService.listarInscricoes(etapaId, arenaId);

      console.log("👥 Distribuindo jogadores em grupos...");
      const jogadores = await this.distribuirJogadoresEmGrupos(
        etapaId,
        arenaId,
        inscricoes
      );

      console.log("📊 Criando grupos...");
      const grupos = await this.criarGrupos(etapaId, arenaId, jogadores);

      console.log("⚔️ Gerando partidas...");
      const partidas = await this.gerarPartidas(etapaId, arenaId, grupos);

      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: true,
        dataGeracaoChaves: Timestamp.now(),
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });

      console.log("✅ Chaves Rei da Praia geradas com sucesso!");

      return { jogadores, grupos, partidas };
    } catch (error: any) {
      console.error("Erro ao gerar chaves rei da praia:", error);
      throw error;
    }
  }

  /**
   * Distribuir jogadores em grupos de 4
   * ✅ USA EstatisticasJogadorService
   */
  private async distribuirJogadoresEmGrupos(
    etapaId: string,
    arenaId: string,
    inscricoes: Inscricao[]
  ): Promise<EstatisticasJogador[]> {
    try {
      const jogadoresEmbaralhados = this.embaralhar([...inscricoes]);
      const jogadores: EstatisticasJogador[] = [];
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numGrupos = jogadoresEmbaralhados.length / 4;

      console.log(`   📦 Criando ${numGrupos} grupos de 4 jogadores cada`);

      for (let grupoIndex = 0; grupoIndex < numGrupos; grupoIndex++) {
        const nomeGrupo = `Grupo ${letras[grupoIndex]}`;

        for (let j = 0; j < 4; j++) {
          const inscricaoIndex = grupoIndex * 4 + j;
          const inscricao = jogadoresEmbaralhados[inscricaoIndex];

          // ✅ USAR EstatisticasJogadorService
          const estatisticas = await estatisticasJogadorService.criar({
            etapaId,
            arenaId,
            jogadorId: inscricao.jogadorId,
            jogadorNome: inscricao.jogadorNome,
            jogadorNivel: inscricao.jogadorNivel
              ? Number(inscricao.jogadorNivel)
              : undefined,
            grupoNome: nomeGrupo,
          });

          jogadores.push(estatisticas);
        }
      }

      return jogadores;
    } catch (error) {
      console.error("Erro ao distribuir jogadores:", error);
      throw new Error("Falha ao distribuir jogadores");
    }
  }

  /**
   * Criar grupos
   */
  private async criarGrupos(
    etapaId: string,
    arenaId: string,
    jogadores: EstatisticasJogador[]
  ): Promise<Grupo[]> {
    try {
      const grupos: Grupo[] = [];
      const jogadoresPorGrupo = new Map<string, EstatisticasJogador[]>();

      for (const jogador of jogadores) {
        if (!jogadoresPorGrupo.has(jogador.grupoNome!)) {
          jogadoresPorGrupo.set(jogador.grupoNome!, []);
        }
        jogadoresPorGrupo.get(jogador.grupoNome!)!.push(jogador);
      }

      let grupoIndex = 0;
      for (const [nomeGrupo, jogadoresGrupo] of jogadoresPorGrupo) {
        console.log(`   📦 ${nomeGrupo}: ${jogadoresGrupo.length} jogadores`);

        const grupo: Grupo = {
          id: "",
          etapaId,
          arenaId,
          nome: nomeGrupo,
          ordem: grupoIndex + 1,
          duplas: jogadoresGrupo.map((j) => j.id),
          totalDuplas: jogadoresGrupo.length,
          partidas: [],
          totalPartidas: 0,
          partidasFinalizadas: 0,
          completo: false,
          classificadas: [],
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        };

        const docRef = await db.collection(this.collectionGrupos).add(grupo);
        const grupoComId = { ...grupo, id: docRef.id };
        grupos.push(grupoComId);

        // ✅ ATUALIZAR grupoId nas estatísticas
        for (const jogador of jogadoresGrupo) {
          await estatisticasJogadorService.atualizarGrupo(
            jogador.jogadorId,
            etapaId,
            docRef.id,
            nomeGrupo
          );
        }

        grupoIndex++;
      }

      return grupos;
    } catch (error) {
      console.error("Erro ao criar grupos:", error);
      throw new Error("Falha ao criar grupos");
    }
  }

  /**
   * Gerar partidas (todas as combinações)
   */
  private async gerarPartidas(
    etapaId: string,
    arenaId: string,
    grupos: Grupo[]
  ): Promise<PartidaReiDaPraia[]> {
    try {
      const todasPartidas: PartidaReiDaPraia[] = [];

      for (const grupo of grupos) {
        const jogadores = await estatisticasJogadorService.buscarPorGrupo(
          grupo.id
        );

        if (jogadores.length !== 4) {
          throw new Error(`Grupo ${grupo.nome} deve ter 4 jogadores`);
        }

        const partidas = this.gerarCombinacoesPartidas(
          etapaId,
          arenaId,
          grupo,
          jogadores
        );

        for (const partida of partidas) {
          const docRef = await db
            .collection(this.collectionPartidas)
            .add(partida);
          const partidaComId = { ...partida, id: docRef.id };
          todasPartidas.push(partidaComId);
        }

        await db
          .collection(this.collectionGrupos)
          .doc(grupo.id)
          .update({
            partidas: todasPartidas
              .filter((p) => p.grupoId === grupo.id)
              .map((p) => p.id),
            totalPartidas: 3,
            atualizadoEm: Timestamp.now(),
          });
      }

      return todasPartidas;
    } catch (error) {
      console.error("Erro ao gerar partidas:", error);
      throw new Error("Falha ao gerar partidas");
    }
  }

  /**
   * Gerar combinações (A+B vs C+D, A+C vs B+D, A+D vs B+C)
   */
  private gerarCombinacoesPartidas(
    etapaId: string,
    arenaId: string,
    grupo: Grupo,
    jogadores: EstatisticasJogador[]
  ): PartidaReiDaPraia[] {
    const [A, B, C, D] = jogadores;

    return [
      {
        id: "",
        etapaId,
        arenaId,
        fase: FaseEtapa.GRUPOS,
        grupoId: grupo.id,
        grupoNome: grupo.nome,
        jogador1AId: A.jogadorId,
        jogador1ANome: A.jogadorNome,
        jogador1BId: B.jogadorId,
        jogador1BNome: B.jogadorNome,
        dupla1Nome: `${A.jogadorNome} & ${B.jogadorNome}`,
        jogador2AId: C.jogadorId,
        jogador2ANome: C.jogadorNome,
        jogador2BId: D.jogadorId,
        jogador2BNome: D.jogadorNome,
        dupla2Nome: `${C.jogadorNome} & ${D.jogadorNome}`,
        status: StatusPartida.AGENDADA,
        setsDupla1: 0,
        setsDupla2: 0,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      },
      {
        id: "",
        etapaId,
        arenaId,
        fase: FaseEtapa.GRUPOS,
        grupoId: grupo.id,
        grupoNome: grupo.nome,
        jogador1AId: A.jogadorId,
        jogador1ANome: A.jogadorNome,
        jogador1BId: C.jogadorId,
        jogador1BNome: C.jogadorNome,
        dupla1Nome: `${A.jogadorNome} & ${C.jogadorNome}`,
        jogador2AId: B.jogadorId,
        jogador2ANome: B.jogadorNome,
        jogador2BId: D.jogadorId,
        jogador2BNome: D.jogadorNome,
        dupla2Nome: `${B.jogadorNome} & ${D.jogadorNome}`,
        status: StatusPartida.AGENDADA,
        setsDupla1: 0,
        setsDupla2: 0,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      },
      {
        id: "",
        etapaId,
        arenaId,
        fase: FaseEtapa.GRUPOS,
        grupoId: grupo.id,
        grupoNome: grupo.nome,
        jogador1AId: A.jogadorId,
        jogador1ANome: A.jogadorNome,
        jogador1BId: D.jogadorId,
        jogador1BNome: D.jogadorNome,
        dupla1Nome: `${A.jogadorNome} & ${D.jogadorNome}`,
        jogador2AId: B.jogadorId,
        jogador2ANome: B.jogadorNome,
        jogador2BId: C.jogadorId,
        jogador2BNome: C.jogadorNome,
        dupla2Nome: `${B.jogadorNome} & ${C.jogadorNome}`,
        status: StatusPartida.AGENDADA,
        setsDupla1: 0,
        setsDupla2: 0,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      },
    ];
  }

  /**
   * Registrar resultado - ✅ USA EstatisticasJogadorService
   */
  async registrarResultadoPartida(
    partidaId: string,
    arenaId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void> {
    try {
      const partidaDoc = await db
        .collection(this.collectionPartidas)
        .doc(partidaId)
        .get();

      if (!partidaDoc.exists) throw new Error("Partida não encontrada");

      const partida = {
        id: partidaDoc.id,
        ...partidaDoc.data(),
      } as PartidaReiDaPraia;

      if (partida.arenaId !== arenaId) {
        throw new Error("Partida não pertence a esta arena");
      }

      // Reverter estatísticas antigas se for edição
      const isEdicao = partida.status === StatusPartida.FINALIZADA;
      if (isEdicao && partida.placar && partida.placar.length > 0) {
        console.log("🔄 Revertendo estatísticas antigas...");
        await this.reverterEstatisticasJogadores(partida);
      }

      // Validar placar (1 SET)
      if (placar.length !== 1) {
        throw new Error("Placar inválido: deve ter apenas 1 set");
      }

      const set = placar[0];
      const setsDupla1 = set.gamesDupla1 > set.gamesDupla2 ? 1 : 0;
      const setsDupla2 = set.gamesDupla1 > set.gamesDupla2 ? 0 : 1;
      const vencedores =
        setsDupla1 > setsDupla2
          ? [partida.jogador1AId, partida.jogador1BId]
          : [partida.jogador2AId, partida.jogador2BId];

      // Atualizar partida
      await db
        .collection(this.collectionPartidas)
        .doc(partidaId)
        .update({
          status: StatusPartida.FINALIZADA,
          setsDupla1,
          setsDupla2,
          placar: [
            {
              ...set,
              vencedorId: setsDupla1 > setsDupla2 ? "dupla1" : "dupla2",
            },
          ],
          vencedores,
          vencedoresNomes:
            setsDupla1 > setsDupla2 ? partida.dupla1Nome : partida.dupla2Nome,
          finalizadoEm: isEdicao ? partida.finalizadoEm : Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        });

      // ✅ Atualizar estatísticas individuais
      console.log("📊 Atualizando estatísticas individuais...");
      await this.atualizarEstatisticasJogadores(
        partida,
        vencedores,
        setsDupla1,
        setsDupla2,
        set.gamesDupla1,
        set.gamesDupla2
      );

      // Recalcular classificação
      if (partida.grupoId) {
        await this.recalcularClassificacaoGrupo(
          partida.grupoId,
          partida.etapaId
        );
      }

      console.log("✅ Resultado registrado!");
    } catch (error: any) {
      console.error("Erro ao registrar resultado:", error);
      throw error;
    }
  }

  /**
   * Reverter estatísticas - ✅ USA EstatisticasJogadorService
   */
  private async reverterEstatisticasJogadores(
    partida: PartidaReiDaPraia
  ): Promise<void> {
    if (!partida.vencedores || !partida.placar) return;

    const set = partida.placar[0];
    const dupla1Venceu = partida.vencedores.includes(partida.jogador1AId);
    const setsDupla1 = dupla1Venceu ? 1 : 0;
    const setsDupla2 = dupla1Venceu ? 0 : 1;

    const jogadoresIds = [
      partida.jogador1AId,
      partida.jogador1BId,
      partida.jogador2AId,
      partida.jogador2BId,
    ];

    for (const jogadorId of jogadoresIds) {
      const venceu = partida.vencedores.includes(jogadorId);
      const naDupla1 = [partida.jogador1AId, partida.jogador1BId].includes(
        jogadorId
      );

      await estatisticasJogadorService.reverterAposPartida(
        jogadorId,
        partida.etapaId,
        {
          venceu,
          setsVencidos: naDupla1 ? setsDupla1 : setsDupla2,
          setsPerdidos: naDupla1 ? setsDupla2 : setsDupla1,
          gamesVencidos: naDupla1 ? set.gamesDupla1 : set.gamesDupla2,
          gamesPerdidos: naDupla1 ? set.gamesDupla2 : set.gamesDupla1,
        }
      );
    }
  }

  /**
   * Atualizar estatísticas - ✅ USA EstatisticasJogadorService
   */
  private async atualizarEstatisticasJogadores(
    partida: PartidaReiDaPraia,
    vencedoresIds: string[],
    setsDupla1: number,
    setsDupla2: number,
    gamesDupla1: number,
    gamesDupla2: number
  ): Promise<void> {
    const jogadoresIds = [
      partida.jogador1AId,
      partida.jogador1BId,
      partida.jogador2AId,
      partida.jogador2BId,
    ];

    for (const jogadorId of jogadoresIds) {
      const venceu = vencedoresIds.includes(jogadorId);
      const naDupla1 = [partida.jogador1AId, partida.jogador1BId].includes(
        jogadorId
      );

      await estatisticasJogadorService.atualizarAposPartida(
        jogadorId,
        partida.etapaId,
        {
          venceu,
          setsVencidos: naDupla1 ? setsDupla1 : setsDupla2,
          setsPerdidos: naDupla1 ? setsDupla2 : setsDupla1,
          gamesVencidos: naDupla1 ? gamesDupla1 : gamesDupla2,
          gamesPerdidos: naDupla1 ? gamesDupla2 : gamesDupla1,
        }
      );
    }
  }

  /**
   * Recalcular classificação - ✅ USA EstatisticasJogadorService
   */
  private async recalcularClassificacaoGrupo(
    grupoId: string,
    etapaId: string
  ): Promise<void> {
    const jogadores = await estatisticasJogadorService.buscarPorGrupo(grupoId);

    const jogadoresOrdenados = [...jogadores].sort((a, b) => {
      if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
      if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
      return 0;
    });

    for (let i = 0; i < jogadoresOrdenados.length; i++) {
      await estatisticasJogadorService.atualizarPosicaoGrupo(
        jogadoresOrdenados[i].jogadorId,
        etapaId,
        i + 1
      );
    }

    const partidasSnapshot = await db
      .collection(this.collectionPartidas)
      .where("grupoId", "==", grupoId)
      .where("status", "==", StatusPartida.FINALIZADA)
      .get();

    const completo = partidasSnapshot.size === 3;

    await db.collection(this.collectionGrupos).doc(grupoId).update({
      partidasFinalizadas: partidasSnapshot.size,
      completo,
      atualizadoEm: Timestamp.now(),
    });
  }

  private embaralhar<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ✅ Buscar dados usa EstatisticasJogadorService
  async buscarJogadores(
    etapaId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]> {
    return await estatisticasJogadorService.buscarPorEtapa(etapaId, arenaId);
  }

  async buscarPartidas(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia[]> {
    const snapshot = await db
      .collection(this.collectionPartidas)
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("criadoEm", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Gerar fase eliminatória com duplas fixas formadas a partir dos classificados
   *
   * @param etapaId - ID da etapa
   * @param arenaId - ID da arena
   * @param classificadosPorGrupo - Quantos jogadores classificam por grupo (padrão: 2)
   * @param tipoChaveamento - Tipo de chaveamento (padrão: MELHORES_COM_MELHORES)
   */
  async gerarFaseEliminatoria(
    etapaId: string,
    arenaId: string,
    classificadosPorGrupo: number = 2,
    tipoChaveamento: TipoChaveamentoReiDaPraia = TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
  ): Promise<{
    duplas: Dupla[];
    confrontos: ConfrontoEliminatorio[];
  }> {
    try {
      console.log(`🏆 Gerando fase eliminatória Rei da Praia...`);
      console.log(`   📋 Tipo de chaveamento: ${tipoChaveamento}`);

      // 1. Buscar grupos completos
      const gruposSnapshot = await db
        .collection(this.collectionGrupos)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("completo", "==", true)
        .orderBy("ordem", "asc")
        .get();

      if (gruposSnapshot.empty) {
        throw new Error("Nenhum grupo completo encontrado");
      }

      const grupos = gruposSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grupo[];

      console.log(`   ✅ ${grupos.length} grupos completos`);

      if (grupos.length === 1) {
        throw new Error(
          "Não é possível gerar fase eliminatória com apenas 1 grupo"
        );
      }

      // 2. Buscar jogadores classificados de cada grupo
      const todosClassificados: EstatisticasJogador[] = [];

      for (const grupo of grupos) {
        const classificados =
          await estatisticasJogadorService.buscarClassificados(
            grupo.id,
            classificadosPorGrupo
          );

        if (classificados.length < classificadosPorGrupo) {
          throw new Error(
            `Grupo ${grupo.nome} não tem ${classificadosPorGrupo} classificados`
          );
        }

        todosClassificados.push(...classificados);
      }

      console.log(
        `   📊 Total de classificados: ${todosClassificados.length} jogadores`
      );

      // 3. Marcar jogadores como classificados
      for (const jogador of todosClassificados) {
        await estatisticasJogadorService.marcarComoClassificado(
          jogador.jogadorId,
          etapaId,
          true
        );
      }

      // 4. Formar duplas fixas baseado no tipo de chaveamento
      console.log(`   👥 Formando duplas (${tipoChaveamento})...`);

      let duplas: Dupla[];

      switch (tipoChaveamento) {
        case TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES:
          duplas = await this.formarDuplasMelhoresComMelhores(
            etapaId,
            arenaId,
            todosClassificados,
            grupos.length,
            classificadosPorGrupo
          );
          break;

        case TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING:
          duplas = await this.formarDuplasPareamentoPorRanking(
            etapaId,
            arenaId,
            todosClassificados,
            grupos.length,
            classificadosPorGrupo
          );
          break;

        case TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO:
          duplas = await this.formarDuplasSorteioAleatorio(
            etapaId,
            arenaId,
            todosClassificados
          );
          break;

        default:
          throw new Error(`Tipo de chaveamento inválido: ${tipoChaveamento}`);
      }

      console.log(`   ✅ ${duplas.length} duplas formadas`);

      // 5. Gerar confrontos eliminatórios
      console.log("   ⚔️ Gerando confrontos...");
      const confrontos = await this.gerarConfrontosEliminatorios(
        etapaId,
        arenaId,
        duplas
      );

      // 6. Atualizar etapa
      await db.collection("etapas").doc(etapaId).update({
        status: StatusEtapa.FASE_ELIMINATORIA,
        atualizadoEm: Timestamp.now(),
      });

      console.log("✅ Fase eliminatória gerada com sucesso!");

      return { duplas, confrontos };
    } catch (error: any) {
      console.error("Erro ao gerar fase eliminatória:", error);
      throw error;
    }
  }

  /**
   * OPÇÃO 1: Melhores com Melhores
   *
   * Lógica: Agrupa os MELHORES juntos
   * - 1º melhor 1º + 2º melhor 1º (dupla forte)
   * - 3º melhor 1º + 4º melhor 1º (dupla fraca)
   * - 1º melhor 2º + 2º melhor 2º (dupla forte)
   * - 3º melhor 2º + 4º melhor 2º (dupla fraca)
   *
   * Confronto: Forte vs Fraco
   */
  private async formarDuplasMelhoresComMelhores(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[],
    totalGrupos: number,
    _classificadosPorGrupo: number
  ): Promise<Dupla[]> {
    console.log("      🏆 OPÇÃO 1: Melhores com Melhores");

    // Separar 1º lugares e 2º lugares
    const primeiros: EstatisticasJogador[] = [];
    const segundos: EstatisticasJogador[] = [];

    for (const jogador of classificados) {
      if (jogador.posicaoGrupo === 1) {
        primeiros.push(jogador);
      } else if (jogador.posicaoGrupo === 2) {
        segundos.push(jogador);
      }
    }

    // Ordenar por desempenho (critérios de desempate)
    const ordenar = (a: EstatisticasJogador, b: EstatisticasJogador) => {
      // 1. Vitórias
      if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
      // 2. Saldo de games
      if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
      // 3. Sorteio
      return Math.random() - 0.5;
    };

    primeiros.sort(ordenar);
    segundos.sort(ordenar);

    console.log("      📊 Ranking dos 1º lugares:");
    primeiros.forEach((j, i) => {
      console.log(
        `         ${i + 1}º: ${j.jogadorNome} (${j.vitorias}V, ${
          j.saldoGames > 0 ? "+" : ""
        }${j.saldoGames})`
      );
    });

    console.log("      📊 Ranking dos 2º lugares:");
    segundos.forEach((j, i) => {
      console.log(
        `         ${i + 1}º: ${j.jogadorNome} (${j.vitorias}V, ${
          j.saldoGames > 0 ? "+" : ""
        }${j.saldoGames})`
      );
    });

    const duplas: Dupla[] = [];
    const metade = Math.floor(totalGrupos / 2);

    // Formar duplas: melhores 1º + melhores 1º
    for (let i = 0; i < metade; i++) {
      const jogador1 = primeiros[i];
      const jogador2 = primeiros[i + metade];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );

      duplas.push(dupla);

      console.log(
        `         Dupla ${duplas.length}: ${jogador1.jogadorNome} (${
          i + 1
        }º melhor 1º) + ${jogador2.jogadorNome} (${i + metade + 1}º melhor 1º)`
      );
    }

    // Formar duplas: melhores 2º + melhores 2º
    for (let i = 0; i < metade; i++) {
      const jogador1 = segundos[i];
      const jogador2 = segundos[i + metade];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );

      duplas.push(dupla);

      console.log(
        `         Dupla ${duplas.length}: ${jogador1.jogadorNome} (${
          i + 1
        }º melhor 2º) + ${jogador2.jogadorNome} (${i + metade + 1}º melhor 2º)`
      );
    }

    console.log("      ⚔️ Confrontos esperados:");
    console.log(
      `         Semi 1: Dupla 1 (elite 1º) vs Dupla ${duplas.length} (piores 2º)`
    );
    console.log(`         Semi 2: Dupla 2 (piores 1º) vs Dupla 3 (elite 2º)`);

    return duplas;
  }

  /**
   * OPÇÃO 2: Pareamento por Ranking
   *
   * Lógica: Pareia por posição relativa (equilibrado + meritocracia)
   * - 1º melhor 1º + 1º melhor 2º = SEED 1
   * - 2º melhor 1º + 2º melhor 2º = SEED 2
   * - 3º melhor 1º + 3º melhor 2º = SEED 3
   * - 4º melhor 1º + 4º melhor 2º = SEED 4
   *
   * Confronto: Seed vs Seed (melhor vs pior)
   */
  private async formarDuplasPareamentoPorRanking(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[],
    totalGrupos: number,
    _classificadosPorGrupo: number
  ): Promise<Dupla[]> {
    console.log("      📊 OPÇÃO 2: Pareamento por Ranking");

    // Separar 1º lugares e 2º lugares
    const primeiros: EstatisticasJogador[] = [];
    const segundos: EstatisticasJogador[] = [];

    for (const jogador of classificados) {
      if (jogador.posicaoGrupo === 1) {
        primeiros.push(jogador);
      } else if (jogador.posicaoGrupo === 2) {
        segundos.push(jogador);
      }
    }

    // Ordenar por desempenho (critérios de desempate)
    const ordenar = (a: EstatisticasJogador, b: EstatisticasJogador) => {
      // 1. Vitórias
      if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
      // 2. Saldo de games
      if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
      // 3. Sorteio
      return Math.random() - 0.5;
    };

    primeiros.sort(ordenar);
    segundos.sort(ordenar);

    console.log("      📊 Ranking dos 1º lugares:");
    primeiros.forEach((j, i) => {
      console.log(
        `         ${i + 1}º: ${j.jogadorNome} (${j.vitorias}V, ${
          j.saldoGames > 0 ? "+" : ""
        }${j.saldoGames})`
      );
    });

    console.log("      📊 Ranking dos 2º lugares:");
    segundos.forEach((j, i) => {
      console.log(
        `         ${i + 1}º: ${j.jogadorNome} (${j.vitorias}V, ${
          j.saldoGames > 0 ? "+" : ""
        }${j.saldoGames})`
      );
    });

    const duplas: Dupla[] = [];

    // Parear: i-ésimo melhor 1º + i-ésimo melhor 2º
    for (let i = 0; i < totalGrupos; i++) {
      const jogador1 = primeiros[i]; // i-ésimo melhor 1º lugar
      const jogador2 = segundos[i]; // i-ésimo melhor 2º lugar

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );

      duplas.push(dupla);

      console.log(
        `         Dupla ${duplas.length} (SEED ${i + 1}): ${
          jogador1.jogadorNome
        } (${i + 1}º melhor 1º) + ${jogador2.jogadorNome} (${i + 1}º melhor 2º)`
      );
    }

    console.log("      ⚔️ Confrontos esperados (seed vs seed):");
    const totalDuplas = duplas.length;
    for (let i = 0; i < Math.floor(totalDuplas / 2); i++) {
      const seed1 = i + 1;
      const seed2 = totalDuplas - i;
      console.log(`         Semi ${i + 1}: SEED ${seed1} vs SEED ${seed2}`);
    }

    return duplas;
  }

  /**
   * OPÇÃO 3: Sorteio Aleatório
   *
   * - Embaralha classificados
   * - Protege contra jogadores do mesmo grupo
   * - Forma duplas aleatoriamente
   */
  private async formarDuplasSorteioAleatorio(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[]
  ): Promise<Dupla[]> {
    console.log("      🎲 OPÇÃO 3: Sorteio Aleatório");

    const jogadoresDisponiveis = this.embaralhar([...classificados]);
    const duplas: Dupla[] = [];
    const usados = new Set<string>();

    let tentativas = 0;
    const maxTentativas = 1000;

    while (jogadoresDisponiveis.length > 0 && tentativas < maxTentativas) {
      tentativas++;

      if (jogadoresDisponiveis.length === 1) {
        throw new Error("Número ímpar de classificados");
      }

      const jogador1 = jogadoresDisponiveis[0];

      // Procurar parceiro que não seja do mesmo grupo
      let jogador2Index = -1;

      for (let i = 1; i < jogadoresDisponiveis.length; i++) {
        const candidato = jogadoresDisponiveis[i];

        if (
          !usados.has(jogador1.jogadorId) &&
          !usados.has(candidato.jogadorId) &&
          jogador1.grupoId !== candidato.grupoId
        ) {
          jogador2Index = i;
          break;
        }
      }

      if (jogador2Index === -1) {
        // Não encontrou, embaralhar novamente
        const temp = jogadoresDisponiveis.shift()!;
        jogadoresDisponiveis.push(temp);
        continue;
      }

      const jogador2 = jogadoresDisponiveis[jogador2Index];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );

      duplas.push(dupla);

      console.log(
        `         Dupla ${duplas.length}: ${jogador1.jogadorNome} (${jogador1.grupoNome}) + ${jogador2.jogadorNome} (${jogador2.grupoNome})`
      );

      usados.add(jogador1.jogadorId);
      usados.add(jogador2.jogadorId);

      jogadoresDisponiveis.splice(jogador2Index, 1);
      jogadoresDisponiveis.shift();
    }

    if (tentativas >= maxTentativas) {
      throw new Error("Não foi possível formar duplas sem repetir grupos");
    }

    return duplas;
  }

  /**
   * Criar dupla fixa para fase eliminatória
   */
  private async criarDupla(
    etapaId: string,
    arenaId: string,
    jogador1: EstatisticasJogador,
    jogador2: EstatisticasJogador,
    _ordem: number
  ): Promise<Dupla> {
    const dupla: Dupla = {
      id: "",
      etapaId,
      arenaId,
      jogador1Id: jogador1.jogadorId,
      jogador1Nome: jogador1.jogadorNome,
      jogador1Nivel: jogador1.jogadorNivel ? String(jogador1.jogadorNivel) : "",
      jogador2Id: jogador2.jogadorId,
      jogador2Nome: jogador2.jogadorNome,
      jogador2Nivel: jogador2.jogadorNivel ? String(jogador2.jogadorNivel) : "",
      grupoId: "", // Sem grupo na fase eliminatória
      grupoNome: "Eliminatória",
      jogos: 0,
      vitorias: 0,
      derrotas: 0,
      pontos: 0,
      setsVencidos: 0,
      setsPerdidos: 0,
      saldoSets: 0,
      gamesVencidos: 0,
      gamesPerdidos: 0,
      saldoGames: 0,
      posicaoGrupo: 0,
      classificada: true, // Já estão na eliminatória
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };

    const docRef = await db.collection("duplas").add(dupla);
    dupla.id = docRef.id;
    await docRef.update({ id: docRef.id });

    return dupla;
  }

  /**
   * Gerar confrontos eliminatórios com chaveamento tradicional
   */
  private async gerarConfrontosEliminatorios(
    etapaId: string,
    arenaId: string,
    duplas: Dupla[]
  ): Promise<ConfrontoEliminatorio[]> {
    const confrontos: ConfrontoEliminatorio[] = [];

    // Calcular BYEs
    const totalDuplas = duplas.length;
    const proximaPotencia = Math.pow(2, Math.ceil(Math.log2(totalDuplas)));
    const byes = proximaPotencia - totalDuplas;

    console.log(`      🎲 BYEs: ${byes}`);

    let ordem = 1;

    // Gerar BYEs para as melhores duplas
    for (let i = 0; i < byes; i++) {
      const dupla = duplas[i];

      const confronto: ConfrontoEliminatorio = {
        id: "",
        etapaId,
        arenaId,
        fase: this.determinarTipoFase(totalDuplas),
        ordem: ordem++,
        dupla1Id: dupla.id,
        dupla1Nome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
        dupla1Origem: `Dupla ${i + 1}`,
        status: StatusConfrontoEliminatorio.BYE,
        vencedoraId: dupla.id,
        vencedoraNome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      };

      const docRef = await db
        .collection("confrontos_eliminatorios")
        .add(confronto);
      confronto.id = docRef.id;
      await docRef.update({ id: docRef.id });

      confrontos.push(confronto);
    }

    // Gerar confrontos reais (seed i vs seed n-i)
    const confrontosReais = (totalDuplas - byes) / 2;

    for (let i = 0; i < confrontosReais; i++) {
      const seed1Index = byes + i;
      const seed2Index = totalDuplas - 1 - i;

      const dupla1 = duplas[seed1Index];
      const dupla2 = duplas[seed2Index];

      const confronto: ConfrontoEliminatorio = {
        id: "",
        etapaId,
        arenaId,
        fase: this.determinarTipoFase(totalDuplas),
        ordem: ordem++,
        dupla1Id: dupla1.id,
        dupla1Nome: `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`,
        dupla1Origem: `Dupla ${seed1Index + 1}`,
        dupla2Id: dupla2.id,
        dupla2Nome: `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`,
        dupla2Origem: `Dupla ${seed2Index + 1}`,
        status: StatusConfrontoEliminatorio.AGENDADA,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      };

      const docRef = await db
        .collection("confrontos_eliminatorios")
        .add(confronto);
      confronto.id = docRef.id;
      await docRef.update({ id: docRef.id });

      confrontos.push(confronto);
    }

    console.log(`      ✅ ${confrontos.length} confrontos gerados`);

    return confrontos;
  }

  /**
   * Determinar tipo da fase baseado no número de duplas
   */
  private determinarTipoFase(totalDuplas: number): TipoFase {
    if (totalDuplas > 8) return TipoFase.OITAVAS;
    if (totalDuplas > 4) return TipoFase.QUARTAS;
    if (totalDuplas > 2) return TipoFase.SEMIFINAL;
    return TipoFase.FINAL;
  }
}

export default new ReiDaPraiaService();
