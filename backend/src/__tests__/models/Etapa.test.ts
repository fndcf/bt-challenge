/**
 * Testes para models/Etapa.ts
 */

import {
  CriarEtapaSchema,
  FormatoEtapa,
  NivelJogador,
  VarianteSuperX,
  VarianteTeams,
  TipoFormacaoEquipe,
  TipoChaveamentoReiDaPraia,
} from "../../models/Etapa";
import { GeneroJogador } from "../../models/Jogador";

describe("CriarEtapaSchema", () => {
  const etapaBaseValida = {
    nome: "Etapa Teste",
    genero: GeneroJogador.MASCULINO,
    formato: FormatoEtapa.DUPLA_FIXA,
    nivel: NivelJogador.INTERMEDIARIO,
    dataInicio: "2024-01-01T00:00:00.000Z",
    dataFim: "2024-01-31T00:00:00.000Z",
    dataRealizacao: "2024-01-15T00:00:00.000Z",
    maxJogadores: 16,
    jogadoresPorGrupo: 4,
    contaPontosRanking: true,
  };

  describe("validações básicas", () => {
    it("deve validar etapa válida DUPLA_FIXA", () => {
      const resultado = CriarEtapaSchema.safeParse(etapaBaseValida);
      expect(resultado.success).toBe(true);
    });

    it("deve exigir nome com mínimo 3 caracteres", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        nome: "AB",
      });
      expect(resultado.success).toBe(false);
    });

    it("deve exigir gênero válido", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        genero: "invalido",
      });
      expect(resultado.success).toBe(false);
    });
  });

  describe("validação nivel obrigatório para DUPLA_FIXA e REI_DA_PRAIA (linhas 161-171)", () => {
    it("deve exigir nivel para DUPLA_FIXA", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        nivel: undefined,
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("nivel"))
        ).toBe(true);
      }
    });

    it("não deve exigir nivel para REI_DA_PRAIA (permite todos os níveis)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.REI_DA_PRAIA,
        nivel: undefined,
        tipoChaveamento: TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO,
        maxJogadores: 16,
        jogadoresPorGrupo: 4,
      });
      expect(resultado.success).toBe(true);
    });

    it("não deve exigir nivel para SUPER_X", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.SUPER_X,
        nivel: undefined,
        varianteSuperX: VarianteSuperX.SUPER_8,
        maxJogadores: 8,
        jogadoresPorGrupo: 8,
      });
      expect(resultado.success).toBe(true);
    });

    it("não deve exigir nivel para TEAMS", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        maxJogadores: 16,
      });
      expect(resultado.success).toBe(true);
    });
  });

  describe("validações SUPER_X (linhas 174-190)", () => {
    it("deve exigir varianteSuperX para formato SUPER_X (linha 175)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.SUPER_X,
        nivel: undefined,
        varianteSuperX: undefined,
        maxJogadores: 8,
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("varianteSuperX"))
        ).toBe(true);
      }
    });

    it("deve validar maxJogadores igual à variante SUPER_8 (linhas 184-185)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.SUPER_X,
        nivel: undefined,
        varianteSuperX: VarianteSuperX.SUPER_8,
        maxJogadores: 12, // Errado, deveria ser 8
        jogadoresPorGrupo: 8,
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("maxJogadores"))
        ).toBe(true);
      }
    });

    it("deve validar maxJogadores igual à variante SUPER_12", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.SUPER_X,
        nivel: undefined,
        varianteSuperX: VarianteSuperX.SUPER_12,
        maxJogadores: 8, // Errado, deveria ser 12
        jogadoresPorGrupo: 12,
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("maxJogadores"))
        ).toBe(true);
      }
    });

    it("deve aceitar SUPER_8 com 8 jogadores", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.SUPER_X,
        nivel: undefined,
        varianteSuperX: VarianteSuperX.SUPER_8,
        maxJogadores: 8,
        jogadoresPorGrupo: 8,
      });
      expect(resultado.success).toBe(true);
    });

    it("deve aceitar SUPER_12 com 12 jogadores", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.SUPER_X,
        nivel: undefined,
        varianteSuperX: VarianteSuperX.SUPER_12,
        maxJogadores: 12,
        jogadoresPorGrupo: 12,
      });
      expect(resultado.success).toBe(true);
    });

    it("deve validar jogadoresPorGrupo igual à variante para SUPER_X (linha 306)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.SUPER_X,
        nivel: undefined,
        varianteSuperX: VarianteSuperX.SUPER_8,
        maxJogadores: 8,
        jogadoresPorGrupo: 4, // Errado, deveria ser 8
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) =>
            i.path.includes("jogadoresPorGrupo")
          )
        ).toBe(true);
      }
    });
  });

  describe("validações número de jogadores par (linhas 194-204)", () => {
    it("deve exigir número par para DUPLA_FIXA", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        maxJogadores: 15, // Ímpar
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("maxJogadores"))
        ).toBe(true);
      }
    });

    it("deve aceitar número par para DUPLA_FIXA", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        maxJogadores: 16,
      });
      expect(resultado.success).toBe(true);
    });
  });

  describe("validações REI_DA_PRAIA múltiplo de 4 (linhas 207-216)", () => {
    it("deve exigir múltiplo de 4 para REI_DA_PRAIA (linha 211)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.REI_DA_PRAIA,
        tipoChaveamento: TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO,
        maxJogadores: 18, // Não é múltiplo de 4
        jogadoresPorGrupo: 4,
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("maxJogadores"))
        ).toBe(true);
      }
    });

    it("deve aceitar múltiplo de 4 para REI_DA_PRAIA", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.REI_DA_PRAIA,
        tipoChaveamento: TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO,
        maxJogadores: 16,
        jogadoresPorGrupo: 4,
      });
      expect(resultado.success).toBe(true);
    });
  });

  describe("validações jogadoresPorGrupo (linhas 218-239)", () => {
    it("deve exigir jogadoresPorGrupo para DUPLA_FIXA (linha 220)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        jogadoresPorGrupo: undefined,
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) =>
            i.path.includes("jogadoresPorGrupo")
          )
        ).toBe(true);
      }
    });

    it("deve limitar jogadoresPorGrupo a 4 para REI_DA_PRAIA (linha 234)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.REI_DA_PRAIA,
        tipoChaveamento: TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO,
        maxJogadores: 16,
        jogadoresPorGrupo: 8, // Máximo é 4 para REI_DA_PRAIA
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) =>
            i.path.includes("jogadoresPorGrupo")
          )
        ).toBe(true);
      }
    });
  });

  describe("validações TEAMS (linhas 244-297)", () => {
    it("deve exigir varianteTeams para formato TEAMS (linha 245)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: undefined,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        maxJogadores: 16,
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("varianteTeams"))
        ).toBe(true);
      }
    });

    it("deve exigir tipoFormacaoEquipe para TEAMS (linha 254)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: undefined,
        maxJogadores: 16,
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) =>
            i.path.includes("tipoFormacaoEquipe")
          )
        ).toBe(true);
      }
    });

    it("deve exigir maxJogadores múltiplo da variante TEAMS_4 (linhas 267-273)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        maxJogadores: 18, // Não é múltiplo de 4
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("maxJogadores"))
        ).toBe(true);
      }
    });

    it("deve exigir maxJogadores múltiplo da variante TEAMS_6 (linhas 267-273)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        maxJogadores: 16, // Não é múltiplo de 6
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("maxJogadores"))
        ).toBe(true);
      }
    });

    it("deve exigir mínimo de 2 equipes para TEAMS_4 (linhas 275-282)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        maxJogadores: 4, // Apenas 1 equipe, mínimo é 8 (2 equipes)
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some(
            (i) =>
              i.path.includes("maxJogadores") && i.message.includes("Mínimo")
          )
        ).toBe(true);
      }
    });

    it("deve exigir mínimo de 2 equipes para TEAMS_6 (linhas 275-282)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        maxJogadores: 6, // Apenas 1 equipe, mínimo é 12 (2 equipes)
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some(
            (i) =>
              i.path.includes("maxJogadores") && i.message.includes("Mínimo")
          )
        ).toBe(true);
      }
    });

    it("deve exigir nivel quando tipoFormacaoEquipe é MESMO_NIVEL (linha 291)", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.MESMO_NIVEL,
        maxJogadores: 16,
      });
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(
          resultado.error.issues.some((i) => i.path.includes("nivel"))
        ).toBe(true);
      }
    });

    it("deve aceitar nivel quando tipoFormacaoEquipe é MESMO_NIVEL", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: NivelJogador.INTERMEDIARIO,
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.MESMO_NIVEL,
        maxJogadores: 16,
      });
      expect(resultado.success).toBe(true);
    });

    it("deve aceitar TEAMS_4 válido", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        maxJogadores: 16,
      });
      expect(resultado.success).toBe(true);
    });

    it("deve aceitar TEAMS_6 válido", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        maxJogadores: 18,
        isMisto: true,
      });
      expect(resultado.success).toBe(true);
    });

    it("deve aceitar TEAMS_6 não misto", () => {
      const resultado = CriarEtapaSchema.safeParse({
        ...etapaBaseValida,
        formato: FormatoEtapa.TEAMS,
        nivel: undefined,
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        maxJogadores: 18,
        isMisto: false,
      });
      expect(resultado.success).toBe(true);
    });
  });

  describe("cenários válidos completos", () => {
    it("deve aceitar REI_DA_PRAIA completo", () => {
      const resultado = CriarEtapaSchema.safeParse({
        nome: "Rei da Praia Verão",
        genero: GeneroJogador.MASCULINO,
        formato: FormatoEtapa.REI_DA_PRAIA,
        nivel: NivelJogador.AVANCADO,
        tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
        dataInicio: "2024-01-01T00:00:00.000Z",
        dataFim: "2024-01-31T00:00:00.000Z",
        dataRealizacao: "2024-01-15T00:00:00.000Z",
        maxJogadores: 24,
        jogadoresPorGrupo: 4,
        contaPontosRanking: true,
      });
      expect(resultado.success).toBe(true);
    });

    it("deve aceitar DUPLA_FIXA completo", () => {
      const resultado = CriarEtapaSchema.safeParse({
        nome: "Dupla Fixa Março",
        genero: GeneroJogador.FEMININO,
        formato: FormatoEtapa.DUPLA_FIXA,
        nivel: NivelJogador.INICIANTE,
        dataInicio: "2024-03-01T00:00:00.000Z",
        dataFim: "2024-03-31T00:00:00.000Z",
        dataRealizacao: "2024-03-15T00:00:00.000Z",
        maxJogadores: 32,
        jogadoresPorGrupo: 4,
        contaPontosRanking: false,
        local: "Quadra Central",
        descricao: "Etapa de dupla fixa feminina",
      });
      expect(resultado.success).toBe(true);
    });

    it("deve aceitar TEAMS_4 com formação manual", () => {
      const resultado = CriarEtapaSchema.safeParse({
        nome: "Teams 4 Manual",
        genero: GeneroJogador.MISTO,
        formato: FormatoEtapa.TEAMS,
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.MANUAL,
        dataInicio: "2024-02-01T00:00:00.000Z",
        dataFim: "2024-02-28T00:00:00.000Z",
        dataRealizacao: "2024-02-15T00:00:00.000Z",
        maxJogadores: 20,
        contaPontosRanking: true,
      });
      expect(resultado.success).toBe(true);
    });
  });
});
