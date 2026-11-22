/**
 * Responsabilidade: Modal para lançamento em lote de resultados do Super X
 * Permite preencher múltiplos resultados de uma vez e salvar apenas os preenchidos
 */

import React from "react";
import styled from "styled-components";
import { Badge } from "@/components/ui";
import {
  CampoPlacar,
  ListaPlacares,
  ModalResultadosLote,
} from "@/components/torneio";
import { theme } from "@/styles/theme";
import { FormatoEtapa } from "@/types/etapa";
import { PartidaReiDaPraia } from "@/types/reiDaPraia";
import { getSuperXService } from "@/services";
import { useResultadosLote } from "@/hooks/useResultadosLote";
import { getSituacaoPartida } from "@/utils/resultadosLote";

interface ModalLancamentoResultadosLoteSuperXProps {
  partidas: PartidaReiDaPraia[];
  etapaFinalizada?: boolean;
  melhorDe3?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============== STYLED COMPONENTS ==============

const RodadaSection = styled.section`
  & + & {
    margin-top: ${theme.spacing[6]};
  }
`;

const RodadaHeader = styled.h4`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  margin: 0 0 ${theme.spacing[3]} 0;
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.semantic.texto.principal};
`;

// ============== HELPERS ==============

const agruparPorRodada = (
  partidas: PartidaReiDaPraia[]
): Map<number, PartidaReiDaPraia[]> => {
  const mapa = new Map<number, PartidaReiDaPraia[]>();

  partidas.forEach((partida) => {
    const rodada = partida.rodada || 1;
    if (!mapa.has(rodada)) {
      mapa.set(rodada, []);
    }
    mapa.get(rodada)!.push(partida);
  });

  return mapa;
};

// ============== COMPONENTE ==============

export const ModalLancamentoResultadosLoteSuperX: React.FC<
  ModalLancamentoResultadosLoteSuperXProps
> = ({ partidas, etapaFinalizada = false, melhorDe3 = false, onClose, onSuccess }) => {
  const superXService = getSuperXService();
  const {
    resultados,
    erros,
    erroGlobal,
    loading,
    seraoSalvas,
    alterarPlacar,
    handleSubmit,
  } = useResultadosLote({
    partidas,
    melhorDe3,
    onSuccess,
    enviar: async (lote) => {
      const etapaId = partidas[0]?.etapaId;
      if (!etapaId) {
        throw new Error("Etapa não encontrada");
      }
      return superXService.registrarResultadosEmLote(etapaId, lote);
    },
  });

  const totalPartidas = partidas.length;
  const partidasFinalizadas = partidas.filter((p) => p.status === "finalizada")
    .length;

  const partidasPorRodada = agruparPorRodada(partidas);
  const rodadasOrdenadas = Array.from(partidasPorRodada.keys()).sort(
    (a, b) => a - b
  );

  return (
    <ModalResultadosLote
      contexto="Super X"
      totalPartidas={totalPartidas}
      jaFinalizadas={partidasFinalizadas}
      seraoSalvas={seraoSalvas}
      erroGlobal={erroGlobal}
      loading={loading}
      etapaFinalizada={etapaFinalizada}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      {rodadasOrdenadas.map((rodada) => {
        const partidasDaRodada = partidasPorRodada.get(rodada) || [];

        return (
          <RodadaSection key={rodada}>
            <RodadaHeader>
              <span>Rodada {rodada}</span>
              <Badge formato={FormatoEtapa.SUPER_X}>
                {partidasDaRodada.length === 1
                  ? "1 partida"
                  : `${partidasDaRodada.length} partidas`}
              </Badge>
            </RodadaHeader>

            <ListaPlacares>
              {partidasDaRodada.map((partida) => (
                <CampoPlacar
                  key={partida.id}
                  situacao={getSituacaoPartida(partida.status)}
                  lado1={{
                    nome: `${partida.jogador1ANome} & ${partida.jogador1BNome}`,
                  }}
                  lado2={{
                    nome: `${partida.jogador2ANome} & ${partida.jogador2BNome}`,
                  }}
                  placar={resultados.get(partida.id)}
                  melhorDe3={melhorDe3}
                  onChange={(...args) => alterarPlacar(partida.id, ...args)}
                  disabled={loading}
                  erro={erros.get(partida.id)}
                />
              ))}
            </ListaPlacares>
          </RodadaSection>
        );
      })}
    </ModalResultadosLote>
  );
};

export default ModalLancamentoResultadosLoteSuperX;
