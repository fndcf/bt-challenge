/**
 * Testes do hook useEtapaUI
 */

import { renderHook, act } from "@testing-library/react";
import { useEtapaUI } from "@/hooks/useEtapaUI";

describe("useEtapaUI", () => {
  describe("estado inicial", () => {
    it("deve iniciar com abaAtiva como 'inscricoes'", () => {
      const { result } = renderHook(() => useEtapaUI());
      expect(result.current.abaAtiva).toBe("inscricoes");
    });

    it("deve iniciar com modalInscricaoAberto como false", () => {
      const { result } = renderHook(() => useEtapaUI());
      expect(result.current.modalInscricaoAberto).toBe(false);
    });

    it("deve iniciar com modalConfirmacaoAberto como false", () => {
      const { result } = renderHook(() => useEtapaUI());
      expect(result.current.modalConfirmacaoAberto).toBe(false);
    });
  });

  describe("setAbaAtiva", () => {
    it("deve mudar para aba 'chaves'", () => {
      const { result } = renderHook(() => useEtapaUI());

      act(() => {
        result.current.setAbaAtiva("chaves");
      });

      expect(result.current.abaAtiva).toBe("chaves");
    });

    it("deve mudar para aba 'cabeças'", () => {
      const { result } = renderHook(() => useEtapaUI());

      act(() => {
        result.current.setAbaAtiva("cabeças");
      });

      expect(result.current.abaAtiva).toBe("cabeças");
    });

    it("deve voltar para aba 'inscricoes'", () => {
      const { result } = renderHook(() => useEtapaUI());

      act(() => {
        result.current.setAbaAtiva("chaves");
      });

      act(() => {
        result.current.setAbaAtiva("inscricoes");
      });

      expect(result.current.abaAtiva).toBe("inscricoes");
    });
  });

  describe("setModalInscricaoAberto", () => {
    it("deve abrir modal de inscrição", () => {
      const { result } = renderHook(() => useEtapaUI());

      act(() => {
        result.current.setModalInscricaoAberto(true);
      });

      expect(result.current.modalInscricaoAberto).toBe(true);
    });

    it("deve fechar modal de inscrição", () => {
      const { result } = renderHook(() => useEtapaUI());

      act(() => {
        result.current.setModalInscricaoAberto(true);
      });

      act(() => {
        result.current.setModalInscricaoAberto(false);
      });

      expect(result.current.modalInscricaoAberto).toBe(false);
    });
  });

  describe("setModalConfirmacaoAberto", () => {
    it("deve abrir modal de confirmação", () => {
      const { result } = renderHook(() => useEtapaUI());

      act(() => {
        result.current.setModalConfirmacaoAberto(true);
      });

      expect(result.current.modalConfirmacaoAberto).toBe(true);
    });

    it("deve fechar modal de confirmação", () => {
      const { result } = renderHook(() => useEtapaUI());

      act(() => {
        result.current.setModalConfirmacaoAberto(true);
      });

      act(() => {
        result.current.setModalConfirmacaoAberto(false);
      });

      expect(result.current.modalConfirmacaoAberto).toBe(false);
    });
  });

  describe("estados independentes", () => {
    it("deve manter estados independentes", () => {
      const { result } = renderHook(() => useEtapaUI());

      act(() => {
        result.current.setAbaAtiva("chaves");
        result.current.setModalInscricaoAberto(true);
        result.current.setModalConfirmacaoAberto(true);
      });

      expect(result.current.abaAtiva).toBe("chaves");
      expect(result.current.modalInscricaoAberto).toBe(true);
      expect(result.current.modalConfirmacaoAberto).toBe(true);

      // Mudar um não afeta os outros
      act(() => {
        result.current.setAbaAtiva("inscricoes");
      });

      expect(result.current.abaAtiva).toBe("inscricoes");
      expect(result.current.modalInscricaoAberto).toBe(true);
      expect(result.current.modalConfirmacaoAberto).toBe(true);
    });
  });
});
