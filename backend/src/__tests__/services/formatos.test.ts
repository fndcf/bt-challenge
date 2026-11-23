/**
 * Testes das implementações de cada formato
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../config/firebase", () => ({
  db: { collection: jest.fn() },
  auth: {},
}));

const mockService = (...metodos: string[]) => ({
  __esModule: true,
  default: Object.fromEntries(metodos.map((m) => [m, jest.fn()])),
});

jest.mock("../../services/ChaveService", () =>
  mockService("substituirJogador")
);
jest.mock("../../services/ClassificacaoService", () =>
  mockService("recalcularClassificacaoGrupo")
);
jest.mock("../../services/ReiDaPraiaService", () =>
  mockService(
    "substituirJogador",
    "recalcularClassificacaoGrupo",
    "atualizarEmpatesEntreGrupos"
  )
);
jest.mock("../../services/SuperXService", () =>
  mockService("substituirJogador", "recalcularClassificacaoGrupo")
);
jest.mock("../../services/TeamsService", () =>
  mockService("substituirJogador")
);
jest.mock("../../services/teams", () => ({
  teamsClassificacaoService: { recalcularClassificacao: jest.fn() },
}));

import {
  Etapa,
  FormatoEtapa,
  TipoFormacaoDupla,
  TipoFormacaoEquipe,
} from "../../models/Etapa";
import { Jogador } from "../../models/Jogador";
import { getRegras } from "../../models/RegrasFormato";
import chaveService from "../../services/ChaveService";
import classificacaoService from "../../services/ClassificacaoService";
import { getFormato } from "../../services/formatos";
import { DuplaFixaFormato } from "../../services/formatos/DuplaFixaFormato";
import { ReiDaPraiaFormato } from "../../services/formatos/ReiDaPraiaFormato";
import { SuperXFormato } from "../../services/formatos/SuperXFormato";
import { TeamsFormato } from "../../services/formatos/TeamsFormato";
import reiDaPraiaService from "../../services/ReiDaPraiaService";
import superXService from "../../services/SuperXService";
import { teamsClassificacaoService } from "../../services/teams";
import teamsService from "../../services/TeamsService";
import {
  RANKING_PRIMEIROS,
  RANKING_SEGUNDOS,
} from "../../utils/desempate";
import {
  createMockConfrontoEquipeRepository,
  createMockPartidaReiDaPraiaRepository,
  createMockPartidaRepository,
} from "../mocks/repositories";

const { DUPLA_FIXA, REI_DA_PRAIA, SUPER_X, TEAMS } = FormatoEtapa;
const etapa = { id: "e1", arenaId: "a1" } as Etapa;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getFormato", () => {
  it.each([
    [DUPLA_FIXA, DuplaFixaFormato],
    [REI_DA_PRAIA, ReiDaPraiaFormato],
    [SUPER_X, SuperXFormato],
    [TEAMS, TeamsFormato],
    [undefined, DuplaFixaFormato],
  ])("%s", (formato, classe) => {
    expect(getFormato(formato)).toBeInstanceOf(classe);
  });
});

describe("temPartidasJogadas", () => {
  const partidas = createMockPartidaRepository();
  const individuais = createMockPartidaReiDaPraiaRepository();
  const confrontos = createMockConfrontoEquipeRepository();

  it.each([
    ["Dupla Fixa", new DuplaFixaFormato(partidas), partidas],
    ["Rei da Praia", new ReiDaPraiaFormato(individuais), individuais],
    ["Super X", new SuperXFormato(individuais), individuais],
    ["Teams", new TeamsFormato(confrontos), confrontos],
  ])("%s: só com partida iniciada ou terminada", async (_, formato, repo) => {
    const jogadas = (...status: string[]) => {
      repo.buscarPorEtapa.mockResolvedValue(status.map((s) => ({ status: s })));
      return formato.temPartidasJogadas("e1", "a1");
    };

    expect(await jogadas()).toBe(false);
    expect(await jogadas(repo === confrontos ? "agendado" : "agendada")).toBe(
      false
    );
    expect(await jogadas("em_andamento")).toBe(true);
    expect(repo.buscarPorEtapa).toHaveBeenCalledWith("e1", "a1");
  });
});

describe("substituirJogador", () => {
  it.each([
    [DUPLA_FIXA, chaveService],
    [REI_DA_PRAIA, reiDaPraiaService],
    [SUPER_X, superXService],
    [TEAMS, teamsService],
  ])("%s", async (formato, service) => {
    const novo = { id: "novo" } as Jogador;

    await getFormato(formato).substituirJogador("e1", "a1", "antigo", novo);

    expect(service.substituirJogador).toHaveBeenCalledWith(
      "e1",
      "a1",
      "antigo",
      novo
    );
  });
});

describe("reaplicarClassificacao", () => {
  it("Dupla Fixa recalcula o grupo", async () => {
    await getFormato(DUPLA_FIXA).reaplicarClassificacao(etapa, "g1");

    expect(
      classificacaoService.recalcularClassificacaoGrupo
    ).toHaveBeenCalledWith("g1");
  });

  it("Rei da Praia recalcula o grupo e os empates entre grupos", async () => {
    await getFormato(REI_DA_PRAIA).reaplicarClassificacao(etapa, "g1");

    expect(reiDaPraiaService.recalcularClassificacaoGrupo).toHaveBeenCalledWith(
      "g1",
      "e1"
    );
    expect(reiDaPraiaService.atualizarEmpatesEntreGrupos).toHaveBeenCalledWith(
      "e1",
      "a1"
    );
  });

  it.each([RANKING_PRIMEIROS, RANKING_SEGUNDOS])(
    "Rei da Praia: %s não tem grupo para recalcular",
    async (ranking) => {
      await getFormato(REI_DA_PRAIA).reaplicarClassificacao(etapa, ranking);

      expect(
        reiDaPraiaService.recalcularClassificacaoGrupo
      ).not.toHaveBeenCalled();
      expect(
        reiDaPraiaService.atualizarEmpatesEntreGrupos
      ).not.toHaveBeenCalled();
    }
  );

  it("Super X recalcula o grupo", async () => {
    await getFormato(SUPER_X).reaplicarClassificacao(etapa, "g1");

    expect(superXService.recalcularClassificacaoGrupo).toHaveBeenCalledWith(
      "g1",
      "e1"
    );
  });

  it("Teams recalcula a etapa", async () => {
    await getFormato(TEAMS).reaplicarClassificacao(etapa, "A");

    expect(
      teamsClassificacaoService.recalcularClassificacao
    ).toHaveBeenCalledWith("e1", "a1");
  });
});

describe("regras de participação", () => {
  it.each([
    [DUPLA_FIXA, true, true, false],
    [REI_DA_PRAIA, true, false, true],
    [SUPER_X, false, false, true],
    [TEAMS, true, true, false],
    [undefined, true, true, false],
  ])("%s", (formato, nivel, vagas, individual) => {
    expect(getRegras(formato)).toMatchObject({
      inscricaoExigeNivel: nivel,
      mistoDivideVagas: vagas,
      grupoIndividual: individual,
    });
  });

  it("só formação balanceada mistura níveis", () => {
    const dupla = getRegras(DUPLA_FIXA).misturaNiveis;
    const teams = getRegras(TEAMS).misturaNiveis;
    const com = (dados: Partial<Etapa>) => ({ ...etapa, ...dados });

    expect(dupla(com({ tipoFormacaoDupla: TipoFormacaoDupla.BALANCEADO }))).toBe(true);
    expect(dupla(etapa)).toBe(false);
    expect(teams(com({ tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO }))).toBe(true);
    expect(teams(com({ tipoFormacaoEquipe: TipoFormacaoEquipe.MANUAL }))).toBe(false);
    expect(getRegras(SUPER_X).misturaNiveis(etapa)).toBe(false);
    expect(getRegras(REI_DA_PRAIA).misturaNiveis(etapa)).toBe(false);
  });
});
