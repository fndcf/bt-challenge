/**
 * Testes do hook useLoading
 */

import { renderHook, act } from "@testing-library/react";
import { useLoading } from "@/hooks/useLoading";

describe("useLoading", () => {
  it("deve iniciar com loading false por padrão", () => {
    const { result } = renderHook(() => useLoading());
    expect(result.current.loading).toBe(false);
  });

  it("deve aceitar valor inicial true", () => {
    const { result } = renderHook(() => useLoading(true));
    expect(result.current.loading).toBe(true);
  });

  it("deve aceitar valor inicial false", () => {
    const { result } = renderHook(() => useLoading(false));
    expect(result.current.loading).toBe(false);
  });

  it("deve iniciar loading com startLoading", () => {
    const { result } = renderHook(() => useLoading());

    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.startLoading();
    });

    expect(result.current.loading).toBe(true);
  });

  it("deve parar loading com stopLoading", () => {
    const { result } = renderHook(() => useLoading(true));

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.stopLoading();
    });

    expect(result.current.loading).toBe(false);
  });

  it("deve permitir setar loading diretamente com setLoading", () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });
    expect(result.current.loading).toBe(false);
  });

  it("deve manter referência estável das funções", () => {
    const { result, rerender } = renderHook(() => useLoading());

    const { startLoading, stopLoading, setLoading } = result.current;

    rerender();

    expect(result.current.startLoading).toBe(startLoading);
    expect(result.current.stopLoading).toBe(stopLoading);
    expect(result.current.setLoading).toBe(setLoading);
  });

  it("deve funcionar com múltiplas chamadas", () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading();
    });
    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.startLoading();
    });
    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.stopLoading();
    });
    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.stopLoading();
    });
    expect(result.current.loading).toBe(false);
  });
});
