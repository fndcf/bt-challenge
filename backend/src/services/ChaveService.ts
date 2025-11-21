import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { StatusEtapa } from "../models/Etapa";
import { Inscricao, HistoricoParceiro } from "../models/Inscricao";
import { Dupla } from "../models/Dupla";
import { Grupo } from "../models/Grupo";
import { Partida, StatusPartida } from "../models/Partida";
import { FaseEtapa } from "../models/Etapa";
import etapaService from "./EtapaService";
import {
  TipoFase,
  StatusConfrontoEliminatorio,
  ConfrontoEliminatorio,
} from "../models/Eliminatoria";
import estatisticasJogadorService from "./EstatisticasJogadorService";
import cabecaDeChaveService from "./CabecaDeChaveService";
import historicoDuplaService from "./HistoricoDuplaService";
import { EstatisticasCombinacoes } from "../models/HistoricoDupla";

/**
 * Service para geração de chaves (duplas e grupos)
 */
export class ChaveService {
  static buscarConfrontosEliminatorios(_id: any, _arenaId: any, _arg2: any) {
    throw new Error("Method not implemented.");
  }
  private collectionDuplas = "duplas";
  private collectionGrupos = "grupos";
  private collectionPartidas = "partidas";
  private collectionHistorico = "historico_parceiros";

  private mapTipoFaseToFaseEtapa(tipoFase: TipoFase): FaseEtapa {
    const mapping: Record<TipoFase, FaseEtapa> = {
      [TipoFase.OITAVAS]: FaseEtapa.OITAVAS,
      [TipoFase.QUARTAS]: FaseEtapa.QUARTAS,
      [TipoFase.SEMIFINAL]: FaseEtapa.SEMIFINAL,
      [TipoFase.FINAL]: FaseEtapa.FINAL,
    };
    return mapping[tipoFase];
  }

  /**
   * Formar duplas respeitando cabeças de chave
   *
   * ADICIONAR MÉTODO ao ChaveService.ts
   */
  async formarDuplasComCabecasDeChave(
    etapaId: string,
    etapaNome: string,
    arenaId: string,
    inscricoes: Inscricao[]
  ): Promise<Dupla[]> {
    try {
      console.log("👥 Formando duplas com cabeças de chave...");

      // 1. Identificar cabeças de chave
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(arenaId);
      const cabecas: Inscricao[] = [];
      const normais: Inscricao[] = [];

      for (const inscricao of inscricoes) {
        if (cabecasIds.includes(inscricao.jogadorId)) {
          cabecas.push(inscricao);
        } else {
          normais.push(inscricao);
        }
      }

      console.log(`   🏆 ${cabecas.length} cabeças de chave`);
      console.log(`   👥 ${normais.length} jogadores normais`);

      // 2. Calcular estatísticas de combinações
      const stats = await historicoDuplaService.calcularEstatisticas(arenaId);

      console.log(`   📊 Estatísticas:`);
      console.log(
        `      - Combinações possíveis: ${stats.combinacoesPossiveis}`
      );
      console.log(
        `      - Combinações realizadas: ${stats.combinacoesRealizadas}`
      );
      console.log(
        `      - Combinações restantes: ${stats.combinacoesRestantes}`
      );
      console.log(
        `      - Todas feitas? ${stats.todasCombinacoesFeitas ? "SIM" : "NÃO"}`
      );

      // 3. Formar duplas baseado nas regras
      let duplas: Dupla[];

      if (stats.todasCombinacoesFeitas && cabecas.length >= 2) {
        console.log(
          "   ✅ Todas combinações foram feitas, cabeças podem se juntar"
        );
        duplas = await this.formarDuplasLivre(
          etapaId,
          etapaNome,
          arenaId,
          inscricoes
        );
      } else {
        console.log("   🚫 Cabeças não podem se juntar ainda");
        duplas = await this.formarDuplasProtegendoCabecas(
          etapaId,
          etapaNome,
          arenaId,
          cabecas,
          normais,
          stats
        );
      }

      // 4. Registrar duplas no histórico
      for (const dupla of duplas) {
        const ambosForamCabecas =
          cabecasIds.includes(dupla.jogador1Id) &&
          cabecasIds.includes(dupla.jogador2Id);

        await historicoDuplaService.registrar({
          arenaId,
          etapaId,
          etapaNome,
          jogador1Id: dupla.jogador1Id,
          jogador1Nome: dupla.jogador1Nome,
          jogador2Id: dupla.jogador2Id,
          jogador2Nome: dupla.jogador2Nome,
          ambosForamCabecas,
        });
      }

      console.log("✅ Duplas formadas e registradas no histórico");

      return duplas;
    } catch (error) {
      console.error("Erro ao formar duplas com cabeças:", error);
      throw error;
    }
  }

  /**
   * Formar duplas protegendo cabeças de chave
   * Cabeças NÃO podem formar dupla entre si
   */
  private async formarDuplasProtegendoCabecas(
    etapaId: string,
    _etapaNome: string,
    arenaId: string,
    cabecas: Inscricao[],
    normais: Inscricao[],
    _stats: EstatisticasCombinacoes
  ): Promise<Dupla[]> {
    try {
      const duplas: Dupla[] = [];

      // Validar que temos jogadores suficientes
      const totalJogadores = cabecas.length + normais.length;

      if (totalJogadores % 2 !== 0) {
        throw new Error("Número ímpar de jogadores");
      }

      if (cabecas.length > normais.length) {
        throw new Error(
          `Impossível formar duplas: ${cabecas.length} cabeças mas apenas ${normais.length} jogadores normais. ` +
            `Precisa de pelo menos ${cabecas.length} jogadores normais.`
        );
      }

      // Embaralhar
      const cabecasEmbaralhadas = this.embaralhar([...cabecas]);
      const normaisEmbaralhados = this.embaralhar([...normais]);

      // 1. Parear cada cabeça com um jogador normal
      for (let i = 0; i < cabecasEmbaralhadas.length; i++) {
        const cabeca = cabecasEmbaralhadas[i];
        const normal = normaisEmbaralhados[i];

        const dupla = await this.criarDupla(
          etapaId,
          arenaId,
          cabeca,
          normal,
          i + 1
        );

        duplas.push(dupla);

        console.log(
          `      Dupla ${duplas.length}: 🏆 ${cabeca.jogadorNome} + ${normal.jogadorNome}`
        );
      }

      // 2. Parear jogadores normais restantes entre si
      const normaisRestantes = normaisEmbaralhados.slice(
        cabecasEmbaralhadas.length
      );

      for (let i = 0; i < normaisRestantes.length; i += 2) {
        if (i + 1 < normaisRestantes.length) {
          const jogador1 = normaisRestantes[i];
          const jogador2 = normaisRestantes[i + 1];

          const dupla = await this.criarDupla(
            etapaId,
            arenaId,
            jogador1,
            jogador2,
            duplas.length + 1
          );

          duplas.push(dupla);

          console.log(
            `      Dupla ${duplas.length}: ${jogador1.jogadorNome} + ${jogador2.jogadorNome}`
          );
        }
      }

      return duplas;
    } catch (error) {
      console.error("Erro ao formar duplas protegendo cabeças:", error);
      throw error;
    }
  }

  /**
   * Formar duplas livre (quando todas combinações já foram feitas)
   */
  private async formarDuplasLivre(
    etapaId: string,
    _etapaNome: string,
    arenaId: string,
    inscricoes: Inscricao[]
  ): Promise<Dupla[]> {
    try {
      const duplas: Dupla[] = [];

      if (inscricoes.length % 2 !== 0) {
        throw new Error("Número ímpar de jogadores");
      }

      // Embaralhar todos
      const embaralhado = this.embaralhar([...inscricoes]);

      // Formar duplas sequencialmente
      for (let i = 0; i < embaralhado.length; i += 2) {
        const jogador1 = embaralhado[i];
        const jogador2 = embaralhado[i + 1];

        const dupla = await this.criarDupla(
          etapaId,
          arenaId,
          jogador1,
          jogador2,
          duplas.length + 1
        );

        duplas.push(dupla);

        console.log(
          `      Dupla ${duplas.length}: ${jogador1.jogadorNome} + ${jogador2.jogadorNome}`
        );
      }

      return duplas;
    } catch (error) {
      console.error("Erro ao formar duplas livre:", error);
      throw error;
    }
  }

  /**
   * Validar que cabeças não estão juntas
   */
  private async validarDuplasComCabecas(
    arenaId: string,
    duplas: Dupla[]
  ): Promise<void> {
    try {
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(arenaId);

      // Verificar se todas combinações foram feitas
      const stats = await historicoDuplaService.calcularEstatisticas(arenaId);

      // Se todas foram feitas, não precisa validar
      if (stats.todasCombinacoesFeitas) {
        console.log("   ✅ Todas combinações feitas, validação não necessária");
        return;
      }

      // Validar que cabeças não estão juntas
      for (const dupla of duplas) {
        const jogador1EhCabeca = cabecasIds.includes(dupla.jogador1Id);
        const jogador2EhCabeca = cabecasIds.includes(dupla.jogador2Id);

        if (jogador1EhCabeca && jogador2EhCabeca) {
          throw new Error(
            `Dupla inválida: ${dupla.jogador1Nome} e ${dupla.jogador2Nome} são ambos cabeças de chave`
          );
        }
      }

      console.log("   ✅ Validação de cabeças OK");
    } catch (error) {
      console.error("Erro na validação:", error);
      throw error;
    }
  }

  /**
   * Criar dupla (auxiliar para cabeças de chave)
   */
  private async criarDupla(
    etapaId: string,
    arenaId: string,
    jogador1: Inscricao,
    jogador2: Inscricao,
    _ordem: number
  ): Promise<Dupla> {
    try {
      const dupla: Dupla = {
        id: "",
        etapaId,
        arenaId,
        jogador1Id: jogador1.jogadorId,
        jogador1Nome: jogador1.jogadorNome,
        jogador1Nivel: jogador1.jogadorNivel,
        jogador1Genero: jogador1.jogadorGenero,
        jogador2Id: jogador2.jogadorId,
        jogador2Nome: jogador2.jogadorNome,
        jogador2Nivel: jogador2.jogadorNivel,
        jogador2Genero: jogador2.jogadorGenero,
        grupoId: "",
        grupoNome: "",
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
        posicaoGrupo: undefined,
        classificada: false,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      };

      // Salvar no Firestore
      const { id, ...duplaSemId } = dupla;
      const docRef = await db.collection(this.collectionDuplas).add(duplaSemId);

      return { ...duplaSemId, id: docRef.id };
    } catch (error) {
      console.error("Erro ao criar dupla:", error);
      throw error;
    }
  }

