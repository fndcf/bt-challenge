/**
 * Service para gerenciar etapas
 */

import { Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import {
  Etapa,
  CriarEtapaDTO,
  AtualizarEtapaDTO,
  InscreverJogadorDTO,
  FiltrosEtapa,
  ListagemEtapas,
  StatusEtapa,
  EstatisticasEtapa,
  CriarEtapaSchema,
  AtualizarEtapaSchema,
  InscreverJogadorSchema,
  FormatoEtapa,
} from "../models/Etapa";
import { Inscricao, StatusInscricao } from "../models/Inscricao";
import { GeneroJogador } from "../models/Jogador";
import { TipoFase } from "../models/Eliminatoria";
import logger from "../utils/logger";

// Interfaces dos repositories
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import { IInscricaoRepository } from "../repositories/interfaces/IInscricaoRepository";
import { IJogadorRepository } from "../repositories/interfaces/IJogadorRepository";
import { IConfigRepository } from "../repositories/interfaces/IConfigRepository";
import { ICabecaDeChaveRepository } from "../repositories/interfaces/ICabecaDeChaveRepository";
import { IEstatisticasJogadorRepository } from "../repositories/interfaces/IEstatisticasJogadorRepository";
import { IGrupoRepository } from "../repositories/interfaces/IGrupoRepository";
import { IDuplaRepository } from "../repositories/interfaces/IDuplaRepository";
import { IConfrontoEliminatorioRepository } from "../repositories/interfaces/IConfrontoEliminatorioRepository";
import { IEquipeRepository } from "../repositories/interfaces/IEquipeRepository";
import { IConfrontoEquipeRepository } from "../repositories/interfaces/IConfrontoEquipeRepository";
import { StatusConfronto } from "../models/Teams";

// Implementações Firebase (para instância default)
import { EtapaRepository } from "../repositories/firebase/EtapaRepository";
import { InscricaoRepository } from "../repositories/firebase/InscricaoRepository";
import { JogadorRepository } from "../repositories/firebase/JogadorRepository";
import { ConfigRepository } from "../repositories/firebase/ConfigRepository";
import { CabecaDeChaveRepository } from "../repositories/firebase/CabecaDeChaveRepository";
import { EstatisticasJogadorRepository } from "../repositories/firebase/EstatisticasJogadorRepository";
import { GrupoRepository } from "../repositories/firebase/GrupoRepository";
import { DuplaRepository } from "../repositories/firebase/DuplaRepository";
import { ConfrontoEliminatorioRepository } from "../repositories/firebase/ConfrontoEliminatorioRepository";
import { EquipeRepository } from "../repositories/firebase/EquipeRepository";
import ConfrontoEquipeRepository from "../repositories/firebase/ConfrontoEquipeRepository";

/**
 * Usa injeção de dependência para repositories
 */
export class EtapaService {
  constructor(
    private etapaRepository: IEtapaRepository,
    private inscricaoRepository: IInscricaoRepository,
    private jogadorRepository: IJogadorRepository,
    private configRepository: IConfigRepository,
    private cabecaDeChaveRepository: ICabecaDeChaveRepository,
    private estatisticasJogadorRepository: IEstatisticasJogadorRepository,
    private grupoRepository: IGrupoRepository,
    private duplaRepository: IDuplaRepository,
    private confrontoRepository: IConfrontoEliminatorioRepository,
    private equipeRepository: IEquipeRepository = new EquipeRepository(),
    private confrontoEquipeRepository: IConfrontoEquipeRepository = ConfrontoEquipeRepository
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

      const totalDuplas = dadosValidados.maxJogadores / 2;
      const qtdGrupos = dadosValidados.jogadoresPorGrupo
        ? Math.ceil(totalDuplas / dadosValidados.jogadoresPorGrupo)
        : 1;

      // Log para debug
      logger.info("Criando etapa - contaPontosRanking", {
        valorRecebido: data.contaPontosRanking,
        valorValidado: dadosValidados.contaPontosRanking,
        tipoRecebido: typeof data.contaPontosRanking,
        tipoValidado: typeof dadosValidados.contaPontosRanking,
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
        contaPontosRanking: dadosValidados.contaPontosRanking ?? true,
      });

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

      // Validar nivel (obrigatório para DUPLA_FIXA e REI_DA_PRAIA, opcional para SUPER_X)
      if (etapa.formato !== FormatoEtapa.SUPER_X && etapa.nivel) {
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
        ? jogador.genero === GeneroJogador.MASCULINO || jogador.genero === GeneroJogador.FEMININO
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

      // Validar proporção de gênero para etapas TEAMS mistas
      if (etapa.formato === FormatoEtapa.TEAMS && isMisto) {
        const inscricoesAtuais = await this.inscricaoRepository.buscarConfirmadas(
          etapaId,
          arenaId
        );

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
   * Inscrever múltiplos jogadores em lote (otimizado)
   */
  async inscreverJogadoresEmLote(
    etapaId: string,
    arenaId: string,
    jogadorIds: string[]
  ): Promise<{ inscricoes: Inscricao[]; erros: Array<{ jogadorId: string; erro: string }> }> {
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
      const inscricoesExistentes = await this.inscricaoRepository.buscarConfirmadas(
        etapaId,
        arenaId
      );

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
      const isTeams = etapa.formato === FormatoEtapa.TEAMS;

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

          // Validar nível (obrigatório para DUPLA_FIXA e REI_DA_PRAIA)
          if (etapa.formato !== FormatoEtapa.SUPER_X && etapa.nivel) {
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

          // Validar proporção de gênero para TEAMS misto
          if (isTeams && isMisto) {
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
        const totalInscritos = inscricoesExistentes.length + novasInscricoes.length;
        await db.collection("etapas").doc(etapaId).update({
          jogadoresInscritos: Array.from(jogadoresInscritos),
          totalInscritos,
          atualizadoEm: Timestamp.now(),
        });
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
   * Cancelar inscrição
   */
  async cancelarInscricao(
    inscricaoId: string,
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    try {
      const inscricao = await this.inscricaoRepository.buscarPorIdEtapaArena(
        inscricaoId,
        etapaId,
        arenaId
      );

      if (!inscricao) {
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

      // Cancelar inscrição via repository
      await this.inscricaoRepository.cancelar(inscricaoId);

      // Decrementar inscritos na etapa
      await this.etapaRepository.decrementarInscritos(
        etapaId,
        inscricao.jogadorId
      );

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
   * Cancelar múltiplas inscrições em lote (batch)
   */
  async cancelarInscricoesEmLote(
    inscricaoIds: string[],
    etapaId: string,
    arenaId: string
  ): Promise<{ canceladas: number; erros: string[] }> {
    const erros: string[] = [];
    let canceladas = 0;

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

    // Buscar todas as inscrições de uma vez
    const inscricoes = await Promise.all(
      inscricaoIds.map((id) =>
        this.inscricaoRepository.buscarPorIdEtapaArena(id, etapaId, arenaId)
      )
    );

    // Filtrar inscrições válidas
    const inscricoesValidas = inscricoes.filter(
      (inscricao, index) => {
        if (!inscricao) {
          erros.push(`Inscrição ${inscricaoIds[index]} não encontrada`);
          return false;
        }
        return true;
      }
    );

    if (inscricoesValidas.length === 0) {
      return { canceladas: 0, erros };
    }

    // Cancelar todas as inscrições em batch
    const inscricaoIdsValidos = inscricoesValidas.map((i) => i!.id);
    const jogadorIds = inscricoesValidas.map((i) => i!.jogadorId);

    await this.inscricaoRepository.cancelarEmLote(inscricaoIdsValidos);

    // Decrementar contador de inscritos uma vez só
    await this.etapaRepository.decrementarInscritosEmLote(
      etapaId,
      jogadorIds.length,
      jogadorIds
    );

    canceladas = inscricoesValidas.length;

    logger.info("Inscrições canceladas em lote", {
      etapaId,
      canceladas,
      erros: erros.length,
    });

    return { canceladas, erros };
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

      const dadosAtualizacao: AtualizarEtapaDTO = { ...dadosValidados };

      // Recalcular grupos se maxJogadores mudou
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

        (dadosAtualizacao as any).qtdGrupos = qtdGrupos;
        (dadosAtualizacao as any).jogadoresPorGrupo = jogadoresPorGrupo;
      }

      // Converter datas
      if (dadosValidados.dataInicio) {
        (dadosAtualizacao as any).dataInicio = Timestamp.fromDate(
          new Date(dadosValidados.dataInicio)
        );
      }
      if (dadosValidados.dataFim) {
        (dadosAtualizacao as any).dataFim = Timestamp.fromDate(
          new Date(dadosValidados.dataFim)
        );
      }
      if (dadosValidados.dataRealizacao) {
        (dadosAtualizacao as any).dataRealizacao = Timestamp.fromDate(
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

      // Limpar cabeças de chave via repository
      const cabecasRemovidas =
        await this.cabecaDeChaveRepository.deletarPorEtapa(id, arenaId);

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

      // Verificar se a etapa conta pontos no ranking
      const contaPontosRanking = etapa.contaPontosRanking ?? true;

      logger.info("Encerrando etapa", {
        etapaId: id,
        contaPontosRanking,
      });

      // Buscar pontuação via repository
      const pontuacao = await this.configRepository.buscarPontuacao();

      // CENÁRIO 0: TEAMS (equipes)
      if (etapa.formato === FormatoEtapa.TEAMS) {
        // Verificar se todos os confrontos estão finalizados
        const confrontos = await this.confrontoEquipeRepository.buscarPorEtapa(
          id,
          arenaId
        );

        if (confrontos.length === 0) {
          throw new Error("Nenhum confronto encontrado para esta etapa");
        }

        const confrontosPendentes = confrontos.filter(
          (c) => c.status !== StatusConfronto.FINALIZADO
        );

        if (confrontosPendentes.length > 0) {
          throw new Error(
            `Ainda há ${confrontosPendentes.length} confronto(s) pendente(s). Finalize todos os confrontos antes de encerrar a etapa.`
          );
        }

        // Buscar equipes ordenadas por classificação
        const equipes = await this.equipeRepository.buscarPorClassificacao(
          id,
          arenaId
        );

        if (equipes.length === 0) {
          throw new Error("Nenhuma equipe encontrada para esta etapa");
        }

        // Tabela de colocações para TEAMS (por equipe)
        const tabelaColocacoes = [
          { colocacao: "campeao", pontos: pontuacao.campeao },
          { colocacao: "vice", pontos: pontuacao.vice },
          { colocacao: "semifinalista", pontos: pontuacao.semifinalista },
          { colocacao: "quartas", pontos: pontuacao.quartas },
          { colocacao: "oitavas", pontos: pontuacao.oitavas },
          { colocacao: "participacao", pontos: pontuacao.participacao },
        ];

        // Só atribuir pontos se a etapa conta para o ranking
        if (contaPontosRanking) {
          for (let i = 0; i < equipes.length; i++) {
            const equipe = equipes[i];
            const { colocacao, pontos } =
              tabelaColocacoes[i] ||
              tabelaColocacoes[tabelaColocacoes.length - 1];

            // Atribuir pontos a cada jogador da equipe
            for (const jogador of equipe.jogadores) {
              await this.atribuirPontosParaJogador(
                jogador.id,
                id,
                pontos,
                colocacao
              );

              logger.info("Pontos atribuídos ao jogador TEAMS", {
                jogadorId: jogador.id,
                jogadorNome: jogador.nome,
                equipeNome: equipe.nome,
                posicao: i + 1,
                colocacao,
                pontos,
              });
            }

            // Atualizar posição da equipe
            await this.equipeRepository.atualizarPosicao(equipe.id, i + 1);
          }
        } else {
          logger.info(
            "Etapa TEAMS não conta pontos no ranking - pulando atribuição",
            {
              etapaId: id,
            }
          );
        }

        const campeao = equipes[0];
        if (!campeao) {
          throw new Error("Nenhuma equipe campeã encontrada");
        }

        await this.etapaRepository.definirCampeao(id, campeao.id, campeao.nome);

        logger.info("Etapa TEAMS encerrada", {
          etapaId: id,
          nome: etapa.nome,
          campeaoNome: campeao.nome,
          totalEquipes: equipes.length,
          arenaId,
        });

        return;
      }

      // Buscar grupos via repository (para outros formatos)
      const grupos = await this.grupoRepository.buscarPorEtapa(id, arenaId);

      if (grupos.length === 0) {
        throw new Error("Nenhum grupo encontrado para esta etapa");
      }

      // CENÁRIO 1: SUPER X (grupo único com jogadores individuais)
      if (etapa.formato === FormatoEtapa.SUPER_X) {
        const grupo = grupos[0];

        if (!grupo.completo) {
          throw new Error(
            "Não é possível encerrar a etapa. O grupo ainda possui partidas pendentes."
          );
        }

        // Buscar jogadores ordenados por posição via repository
        const jogadores =
          await this.estatisticasJogadorRepository.buscarPorGrupoOrdenado(
            grupo.id
          );

        if (jogadores.length === 0) {
          throw new Error("Nenhum jogador encontrado no grupo");
        }

        // Tabela de colocações para Super X (individual)
        const tabelaColocacoes = [
          { colocacao: "campeao", pontos: pontuacao.campeao },
          { colocacao: "vice", pontos: pontuacao.vice },
          { colocacao: "semifinalista", pontos: pontuacao.semifinalista },
          { colocacao: "quartas", pontos: pontuacao.quartas },
          { colocacao: "oitavas", pontos: pontuacao.oitavas },
          { colocacao: "participacao", pontos: pontuacao.participacao },
        ];

        // Só atribuir pontos se a etapa conta para o ranking
        if (contaPontosRanking) {
          for (let i = 0; i < jogadores.length; i++) {
            const jogador = jogadores[i];
            const { colocacao, pontos } =
              tabelaColocacoes[i] ||
              tabelaColocacoes[tabelaColocacoes.length - 1];

            // Atribuir pontos ao jogador individual
            await this.estatisticasJogadorRepository.atualizar(jogador.id, {
              pontos,
              colocacao,
            });

            logger.info("Pontos atribuídos ao jogador Super X", {
              jogadorId: jogador.jogadorId,
              jogadorNome: jogador.jogadorNome,
              posicao: i + 1,
              colocacao,
              pontos,
            });
          }
        } else {
          logger.info(
            "Etapa Super X não conta pontos no ranking - pulando atribuição",
            {
              etapaId: id,
            }
          );
        }

        const campeao = jogadores[0];
        if (!campeao) {
          throw new Error("Nenhum campeão encontrado");
        }

        await this.etapaRepository.definirCampeao(
          id,
          campeao.jogadorId,
          campeao.jogadorNome
        );

        logger.info("Etapa Super X encerrada", {
          etapaId: id,
          nome: etapa.nome,
          campeaoNome: campeao.jogadorNome,
          totalJogadores: jogadores.length,
          arenaId,
        });

        return;
      }

      // CENÁRIO 2: GRUPO ÚNICO (Dupla Fixa)
      if (grupos.length === 1) {
        const grupo = grupos[0];

        if (!grupo.completo) {
          throw new Error(
            "Não é possível encerrar a etapa. O grupo ainda possui partidas pendentes."
          );
        }

        // Buscar duplas ordenadas por posição via repository
        const duplas = await this.duplaRepository.buscarPorGrupoOrdenado(
          grupo.id
        );

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

        // Só atribuir pontos se a etapa conta para o ranking
        if (contaPontosRanking) {
          for (let i = 0; i < duplas.length; i++) {
            const dupla = duplas[i];
            const { colocacao, pontos } =
              tabelaColocacoes[i] ||
              tabelaColocacoes[tabelaColocacoes.length - 1];

            await this.atribuirPontosParaDupla(dupla.id, id, pontos, colocacao);
          }
        } else {
          logger.info(
            "Etapa não conta pontos no ranking - pulando atribuição",
            {
              etapaId: id,
            }
          );
        }

        const campeao = duplas[0] as any;
        if (!campeao) {
          throw new Error("Nenhum campeão encontrado");
        }

        await this.etapaRepository.definirCampeao(
          id,
          campeao.id,
          `${campeao.jogador1Nome} & ${campeao.jogador2Nome}`
        );

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
      // Buscar confronto da final via repository
      const confrontosFinais = await this.confrontoRepository.buscarPorFase(
        id,
        arenaId,
        TipoFase.FINAL
      );

      if (confrontosFinais.length === 0) {
        throw new Error("Não há fase eliminatória para esta etapa");
      }

      const confrontoFinal = confrontosFinais[0];

      if (confrontoFinal.status !== "finalizada") {
        throw new Error("A final ainda não foi finalizada");
      }

      // Só atribuir pontos se a etapa conta para o ranking
      if (contaPontosRanking) {
        // Campeão
        const campeaoDuplaId = confrontoFinal.vencedoraId;
        if (campeaoDuplaId) {
          await this.atribuirPontosParaDupla(
            campeaoDuplaId,
            id,
            pontuacao.campeao,
            "campeao"
          );
        }

        // Vice
        const viceDuplaId =
          confrontoFinal.dupla1Id === campeaoDuplaId
            ? confrontoFinal.dupla2Id
            : confrontoFinal.dupla1Id;
        if (viceDuplaId) {
          await this.atribuirPontosParaDupla(
            viceDuplaId,
            id,
            pontuacao.vice,
            "vice"
          );
        }

        // Semifinalistas - buscar confrontos finalizados via repository
        const confrontosSemi =
          await this.confrontoRepository.buscarFinalizadosPorFase(
            id,
            arenaId,
            TipoFase.SEMIFINAL
          );

        for (const confronto of confrontosSemi) {
          const perdedorId =
            confronto.vencedoraId === confronto.dupla1Id
              ? confronto.dupla2Id
              : confronto.dupla1Id;
          if (perdedorId) {
            await this.atribuirPontosParaDupla(
              perdedorId,
              id,
              pontuacao.semifinalista,
              "semifinalista"
            );
          }
        }

        // Quartas - buscar confrontos finalizados via repository
        const confrontosQuartas =
          await this.confrontoRepository.buscarFinalizadosPorFase(
            id,
            arenaId,
            TipoFase.QUARTAS
          );

        for (const confronto of confrontosQuartas) {
          const perdedorId =
            confronto.vencedoraId === confronto.dupla1Id
              ? confronto.dupla2Id
              : confronto.dupla1Id;
          if (perdedorId) {
            await this.atribuirPontosParaDupla(
              perdedorId,
              id,
              pontuacao.quartas,
              "quartas"
            );
          }
        }

        // Oitavas - buscar confrontos finalizados via repository
        const confrontosOitavas =
          await this.confrontoRepository.buscarFinalizadosPorFase(
            id,
            arenaId,
            TipoFase.OITAVAS
          );

        for (const confronto of confrontosOitavas) {
          const perdedorId =
            confronto.vencedoraId === confronto.dupla1Id
              ? confronto.dupla2Id
              : confronto.dupla1Id;
          if (perdedorId) {
            await this.atribuirPontosParaDupla(
              perdedorId,
              id,
              pontuacao.oitavas,
              "oitavas"
            );
          }
        }

        // Participação - duplas não classificadas via repository
        const todasDuplas = await this.duplaRepository.buscarPorEtapa(
          id,
          arenaId
        );
        const duplasNaoClassificadas = todasDuplas.filter(
          (d) => !d.classificada
        );

        for (const dupla of duplasNaoClassificadas) {
          await this.atribuirPontosParaDupla(
            dupla.id,
            id,
            pontuacao.participacao,
            "participacao"
          );
        }
      } else {
        logger.info(
          "Etapa não conta pontos no ranking - pulando atribuição (eliminatória)",
          {
            etapaId: id,
          }
        );
      }

      if (confrontoFinal.vencedoraId) {
        await this.etapaRepository.definirCampeao(
          id,
          confrontoFinal.vencedoraId,
          confrontoFinal.vencedoraNome || "Campeão"
        );
      }

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
      // Buscar dupla via repository
      const dupla = await this.duplaRepository.buscarPorId(duplaId);

      if (!dupla) {
        logger.warn("Dupla não encontrada para atribuir pontos", {
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
      // Buscar estatísticas via repository
      const estatisticas =
        await this.estatisticasJogadorRepository.buscarPorJogadorEEtapa(
          jogadorId,
          etapaId
        );

      if (!estatisticas) {
        logger.warn("Estatísticas não encontradas para atribuir pontos", {
          jogadorId,
          etapaId,
        });
        return;
      }

      // Atualizar pontuação via repository
      await this.estatisticasJogadorRepository.atualizarPontuacao(
        estatisticas.id,
        {
          pontos,
          colocacao,
        }
      );
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

// Instância default com repositories Firebase
const etapaRepositoryInstance = new EtapaRepository();
const inscricaoRepositoryInstance = new InscricaoRepository();
const jogadorRepositoryInstance = new JogadorRepository();
const configRepositoryInstance = new ConfigRepository();
const cabecaDeChaveRepositoryInstance = new CabecaDeChaveRepository();
const estatisticasJogadorRepositoryInstance =
  new EstatisticasJogadorRepository();
const grupoRepositoryInstance = new GrupoRepository();
const duplaRepositoryInstance = new DuplaRepository();
const confrontoRepositoryInstance = new ConfrontoEliminatorioRepository();

export default new EtapaService(
  etapaRepositoryInstance,
  inscricaoRepositoryInstance,
  jogadorRepositoryInstance,
  configRepositoryInstance,
  cabecaDeChaveRepositoryInstance,
  estatisticasJogadorRepositoryInstance,
  grupoRepositoryInstance,
  duplaRepositoryInstance,
  confrontoRepositoryInstance
);
