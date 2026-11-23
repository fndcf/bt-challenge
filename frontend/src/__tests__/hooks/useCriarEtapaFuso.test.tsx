/**
 * "Hoje" na criação de etapa usa o fuso de quem está na tela
 *
 * 22h em São Paulo (23/11) já é 01h do dia 24 em UTC. Antes, a data de hoje
 * era recusada como "anterior a hoje" das 21h à meia-noite.
 */

import { renderHook, act } from "@testing-library/react";
import { useCriarEtapa } from "@/pages/CriarEtapa/hooks/useCriarEtapa";

jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

jest.mock("@/services", () => ({
  getEtapaService: () => ({ criar: jest.fn() }),
}));

// O fuso de São Paulo vem do jest.fuso.js (globalSetup), para todos os testes
beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-11-24T01:00:00Z") }); // 22h do dia 23 em SP
});

afterEach(() => {
  jest.useRealTimers();
});

it("roda no fuso de São Paulo (senão este arquivo não testa nada)", () => {
  expect(new Date("2026-11-24T01:00:00Z").getDate()).toBe(23);
});

const preencherDatas = (fim: string, realizacao: string) => {
  const { result } = renderHook(() => useCriarEtapa());
  act(() => {
    result.current.handleChange("dataInicio", "2026-11-20");
    result.current.handleChange("dataFim", fim);
    result.current.handleChange("dataRealizacao", realizacao);
  });
  return result;
};

describe("useCriarEtapa - fuso horário", () => {
  it("aceita encerrar as inscrições hoje às 22h no Brasil", () => {
    const result = preencherDatas("2026-11-23", "2026-11-25");

    expect(result.current.errosDatas).toEqual({});
  });

  it("continua recusando data de ontem", () => {
    const result = preencherDatas("2026-11-22", "2026-11-25");

    expect(result.current.errosDatas.dataFim).toBe(
      "Data fim das inscrições não pode ser anterior a hoje"
    );
  });
});
