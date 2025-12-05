/**
 * Responsabilidade única: Card com histórico de participações do jogador
 */

import React from "react";
import * as S from "../JogadorPerfil.styles";

export interface HistoricoCardProps {
  historico: any[];
  slug: string;
}

export const HistoricoCard: React.FC<HistoricoCardProps> = ({
  historico,
  slug,
}) => {
  return (
    <S.Card>
      <S.CardTitle>Histórico de Participações</S.CardTitle>
      {historico.length === 0 ? (
        <S.EmptyState>
          <S.EmptyText>Nenhuma participação registrada ainda.</S.EmptyText>
        </S.EmptyState>
      ) : (
        <S.HistoricoList>
          {historico.map((item) => (
            <S.HistoricoItem
              key={item.id}
              to={`/arena/${slug}/etapa/${item.etapaId}`}
            >
              <S.HistoricoHeader>
                <S.EtapaNome>{item.etapaNome || "Etapa"}</S.EtapaNome>
                <span style={{ fontSize: "1.25rem" }}>→</span>
              </S.HistoricoHeader>
              <S.HistoricoDetalhes>
                {/* Mostrar vitórias/derrotas DESTA etapa */}
                {item.vitorias !== undefined && (
                  <div>Vitórias: {item.vitorias}</div>
                )}
                {item.derrotas !== undefined && (
                  <div>Derrotas: {item.derrotas}</div>
                )}
                {item.pontos !== undefined && <div>Pontos: {item.pontos}</div>}
              </S.HistoricoDetalhes>
            </S.HistoricoItem>
          ))}
        </S.HistoricoList>
      )}
    </S.Card>
  );
};

export default HistoricoCard;
