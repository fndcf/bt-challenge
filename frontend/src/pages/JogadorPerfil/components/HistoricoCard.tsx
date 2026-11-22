/**
 * Responsabilidade única: Card com histórico de participações do jogador
 */

import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Games } from "./Games";
import { SecaoPublica } from "@/components/torneio";
import { EmptyState } from "@/components/ui";
import { theme } from "@/styles/theme";

export interface HistoricoCardProps {
  historico: any[];
  slug: string;
}

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Lista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
`;

const Item = styled(Link)`
  display: block;
  padding: ${theme.spacing[4]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.md};
  text-decoration: none;

  &:hover {
    border-color: ${acao.primaria};
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }
`;

const Etapa = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${theme.spacing[3]};
  margin-bottom: ${theme.spacing[2]};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

const Detalhes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[1]} ${theme.spacing[4]};
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

export const HistoricoCard: React.FC<HistoricoCardProps> = ({
  historico,
  slug,
}) => (
  <SecaoPublica titulo="Histórico de Participações">
    {historico.length === 0 ? (
      <EmptyState titulo="Nenhuma participação registrada ainda." />
    ) : (
      <Lista>
        {historico.map((item) => (
          <Item key={item.id} to={`/arena/${slug}/etapa/${item.etapaId}`}>
            <Etapa>
              <span>{item.etapaNome || "Etapa"}</span>
              <span aria-hidden="true">→</span>
            </Etapa>
            <Detalhes>
              {item.vitorias !== undefined && (
                <span>Vitórias: {item.vitorias}</span>
              )}
              {item.derrotas !== undefined && (
                <span>Derrotas: {item.derrotas}</span>
              )}
              {(item.gamesVencidos !== undefined ||
                item.gamesPerdidos !== undefined) && (
                <span>
                  Games:{" "}
                  <Games
                    vencidos={item.gamesVencidos ?? 0}
                    perdidos={item.gamesPerdidos ?? 0}
                  />
                </span>
              )}
              {item.pontos !== undefined && <span>Pontos: {item.pontos}</span>}
            </Detalhes>
          </Item>
        ))}
      </Lista>
    )}
  </SecaoPublica>
);

export default HistoricoCard;
