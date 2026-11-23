/**
 * Busca de jogadores: resposta velha não sobrescreve a nova
 *
 * A lista inicial (sem filtro) demora; a busca responde antes. Antes da
 * correção, a lista inicial chegava por último e a busca era ignorada.
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { useListagemJogadores } from "@/pages/Jogadores/hooks/useListagemJogadores";

jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const mockListar = jest.fn();

// Mesmo objeto em todo render (como o contexto real)
const mockContextoArena = { arena: { id: "arena-1", nome: "Arena", slug: "arena" } };
jest.mock("@/contexts/ArenaContext", () => ({
  useArena: () => mockContextoArena,
}));

jest.mock("@/services", () => ({
  getJogadorService: () => ({ listar: mockListar, deletar: jest.fn() }),
}));

const jogador = (nome: string) => ({ id: nome, nome });
const resposta = (nomes: string[]) => ({
  jogadores: nomes.map(jogador),
  total: nomes.length,
  temMais: false,
});

describe("useListagemJogadores - respostas fora de ordem", () => {
  it("mantém o resultado da busca quando a lista inicial chega depois", async () => {
    let entregarInicial: (valor: ReturnType<typeof resposta>) => void = () => {};
    mockListar.mockImplementation(({ busca }: { busca?: string }) =>
      busca
        ? Promise.resolve(resposta(["Ana Paula"]))
        : new Promise((resolver) => (entregarInicial = resolver))
    );

    const { result } = renderHook(() => useListagemJogadores());
    act(() => result.current.setBusca("Ana"));
    await waitFor(() => expect(result.current.jogadores).toHaveLength(1));

    // A lista sem filtro chega por último
    await act(async () => entregarInicial(resposta(["Ana Paula", "Bruno Lima", "Caio"])));

    expect(result.current.jogadores.map((j) => j.nome)).toEqual(["Ana Paula"]);
    expect(result.current.loading).toBe(false);
  });
});
