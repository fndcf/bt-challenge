/**
 * GruposViewer - DESIGN MODERNO DO ZERO
 * Layout limpo + Responsividade perfeita
 */

import React from "react";
import styled from "styled-components";

// ============== TYPES ==============

interface Dupla {
  id: string;
  jogador1Nome: string;
  jogador2Nome: string;
  posicaoGrupo: number;
  vitorias: number;
  derrotas: number;
  pontos: number;
  saldoGames: number;
  jogos: number;
  classificada: boolean;
}

interface Partida {
  id: string;
  dupla1Id: string;
  dupla2Id: string;
  dupla1Nome: string;
  dupla2Nome: string;
  status: string;
  setsDupla1: number;
  setsDupla2: number;
  placar?: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
  }>;
  vencedoraId?: string;
  vencedoraNome?: string;
}

interface Grupo {
  id: string;
  nome: string;
  ordem: number;
  totalDuplas: number;
  completo: boolean;
  duplas: Dupla[];
  partidas: Partida[];
}

interface GruposViewerProps {
  grupos: Grupo[];
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
  margin-bottom: 24px;

  @media (min-width: 768px) {
    margin-bottom: 32px;
  }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const GroupsGrid = styled.div`
  display: grid;
  gap: 24px;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }
`;

const GroupCard = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  transition: border-color 0.2s;

  &:hover {
    border-color: #3b82f6;
  }
`;

const GroupHeader = styled.div`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  padding: 12px 16px;
  text-align: center;

