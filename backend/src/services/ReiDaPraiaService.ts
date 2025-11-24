/**
 * ReiDaPraiaService.ts - VERSÃO CORRIGIDA
 *
 * CORREÇÕES:
 * - ✅ Lógica "Melhores com Melhores" corrigida para número ímpar de grupos
 * - ✅ Forma duplas: FORTES (melhores 1º), EQUILIBRADAS (meio), FRACAS (piores 2º)
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
import cabecaDeChaveService from "./CabecaDeChaveService";

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
      const jogadores: EstatisticasJogador[] = [];
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numGrupos = inscricoes.length / 4;

      console.log(`   📦 Criando ${numGrupos} grupos de 4 jogadores cada`);

      // 1. Identificar cabeças de chave
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(arenaId);
      const inscricoesCabecas: Inscricao[] = [];
      const inscricoesNormais: Inscricao[] = [];

      for (const inscricao of inscricoes) {
        if (cabecasIds.includes(inscricao.jogadorId)) {
          inscricoesCabecas.push(inscricao);
        } else {
          inscricoesNormais.push(inscricao);
        }
      }

      console.log(
        `   🏆 ${inscricoesCabecas.length} cabeças de chave identificadas`
      );
      console.log(`   👥 ${inscricoesNormais.length} jogadores normais`);

      // 2. Validar número de cabeças
      if (inscricoesCabecas.length > numGrupos) {
        throw new Error(
          `Número de cabeças de chave (${inscricoesCabecas.length}) não pode ser maior que número de grupos (${numGrupos})`
        );
      }

      // 3. Embaralhar
      const cabecasEmbaralhadas = this.embaralhar([...inscricoesCabecas]);
      const normaisEmbaralhados = this.embaralhar([...inscricoesNormais]);

      // 4. Distribuir cabeças de chave (1 por grupo)
      const gruposComCabecas: Inscricao[][] = [];

      for (let i = 0; i < numGrupos; i++) {
        const grupo: Inscricao[] = [];

        // Adicionar cabeça se disponível
        if (i < cabecasEmbaralhadas.length) {
          grupo.push(cabecasEmbaralhadas[i]);
          console.log(
            `      🏆 Grupo ${letras[i]}: ${cabecasEmbaralhadas[i].jogadorNome} (cabeça)`
          );
        }

        gruposComCabecas.push(grupo);
      }

      // 5. Distribuir jogadores normais (round-robin até completar 4 por grupo)
      let indexNormal = 0;

      while (indexNormal < normaisEmbaralhados.length) {
        for (let grupoIndex = 0; grupoIndex < numGrupos; grupoIndex++) {
          if (
            gruposComCabecas[grupoIndex].length < 4 &&
            indexNormal < normaisEmbaralhados.length
          ) {
            gruposComCabecas[grupoIndex].push(normaisEmbaralhados[indexNormal]);
            indexNormal++;
          }
        }
      }

      // 6. Criar estatísticas
      for (let grupoIndex = 0; grupoIndex < numGrupos; grupoIndex++) {
        const nomeGrupo = `Grupo ${letras[grupoIndex]}`;
        const jogadoresGrupo = gruposComCabecas[grupoIndex];

        console.log(`   📦 ${nomeGrupo}: ${jogadoresGrupo.length} jogadores`);

        for (const inscricao of jogadoresGrupo) {
          const ehCabeca = cabecasIds.includes(inscricao.jogadorId);

          const estatisticas = await estatisticasJogadorService.criar({
            etapaId,
            arenaId,
            jogadorId: inscricao.jogadorId,
            jogadorNome: inscricao.jogadorNome,
            jogadorNivel: inscricao.jogadorNivel,
            jogadorGenero: inscricao.jogadorGenero,
            grupoNome: nomeGrupo,
          });

          jogadores.push(estatisticas);

          if (ehCabeca) {
            console.log(
              `         🏆 ${inscricao.jogadorNome} (cabeça de chave)`
            );
          }
        }
      }

      return jogadores;
    } catch (error) {
      console.error("Erro ao distribuir jogadores:", error);
      throw new Error("Falha ao distribuir jogadores");
    }
  }

  /**
   * Validar distribuição de cabeças de chave
   */
  private async validarDistribuicaoCabecas(
    arenaId: string,
    grupos: Grupo[]
  ): Promise<void> {
    try {
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(arenaId);

      for (const grupo of grupos) {
        const jogadoresGrupo = await estatisticasJogadorService.buscarPorGrupo(
          grupo.id
        );

        const cabecasNoGrupo = jogadoresGrupo.filter((j) =>
          cabecasIds.includes(j.jogadorId)
        );

        if (cabecasNoGrupo.length > 1) {
          const nomes = cabecasNoGrupo.map((j) => j.jogadorNome).join(", ");
          throw new Error(
            `Grupo ${grupo.nome} tem mais de uma cabeça de chave: ${nomes}`
          );
        }
      }

      console.log("   ✅ Distribuição de cabeças validada com sucesso");
    } catch (error) {
      console.error("Erro na validação:", error);
      throw error;
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

        await docRef.update({ id: docRef.id });

        // Atualizar grupoId nas estatísticas
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

          await docRef.update({ id: docRef.id });

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

      await estatisticasJogadorService.atualizarAposPartidaGrupo(
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

      await estatisticasJogadorService.reverterAposPartidaGrupo(
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
   * ✅ OPÇÃO 1 CORRIGIDA: Melhores com Melhores
   *
   * Lógica: Agrupa os MELHORES juntos e os PIORES juntos
   *
   * Com 3 grupos (ou ímpar):
   * - Duplas FORTES: melhores 1º lugares entre si
   * - Duplas EQUILIBRADAS: piores 1º + melhores 2º
   * - Duplas FRACAS: piores 2º lugares entre si
   *
   * Com 4 grupos (ou par):
   * - Duplas FORTES: metade superior dos 1º entre si
   * - Duplas FRACAS: metade inferior dos 2º entre si
   */
  private async formarDuplasMelhoresComMelhores(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[],
    totalGrupos: number,
    _classificadosPorGrupo: number
  ): Promise<Dupla[]> {
    console.log("      🏆 OPÇÃO 1: Melhores com Melhores");

    const primeiros: EstatisticasJogador[] = [];
    const segundos: EstatisticasJogador[] = [];

    for (const jogador of classificados) {
      if (jogador.posicaoGrupo === 1) {
        primeiros.push(jogador);
      } else if (jogador.posicaoGrupo === 2) {
        segundos.push(jogador);
      }
    }

    const ordenar = (a: EstatisticasJogador, b: EstatisticasJogador) => {
      if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
      if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
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
    const primeirosUsados = new Set<number>();
    const segundosUsados = new Set<number>();

    // 1. DUPLAS FORTES
    console.log("      💪 Formando duplas FORTES (melhores 1º entre si):");
    const numParesFortes = Math.floor(totalGrupos / 2);

    for (let i = 0; i < numParesFortes * 2; i += 2) {
      const jogador1 = primeiros[i];
      const jogador2 = primeiros[i + 1];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );
      duplas.push(dupla);
      primeirosUsados.add(i);
      primeirosUsados.add(i + 1);

      console.log(
        `         Dupla ${duplas.length} (FORTE): ${jogador1.jogadorNome} + ${jogador2.jogadorNome}`
      );
    }

    // 2. DUPLAS FRACAS
    console.log("      👥 Formando duplas FRACAS (piores 2º entre si):");
    const numParesFracos = Math.floor(totalGrupos / 2);
    const inicio2Piores = totalGrupos - numParesFracos * 2;

    for (let i = inicio2Piores; i < totalGrupos - 1; i += 2) {
      // ✅ MUDANÇA AQUI: -1
      const jogador1 = segundos[i];
      const jogador2 = segundos[i + 1];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );
      duplas.push(dupla);
      segundosUsados.add(i);
      segundosUsados.add(i + 1);

      console.log(
        `         Dupla ${duplas.length} (FRACA): ${jogador1.jogadorNome} + ${jogador2.jogadorNome}`
      );
    }

    // 3. DUPLAS EQUILIBRADAS
    console.log(
      "      ⚖️ Formando duplas EQUILIBRADAS (piores 1º + melhores 2º):"
    );
    const primeirosRestantes = primeiros.filter(
      (_, idx) => !primeirosUsados.has(idx)
    );
    const segundosRestantes = segundos.filter(
      (_, idx) => !segundosUsados.has(idx)
    );

    for (
      let i = 0;
      i < Math.min(primeirosRestantes.length, segundosRestantes.length);
      i++
    ) {
      const jogador1 = primeirosRestantes[i];
      const jogador2 = segundosRestantes[i];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );
      duplas.push(dupla);

      console.log(
        `         Dupla ${duplas.length} (EQUILIBRADA): ${jogador1.jogadorNome} + ${jogador2.jogadorNome}`
      );
    }

    // VALIDAÇÃO
    if (duplas.length !== totalGrupos) {
      throw new Error(
        `Erro: formou ${duplas.length} duplas para ${totalGrupos} grupos!`
      );
    }

    console.log(`      ✅ ${duplas.length} duplas formadas corretamente!`);

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
      if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
      if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
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
      const jogador1 = primeiros[i];
      const jogador2 = segundos[i];

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
      jogador1Genero: jogador1.jogadorGenero
        ? String(jogador1.jogadorGenero)
        : "",
      jogador2Id: jogador2.jogadorId,
      jogador2Nome: jogador2.jogadorNome,
      jogador2Nivel: jogador2.jogadorNivel ? String(jogador2.jogadorNivel) : "",
      jogador2Genero: jogador2.jogadorGenero
        ? String(jogador2.jogadorGenero)
        : "",
      grupoId: "",
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
      classificada: true,
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

    console.log(`      🎲 Total de duplas: ${totalDuplas}`);
    console.log(`      🎲 Próxima potência de 2: ${proximaPotencia}`);
    console.log(`      🎲 BYEs necessários: ${byes}`);

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

      console.log(`         BYE: Dupla ${i + 1} avança automaticamente`);
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

      console.log(
        `         Confronto ${ordem - 1}: Dupla ${seed1Index + 1} vs Dupla ${
          seed2Index + 1
        }`
      );
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

  /**
   * Cancelar/Excluir fase eliminatória do Rei da Praia
   */
  async cancelarFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    try {
      console.log("🗑️ Cancelando fase eliminatória Rei da Praia...");

      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.formato !== "rei_da_praia") {
        throw new Error("Esta etapa não é do formato Rei da Praia");
      }

      const confrontosSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      if (confrontosSnapshot.empty) {
        throw new Error("Nenhuma fase eliminatória encontrada para esta etapa");
      }

      console.log(
        `   📊 ${confrontosSnapshot.size} confrontos eliminatórios encontrados`
      );

      // Reverter estatísticas das partidas eliminatórias
      console.log("🔄 Buscando partidas eliminatórias...");

      const partidasSnapshot = await db
        .collection("partidas")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("tipo", "==", "eliminatoria")
        .get();

      if (!partidasSnapshot.empty) {
        console.log(
          `   📊 ${partidasSnapshot.size} partidas eliminatórias encontradas`
        );

        for (const partidaDoc of partidasSnapshot.docs) {
          const partida = {
            id: partidaDoc.id,
            ...partidaDoc.data(),
          } as any;

          if (
            partida.status === StatusPartida.FINALIZADA &&
            partida.placar &&
            partida.placar.length > 0
          ) {
            console.log(`   ↩️ Revertendo partida ${partida.id}...`);

            const dupla1Doc = await db
              .collection("duplas")
              .doc(partida.dupla1Id)
              .get();
            const dupla2Doc = await db
              .collection("duplas")
              .doc(partida.dupla2Id)
              .get();

            if (dupla1Doc.exists && dupla2Doc.exists) {
              const dupla1 = { id: dupla1Doc.id, ...dupla1Doc.data() } as Dupla;
              const dupla2 = { id: dupla2Doc.id, ...dupla2Doc.data() } as Dupla;

              let setsDupla1 = 0;
              let setsDupla2 = 0;
              let gamesVencidosDupla1 = 0;
              let gamesPerdidosDupla1 = 0;
              let gamesVencidosDupla2 = 0;
              let gamesPerdidosDupla2 = 0;

              partida.placar.forEach((set: any) => {
                if (set.gamesDupla1 > set.gamesDupla2) {
                  setsDupla1++;
                } else {
                  setsDupla2++;
                }
                gamesVencidosDupla1 += set.gamesDupla1;
                gamesPerdidosDupla1 += set.gamesDupla2;
                gamesVencidosDupla2 += set.gamesDupla2;
                gamesPerdidosDupla2 += set.gamesDupla1;
              });

              const dupla1Venceu = partida.vencedoraId === dupla1.id;

              await estatisticasJogadorService.reverterAposPartida(
                dupla1.jogador1Id,
                etapaId,
                {
                  venceu: dupla1Venceu,
                  setsVencidos: setsDupla1,
                  setsPerdidos: setsDupla2,
                  gamesVencidos: gamesVencidosDupla1,
                  gamesPerdidos: gamesPerdidosDupla1,
                }
              );

              await estatisticasJogadorService.reverterAposPartida(
                dupla1.jogador2Id,
                etapaId,
                {
                  venceu: dupla1Venceu,
                  setsVencidos: setsDupla1,
                  setsPerdidos: setsDupla2,
                  gamesVencidos: gamesVencidosDupla1,
                  gamesPerdidos: gamesPerdidosDupla1,
                }
              );

              await estatisticasJogadorService.reverterAposPartida(
                dupla2.jogador1Id,
                etapaId,
                {
                  venceu: !dupla1Venceu,
                  setsVencidos: setsDupla2,
                  setsPerdidos: setsDupla1,
                  gamesVencidos: gamesVencidosDupla2,
                  gamesPerdidos: gamesPerdidosDupla2,
                }
              );

              await estatisticasJogadorService.reverterAposPartida(
                dupla2.jogador2Id,
                etapaId,
                {
                  venceu: !dupla1Venceu,
                  setsVencidos: setsDupla2,
                  setsPerdidos: setsDupla1,
                  gamesVencidos: gamesVencidosDupla2,
                  gamesPerdidos: gamesPerdidosDupla2,
                }
              );

              console.log(`      ✅ Estatísticas de 4 jogadores revertidas`);
            }
          }
        }

        console.log("   ✅ Estatísticas individuais revertidas!");

        const partidasBatch = db.batch();
        partidasSnapshot.docs.forEach((doc) => {
          partidasBatch.delete(doc.ref);
        });
        await partidasBatch.commit();
        console.log(
          `   ✅ ${partidasSnapshot.size} partidas eliminatórias excluídas`
        );
      }

      const confrontosBatch = db.batch();
      confrontosSnapshot.docs.forEach((doc) => {
        confrontosBatch.delete(doc.ref);
      });
      await confrontosBatch.commit();
      console.log(
        `   ✅ ${confrontosSnapshot.size} confrontos eliminatórios excluídos`
      );

      console.log("🗑️ Excluindo duplas da eliminatória...");

      const duplasSnapshot = await db
        .collection("duplas")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      if (!duplasSnapshot.empty) {
        const duplasBatch = db.batch();
        duplasSnapshot.docs.forEach((doc) => {
          duplasBatch.delete(doc.ref);
        });
        await duplasBatch.commit();
        console.log(`   ✅ ${duplasSnapshot.size} duplas excluídas`);
      }

      console.log("📊 Desmarcando jogadores como classificados...");

      const estatisticasSnapshot = await db
        .collection("estatisticas_jogador")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      if (!estatisticasSnapshot.empty) {
        const estatisticasBatch = db.batch();
        estatisticasSnapshot.docs.forEach((doc) => {
          estatisticasBatch.update(doc.ref, {
            classificado: false,
            atualizadoEm: Timestamp.now(),
          });
        });
        await estatisticasBatch.commit();
        console.log(
          `   ✅ ${estatisticasSnapshot.size} jogadores desmarcados como classificados`
        );
      }

      await db.collection("etapas").doc(etapaId).update({
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });

      console.log("✅ Fase eliminatória cancelada com sucesso!");
      console.log(
        "💡 Você pode agora ajustar os resultados da fase de grupos e gerar a eliminatória novamente."
      );
    } catch (error: any) {
      console.error("Erro ao cancelar fase eliminatória:", error);
      throw error;
    }
  }
}

export default new ReiDaPraiaService();
