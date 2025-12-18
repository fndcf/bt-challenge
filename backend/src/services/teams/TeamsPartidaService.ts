/**
 * TeamsPartidaService - Responsabilidade: Geração e gerenciamento de partidas
 *
 * Seguindo SRP (Single Responsibility Principle):
 * - Geração de partidas para confrontos
 * - Definição manual de jogadores
 * - Geração de decider
 * - Criação de partidas vazias
 */

import {
  Equipe,
  ConfrontoEquipe,
  PartidaTeams,
  JogadorEquipe,
  CriarPartidaTeamsDTO,
  DefinirPartidasManualDTO,
  VarianteTeams,
  TipoFormacaoJogos,
  TipoJogoTeams,
} from "../../models/Teams";
import { Etapa, FaseEtapa } from "../../models/Etapa";
import { GeneroJogador } from "../../models/Jogador";
import { IPartidaTeamsRepository } from "../../repositories/interfaces/IPartidaTeamsRepository";
import { IEquipeRepository } from "../../repositories/interfaces/IEquipeRepository";
import { IConfrontoEquipeRepository } from "../../repositories/interfaces/IConfrontoEquipeRepository";
import PartidaTeamsRepository from "../../repositories/firebase/PartidaTeamsRepository";
import EquipeRepository from "../../repositories/firebase/EquipeRepository";
import ConfrontoEquipeRepository from "../../repositories/firebase/ConfrontoEquipeRepository";
import { NotFoundError, ValidationError } from "../../utils/errors";
import logger from "../../utils/logger";

export interface ITeamsPartidaService {
  gerarPartidasConfronto(
    confronto: ConfrontoEquipe,
    etapa: Etapa
  ): Promise<PartidaTeams[]>;

  definirPartidasManualmente(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    definicao: DefinirPartidasManualDTO
  ): Promise<PartidaTeams[]>;

  definirJogadoresPartida(
    partidaId: string,
    arenaId: string,
    dupla1JogadorIds: [string, string],
    dupla2JogadorIds: [string, string]
  ): Promise<PartidaTeams>;

  gerarDecider(confronto: ConfrontoEquipe, etapa: Etapa): Promise<PartidaTeams>;

  buscarPartidasConfronto(confrontoId: string): Promise<PartidaTeams[]>;

  gerarPartidasParaConfrontosBatch(
    confrontos: ConfrontoEquipe[],
    etapa: Etapa,
    equipesMap: Map<string, Equipe>
  ): Promise<PartidaTeams[]>;
}

export class TeamsPartidaService implements ITeamsPartidaService {
  constructor(
    private partidaRepository: IPartidaTeamsRepository = PartidaTeamsRepository,
    private equipeRepository: IEquipeRepository = EquipeRepository,
    private confrontoRepository: IConfrontoEquipeRepository = ConfrontoEquipeRepository
  ) {}

  /**
   * Gera partidas para um confronto
   */
  async gerarPartidasConfronto(
    confronto: ConfrontoEquipe,
    etapa: Etapa
  ): Promise<PartidaTeams[]> {
    if (!confronto.equipe1Id || !confronto.equipe2Id) {
      throw new ValidationError(
        "As equipes deste confronto ainda não foram definidas. " +
          "Complete a fase de grupos primeiro para definir os classificados."
      );
    }

    const variante = etapa.varianteTeams!;
    const tipoFormacao = etapa.tipoFormacaoJogos || TipoFormacaoJogos.SORTEIO;
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

    // Se for formação MANUAL, criar partidas vazias
    if (tipoFormacao === TipoFormacaoJogos.MANUAL) {
      return this.criarPartidasVazias(confronto, etapa, variante, isMisto);
    }

    // Buscar equipes em paralelo
    const equipes = await this.equipeRepository.buscarPorIds([
      confronto.equipe1Id,
      confronto.equipe2Id,
    ]);
    const equipe1 = equipes.find((e) => e.id === confronto.equipe1Id);
    const equipe2 = equipes.find((e) => e.id === confronto.equipe2Id);

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    const partidaDTOs = this.montarPartidasConfrontoDTO(
      confronto,
      etapa,
      equipe1,
      equipe2,
      variante,
      isMisto
    );

    const partidas = await this.partidaRepository.criarEmLote(partidaDTOs);

    // Atualizar confronto com todas as partidas
    const partidasIds = partidas.map((p) => p.id);
    await this.confrontoRepository.adicionarPartidasEmLote(
      confronto.id,
      partidasIds
    );

    return partidas;
  }

