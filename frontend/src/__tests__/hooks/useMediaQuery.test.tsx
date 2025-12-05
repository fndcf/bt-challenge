/**
 * Testes do hook useMediaQuery
 */

import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

describe("useMediaQuery", () => {
  const mockAddEventListener = jest.fn();
  const mockRemoveEventListener = jest.fn();

  const createMatchMedia = (matches: boolean) => {
    return jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: jest.fn(),
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar false quando media query não corresponde", () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)")
    );

    expect(result.current).toBe(false);
  });

  it("deve retornar true quando media query corresponde", () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)")
    );

    expect(result.current).toBe(true);
  });

  it("deve adicionar event listener para mudanças", () => {
    window.matchMedia = createMatchMedia(false);

    renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("deve remover event listener ao desmontar", () => {
    window.matchMedia = createMatchMedia(false);

    const { unmount } = renderHook(() =>
      useMediaQuery("(min-width: 768px)")
    );

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("deve atualizar quando a media query muda", () => {
    let currentMatches = false;
    let changeListener: (() => void) | null = null;

    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      get matches() {
        return currentMatches;
      },
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: (event: string, listener: () => void) => {
        if (event === "change") {
          changeListener = listener;
        }
      },
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)")
    );

    expect(result.current).toBe(false);

    // Simular mudança na media query
    currentMatches = true;
    act(() => {
      if (changeListener) {
        changeListener();
      }
    });

    expect(result.current).toBe(true);
  });

  it("deve funcionar com diferentes queries", () => {
    window.matchMedia = createMatchMedia(true);

    const { result: result1 } = renderHook(() =>
      useMediaQuery("(min-width: 768px)")
    );
    const { result: result2 } = renderHook(() =>
      useMediaQuery("(prefers-color-scheme: dark)")
    );

    expect(result1.current).toBe(true);
    expect(result2.current).toBe(true);
  });

  it("deve atualizar quando a query muda", () => {
    window.matchMedia = createMatchMedia(true);

    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: "(min-width: 768px)" } }
    );

    expect(result.current).toBe(true);

    // Mudar para uma query diferente
    window.matchMedia = createMatchMedia(false);
    rerender({ query: "(min-width: 1024px)" });

    expect(result.current).toBe(false);
  });
});
