/**
 * Testes das cores semânticas
 *
 * Inclui uma trava de contraste (WCAG AA, mesmo critério do Lighthouse):
 * trocar uma cor da paleta por uma que reprove faz o teste falhar.
 */

import { semantic, getCoresFormato } from "@/styles/semantic";
import { theme } from "@/styles/theme";
import { tokens } from "@/styles/tokens";
import { FormatoEtapa } from "@/types/etapa";

const CONTRASTE_MINIMO = 4.5;

const luminancia = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contraste = (a: string, b: string): number => {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
};

// Cor sólida sob uma camada preta com transparência (chip sobre cabeçalho)
const escurecer = (hex: string, alpha: number): string => {
  const canal = (i: number) =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - alpha))
      .toString(16)
      .padStart(2, "0");
  return `#${canal(1)}${canal(3)}${canal(5)}`;
};

describe("styles/semantic", () => {
  describe("getCoresFormato", () => {
    it.each([
      [FormatoEtapa.DUPLA_FIXA, "Dupla Fixa"],
      [FormatoEtapa.REI_DA_PRAIA, "Rei da Praia"],
      [FormatoEtapa.SUPER_X, "Super X"],
      [FormatoEtapa.TEAMS, "Teams"],
    ])("deve devolver as cores de %s", (formato, nome) => {
      expect(getCoresFormato(formato).nome).toBe(nome);
    });

    it("sem formato (etapa antiga) usa Dupla Fixa, o padrão do backend", () => {
      expect(getCoresFormato(undefined)).toBe(semantic.formato.duplaFixa);
      expect(getCoresFormato(null)).toBe(semantic.formato.duplaFixa);
    });

    it("cada formato tem uma cor sólida diferente", () => {
      const solidos = Object.values(semantic.formato).map((f) => f.solido);
      expect(new Set(solidos).size).toBe(solidos.length);
    });

    it("nenhum formato usa a cor de ação", () => {
      Object.values(semantic.formato).forEach((f) => {
        expect(f.solido).not.toBe(semantic.acao.primaria);
      });
    });
  });

  describe("integração com o theme", () => {
    it("theme expõe as cores semânticas", () => {
      expect(theme.semantic).toBe(semantic);
    });

    it("ação usa o teal da marca da escala primary", () => {
      expect(semantic.acao.primaria).toBe(tokens.colors.primary[500]);
      expect(semantic.acao.primaria).toBe("#134E5E");
    });
  });

  describe("contraste (WCAG AA)", () => {
    const branco = semantic.texto.inverso;

    describe.each(Object.entries(semantic.formato))("formato %s", (_, cores) => {
      it("texto branco no cabeçalho (sólido)", () => {
        expect(contraste(branco, cores.solido)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      });

      it("texto do formato no selo (claro)", () => {
        expect(contraste(cores.texto, cores.claro)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      });

      it("texto do formato na posição (suave)", () => {
        expect(contraste(cores.texto, cores.suave)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      });

      it("texto do formato no branco", () => {
        expect(contraste(cores.texto, branco)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      });

      it("chip branco sobre o cabeçalho escurecido", () => {
        expect(
          contraste(branco, escurecer(cores.solido, 0.25))
        ).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      });
    });

    it.each(Object.entries(semantic.status))(
      "status %s: texto no fundo",
      (_, cores) => {
        expect(contraste(cores.texto, cores.fundo)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      }
    );

    it.each(Object.entries(semantic.genero))(
      "gênero %s: texto no fundo",
      (_, cores) => {
        expect(contraste(cores.texto, cores.fundo)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      }
    );

    it("gênero não usa as cores de nenhum formato", () => {
      const doFormato = Object.values(semantic.formato).flatMap((f) => [f.claro, f.suave, f.borda, f.texto]) as string[];
      Object.values(semantic.genero).forEach((g) => {
        [g.fundo, g.borda, g.texto].forEach((cor) => expect(doFormato).not.toContain(cor));
      });
    });

    it.each(Object.entries(semantic.medalha))(
      "medalha %s: texto no fundo",
      (_, cores) => {
        expect(contraste(cores.texto, cores.fundo)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      }
    );

    it("bronze não se confunde com o laranja do Teams", () => {
      expect(semantic.medalha.bronze.fundo).not.toBe(semantic.formato.teams.claro);
      expect(semantic.medalha.bronze.fundo).not.toBe(semantic.formato.teams.suave);
      expect(semantic.medalha.bronze.fundo).not.toBe(semantic.formato.teams.borda);
    });

    it("texto branco nos botões de ação e de perigo", () => {
      expect(contraste(branco, semantic.acao.primaria)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      expect(contraste(branco, semantic.acao.primariaHover)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      expect(contraste(branco, semantic.acao.perigo)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
    });

    it("texto principal e secundário nas superfícies", () => {
      const { principal, secundario } = semantic.texto;
      const { fundo, fundoAlternativo, pagina } = semantic.superficie;
      [fundo, fundoAlternativo, pagina].forEach((superficie) => {
        expect(contraste(principal, superficie)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
        expect(contraste(secundario, superficie)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      });
    });
  });
});
