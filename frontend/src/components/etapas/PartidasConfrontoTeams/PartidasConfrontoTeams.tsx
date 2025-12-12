import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getTeamsService } from "@/services";
import { PartidaTeams, StatusPartidaTeams, TipoJogoTeams } from "@/types/teams";
import { ModalRegistrarResultadoTeams } from "../ModalRegistrarResultadoTeams";

interface PartidasConfrontoTeamsProps {
  etapaId: string;
  confrontoId: string;
  totalPartidas?: number; // Usado para forçar refresh quando novas partidas são geradas (ex: decider)
  etapaFinalizada?: boolean;
  onAtualizar?: () => void;
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

const OrdemBadge = styled.span`
  background: #e5e7eb;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const TipoBadge = styled.span<{ $tipo: TipoJogoTeams }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$tipo) {
      case TipoJogoTeams.FEMININO:
        return `background: #fce7f3; color: #9d174d;`;
      case TipoJogoTeams.MASCULINO:
        return `background: #dbeafe; color: #1e40af;`;
      case TipoJogoTeams.MISTO:
        return `background: #f3e8ff; color: #7c3aed;`;
      case TipoJogoTeams.DECIDER:
        return `background: #fef3c7; color: #92400e;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
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

const DuplaRow = styled.div<{ $isWinner?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: ${(props) => (props.$isWinner ? "#dcfce7" : "#f9fafb")};
  border: 1px solid ${(props) => (props.$isWinner ? "#bbf7d0" : "#e5e7eb")};
`;

const DuplaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const DuplaNomes = styled.span<{ $isWinner?: boolean }>`
  font-weight: ${(props) => (props.$isWinner ? 700 : 500)};
  color: ${(props) => (props.$isWinner ? "#166534" : "#374151")};
  font-size: 0.875rem;
`;

const EquipeLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const PlacarBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SetScore = styled.span<{ $isWinner?: boolean }>`
  font-weight: 700;
  font-size: 1rem;
  color: ${(props) => (props.$isWinner ? "#166534" : "#374151")};
  min-width: 1.5rem;
  text-align: center;
`;

const VsSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0;

  span {
    font-size: 0.6875rem;
    color: #9ca3af;
    font-weight: 600;
  }
`;

const ActionButton = styled.button<{
  $variant: "register" | "edit" | "disabled";
}>`
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) => {
    switch (props.$variant) {
      case "register":
        return `
          background: #059669;
          color: white;
          &:hover { background: #047857; }
        `;
      case "edit":
        return `
          background: #f59e0b;
          color: white;
          &:hover { background: #d97706; }
        `;
      default:
        return `
          background: #9ca3af;
          color: #e5e7eb;
          cursor: not-allowed;
        `;
    }
  }}
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
  border: 3px solid #dcfce7;
  border-top-color: #059669;
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
  text-align: center;
  padding: 1.5rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

// ============== HELPERS ==============

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    agendada: "Aguardando",
    em_andamento: "Em andamento",
    finalizada: "Finalizada",
  };
  return labels[status] || status;
};

const getTipoLabel = (tipo: TipoJogoTeams): string => {
  const labels: Record<TipoJogoTeams, string> = {
    [TipoJogoTeams.FEMININO]: "Feminino",
    [TipoJogoTeams.MASCULINO]: "Masculino",
    [TipoJogoTeams.MISTO]: "Misto",
    [TipoJogoTeams.DECIDER]: "Decider",
  };
  return labels[tipo] || tipo;
};

// ============== COMPONENTE ==============

