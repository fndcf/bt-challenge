/**
 * Service para substituição de jogadores após geração de chaves
 */

import { Jogador, GeneroJogador } from "../models/Jogador";
import { getRegras } from "../models/RegrasFormato";
import logger from "../utils/logger";
import { BadRequestError, NotFoundError } from "../utils/errors";

// Repositories
import { EtapaRepository } from "../repositories/firebase/EtapaRepository";
import { JogadorRepository } from "../repositories/firebase/JogadorRepository";
import { EstatisticasJogadorRepository } from "../repositories/firebase/EstatisticasJogadorRepository";
import { InscricaoRepository } from "../repositories/firebase/InscricaoRepository";
import { getFormato } from "./formatos";

interface SubstituicaoResult {
  sucesso: boolean;
  mensagem: string;
  jogadorAntigoId: string;
  jogadorAntigoNome: string;
  jogadorNovoId: string;
  jogadorNovoNome: string;
}

class SubstituicaoService {
  private etapaRepository = new EtapaRepository();
  private jogadorRepository = new JogadorRepository();
  private estatisticasRepository = new EstatisticasJogadorRepository();
  private inscricaoRepository = new InscricaoRepository();

  /**
   * Substituir jogador em uma etapa
   */
  async substituirJogador(
    etapaId: string,
    arenaId: string,
    jogadorAntigoId: string,
    jogadorNovoId: string
  ): Promise<SubstituicaoResult> {
    logger.info("Iniciando substituição de jogador", {
      etapaId,
      arenaId,
      jogadorAntigoId,
      jogadorNovoId,
    });

    // 1. Buscar e validar etapa
    const etapa = await this.etapaRepository.buscarPorIdEArena(etapaId, arenaId);
    if (!etapa) {
      throw new NotFoundError("Etapa não encontrada");
    }

    if (!etapa.chavesGeradas) {
      throw new BadRequestError("Chaves ainda não foram geradas para esta etapa");
    }

    // 2. Verificar se há partidas/confrontos já jogados na etapa
    const formato = getFormato(etapa.formato);

    if (await formato.temPartidasJogadas(etapaId, arenaId)) {
      throw new BadRequestError(
        "Não é possível substituir jogador pois já existem partidas jogadas nesta etapa"
      );
    }

    // 3. Buscar jogador antigo (deve estar na etapa)
    const estatisticaAntigo = await this.estatisticasRepository.buscarPorJogadorEEtapa(
      jogadorAntigoId,
      etapaId
    );
    if (!estatisticaAntigo) {
      throw new NotFoundError("Jogador a ser substituído não está participando desta etapa");
    }

    // 4. Buscar jogador novo (deve existir na arena)
    const jogadorNovo = await this.jogadorRepository.buscarPorIdEArena(jogadorNovoId, arenaId);
    if (!jogadorNovo) {
      throw new NotFoundError("Jogador substituto não encontrado na arena");
    }

    // 5. Verificar se jogador novo já está na etapa
    const estatisticaNovo = await this.estatisticasRepository.buscarPorJogadorEEtapa(
      jogadorNovoId,
      etapaId
    );
    if (estatisticaNovo) {
      throw new BadRequestError("Jogador substituto já está participando desta etapa");
    }

    // 6. Buscar e atualizar a inscrição do jogador antigo
    const inscricaoAntigo = await this.inscricaoRepository.buscarPorJogadorEEtapa(
      etapaId,
      jogadorAntigoId
    );
    if (inscricaoAntigo) {
      // Atualizar a inscrição com os dados do novo jogador
      await this.inscricaoRepository.atualizar(inscricaoAntigo.id, {
        jogadorId: jogadorNovo.id,
        jogadorNome: jogadorNovo.nome,
        jogadorNivel: jogadorNovo.nivel,
        jogadorGenero: jogadorNovo.genero,
      });
      logger.info("Inscrição atualizada com novo jogador", {
        inscricaoId: inscricaoAntigo.id,
        jogadorAntigoId,
        jogadorNovoId: jogadorNovo.id,
      });
    } else {
      logger.warn("Inscrição do jogador antigo não encontrada - continuando substituição", {
        etapaId,
        jogadorAntigoId,
      });
    }

    // 7. Atualizar array jogadoresInscritos na etapa
    const jogadoresInscritos = etapa.jogadoresInscritos || [];
    const novaListaJogadores = jogadoresInscritos
      .filter((id: string) => id !== jogadorAntigoId)
      .concat([jogadorNovo.id]);
    await this.etapaRepository.definirInscritos(etapaId, novaListaJogadores);

    // 8. Trocar o jogador nas chaves, do jeito do formato
    await formato.substituirJogador(
      etapaId,
      arenaId,
      jogadorAntigoId,
      jogadorNovo
    );

    logger.info("Substituição de jogador concluída com sucesso", {
      etapaId,
      formato: etapa.formato,
      jogadorAntigoId,
      jogadorNovoId: jogadorNovo.id,
      jogadorNovoNome: jogadorNovo.nome,
    });

    return {
      sucesso: true,
      mensagem: "Jogador substituído com sucesso",
      jogadorAntigoId,
      jogadorAntigoNome: estatisticaAntigo.jogadorNome,
      jogadorNovoId: jogadorNovo.id,
      jogadorNovoNome: jogadorNovo.nome,
    };
  }

  /**
   * Buscar jogadores disponíveis para substituição (que não estão na etapa)
   * Filtra por gênero e nível compatíveis com a etapa
   */
  async buscarJogadoresDisponiveis(
    etapaId: string,
    arenaId: string
  ): Promise<Jogador[]> {
    // Buscar a etapa para saber os filtros
    const etapa = await this.etapaRepository.buscarPorIdEArena(etapaId, arenaId);
    if (!etapa) {
      throw new NotFoundError("Etapa não encontrada");
    }

    // Buscar todos os jogadores da arena
    const todosJogadores = await this.jogadorRepository.listar({
      arenaId,
      limite: 1000,
    });

    // Buscar jogadores que já estão na etapa
    const estatisticas = await this.estatisticasRepository.buscarPorEtapa(etapaId, arenaId);
    const jogadoresNaEtapa = new Set(estatisticas.map((e) => e.jogadorId));

    const filtrarPorNivel =
      etapa.nivel && !getRegras(etapa.formato).misturaNiveis(etapa);

    // Filtrar jogadores
    return todosJogadores.jogadores.filter((jogador) => {
      // Excluir se já está na etapa
      if (jogadoresNaEtapa.has(jogador.id)) {
        return false;
      }

      // Filtrar por gênero (exceto etapas mistas)
      if (etapa.genero !== GeneroJogador.MISTO) {
        if (jogador.genero !== etapa.genero) {
          return false;
        }
      }

      // Filtrar por nível (quando aplicável)
      if (filtrarPorNivel && jogador.nivel !== etapa.nivel) {
        return false;
      }

      return true;
    });
  }
}

export default new SubstituicaoService();
