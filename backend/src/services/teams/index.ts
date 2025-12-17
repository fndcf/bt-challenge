/**
 * Exportações centralizadas do módulo Teams
 *
 * Este módulo contém os serviços especializados para o formato TEAMS:
 * - TeamsEquipeService: Formação e gerenciamento de equipes
 * - TeamsConfrontoService: Geração de confrontos (round-robin, grupos, eliminatórias)
 * - TeamsPartidaService: Geração de partidas e definição de jogadores
 * - TeamsResultadoService: Registro de resultados e estatísticas
 * - TeamsClassificacaoService: Classificação e preenchimento de eliminatórias
 */

// Services
export {
  TeamsEquipeService,
  ITeamsEquipeService,
  default as teamsEquipeService,
} from "./TeamsEquipeService";

export {
  TeamsConfrontoService,
  ITeamsConfrontoService,
  default as teamsConfrontoService,
} from "./TeamsConfrontoService";

export {
  TeamsPartidaService,
  ITeamsPartidaService,
  default as teamsPartidaService,
} from "./TeamsPartidaService";

export {
  TeamsResultadoService,
  ITeamsResultadoService,
  default as teamsResultadoService,
} from "./TeamsResultadoService";

export {
  TeamsClassificacaoService,
  ITeamsClassificacaoService,
  default as teamsClassificacaoService,
} from "./TeamsClassificacaoService";

// Strategies (re-export do submódulo)
export * from "./strategies";
