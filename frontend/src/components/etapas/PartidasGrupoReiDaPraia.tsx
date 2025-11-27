/**
 * PartidasGrupoReiDaPraia - Exibe e gerencia partidas de um grupo no formato Rei da Praia
 *
 * Diferenças do Dupla Fixa:
 * - Duplas são temporárias (formadas apenas para aquela partida)
 * - Mostra os 4 jogadores (2 vs 2)
 * - Apenas 1 set por partida
 * - Vencedores são os 2 jogadores da dupla vencedora
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import reiDaPraiaService from "../../services/reiDaPraiaService";
import { PartidaReiDaPraia } from "../../types/reiDaPraia";
import { ModalRegistrarResultadoReiDaPraia } from "./ModalRegistrarResultadoReiDaPraia"; // Criar depois

interface PartidasGrupoReiDaPraiaProps {
  etapaId: string;
  grupoId: string;
  grupoNome: string;
  onAtualizarGrupos?: () => void;
  eliminatoriaExiste?: boolean;
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #581c87;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Counter = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const PartidasList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PartidaCard = styled.div`
  background: white;
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(124, 58, 237, 0.15);
  }
`;

const PartidaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PartidaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PartidaLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #7c3aed;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$status) {
      case "agendada":
        return `background: #fef3c7; color: #92400e;`;
      case "em_andamento":
        return `background: #ede9fe; color: #6d28d9;`;
      case "finalizada":
        return `background: #dcfce7; color: #166534;`;
      case "cancelada":
        return `background: #f3f4f6; color: #374151;`;
      case "wo":
        return `background: #fee2e2; color: #991b1b;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
`;

const PartidaContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DuplaBox = styled.div<{ $isWinner?: boolean }>`
  background: ${(props) => (props.$isWinner ? "#f0fdf4" : "#faf5ff")};
  border: 1px solid ${(props) => (props.$isWinner ? "#86efac" : "#e9d5ff")};
  border-radius: 0.5rem;
  padding: 0.75rem;
`;

const DuplaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const DuplaLabel = styled.span<{ $isWinner?: boolean }>`
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => (props.$isWinner ? "#166534" : "#7c3aed")};
`;

const Score = styled.span<{ $isWinner?: boolean }>`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => (props.$isWinner ? "#16a34a" : "#374151")};
`;

const JogadoresRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const JogadorNome = styled.span<{ $isWinner?: boolean }>`
  font-weight: ${(props) => (props.$isWinner ? 600 : 500)};
  color: ${(props) => (props.$isWinner ? "#166534" : "#374151")};
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const JogadorSeparator = styled.span`
  color: #9ca3af;
  font-weight: 600;
`;

const VsSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0;

  span {
    font-size: 0.75rem;
    color: #7c3aed;
    font-weight: 700;
    background: #ede9fe;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
  }
`;

const PlacarDetalhado = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e9d5ff;
`;

const PlacarInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const PlacarLabel = styled.span`
  font-weight: 600;
  color: #7c3aed;
`;

const SetScore = styled.span`
  font-family: monospace;
  font-size: 1rem;
  font-weight: 700;
  background: #faf5ff;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  color: #581c87;
`;

const VencedoresInfo = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 0.5rem;
  text-align: center;
`;

const VencedoresLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #166534;
  display: block;
  margin-bottom: 0.25rem;
`;

const VencedoresNomes = styled.span`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #15803d;
`;

const ActionSection = styled.div`
  margin-top: 1rem;
`;

const ActionButton = styled.button<{
  $variant?: "register" | "edit" | "disabled";
}>`
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) => {
    switch (props.$variant) {
      case "register":
        return `
          background: #7c3aed;
          color: white;
          &:hover { background: #6d28d9; }
        `;
      case "edit":
        return `
          background: #f59e0b;
          color: white;
          &:hover { background: #d97706; }
        `;
      case "disabled":
        return `
          background: #9ca3af;
          color: #e5e7eb;
          cursor: not-allowed;
        `;
      default:
        return `
          background: #7c3aed;
          color: white;
          &:hover { background: #6d28d9; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WarningText = styled.p`
  font-size: 0.75rem;
  color: #dc2626;
  margin: 0.5rem 0 0 0;
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
`;

const Spinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 3px solid #ede9fe;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorBox = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #991b1b;
`;

const EmptyState = styled.div`
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  color: #6b7280;
`;

const InfoCard = styled.div`
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-top: 1rem;

  p {
    font-size: 0.8125rem;
    color: #7c3aed;
    margin: 0;
    text-align: center;
  }
`;

// ============== HELPERS ==============

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    agendada: "Aguardando",
    em_andamento: "Em andamento",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
    wo: "W.O.",
  };
  return labels[status] || status;
};

const getPartidaDescricao = (index: number): string => {
  const descricoes = ["A+B vs C+D", "A+C vs B+D", "A+D vs B+C"];
  return descricoes[index] || `Partida ${index + 1}`;
};

// ============== COMPONENTE ==============

export const PartidasGrupoReiDaPraia: React.FC<
  PartidasGrupoReiDaPraiaProps
> = ({
  etapaId,
  grupoId,
  grupoNome,
  onAtualizarGrupos,
  eliminatoriaExiste = false,
}) => {
  const [partidas, setPartidas] = useState<PartidaReiDaPraia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partidaSelecionada, setPartidaSelecionada] =
    useState<PartidaReiDaPraia | null>(null);

  useEffect(() => {
    carregarPartidas();
  }, [etapaId, grupoId]);

  const carregarPartidas = async () => {
    try {
      setLoading(true);
      const todasPartidas = await reiDaPraiaService.buscarPartidas(etapaId);
      const partidasDoGrupo = todasPartidas.filter(
        (p) => p.grupoId === grupoId
      );
      setPartidas(partidasDoGrupo);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResultadoRegistrado = () => {
    setPartidaSelecionada(null);
    carregarPartidas();

    if (onAtualizarGrupos) {
      onAtualizarGrupos();
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return <ErrorBox>Erro ao carregar partidas: {error}</ErrorBox>;
  }

  if (partidas.length === 0) {
    return <EmptyState>Nenhuma partida encontrada para este grupo</EmptyState>;
  }

  const partidasFinalizadas = partidas.filter(
    (p) => p.status === "finalizada"
  ).length;

  return (
    <Container>
      <Header>
        <Title>
          <span>🎾</span>
          Partidas - {grupoNome}
        </Title>
        <Counter>
          {partidasFinalizadas} / {partidas.length} finalizadas
        </Counter>
      </Header>

      <PartidasList>
        {partidas.map((partida, index) => {
          const isFinalizada = partida.status === "finalizada";
          const isDupla1Winner = partida.setsDupla1 > partida.setsDupla2;
          const isDupla2Winner = partida.setsDupla2 > partida.setsDupla1;

          return (
            <PartidaCard key={partida.id || `partida-${index}`}>
              <PartidaHeader>
                <PartidaInfo>
                  <PartidaLabel>
                    PARTIDA {index + 1} • {getPartidaDescricao(index)}
                  </PartidaLabel>
                  <StatusBadge $status={partida.status}>
                    {getStatusLabel(partida.status)}
                  </StatusBadge>
                </PartidaInfo>
              </PartidaHeader>

              <PartidaContent>
                {/* DUPLA 1 */}
                <DuplaBox $isWinner={isFinalizada && isDupla1Winner}>
                  <DuplaHeader>
                    <DuplaLabel $isWinner={isFinalizada && isDupla1Winner}>
                      {partida.dupla1Nome || "Dupla 1"}
                    </DuplaLabel>
                    {isFinalizada && (
                      <Score $isWinner={isDupla1Winner}>
                        {partida.placar?.[0]?.gamesDupla1 || 0}
                      </Score>
                    )}
                  </DuplaHeader>
                  <JogadoresRow>
                    <JogadorNome $isWinner={isFinalizada && isDupla1Winner}>
                      {partida.jogador1ANome}
                    </JogadorNome>
                    <JogadorSeparator>&</JogadorSeparator>
                    <JogadorNome $isWinner={isFinalizada && isDupla1Winner}>
                      {partida.jogador1BNome}
                    </JogadorNome>
                  </JogadoresRow>
                </DuplaBox>

                {/* VS */}
                <VsSeparator>
                  <span>VS</span>
                </VsSeparator>

                {/* DUPLA 2 */}
                <DuplaBox $isWinner={isFinalizada && isDupla2Winner}>
                  <DuplaHeader>
                    <DuplaLabel $isWinner={isFinalizada && isDupla2Winner}>
                      {partida.dupla2Nome || "Dupla 2"}
                    </DuplaLabel>
                    {isFinalizada && (
                      <Score $isWinner={isDupla2Winner}>
                        {partida.placar?.[0]?.gamesDupla2 || 0}
                      </Score>
                    )}
                  </DuplaHeader>
                  <JogadoresRow>
                    <JogadorNome $isWinner={isFinalizada && isDupla2Winner}>
                      {partida.jogador2ANome}
                    </JogadorNome>
                    <JogadorSeparator>&</JogadorSeparator>
                    <JogadorNome $isWinner={isFinalizada && isDupla2Winner}>
                      {partida.jogador2BNome}
                    </JogadorNome>
                  </JogadoresRow>
                </DuplaBox>
              </PartidaContent>

              {/* PLACAR DETALHADO */}
              {isFinalizada && partida.placar && partida.placar.length > 0 && (
                <PlacarDetalhado>
                  <PlacarInfo>
                    <PlacarLabel>Placar:</PlacarLabel>
                    <SetScore>
                      {partida.placar[0].gamesDupla1} x{" "}
                      {partida.placar[0].gamesDupla2}
                    </SetScore>
                  </PlacarInfo>
                </PlacarDetalhado>
              )}

              {/* VENCEDORES */}
              {isFinalizada && partida.vencedoresNomes && (
                <VencedoresInfo>
                  <VencedoresLabel>🏆 Vencedores</VencedoresLabel>
                  <VencedoresNomes>{partida.vencedoresNomes}</VencedoresNomes>
                </VencedoresInfo>
              )}

              {/* AÇÕES */}
              {partida.status === "agendada" && (
                <ActionSection>
                  <ActionButton
                    $variant="register"
                    onClick={() => setPartidaSelecionada(partida)}
                  >
                    <span>🎾 Registrar Resultado</span>
                  </ActionButton>
                </ActionSection>
              )}

              {isFinalizada && (
                <ActionSection>
                  <ActionButton
                    $variant={eliminatoriaExiste ? "disabled" : "edit"}
                    onClick={() => setPartidaSelecionada(partida)}
                    disabled={eliminatoriaExiste}
                    title={
                      eliminatoriaExiste
                        ? "Não é possível editar após gerar a eliminatória"
                        : "Editar resultado desta partida"
                    }
                  >
                    <span>✏️ Editar Resultado</span>
                  </ActionButton>
                  {eliminatoriaExiste && (
                    <WarningText>
                      Para editar, cancele a eliminatória primeiro
                    </WarningText>
                  )}
                </ActionSection>
              )}
            </PartidaCard>
          );
        })}
      </PartidasList>

      <InfoCard>
        <p>
          👑 <strong>Rei da Praia:</strong> Cada partida tem apenas 1 set. Os 2
          jogadores da dupla vencedora ganham 3 pontos cada.
        </p>
      </InfoCard>

      {/* Modal de Resultado */}
      {partidaSelecionada && (
        <ModalRegistrarResultadoReiDaPraia
          partida={partidaSelecionada}
          onClose={() => setPartidaSelecionada(null)}
          onSuccess={handleResultadoRegistrado}
        />
      )}
    </Container>
  );
};

export default PartidasGrupoReiDaPraia;