  @media (min-width: 768px) {
    padding: 16px 20px;
  }
`;

const GroupName = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 18px;
  }
`;

const GroupContent = styled.div`
  padding: 16px;

  @media (min-width: 768px) {
    padding: 20px;
  }
`;

const SectionTitle = styled.h4`
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px 0;

  @media (min-width: 768px) {
    font-size: 13px;
    margin-bottom: 16px;
  }
`;

// Standings Table
const TableWrapper = styled.div`
  overflow-x: auto;
  margin-bottom: 24px;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }

  @media (min-width: 768px) {
    margin-bottom: 28px;
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
  font-size: 13px;

  @media (min-width: 768px) {
    font-size: 14px;
  }

  @media (min-width: 1024px) {
    min-width: 100%;
    font-size: 13px; /* Menor em desktop com 2 colunas */
  }
`;

const THead = styled.thead`
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
`;

const Th = styled.th`
  padding: 10px 8px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;

  &:first-child {
    padding-left: 12px;
  }

  &:last-child {
    padding-right: 12px;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    padding: 12px 10px;
    font-size: 12px;
  }

  @media (min-width: 1024px) {
    padding: 10px 6px; /* Mais compacto em desktop 2 cols */
    font-size: 11px;

    &:first-child {
      padding-left: 10px;
    }

    &:last-child {
      padding-right: 10px;
    }
  }
`;

const TBody = styled.tbody``;

const Tr = styled.tr<{ $qualified?: boolean }>`
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;

  ${(props) =>
    props.$qualified &&
    `
    background: linear-gradient(90deg, #f0fdf4 0%, transparent 100%);
  `}

  &:hover {
    background: #fafafa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Td = styled.td`
  padding: 12px 8px;
  color: #1f2937;

  &:first-child {
    padding-left: 12px;
  }

  &:last-child {
    padding-right: 12px;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    padding: 14px 10px;
  }

  @media (min-width: 1024px) {
    padding: 12px 6px; /* Mais compacto em desktop 2 cols */

    &:first-child {
      padding-left: 10px;
    }

    &:last-child {
      padding-right: 10px;
    }
  }
`;

const Position = styled.div<{ $qualified?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;

  ${(props) =>
    props.$qualified
      ? `
    background: #22c55e;
    color: white;
  `
      : `
    background: #f3f4f6;
    color: #6b7280;
  `}

  @media (min-width: 768px) and (max-width: 1023px) {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  @media (min-width: 1024px) {
    width: 26px; /* Menor em desktop 2 cols */
    height: 26px;
    font-size: 12px;
  }
`;

const TeamName = styled.div`
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;

  @media (min-width: 768px) and (max-width: 1023px) {
    max-width: none;
  }

  @media (min-width: 1024px) {
    max-width: 140px; /* Mais compacto para caber 2 cols */
  }
`;

const StatBadge = styled.span<{ $type?: "positive" | "negative" | "neutral" }>`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;

  ${(props) => {
    switch (props.$type) {
      case "positive":
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case "negative":
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}

  @media (min-width: 768px) and (max-width: 1023px) {
    font-size: 13px;
    padding: 4px 10px;
  }

  @media (min-width: 1024px) {
    font-size: 11px; /* Menor em desktop 2 cols */
    padding: 3px 7px;
  }
`;

// Matches
const MatchesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MatchCard = styled.div<{ $finished?: boolean }>`
  border: 2px solid ${(props) => (props.$finished ? "#e5e7eb" : "#fbbf24")};
  border-radius: 10px;
  overflow: hidden;
  background: white;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
`;

const MatchHeader = styled.div`
  background: #fafafa;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 10px 16px;
  }
`;

const VS = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.1em;

  @media (min-width: 768px) {
    font-size: 12px;
  }
`;

const Status = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${(props) => {
    const status = props.$status.toLowerCase();
    if (status === "finalizada")
      return `
      background: #dcfce7;
      color: #166534;
    `;
    if (status === "em_andamento")
      return `
      background: #dbeafe;
      color: #1e40af;
    `;
    return `
      background: #fef3c7;
      color: #92400e;
    `;
  }}

  @media (min-width: 768px) {
    font-size: 11px;
    padding: 5px 12px;
  }
`;

const MatchBody = styled.div`
  padding: 10px;

  @media (min-width: 768px) {
    padding: 12px;
  }
`;

const TeamRow = styled.div<{ $winner?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.2s;

  &:last-child {
    margin-bottom: 0;
  }

  ${(props) =>
    props.$winner
      ? `
    background: linear-gradient(90deg, #f0fdf4 0%, transparent 100%);
    border-left: 3px solid #22c55e;
    font-weight: 600;
  `
      : `
    background: #fafafa;
    opacity: 0.7;
  `}

  @media (min-width: 768px) {
    padding: 12px;
  }
`;

const TeamNameInMatch = styled.span`
  font-size: 13px;
  color: #1f2937;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

const TeamScore = styled.span<{ $winner?: boolean }>`
  font-size: 18px;
  font-weight: 700;
  color: ${(props) => (props.$winner ? "#22c55e" : "#9ca3af")};
  margin-left: 12px;

  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const SetDetails = styled.div`
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
  justify-content: center;
  flex-wrap: wrap;

  @media (min-width: 768px) {
    padding: 12px 16px;
  }
`;

const SetBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-width: 48px;

  @media (min-width: 768px) {
    padding: 8px 12px;
    min-width: 52px;
  }
`;

const SetLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 2px;

  @media (min-width: 768px) {
    font-size: 11px;
  }
`;

const SetScore = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;

  @media (min-width: 768px) {
    font-size: 15px;
  }
`;

const EmptyBox = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;

  @media (min-width: 768px) {
    padding: 40px 24px;
  }
`;

const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 14px;
  margin: 0;
`;

// ============== COMPONENT ==============

const GruposViewer: React.FC<GruposViewerProps> = ({ grupos }) => {
  if (!grupos?.length) {
    return (
      <Wrapper>
        <Header>
          <Title>📊 Fase de Grupos</Title>
        </Header>
        <EmptyBox>
          <EmptyIcon>📋</EmptyIcon>
          <EmptyText>Grupos ainda não formados</EmptyText>
        </EmptyBox>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header>
        <Title>📊 Fase de Grupos</Title>
      </Header>

      <GroupsGrid>
        {grupos.map((group) => (
          <GroupCard key={group.id}>
            <GroupHeader>
              <GroupName>{group.nome}</GroupName>
            </GroupHeader>

            <GroupContent>
              {/* Standings */}
              {group.duplas?.length > 0 && (
                <>
                  <SectionTitle>🏆 Classificação</SectionTitle>
                  <TableWrapper>
                    <Table>
                      <THead>
                        <tr>
                          <Th>#</Th>
                          <Th>Dupla</Th>
                          <Th>J</Th>
                          <Th>V</Th>
                          <Th>D</Th>
                          <Th>Pts</Th>
                          <Th>SG</Th>
                        </tr>
                      </THead>
                      <TBody>
                        {group.duplas.map((team) => (
                          <Tr key={team.id} $qualified={team.classificada}>
                            <Td>
                              <Position $qualified={team.classificada}>
                                {team.posicaoGrupo}
                              </Position>
                            </Td>
                            <Td>
                              <TeamName>
                                {team.jogador1Nome} & {team.jogador2Nome}
                              </TeamName>
                            </Td>
                            <Td>{team.jogos}</Td>
                            <Td>{team.vitorias}</Td>
                            <Td>{team.derrotas}</Td>
                            <Td>
                              <StatBadge>{team.pontos}</StatBadge>
                            </Td>
                            <Td>
                              <StatBadge
                                $type={
                                  team.saldoGames > 0
                                    ? "positive"
                                    : team.saldoGames < 0
                                    ? "negative"
                                    : "neutral"
                                }
                              >
                                {team.saldoGames > 0 ? "+" : ""}
                                {team.saldoGames}
                              </StatBadge>
                            </Td>
                          </Tr>
                        ))}
                      </TBody>
                    </Table>
                  </TableWrapper>
                </>
              )}

              {/* Matches */}
              {group.partidas?.length > 0 && (
                <>
                  <SectionTitle>⚔️ Partidas</SectionTitle>
                  <MatchesList>
                    {group.partidas.map((match) => {
                      const finished =
                        match.status.toUpperCase() === "FINALIZADA";
                      const winner1 = match.vencedoraNome === match.dupla1Nome;
                      const winner2 = match.vencedoraNome === match.dupla2Nome;

                      return (
                        <MatchCard key={match.id} $finished={finished}>
                          <MatchHeader>
                            <VS>VS</VS>
                            <Status $status={match.status}>
                              {finished
                                ? "Finalizada"
                                : match.status.toUpperCase() === "EM_ANDAMENTO"
                                ? "Ao vivo"
                                : "Agendada"}
                            </Status>
                          </MatchHeader>

                          <MatchBody>
                            <TeamRow $winner={winner1}>
                              <TeamNameInMatch>
                                {match.dupla1Nome}
                              </TeamNameInMatch>
                              {finished && (
                                <TeamScore $winner={winner1}>
                                  {match.setsDupla1}
                                </TeamScore>
                              )}
                            </TeamRow>

                            <TeamRow $winner={winner2}>
                              <TeamNameInMatch>
                                {match.dupla2Nome}
                              </TeamNameInMatch>
                              {finished && (
                                <TeamScore $winner={winner2}>
                                  {match.setsDupla2}
                                </TeamScore>
                              )}
                            </TeamRow>
                          </MatchBody>

                          {finished && match.placar?.length > 0 && (
                            <SetDetails>
                              {match.placar.map((set) => (
                                <SetBox key={`${match.id}-set-${set.numero}`}>
                                  <SetLabel>Set {set.numero}</SetLabel>
                                  <SetScore>
                                    {set.gamesDupla1}-{set.gamesDupla2}
                                  </SetScore>
                                </SetBox>
                              ))}
                            </SetDetails>
                          )}
                        </MatchCard>
                      );
                    })}
                  </MatchesList>
                </>
              )}
            </GroupContent>
          </GroupCard>
        ))}
      </GroupsGrid>
    </Wrapper>
  );
};

export default GruposViewer;
