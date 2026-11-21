/**
 * Testes do DesempateService
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    critical: jest.fn(),
  },
}));

const mockGet = jest.fn();
const mockUpdate = jest.fn();

jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({ get: mockGet, update: mockUpdate })),
    })),
  },
  auth: { verifyIdToken: jest.fn() },
}));

jest.mock("../../utils/arrayUtils", () => ({
  // Sorteio previsível: inverte a ordem
  embaralhar: jest.fn((arr: unknown[]) => [...arr].reverse()),
}));

import { FieldPath } from "firebase-admin/firestore";
import { DesempateService } from "../../services/DesempateService";
import { EmpatePendente } from "../../models/Etapa";

interface Jogador {
  id: string;
  nome: string;
  pontos: number;
}

const etapaDoc = (dados: Record<string, unknown>) => ({
  exists: true,
  id: "etapa-1",
  data: () => ({ arenaId: "arena-1", ...dados }),
});

const jogadores: Jogador[] = [
  { id: "fernando", nome: "fernando", pontos: 6 },
  { id: "lipe", nome: "Lipe Dias", pontos: 6 },
  { id: "davi", nome: "Davi Louzada", pontos: 6 },
  { id: "neto", nome: "neto", pontos: 0 },
];

const empateTriplo: EmpatePendente = {
  grupoId: "grupo-a",
  grupoNome: "Grupo A",
  posicaoInicial: 1,
  participantes: [
    { id: "davi", nome: "Davi Louzada" },
    { id: "fernando", nome: "fernando" },
    { id: "lipe", nome: "Lipe Dias" },
  ],
};

describe("DesempateService", () => {
  let service: DesempateService;

  const classificar = (grupoCompleto: boolean, itens = jogadores) =>
    service.classificarGrupo({
      etapaId: "etapa-1",
      grupoId: "grupo-a",
      grupoNome: "Grupo A",
      itens,
      comparar: (a, b) => b.pontos - a.pontos,
      getId: (j) => j.id,
      getNome: (j) => j.nome,
      grupoCompleto,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue(undefined);
    service = new DesempateService();
  });

  describe("classificarGrupo", () => {
    it("deve registrar empate pendente quando o grupo terminou", async () => {
      mockGet.mockResolvedValue(etapaDoc({}));

      const ordenados = await classificar(true);

      expect(ordenados.map((j) => j.id)).toEqual(["davi", "fernando", "lipe", "neto"]);
      expect(mockUpdate).toHaveBeenCalledWith(
        new FieldPath("empatesPendentes", "grupo-a"),
        [empateTriplo],
        "atualizadoEm",
        expect.anything()
      );
    });

    it("não deve registrar pendência com o grupo em andamento", async () => {
      mockGet.mockResolvedValue(etapaDoc({}));

      await classificar(false);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve limpar a pendência quando o empate deixa de existir", async () => {
      mockGet.mockResolvedValue(
        etapaDoc({ empatesPendentes: { "grupo-a": [empateTriplo] } })
      );

      await classificar(true, [
        { id: "fernando", nome: "fernando", pontos: 9 },
        { id: "lipe", nome: "Lipe Dias", pontos: 6 },
      ]);

      expect(mockUpdate).toHaveBeenCalledWith(
        new FieldPath("empatesPendentes", "grupo-a"),
        expect.objectContaining({}), // FieldValue.delete()
        "atualizadoEm",
        expect.anything()
      );
    });

    it("não deve escrever se as pendências não mudaram", async () => {
      mockGet.mockResolvedValue(
        etapaDoc({ empatesPendentes: { "grupo-a": [empateTriplo] } })
      );

      await classificar(true);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve aplicar desempate definido e não reportar pendência", async () => {
      mockGet.mockResolvedValue(
        etapaDoc({
          desempates: {
            "grupo-a": [{ ids: ["lipe", "fernando", "davi"], modo: "manual" }],
          },
        })
      );

      const ordenados = await classificar(true);

      expect(ordenados.map((j) => j.id)).toEqual(["lipe", "fernando", "davi", "neto"]);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("não deve mexer nas pendências com atualizarPendencias = false", async () => {
      mockGet.mockResolvedValue(etapaDoc({}));

      await service.classificarGrupo({
        etapaId: "etapa-1",
        grupoId: "grupo-a",
        grupoNome: "Grupo A",
        itens: jogadores,
        comparar: (a, b) => b.pontos - a.pontos,
        getId: (j) => j.id,
        getNome: (j) => j.nome,
        grupoCompleto: true,
        atualizarPendencias: false,
      });

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("definirDesempate", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(
        etapaDoc({ empatesPendentes: { "grupo-a": [empateTriplo] } })
      );
    });

    it("deve salvar a ordem manual escolhida", async () => {
      const resultado = await service.definirDesempate(
        "etapa-1",
        "grupo-a",
        ["lipe", "davi", "fernando"],
        "manual"
      );

      // Salva a decisão e remove a pendência resolvida na mesma escrita
      expect(mockUpdate).toHaveBeenCalledWith(
        new FieldPath("desempates", "grupo-a"),
        [{ ids: ["lipe", "davi", "fernando"], modo: "manual" }],
        new FieldPath("empatesPendentes", "grupo-a"),
        expect.anything(), // FieldValue.delete() (era o único empate)
        "atualizadoEm",
        expect.anything()
      );
      expect(resultado.participantes.map((p) => p.nome)).toEqual([
        "Lipe Dias",
        "Davi Louzada",
        "fernando",
      ]);
    });

    it("deve sortear a ordem no modo sorteio", async () => {
      const resultado = await service.definirDesempate(
        "etapa-1",
        "grupo-a",
        ["davi", "fernando", "lipe"],
        "sorteio"
      );

      // embaralhar mockado inverte a lista
      expect(resultado.participantes.map((p) => p.id)).toEqual([
        "lipe",
        "fernando",
        "davi",
      ]);
      expect(resultado.modo).toBe("sorteio");
    });

    it("deve substituir decisão anterior do mesmo bloco", async () => {
      mockGet.mockResolvedValue(
        etapaDoc({
          empatesPendentes: { "grupo-a": [empateTriplo] },
          desempates: {
            "grupo-a": [
              { ids: ["fernando", "lipe", "davi"], modo: "manual" },
              { ids: ["x", "y"], modo: "sorteio" },
            ],
          },
        })
      );

      await service.definirDesempate(
        "etapa-1",
        "grupo-a",
        ["davi", "lipe", "fernando"],
        "manual"
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        new FieldPath("desempates", "grupo-a"),
        [
          { ids: ["x", "y"], modo: "sorteio" },
          { ids: ["davi", "lipe", "fernando"], modo: "manual" },
        ],
        new FieldPath("empatesPendentes", "grupo-a"),
        expect.anything(),
        "atualizadoEm",
        expect.anything()
      );
    });

    it("deve manter as outras pendências do mesmo grupo", async () => {
      const outroEmpate: EmpatePendente = {
        ...empateTriplo,
        posicaoInicial: 4,
        participantes: [
          { id: "neto", nome: "neto" },
          { id: "zeca", nome: "Zeca" },
        ],
      };
      mockGet.mockResolvedValue(
        etapaDoc({ empatesPendentes: { "grupo-a": [empateTriplo, outroEmpate] } })
      );

      await service.definirDesempate("etapa-1", "grupo-a", ["neto", "zeca"], "manual");

      expect(mockUpdate).toHaveBeenCalledWith(
        new FieldPath("desempates", "grupo-a"),
        expect.any(Array),
        new FieldPath("empatesPendentes", "grupo-a"),
        [empateTriplo],
        "atualizadoEm",
        expect.anything()
      );
    });

    it("deve rejeitar ids que não correspondem a um empate pendente", async () => {
      await expect(
        service.definirDesempate("etapa-1", "grupo-a", ["lipe", "davi"], "manual")
      ).rejects.toThrow("Empate não encontrado ou já resolvido");
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve rejeitar etapa inexistente", async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.definirDesempate("etapa-1", "grupo-a", ["lipe", "davi"], "manual")
      ).rejects.toThrow("Etapa não encontrada");
    });
  });

  describe("classificarGrupo - empateRelevante / contexto", () => {
    it("deve registrar só os empates relevantes, com contexto", async () => {
      mockGet.mockResolvedValue(etapaDoc({}));
      const itens: Jogador[] = [
        { id: "a", nome: "A", pontos: 6 },
        { id: "b", nome: "B", pontos: 6 }, // a×b: mesma dupla (vagas 0 e 1)
        { id: "c", nome: "C", pontos: 3 },
        { id: "d", nome: "D", pontos: 3 }, // c×d: mesma dupla (vagas 2 e 3)
      ];

      await service.classificarGrupo({
        etapaId: "etapa-1",
        grupoId: "eliminatoria-primeiros",
        grupoNome: "Ranking dos 1º colocados",
        itens,
        comparar: (x, y) => y.pontos - x.pontos,
        getId: (j) => j.id,
        getNome: (j) => j.nome,
        grupoCompleto: true,
        empateRelevante: (e) => Math.floor((e.posicaoInicial - 1) / 2) !==
          Math.floor((e.posicaoInicial - 1 + e.ids.length - 1) / 2),
        contexto: "Define as duplas",
      });

      // Nenhum empate cruza duplas: nada a registrar
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve incluir contexto no empate registrado", async () => {
      mockGet.mockResolvedValue(etapaDoc({}));

      await service.classificarGrupo({
        etapaId: "etapa-1",
        grupoId: "eliminatoria-primeiros",
        grupoNome: "Ranking dos 1º colocados",
        itens: jogadores,
        comparar: (x, y) => y.pontos - x.pontos,
        getId: (j) => j.id,
        getNome: (j) => j.nome,
        grupoCompleto: true,
        contexto: "Define as duplas",
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        new FieldPath("empatesPendentes", "eliminatoria-primeiros"),
        [expect.objectContaining({ contexto: "Define as duplas", posicaoInicial: 1 })],
        "atualizadoEm",
        expect.anything()
      );
    });
  });

  describe("limparGrupos", () => {
    it("deve apagar pendências (e desempates, se pedido) das chaves informadas", async () => {
      await service.limparGrupos("etapa-1", ["eliminatoria-primeiros"], true);

      expect(mockUpdate).toHaveBeenCalledWith(
        new FieldPath("atualizadoEm"),
        expect.anything(),
        new FieldPath("empatesPendentes", "eliminatoria-primeiros"),
        expect.anything(),
        new FieldPath("desempates", "eliminatoria-primeiros"),
        expect.anything()
      );
    });
  });

  describe("garantirSemEmpatesPendentes", () => {
    it("deve ignorar empates fora do filtro", async () => {
      mockGet.mockResolvedValue(
        etapaDoc({ empatesPendentes: { "grupo-a": [empateTriplo] } })
      );

      await expect(
        service.garantirSemEmpatesPendentes(
          "etapa-1",
          "gerar a fase eliminatória",
          (e) => e.grupoId !== "grupo-a"
        )
      ).resolves.toBeUndefined();
    });

    it("deve bloquear quando há empate pendente", async () => {
      mockGet.mockResolvedValue(
        etapaDoc({ empatesPendentes: { "grupo-a": [empateTriplo] } })
      );

      await expect(
        service.garantirSemEmpatesPendentes("etapa-1", "encerrar a etapa")
      ).rejects.toThrow("Não é possível encerrar a etapa");
    });

    it("deve liberar sem empates", async () => {
      mockGet.mockResolvedValue(etapaDoc({}));

      await expect(
        service.garantirSemEmpatesPendentes("etapa-1", "encerrar a etapa")
      ).resolves.toBeUndefined();
    });
  });
});
