/**
 * Regras do formato ao editar a etapa (validarConfiguracaoFormato)
 */

import {
  ConfiguracaoFormato,
  FormatoEtapa,
  NivelJogador,
  TipoFormacaoDupla,
  TipoFormacaoEquipe,
  VarianteSuperX,
  VarianteTeams,
  validarConfiguracaoFormato,
} from "../../models/Etapa";
import { GeneroJogador } from "../../models/Jogador";

const base: ConfiguracaoFormato = {
  formato: FormatoEtapa.DUPLA_FIXA,
  genero: GeneroJogador.MASCULINO,
  nivel: NivelJogador.INTERMEDIARIO,
  maxJogadores: 16,
  tipoFormacaoDupla: TipoFormacaoDupla.MESMO_NIVEL,
};

const validar = (mudancas: Partial<ConfiguracaoFormato>) =>
  validarConfiguracaoFormato({ ...base, ...mudancas });

describe("validarConfiguracaoFormato", () => {
  describe("Dupla Fixa", () => {
    it("aceita trocar a formação para balanceado ou manual sem nível", () => {
      expect(validar({ nivel: undefined, tipoFormacaoDupla: TipoFormacaoDupla.BALANCEADO })).toBeNull();
      expect(validar({ nivel: undefined, tipoFormacaoDupla: TipoFormacaoDupla.MANUAL })).toBeNull();
    });

    it("mesmo nível precisa de um nível na etapa (exceto mista)", () => {
      expect(validar({ nivel: undefined })).toBe(
        "Formação por mesmo nível precisa de um nível na etapa"
      );
      expect(validar({ nivel: undefined, genero: GeneroJogador.MISTO })).toBeNull();
    });
  });

  describe("Super X", () => {
    const superX = { formato: FormatoEtapa.SUPER_X, nivel: undefined };

    it("o número de jogadores tem que ser o da variante", () => {
      expect(validar({ ...superX, varianteSuperX: VarianteSuperX.SUPER_12, maxJogadores: 12 })).toBeNull();
      expect(validar({ ...superX, varianteSuperX: VarianteSuperX.SUPER_12, maxJogadores: 8 })).toBe(
        "Super 12 requer exatamente 12 jogadores"
      );
    });
  });

  describe("Teams", () => {
    const teams = {
      formato: FormatoEtapa.TEAMS,
      tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
      nivel: undefined,
    };

    it("número de jogadores múltiplo da variante", () => {
      expect(validar({ ...teams, varianteTeams: VarianteTeams.TEAMS_6, maxJogadores: 12 })).toBeNull();
      expect(validar({ ...teams, varianteTeams: VarianteTeams.TEAMS_6, maxJogadores: 16 })).toBe(
        "Teams 6: número de jogadores deve ser múltiplo de 6"
      );
    });

    it("pelo menos 2 equipes e no máximo o limite da variante", () => {
      expect(validar({ ...teams, varianteTeams: VarianteTeams.TEAMS_6, maxJogadores: 6 })).toBe(
        "Teams 6: mínimo de 12 jogadores (2 equipes)"
      );
      expect(validar({ ...teams, varianteTeams: VarianteTeams.TEAMS_4, maxJogadores: 108 })).toBe(
        "Máximo de 104 jogadores"
      );
    });

    it("equipes por mesmo nível precisam de um nível na etapa", () => {
      expect(
        validar({ ...teams, maxJogadores: 8, tipoFormacaoEquipe: TipoFormacaoEquipe.MESMO_NIVEL })
      ).toBe("Equipes por mesmo nível precisam de um nível na etapa");
    });
  });
});