  /**
   * Gera partidas para múltiplos confrontos em batch
   */
  async gerarPartidasParaConfrontosBatch(
    confrontos: ConfrontoEquipe[],
    etapa: Etapa,
    equipesMap: Map<string, Equipe>
  ): Promise<PartidaTeams[]> {
    const variante = etapa.varianteTeams!;
    const tipoFormacao = etapa.tipoFormacaoJogos || TipoFormacaoJogos.SORTEIO;
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

    // Filtrar confrontos válidos (com equipes definidas, fase de grupos, não manual)
    const confrontosValidos = confrontos.filter(
      (c) =>
        c.equipe1Id &&
        c.equipe2Id &&
        c.fase === FaseEtapa.GRUPOS &&
        tipoFormacao !== TipoFormacaoJogos.MANUAL
    );

    if (confrontosValidos.length === 0) {
      return [];
    }

    // Gerar todos os DTOs de partidas
    const todosPartidaDTOs: CriarPartidaTeamsDTO[] = [];
    const partidasPorConfronto: Map<string, number> = new Map();

    for (const confronto of confrontosValidos) {
      const equipe1 = equipesMap.get(confronto.equipe1Id);
      const equipe2 = equipesMap.get(confronto.equipe2Id);

      if (!equipe1 || !equipe2) {
        logger.error("Equipe não encontrada para confronto", {
          confrontoId: confronto.id,
          equipe1Id: confronto.equipe1Id,
          equipe2Id: confronto.equipe2Id,
        });
        continue;
      }

      const startIndex = todosPartidaDTOs.length;
      const partidasDTO = this.montarPartidasConfrontoDTO(
        confronto,
        etapa,
        equipe1,
        equipe2,
        variante,
        isMisto
      );
      todosPartidaDTOs.push(...partidasDTO);
      partidasPorConfronto.set(
        confronto.id,
        todosPartidaDTOs.length - startIndex
      );
    }

    if (todosPartidaDTOs.length === 0) {
      return [];
    }

    // Criar todas as partidas em um único batch
    const todasPartidas = await this.partidaRepository.criarEmLote(
      todosPartidaDTOs
    );

    // Atualizar confrontos com IDs das partidas em paralelo
    let partidaIndex = 0;
    const atualizacoesConfrontos = confrontosValidos
      .filter((c) => partidasPorConfronto.has(c.id))
      .map((confronto) => {
        const qtdPartidas = partidasPorConfronto.get(confronto.id) || 0;
        const partidasDoConfronto = todasPartidas.slice(
          partidaIndex,
          partidaIndex + qtdPartidas
        );
        partidaIndex += qtdPartidas;

        const partidasIds = partidasDoConfronto.map((p) => p.id);
        return this.confrontoRepository.adicionarPartidasEmLote(
          confronto.id,
          partidasIds
        );
      });

    await Promise.all(atualizacoesConfrontos);

    return todasPartidas;
  }

