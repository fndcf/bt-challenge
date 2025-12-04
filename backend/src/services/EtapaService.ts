/**
 * Service para gerenciar etapas
 */

import { Timestamp } from "firebase-admin/firestore";
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
} from "../models/Etapa";
import { Inscricao, StatusInscricao } from "../models/Inscricao";
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
    private confrontoRepository: IConfrontoEliminatorioRepository
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
      const qtdGrupos = Math.ceil(
        totalDuplas / dadosValidados.jogadoresPorGrupo
      );

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
        dataInicio: dataInicio,
        dataFim: dataFim,
        dataRealizacao: dataRealizacao,
        local: dadosValidados.local?.trim(),
        maxJogadores: dadosValidados.maxJogadores,
        jogadoresPorGrupo: dadosValidados.jogadoresPorGrupo,
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

      // Verificar se já está inscrito
      const jaInscrito = await this.inscricaoRepository.jogadorInscrito(
        etapaId,
        dadosValidados.jogadorId
      );
      if (jaInscrito) {
        throw new Error("Jogador já está inscrito nesta etapa");
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

      // Buscar pontuação via repository
      const pontuacao = await this.configRepository.buscarPontuacao();

      // Buscar grupos via repository
      const grupos = await this.grupoRepository.buscarPorEtapa(id, arenaId);

      if (grupos.length === 0) {
        throw new Error("Nenhum grupo encontrado para esta etapa");
      }

      // CENÁRIO 1: GRUPO ÚNICO
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
      const duplasNaoClassificadas = todasDuplas.filter((d) => !d.classificada);

      for (const dupla of duplasNaoClassificadas) {
        await this.atribuirPontosParaDupla(
          dupla.id,
          id,
          pontuacao.participacao,
          "participacao"
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
