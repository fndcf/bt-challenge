/**
 * Dados das páginas públicas: grupos, chaves e histórico do jogador
 */

import { ConfrontoEliminatorio } from "../../models/Eliminatoria";
import { EstatisticasJogador } from "../../models/EstatisticasJogador";
import { Etapa, FormatoEtapa } from "../../models/Etapa";
import { Grupo } from "../../models/Grupo";
import { getRegras } from "../../models/RegrasFormato";
import { confrontoEliminatorioRepository } from "../../repositories/firebase/ConfrontoEliminatorioRepository";
import confrontoEquipeRepository from "../../repositories/firebase/ConfrontoEquipeRepository";
import { duplaRepository } from "../../repositories/firebase/DuplaRepository";
import equipeRepository from "../../repositories/firebase/EquipeRepository";
import { estatisticasJogadorRepository } from "../../repositories/firebase/EstatisticasJogadorRepository";
import { etapaRepository } from "../../repositories/firebase/EtapaRepository";
import { grupoRepository } from "../../repositories/firebase/GrupoRepository";
import { partidaReiDaPraiaRepository } from "../../repositories/firebase/PartidaReiDaPraiaRepository";
import { partidaRepository } from "../../repositories/firebase/PartidaRepository";
import partidaTeamsRepository from "../../repositories/firebase/PartidaTeamsRepository";
import { IConfrontoEliminatorioRepository } from "../../repositories/interfaces/IConfrontoEliminatorioRepository";
import { IConfrontoEquipeRepository } from "../../repositories/interfaces/IConfrontoEquipeRepository";
import { IDuplaRepository } from "../../repositories/interfaces/IDuplaRepository";
import { IEquipeRepository } from "../../repositories/interfaces/IEquipeRepository";
import { IEstatisticasJogadorRepository } from "../../repositories/interfaces/IEstatisticasJogadorRepository";
import { IEtapaRepository } from "../../repositories/interfaces/IEtapaRepository";
import { IGrupoRepository } from "../../repositories/interfaces/IGrupoRepository";
import { IPartidaReiDaPraiaRepository } from "../../repositories/interfaces/IPartidaReiDaPraiaRepository";
import { IPartidaRepository } from "../../repositories/interfaces/IPartidaRepository";
import { IPartidaTeamsRepository } from "../../repositories/interfaces/IPartidaTeamsRepository";
import { montarGruposTeams } from "./gruposTeams";

// Da final para trás
const ORDEM_FASES: Record<string, number> = {
  FINAL: 1,
  SEMIFINAL: 2,
  QUARTAS: 3,
  OITAVAS: 4,
};

const NOME_FASES: Record<string, string> = {
  FINAL: "Final",
  SEMIFINAL: "Semifinal",
  QUARTAS: "Quartas de Final",
  OITAVAS: "Oitavas de Final",
};

const POSICAO_POR_COLOCACAO: Record<string, number> = {
  campeao: 1,
  vice: 2,
  semifinalista: 3,
  quartas: 5,
  oitavas: 9,
  participacao: 99,
};

const STATUS_CHAVE = ["finalizada", "bye", "em_andamento"];

type ComData = { criadoEm: EstatisticasJogador["criadoEm"] | string };

/** Data em milissegundos; sem data conta como a mais antiga */
const emMilissegundos = ({ criadoEm }: ComData): number =>
  typeof criadoEm === "object" ? criadoEm?.toMillis?.() ?? 0 : 0;

export class EtapaPublicaService {
  constructor(
    private etapas: IEtapaRepository = etapaRepository,
    private grupos: IGrupoRepository = grupoRepository,
    private duplas: IDuplaRepository = duplaRepository,
    private partidas: IPartidaRepository = partidaRepository,
    private confrontos: IConfrontoEliminatorioRepository = confrontoEliminatorioRepository,
    private estatisticas: IEstatisticasJogadorRepository = estatisticasJogadorRepository,
    private partidasReiDaPraia: IPartidaReiDaPraiaRepository = partidaReiDaPraiaRepository,
    private equipes: IEquipeRepository = equipeRepository,
    private confrontosEquipe: IConfrontoEquipeRepository = confrontoEquipeRepository,
    private partidasTeams: IPartidaTeamsRepository = partidaTeamsRepository
  ) {}

