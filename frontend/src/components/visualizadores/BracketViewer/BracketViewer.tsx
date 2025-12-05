import React from "react";
import styled from "styled-components";

// ============== TYPES ==============

interface Jogador {
  id: string;
  nome: string;
  seed?: number;
}

interface Partida {
  id: string;
  numero: number;
  jogador1: Jogador;
  jogador2: Jogador | null;
  placar?: string | null;
  placarDetalhado?: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
  }>;
  vencedor?: "jogador1" | "jogador2" | null;
  status: "agendada" | "em_andamento" | "finalizada" | "bye";
}

interface Rodada {
  numero: number;
  nome: string;
  partidas: Partida[];
}

interface ChavesData {
  formato: string;
  temChaves: boolean;
  rodadas: Rodada[];
}

interface BracketViewerProps {
  chaves: ChavesData;
}

// ============== STYLED COMPONENTS ==============

const Wrapper = styled.section`
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 24px;

  @media (min-width: 768px) {
    padding: 24px;
  }
`;

const Header = styled.div`
  margin-bottom: 16px;

  @media (min-width: 768px) {
    margin-bottom: 24px;
  }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;

  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;

  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

const ScrollContainer = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  margin: 0 -16px;
  padding: 16px 16px 8px;

  /* Smooth scrolling */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  @media (min-width: 768px) {
    margin: 0;
    padding: 0 0 8px 0;
  }
`;

const BracketGrid = styled.div`
  display: flex;
  gap: 24px;
  min-width: fit-content;

  @media (min-width: 768px) {
    gap: 32px;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 260px;

  @media (min-width: 768px) {
    min-width: 300px;
  }
`;

const ColumnTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;

  @media (min-width: 768px) {
    font-size: 13px;
  }
`;

const Match = styled.div<{ $offset?: boolean }>`
  background: #fafafa;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
  margin-top: ${(props) => (props.$offset ? "48px" : "0")};

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  @media (min-width: 768px) {
    margin-top: ${(props) => (props.$offset ? "64px" : "0")};
  }
`;

const Team = styled.div<{
  $winner?: boolean;
  $active?: boolean;
  $bye?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: ${(props) => {
    if (props.$bye) return "#fef3c7";
    if (props.$winner) return "#f0fdf4";
    return "white";
  }};
  border-bottom: 1px solid #e5e7eb;
  min-height: 44px;
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }

  ${(props) =>
    props.$bye &&
    `
    justify-content: center;
    font-weight: 600;
    color: #92400e;
  `}

  ${(props) =>
    props.$winner &&
    `
    border-left: 3px solid #22c55e;
    font-weight: 600;
  `}

  ${(props) =>
    !props.$active &&
    !props.$bye &&
    `
    opacity: 0.5;
  `}

  @media (min-width: 768px) {
    padding: 14px 16px;
    min-height: 48px;
  }
`;

const TeamName = styled.span`
  font-size: 13px;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;

  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

const Score = styled.span<{ $winner?: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${(props) => (props.$winner ? "#22c55e" : "#9ca3af")};
  margin-left: 12px;

  @media (min-width: 768px) {
    font-size: 18px;
  }
`;

const MatchStatus = styled.div<{ $status: string }>`
  padding: 6px 12px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${(props) => {
    switch (props.$status) {
      case "finalizada":
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case "em_andamento":
        return `
          background: #dbeafe;
          color: #1e40af;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #6b7280;
        `;
    }
  }}

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 8px 16px;
  }
`;

const EmptyBox = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;

  @media (min-width: 768px) {
    padding: 64px 32px;
  }
`;

const EmptyText = styled.p`
  font-size: 14px;
  margin: 0 0 4px 0;
  color: #6b7280;

  @media (min-width: 768px) {
    font-size: 15px;
  }
`;

const EmptyHint = styled.p`
  font-size: 13px;
  margin: 0;
  color: #9ca3af;

  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

// ============== COMPONENT ==============

const BracketViewer: React.FC<BracketViewerProps> = ({ chaves }) => {
  if (!chaves?.temChaves || !chaves.rodadas?.length) {
    return (
      <Wrapper>
        <Header>
          <Title>Chaveamento</Title>
        </Header>
        <EmptyBox>
          <EmptyText>Chaves ainda não geradas</EmptyText>
          <EmptyHint>Aguarde a conclusão da fase de grupos</EmptyHint>
        </EmptyBox>
      </Wrapper>
    );
  }

  // Ordenar: Final → Semifinal → Quartas → Oitavas
  const sortedRounds = [...chaves.rodadas].sort((a, b) => b.numero - a.numero);

  return (
    <Wrapper>
      <Header>
        <Title>Chaveamento Eliminatório</Title>
        <Subtitle>
          <span>Deslize para ver todas as fases</span>
        </Subtitle>
      </Header>

      <ScrollContainer>
        <BracketGrid>
          {sortedRounds.map((round, roundIdx) => (
            <Column key={`round-${round.numero}-${roundIdx}`}>
              <ColumnTitle>{round.nome}</ColumnTitle>

              {round.partidas.map((match, matchIdx) => {
                const isBye = match.status === "bye" || !match.jogador2;
                const finished = match.status === "finalizada";
                const winner1 = match.vencedor === "jogador1";
                const winner2 = match.vencedor === "jogador2";

                if (isBye) {
                  return (
                    <Match key={match.id} $offset={matchIdx % 2 === 1}>
                      <Team $bye>{match.jogador1.nome} (BYE)</Team>
                    </Match>
                  );
                }

                return (
                  <Match key={match.id} $offset={matchIdx % 2 === 1}>
                    <Team $winner={winner1} $active={!finished || winner1}>
                      <TeamName>{match.jogador1.nome}</TeamName>
                      {finished &&
                        match.placarDetalhado &&
                        match.placarDetalhado.length > 0 && (
                          <Score $winner={winner1}>
                            {match.placarDetalhado[0].gamesDupla1}
                          </Score>
                        )}
                    </Team>

                    <Team $winner={winner2} $active={!finished || winner2}>
                      <TeamName>{match.jogador2!.nome}</TeamName>
                      {finished &&
                        match.placarDetalhado &&
                        match.placarDetalhado.length > 0 && (
                          <Score $winner={winner2}>
                            {match.placarDetalhado[0].gamesDupla2}
                          </Score>
                        )}
                    </Team>

                    {!finished && (
                      <MatchStatus $status={match.status}>
                        {match.status === "em_andamento"
                          ? "Ao vivo"
                          : "Aguardando"}
                      </MatchStatus>
                    )}
                  </Match>
                );
              })}
            </Column>
          ))}
        </BracketGrid>
      </ScrollContainer>
    </Wrapper>
  );
};

export default BracketViewer;
