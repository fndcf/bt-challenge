/**
 * Service para gerenciar etapas
 */

import { Timestamp } from "firebase-admin/firestore";
import {
  Etapa,
  CriarEtapaDTO,
  AtualizarEtapaDTO,
  DadosAtualizacaoEtapa,
  InscreverJogadorDTO,
  FiltrosEtapa,
  ListagemEtapas,
  StatusEtapa,
  EstatisticasEtapa,
  CriarEtapaSchema,
  AtualizarEtapaSchema,
  InscreverJogadorSchema,
  validarConfiguracaoFormato,
  FormatoEtapa,
} from "../models/Etapa";
import { getRegras } from "../models/RegrasFormato";
import { Inscricao, StatusInscricao } from "../models/Inscricao";
import { GeneroJogador } from "../models/Jogador";
import logger from "../utils/logger";

// Interfaces dos repositories
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import { IInscricaoRepository } from "../repositories/interfaces/IInscricaoRepository";
import { IJogadorRepository } from "../repositories/interfaces/IJogadorRepository";

// Implementações Firebase (para instância default)
import { EtapaRepository } from "../repositories/firebase/EtapaRepository";
import { InscricaoRepository } from "../repositories/firebase/InscricaoRepository";
import { JogadorRepository } from "../repositories/firebase/JogadorRepository";
import cabecaDeChaveService from "./CabecaDeChaveService";

/**
 * Usa injeção de dependência para repositories
 */
export class EtapaService {
  constructor(
    private etapaRepository: IEtapaRepository,
    private inscricaoRepository: IInscricaoRepository,
    private jogadorRepository: IJogadorRepository
  ) {}

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

      // Comparar apenas datas (sem hora) para evitar problemas de fuso
      const hojeStr = new Date().toISOString().split("T")[0];
      const dataFimStr = dataFim.toISOString().split("T")[0];
      const dataRealizacaoStr = dataRealizacao.toISOString().split("T")[0];

      if (dataFim <= dataInicio) {
        throw new Error("Data fim deve ser posterior à data início");
      }

      if (dataFimStr < hojeStr) {
        throw new Error("Data fim das inscrições não pode ser anterior a hoje");
      }

      if (dataRealizacaoStr < hojeStr) {
        throw new Error("Data de realização não pode ser anterior a hoje");
      }

      if (dataRealizacao <= dataFim) {
        throw new Error(
          "Data de realização deve ser posterior ao fim das inscrições"
        );
      }

      if (dadosValidados.maxJogadores % 2 !== 0) {
        throw new Error("Número máximo de jogadores deve ser par");
      }

      // Log para debug - tipoFormacaoDupla
      logger.info("DEBUG tipoFormacaoDupla", {
        recebido: data.tipoFormacaoDupla,
        validado: dadosValidados.tipoFormacaoDupla,
        formato: dadosValidados.formato,
      });

      // Usar repository para criar
      const novaEtapa = await this.etapaRepository.criar({
        arenaId,
        criadoPor: adminUid,
        nome: dadosValidados.nome.trim(),
        descricao: dadosValidados.descricao?.trim(),
        nivel: dadosValidados.nivel,
        genero: dadosValidados.genero,
        formato: dadosValidados.formato,
        tipoChaveamento: dadosValidados.tipoChaveamento,
        tipoFormacaoDupla: dadosValidados.tipoFormacaoDupla, // Para DUPLA_FIXA balanceada
        varianteSuperX: dadosValidados.varianteSuperX,
        // Campos TEAMS
        varianteTeams: dadosValidados.varianteTeams,
        tipoFormacaoEquipe: dadosValidados.tipoFormacaoEquipe,
        tipoFormacaoJogos: dadosValidados.tipoFormacaoJogos,
        isMisto: dadosValidados.isMisto,
        dataInicio: dataInicio,
        dataFim: dataFim,
        dataRealizacao: dataRealizacao,
        local: dadosValidados.local?.trim(),
        maxJogadores: dadosValidados.maxJogadores,
        jogadoresPorGrupo: dadosValidados.jogadoresPorGrupo,
        grupoUnico: dadosValidados.grupoUnico,
        contaPontosRanking: dadosValidados.contaPontosRanking ?? true,
        darPontosParticipacao: dadosValidados.darPontosParticipacao ?? true,
        melhorDe3: dadosValidados.melhorDe3 ?? false,
        melhorDe3Eliminatoria: dadosValidados.melhorDe3Eliminatoria ?? false,
      });