  /**
   * Define partidas manualmente
   */
  async definirPartidasManualmente(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    definicao: DefinirPartidasManualDTO
  ): Promise<PartidaTeams[]> {
    const equipe1 = await this.equipeRepository.buscarPorId(
      confronto.equipe1Id
    );
    const equipe2 = await this.equipeRepository.buscarPorId(
      confronto.equipe2Id
    );

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    const jogadores1Map = new Map(equipe1.jogadores.map((j) => [j.id, j]));
    const jogadores2Map = new Map(equipe2.jogadores.map((j) => [j.id, j]));

    const partidaDTOs: CriarPartidaTeamsDTO[] = [];

    for (const def of definicao.partidas) {
      const dupla1Jogadores = def.dupla1JogadorIds.map((id) => {
        const j = jogadores1Map.get(id);
        if (!j)
          throw new ValidationError(`Jogador ${id} não pertence à equipe 1`);
        return j;
      });

      const dupla2Jogadores = def.dupla2JogadorIds.map((id) => {
        const j = jogadores2Map.get(id);
        if (!j)
          throw new ValidationError(`Jogador ${id} não pertence à equipe 2`);
        return j;
      });

      partidaDTOs.push(
        this.criarPartidaDTO(
          confronto,
          etapa,
          def.ordem,
          def.tipoJogo,
          dupla1Jogadores,
          dupla2Jogadores
        )
      );
    }

    const partidas = await this.partidaRepository.criarEmLote(partidaDTOs);

    const partidasIds = partidas.map((p) => p.id);
    await this.confrontoRepository.adicionarPartidasEmLote(
      confronto.id,
      partidasIds
    );

    return partidas;
  }

  /**
   * Define os jogadores de uma partida vazia (formação manual)
   */
  async definirJogadoresPartida(
    partidaId: string,
    arenaId: string,
    dupla1JogadorIds: [string, string],
    dupla2JogadorIds: [string, string]
  ): Promise<PartidaTeams> {
    const partida = await this.partidaRepository.buscarPorId(partidaId);

    if (!partida) {
      throw new NotFoundError("Partida não encontrada");
    }

    if (partida.arenaId !== arenaId) {
      throw new ValidationError("Partida não pertence a esta arena");
    }

    if (partida.dupla1.length > 0 || partida.dupla2.length > 0) {
      throw new ValidationError("Esta partida já tem jogadores definidos");
    }

    // Obter IDs das equipes
    let equipe1Id = partida.equipe1Id;
    let equipe2Id = partida.equipe2Id;

    if (!equipe1Id || !equipe2Id) {
      logger.warn("Partida sem IDs das equipes, buscando do confronto", {
        partidaId,
      });
      const confronto = await this.confrontoRepository.buscarPorId(
        partida.confrontoId
      );

      if (!confronto) {
        throw new NotFoundError("Confronto não encontrado");
      }
      equipe1Id = confronto.equipe1Id;
      equipe2Id = confronto.equipe2Id;
      await this.partidaRepository.atualizar(partidaId, {
        equipe1Id,
        equipe1Nome: confronto.equipe1Nome,
        equipe2Id,
        equipe2Nome: confronto.equipe2Nome,
      });
    }

    // Buscar equipes em paralelo
    const [equipe1, equipe2] = await Promise.all([
      this.equipeRepository.buscarPorId(equipe1Id),
      this.equipeRepository.buscarPorId(equipe2Id),
    ]);

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    // Validar jogadores
    const jogadores1Map = new Map(equipe1.jogadores.map((j) => [j.id, j]));
    const jogadores2Map = new Map(equipe2.jogadores.map((j) => [j.id, j]));

    const dupla1Jogadores = dupla1JogadorIds.map((id) => {
      const j = jogadores1Map.get(id);
      if (!j)
        throw new ValidationError(
          `Jogador ${id} não pertence à equipe ${equipe1.nome}`
        );
      return j;
    });

    const dupla2Jogadores = dupla2JogadorIds.map((id) => {
      const j = jogadores2Map.get(id);
      if (!j)
        throw new ValidationError(
          `Jogador ${id} não pertence à equipe ${equipe2.nome}`
        );
      return j;
    });

    // Buscar confronto e partidas para validação
    const confronto = await this.confrontoRepository.buscarPorId(
      partida.confrontoId
    );
    if (!confronto) {
      throw new NotFoundError("Confronto não encontrado");
    }

    // Buscar outras partidas do confronto
    const partidasIds = confronto.partidas.filter((id) => id !== partidaId);
    const partidasPromises = partidasIds.map((id) =>
      this.partidaRepository.buscarPorId(id)
    );
    const partidasDoConfronto = (await Promise.all(partidasPromises)).filter(
      (p) => p !== null
    ) as PartidaTeams[];

    // Validações
    await Promise.all([
      this.validarDuplasUnicasComDados(
        partidasDoConfronto,
        dupla1Jogadores,
        dupla2Jogadores
      ),
      partida.tipoJogo !== TipoJogoTeams.DECIDER
        ? this.validarJogadoresNaoRepetidosComDados(
            partidasDoConfronto,
            dupla1Jogadores,
            dupla2Jogadores
          )
        : Promise.resolve(),
    ]);

    // Atualizar partida
    await this.partidaRepository.atualizar(partidaId, {
      dupla1: dupla1Jogadores.map((j) => ({
        id: j.id,
        nome: j.nome,
        nivel: j.nivel,
        genero: j.genero,
      })),
      dupla2: dupla2Jogadores.map((j) => ({
        id: j.id,
        nome: j.nome,
        nivel: j.nivel,
        genero: j.genero,
      })),
    });

    const partidaAtualizada = (await this.partidaRepository.buscarPorId(
      partidaId
    )) as PartidaTeams;

    return partidaAtualizada;
  }