  /**
   * Gerar chaves (duplas + grupos + partidas)
   */
  async gerarChaves(
    etapaId: string,
    arenaId: string
  ): Promise<{
    duplas: Dupla[];
    grupos: Grupo[];
    partidas: Partida[];
  }> {
    try {
      // Buscar etapa
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      // Validar status
      if (etapa.status !== StatusEtapa.INSCRICOES_ENCERRADAS) {
        throw new Error("Inscrições devem estar encerradas para gerar chaves");
      }

      if (etapa.chavesGeradas) {
        throw new Error("Chaves já foram geradas para esta etapa");
      }

      // Verificar número mínimo de jogadores
      if (etapa.totalInscritos < 4) {
        throw new Error("Necessário no mínimo 4 jogadores inscritos");
      }

      // Verificar se número é par
      if (etapa.totalInscritos % 2 !== 0) {
        throw new Error("Número de jogadores deve ser par");
      }

      // Verificar se o número de inscritos corresponde ao configurado
      if (etapa.totalInscritos !== etapa.maxJogadores) {
        throw new Error(
          `Esta etapa está configurada para ${etapa.maxJogadores} jogadores, mas possui apenas ${etapa.totalInscritos} inscrito(s). ` +
            `Para gerar chaves com menos jogadores, primeiro edite a etapa e ajuste o número máximo de jogadores para ${etapa.totalInscritos}.`
        );
      }

      // Buscar inscrições confirmadas
      const inscricoes = await etapaService.listarInscricoes(etapaId, arenaId);

      // 1. Formar duplas
      console.log("🎾 Formando duplas...");
      const duplas = await this.formarDuplas(
        etapaId,
        arenaId,
        inscricoes,
        etapa.jogadoresPorGrupo
      );

      console.log("📊 Criando estatísticas individuais dos jogadores...");
      for (const dupla of duplas) {
        // Estatísticas do jogador 1
        await estatisticasJogadorService.criar({
          etapaId,
          arenaId,
          jogadorId: dupla.jogador1Id,
          jogadorNome: dupla.jogador1Nome,
          jogadorNivel: dupla.jogador1Nivel,
          jogadorGenero: dupla.jogador1Genero,
          grupoId: dupla.grupoId,
          grupoNome: dupla.grupoNome,
        });

        // Estatísticas do jogador 2
        await estatisticasJogadorService.criar({
          etapaId,
          arenaId,
          jogadorId: dupla.jogador2Id,
          jogadorNome: dupla.jogador2Nome,
          jogadorNivel: dupla.jogador2Nivel,
          jogadorGenero: dupla.jogador2Genero,
          grupoId: dupla.grupoId,
          grupoNome: dupla.grupoNome,
        });
      }
      console.log("✅ Estatísticas individuais criadas!");

      // 2. Criar grupos
      console.log("📊 Criando grupos...");
      const grupos = await this.criarGrupos(
        etapaId,
        arenaId,
        duplas,
        etapa.jogadoresPorGrupo
      );

      // 3. Gerar partidas
      console.log("⚔️ Gerando partidas...");
      const partidas = await this.gerarPartidas(etapaId, arenaId, grupos);

      // 4. Atualizar histórico de parceiros
      console.log("📝 Atualizando histórico...");
      await this.atualizarHistoricoParceiros(arenaId, duplas, etapaId);

      // 5. Atualizar etapa
      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: true,
        dataGeracaoChaves: Timestamp.now(),
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });

      console.log("✅ Chaves geradas com sucesso!");

