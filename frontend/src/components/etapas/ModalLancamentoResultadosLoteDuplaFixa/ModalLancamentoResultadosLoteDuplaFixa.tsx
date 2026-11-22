import React from "react";
import {
  CampoPlacar,
  ListaPlacares,
  ModalResultadosLote,
} from "@/components/torneio";
import { Partida } from "@/types/chave";
import { getPartidaService } from "@/services";
import { useResultadosLote } from "@/hooks/useResultadosLote";
import { getSituacaoPartida } from "@/utils/resultadosLote";

interface ModalLancamentoResultadosLoteDuplaFixaProps {
  partidas: Partida[];
  grupoNome: string;
  etapaFinalizada?: boolean;
  melhorDe3?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============== COMPONENTE ==============

export const ModalLancamentoResultadosLoteDuplaFixa: React.FC<
  ModalLancamentoResultadosLoteDuplaFixaProps
> = ({ partidas, grupoNome, etapaFinalizada = false, melhorDe3 = false, onClose, onSuccess }) => {
  const partidaService = getPartidaService();
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
    enviar: (lote) => partidaService.registrarResultadosEmLote(lote),
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
            lado1={{ nome: partida.dupla1Nome }}
            lado2={{ nome: partida.dupla2Nome }}
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

export default ModalLancamentoResultadosLoteDuplaFixa;