  /**
   * Gera partida de decider quando empate 1-1 em TEAMS_4
   */
  async gerarDecider(
    confronto: ConfrontoEquipe,
    etapa: Etapa
  ): Promise<PartidaTeams> {
    const variante = etapa.varianteTeams!;

    if (variante !== VarianteTeams.TEAMS_4) {
      throw new ValidationError("Decider só é permitido para TEAMS_4");
    }
    const existeDecider = await this.partidaRepository.existeDecider(
      confronto.id
    );

    if (existeDecider) {
      throw new ValidationError("Decider já existe para este confronto");
    }

    // Buscar equipes em paralelo
    const [equipe1, equipe2] = await Promise.all([
      this.equipeRepository.buscarPorId(confronto.equipe1Id),
      this.equipeRepository.buscarPorId(confronto.equipe2Id),
    ]);

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    const tipoFormacaoJogos = etapa.tipoFormacaoJogos;
    const isFormacaoManual = tipoFormacaoJogos === TipoFormacaoJogos.MANUAL;

    let dupla1Jogadores: JogadorEquipe[];
    let dupla2Jogadores: JogadorEquipe[];

    if (isFormacaoManual) {
      dupla1Jogadores = [];
      dupla2Jogadores = [];
    } else {
      const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

      if (isMisto) {
        const f1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const m1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );
        const f2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const m2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );

        dupla1Jogadores = [this.shuffle(f1)[0], this.shuffle(m1)[0]];
        dupla2Jogadores = [this.shuffle(f2)[0], this.shuffle(m2)[0]];
      } else {
        const jogadores1 = this.shuffle([...equipe1.jogadores]);
        const jogadores2 = this.shuffle([...equipe2.jogadores]);
        dupla1Jogadores = jogadores1.slice(0, 2);
        dupla2Jogadores = jogadores2.slice(0, 2);
      }
    }

    const partidaDTO = this.criarPartidaDTO(
      confronto,
      etapa,
      3,
      TipoJogoTeams.DECIDER,
      dupla1Jogadores,
      dupla2Jogadores
    );

    const [partida] = await this.partidaRepository.criarEmLote([partidaDTO]);

    await this.confrontoRepository.adicionarPartidasEmLote(confronto.id, [
      partida.id,
    ]);

    await this.confrontoRepository.marcarTemDecider(confronto.id, true);

    return partida;
  }

  /**
   * Busca partidas de um confronto
   */
  async buscarPartidasConfronto(confrontoId: string): Promise<PartidaTeams[]> {
    return this.partidaRepository.buscarPorConfrontoOrdenadas(confrontoId);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Monta DTOs de partidas para um confronto
   */
  private montarPartidasConfrontoDTO(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    equipe1: Equipe,
    equipe2: Equipe,
    variante: VarianteTeams,
    isMisto: boolean
  ): CriarPartidaTeamsDTO[] {
    const partidaDTOs: CriarPartidaTeamsDTO[] = [];

    if (variante === VarianteTeams.TEAMS_4) {
      if (isMisto) {
        const femininas1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );
        const femininas2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            TipoJogoTeams.FEMININO,
            this.shuffle(femininas1),
            this.shuffle(femininas2)
          )
        );

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            TipoJogoTeams.MASCULINO,
            this.shuffle(masculinos1),
            this.shuffle(masculinos2)
          )
        );
      } else {
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;

        const jogadores1 = this.shuffle([...equipe1.jogadores]);
        const jogadores2 = this.shuffle([...equipe2.jogadores]);

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            tipoJogo,
            jogadores1.slice(0, 2),
            jogadores2.slice(0, 2)
          )
        );

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            tipoJogo,
            jogadores1.slice(2, 4),
            jogadores2.slice(2, 4)
          )
        );
      }
    } else {
      // TEAMS_6: 3 jogos fixos
      if (isMisto) {
        const femininas1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );
        const femininas2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );

        const f1 = this.shuffle(femininas1);
        const m1 = this.shuffle(masculinos1);
        const f2 = this.shuffle(femininas2);
        const m2 = this.shuffle(masculinos2);

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            TipoJogoTeams.FEMININO,
            f1.slice(0, 2),
            f2.slice(0, 2)
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            TipoJogoTeams.MASCULINO,
            m1.slice(0, 2),
            m2.slice(0, 2)
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            3,
            TipoJogoTeams.MISTO,
            [f1[2], m1[2]],
            [f2[2], m2[2]]
          )
        );
      } else {
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;

        const jogadores1 = this.shuffle([...equipe1.jogadores]);
        const jogadores2 = this.shuffle([...equipe2.jogadores]);

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            tipoJogo,
            jogadores1.slice(0, 2),
            jogadores2.slice(0, 2)
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            tipoJogo,
            jogadores1.slice(2, 4),
            jogadores2.slice(2, 4)
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            3,
            tipoJogo,
            jogadores1.slice(4, 6),
            jogadores2.slice(4, 6)
          )
        );
      }
    }

    return partidaDTOs;
  }

  /**
   * Cria partidas vazias para formação manual
   */
  private async criarPartidasVazias(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    variante: VarianteTeams,
    isMisto: boolean
  ): Promise<PartidaTeams[]> {
    const equipes = await this.equipeRepository.buscarPorIds([
      confronto.equipe1Id!,
      confronto.equipe2Id!,
    ]);
    const equipe1 = equipes.find((e) => e.id === confronto.equipe1Id);
    const equipe2 = equipes.find((e) => e.id === confronto.equipe2Id);

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    const partidaDTOs: CriarPartidaTeamsDTO[] = [];

    if (variante === VarianteTeams.TEAMS_4) {
      if (isMisto) {
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            1,
            TipoJogoTeams.FEMININO,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            2,
            TipoJogoTeams.MASCULINO,
            equipe1,
            equipe2
          )
        );
      } else {
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            1,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            2,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
      }
    } else {
      // TEAMS_6
      if (isMisto) {
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            1,
            TipoJogoTeams.FEMININO,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            2,
            TipoJogoTeams.MASCULINO,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            3,
            TipoJogoTeams.MISTO,
            equipe1,
            equipe2
          )
        );
      } else {
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            1,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            2,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            3,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
      }
    }

    const partidas = await this.partidaRepository.criarEmLote(partidaDTOs);

    // Adiciona todas as partidas de uma vez
    const partidaIds = partidas.map((p) => p.id);
    await this.confrontoRepository.adicionarPartidasEmLote(
      confronto.id,
      partidaIds
    );

    return partidas;
  }

  private criarPartidaDTO(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    ordem: number,
    tipoJogo: TipoJogoTeams,
    dupla1Jogadores: JogadorEquipe[],
    dupla2Jogadores: JogadorEquipe[]
  ): CriarPartidaTeamsDTO {
    return {
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      confrontoId: confronto.id,
      ordem,
      tipoJogo,
      dupla1: dupla1Jogadores.map((j) => ({
        id: j.id,
        nome: j.nome,
        nivel: j.nivel,
        genero: j.genero,
      })),
      dupla2: dupla2Jogadores.map((j) => ({
        id: j.id,
        nome: j.nome,
        nivel: j.nivel,
        genero: j.genero,
      })),
    };
  }

  private criarPartidaDTOVazia(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    ordem: number,
    tipoJogo: TipoJogoTeams,
    equipe1: Equipe,
    equipe2: Equipe
  ): CriarPartidaTeamsDTO {
    return {
      confrontoId: confronto.id,
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      ordem,
      tipoJogo,
      equipe1Id: equipe1.id,
      equipe1Nome: equipe1.nome,
      equipe2Id: equipe2.id,
      equipe2Nome: equipe2.nome,
      dupla1: [],
      dupla2: [],
      isDecider: false,
    };
  }

  private validarDuplasUnicasComDados(
    partidas: PartidaTeams[],
    dupla1Jogadores: JogadorEquipe[],
    dupla2Jogadores: JogadorEquipe[]
  ): void {
    const duplasUsadas = new Set<string>();
    for (const p of partidas) {
      if (p.dupla1.length === 2) {
        const ids = p.dupla1.map((j) => j.id).sort();
        duplasUsadas.add(ids.join("-"));
      }
      if (p.dupla2.length === 2) {
        const ids = p.dupla2.map((j) => j.id).sort();
        duplasUsadas.add(ids.join("-"));
      }
    }

    const dupla1Ids = dupla1Jogadores.map((j) => j.id).sort();
    const dupla1Key = dupla1Ids.join("-");
    if (duplasUsadas.has(dupla1Key)) {
      throw new ValidationError(
        `A dupla ${dupla1Jogadores
          .map((j) => j.nome)
          .join(" / ")} já jogou neste confronto`
      );
    }

    const dupla2Ids = dupla2Jogadores.map((j) => j.id).sort();
    const dupla2Key = dupla2Ids.join("-");
    if (duplasUsadas.has(dupla2Key)) {
      throw new ValidationError(
        `A dupla ${dupla2Jogadores
          .map((j) => j.nome)
          .join(" / ")} já jogou neste confronto`
      );
    }
  }

  private validarJogadoresNaoRepetidosComDados(
    partidas: PartidaTeams[],
    dupla1Jogadores: JogadorEquipe[],
    dupla2Jogadores: JogadorEquipe[]
  ): void {
    const jogadoresUsados = new Set<string>();
    for (const p of partidas) {
      if (p.tipoJogo === TipoJogoTeams.DECIDER) continue;

      if (p.dupla1.length === 2) {
        p.dupla1.forEach((j) => jogadoresUsados.add(j.id));
      }
      if (p.dupla2.length === 2) {
        p.dupla2.forEach((j) => jogadoresUsados.add(j.id));
      }
    }

    for (const jogador of dupla1Jogadores) {
      if (jogadoresUsados.has(jogador.id)) {
        throw new ValidationError(
          `O jogador ${jogador.nome} já participou de uma partida neste confronto`
        );
      }
    }

    for (const jogador of dupla2Jogadores) {
      if (jogadoresUsados.has(jogador.id)) {
        throw new ValidationError(
          `O jogador ${jogador.nome} já participou de uma partida neste confronto`
        );
      }
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

export default new TeamsPartidaService();
