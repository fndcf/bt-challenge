/**
 * Testes do hook useClipboard
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useClipboard } from "@/hooks/useClipboard";

// Mock do logger
jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("useClipboard", () => {
  const mockWriteText = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Mock do clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("deve iniciar com copied false", () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.copied).toBe(false);
  });

  it("deve copiar texto com sucesso", async () => {
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());

    let copyResult: boolean;
    await act(async () => {
      copyResult = await result.current.copy("texto para copiar");
    });

    expect(copyResult!).toBe(true);
    expect(result.current.copied).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith("texto para copiar");
  });

  it("deve resetar copied para false após 2 segundos", async () => {
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy("texto");
    });

    expect(result.current.copied).toBe(true);

    // Avançar 2 segundos
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("deve retornar false quando falhar ao copiar", async () => {
    mockWriteText.mockRejectedValue(new Error("Erro ao copiar"));

    const { result } = renderHook(() => useClipboard());

    let copyResult: boolean;
    await act(async () => {
      copyResult = await result.current.copy("texto");
    });

    expect(copyResult!).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it("deve funcionar com texto vazio", async () => {
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy("");
    });

    expect(mockWriteText).toHaveBeenCalledWith("");
    expect(result.current.copied).toBe(true);
  });

  it("deve funcionar com texto longo", async () => {
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());

    const longText = "a".repeat(10000);
    await act(async () => {
      await result.current.copy(longText);
    });

    expect(mockWriteText).toHaveBeenCalledWith(longText);
    expect(result.current.copied).toBe(true);
  });

  it("deve permitir múltiplas cópias", async () => {
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy("texto1");
    });

    expect(result.current.copied).toBe(true);

    // Avançar um pouco mas não o suficiente para resetar
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      await result.current.copy("texto2");
    });

    expect(result.current.copied).toBe(true);
    expect(mockWriteText).toHaveBeenCalledTimes(2);
  });
});
