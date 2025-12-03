import React, { useState, useEffect } from "react";
import styled from "styled-components";
import chaveService from "@/services/chaveService";
import { Partida, StatusPartida } from "@/types/chave";
import { ModalRegistrarResultado } from "../ModalRegistrarResultado";

interface PartidasGrupoProps {
  etapaId: string;
  grupoId: string;
  grupoNome: string;
  onAtualizarGrupos?: () => void;
  eliminatoriaExiste?: boolean;
  etapaFinalizada?: boolean;
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
  color: #111827;
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

const StatusBadge = styled.span<{ $status: StatusPartida }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$status) {
      case StatusPartida.AGENDADA:
        return `background: #fef3c7; color: #92400e;`;
      case StatusPartida.EM_ANDAMENTO:
        return `background: #dbeafe; color: #1e40af;`;
      case StatusPartida.FINALIZADA:
        return `background: #dcfce7; color: #166534;`;
      case StatusPartida.CANCELADA:
        return `background: #f3f4f6; color: #374151;`;
      case StatusPartida.WO:
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

const PlacarDetalhado = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
`;

const PlacarInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;

  span:first-child {
    font-weight: 600;
  }
`;

const SetScore = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
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
          background: #2563eb;
          color: white;
          &:hover { background: #1d4ed8; }
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
          background: #2563eb;
          color: white;
          &:hover { background: #1d4ed8; }
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

// ============== COMPONENTE ==============

export const PartidasGrupo: React.FC<PartidasGrupoProps> = ({
  etapaId,
  grupoId,
  grupoNome,
  onAtualizarGrupos,
  eliminatoriaExiste = false,
  etapaFinalizada = false,
}) => {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(
    null
  );
  const bloqueado = eliminatoriaExiste || etapaFinalizada;

  useEffect(() => {
    carregarPartidas();
  }, [etapaId, grupoId]);

  const carregarPartidas = async () => {
    try {
      setLoading(true);
      const todasPartidas = await chaveService.buscarPartidas(etapaId);
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

  const getStatusLabel = (status: StatusPartida): string => {
    const labels = {
      [StatusPartida.AGENDADA]: "Aguardando",
      [StatusPartida.EM_ANDAMENTO]: "Em andamento",
      [StatusPartida.FINALIZADA]: "Finalizada",
      [StatusPartida.CANCELADA]: "Cancelada",
      [StatusPartida.WO]: "W.O.",
    };
    return labels[status] || status;
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
    (p) => p.status === StatusPartida.FINALIZADA
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
        {partidas.map((partida, index) => (
          <PartidaCard key={partida.id || `partida-${index}`}>
            <PartidaHeader>
              <PartidaInfo>
                <PartidaLabel>PARTIDA {index + 1}</PartidaLabel>
                <StatusBadge $status={partida.status}>
                  {getStatusLabel(partida.status)}
                </StatusBadge>
              </PartidaInfo>
            </PartidaHeader>

            <PartidaContent>
              <DuplaRow>
                <DuplaNome $isWinner={partida.vencedoraId === partida.dupla1Id}>
                  {partida.dupla1Nome}
                </DuplaNome>
                {partida.status === StatusPartida.FINALIZADA && (
                  <Score>{partida.setsDupla1}</Score>
                )}
              </DuplaRow>

              <VsSeparator>
                <span>VS</span>
              </VsSeparator>

              <DuplaRow>
                <DuplaNome $isWinner={partida.vencedoraId === partida.dupla2Id}>
                  {partida.dupla2Nome}
                </DuplaNome>
                {partida.status === StatusPartida.FINALIZADA && (
                  <Score>{partida.setsDupla2}</Score>
                )}
              </DuplaRow>
            </PartidaContent>

            {partida.status === StatusPartida.FINALIZADA &&
              partida.placar.length > 0 && (
                <PlacarDetalhado>
                  <PlacarInfo>
                    <span>Placar:</span>
                    {partida.placar.map((set, idx) => (
                      <SetScore key={idx}>
                        {set.gamesDupla1}-{set.gamesDupla2}
                      </SetScore>
                    ))}
                  </PlacarInfo>
                </PlacarDetalhado>
              )}

            {partida.status === StatusPartida.AGENDADA && (
              <ActionSection>
                <ActionButton
                  $variant="register"
                  onClick={() => setPartidaSelecionada(partida)}
                >
                  <span>Registrar Resultado</span>
                </ActionButton>
              </ActionSection>
            )}

            {partida.status === StatusPartida.FINALIZADA && (
              <ActionSection>
                <ActionButton
                  $variant={bloqueado ? "disabled" : "edit"}
                  onClick={() => !bloqueado && setPartidaSelecionada(partida)}
                  disabled={bloqueado}
                  title={
                    etapaFinalizada
                      ? "Etapa finalizada - não é possível editar"
                      : eliminatoriaExiste
                      ? "Não é possível editar após gerar a eliminatória. Cancele a eliminatória primeiro."
                      : "Editar resultado desta partida"
                  }
                >
                  <span>
                    {etapaFinalizada
                      ? "🔒 Etapa Finalizada"
                      : "Editar Resultado"}
                  </span>{" "}
                </ActionButton>
                {eliminatoriaExiste && !etapaFinalizada && (
                  <WarningText>
                    Para editar, cancele a eliminatória primeiro
                  </WarningText>
                )}
              </ActionSection>
            )}
          </PartidaCard>
        ))}
      </PartidasList>

      {partidaSelecionada && (
        <ModalRegistrarResultado
          partida={partidaSelecionada}
          onClose={() => setPartidaSelecionada(null)}
          onSuccess={handleResultadoRegistrado}
        />
      )}
    </Container>
  );
};

export default PartidasGrupo;
