/**
 * Testes do hook useDocumentTitle
 */

import { renderHook } from "@testing-library/react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

describe("useDocumentTitle", () => {
  const originalTitle = document.title;

  beforeEach(() => {
    document.title = "Título Original";
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  it("deve atualizar o título do documento", () => {
    renderHook(() => useDocumentTitle("Nova Página"));

    expect(document.title).toBe("Nova Página | Challenge BT");
  });

  it("deve restaurar o título original ao desmontar", () => {
    const { unmount } = renderHook(() => useDocumentTitle("Nova Página"));

    expect(document.title).toBe("Nova Página | Challenge BT");

    unmount();

    expect(document.title).toBe("Título Original");
  });

  it("deve atualizar o título quando o valor mudar", () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: "Página 1" },
    });

    expect(document.title).toBe("Página 1 | Challenge BT");

    rerender({ title: "Página 2" });

    expect(document.title).toBe("Página 2 | Challenge BT");
  });

  it("deve funcionar com títulos contendo caracteres especiais", () => {
    renderHook(() => useDocumentTitle("Página de Ação & Aventura"));

    expect(document.title).toBe("Página de Ação & Aventura | Challenge BT");
  });

  it("deve funcionar com título vazio", () => {
    renderHook(() => useDocumentTitle(""));

    expect(document.title).toBe("| Challenge BT");
  });
});
