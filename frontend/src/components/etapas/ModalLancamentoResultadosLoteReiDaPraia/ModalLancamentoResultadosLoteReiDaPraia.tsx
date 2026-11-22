import React from "react";
import {
  CampoPlacar,
  ListaPlacares,
  ModalResultadosLote,
} from "@/components/torneio";
import { PartidaReiDaPraia } from "@/types/reiDaPraia";
import { getReiDaPraiaService } from "@/services";
import { useResultadosLote } from "@/hooks/useResultadosLote";
import { getSituacaoPartida } from "@/utils/resultadosLote";

interface ModalLancamentoResultadosLoteReiDaPraiaProps {
  partidas: PartidaReiDaPraia[];
  grupoNome: string;
  etapaFinalizada?: boolean;
  melhorDe3?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============== COMPONENTE ==============

export const ModalLancamentoResultadosLoteReiDaPraia: React.FC<
  ModalLancamentoResultadosLoteReiDaPraiaProps
> = ({ partidas, grupoNome, etapaFinalizada = false, melhorDe3 = false, onClose, onSuccess }) => {
  const reiDaPraiaService = getReiDaPraiaService();
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
      return reiDaPraiaService.registrarResultadosEmLote(etapaId, lote);
    },
  });

  const totalPartidas = partidas.length;
  const jaFinalizadas = partidas.filter((p) => p.status === "finalizada").length;

  return (
    <ModalResultadosLote
      contexto={grupoNome}
      totalPartidas={totalPartidas}
      jaFinalizadas={jaFinalizadas}
      seraoSalvas={seraoSalvas}
      erroGlobal={erroGlobal}
      loading={loading}
      etapaFinalizada={etapaFinalizada}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <ListaPlacares>
        {partidas.map((partida, index) => (
          <CampoPlacar
            key={partida.id}
            titulo={`PARTIDA ${index + 1}`}
            situacao={getSituacaoPartida(partida.status)}
            lado1={{ nome: `${partida.jogador1ANome} & ${partida.jogador1BNome}` }}
            lado2={{ nome: `${partida.jogador2ANome} & ${partida.jogador2BNome}` }}
            placar={resultados.get(partida.id)}
            melhorDe3={melhorDe3}
            onChange={(...args) => alterarPlacar(partida.id, ...args)}
            disabled={loading}
            erro={erros.get(partida.id)}
          />
        ))}
      </ListaPlacares>
    </ModalResultadosLote>
  );
};

export default ModalLancamentoResultadosLoteReiDaPraia;
