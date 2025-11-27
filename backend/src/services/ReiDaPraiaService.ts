/**
 * ReiDaPraiaService.ts
 * Service para gerenciar formato Rei da Praia
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
import logger from "../utils/logger";

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

      const jogadores = await this.distribuirJogadoresEmGrupos(
        etapaId,
        arenaId,
        inscricoes
      );

      const grupos = await this.criarGrupos(etapaId, arenaId, jogadores);

      const partidas = await this.gerarPartidas(etapaId, arenaId, grupos);

      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: true,
        dataGeracaoChaves: Timestamp.now(),
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Chaves Rei da Praia geradas", {
        etapaId,
        arenaId,
        totalJogadores: jogadores.length,
        totalGrupos: grupos.length,
        totalPartidas: partidas.length,
      });

      return { jogadores, grupos, partidas };
    } catch (error: any) {
      logger.error(
        "Erro ao gerar chaves rei da praia",
        {
          etapaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Distribuir jogadores em grupos de 4
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

      // Separar cabeças de chave
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(
        arenaId,
        etapaId
      );
      const inscricoesCabecas: Inscricao[] = [];
      const inscricoesNormais: Inscricao[] = [];

      for (const inscricao of inscricoes) {
        if (cabecasIds.includes(inscricao.jogadorId)) {
          inscricoesCabecas.push(inscricao);
        } else {
          inscricoesNormais.push(inscricao);
        }
      }

      if (inscricoesCabecas.length > numGrupos) {
        throw new Error(
          `Número de cabeças de chave (${inscricoesCabecas.length}) não pode ser maior que número de grupos (${numGrupos})`
        );
      }

      // Embaralhar
      const cabecasEmbaralhadas = this.embaralhar([...inscricoesCabecas]);
      const normaisEmbaralhados = this.embaralhar([...inscricoesNormais]);

      // Distribuir cabeças primeiro (1 por grupo)
      const gruposComCabecas: Inscricao[][] = [];
      for (let i = 0; i < numGrupos; i++) {
        const grupo: Inscricao[] = [];
        if (i < cabecasEmbaralhadas.length) {
          grupo.push(cabecasEmbaralhadas[i]);
        }
        gruposComCabecas.push(grupo);
      }

      // Distribuir jogadores normais
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

      // Criar estatísticas para cada jogador
      for (let grupoIndex = 0; grupoIndex < numGrupos; grupoIndex++) {
        const nomeGrupo = `Grupo ${letras[grupoIndex]}`;
        const jogadoresGrupo = gruposComCabecas[grupoIndex];

        for (const inscricao of jogadoresGrupo) {
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
        }
      }

      return jogadores;
    } catch (error) {
      logger.error(
        "Erro ao distribuir jogadores",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
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

      // Agrupar jogadores por nome do grupo
      for (const jogador of jogadores) {
        if (!jogadoresPorGrupo.has(jogador.grupoNome!)) {
          jogadoresPorGrupo.set(jogador.grupoNome!, []);
        }
        jogadoresPorGrupo.get(jogador.grupoNome!)!.push(jogador);
      }

      // Criar documento de grupo para cada conjunto
      let grupoIndex = 0;
      for (const [nomeGrupo, jogadoresGrupo] of jogadoresPorGrupo) {
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

        // Atualizar grupoId em cada jogador
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
      logger.error(
        "Erro ao criar grupos",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
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
      logger.error(
        "Erro ao gerar partidas",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
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
      // Partida 1: A+B vs C+D
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
      // Partida 2: A+C vs B+D
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
      // Partida 3: A+D vs B+C
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
   * Registrar resultado de partida
   *
   * IMPORTANTE: Esta função atualiza estatísticas dos 4 jogadores.
   * - Se fase = GRUPOS: atualiza campos *Grupo + campos globais
   * - Se fase = ELIMINATORIA: atualiza apenas campos globais
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

      if (!partidaDoc.exists) {
        throw new Error("Partida não encontrada");
      }

      const partida = {
        id: partidaDoc.id,
        ...partidaDoc.data(),
      } as PartidaReiDaPraia;

      if (partida.arenaId !== arenaId) {
        throw new Error("Partida não pertence a esta arena");
      }

      const isEdicao = partida.status === StatusPartida.FINALIZADA;
      if (isEdicao && partida.placar && partida.placar.length > 0) {
        await this.reverterEstatisticasJogadores(partida);
      }

      // Validar placar (apenas 1 set no Rei da Praia)
      if (placar.length !== 1) {
        throw new Error("Placar inválido: deve ter apenas 1 set");
      }

      const set = placar[0];
      const setsDupla1 = set.gamesDupla1 > set.gamesDupla2 ? 1 : 0;
      const setsDupla2 = set.gamesDupla1 > set.gamesDupla2 ? 0 : 1;

      // Vencedores são os 2 jogadores da dupla vencedora
      const vencedores =
        setsDupla1 > setsDupla2
          ? [partida.jogador1AId, partida.jogador1BId]
          : [partida.jogador2AId, partida.jogador2BId];

      // Atualizar documento da partida
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

      await this.atualizarEstatisticasJogadores(
        partida,
        vencedores,
        setsDupla1,
        setsDupla2,
        set.gamesDupla1,
        set.gamesDupla2
      );

      // Recalcular classificação do grupo (se for fase de grupos)
      if (partida.grupoId && partida.fase === FaseEtapa.GRUPOS) {
        await this.recalcularClassificacaoGrupo(
          partida.grupoId,
          partida.etapaId
        );
      }

      logger.info("Resultado partida Rei da Praia registrado", {
        partidaId,
        etapaId: partida.etapaId,
        fase: partida.fase,
        grupoNome: partida.grupoNome,
        vencedores: vencedores.join(", "),
        placar: `${set.gamesDupla1}-${set.gamesDupla2}`,
        isEdicao,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultado",
        {
          partidaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Atualizar estatísticas dos 4 jogadores após resultado
   *
   * IMPORTANTE: Esta função delega para estatisticasJogadorService
   * que internamente decide se atualiza campos *Grupo baseado na fase.
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

      //  Se for FASE DE GRUPOS, usa função específica que atualiza campos *Grupo
      if (partida.fase === FaseEtapa.GRUPOS) {
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
      } else {
        //  Se for ELIMINATÓRIA, usa função genérica que atualiza apenas globais
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
  }

  /**
   * Reverter estatísticas dos 4 jogadores (usado em edição de resultado)
   *
   * IMPORTANTE: Também considera a fase para reverter corretamente.
   */
  private async reverterEstatisticasJogadores(
    partida: PartidaReiDaPraia
  ): Promise<void> {
    if (!partida.vencedores || !partida.placar || partida.placar.length === 0) {
      return;
    }

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

      //  Se for FASE DE GRUPOS, reverte campos *Grupo também
      if (partida.fase === FaseEtapa.GRUPOS) {
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
      } else {
        //  Se for ELIMINATÓRIA, reverte apenas campos globais
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
  }

  /**
   * Recalcular classificação do grupo
   *
   * IMPORTANTE: A classificação do grupo DEVE usar apenas as estatísticas
   * do grupo, não as globais que incluem eliminatória.
   */
  private async recalcularClassificacaoGrupo(
    grupoId: string,
    etapaId: string
  ): Promise<void> {
    const jogadores = await estatisticasJogadorService.buscarPorGrupo(grupoId);

    const jogadoresOrdenados = [...jogadores].sort((a, b) => {
      // 1. Pontos do GRUPO (3 por vitória)
      if (a.pontosGrupo !== b.pontosGrupo) {
        return b.pontosGrupo - a.pontosGrupo;
      }

      // 2. Vitórias do GRUPO
      if (a.vitoriasGrupo !== b.vitoriasGrupo) {
        return b.vitoriasGrupo - a.vitoriasGrupo;
      }

      // 3. Saldo de games do GRUPO
      if (a.saldoGamesGrupo !== b.saldoGamesGrupo) {
        return b.saldoGamesGrupo - a.saldoGamesGrupo;
      }

      // 4. Games vencidos do GRUPO
      if (a.gamesVencidosGrupo !== b.gamesVencidosGrupo) {
        return b.gamesVencidosGrupo - a.gamesVencidosGrupo;
      }

      // 5. Saldo de sets do GRUPO (desempate final)
      if (a.saldoSetsGrupo !== b.saldoSetsGrupo) {
        return b.saldoSetsGrupo - a.saldoSetsGrupo;
      }

      return 0;
    });

    // Atualizar posição de cada jogador
    for (let i = 0; i < jogadoresOrdenados.length; i++) {
      await estatisticasJogadorService.atualizarPosicaoGrupo(
        jogadoresOrdenados[i].jogadorId,
        etapaId,
        i + 1
      );
    }

    // Verificar se grupo está completo (3 partidas finalizadas)
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

  /**
   * Embaralhar array (Fisher-Yates)
   */
  private embaralhar<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Buscar jogadores da etapa
   */
  async buscarJogadores(
    etapaId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]> {
    return await estatisticasJogadorService.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar partidas da etapa
   */
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
   * Gerar fase eliminatória com duplas fixas
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
    // ✅ ADICIONAR LOG AQUI (NO TOPO DA FUNÇÃO)
    console.log("⚙️ [BACKEND SERVICE] gerarFaseEliminatoria chamada com:", {
      etapaId,
      arenaId,
      classificadosPorGrupo,
      tipoChaveamento,
      tipoDoTipoChaveamento: typeof tipoChaveamento, // Ver o tipo
    });
    try {
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

      if (grupos.length === 1) {
        throw new Error(
          "Não é possível gerar fase eliminatória com apenas 1 grupo"
        );
      }

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

      // Marcar jogadores como classificados
      for (const jogador of todosClassificados) {
        await estatisticasJogadorService.marcarComoClassificado(
          jogador.jogadorId,
          etapaId,
          true
        );
      }

      // Formar duplas fixas baseado no tipo de chaveamento
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

      // Gerar confrontos eliminatórios
      const confrontos = await this.gerarConfrontosEliminatorios(
        etapaId,
        arenaId,
        duplas
      );

      // Atualizar status da etapa
      await db.collection("etapas").doc(etapaId).update({
        status: StatusEtapa.FASE_ELIMINATORIA,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Fase eliminatória Rei da Praia gerada", {
        etapaId,
        arenaId,
        tipoChaveamento,
        totalGrupos: grupos.length,
        totalClassificados: todosClassificados.length,
        totalDuplas: duplas.length,
        totalConfrontos: confrontos.length,
      });

      return { duplas, confrontos };
    } catch (error: any) {
      logger.error(
        "Erro ao gerar fase eliminatória",
        {
          etapaId,
          arenaId,
          tipoChaveamento,
        },
        error
      );
      throw error;
    }
  }

  /**
   * OPÇÃO 1: Melhores com Melhores
   * - Duplas fortes: Melhores 1º entre si
   * - Duplas equilibradas: Piores 1º + Melhores 2º
   * - Duplas fracas: Piores 2º entre si
   */
  private async formarDuplasMelhoresComMelhores(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[],
    totalGrupos: number,
    _classificadosPorGrupo: number
  ): Promise<Dupla[]> {
    const primeiros: EstatisticasJogador[] = [];
    const segundos: EstatisticasJogador[] = [];

    // Separar por posição no grupo
    for (const jogador of classificados) {
      if (jogador.posicaoGrupo === 1) {
        primeiros.push(jogador);
      } else if (jogador.posicaoGrupo === 2) {
        segundos.push(jogador);
      }
    }

    const ordenar = (a: EstatisticasJogador, b: EstatisticasJogador) => {
      if (a.pontosGrupo !== b.pontosGrupo) {
        return b.pontosGrupo - a.pontosGrupo;
      }
      if (a.vitoriasGrupo !== b.vitoriasGrupo) {
        return b.vitoriasGrupo - a.vitoriasGrupo;
      }
      if (a.saldoGamesGrupo !== b.saldoGamesGrupo) {
        return b.saldoGamesGrupo - a.saldoGamesGrupo;
      }
      return Math.random() - 0.5;
    };

    primeiros.sort(ordenar);
    segundos.sort(ordenar);

    const duplas: Dupla[] = [];
    const primeirosUsados = new Set<number>();
    const segundosUsados = new Set<number>();

    // FASE 1: DUPLAS FORTES (melhores 1º entre si)
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
    }

    // FASE 2: DUPLAS EQUILIBRADAS (piores 1º + melhores 2º)
    const primeirosRestantes = primeiros.filter(
      (_, idx) => !primeirosUsados.has(idx)
    );
    const segundosRestantes = segundos.filter(
      (_, idx) => !segundosUsados.has(idx)
    );

    const numEquilibradas = totalGrupos % 2;

    for (let i = 0; i < numEquilibradas; i++) {
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

      const index1 = primeiros.findIndex(
        (p) => p.jogadorId === jogador1.jogadorId
      );
      const index2 = segundos.findIndex(
        (s) => s.jogadorId === jogador2.jogadorId
      );
      primeirosUsados.add(index1);
      segundosUsados.add(index2);
    }

    // FASE 3: DUPLAS FRACAS (piores 2º entre si)
    const segundosRestantes2 = segundos.filter(
      (_, idx) => !segundosUsados.has(idx)
    );

    for (let i = 0; i < segundosRestantes2.length; i += 2) {
      if (i + 1 < segundosRestantes2.length) {
        const jogador1 = segundosRestantes2[i];
        const jogador2 = segundosRestantes2[i + 1];

        const dupla = await this.criarDupla(
          etapaId,
          arenaId,
          jogador1,
          jogador2,
          duplas.length + 1
        );
        duplas.push(dupla);
      }
    }

    if (duplas.length !== totalGrupos) {
      throw new Error(
        `Erro: formou ${duplas.length} duplas para ${totalGrupos} grupos!`
      );
    }

    return duplas;
  }

  /**
   * OPÇÃO 2: Pareamento por Ranking (Cruzado)
   * - Separa classificados em 2 rankings: 1º lugares e 2º lugares
   * - Ordena cada ranking separadamente
   * - Pareia: melhor 1º com melhor 2º, 2º melhor 1º com 2º melhor 2º, etc.
   * - Equilibra experiência entre líderes e vice-líderes
   */
  private async formarDuplasPareamentoPorRanking(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[],
    totalGrupos: number,
    _classificadosPorGrupo: number
  ): Promise<Dupla[]> {
    logger.info("Formando duplas por pareamento por ranking cruzado", {
      etapaId,
      totalClassificados: classificados.length,
      totalGrupos,
    });

    // ✅ PASSO 1: Separar em 2 listas (1º lugares e 2º lugares)
    const primeiros: EstatisticasJogador[] = [];
    const segundos: EstatisticasJogador[] = [];

    for (const jogador of classificados) {
      if (jogador.posicaoGrupo === 1) {
        primeiros.push(jogador);
      } else if (jogador.posicaoGrupo === 2) {
        segundos.push(jogador);
      }
    }

    // ✅ PASSO 2: Função de ordenação (por estatísticas do grupo)
    const ordenar = (a: EstatisticasJogador, b: EstatisticasJogador) => {
      // 1. Pontos do grupo
      if (a.pontosGrupo !== b.pontosGrupo) {
        return b.pontosGrupo - a.pontosGrupo;
      }

      // 2. Vitórias do grupo
      if (a.vitoriasGrupo !== b.vitoriasGrupo) {
        return b.vitoriasGrupo - a.vitoriasGrupo;
      }

      // 3. Saldo de games do grupo
      if (a.saldoGamesGrupo !== b.saldoGamesGrupo) {
        return b.saldoGamesGrupo - a.saldoGamesGrupo;
      }

      // 4. Games vencidos do grupo
      if (a.gamesVencidosGrupo !== b.gamesVencidosGrupo) {
        return b.gamesVencidosGrupo - a.gamesVencidosGrupo;
      }

      // 5. Saldo de sets do grupo
      if (a.saldoSetsGrupo !== b.saldoSetsGrupo) {
        return b.saldoSetsGrupo - a.saldoSetsGrupo;
      }

      // 6. Desempate aleatório
      return Math.random() - 0.5;
    };

    // ✅ PASSO 3: Ordenar cada ranking separadamente
    primeiros.sort(ordenar);
    segundos.sort(ordenar);

    logger.info("Rankings calculados", {
      rankingPrimeiros: primeiros.map((j, idx) => ({
        posicao: idx + 1,
        jogador: j.jogadorNome,
        grupo: j.grupoNome,
        pontosGrupo: j.pontosGrupo,
        saldoGamesGrupo: j.saldoGamesGrupo,
      })),
      rankingSegundos: segundos.map((j, idx) => ({
        posicao: idx + 1,
        jogador: j.jogadorNome,
        grupo: j.grupoNome,
        pontosGrupo: j.pontosGrupo,
        saldoGamesGrupo: j.saldoGamesGrupo,
      })),
    });

    // ✅ PASSO 4: Parear por índice (cruzamento entre rankings)
    const duplas: Dupla[] = [];

    for (let i = 0; i < totalGrupos; i++) {
      const jogador1 = primeiros[i]; // Melhor 1º, 2º melhor 1º, 3º melhor 1º...
      const jogador2 = segundos[i]; // Melhor 2º, 2º melhor 2º, 3º melhor 2º...

      logger.info("Formando dupla por pareamento cruzado", {
        duplaOrdem: i + 1,
        jogador1: {
          nome: jogador1.jogadorNome,
          grupo: jogador1.grupoNome,
          posicaoGrupo: jogador1.posicaoGrupo,
          posicaoRanking: i + 1,
          pontosGrupo: jogador1.pontosGrupo,
        },
        jogador2: {
          nome: jogador2.jogadorNome,
          grupo: jogador2.grupoNome,
          posicaoGrupo: jogador2.posicaoGrupo,
          posicaoRanking: i + 1,
          pontosGrupo: jogador2.pontosGrupo,
        },
      });

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        i + 1
      );

      duplas.push(dupla);
    }

    logger.info("Duplas formadas por pareamento cruzado", {
      totalDuplas: duplas.length,
      duplas: duplas.map((d, idx) => ({
        posicao: idx + 1, // ✅ Usar índice ao invés de d.ordem
        nome: `${d.jogador1Nome} & ${d.jogador2Nome}`, // ✅ Construir dinamicamente
        jogador1: {
          id: d.jogador1Id,
          nome: d.jogador1Nome,
          nivel: d.jogador1Nivel,
        },
        jogador2: {
          id: d.jogador2Id,
          nome: d.jogador2Nome,
          nivel: d.jogador2Nivel,
        },
      })),
    });

    return duplas;
  }

  /**
   * OPÇÃO 3: Sorteio Aleatório
   * - Sorteia duplas evitando jogadores do mesmo grupo
   */
  private async formarDuplasSorteioAleatorio(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[]
  ): Promise<Dupla[]> {
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

      let jogador2Index = -1;

      // Procurar dupla de grupo diferente
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
   * Gerar confrontos eliminatórios
   */
  private async gerarConfrontosEliminatorios(
    etapaId: string,
    arenaId: string,
    duplas: Dupla[]
  ): Promise<ConfrontoEliminatorio[]> {
    const confrontos: ConfrontoEliminatorio[] = [];

    const totalDuplas = duplas.length;
    const proximaPotencia = Math.pow(2, Math.ceil(Math.log2(totalDuplas)));
    const byes = proximaPotencia - totalDuplas;

    let ordem = 1;

    // Confrontos com BYE (duplas que passam direto)
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

    // Confrontos reais (pares de duplas)
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
   * Cancelar fase eliminatória
   *
   * IMPORTANTE: Reverte estatísticas GLOBAIS (não do grupo) porque
   * a eliminatória não afeta as estatísticas do grupo.
   */
  async cancelarFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    try {
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

      const partidasSnapshot = await db
        .collection("partidas")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("tipo", "==", "eliminatoria")
        .get();

      let partidasRevertidas = 0;

      // Reverter partidas finalizadas (atualiza apenas estatísticas GLOBAIS)
      if (!partidasSnapshot.empty) {
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

              partidasRevertidas++;
            }
          }
        }

        // Excluir partidas
        const partidasBatch = db.batch();
        partidasSnapshot.docs.forEach((doc) => {
          partidasBatch.delete(doc.ref);
        });
        await partidasBatch.commit();
      }

      // Excluir confrontos
      const confrontosBatch = db.batch();
      confrontosSnapshot.docs.forEach((doc) => {
        confrontosBatch.delete(doc.ref);
      });
      await confrontosBatch.commit();

      // Excluir duplas
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
      }

      // Desmarcar jogadores como classificados
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
      }

      // Voltar status da etapa
      await db.collection("etapas").doc(etapaId).update({
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Fase eliminatória Rei da Praia cancelada", {
        etapaId,
        arenaId,
        confrontosRemovidos: confrontosSnapshot.size,
        partidasRemovidas: partidasSnapshot.size,
        partidasRevertidas,
        duplasRemovidas: duplasSnapshot.size,
        jogadoresDesmarcados: estatisticasSnapshot.size,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao cancelar fase eliminatória",
        {
          etapaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }
}

export default new ReiDaPraiaService();
