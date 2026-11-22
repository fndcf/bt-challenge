/**
 * Área acima do teclado do celular
 */

import { act, renderHook } from "@testing-library/react";
import { useAreaVisivel } from "@/hooks/useAreaVisivel";

const ALTURA_TELA = 700;

const criarViewport = () =>
  Object.assign(new EventTarget(), {
    height: ALTURA_TELA,
    offsetTop: 0,
    scale: 1,
  });

describe("useAreaVisivel", () => {
  let viewport: ReturnType<typeof criarViewport>;

  beforeEach(() => {
    viewport = criarViewport();
    Object.defineProperty(window, "visualViewport", {
      value: viewport,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
      value: ALTURA_TELA,
      configurable: true,
    });
  });

  const mudar = (dados: Partial<typeof viewport>) =>
    act(() => {
      Object.assign(viewport, dados);
      viewport.dispatchEvent(new Event("resize"));
    });

  it("fica acima do teclado e volta quando ele fecha", () => {
    const { result } = renderHook(() => useAreaVisivel(true));
    expect(result.current).toBeNull();

    mudar({ height: 400, offsetTop: 50 });
    expect(result.current).toEqual({ top: 50, bottom: 250 });

    mudar({ height: ALTURA_TELA, offsetTop: 0 });
    expect(result.current).toBeNull();
  });

  it("ignora a barra do navegador e o zoom com os dedos", () => {
    const { result } = renderHook(() => useAreaVisivel(true));

    mudar({ height: 620 });
    expect(result.current).toBeNull();

    mudar({ height: 350, scale: 2 });
    expect(result.current).toBeNull();
  });

  it("não faz nada com o modal fechado", () => {
    const { result } = renderHook(() => useAreaVisivel(false));
    mudar({ height: 400 });
    expect(result.current).toBeNull();
  });
});
