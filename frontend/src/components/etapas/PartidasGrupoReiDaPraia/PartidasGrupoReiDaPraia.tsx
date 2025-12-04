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
import { getReiDaPraiaService } from "@/services";
import { PartidaReiDaPraia } from "@/types/reiDaPraia";
import { ModalRegistrarResultadoReiDaPraia } from "../ModalRegistrarResultadoReiDaPraia";

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
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
  color: #6b7280;
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
        return `background: #dbeafe; color: #1e40af;`;
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
  gap: 0.5rem;
`;

const DuplaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DuplaNome = styled.span<{ $isWinner?: boolean }>`
  font-weight: ${(props) => (props.$isWinner ? 700 : 500)};
  color: ${(props) => (props.$isWinner ? "#16a34a" : "#374151")};
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const Score = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
`;

const VsSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 600;
  }
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
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
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
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  color: #6b7280;
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
  const reiDaPraiaService = getReiDaPraiaService();
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
        <Title>Partidas - {grupoNome}</Title>
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
                    PARTIDA {index + 1}
                  </PartidaLabel>
                  <StatusBadge $status={partida.status}>
                    {getStatusLabel(partida.status)}
                  </StatusBadge>
                </PartidaInfo>
              </PartidaHeader>

              <PartidaContent>
                <DuplaRow>
                  <DuplaNome $isWinner={isFinalizada && isDupla1Winner}>
                    {partida.jogador1ANome} & {partida.jogador1BNome}
                  </DuplaNome>
                  {isFinalizada && (
                    <Score>{partida.placar?.[0]?.gamesDupla1 || 0}</Score>
                  )}
                </DuplaRow>

                <VsSeparator>
                  <span>VS</span>
                </VsSeparator>

                <DuplaRow>
                  <DuplaNome $isWinner={isFinalizada && isDupla2Winner}>
                    {partida.jogador2ANome} & {partida.jogador2BNome}
                  </DuplaNome>
                  {isFinalizada && (
                    <Score>{partida.placar?.[0]?.gamesDupla2 || 0}</Score>
                  )}
                </DuplaRow>
              </PartidaContent>

              {partida.status === "agendada" && (
                <ActionSection>
                  <ActionButton
                    $variant="register"
                    onClick={() => setPartidaSelecionada(partida)}
                  >
                    <span>Registrar Resultado</span>
                  </ActionButton>
                </ActionSection>
              )}

              {isFinalizada && (
                <ActionSection>
                  <ActionButton
                    $variant={eliminatoriaExiste ? "disabled" : "edit"}
                    onClick={() => !eliminatoriaExiste && setPartidaSelecionada(partida)}
                    disabled={eliminatoriaExiste}
                    title={
                      eliminatoriaExiste
                        ? "Não é possível editar após gerar a eliminatória. Cancele a eliminatória primeiro."
                        : "Editar resultado desta partida"
                    }
                  >
                    <span>Editar Resultado</span>
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
