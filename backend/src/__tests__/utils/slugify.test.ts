/**
 * Testes do slugify
 */

import { slugify, generateUniqueSlug } from "../../utils/slugify";

describe("slugify", () => {
  describe("slugify", () => {
    it("deve converter para lowercase", () => {
      expect(slugify("ARENA BEACH")).toBe("arena-beach");
    });

    it("deve remover acentos", () => {
      expect(slugify("Arena São Paulo")).toBe("arena-sao-paulo");
      expect(slugify("Praça da Sé")).toBe("praca-da-se");
      expect(slugify("Coração")).toBe("coracao");
    });

    it("deve substituir espaços por hífens", () => {
      expect(slugify("Arena Beach Tennis")).toBe("arena-beach-tennis");
    });

    it("deve remover caracteres especiais", () => {
      expect(slugify("Arena @Beach #Tennis!")).toBe("arena-beach-tennis");
      expect(slugify("Arena (Test) [2024]")).toBe("arena-test-2024");
    });

    it("deve remover hífens múltiplos", () => {
      expect(slugify("Arena---Beach")).toBe("arena-beach");
      expect(slugify("Arena - - Beach")).toBe("arena-beach");
    });

    it("deve remover hífens do início e fim", () => {
      expect(slugify("-Arena Beach-")).toBe("arena-beach");
      expect(slugify("---teste---")).toBe("teste");
    });

    it("deve substituir underscores por hífens", () => {
      expect(slugify("arena_beach_tennis")).toBe("arena-beach-tennis");
    });

    it("deve tratar strings vazias", () => {
      expect(slugify("")).toBe("");
      expect(slugify("   ")).toBe("");
    });

    it("deve tratar apenas caracteres especiais", () => {
      expect(slugify("@#$%^&*")).toBe("");
    });
  });

  describe("generateUniqueSlug", () => {
    it("deve retornar slug original se não existir", async () => {
      const checkExists = jest.fn().mockResolvedValue(false);

      const slug = await generateUniqueSlug("Arena Beach", checkExists);

      expect(slug).toBe("arena-beach");
      expect(checkExists).toHaveBeenCalledWith("arena-beach");
      expect(checkExists).toHaveBeenCalledTimes(1);
    });

    it("deve adicionar número se slug já existir", async () => {
      const checkExists = jest
        .fn()
        .mockResolvedValueOnce(true) // arena-beach existe
        .mockResolvedValueOnce(false); // arena-beach-2 não existe

      const slug = await generateUniqueSlug("Arena Beach", checkExists);

      expect(slug).toBe("arena-beach-2");
      expect(checkExists).toHaveBeenCalledTimes(2);
    });

    it("deve incrementar número até encontrar slug único", async () => {
      const checkExists = jest
        .fn()
        .mockResolvedValueOnce(true) // arena-beach existe
        .mockResolvedValueOnce(true) // arena-beach-2 existe
        .mockResolvedValueOnce(true) // arena-beach-3 existe
        .mockResolvedValueOnce(false); // arena-beach-4 não existe

      const slug = await generateUniqueSlug("Arena Beach", checkExists);

      expect(slug).toBe("arena-beach-4");
      expect(checkExists).toHaveBeenCalledTimes(4);
    });
  });
});
