/**
 * Trava contra loop de requisições: cada tela busca os dados uma vez por etapa,
 * mesmo quando o serviço é recriado a cada chamada.
 */

import { act, render, renderHook } from "@testing-library/react";
import { ChavesEtapa } from "@/components/etapas/ChavesEtapa";
import { ChavesReiDaPraia } from "@/components/etapas/ChavesReiDaPraia";
import { ChavesSuperX } from "@/components/etapas/ChavesSuperX";
import { useFaseEliminatoria } from "@/components/etapas/FaseEliminatoria/hooks/useFaseEliminatoria";
import { useFaseEliminatoriaReiDaPraia } from "@/components/etapas/FaseEliminatoriaReiDaPraia/hooks/useFaseEliminatoriaReiDaPraia";
import { PainelEmpatesPendentes } from "@/components/etapas/PainelEmpatesPendentes";
import { ModalSubstituirJogador } from "@/components/modals/ModalSubstituirJogador";

const mockGrupos = jest.fn();
const mockConfrontos = jest.fn();
const mockEtapa = jest.fn();
const mockEmpates = jest.fn();
const mockDisponiveis = jest.fn();

// Objetos novos a cada chamada, de propósito
jest.mock("@/services", () => {
  const formato = () => ({
    buscarGrupos: mockGrupos,
    buscarGrupo: mockGrupos,
    buscarDuplas: async () => [],
    buscarJogadores: async () => [],
    buscarPartidas: async () => [],
    buscarConfrontosEliminatorios: mockConfrontos,
  });
  return {
    getChaveService: formato,
    getReiDaPraiaService: formato,
    getSuperXService: formato,
    getEtapaService: () => ({
      buscarPorId: mockEtapa,
      listarEmpatesPendentes: mockEmpates,
      buscarJogadoresDisponiveis: mockDisponiveis,
    }),
  };
});

const esperar = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

const nada = () => {};

beforeEach(() => {
  jest.clearAllMocks();
  mockGrupos.mockImplementation(async () => []);
  mockConfrontos.mockImplementation(async () => []);
  mockEtapa.mockImplementation(async () => ({ status: "chaves_geradas" }));
  mockEmpates.mockImplementation(async () => []);
  mockDisponiveis.mockImplementation(async () => []);
});

it.each([
  ["ChavesEtapa", (id: string) => <ChavesEtapa etapaId={id} />],
  ["ChavesReiDaPraia", (id: string) => <ChavesReiDaPraia etapaId={id} />],
  ["ChavesSuperX", (id: string) => <ChavesSuperX etapaId={id} />],
])("%s carrega uma vez e de novo só ao mudar de etapa", async (_, tela) => {
  const { rerender } = render(tela("e1"));
  await esperar();
  rerender(tela("e1"));
  await esperar();
  expect(mockGrupos).toHaveBeenCalledTimes(1);

  rerender(tela("e2"));
  await esperar();
  expect(mockGrupos).toHaveBeenCalledTimes(2);
  expect(mockGrupos).toHaveBeenLastCalledWith("e2");
});

it.each([
  ["Dupla Fixa", useFaseEliminatoria],
  ["Rei da Praia", useFaseEliminatoriaReiDaPraia],
])("eliminatória (%s) busca status e confrontos uma vez", async (_, usar) => {
  const { rerender } = renderHook(() => usar({ etapaId: "e1", grupos: [] }));
  await esperar();
  rerender();
  await esperar();
  expect(mockConfrontos).toHaveBeenCalledTimes(1);
  expect(mockEtapa).toHaveBeenCalledTimes(1);
});

it("painel de empates busca uma vez por atualização", async () => {
  const tela = (versao: number) => (
    <PainelEmpatesPendentes
      etapaId="e1"
      atualizarEm={versao}
      onResolvido={nada}
      onEmpatesChange={() => {}}
    />
  );
  const { rerender } = render(tela(1));
  await esperar();
  rerender(tela(1));
  await esperar();
  expect(mockEmpates).toHaveBeenCalledTimes(1);

  rerender(tela(2));
  await esperar();
  expect(mockEmpates).toHaveBeenCalledTimes(2);
});

it("substituir jogador busca os disponíveis uma vez", async () => {
  const tela = () => (
    <ModalSubstituirJogador
      isOpen
      onClose={() => {}}
      onSuccess={() => {}}
      etapaId="e1"
      inscricoes={[]}
    />
  );
  const { rerender } = render(tela());
  await esperar();
  rerender(tela());
  await esperar();
  expect(mockDisponiveis).toHaveBeenCalledTimes(1);
});
