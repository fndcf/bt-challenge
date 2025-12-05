/**
 * Testes do hook useDebounce
 */

import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("deve retornar o valor inicial imediatamente", () => {
    const { result } = renderHook(() => useDebounce("inicial", 500));
    expect(result.current).toBe("inicial");
  });

  it("deve retornar o valor atualizado após o delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "inicial", delay: 500 } }
    );

    expect(result.current).toBe("inicial");

    rerender({ value: "atualizado", delay: 500 });

    // Ainda deve ser o valor inicial
    expect(result.current).toBe("inicial");

    // Avançar o tempo
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("atualizado");
  });

  it("deve cancelar o timeout anterior quando o valor muda rapidamente", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "inicial", delay: 500 } }
    );

    // Mudar rapidamente
    rerender({ value: "valor1", delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: "valor2", delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: "valor3", delay: 500 });

    // Ainda deve ser o valor inicial
    expect(result.current).toBe("inicial");

    // Avançar o tempo completo
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Deve ser o último valor
    expect(result.current).toBe("valor3");
  });

  it("deve usar delay padrão de 500ms", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "inicial" } }
    );

    rerender({ value: "atualizado" });

    // Avançar 499ms - ainda não deveria ter atualizado
    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe("inicial");

    // Avançar mais 1ms (total 500ms)
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("atualizado");
  });

  it("deve funcionar com diferentes tipos de dados", () => {
    // Objeto
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: { name: "teste" }, delay: 100 } }
    );

    const newObj = { name: "novo" };
    objRerender({ value: newObj, delay: 100 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(objResult.current).toEqual(newObj);

    // Número
    const { result: numResult, rerender: numRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 100 } }
    );

    numRerender({ value: 42, delay: 100 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(numResult.current).toBe(42);
  });

  it("deve atualizar imediatamente se o delay for 0", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "inicial", delay: 0 } }
    );

    rerender({ value: "atualizado", delay: 0 });

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe("atualizado");
  });
});