export const PartidasConfrontoTeams: React.FC<PartidasConfrontoTeamsProps> = ({
  etapaId,
  confrontoId,
  totalPartidas,
  etapaFinalizada = false,
  onAtualizar,
}) => {
  const teamsService = getTeamsService();
  const [partidas, setPartidas] = useState<PartidaTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partidaSelecionada, setPartidaSelecionada] = useState<PartidaTeams | null>(
    null
  );

  useEffect(() => {
    carregarPartidas();
  }, [etapaId, confrontoId, totalPartidas]);

  const carregarPartidas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamsService.buscarPartidasConfronto(
        etapaId,
        confrontoId
      );
      // Ordenar por ordem
      const ordenadas = [...data].sort((a, b) => a.ordem - b.ordem);
      setPartidas(ordenadas);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar partidas");
    } finally {
      setLoading(false);
    }
  };

  const handleResultadoRegistrado = () => {
    setPartidaSelecionada(null);
    carregarPartidas();
    if (onAtualizar) onAtualizar();
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return <ErrorBox>Erro: {error}</ErrorBox>;
  }

  if (partidas.length === 0) {
    return <EmptyState>Nenhuma partida encontrada</EmptyState>;
  }

  return (
    <Container>
      {partidas.map((partida) => {
        const isFinalizada = partida.status === StatusPartidaTeams.FINALIZADA;
        const isDupla1Winner =
          isFinalizada && partida.vencedoraEquipeId === partida.dupla1.equipeId;
        const isDupla2Winner =
          isFinalizada && partida.vencedoraEquipeId === partida.dupla2.equipeId;

        // Calcular pontuacao total dos sets (disponivel para uso futuro em estatisticas)
        const _gamesDupla1 = partida.placar?.reduce(
          (sum, set) => sum + set.gamesDupla1,
          0
        ) || 0;
        const _gamesDupla2 = partida.placar?.reduce(
          (sum, set) => sum + set.gamesDupla2,
          0
        ) || 0;
        void _gamesDupla1;
        void _gamesDupla2;

        return (
          <PartidaCard key={partida.id}>
            <PartidaHeader>
              <PartidaInfo>
                <OrdemBadge>Jogo {partida.ordem}</OrdemBadge>
                <TipoBadge $tipo={partida.tipoJogo}>
                  {getTipoLabel(partida.tipoJogo)}
                </TipoBadge>
              </PartidaInfo>
              <StatusBadge $status={partida.status}>
                {getStatusLabel(partida.status)}
              </StatusBadge>
            </PartidaHeader>

            <PartidaContent>
              <DuplaRow $isWinner={isDupla1Winner}>
                <DuplaInfo>
                  <DuplaNomes $isWinner={isDupla1Winner}>
                    {partida.dupla1.jogador1Nome} & {partida.dupla1.jogador2Nome}
                  </DuplaNomes>
                  <EquipeLabel>{partida.dupla1.equipeNome}</EquipeLabel>
                </DuplaInfo>
                {isFinalizada && (
                  <PlacarBox>
                    {partida.placar?.map((set, idx) => (
                      <SetScore
                        key={idx}
                        $isWinner={set.gamesDupla1 > set.gamesDupla2}
                      >
                        {set.gamesDupla1}
                      </SetScore>
                    ))}
                  </PlacarBox>
                )}
              </DuplaRow>

              <VsSeparator>
                <span>VS</span>
              </VsSeparator>

              <DuplaRow $isWinner={isDupla2Winner}>
                <DuplaInfo>
                  <DuplaNomes $isWinner={isDupla2Winner}>
                    {partida.dupla2.jogador1Nome} & {partida.dupla2.jogador2Nome}
                  </DuplaNomes>
                  <EquipeLabel>{partida.dupla2.equipeNome}</EquipeLabel>
                </DuplaInfo>
                {isFinalizada && (
                  <PlacarBox>
                    {partida.placar?.map((set, idx) => (
                      <SetScore
                        key={idx}
                        $isWinner={set.gamesDupla2 > set.gamesDupla1}
                      >
                        {set.gamesDupla2}
                      </SetScore>
                    ))}
                  </PlacarBox>
                )}
              </DuplaRow>
            </PartidaContent>

            {!etapaFinalizada && partida.status === StatusPartidaTeams.AGENDADA && (
              <ActionButton
                $variant="register"
                onClick={() => setPartidaSelecionada(partida)}
              >
                Registrar Resultado
              </ActionButton>
            )}

            {!etapaFinalizada && isFinalizada && (
              <ActionButton
                $variant="edit"
                onClick={() => setPartidaSelecionada(partida)}
              >
                Editar Resultado
              </ActionButton>
            )}
          </PartidaCard>
        );
      })}

      {partidaSelecionada && (
        <ModalRegistrarResultadoTeams
          etapaId={etapaId}
          partida={partidaSelecionada}
          onClose={() => setPartidaSelecionada(null)}
          onSuccess={handleResultadoRegistrado}
        />
      )}
    </Container>
  );
};

export default PartidasConfrontoTeams;