  /**
   * Fase de grupos da etapa; no Teams, inclui as fases eliminatórias
   */
  async buscarGrupos(etapa: Etapa) {
    if (etapa.formato === FormatoEtapa.TEAMS) {
      return this.buscarGruposTeams(etapa);
    }

    const grupos = await this.grupos.buscarPorEtapaOrdenado(
      etapa.id,
      etapa.arenaId
    );

    return Promise.all(
      grupos.map((grupo) =>
        getRegras(etapa.formato).grupoIndividual
          ? this.montarGrupoIndividual(grupo, etapa.formato)
          : this.montarGrupoDuplas(grupo)
      )
    );
  }

  private async buscarGruposTeams({ id, arenaId }: Etapa) {
    const [equipes, confrontos, partidas] = await Promise.all([
      this.equipes.buscarPorEtapa(id, arenaId),
      this.confrontosEquipe.buscarPorEtapa(id, arenaId),
      this.partidasTeams.buscarPorEtapa(id, arenaId),
    ]);

    return montarGruposTeams(equipes, confrontos, partidas);
  }

  /**
   * Rei da Praia e Super X
   */
  private async montarGrupoIndividual(grupo: Grupo, formato: FormatoEtapa) {
    const [estatisticas, partidas] = await Promise.all([
      this.estatisticas.buscarPorGrupo(grupo.id),
      this.partidasReiDaPraia.buscarPorGrupo(grupo.id),
    ]);

    const jogadores = estatisticas
      .map((e) => ({
        id: e.id,
        jogadorId: e.jogadorId,
        jogadorNome: e.jogadorNome,
        jogadorNivel: e.jogadorNivel,
        posicaoGrupo: e.posicaoGrupo || 0,
        jogosGrupo: e.jogosGrupo || 0,
        vitoriasGrupo: e.vitoriasGrupo || 0,
        derrotasGrupo: e.derrotasGrupo || 0,
        pontosGrupo: e.pontosGrupo || 0,
        gamesVencidosGrupo: e.gamesVencidosGrupo || 0,
        gamesPerdidosGrupo: e.gamesPerdidosGrupo || 0,
        saldoGamesGrupo: e.saldoGamesGrupo || 0,
        setsVencidosGrupo: e.setsVencidosGrupo || 0,
        setsPerdidosGrupo: e.setsPerdidosGrupo || 0,
        saldoSetsGrupo: e.saldoSetsGrupo || 0,
        classificado: e.classificado || false,
      }))
      .sort((a, b) => {
        if (a.posicaoGrupo && b.posicaoGrupo) {
          return a.posicaoGrupo - b.posicaoGrupo;
        }
        if (a.pontosGrupo !== b.pontosGrupo) {
          return b.pontosGrupo - a.pontosGrupo;
        }
        return b.saldoGamesGrupo - a.saldoGamesGrupo;
      });

    return {
      id: grupo.id,
      nome: grupo.nome,
      ordem: grupo.ordem,
      totalJogadores: jogadores.length,
      completo: grupo.completo || false,
      jogadores,
      partidas: [...partidas]
        .sort((a, b) => emMilissegundos(a) - emMilissegundos(b))
        .map((p) => ({
          id: p.id,
          dupla1Nome: p.dupla1Nome,
          dupla2Nome: p.dupla2Nome,
          status: p.status,
          setsDupla1: p.setsDupla1 || 0,
          setsDupla2: p.setsDupla2 || 0,
          placar: p.placar || [],
          vencedores: p.vencedores || [],
          vencedoresNomes: p.vencedoresNomes,
          criadoEm: p.criadoEm,
        })),
      formato,
    };
  }

  private async montarGrupoDuplas(grupo: Grupo) {
    const [duplas, partidas] = await Promise.all([
      this.duplas.buscarPorGrupoOrdenado(grupo.id),
      this.partidas.buscarPorGrupoOrdenado(grupo.id),
    ]);

    return {
      id: grupo.id,
      nome: grupo.nome,
      ordem: grupo.ordem,
      totalDuplas: grupo.totalDuplas,
      completo: grupo.completo || false,
      duplas: duplas.map((d) => ({
        id: d.id,
        jogador1Nome: d.jogador1Nome,
        jogador2Nome: d.jogador2Nome,
        posicaoGrupo: d.posicaoGrupo,
        vitorias: d.vitorias || 0,
        derrotas: d.derrotas || 0,
        pontos: d.pontos || 0,
        saldoGames: d.saldoGames || 0,
        jogos: d.jogos || 0,
        classificada: d.classificada || false,
      })),
      partidas: partidas.map((p) => ({
        id: p.id,
        dupla1Id: p.dupla1Id,
        dupla2Id: p.dupla2Id,
        dupla1Nome: p.dupla1Nome,
        dupla2Nome: p.dupla2Nome,
        status: p.status,
        setsDupla1: p.setsDupla1 || 0,
        setsDupla2: p.setsDupla2 || 0,
        placar: p.placar || [],
        vencedoraId: p.vencedoraId,
        vencedoraNome: p.vencedoraNome,
        criadoEm: p.criadoEm,
      })),
      formato: FormatoEtapa.DUPLA_FIXA,
    };
  }