      return {
        duplas,
        grupos,
        partidas,
      };
    } catch (error: any) {
      console.error("Erro ao gerar chaves:", error);
      throw error;
    }
  }

  /**
   * Formar duplas com algoritmo de não repetição
   */
  private async formarDuplas(
    etapaId: string,
    arenaId: string,
    inscricoes: Inscricao[],
    _duplasPorGrupo: number
  ): Promise<Dupla[]> {
    try {
      const jogadores = inscricoes.map((i) => ({
        id: i.jogadorId,
        nome: i.jogadorNome,
        nivel: i.jogadorNivel,
        genero: i.jogadorGenero,
      }));

      // Embaralhar jogadores
      const jogadoresEmbaralhados = this.embaralhar([...jogadores]);

      // Buscar histórico de parceiros de todos os jogadores
      const historicos = await this.buscarHistoricosParceiros(
        arenaId,
        jogadores.map((j) => j.id)
      );

      // Algoritmo de formação de duplas
      const duplas: Dupla[] = [];
      const jogadoresUsados = new Set<string>();

      for (let i = 0; i < jogadoresEmbaralhados.length; i++) {
        const jogador1 = jogadoresEmbaralhados[i];

        if (jogadoresUsados.has(jogador1.id)) {
          continue;
        }

        // Buscar melhor parceiro para jogador1
        let melhorParceiro = null;
        let menorRepeticoes = Infinity;

        for (let j = i + 1; j < jogadoresEmbaralhados.length; j++) {
          const jogador2 = jogadoresEmbaralhados[j];

          if (jogadoresUsados.has(jogador2.id)) {
            continue;
          }

          // Verificar quantas vezes já jogaram juntos
          const repeticoes = this.contarRepeticoes(
            historicos,
            jogador1.id,
            jogador2.id
          );

          if (repeticoes < menorRepeticoes) {
            menorRepeticoes = repeticoes;
            melhorParceiro = jogador2;
          }
        }

        if (melhorParceiro) {
          // Criar dupla
          const dupla: Dupla = {
            id: "", // Será preenchido ao salvar
            etapaId,
            arenaId,
            jogador1Id: jogador1.id,
            jogador1Nome: jogador1.nome,
            jogador1Nivel: jogador1.nivel,
            jogador1Genero: jogador1.genero,
            jogador2Id: melhorParceiro.id,
            jogador2Nome: melhorParceiro.nome,
            jogador2Nivel: melhorParceiro.nivel,
            jogador2Genero: jogador1.genero,
            grupoId: "",
            grupoNome: "",
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
            posicaoGrupo: undefined,
            classificada: false,
            criadoEm: Timestamp.now(),
            atualizadoEm: Timestamp.now(),
          };

          duplas.push(dupla);
          jogadoresUsados.add(jogador1.id);
          jogadoresUsados.add(melhorParceiro.id);
        }
      }

      // Salvar duplas no Firestore
      const duplasComId: Dupla[] = [];
      for (const dupla of duplas) {
        // Remover campo id antes de salvar
        const { id, ...duplaSemId } = dupla;
        const docRef = await db
          .collection(this.collectionDuplas)
          .add(duplaSemId);
        duplasComId.push({ ...duplaSemId, id: docRef.id });
      }

      return duplasComId;
    } catch (error) {
      console.error("Erro ao formar duplas:", error);
      throw new Error("Falha ao formar duplas");
    }
  }

  /**
   * Buscar históricos de parceiros
   */
  private async buscarHistoricosParceiros(
    arenaId: string,
    jogadorIds: string[]
  ): Promise<Map<string, HistoricoParceiro>> {
    try {
      const historicos = new Map<string, HistoricoParceiro>();

      for (const jogadorId of jogadorIds) {
        const snapshot = await db
          .collection(this.collectionHistorico)
          .where("arenaId", "==", arenaId)
          .where("jogadorId", "==", jogadorId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const historico = { id: doc.id, ...doc.data() } as HistoricoParceiro;
          historicos.set(jogadorId, historico);
        }
      }

      return historicos;
    } catch (error) {
      console.error("Erro ao buscar históricos:", error);
      return new Map();
    }
  }

  /**
   * Contar repetições de dupla
   */
  private contarRepeticoes(
    historicos: Map<string, HistoricoParceiro>,
    jogador1Id: string,
    jogador2Id: string
  ): number {
    const historico1 = historicos.get(jogador1Id);
    if (!historico1) return 0;

    const parceiro = historico1.parceiros.find(
      (p) => p.parceiroId === jogador2Id
    );
    return parceiro ? parceiro.etapasJuntos.length : 0;
  }

  /**
   * Calcular distribuição ideal de grupos
   * REGRA:
   * - PRIORIDADE 1: Grupos de 3 duplas (sempre que possível)
   * - PRIORIDADE 2: Grupos de 4 duplas (quando necessário)
   * - EXCEÇÃO: 5 duplas = 1 grupo de 5
   *
   * Exemplos:
   * - 3 duplas: [3]
   * - 4 duplas: [4]
   * - 5 duplas: [5] ← EXCEÇÃO
   * - 6 duplas: [3, 3]
   * - 7 duplas: [3, 4]
   * - 8 duplas: [4, 4]
   * - 9 duplas: [3, 3, 3]
   * - 10 duplas: [3, 3, 4]
   * - 11 duplas: [3, 4, 4]
   */
  private calcularDistribuicaoGrupos(totalDuplas: number): number[] {
    console.log(`📊 Calculando distribuição para ${totalDuplas} duplas...`);

    // EXCEÇÃO: 5 duplas = 1 grupo de 5
    if (totalDuplas === 5) {
      console.log("   → Exceção: 1 grupo de 5 duplas");
      return [5];
    }

    const resto = totalDuplas % 3;

    // Divide perfeitamente por 3: todos grupos de 3
    if (resto === 0) {
      const numGrupos = totalDuplas / 3;
      const distribuicao = Array(numGrupos).fill(3);
      console.log(`   → ${numGrupos} grupos de 3 duplas`);
      return distribuicao;
    }

    // Sobra 1: pegar 1 grupo de 3 e juntar com a sobra = 1 grupo de 4
    if (resto === 1) {
      const numGruposDe3 = Math.floor(totalDuplas / 3) - 1;
      if (numGruposDe3 <= 0) {
        console.log("   → 1 grupo de 4 duplas");
        return [4];
      }
      const distribuicao = [...Array(numGruposDe3).fill(3), 4];
      console.log(`   → ${numGruposDe3} grupos de 3 + 1 grupo de 4`);
      return distribuicao;
    }

    // Sobra 2: pegar 2 grupos de 3 e redistribuir = 2 grupos de 4
    if (resto === 2) {
      const numGruposDe3 = Math.floor(totalDuplas / 3);

      if (numGruposDe3 >= 2) {
        const gruposDe3Restantes = numGruposDe3 - 2;
        const distribuicao = [...Array(gruposDe3Restantes).fill(3), 4, 4];
        console.log(`   → ${gruposDe3Restantes} grupos de 3 + 2 grupos de 4`);
        return distribuicao;
      } else {
        console.log("   → 2 grupos de 4 duplas");
        return [4, 4];
      }
    }

    // Fallback (não deveria chegar aqui)
    console.log(`   → Fallback: 1 grupo de ${totalDuplas} duplas`);
    return [totalDuplas];
  }

  /**
   * Criar grupos
   */
  private async criarGrupos(
    etapaId: string,
    arenaId: string,
    duplas: Dupla[],
    _duplasPorGrupo: number // Parâmetro mantido por compatibilidade, mas não usado
  ): Promise<Grupo[]> {
    try {
      const grupos: Grupo[] = [];
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      // Calcular distribuição ideal de grupos
      const distribuicao = this.calcularDistribuicaoGrupos(duplas.length);

      // Embaralhar duplas
      const duplasEmbaralhadas = this.embaralhar([...duplas]);

      // Distribuir em grupos conforme a distribuição calculada
      let duplaIndex = 0;
      for (let grupoIndex = 0; grupoIndex < distribuicao.length; grupoIndex++) {
        const tamanhoGrupo = distribuicao[grupoIndex];
        const duplasDoGrupo = duplasEmbaralhadas.slice(
          duplaIndex,
          duplaIndex + tamanhoGrupo
        );
        duplaIndex += tamanhoGrupo;

        const nomeGrupo = `Grupo ${letras[grupoIndex]}`;

        console.log(`   📦 ${nomeGrupo}: ${tamanhoGrupo} duplas`);

        const grupo: Grupo = {
          id: "",
          etapaId,
          arenaId,
          nome: nomeGrupo,
          ordem: grupoIndex + 1,
          duplas: duplasDoGrupo.map((d) => d.id),
          totalDuplas: duplasDoGrupo.length,
          partidas: [],
          totalPartidas: 0,
          partidasFinalizadas: 0,
          completo: false,
          classificadas: [],
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        };

        // Salvar grupo
        const { id, ...grupoSemId } = grupo;
        const docRef = await db
          .collection(this.collectionGrupos)
          .add(grupoSemId);
        const grupoComId = { ...grupoSemId, id: docRef.id };
        grupos.push(grupoComId);

        // Atualizar duplas com grupoId
        for (const dupla of duplasDoGrupo) {
          await db.collection(this.collectionDuplas).doc(dupla.id).update({
            grupoId: docRef.id,
            grupoNome: nomeGrupo,
            atualizadoEm: Timestamp.now(),
          });
        }
      }

      return grupos;
    } catch (error) {
      console.error("Erro ao criar grupos:", error);
      throw new Error("Falha ao criar grupos");
    }
  }

  /**
   * Gerar partidas (todos contra todos em cada grupo)
   */
  private async gerarPartidas(
    etapaId: string,
    arenaId: string,
    grupos: Grupo[]
  ): Promise<Partida[]> {
    try {
      const todasPartidas: Partida[] = [];

      for (const grupo of grupos) {
        // Buscar duplas do grupo
        const duplasSnapshot = await db
          .collection(this.collectionDuplas)
          .where("grupoId", "==", grupo.id)
          .get();

        const duplas = duplasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Dupla[];

        // Gerar todos os confrontos (round-robin)
        const partidas: Partida[] = [];
        for (let i = 0; i < duplas.length; i++) {
          for (let j = i + 1; j < duplas.length; j++) {
            const dupla1 = duplas[i];
            const dupla2 = duplas[j];

            const partida: Partida = {
              id: "",
              etapaId,
              arenaId,
              fase: FaseEtapa.GRUPOS,
              grupoId: grupo.id,
              grupoNome: grupo.nome,
              dupla1Id: dupla1.id,
              dupla1Nome: `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`,
              dupla2Id: dupla2.id,
              dupla2Nome: `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`,
              dataHora: undefined,
              quadra: undefined,
              status: StatusPartida.AGENDADA,
              setsDupla1: 0,
              setsDupla2: 0,
              placar: [],
              vencedoraId: undefined,
              vencedoraNome: undefined,
              criadoEm: Timestamp.now(),
              atualizadoEm: Timestamp.now(),
              finalizadoEm: undefined,
            };

            // Salvar partida (remover id antes de salvar)
            const { id, ...partidaSemId } = partida;
            const docRef = await db
              .collection(this.collectionPartidas)
              .add(partidaSemId);
            const partidaComId = { ...partidaSemId, id: docRef.id };
            partidas.push(partidaComId);
            todasPartidas.push(partidaComId);
          }
        }

        // Atualizar grupo com IDs das partidas
        await db
          .collection(this.collectionGrupos)
          .doc(grupo.id)
          .update({
            partidas: partidas.map((p) => p.id),
            totalPartidas: partidas.length,
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
   * Atualizar histórico de parceiros
   */
  private async atualizarHistoricoParceiros(
    arenaId: string,
    duplas: Dupla[],
    etapaId: string
  ): Promise<void> {
    try {
      for (const dupla of duplas) {
        // Atualizar histórico do jogador1
        await this.atualizarHistoricoJogador(
          arenaId,
          dupla.jogador1Id,
          dupla.jogador2Id,
          dupla.jogador2Nome,
          etapaId
        );

        // Atualizar histórico do jogador2
        await this.atualizarHistoricoJogador(
          arenaId,
          dupla.jogador2Id,
          dupla.jogador1Id,
          dupla.jogador1Nome,
          etapaId
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar histórico de parceiros:", error);
    }
  }

  /**
   * Atualizar histórico de um jogador
   */
  private async atualizarHistoricoJogador(
    arenaId: string,
    jogadorId: string,
    parceiroId: string,
    parceiroNome: string,
    etapaId: string
  ): Promise<void> {
    try {
      const snapshot = await db
        .collection(this.collectionHistorico)
        .where("arenaId", "==", arenaId)
        .where("jogadorId", "==", jogadorId)
        .limit(1)
        .get();

      const agora = Timestamp.now();

      if (snapshot.empty) {
        // Criar novo histórico
        await db.collection(this.collectionHistorico).add({
          arenaId,
          jogadorId,
          parceiros: [
            {
              parceiroId,
              parceiroNome,
              etapasJuntos: [etapaId],
              ultimaVez: agora,
            },
          ],
          atualizadoEm: agora,
        });
      } else {
        // Atualizar histórico existente
        const doc = snapshot.docs[0];
        const historico = doc.data() as HistoricoParceiro;

        const parceiroIndex = historico.parceiros.findIndex(
          (p) => p.parceiroId === parceiroId
        );

        if (parceiroIndex >= 0) {
          // Parceiro já existe, adicionar etapa
          historico.parceiros[parceiroIndex].etapasJuntos.push(etapaId);
          historico.parceiros[parceiroIndex].ultimaVez = agora;
        } else {
          // Novo parceiro
          historico.parceiros.push({
            parceiroId,
            parceiroNome,
            etapasJuntos: [etapaId],
            ultimaVez: agora,
          });
        }

        await db.collection(this.collectionHistorico).doc(doc.id).update({
          parceiros: historico.parceiros,
          atualizadoEm: agora,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar histórico do jogador:", error);
    }
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
   * Buscar duplas de uma etapa
   */
  async buscarDuplas(etapaId: string, arenaId: string): Promise<any[]> {
    try {
      const snapshot = await db
        .collection(this.collectionDuplas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .orderBy("grupoNome", "asc")
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id, // ID do documento por último para sobrescrever qualquer id vazio
      }));
    } catch (error) {
      console.error("Erro ao buscar duplas:", error);
      throw new Error("Falha ao buscar duplas");
    }
  }

  /**
   * Buscar grupos de uma etapa
   */
  async buscarGrupos(etapaId: string, arenaId: string): Promise<any[]> {
    try {
      const snapshot = await db
        .collection(this.collectionGrupos)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .orderBy("ordem", "asc")
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id, // ID do documento por último para sobrescrever qualquer id vazio
      }));
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
      throw new Error("Falha ao buscar grupos");
    }
  }

  /**
   * Buscar partidas de uma etapa
   */
  async buscarPartidas(etapaId: string, arenaId: string): Promise<any[]> {
    try {
      const snapshot = await db
        .collection(this.collectionPartidas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .orderBy("criadoEm", "asc")
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Erro ao buscar partidas:", error);
      throw new Error("Falha ao buscar partidas");
    }
  }

  /**
   * Limpar histórico de parceiros de uma etapa específica
   */
  private async limparHistoricoDaEtapa(
    arenaId: string,
    jogadorId: string,
    etapaId: string
  ): Promise<void> {
    try {
      const snapshot = await db
        .collection(this.collectionHistorico)
        .where("arenaId", "==", arenaId)
        .where("jogadorId", "==", jogadorId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return; // Jogador não tem histórico
      }

      const doc = snapshot.docs[0];
      const historico = doc.data() as HistoricoParceiro;

      // Remover esta etapa de todos os parceiros
      historico.parceiros = historico.parceiros
        .map((parceiro) => {
          // Remover etapa do array etapasJuntos
          parceiro.etapasJuntos = parceiro.etapasJuntos.filter(
            (id) => id !== etapaId
          );
          return parceiro;
        })
        .filter((parceiro) => parceiro.etapasJuntos.length > 0); // Remover parceiros sem etapas

      if (historico.parceiros.length === 0) {
        // Se não sobrou nenhum parceiro, deletar o documento
        await db.collection(this.collectionHistorico).doc(doc.id).delete();
      } else {
        // Atualizar documento
        await db.collection(this.collectionHistorico).doc(doc.id).update({
          parceiros: historico.parceiros,
          atualizadoEm: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Erro ao limpar histórico do jogador:", error);
    }
  }

  /**
   * Excluir todas as chaves de uma etapa (duplas, grupos, partidas E ELIMINATÓRIAS)
   */
  async excluirChaves(etapaId: string, arenaId: string): Promise<void> {
    try {
      // Verificar se etapa existe
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (!etapa.chavesGeradas) {
        throw new Error("Esta etapa não possui chaves geradas");
      }

      console.log("🗑️ Excluindo duplas...");
      // Buscar duplas antes de excluir (para limpar histórico)
      const duplasSnapshot = await db
        .collection(this.collectionDuplas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      // Guardar IDs dos jogadores para limpar histórico
      const jogadoresIds = new Set<string>();
      duplasSnapshot.docs.forEach((doc) => {
        const dupla = doc.data() as Dupla;
        jogadoresIds.add(dupla.jogador1Id);
        jogadoresIds.add(dupla.jogador2Id);
      });

      // Excluir duplas
      const duplasBatch = db.batch();
      duplasSnapshot.docs.forEach((doc) => {
        duplasBatch.delete(doc.ref);
      });
      await duplasBatch.commit();

      console.log("🗑️ Excluindo grupos...");
      // Excluir grupos
      const gruposSnapshot = await db
        .collection(this.collectionGrupos)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      const gruposBatch = db.batch();
      gruposSnapshot.docs.forEach((doc) => {
        gruposBatch.delete(doc.ref);
      });
      await gruposBatch.commit();

      console.log("🗑️ Excluindo partidas da fase de grupos...");
      // Excluir partidas da fase de grupos
      const partidasSnapshot = await db
        .collection(this.collectionPartidas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("fase", "==", FaseEtapa.GRUPOS)
        .get();

      const partidasBatch = db.batch();
      partidasSnapshot.docs.forEach((doc) => {
        partidasBatch.delete(doc.ref);
      });
      await partidasBatch.commit();

      // ============== NOVO: EXCLUIR FASE ELIMINATÓRIA ==============
      console.log("🗑️ Excluindo confrontos eliminatórios...");

      // Excluir confrontos eliminatórios
      const confrontosSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      if (!confrontosSnapshot.empty) {
        const confrontosBatch = db.batch();
        confrontosSnapshot.docs.forEach((doc) => {
          confrontosBatch.delete(doc.ref);
        });
        await confrontosBatch.commit();
        console.log(
          `   ✅ ${confrontosSnapshot.size} confrontos eliminatórios excluídos`
        );
      }

      // Excluir partidas da fase eliminatória
      const partidasEliminatoriaSnapshot = await db
        .collection(this.collectionPartidas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("tipo", "==", "eliminatoria")
        .get();

      if (!partidasEliminatoriaSnapshot.empty) {
        const partidasEliminatoriaBatch = db.batch();
        partidasEliminatoriaSnapshot.docs.forEach((doc) => {
          partidasEliminatoriaBatch.delete(doc.ref);
        });
        await partidasEliminatoriaBatch.commit();
        console.log(
          `   ✅ ${partidasEliminatoriaSnapshot.size} partidas eliminatórias excluídas`
        );
      }
      // ==============================================================

      // ============== NOVO: EXCLUIR ESTATÍSTICAS INDIVIDUAIS ==============
      console.log("🗑️ Excluindo estatísticas individuais dos jogadores...");

      const estatisticasSnapshot = await db
        .collection("estatisticas_jogador")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      if (!estatisticasSnapshot.empty) {
        const estatisticasBatch = db.batch();
        estatisticasSnapshot.docs.forEach((doc) => {
          estatisticasBatch.delete(doc.ref);
        });
        await estatisticasBatch.commit();
        console.log(
          `   ✅ ${estatisticasSnapshot.size} estatísticas individuais excluídas`
        );
      }
      // ====================================================================

      console.log("🗑️ Limpando histórico de parceiros...");
      // Limpar histórico de parceiros desta etapa
      for (const jogadorId of jogadoresIds) {
        await this.limparHistoricoDaEtapa(arenaId, jogadorId, etapaId);
      }

      console.log("📝 Resetando etapa...");
      // Resetar etapa
      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: false,
        dataGeracaoChaves: null,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        atualizadoEm: Timestamp.now(),
      });

      console.log("✅ Chaves e eliminatórias excluídas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao excluir chaves:", error);
      throw error;
    }
  }

  /**
   * Registrar ou editar resultado de uma partida (1 SET APENAS)
   */
  async registrarResultadoPartida(
    partidaId: string,
    arenaId: string,
    placar: Array<{
      numero: number;
      gamesDupla1: number;
      gamesDupla2: number;
    }>
  ): Promise<void> {
    try {
      console.log(`⚔️ Registrando resultado da partida ${partidaId}...`);

      // Buscar partida
      const partidaDoc = await db.collection("partidas").doc(partidaId).get();

      if (!partidaDoc.exists) {
        throw new Error("Partida não encontrada");
      }

      const partida = {
        id: partidaDoc.id,
        ...partidaDoc.data(),
      } as Partida;

      if (partida.arenaId !== arenaId) {
        throw new Error("Partida não pertence a esta arena");
      }

      // Buscar duplas
      const dupla1Doc = await db
        .collection("duplas")
        .doc(partida.dupla1Id)
        .get();
      const dupla2Doc = await db
        .collection("duplas")
        .doc(partida.dupla2Id)
        .get();

      if (!dupla1Doc.exists || !dupla2Doc.exists) {
        throw new Error("Duplas não encontradas");
      }

      const dupla1 = { id: dupla1Doc.id, ...dupla1Doc.data() } as Dupla;
      const dupla2 = { id: dupla2Doc.id, ...dupla2Doc.data() } as Dupla;

      // ✅ NOVO: Se partida já finalizada, reverter estatísticas antigas primeiro
      const isEdicao = partida.status === StatusPartida.FINALIZADA;

      if (isEdicao && partida.placar && partida.placar.length > 0) {
        console.log("🔄 Revertendo estatísticas antigas...");

        // Recalcular estatísticas antigas
        const placarAntigo = partida.placar;
        let setsAntigo1 = 0;
        let setsAntigo2 = 0;
        let gamesAntigo1 = 0;
        let gamesPerdidosAntigo1 = 0;
        let gamesAntigo2 = 0;
        let gamesPerdidosAntigo2 = 0;

        placarAntigo.forEach((set: any) => {
          if (set.gamesDupla1 > set.gamesDupla2) setsAntigo1++;
          else setsAntigo2++;
          gamesAntigo1 += set.gamesDupla1;
          gamesPerdidosAntigo1 += set.gamesDupla2;
          gamesAntigo2 += set.gamesDupla2;
          gamesPerdidosAntigo2 += set.gamesDupla1;
        });

        const dupla1VenceuAntigo = setsAntigo1 > setsAntigo2;

        // Reverter estatísticas dos 4 jogadores
        await estatisticasJogadorService.reverterAposPartida(
          dupla1.jogador1Id,
          partida.etapaId,
          {
            venceu: dupla1VenceuAntigo,
            setsVencidos: setsAntigo1,
            setsPerdidos: setsAntigo2,
            gamesVencidos: gamesAntigo1,
            gamesPerdidos: gamesPerdidosAntigo1,
          }
        );

        await estatisticasJogadorService.reverterAposPartida(
          dupla1.jogador2Id,
          partida.etapaId,
          {
            venceu: dupla1VenceuAntigo,
            setsVencidos: setsAntigo1,
            setsPerdidos: setsAntigo2,
            gamesVencidos: gamesAntigo1,
            gamesPerdidos: gamesPerdidosAntigo1,
          }
        );

        await estatisticasJogadorService.reverterAposPartida(
          dupla2.jogador1Id,
          partida.etapaId,
          {
            venceu: !dupla1VenceuAntigo,
            setsVencidos: setsAntigo2,
            setsPerdidos: setsAntigo1,
            gamesVencidos: gamesAntigo2,
            gamesPerdidos: gamesPerdidosAntigo2,
          }
        );

        await estatisticasJogadorService.reverterAposPartida(
          dupla2.jogador2Id,
          partida.etapaId,
          {
            venceu: !dupla1VenceuAntigo,
            setsVencidos: setsAntigo2,
            setsPerdidos: setsAntigo1,
            gamesVencidos: gamesAntigo2,
            gamesPerdidos: gamesPerdidosAntigo2,
          }
        );

        console.log("↩️ Estatísticas antigas revertidas!");
      }

      // Calcular resultado
      let setsDupla1 = 0;
      let setsDupla2 = 0;
      let gamesVencidosDupla1 = 0;
      let gamesPerdidosDupla1 = 0;
      let gamesVencidosDupla2 = 0;
      let gamesPerdidosDupla2 = 0;

      const placarComVencedor = placar.map((set) => {
        if (set.gamesDupla1 > set.gamesDupla2) {
          setsDupla1++;
        } else {
          setsDupla2++;
        }

        gamesVencidosDupla1 += set.gamesDupla1;
        gamesPerdidosDupla1 += set.gamesDupla2;
        gamesVencidosDupla2 += set.gamesDupla2;
        gamesPerdidosDupla2 += set.gamesDupla1;

        return {
          ...set,
          vencedorId:
            set.gamesDupla1 > set.gamesDupla2
              ? partida.dupla1Id
              : partida.dupla2Id,
        };
      });

      // Determinar vencedora
      const dupla1Venceu = setsDupla1 > setsDupla2;
      const vencedoraId = dupla1Venceu ? partida.dupla1Id : partida.dupla2Id;
      const vencedoraNome = dupla1Venceu
        ? `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`
        : `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`;

      console.log(
        `   🏆 Vencedora: ${vencedoraNome} (${setsDupla1} x ${setsDupla2})`
      );

      // Atualizar partida
      await db
        .collection("partidas")
        .doc(partidaId)
        .update({
          status: StatusPartida.FINALIZADA,
          setsDupla1,
          setsDupla2,
          placar: placarComVencedor,
          vencedoraId,
          vencedoraNome,
          finalizadoEm: isEdicao ? partida.finalizadoEm : Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        });

      // Atualizar estatísticas das DUPLAS (código existente)
      console.log("📊 Atualizando estatísticas das duplas...");

      // Dupla 1
      await db
        .collection("duplas")
        .doc(partida.dupla1Id)
        .update({
          jogos: dupla1.jogos + 1,
          vitorias: dupla1.vitorias + (dupla1Venceu ? 1 : 0),
          derrotas: dupla1.derrotas + (dupla1Venceu ? 0 : 1),
          pontos: dupla1.pontos + (dupla1Venceu ? 3 : 0),
          setsVencidos: dupla1.setsVencidos + setsDupla1,
          setsPerdidos: dupla1.setsPerdidos + setsDupla2,
          gamesVencidos: dupla1.gamesVencidos + gamesVencidosDupla1,
          gamesPerdidos: dupla1.gamesPerdidos + gamesPerdidosDupla1,
          saldoSets: dupla1.saldoSets + (setsDupla1 - setsDupla2),
          saldoGames:
            dupla1.saldoGames + (gamesVencidosDupla1 - gamesPerdidosDupla1),
          atualizadoEm: Timestamp.now(),
        });

      // Dupla 2
      await db
        .collection("duplas")
        .doc(partida.dupla2Id)
        .update({
          jogos: dupla2.jogos + 1,
          vitorias: dupla2.vitorias + (dupla1Venceu ? 0 : 1),
          derrotas: dupla2.derrotas + (dupla1Venceu ? 1 : 0),
          pontos: dupla2.pontos + (dupla1Venceu ? 0 : 3),
          setsVencidos: dupla2.setsVencidos + setsDupla2,
          setsPerdidos: dupla2.setsPerdidos + setsDupla1,
          gamesVencidos: dupla2.gamesVencidos + gamesVencidosDupla2,
          gamesPerdidos: dupla2.gamesPerdidos + gamesPerdidosDupla2,
          saldoSets: dupla2.saldoSets + (setsDupla2 - setsDupla1),
          saldoGames:
            dupla2.saldoGames + (gamesVencidosDupla2 - gamesPerdidosDupla2),
          atualizadoEm: Timestamp.now(),
        });

      // ✅ NOVO: Atualizar estatísticas INDIVIDUAIS dos 4 jogadores
      console.log("📊 Atualizando estatísticas individuais...");

      // Jogador 1A (dupla 1)
      await estatisticasJogadorService.atualizarAposPartida(
        dupla1.jogador1Id,
        partida.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: setsDupla1,
          setsPerdidos: setsDupla2,
          gamesVencidos: gamesVencidosDupla1,
          gamesPerdidos: gamesPerdidosDupla1,
        }
      );

      // Jogador 1B (dupla 1)
      await estatisticasJogadorService.atualizarAposPartida(
        dupla1.jogador2Id,
        partida.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: setsDupla1,
          setsPerdidos: setsDupla2,
          gamesVencidos: gamesVencidosDupla1,
          gamesPerdidos: gamesPerdidosDupla1,
        }
      );

      // Jogador 2A (dupla 2)
      await estatisticasJogadorService.atualizarAposPartida(
        dupla2.jogador1Id,
        partida.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: setsDupla2,
          setsPerdidos: setsDupla1,
          gamesVencidos: gamesVencidosDupla2,
          gamesPerdidos: gamesPerdidosDupla2,
        }
      );

      // Jogador 2B (dupla 2)
      await estatisticasJogadorService.atualizarAposPartida(
        dupla2.jogador2Id,
        partida.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: setsDupla2,
          setsPerdidos: setsDupla1,
          gamesVencidos: gamesVencidosDupla2,
          gamesPerdidos: gamesPerdidosDupla2,
        }
      );

      console.log("✅ Estatísticas individuais atualizadas!");

      // Recalcular classificação do grupo
      if (partida.grupoId) {
        await this.recalcularClassificacaoGrupo(partida.grupoId);
      }

      console.log(
        isEdicao
          ? "✅ Resultado atualizado com sucesso!"
          : "✅ Resultado registrado com sucesso!"
      );
    } catch (error: any) {
      console.error("Erro ao registrar resultado:", error);
      throw error;
    }
  }

  /**
   * Reverter estatísticas das duplas (ao editar resultado)
   */
  private async reverterEstatisticasDuplas(
    dupla1Id: string,
    dupla2Id: string,
    vencedoraIdAntiga: string,
    setsDupla1Antigo: number,
    setsDupla2Antigo: number,
    gamesVencidosDupla1Antigo: number,
    gamesPerdidosDupla1Antigo: number,
    gamesVencidosDupla2Antigo: number,
    gamesPerdidosDupla2Antigo: number
  ): Promise<void> {
    try {
      // Reverter dupla 1
      const dupla1Doc = await db
        .collection(this.collectionDuplas)
        .doc(dupla1Id)
        .get();
      const dupla1 = dupla1Doc.data() as Dupla;

      const venceuDupla1 = vencedoraIdAntiga === dupla1Id;

      await db
        .collection(this.collectionDuplas)
        .doc(dupla1Id)
        .update({
          jogos: dupla1.jogos - 1,
          vitorias: dupla1.vitorias - (venceuDupla1 ? 1 : 0),
          derrotas: dupla1.derrotas - (venceuDupla1 ? 0 : 1),
          pontos: dupla1.pontos - (venceuDupla1 ? 3 : 0),
          setsVencidos: dupla1.setsVencidos - setsDupla1Antigo,
          setsPerdidos: dupla1.setsPerdidos - setsDupla2Antigo,
          gamesVencidos: dupla1.gamesVencidos - gamesVencidosDupla1Antigo,
          gamesPerdidos: dupla1.gamesPerdidos - gamesPerdidosDupla1Antigo,
          saldoSets: dupla1.saldoSets - (setsDupla1Antigo - setsDupla2Antigo),
          saldoGames:
            dupla1.saldoGames -
            (gamesVencidosDupla1Antigo - gamesPerdidosDupla1Antigo),
          atualizadoEm: Timestamp.now(),
        });

      // Reverter dupla 2
      const dupla2Doc = await db
        .collection(this.collectionDuplas)
        .doc(dupla2Id)
        .get();
      const dupla2 = dupla2Doc.data() as Dupla;

      const venceuDupla2 = vencedoraIdAntiga === dupla2Id;

      await db
        .collection(this.collectionDuplas)
        .doc(dupla2Id)
        .update({
          jogos: dupla2.jogos - 1,
          vitorias: dupla2.vitorias - (venceuDupla2 ? 1 : 0),
          derrotas: dupla2.derrotas - (venceuDupla2 ? 0 : 1),
          pontos: dupla2.pontos - (venceuDupla2 ? 3 : 0),
          setsVencidos: dupla2.setsVencidos - setsDupla2Antigo,
          setsPerdidos: dupla2.setsPerdidos - setsDupla1Antigo,
          gamesVencidos: dupla2.gamesVencidos - gamesVencidosDupla2Antigo,
          gamesPerdidos: dupla2.gamesPerdidos - gamesPerdidosDupla2Antigo,
          saldoSets: dupla2.saldoSets - (setsDupla2Antigo - setsDupla1Antigo),
          saldoGames:
            dupla2.saldoGames -
            (gamesVencidosDupla2Antigo - gamesPerdidosDupla2Antigo),
          atualizadoEm: Timestamp.now(),
        });

      console.log("   ↩️ Estatísticas antigas revertidas");
    } catch (error) {
      console.error("Erro ao reverter estatísticas:", error);
      throw error;
    }
  }

  /**
   * Recalcular classificação do grupo
   * CRITÉRIOS:
   * 1. Vitórias
   * 2. Saldo de games
   * 3. Confronto direto (apenas 2 duplas empatadas)
   * 4. Sorteio (3+ duplas empatadas)
   */
  private async recalcularClassificacaoGrupo(grupoId: string): Promise<void> {
    try {
      console.log(`   📊 Recalculando classificação do grupo...`);

      // Buscar duplas do grupo
      const duplasSnapshot = await db
        .collection("duplas")
        .where("grupoId", "==", grupoId)
        .get();

      const duplas = duplasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Dupla[];

      // Buscar todas as partidas finalizadas do grupo
      const partidasSnapshot = await db
        .collection("partidas")
        .where("grupoId", "==", grupoId)
        .where("status", "==", StatusPartida.FINALIZADA)
        .get();

      const partidas = partidasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Partida[];

      // Ordenar duplas por critérios de desempate
      const duplasOrdenadas = [...duplas].sort((a, b) => {
        // 1. Pontos (vitórias * 3)
        if (a.pontos !== b.pontos) {
          return b.pontos - a.pontos;
        }

        // 2. Saldo de games
        if (a.saldoGames !== b.saldoGames) {
          return b.saldoGames - a.saldoGames;
        }

        // 3. Confronto direto (apenas se 2 duplas empatadas)
        const duplasEmpatadas = duplas.filter(
          (d) => d.pontos === a.pontos && d.saldoGames === a.saldoGames
        );

        if (duplasEmpatadas.length === 2) {
          const confrontoDireto = this.verificarConfrontoDireto(
            partidas,
            a.id,
            b.id
          );
          if (confrontoDireto.vencedora === a.id) return -1;
          if (confrontoDireto.vencedora === b.id) return 1;
        }

        // 4. Saldo de sets
        if (a.saldoSets !== b.saldoSets) {
          return b.saldoSets - a.saldoSets;
        }

        // 5. Games vencidos
        if (a.gamesVencidos !== b.gamesVencidos) {
          return b.gamesVencidos - a.gamesVencidos;
        }

        // 6. Sorteio (se 3+ empatadas)
        if (duplasEmpatadas.length >= 3) {
          return Math.random() - 0.5;
        }

        return 0;
      });

      // Atualizar posições das DUPLAS (código existente)
      for (let i = 0; i < duplasOrdenadas.length; i++) {
        const dupla = duplasOrdenadas[i];
        await db
          .collection("duplas")
          .doc(dupla.id)
          .update({
            posicaoGrupo: i + 1,
            atualizadoEm: Timestamp.now(),
          });
      }

      // ✅ NOVO: Atualizar posições INDIVIDUAIS dos jogadores
      console.log("📊 Atualizando posições individuais dos jogadores...");

      for (let i = 0; i < duplasOrdenadas.length; i++) {
        const dupla = duplasOrdenadas[i];
        const posicao = i + 1;

        // Atualizar posição dos 2 jogadores da dupla
        await estatisticasJogadorService.atualizarPosicaoGrupo(
          dupla.jogador1Id,
          dupla.etapaId,
          posicao
        );

        await estatisticasJogadorService.atualizarPosicaoGrupo(
          dupla.jogador2Id,
          dupla.etapaId,
          posicao
        );
      }

      console.log("✅ Posições individuais atualizadas!");

      // Atualizar grupo
      const partidasFinalizadas = partidas.length;
      const totalPartidas = this.calcularTotalPartidas(duplas.length);
      const completo = partidasFinalizadas === totalPartidas;

      await db.collection("grupos").doc(grupoId).update({
        partidasFinalizadas,
        completo,
        atualizadoEm: Timestamp.now(),
      });

      console.log(
        `   ✅ Classificação atualizada (${partidasFinalizadas}/${totalPartidas} partidas)`
      );
    } catch (error) {
      console.error("Erro ao recalcular classificação:", error);
      throw error;
    }
  }

  /**
   * Verificar confronto direto entre duas duplas
   */
  private verificarConfrontoDireto(
    partidas: Partida[],
    dupla1Id: string,
    dupla2Id: string
  ): { vencedora: string | null } {
    const confronto = partidas.find(
      (p) =>
        (p.dupla1Id === dupla1Id && p.dupla2Id === dupla2Id) ||
        (p.dupla1Id === dupla2Id && p.dupla2Id === dupla1Id)
    );

    if (!confronto || !confronto.vencedoraId) {
      return { vencedora: null };
    }

    return { vencedora: confronto.vencedoraId };
  }

  /**
   * Calcular total de partidas de um grupo
   * Fórmula: n * (n-1) / 2
   * onde n = número de duplas
   */
  private calcularTotalPartidas(numeroDuplas: number): number {
    return (numeroDuplas * (numeroDuplas - 1)) / 2;
  }

  /**
   * Gerar fase eliminatória a partir dos classificados dos grupos
   */
  async gerarFaseEliminatoria(
    etapaId: string,
    arenaId: string,
    classificadosPorGrupo: number = 2
  ): Promise<{ confrontos: ConfrontoEliminatorio[] }> {
    try {
      console.log(
        `🏆 Gerando fase eliminatória (${classificadosPorGrupo} por grupo)...`
      );

      // 1. Buscar todos os grupos
      const gruposSnapshot = await db
        .collection(this.collectionGrupos)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .orderBy("ordem", "asc")
        .get();

      if (gruposSnapshot.empty) {
        throw new Error("Nenhum grupo encontrado");
      }

      // Verificar se todos os grupos estão completos
      const grupos = gruposSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id, // ← ADICIONAR ESTA LINHA!
            ...doc.data(),
          } as Grupo)
      );
      const gruposIncompletos = grupos.filter((g) => !g.completo);

      if (gruposIncompletos.length > 0) {
        const nomesGrupos = gruposIncompletos.map((g) => g.nome).join(", ");
        throw new Error(
          `Não é possível gerar a fase eliminatória. ` +
            `Os seguintes grupos ainda possuem partidas pendentes: ${nomesGrupos}. ` +
            `Por favor, finalize todas as partidas da fase de grupos antes de gerar a eliminatória.`
        );
      }

      console.log("   ✅ Todos os grupos estão completos!");

      // ============== VALIDAÇÃO: GRUPO ÚNICO ==============
      if (grupos.length === 1) {
        throw new Error(
          "Não é possível gerar fase eliminatória com apenas 1 grupo. " +
            "Grupo único é um campeonato completo onde todos jogam contra todos. " +
            "O 1º colocado já é o campeão!"
        );
      }
      // ====================================================

      // 1. Buscar todos os grupos
      const gruposOrdenados = grupos.sort((a, b) => a.ordem - b.ordem);

      // 2. Buscar duplas de cada grupo e classificar
      const classificados: Dupla[] = [];

      for (const grupo of gruposOrdenados) {
        const duplasSnapshot = await db
          .collection(this.collectionDuplas)
          .where("grupoId", "==", grupo.id)
          .orderBy("posicaoGrupo", "asc")
          .limit(classificadosPorGrupo)
          .get();

        const duplasGrupo = duplasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Dupla[];

        classificados.push(...duplasGrupo);
      }

      if (classificados.length < 2) {
        throw new Error("Mínimo de 2 classificados necessário");
      }

      console.log(`   📊 Total de classificados: ${classificados.length}`);

      // 3. Ordenar classificados (alternada + ordenação interna)
      const classificadosOrdenados = this.ordenarClassificadosAlternado(
        classificados,
        grupos.length,
        classificadosPorGrupo
      );

      console.log("   🔢 Ordem de classificação:");
      classificadosOrdenados.forEach((dupla, i) => {
        console.log(
          `   ${i + 1}º: ${dupla.jogador1Nome} & ${dupla.jogador2Nome} (${
            dupla.vitorias
          }V, ${dupla.saldoGames > 0 ? "+" : ""}${dupla.saldoGames})`
        );
      });

      // 4. Calcular BYEs necessários
      const { byes, confrontosNecessarios } = this.calcularByes(
        classificados.length
      );

      console.log(`   🎲 BYEs necessários: ${byes}`);
      console.log(
        `   ⚔️ Confrontos na primeira fase: ${confrontosNecessarios}`
      );

      // 5. Determinar tipo da primeira fase
      const tipoFase = this.determinarTipoFase(classificados.length);
      console.log(`   📍 Iniciando nas: ${tipoFase}`);

      // 6. Gerar confrontos da primeira fase
      const confrontos = await this.gerarConfrontosEliminatorios(
        etapaId,
        arenaId,
        tipoFase,
        classificadosOrdenados,
        byes
      );

      // 7. Marcar duplas como classificadas
      for (const dupla of classificados) {
        await db.collection(this.collectionDuplas).doc(dupla.id).update({
          classificada: true,
          atualizadoEm: Timestamp.now(),
        });
      }

      console.log("✅ Fase eliminatória gerada com sucesso!");

      // 8. Marcar JOGADORES individuais como classificados
      console.log("📊 Marcando jogadores individuais como classificados...");

      for (const dupla of classificados) {
        await estatisticasJogadorService.marcarComoClassificado(
          dupla.jogador1Id,
          etapaId,
          true
        );

        await estatisticasJogadorService.marcarComoClassificado(
          dupla.jogador2Id,
          etapaId,
          true
        );
      }

      console.log("✅ Jogadores individuais marcados como classificados!");

      return { confrontos };
    } catch (error: any) {
      console.error("Erro ao gerar fase eliminatória:", error);
      throw error;
    }
  }

  /**
   * Ordenar classificados com CHAVEAMENTO POR SEEDS (Tradicional de Torneio)
   *
   * REGRA DO CHAVEAMENTO:
   * - Seed 1 (melhor) vs Seed N (pior)
   * - Seed 2 vs Seed N-1
   * - Seed 3 vs Seed N-2
   * - etc.
   *
   * Isso garante:
   * 1. Melhores pegam BYE
   * 2. Melhores enfrentam piores
   * 3. Cruzamento correto entre grupos
   *
   * @param classificados - Lista de duplas classificadas
   * @param _totalGrupos - Número de grupos (não usado, mantido por compatibilidade)
   * @param classificadosPorGrupo - Quantos classificados por grupo
   */
  private ordenarClassificadosAlternado(
    classificados: Dupla[],
    _totalGrupos: number,
    classificadosPorGrupo: number
  ): Dupla[] {
    console.log("🔀 Ordenando classificados (CHAVEAMENTO POR SEEDS)...");

    // PASSO 1: Separar por posição no grupo
    const porPosicao: Dupla[][] = [];

    for (let posicao = 1; posicao <= classificadosPorGrupo; posicao++) {
      const duplasNaPosicao = classificados.filter(
        (d) => d.posicaoGrupo === posicao
      );

      // Ordenar dentro da mesma posição por desempenho
      duplasNaPosicao.sort((a, b) => {
        // 1. Vitórias
        if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
        // 2. Saldo de games
        if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
        // 3. Games vencidos
        if (a.gamesVencidos !== b.gamesVencidos)
          return b.gamesVencidos - a.gamesVencidos;
        // 4. Sorteio
        return Math.random() - 0.5;
      });

      porPosicao.push(duplasNaPosicao);
    }

    // PASSO 2: Criar lista de seeds (melhor → pior)
    const seeds: Dupla[] = [];

    // Intercalar posições: todos os 1º, depois todos os 2º, etc.
    for (let i = 0; i < porPosicao.length; i++) {
      seeds.push(...porPosicao[i]);
    }

    // Log dos seeds
    console.log("   📊 Seeds (ordenação final melhor → pior):");
    seeds.forEach((dupla, i) => {
      console.log(
        `      Seed ${i + 1}: ${dupla.posicaoGrupo}º ${dupla.grupoNome} - ${
          dupla.jogador1Nome
        } & ${dupla.jogador2Nome} (${dupla.vitorias}V, ${
          dupla.saldoGames > 0 ? "+" : ""
        }${dupla.saldoGames})`
      );
    });

    // Retornar seeds na ordem correta
    return seeds;
  }

  /**
   * Gerar confrontos com algoritmo clássico de bracket de torneio
   *
   * Para N=8: [1v8, 4v5, 2v7, 3v6]
   * Garante que os melhores seeds não se encontrem até a final
   */
  private async gerarConfrontosEliminatorios(
    etapaId: string,
    arenaId: string,
    tipoFase: TipoFase,
    classificados: Dupla[],
    _byes: number
  ): Promise<ConfrontoEliminatorio[]> {
    const confrontos: ConfrontoEliminatorio[] = [];
    let ordem = 1;

    console.log("🎲 Gerando confrontos com algoritmo clássico de bracket...");

    const totalSeeds = classificados.length;
    const proximaPotencia = Math.pow(2, Math.ceil(Math.log2(totalSeeds)));

    console.log(`   📊 Total seeds: ${totalSeeds}`);
    console.log(`   📊 Potência: ${proximaPotencia}`);

    // ============== ALGORITMO CLÁSSICO DE SEEDING ==============
    // Gera a ordem correta de pareamentos para qualquer potência de 2

    function gerarOrdemBracket(n: number): number[] {
      if (n === 1) return [1];

      const anterior = gerarOrdemBracket(n / 2);
      const resultado: number[] = [];

      for (const seed of anterior) {
        resultado.push(seed);
        resultado.push(n + 1 - seed);
      }

      return resultado;
    }

    const ordemSeeds = gerarOrdemBracket(proximaPotencia);

    console.log(`   🎯 Ordem de seeds: [${ordemSeeds.join(", ")}]`);

    // Criar pareamentos (pares consecutivos)
    const pareamentos: Array<{
      seed1: number;
      seed2: number;
      seed1Existe: boolean;
      seed2Existe: boolean;
    }> = [];

    for (let i = 0; i < ordemSeeds.length; i += 2) {
      const seed1 = ordemSeeds[i];
      const seed2 = ordemSeeds[i + 1];

      pareamentos.push({
        seed1,
        seed2,
        seed1Existe: seed1 <= totalSeeds,
        seed2Existe: seed2 <= totalSeeds,
      });
    }

    console.log(`   🎯 Pareamentos base (para ${proximaPotencia}):`);
    pareamentos.forEach((p, idx) => {
      const s1 = p.seed1Existe ? `Seed ${p.seed1}` : "---";
      const s2 = p.seed2Existe ? `Seed ${p.seed2}` : "---";
      console.log(`      ${idx + 1}. ${s1} vs ${s2}`);
    });

    // ============== PROTEÇÃO CONTRA MESMO GRUPO ==============
    console.log("   🛡️ Aplicando proteção contra mesmo grupo...");

    const confrontosReais = pareamentos
      .map((p, index) => ({ ...p, index }))
      .filter((p) => p.seed1Existe && p.seed2Existe);

    for (let i = 0; i < confrontosReais.length; i++) {
      const pareamento = confrontosReais[i];
      const dupla1 = classificados[pareamento.seed1 - 1];
      const dupla2 = classificados[pareamento.seed2 - 1];

      if (dupla1.grupoId === dupla2.grupoId) {
        console.log(
          `   ⚠️ Mesmo grupo: Seed ${pareamento.seed1} (${dupla1.grupoNome}) vs Seed ${pareamento.seed2} (${dupla2.grupoNome})`
        );

        let trocaFeita = false;

        // ========== ESTRATÉGIA 1: Trocar seed2 com outro seed2 (PARA FRENTE) ==========
        for (let j = i + 1; j < confrontosReais.length; j++) {
          const outro = confrontosReais[j];
          const outraDupla1 = classificados[outro.seed1 - 1];
          const outraDupla2 = classificados[outro.seed2 - 1];

          const novoPar1Ok = dupla1.grupoId !== outraDupla2.grupoId;
          const novoPar2Ok = outraDupla1.grupoId !== dupla2.grupoId;

          if (novoPar1Ok && novoPar2Ok) {
            console.log(
              `   🔄 Trocando seed2: Seed ${pareamento.seed2} ↔ Seed ${outro.seed2}`
            );

            const temp = pareamento.seed2;
            pareamento.seed2 = outro.seed2;
            outro.seed2 = temp;

            pareamentos[pareamento.index].seed2 = pareamento.seed2;
            pareamentos[outro.index].seed2 = outro.seed2;

            trocaFeita = true;
            console.log(`   ✅ Troca realizada!`);
            break;
          }
        }

        // ========== ESTRATÉGIA 2: Trocar seed2 com outro seed2 (PARA TRÁS) ==========
        if (!trocaFeita) {
          for (let j = i - 1; j >= 0; j--) {
            const outro = confrontosReais[j];
            const outraDupla1 = classificados[outro.seed1 - 1];
            const outraDupla2 = classificados[outro.seed2 - 1];

            const novoPar1Ok = dupla1.grupoId !== outraDupla2.grupoId;
            const novoPar2Ok = outraDupla1.grupoId !== dupla2.grupoId;

            if (novoPar1Ok && novoPar2Ok) {
              console.log(
                `   🔄 Trocando seed2 (para trás): Seed ${pareamento.seed2} ↔ Seed ${outro.seed2}`
              );

              const temp = pareamento.seed2;
              pareamento.seed2 = outro.seed2;
              outro.seed2 = temp;

              pareamentos[pareamento.index].seed2 = pareamento.seed2;
              pareamentos[outro.index].seed2 = outro.seed2;

              trocaFeita = true;
              console.log(`   ✅ Troca realizada!`);
              break;
            }
          }
        }

        // ========== ESTRATÉGIA 3: Trocar seed1 com outro seed1 (SE NECESSÁRIO) ==========
        if (!trocaFeita) {
          console.log(`   🔍 Tentando trocar seed1...`);

          for (let j = 0; j < confrontosReais.length; j++) {
            if (j === i) continue; // Pular o próprio confronto

            const outro = confrontosReais[j];
            const outraDupla1 = classificados[outro.seed1 - 1];
            const outraDupla2 = classificados[outro.seed2 - 1];

            const novoPar1Ok = outraDupla1.grupoId !== dupla2.grupoId;
            const novoPar2Ok = dupla1.grupoId !== outraDupla2.grupoId;

            if (novoPar1Ok && novoPar2Ok) {
              console.log(
                `   🔄 Trocando seed1: Seed ${pareamento.seed1} ↔ Seed ${outro.seed1}`
              );

              const temp = pareamento.seed1;
              pareamento.seed1 = outro.seed1;
              outro.seed1 = temp;

              pareamentos[pareamento.index].seed1 = pareamento.seed1;
              pareamentos[outro.index].seed1 = outro.seed1;

              trocaFeita = true;
              console.log(`   ✅ Troca realizada!`);
              break;
            }
          }
        }

        if (!trocaFeita) {
          console.log(
            `   ⚠️ Não foi possível evitar confronto do mesmo grupo (configuração inevitável)`
          );
        }
      }
    }

    // ============== CRIAR CONFRONTOS ==============
    console.log("   ⚔️ Criando confrontos:");

    for (const pareamento of pareamentos) {
      if (pareamento.seed1Existe && pareamento.seed2Existe) {
        // Confronto real
        const dupla1 = classificados[pareamento.seed1 - 1];
        const dupla2 = classificados[pareamento.seed2 - 1];

        const mesmoGrupo = dupla1.grupoId === dupla2.grupoId;

        console.log(
          `   ${ordem}. Seed ${pareamento.seed1} vs Seed ${pareamento.seed2} (${
            dupla1.grupoNome
          } vs ${dupla2.grupoNome}) ${mesmoGrupo ? "⚠️" : "✅"}`
        );

        const confronto: ConfrontoEliminatorio = {
          id: "",
          etapaId,
          arenaId,
          fase: tipoFase,
          ordem: ordem++,
          dupla1Id: dupla1.id,
          dupla1Nome: `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`,
          dupla1Origem: `${dupla1.posicaoGrupo}º ${dupla1.grupoNome}`,
          dupla2Id: dupla2.id,
          dupla2Nome: `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`,
          dupla2Origem: `${dupla2.posicaoGrupo}º ${dupla2.grupoNome}`,
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
      } else if (pareamento.seed1Existe) {
        // BYE para seed1
        const dupla = classificados[pareamento.seed1 - 1];

        console.log(
          `   ${ordem}. Seed ${pareamento.seed1} (BYE) - ${dupla.grupoNome}`
        );

        const confronto: ConfrontoEliminatorio = {
          id: "",
          etapaId,
          arenaId,
          fase: tipoFase,
          ordem: ordem++,
          dupla1Id: dupla.id,
          dupla1Nome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
          dupla1Origem: `${dupla.posicaoGrupo}º ${dupla.grupoNome}`,
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
      } else if (pareamento.seed2Existe) {
        // BYE para seed2
        const dupla = classificados[pareamento.seed2 - 1];

        console.log(
          `   ${ordem}. Seed ${pareamento.seed2} (BYE) - ${dupla.grupoNome}`
        );

        const confronto: ConfrontoEliminatorio = {
          id: "",
          etapaId,
          arenaId,
          fase: tipoFase,
          ordem: ordem++,
          dupla1Id: dupla.id,
          dupla1Nome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
          dupla1Origem: `${dupla.posicaoGrupo}º ${dupla.grupoNome}`,
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
    }

    console.log(`   ✅ ${confrontos.length} confrontos gerados!`);

    return confrontos;
  }

  /**
   * Calcular quantidade de BYEs necessários
   */
  private calcularByes(totalClassificados: number): {
    byes: number;
    confrontosNecessarios: number;
    proximaPotencia: number;
  } {
    // Próxima potência de 2
    const proximaPotencia = Math.pow(
      2,
      Math.ceil(Math.log2(totalClassificados))
    );

    // Quantos precisam ser eliminados para chegar na potência
    const precisamJogar = (totalClassificados - proximaPotencia / 2) * 2;

    // Quantos ganham BYE
    const byes = totalClassificados - precisamJogar;

    // Quantidade de confrontos na primeira fase
    const confrontosNecessarios = precisamJogar / 2;

    return { byes, confrontosNecessarios, proximaPotencia };
  }

  /**
   * Determinar tipo da primeira fase baseado no número de classificados
   */
  private determinarTipoFase(totalClassificados: number): TipoFase {
    if (totalClassificados > 8) return TipoFase.OITAVAS;
    if (totalClassificados > 4) return TipoFase.QUARTAS;
    if (totalClassificados > 2) return TipoFase.SEMIFINAL;
    return TipoFase.FINAL;
  }

  /**
   * Registrar resultado de confronto eliminatório
   */
  async registrarResultadoEliminatorio(
    confrontoId: string,
    arenaId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void> {
    try {
      console.log(`⚔️ Registrando resultado do confronto ${confrontoId}...`);

      // Buscar confronto
      const confrontoDoc = await db
        .collection("confrontos_eliminatorios")
        .doc(confrontoId)
        .get();

      if (!confrontoDoc.exists) {
        throw new Error("Confronto não encontrado");
      }

      const confronto = {
        id: confrontoDoc.id,
        ...confrontoDoc.data(),
      } as ConfrontoEliminatorio;

      if (confronto.arenaId !== arenaId) {
        throw new Error("Confronto não pertence a esta arena");
      }

      if (confronto.status === StatusConfrontoEliminatorio.FINALIZADA) {
        // É edição - reverter estatísticas antigas
        console.log("   🔄 Modo edição - revertendo estatísticas antigas...");

        if (confronto.partidaId) {
          const partidaDoc = await db
            .collection(this.collectionPartidas)
            .doc(confronto.partidaId)
            .get();
          if (partidaDoc.exists) {
            const partida = partidaDoc.data() as Partida;

            // Reverter estatísticas (validar placar primeiro)
            if (partida.placar && partida.placar.length > 0) {
              await this.reverterEstatisticasDuplas(
                confronto.dupla1Id!,
                confronto.dupla2Id!,
                partida.vencedoraId!,
                partida.setsDupla1,
                partida.setsDupla2,
                partida.placar[0].gamesDupla1,
                partida.placar[0].gamesDupla2,
                partida.placar[0].gamesDupla2,
                partida.placar[0].gamesDupla1
              );
            }
          }
        }
      }

      // Validar placar (1 SET APENAS)
      if (placar.length !== 1) {
        throw new Error("Placar inválido: deve ter apenas 1 set");
      }

      // Criar ou atualizar partida
      const set = placar[0];
      const vencedoraId =
        set.gamesDupla1 > set.gamesDupla2
          ? confronto.dupla1Id!
          : confronto.dupla2Id!;
      const vencedoraNome =
        set.gamesDupla1 > set.gamesDupla2
          ? confronto.dupla1Nome!
          : confronto.dupla2Nome!;

      let partidaId = confronto.partidaId;

      if (!partidaId) {
        // Criar nova partida
        const partida: Partial<Partida> = {
          etapaId: confronto.etapaId,
          arenaId: confronto.arenaId,
          tipo: "eliminatoria",
          fase: this.mapTipoFaseToFaseEtapa(confronto.fase),
          dupla1Id: confronto.dupla1Id!,
          dupla1Nome: confronto.dupla1Nome!,
          dupla2Id: confronto.dupla2Id!,
          dupla2Nome: confronto.dupla2Nome!,
          status: StatusPartida.FINALIZADA,
          setsDupla1: set.gamesDupla1 > set.gamesDupla2 ? 1 : 0,
          setsDupla2: set.gamesDupla2 > set.gamesDupla1 ? 1 : 0,
          placar: [
            {
              ...set,
              vencedorId: vencedoraId,
            },
          ],
          vencedoraId,
          vencedoraNome,
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
          finalizadoEm: Timestamp.now(),
        };

        const partidaRef = await db
          .collection(this.collectionPartidas)
          .add(partida);
        partidaId = partidaRef.id;
      } else {
        // Atualizar partida existente
        await db
          .collection(this.collectionPartidas)
          .doc(partidaId)
          .update({
            setsDupla1: set.gamesDupla1 > set.gamesDupla2 ? 1 : 0,
            setsDupla2: set.gamesDupla2 > set.gamesDupla1 ? 1 : 0,
            placar: [
              {
                ...set,
                vencedorId: vencedoraId,
              },
            ],
            vencedoraId,
            vencedoraNome,
            atualizadoEm: Timestamp.now(),
          });
      }

      // Buscar duplas (para pegar IDs dos jogadores)
      const dupla1Doc = await db
        .collection("duplas")
        .doc(confronto.dupla1Id!)
        .get();
      const dupla2Doc = await db
        .collection("duplas")
        .doc(confronto.dupla2Id!)
        .get();

      if (!dupla1Doc.exists || !dupla2Doc.exists) {
        throw new Error("Duplas não encontradas");
      }

      const dupla1 = { id: dupla1Doc.id, ...dupla1Doc.data() } as Dupla;
      const dupla2 = { id: dupla2Doc.id, ...dupla2Doc.data() } as Dupla;

      // ✅ NOVO: Atualizar estatísticas INDIVIDUAIS dos 4 jogadores
      console.log("📊 Atualizando estatísticas individuais (eliminatória)...");

      const dupla1Venceu = vencedoraId === confronto.dupla1Id;

      // Jogador 1A (dupla 1)
      await estatisticasJogadorService.atualizarAposPartida(
        dupla1.jogador1Id,
        confronto.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: dupla1Venceu ? 1 : 0,
          setsPerdidos: dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      );

      // Jogador 1B (dupla 1)
      await estatisticasJogadorService.atualizarAposPartida(
        dupla1.jogador2Id,
        confronto.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: dupla1Venceu ? 1 : 0,
          setsPerdidos: dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      );

      // Jogador 2A (dupla 2)
      await estatisticasJogadorService.atualizarAposPartida(
        dupla2.jogador1Id,
        confronto.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: !dupla1Venceu ? 1 : 0,
          setsPerdidos: !dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      );

      // Jogador 2B (dupla 2)
      await estatisticasJogadorService.atualizarAposPartida(
        dupla2.jogador2Id,
        confronto.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: !dupla1Venceu ? 1 : 0,
          setsPerdidos: !dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      );

      console.log("✅ Estatísticas individuais atualizadas (eliminatória)!");

      // Atualizar confronto
      await db
        .collection("confrontos_eliminatorios")
        .doc(confrontoId)
        .update({
          partidaId,
          status: StatusConfrontoEliminatorio.FINALIZADA,
          vencedoraId,
          vencedoraNome,
          placar: `${set.gamesDupla1}-${set.gamesDupla2}`,
          atualizadoEm: Timestamp.now(),
        });

      // Avançar vencedor para próxima fase
      await this.avancarVencedor(confronto, vencedoraId, vencedoraNome);

      console.log("✅ Resultado registrado e vencedor avançado!");
    } catch (error: any) {
      console.error("Erro ao registrar resultado eliminatório:", error);
      throw error;
    }
  }

  /**
   * Avançar vencedor para próxima fase (COM ORDENAÇÃO CORRETA)
   */
  private async avancarVencedor(
    confronto: ConfrontoEliminatorio,
    _vencedoraId: string,
    _vencedoraNome: string
  ): Promise<void> {
    // Determinar próxima fase
    const proximaFase = this.obterProximaFase(confronto.fase);

    if (!proximaFase) {
      console.log("   🏆 CAMPEÃO DEFINIDO!");
      return;
    }

    console.log(`   ⏭️ Avançando para ${proximaFase}...`);

    // Verificar quantos confrontos da fase atual foram finalizados
    const confrontosFaseSnapshot = await db
      .collection("confrontos_eliminatorios")
      .where("etapaId", "==", confronto.etapaId)
      .where("fase", "==", confronto.fase)
      .orderBy("ordem", "asc") // ✅ IMPORTANTE: Ordenar por ordem!
      .get();

    const confrontosFase = confrontosFaseSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];

    const finalizados = confrontosFase.filter(
      (c) =>
        c.status === StatusConfrontoEliminatorio.FINALIZADA ||
        c.status === StatusConfrontoEliminatorio.BYE
    );

    console.log(`   📊 Fase ${confronto.fase}:`);
    console.log(
      `      Finalizados: ${finalizados.length}/${confrontosFase.length}`
    );

    // Se todos os confrontos da fase atual foram finalizados
    if (finalizados.length === confrontosFase.length) {
      console.log(`   ✅ Todos finalizados! Gerando ${proximaFase}...`);

      // ✅ LOG CRÍTICO: Mostrar ordem dos vencedores
      console.log(`   📋 Lista de vencedores NA ORDEM:`);
      finalizados.forEach((c) => {
        console.log(
          `      Ordem ${c.ordem}: ${c.vencedoraNome} (${
            c.status === StatusConfrontoEliminatorio.BYE ? "BYE" : "vencedor"
          })`
        );
      });

      // ============= VERIFICAR SE PRÓXIMA FASE JÁ EXISTE =============
      const confrontosProximaFaseSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", confronto.etapaId)
        .where("arenaId", "==", confronto.arenaId)
        .where("fase", "==", proximaFase)
        .get();

      // ✅ IMPORTANTE: Coletar vencedores JÁ ORDENADOS pela ordem do confronto
      const vencedores = finalizados.map((c) => ({
        id: c.vencedoraId!,
        nome: c.vencedoraNome!,
        origem: `Vencedor ${c.fase} ${c.ordem}`,
        ordem: c.ordem, // ✅ Manter a ordem
        confrontoOrigem: c.id,
      }));

      // ✅ LOG CRÍTICO: Mostrar como vão ser pareados
      console.log(`   🎯 Pareamentos da ${proximaFase}:`);
      for (let i = 0; i < vencedores.length; i += 2) {
        const v1 = vencedores[i];
        const v2 = vencedores[i + 1];
        console.log(
          `      Confronto ${i / 2 + 1}: ${v1.nome} (ordem ${v1.ordem}) vs ${
            v2.nome
          } (ordem ${v2.ordem})`
        );
      }

      if (!confrontosProximaFaseSnapshot.empty) {
        console.log(`   ⚠️ ${proximaFase} já existe! Atualizando...`);
        await this.atualizarProximaFaseConfrontos(
          confronto.etapaId,
          confronto.arenaId,
          proximaFase,
          vencedores
        );
        return;
      }

      // Se não existe, criar nova fase
      await this.gerarProximaFaseConfrontos(
        confronto.etapaId,
        confronto.arenaId,
        proximaFase,
        vencedores
      );
    }
  }

  /**
   * Atualizar confrontos da próxima fase quando resultados são editados
   */
  private async atualizarProximaFaseConfrontos(
    etapaId: string,
    arenaId: string,
    fase: TipoFase,
    vencedores: {
      id: string;
      nome: string;
      origem: string;
      confrontoOrigem: string;
      ordem: number;
    }[]
  ): Promise<void> {
    try {
      console.log(`   🔄 Atualizando confrontos da ${fase}...`);

      // Buscar confrontos existentes da fase
      const confrontosSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("fase", "==", fase)
        .orderBy("ordem", "asc")
        .get();

      const confrontos = confrontosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ConfrontoEliminatorio[];

      // Atualizar cada confronto com os novos vencedores
      let vencedorIndex = 0;
      for (const confronto of confrontos) {
        const v1 = vencedores[vencedorIndex];
        const v2 = vencedores[vencedorIndex + 1];
        vencedorIndex += 2;

        // Verificar se precisa atualizar
        const mudou =
          confronto.dupla1Id !== v1.id || confronto.dupla2Id !== v2.id;

        if (mudou) {
          console.log(
            `   📝 Atualizando confronto ${confronto.ordem} da ${fase}`
          );

          // Se o confronto já tinha resultado, limpar
          const updates: any = {
            dupla1Id: v1.id,
            dupla1Nome: v1.nome,
            dupla1Origem: v1.origem,
            dupla2Id: v2.id,
            dupla2Nome: v2.nome,
            dupla2Origem: v2.origem,
            atualizadoEm: Timestamp.now(),
          };

          // Se já tinha resultado, resetar para agendada
          if (confronto.status === StatusConfrontoEliminatorio.FINALIZADA) {
            console.log(`   ⚠️ Confronto já tinha resultado - resetando!`);

            // Se tinha partida, deletar
            if (confronto.partidaId) {
              await db.collection("partidas").doc(confronto.partidaId).delete();
            }

            updates.status = StatusConfrontoEliminatorio.AGENDADA;
            updates.vencedoraId = null;
            updates.vencedoraNome = null;
            updates.placar = null;
            updates.partidaId = null;
          }

          await db
            .collection("confrontos_eliminatorios")
            .doc(confronto.id)
            .update(updates);
        }
      }

      console.log(`   ✅ ${fase} atualizada com novos vencedores`);
    } catch (error) {
      console.error("Erro ao atualizar próxima fase:", error);
      throw error;
    }
  }

  /**
   * Obter próxima fase
   */
  private obterProximaFase(faseAtual: TipoFase): TipoFase | null {
    switch (faseAtual) {
      case TipoFase.OITAVAS:
        return TipoFase.QUARTAS;
      case TipoFase.QUARTAS:
        return TipoFase.SEMIFINAL;
      case TipoFase.SEMIFINAL:
        return TipoFase.FINAL;
      case TipoFase.FINAL:
        return null; // Acabou
      default:
        return null;
    }
  }

  /**
   * Gerar confrontos da próxima fase (COM PAREAMENTO CORRETO)
   */
  private async gerarProximaFaseConfrontos(
    etapaId: string,
    arenaId: string,
    fase: TipoFase,
    vencedores: { id: string; nome: string; origem: string; ordem: number }[]
  ): Promise<void> {
    let ordem = 1;

    console.log(`   🎯 Gerando ${fase}...`);
    console.log(`      Pareamentos:`);

    for (let i = 0; i < vencedores.length; i += 2) {
      const v1 = vencedores[i];
      const v2 = vencedores[i + 1];

      console.log(
        `      Confronto ${ordem}: ${v1.nome} (da ordem ${v1.ordem}) vs ${v2.nome} (da ordem ${v2.ordem})`
      );

      const confronto: Partial<ConfrontoEliminatorio> = {
        etapaId,
        arenaId,
        fase,
        ordem: ordem++,
        dupla1Id: v1.id,
        dupla1Nome: v1.nome,
        dupla1Origem: v1.origem,
        dupla2Id: v2.id,
        dupla2Nome: v2.nome,
        dupla2Origem: v2.origem,
        status: StatusConfrontoEliminatorio.AGENDADA,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      };

      const docRef = await db
        .collection("confrontos_eliminatorios")
        .add(confronto);
      await docRef.update({ id: docRef.id });
    }

    console.log(`   ✅ ${fase} gerada com ${vencedores.length / 2} confrontos`);
  }

  /**
   * Buscar confrontos eliminatórios por fase
   */
  async buscarConfrontosEliminatorios(
    etapaId: string,
    arenaId: string,
    fase?: TipoFase
  ): Promise<ConfrontoEliminatorio[]> {
    try {
      let query = db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId);

      if (fase) {
        query = query.where("fase", "==", fase);
      }

      const snapshot = await query.orderBy("ordem", "asc").get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ConfrontoEliminatorio[];
    } catch (error) {
      console.error("Erro ao buscar confrontos eliminatórios:", error);
      throw error;
    }
  }

  /**
   * Cancelar/Excluir fase eliminatória
   * Permite ajustar resultados da fase de grupos e gerar novamente
   */
  async cancelarFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    try {
      console.log("🗑️ Cancelando fase eliminatória...");

      // Verificar se etapa existe
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      // Buscar confrontos eliminatórios
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

      // ============== NOVO: REVERTER ESTATÍSTICAS INDIVIDUAIS ==============
      console.log("🔄 Revertendo estatísticas individuais dos jogadores...");

      // Buscar partidas eliminatórias ANTES de deletar
      const partidasSnapshot = await db
        .collection(this.collectionPartidas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("tipo", "==", "eliminatoria")
        .get();

      if (!partidasSnapshot.empty) {
        console.log(`   📊 ${partidasSnapshot.size} partidas encontradas`);

        for (const partidaDoc of partidasSnapshot.docs) {
          const partida = {
            id: partidaDoc.id,
            ...partidaDoc.data(),
          } as Partida;

          // Só reverter se a partida foi finalizada
          if (
            partida.status === StatusPartida.FINALIZADA &&
            partida.placar &&
            partida.placar.length > 0
          ) {
            console.log(`   ↩️ Revertendo partida ${partida.id}...`);

            // Buscar duplas para pegar IDs dos jogadores
            const dupla1Doc = await db
              .collection(this.collectionDuplas)
              .doc(partida.dupla1Id)
              .get();
            const dupla2Doc = await db
              .collection(this.collectionDuplas)
              .doc(partida.dupla2Id)
              .get();

            if (dupla1Doc.exists && dupla2Doc.exists) {
              const dupla1 = { id: dupla1Doc.id, ...dupla1Doc.data() } as Dupla;
              const dupla2 = { id: dupla2Doc.id, ...dupla2Doc.data() } as Dupla;

              // Calcular estatísticas da partida
              let setsDupla1 = 0;
              let setsDupla2 = 0;
              let gamesVencidosDupla1 = 0;
              let gamesPerdidosDupla1 = 0;
              let gamesVencidosDupla2 = 0;
              let gamesPerdidosDupla2 = 0;

              partida.placar.forEach((set) => {
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

              // Reverter estatísticas dos 4 jogadores
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

        // Agora deletar as partidas
        const partidasBatch = db.batch();
        partidasSnapshot.docs.forEach((doc) => {
          partidasBatch.delete(doc.ref);
        });
        await partidasBatch.commit();
        console.log(
          `   ✅ ${partidasSnapshot.size} partidas eliminatórias excluídas`
        );
      }
      // ====================================================================

      // Excluir confrontos eliminatórios
      const confrontosBatch = db.batch();
      confrontosSnapshot.docs.forEach((doc) => {
        confrontosBatch.delete(doc.ref);
      });
      await confrontosBatch.commit();
      console.log(
        `   ✅ ${confrontosSnapshot.size} confrontos eliminatórios excluídos`
      );

      // ============== NOVO: DESMARCAR JOGADORES INDIVIDUAIS ==============
      console.log("📊 Desmarcando jogadores individuais como classificados...");

      // Buscar duplas classificadas para pegar IDs dos jogadores
      const duplasSnapshot = await db
        .collection(this.collectionDuplas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("classificada", "==", true)
        .get();

      if (!duplasSnapshot.empty) {
        const jogadoresIds = new Set<string>();

        // Coletar IDs de todos os jogadores classificados
        duplasSnapshot.docs.forEach((doc) => {
          const dupla = doc.data() as Dupla;
          jogadoresIds.add(dupla.jogador1Id);
          jogadoresIds.add(dupla.jogador2Id);
        });

        // Desmarcar jogadores individuais
        for (const jogadorId of jogadoresIds) {
          await estatisticasJogadorService.marcarComoClassificado(
            jogadorId,
            etapaId,
            false
          );
        }

        console.log(
          `   ✅ ${jogadoresIds.size} jogadores desmarcados como classificados`
        );

        // Desmarcar duplas
        const duplasBatch = db.batch();
        duplasSnapshot.docs.forEach((doc) => {
          duplasBatch.update(doc.ref, {
            classificada: false,
            atualizadoEm: Timestamp.now(),
          });
        });
        await duplasBatch.commit();
        console.log(
          `   ✅ ${duplasSnapshot.size} duplas desmarcadas como classificadas`
        );
      }
      // ====================================================================

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

export default new ChaveService();
