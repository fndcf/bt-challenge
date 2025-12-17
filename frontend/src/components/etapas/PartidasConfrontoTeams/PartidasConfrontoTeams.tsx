import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getTeamsService } from "@/services";
import { PartidaTeams, StatusPartidaTeams, TipoJogoTeams, JogadorEquipe } from "@/types/teams";
import { ModalRegistrarResultadoTeams } from "../ModalRegistrarResultadoTeams";
import { ModalDefinirJogadoresPartida } from "../ModalDefinirJogadoresPartida";

interface PartidasConfrontoTeamsProps {
  etapaId: string;
  confrontoId: string;
  totalPartidas?: number; // Usado para forçar refresh quando novas partidas são geradas (ex: decider)
  etapaFinalizada?: boolean;
  onAtualizar?: () => void;
  setGlobalLoading?: (loading: boolean) => void;
  setGlobalLoadingMessage?: (message: string) => void;
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
  setGlobalLoading,
  setGlobalLoadingMessage,
}) => {
  const teamsService = getTeamsService();
  const [partidas, setPartidas] = useState<PartidaTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partidaSelecionada, setPartidaSelecionada] = useState<PartidaTeams | null>(
    null
  );
  const [partidaParaDefinirJogadores, setPartidaParaDefinirJogadores] = useState<PartidaTeams | null>(null);
  const [equipe1Jogadores, setEquipe1Jogadores] = useState<JogadorEquipe[]>([]);
  const [equipe2Jogadores, setEquipe2Jogadores] = useState<JogadorEquipe[]>([]);
  const [equipe1Nome, setEquipe1Nome] = useState<string>("");
  const [equipe2Nome, setEquipe2Nome] = useState<string>("");

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

  const handleResultadoRegistrado = async () => {
    try {
      if (setGlobalLoading && setGlobalLoadingMessage) {
        setGlobalLoading(true);
        setGlobalLoadingMessage("Salvando resultado...");
      }

      setPartidaSelecionada(null);
      await carregarPartidas();
      // Chamar onAtualizar de forma síncrona para garantir que seja a versão mais recente
      onAtualizar?.();
    } finally {
      if (setGlobalLoading && setGlobalLoadingMessage) {
        setGlobalLoading(false);
        setGlobalLoadingMessage("");
      }
    }
  };

  const handleAbrirModalDefinirJogadores = async (partida: PartidaTeams) => {
    try {
      // Buscar confronto para obter IDs das equipes
      const confrontos = await teamsService.buscarConfrontos(etapaId);
      const confronto = confrontos.find(c => c.id === partida.confrontoId);

      if (!confronto) {
        alert("Erro: Confronto não encontrado");
        return;
      }

      // Buscar jogadores das equipes
      const equipes = await teamsService.buscarEquipes(etapaId);

      const equipe1 = equipes.find(eq => eq.id === confronto.equipe1Id);
      const equipe2 = equipes.find(eq => eq.id === confronto.equipe2Id);

      if (!equipe1 || !equipe2) {
        alert("Erro: Equipes não encontradas");
        return;
      }

      setEquipe1Jogadores(equipe1.jogadores);
      setEquipe2Jogadores(equipe2.jogadores);
      setEquipe1Nome(equipe1.nome);
      setEquipe2Nome(equipe2.nome);
      setPartidaParaDefinirJogadores(partida);
    } catch (err: any) {
      alert(err.message || "Erro ao carregar jogadores");
    }
  };

  const handleDefinirJogadores = async (
    dupla1Ids: [string, string],
    dupla2Ids: [string, string]
  ) => {
    if (!partidaParaDefinirJogadores) return;

    try {
      await teamsService.definirJogadoresPartida(
        etapaId,
        partidaParaDefinirJogadores.id,
        dupla1Ids,
        dupla2Ids
      );

      // Fechar modal e recarregar
      setPartidaParaDefinirJogadores(null);
      setEquipe1Jogadores([]);
      setEquipe2Jogadores([]);
      setEquipe1Nome("");
      setEquipe2Nome("");
      carregarPartidas();
      if (onAtualizar) onAtualizar();
    } catch (err: any) {
      throw err; // O modal vai capturar e exibir o erro
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
          isFinalizada && partida.vencedoraEquipeId === partida.equipe1Id;
        const isDupla2Winner =
          isFinalizada && partida.vencedoraEquipeId === partida.equipe2Id;

        // Verificar se a partida está vazia (formação manual)
        const isPartidaVazia = partida.dupla1.length === 0 || partida.dupla2.length === 0;

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
              {isPartidaVazia ? (
                // Mostrar mensagem para partidas vazias (formação manual)
                <div style={{
                  textAlign: "center",
                  padding: "1.5rem",
                  backgroundColor: "#fef3c7",
                  borderRadius: "0.5rem",
                  color: "#92400e"
                }}>
                  <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                    Partida aguardando definição dos jogadores
                  </div>
                  <div style={{ fontSize: "0.875rem" }}>
                    Clique em "Definir Jogadores" para selecionar as duplas
                  </div>
                </div>
              ) : (
                <>
                  <DuplaRow $isWinner={isDupla1Winner}>
                    <DuplaInfo>
                      <DuplaNomes $isWinner={isDupla1Winner}>
                        {partida.dupla1[0]?.nome} & {partida.dupla1[1]?.nome}
                      </DuplaNomes>
                      <EquipeLabel>{partida.equipe1Nome}</EquipeLabel>
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
                        {partida.dupla2[0]?.nome} & {partida.dupla2[1]?.nome}
                      </DuplaNomes>
                      <EquipeLabel>{partida.equipe2Nome}</EquipeLabel>
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
                </>
              )}
            </PartidaContent>

            {!etapaFinalizada && isPartidaVazia && (
              <ActionButton
                $variant="register"
                onClick={() => handleAbrirModalDefinirJogadores(partida)}
              >
                Definir Jogadores
              </ActionButton>
            )}

            {!etapaFinalizada && !isPartidaVazia && partida.status === StatusPartidaTeams.AGENDADA && (
              <ActionButton
                $variant="register"
                onClick={() => setPartidaSelecionada(partida)}
              >
                Registrar Resultado
              </ActionButton>
            )}

            {!etapaFinalizada && !isPartidaVazia && isFinalizada && (
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

      {partidaParaDefinirJogadores && (
        <ModalDefinirJogadoresPartida
          isOpen={true}
          onClose={() => {
            setPartidaParaDefinirJogadores(null);
            setEquipe1Jogadores([]);
            setEquipe2Jogadores([]);
            setEquipe1Nome("");
            setEquipe2Nome("");
          }}
          onConfirm={handleDefinirJogadores}
          partida={partidaParaDefinirJogadores}
          equipe1Nome={equipe1Nome}
          equipe2Nome={equipe2Nome}
          equipe1Jogadores={equipe1Jogadores}
          equipe2Jogadores={equipe2Jogadores}
          partidasConfrontoComJogadores={partidas.filter(p => p.dupla1.length === 2 && p.dupla2.length === 2)}
        />
      )}
    </Container>
  );
};

export default PartidasConfrontoTeams;