  /**
   * Chave eliminatória da etapa, da final para trás
   */
  async buscarChaves(etapaId: string, arenaId: string) {
    const confrontos = await this.confrontos.buscarPorEtapaOrdenado(
      etapaId,
      arenaId
    );

    const fases = [...new Set(confrontos.map((c) => c.fase.toUpperCase()))].sort(
      (a, b) => (ORDEM_FASES[a] || 99) - (ORDEM_FASES[b] || 99)
    );

    const rodadas = await Promise.all(
      fases.map(async (fase) => ({
        numero: ORDEM_FASES[fase] || 99,
        nome: NOME_FASES[fase] || fase,
        partidas: await Promise.all(
          confrontos
            .filter((c) => c.fase.toUpperCase() === fase)
            .map((c) => this.montarPartidaDaChave(c))
        ),
      }))
    );

    return {
      formato: "eliminacao_simples",
      temChaves: rodadas.length > 0,
      rodadas,
    };
  }

  private async montarPartidaDaChave(confronto: ConfrontoEliminatorio) {
    const status = confronto.status?.toLowerCase();

    return {
      id: confronto.id,
      numero: confronto.ordem,
      jogador1: {
        id: confronto.dupla1Id || "",
        nome: confronto.dupla1Nome || "A definir",
      },
      jogador2: confronto.dupla2Id
        ? {
            id: confronto.dupla2Id,
            nome: confronto.dupla2Nome || "A definir",
          }
        : null,
      placar: confronto.placar || null,
      placarDetalhado: await this.buscarPlacar(confronto.partidaId),
      vencedor: confronto.vencedoraId
        ? confronto.vencedoraId === confronto.dupla1Id
          ? "jogador1"
          : "jogador2"
        : null,
      status: STATUS_CHAVE.includes(status) ? status : "agendada",
    };
  }

  /** Sem o placar de uma partida, a chave aparece mesmo assim */
  private async buscarPlacar(partidaId?: string) {
    if (!partidaId) return null;

    const partida = await this.partidas
      .buscarPorId(partidaId)
      .catch(() => null);

    return Array.isArray(partida?.placar) ? partida.placar : null;
  }

  /**
   * Participações do jogador na arena, da mais recente para a mais antiga
   */
  async buscarHistoricoJogador(jogadorId: string, arenaId: string) {
    const estatisticas = await this.estatisticas.buscarPorJogador(
      jogadorId,
      arenaId
    );

    const historico = await Promise.all(
      estatisticas.map((e) => this.montarParticipacao(e).catch(() => null))
    );

    return historico
      .filter((h) => h !== null)
      .sort((a, b) => emMilissegundos(b) - emMilissegundos(a));
  }

  private async montarParticipacao(e: EstatisticasJogador) {
    const etapa = await this.etapas.buscarPorId(e.etapaId);

    return {
      id: e.id,
      etapaId: e.etapaId,
      etapaNome: etapa?.nome || "Etapa Sem Nome",
      posicao: e.colocacao
        ? POSICAO_POR_COLOCACAO[e.colocacao.toLowerCase()] || 99
        : undefined,
      colocacao: e.colocacao,
      vitorias: e.vitorias || 0,
      derrotas: e.derrotas || 0,
      pontos: e.pontos || 0,
      jogos: e.jogos || 0,
      setsVencidos: e.setsVencidos || 0,
      setsPerdidos: e.setsPerdidos || 0,
      gamesVencidos: e.gamesVencidos || 0,
      gamesPerdidos: e.gamesPerdidos || 0,
      saldoSets: (e.setsVencidos || 0) - (e.setsPerdidos || 0),
      saldoGames: (e.gamesVencidos || 0) - (e.gamesPerdidos || 0),
      classificado: e.classificado || false,
      grupoNome: e.grupoNome,
      posicaoGrupo: e.posicaoGrupo,
      criadoEm: e.criadoEm,
    };
  }
}

export default new EtapaPublicaService();