      logger.info("Etapa criada", {
        etapaId: novaEtapa.id,
        nome: novaEtapa.nome,
        nivel: novaEtapa.nivel,
        genero: novaEtapa.genero,
        formato: novaEtapa.formato,
        maxJogadores: novaEtapa.maxJogadores,
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
    return this.etapaRepository.buscarPorIdEArena(id, arenaId);
  }

  /**
   * Buscar uma inscrição específica
   */
  async buscarInscricao(
    etapaId: string,
    arenaId: string,
    inscricaoId: string
  ): Promise<Inscricao | null> {
    return this.inscricaoRepository.buscarPorIdEtapaArena(
      inscricaoId,
      etapaId,
      arenaId
    );
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

      // Usar repository para buscar jogador
      const jogador = await this.jogadorRepository.buscarPorIdEArena(
        dadosValidados.jogadorId,
        arenaId
      );
      if (!jogador) {
        throw new Error("Jogador não encontrado");
      }

      const regras = getRegras(etapa.formato);

      // Validar nível
      if (regras.inscricaoExigeNivel && etapa.nivel) {
        if (jogador.nivel !== etapa.nivel) {
          throw new Error(
            `Este jogador não pode se inscrever nesta etapa. ` +
              `Etapa para jogadores ${etapa.nivel}, jogador é ${jogador.nivel}`
          );
        }
      }

      // Validar gênero: etapa "misto" aceita masculino ou feminino
      const isMisto = etapa.genero === GeneroJogador.MISTO;
      const generoValido = isMisto
        ? jogador.genero === GeneroJogador.MASCULINO ||
          jogador.genero === GeneroJogador.FEMININO
        : jogador.genero === etapa.genero;

      if (!generoValido) {
        throw new Error(
          `Este jogador não pode se inscrever nesta etapa. ` +
            `Etapa ${etapa.genero}, jogador é ${jogador.genero}`
        );
      }

      // Verificar se já está inscrito
      const jaInscrito = await this.inscricaoRepository.jogadorInscrito(
        etapaId,
        dadosValidados.jogadorId
      );
      if (jaInscrito) {
        throw new Error("Jogador já está inscrito nesta etapa");
      }

      // Validar proporção de gênero para etapas mistas
      if (regras.mistoDivideVagas && isMisto) {
        const inscricoesAtuais =
          await this.inscricaoRepository.buscarConfirmadas(etapaId, arenaId);

        // Contar inscritos por gênero
        const masculinosInscritos = inscricoesAtuais.filter(
          (i) => i.jogadorGenero === GeneroJogador.MASCULINO
        ).length;
        const femininasInscritas = inscricoesAtuais.filter(
          (i) => i.jogadorGenero === GeneroJogador.FEMININO
        ).length;

        // Calcular o máximo permitido para cada gênero (50%)
        const maxPorGenero = etapa.maxJogadores / 2;

        // Verificar se a nova inscrição excederia o limite
        if (jogador.genero === GeneroJogador.MASCULINO) {
          if (masculinosInscritos >= maxPorGenero) {
            throw new Error(
              `Limite de jogadores masculinos atingido (${maxPorGenero}). ` +
                `Etapas mistas requerem 50% de cada gênero.`
            );
          }
        } else if (jogador.genero === GeneroJogador.FEMININO) {
          if (femininasInscritas >= maxPorGenero) {
            throw new Error(
              `Limite de jogadoras femininas atingido (${maxPorGenero}). ` +
                `Etapas mistas requerem 50% de cada gênero.`
            );
          }
        }
      }

      // Criar inscrição via repository
      const novaInscricao = await this.inscricaoRepository.criar({
        etapaId,
        arenaId,
        jogadorId: dadosValidados.jogadorId,
        jogadorNome: jogador.nome,
        jogadorNivel: jogador.nivel,
        jogadorGenero: jogador.genero,
        status: StatusInscricao.CONFIRMADA,
      });

      // Incrementar inscritos na etapa
      await this.etapaRepository.incrementarInscritos(
        etapaId,
        dadosValidados.jogadorId
      );

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
   * Inscrever múltiplos jogadores em lote
   */
  async inscreverJogadoresEmLote(
    etapaId: string,
    arenaId: string,
    jogadorIds: string[]
  ): Promise<{
    inscricoes: Inscricao[];
    erros: Array<{ jogadorId: string; erro: string }>;
  }> {
    try {
      const inscricoes: Inscricao[] = [];
      const erros: Array<{ jogadorId: string; erro: string }> = [];

      // Buscar etapa uma única vez
      const etapa = await this.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.status !== StatusEtapa.INSCRICOES_ABERTAS) {
        throw new Error("Inscrições não estão abertas para esta etapa");
      }

      // Buscar inscrições existentes uma única vez
      const inscricoesExistentes =
        await this.inscricaoRepository.buscarConfirmadas(etapaId, arenaId);

      // Verificar limite total
      const vagas = etapa.maxJogadores - inscricoesExistentes.length;
      if (jogadorIds.length > vagas) {
        throw new Error(
          `Apenas ${vagas} vagas disponíveis. Tentando inscrever ${jogadorIds.length} jogadores.`
        );
      }

      // Buscar todos os jogadores de uma vez
      const jogadoresPromises = jogadorIds.map((id) =>
        this.jogadorRepository.buscarPorIdEArena(id, arenaId)
      );
      const jogadores = await Promise.all(jogadoresPromises);

      // Preparar dados para validação
      const isMisto = etapa.genero === GeneroJogador.MISTO;
      const regras = getRegras(etapa.formato);

      // Contar inscritos atuais por gênero (uma vez)
      let masculinosCount = inscricoesExistentes.filter(
        (i) => i.jogadorGenero === GeneroJogador.MASCULINO
      ).length;
      let femininasCount = inscricoesExistentes.filter(
        (i) => i.jogadorGenero === GeneroJogador.FEMININO
      ).length;

      const inscricoesParaCriar: Partial<Inscricao>[] = [];
      const jogadoresInscritos = new Set(
        inscricoesExistentes.map((i) => i.jogadorId)
      );

      // Validar cada jogador
      for (let i = 0; i < jogadorIds.length; i++) {
        const jogadorId = jogadorIds[i];
        const jogador = jogadores[i];

        try {
          // Validações
          if (!jogador) {
            erros.push({ jogadorId, erro: "Jogador não encontrado" });
            continue;
          }

          if (jogadoresInscritos.has(jogadorId)) {
            erros.push({ jogadorId, erro: "Jogador já está inscrito" });
            continue;
          }

          // Validar nível
          if (regras.inscricaoExigeNivel && etapa.nivel) {
            if (jogador.nivel !== etapa.nivel) {
              erros.push({
                jogadorId,
                erro: `Nível incompatível. Etapa: ${etapa.nivel}, Jogador: ${jogador.nivel}`,
              });
              continue;
            }
          }

          // Validar gênero
          const generoValido = isMisto
            ? jogador.genero === GeneroJogador.MASCULINO ||
              jogador.genero === GeneroJogador.FEMININO
            : jogador.genero === etapa.genero;

          if (!generoValido) {
            erros.push({
              jogadorId,
              erro: `Gênero incompatível. Etapa: ${etapa.genero}, Jogador: ${jogador.genero}`,
            });
            continue;
          }

          // Validar proporção de gênero para etapas mistas
          if (regras.mistoDivideVagas && isMisto) {
            const maxPorGenero = etapa.maxJogadores / 2;

            if (jogador.genero === GeneroJogador.MASCULINO) {
              if (masculinosCount >= maxPorGenero) {
                erros.push({
                  jogadorId,
                  erro: `Limite de jogadores masculinos atingido (${maxPorGenero})`,
                });
                continue;
              }
              masculinosCount++;
            } else if (jogador.genero === GeneroJogador.FEMININO) {
              if (femininasCount >= maxPorGenero) {
                erros.push({
                  jogadorId,
                  erro: `Limite de jogadoras femininas atingido (${maxPorGenero})`,
                });
                continue;
              }
              femininasCount++;
            }
          }

          // Adicionar à lista de inscrições para criar
          inscricoesParaCriar.push({
            etapaId,
            arenaId,
            jogadorId,
            jogadorNome: jogador.nome,
            jogadorNivel: jogador.nivel,
            jogadorGenero: jogador.genero,
          });

          jogadoresInscritos.add(jogadorId);
        } catch (error: any) {
          erros.push({ jogadorId, erro: error.message });
        }
      }

      // Criar todas as inscrições de uma vez (batch)
      if (inscricoesParaCriar.length > 0) {
        const novasInscricoes = await this.inscricaoRepository.criarEmLote(
          inscricoesParaCriar
        );
        inscricoes.push(...novasInscricoes);

        // Atualizar contador de inscritos na etapa (uma única vez)
        const totalInscritos =
          inscricoesExistentes.length + novasInscricoes.length;
        await this.etapaRepository.definirInscritos(
          etapaId,
          Array.from(jogadoresInscritos),
          totalInscritos
        );
      }

      logger.info("Inscrições em lote processadas", {
        etapaId,
        totalSolicitados: jogadorIds.length,
        inscritos: inscricoes.length,
        erros: erros.length,
      });

      return { inscricoes, erros };
    } catch (error: any) {
      logger.error(
        "Erro ao inscrever jogadores em lote",
        {
          etapaId,
          totalJogadores: jogadorIds.length,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Cancelar múltiplas inscrições em lote (batch)
   */
  async cancelarInscricoesEmLote(
    inscricaoIds: string[],
    etapaId: string,
    arenaId: string
  ): Promise<{ canceladas: number; erros: string[] }> {
    const erros: string[] = [];

    // Validar etapa primeiro
    const etapa = await this.buscarPorId(etapaId, arenaId);
    if (!etapa) {
      throw new Error("Etapa não encontrada");
    }

    if (etapa.chavesGeradas) {
      throw new Error(
        "Não é possível cancelar inscrições após geração de chaves"
      );
    }

    // Buscar todas as inscrições em UMA única query (getAll)
    const inscricoesValidas = await this.inscricaoRepository.buscarPorIds(
      inscricaoIds,
      etapaId,
      arenaId
    );

    // Identificar IDs não encontrados
    const idsEncontrados = new Set(inscricoesValidas.map((i) => i.id));
    inscricaoIds.forEach((id) => {
      if (!idsEncontrados.has(id)) {
        erros.push(`Inscrição ${id} não encontrada`);
      }
    });

    if (inscricoesValidas.length === 0) {
      return { canceladas: 0, erros };
    }

    // Cancelar todas as inscrições em batch
    const inscricaoIdsValidos = inscricoesValidas.map((i) => i.id);
    const jogadorIds = inscricoesValidas.map((i) => i.jogadorId);

    // Executar cancelamento e decremento em paralelo
    await Promise.all([
      this.inscricaoRepository.cancelarEmLote(inscricaoIdsValidos),
      this.etapaRepository.decrementarInscritosEmLote(
        etapaId,
        jogadorIds.length,
        jogadorIds
      ),
    ]);

    // Quem saiu da etapa deixa de ser cabeça de chave
    await cabecaDeChaveService.removerSeExistirem(arenaId, etapaId, jogadorIds);

    logger.info("Inscrições canceladas em lote", {
      etapaId,
      canceladas: inscricoesValidas.length,
      erros: erros.length,
    });

    return { canceladas: inscricoesValidas.length, erros };
  }

  /**
   * Listar inscrições de uma etapa
   */
  async listarInscricoes(
    etapaId: string,
    arenaId: string
  ): Promise<Inscricao[]> {
    return this.inscricaoRepository.buscarConfirmadas(etapaId, arenaId);
  }

  /**
   * Listar etapas com filtros
   */
  async listar(filtros: FiltrosEtapa): Promise<ListagemEtapas> {
    return this.etapaRepository.listar(filtros);
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

      // Super X: o número de jogadores acompanha a variante
      if (
        etapa.formato === FormatoEtapa.SUPER_X &&
        dadosValidados.varianteSuperX !== undefined &&
        dadosValidados.maxJogadores === undefined
      ) {
        dadosValidados.maxJogadores = dadosValidados.varianteSuperX;
      }

      if (
        dadosValidados.maxJogadores !== undefined &&
        dadosValidados.maxJogadores < etapa.totalInscritos
      ) {
        throw new Error(
          `Não é possível reduzir para ${dadosValidados.maxJogadores} jogadores. ` +
            `A etapa já possui ${etapa.totalInscritos} jogador(es) inscrito(s).`
        );
      }

      // Regras do formato sobre a etapa como vai ficar (salvo + alterado)
      const problema = validarConfiguracaoFormato({
        formato: dadosValidados.formato ?? etapa.formato,
        genero: dadosValidados.genero ?? etapa.genero,
        // null = "todos os níveis"
        nivel:
          dadosValidados.nivel !== undefined
            ? dadosValidados.nivel ?? undefined
            : etapa.nivel,
        maxJogadores: dadosValidados.maxJogadores ?? etapa.maxJogadores,
        varianteSuperX: dadosValidados.varianteSuperX ?? etapa.varianteSuperX,
        varianteTeams: dadosValidados.varianteTeams ?? etapa.varianteTeams,
        tipoFormacaoDupla: dadosValidados.tipoFormacaoDupla ?? etapa.tipoFormacaoDupla,
        tipoFormacaoEquipe: dadosValidados.tipoFormacaoEquipe ?? etapa.tipoFormacaoEquipe,
      });
      if (problema) {
        throw new Error(problema);
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
      }

      const dadosAtualizacao: DadosAtualizacaoEtapa = { ...dadosValidados };

      // Recalcular o tamanho do grupo se maxJogadores mudou. A quantidade não é
      // gravada: depende do formato e sai da distribuição ao gerar as chaves.
      if (
        dadosValidados.maxJogadores &&
        dadosValidados.maxJogadores !== etapa.maxJogadores
      ) {
        const totalDuplas = dadosValidados.maxJogadores / 2;
        let qtdGrupos = Math.ceil(totalDuplas / 3);

        if (qtdGrupos === 1 && totalDuplas > 5) {
          qtdGrupos = 2;
        }

        if (totalDuplas / qtdGrupos < 3 && qtdGrupos > 1) {
          qtdGrupos = Math.max(1, Math.floor(totalDuplas / 3));
        }

        dadosAtualizacao.jogadoresPorGrupo = Math.ceil(
          totalDuplas / qtdGrupos
        );
      }

      // Converter datas
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

      // Usar repository para atualizar
      const etapaAtualizada = await this.etapaRepository.atualizar(
        id,
        dadosAtualizacao
      );

      logger.info("Etapa atualizada", {
        etapaId: id,
        arenaId,
        camposAtualizados: Object.keys(dadosAtualizacao),
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

      // Limpar cabeças de chave via service
      const cabecasRemovidas = await cabecaDeChaveService.deletarPorEtapa(
        id,
        arenaId
      );

      // Deletar etapa via repository
      await this.etapaRepository.deletar(id);

      logger.info("Etapa deletada", {
        etapaId: id,
        nome: etapa.nome,
        arenaId,
        cabecasRemovidas,
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

      const etapaAtualizada = await this.etapaRepository.atualizarStatus(
        id,
        StatusEtapa.INSCRICOES_ENCERRADAS
      );

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

      const etapaAtualizada = await this.etapaRepository.atualizarStatus(
        id,
        StatusEtapa.INSCRICOES_ABERTAS
      );

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
      return await this.etapaRepository.obterEstatisticas(arenaId);
    } catch {
      return {
        totalEtapas: 0,
        inscricoesAbertas: 0,
        emAndamento: 0,
        finalizadas: 0,
        totalParticipacoes: 0,
      };
    }
  }
}

// Instância default com repositories Firebase
export default new EtapaService(
  new EtapaRepository(),
  new InscricaoRepository(),
  new JogadorRepository()
);
