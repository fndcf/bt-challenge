import React, { useState } from "react";
import styled from "styled-components";
import { getTeamsService } from "@/services";
import {
  Equipe,
  ConfrontoEquipe,
  StatusConfronto,
  VarianteTeams,
} from "@/types/teams";
import { FaseEtapa } from "@/types/chave";
import { PartidasConfrontoTeams } from "../PartidasConfrontoTeams";

interface ConfrontosTeamsProps {
  etapaId: string;
  confrontos: ConfrontoEquipe[];
  equipes: Equipe[];
  varianteTeams?: VarianteTeams;
  etapaFinalizada?: boolean;
  /** Atualiza dados locais apenas (não muda aba) */
  onAtualizarLocal?: () => void;
  /** Atualiza dados e notifica o pai (para todasPartidasFinalizadas) */
  onAtualizar?: () => void;
  setGlobalLoading?: (loading: boolean) => void;
  setGlobalLoadingMessage?: (message: string) => void;
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ConfrontoCard = styled.div<{ $status: StatusConfronto }>`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid
    ${(props) => {
      switch (props.$status) {
        case StatusConfronto.FINALIZADO:
          return "#bbf7d0";
        case StatusConfronto.EM_ANDAMENTO:
          return "#bfdbfe";
        default:
          return "#e5e7eb";
      }
    }};
`;

const ConfrontoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const ConfrontoInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ConfrontoBadge = styled.span`
  background: #059669;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ $status: StatusConfronto }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$status) {
      case StatusConfronto.FINALIZADO:
        return `background: #dcfce7; color: #166534;`;
      case StatusConfronto.EM_ANDAMENTO:
        return `background: #dbeafe; color: #1e40af;`;
      default:
        return `background: #fef3c7; color: #92400e;`;
    }
  }}
`;

const ConfrontoContent = styled.div`
  padding: 1rem;
`;

const EquipesRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const EquipeBox = styled.div<{ $isWinner?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: ${(props) => (props.$isWinner ? "#dcfce7" : "#f9fafb")};
  border: 2px solid
    ${(props) => (props.$isWinner ? "#16a34a" : "transparent")};
`;

const EquipeNome = styled.span<{ $isWinner?: boolean }>`
  font-weight: ${(props) => (props.$isWinner ? 700 : 600)};
  color: ${(props) => (props.$isWinner ? "#166534" : "#374151")};
  font-size: 1rem;
  text-align: center;
`;

const VsBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 80px;
`;

const VsText = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: #9ca3af;
`;

const PlacarBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
`;

const PlacarSeparator = styled.span`
  color: #9ca3af;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const ActionButton = styled.button<{
  $variant: "primary" | "secondary" | "warning";
}>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${(props) => {
    switch (props.$variant) {
      case "primary":
        return `
          background: #059669;
          color: white;
          &:hover:not(:disabled) { background: #047857; }
        `;
      case "warning":
        return `
          background: #f59e0b;
          color: white;
          &:hover:not(:disabled) { background: #d97706; }
        `;
      default:
        return `
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover:not(:disabled) { background: #f9fafb; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ExpandButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: white;
  border: none;
  border-top: 1px solid #e5e7eb;
  color: #059669;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #dcfce7;
    color: #047857;
  }
`;

const PartidasContainer = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
  background: #fafafa;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

const FaseSection = styled.section`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FaseHeader = styled.div<{ $tipo: "grupos" | "oitavas" | "quartas" | "semifinal" | "final" }>`
  background: ${(props) => {
    switch (props.$tipo) {
      case "final":
        return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      case "semifinal":
        return "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)";
      case "quartas":
        return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      case "oitavas":
        return "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)";
      default:
        return "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
    }
  }};
  padding: 0.75rem 1rem;
  border-radius: 0.5rem 0.5rem 0 0;
  margin-bottom: 0;
`;

const FaseTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FaseContent = styled.div`
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  padding: 1rem;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GrupoSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const GrupoTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const DeciderAlert = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #92400e;
`;

const Spinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ============== HELPERS ==============

const getStatusLabel = (status: StatusConfronto): string => {
  switch (status) {
    case StatusConfronto.FINALIZADO:
      return "Finalizado";
    case StatusConfronto.EM_ANDAMENTO:
      return "Em andamento";
    default:
      return "Aguardando";
  }
};

interface ConfrontosAgrupados {
  grupos: { [grupoId: string]: ConfrontoEquipe[] };
  oitavas: ConfrontoEquipe[];
  quartas: ConfrontoEquipe[];
  semifinais: ConfrontoEquipe[];
  final: ConfrontoEquipe[];
}

const agruparConfrontos = (confrontos: ConfrontoEquipe[]): ConfrontosAgrupados => {
  const grupos: { [grupoId: string]: ConfrontoEquipe[] } = {};
  const oitavas: ConfrontoEquipe[] = [];
  const quartas: ConfrontoEquipe[] = [];
  const semifinais: ConfrontoEquipe[] = [];
  const final: ConfrontoEquipe[] = [];

  confrontos.forEach((confronto) => {
    if (confronto.fase === FaseEtapa.FINAL) {
      final.push(confronto);
    } else if (confronto.fase === FaseEtapa.SEMIFINAL) {
      semifinais.push(confronto);
    } else if (confronto.fase === FaseEtapa.QUARTAS) {
      quartas.push(confronto);
    } else if (confronto.fase === FaseEtapa.OITAVAS) {
      oitavas.push(confronto);
    } else if (confronto.fase === FaseEtapa.GRUPOS) {
      const grupoId = confronto.grupoId || "sem_grupo";
      if (!grupos[grupoId]) {
        grupos[grupoId] = [];
      }
      grupos[grupoId].push(confronto);
    }
  });

  // Ordenar por ordem dentro de cada grupo/fase
  Object.keys(grupos).forEach((grupoId) => {
    grupos[grupoId].sort((a, b) => a.ordem - b.ordem);
  });
  oitavas.sort((a, b) => a.ordem - b.ordem);
  quartas.sort((a, b) => a.ordem - b.ordem);
  semifinais.sort((a, b) => a.ordem - b.ordem);
  final.sort((a, b) => a.ordem - b.ordem);

  return { grupos, oitavas, quartas, semifinais, final };
};

// ============== COMPONENTE ==============

export const ConfrontosTeams: React.FC<ConfrontosTeamsProps> = ({
  etapaId,
  confrontos,
  equipes: _equipes,
  varianteTeams,
  etapaFinalizada = false,
  onAtualizarLocal,
  onAtualizar,
  setGlobalLoading,
  setGlobalLoadingMessage,
}) => {
  // equipes disponível para uso futuro (ex: exibir detalhes)
  void _equipes;
  const teamsService = getTeamsService();
  const [confrontoExpandido, setConfrontoExpandido] = useState<string | null>(null);
  const [loadingGerarPartidas, setLoadingGerarPartidas] = useState<string | null>(null);
  const [loadingGerarDecider, setLoadingGerarDecider] = useState<string | null>(null);
  const [loadingResetarPartidas, setLoadingResetarPartidas] = useState(false);

  const handleGerarPartidas = async (confrontoId: string) => {
    try {
      setLoadingGerarPartidas(confrontoId);
      if (setGlobalLoading && setGlobalLoadingMessage) {
        setGlobalLoading(true);
        setGlobalLoadingMessage("Gerando partidas...");
      }
      await teamsService.gerarPartidasConfronto(etapaId, confrontoId);
      // Apenas atualiza dados locais, não muda aba
      if (onAtualizarLocal) onAtualizarLocal();
    } catch (err: any) {
      alert(err.message || "Erro ao gerar partidas");
    } finally {
      setLoadingGerarPartidas(null);
      if (setGlobalLoading && setGlobalLoadingMessage) {
        setGlobalLoading(false);
        setGlobalLoadingMessage("");
      }
    }
  };

  const handleGerarDecider = async (confrontoId: string) => {
    try {
      setLoadingGerarDecider(confrontoId);
      if (setGlobalLoading && setGlobalLoadingMessage) {
        setGlobalLoading(true);
        setGlobalLoadingMessage("Gerando decider...");
      }
      await teamsService.gerarDecider(etapaId, confrontoId);
      // Apenas atualiza dados locais, não muda aba
      if (onAtualizarLocal) onAtualizarLocal();
    } catch (err: any) {
      alert(err.message || "Erro ao gerar decider");
    } finally {
      setLoadingGerarDecider(null);
      if (setGlobalLoading && setGlobalLoadingMessage) {
        setGlobalLoading(false);
        setGlobalLoadingMessage("");
      }
    }
  };

  const handleResetarPartidas = async () => {
    const confirmar = window.confirm(
      "Deseja resetar todas as partidas e resultados?\n\n" +
      "Isso irá:\n" +
      "• Apagar todas as partidas geradas\n" +
      "• Zerar os resultados dos confrontos\n" +
      "• Zerar as estatísticas das equipes\n\n" +
      "As equipes e os confrontos serão mantidos.\n\n" +
      "Esta ação não pode ser desfeita!"
    );

    if (!confirmar) return;

    try {
      setLoadingResetarPartidas(true);
      if (setGlobalLoading && setGlobalLoadingMessage) {
        setGlobalLoading(true);
        setGlobalLoadingMessage("Resetando partidas...");
      }
      await teamsService.resetarPartidas(etapaId);
      if (onAtualizar) onAtualizar();
      alert("Partidas resetadas com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao resetar partidas");
    } finally {
      setLoadingResetarPartidas(false);
      if (setGlobalLoading && setGlobalLoadingMessage) {
        setGlobalLoading(false);
        setGlobalLoadingMessage("");
      }
    }
  };

  const toggleExpandir = (confrontoId: string) => {
    setConfrontoExpandido(
      confrontoExpandido === confrontoId ? null : confrontoId
    );
  };

  if (confrontos.length === 0) {
    return <EmptyState>Nenhum confronto encontrado</EmptyState>;
  }

  // Verificar se há alguma partida gerada em qualquer confronto
  const temAlgumaPartida = confrontos.some(
    (c) => c.partidas && c.partidas.length > 0
  );

  // Agrupar confrontos por fase
  const confrontosAgrupados = agruparConfrontos(confrontos);
  const grupoIds = Object.keys(confrontosAgrupados.grupos).sort();
  const temFaseGrupos = grupoIds.length > 0;
  const temOitavas = confrontosAgrupados.oitavas.length > 0;
  const temQuartas = confrontosAgrupados.quartas.length > 0;
  const temSemifinais = confrontosAgrupados.semifinais.length > 0;
  const temFinal = confrontosAgrupados.final.length > 0;

  // Função para renderizar um confronto individual
  const renderConfronto = (confronto: ConfrontoEquipe, indexLocal: number) => {
    const isExpanded = confrontoExpandido === confronto.id;
    const isEquipe1Winner = confronto.vencedoraId === confronto.equipe1Id;
    const isEquipe2Winner = confronto.vencedoraId === confronto.equipe2Id;
    const precisaDecider =
      varianteTeams === VarianteTeams.TEAMS_4 &&
      confronto.jogosEquipe1 === 1 &&
      confronto.jogosEquipe2 === 1 &&
      confronto.status !== StatusConfronto.FINALIZADO &&
      !confronto.temDecider;
    const temPartidasGeradas = confronto.partidas && confronto.partidas.length > 0;
    const equipesDefinidas = !!confronto.equipe1Id && !!confronto.equipe2Id;

    return (
      <ConfrontoCard key={confronto.id} $status={confronto.status}>
        <ConfrontoHeader>
          <ConfrontoInfo>
            <ConfrontoBadge>#{indexLocal + 1}</ConfrontoBadge>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {confronto.partidasFinalizadas || 0}/{confronto.totalPartidas || 2} jogos
            </span>
          </ConfrontoInfo>
          <StatusBadge $status={confronto.status}>
            {getStatusLabel(confronto.status)}
          </StatusBadge>
        </ConfrontoHeader>

        <ConfrontoContent>
          <EquipesRow>
            <EquipeBox $isWinner={isEquipe1Winner}>
              <EquipeNome $isWinner={isEquipe1Winner}>
                {confronto.equipe1Nome || confronto.equipe1Origem || "A definir"}
              </EquipeNome>
            </EquipeBox>

            <VsBox>
              <PlacarBox>
                <span>{confronto.jogosEquipe1}</span>
                <PlacarSeparator>x</PlacarSeparator>
                <span>{confronto.jogosEquipe2}</span>
              </PlacarBox>
              <VsText>jogos</VsText>
            </VsBox>

            <EquipeBox $isWinner={isEquipe2Winner}>
              <EquipeNome $isWinner={isEquipe2Winner}>
                {confronto.equipe2Nome || confronto.equipe2Origem || "A definir"}
              </EquipeNome>
            </EquipeBox>
          </EquipesRow>

          {precisaDecider && (
            <DeciderAlert>
              <span>Empate 1-1! Necessario gerar partida Decider.</span>
            </DeciderAlert>
          )}

          {!equipesDefinidas && (
            <div style={{
              textAlign: "center",
              padding: "0.75rem",
              backgroundColor: "#fef3c7",
              borderRadius: "0.5rem",
              color: "#92400e",
              fontSize: "0.875rem",
              marginTop: "0.5rem"
            }}>
              Aguardando definição das equipes (fase de grupos em andamento)
            </div>
          )}

          {!etapaFinalizada && confronto.status !== StatusConfronto.FINALIZADO && equipesDefinidas && (
            <ActionsRow>
              {!temPartidasGeradas && (
                <ActionButton
                  $variant="primary"
                  onClick={() => handleGerarPartidas(confronto.id)}
                  disabled={loadingGerarPartidas === confronto.id}
                >
                  {loadingGerarPartidas === confronto.id ? (
                    <>
                      <Spinner />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <span>Gerar Partidas</span>
                  )}
                </ActionButton>
              )}

              {precisaDecider && (
                <ActionButton
                  $variant="warning"
                  onClick={() => handleGerarDecider(confronto.id)}
                  disabled={loadingGerarDecider === confronto.id}
                >
                  {loadingGerarDecider === confronto.id ? (
                    <>
                      <Spinner />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <span>Gerar Decider</span>
                  )}
                </ActionButton>
              )}
            </ActionsRow>
          )}
        </ConfrontoContent>

        {temPartidasGeradas && (
          <>
            <ExpandButton onClick={() => toggleExpandir(confronto.id)}>
              {isExpanded ? "Ocultar Partidas" : "Ver Partidas"}
            </ExpandButton>

            {isExpanded && (
              <PartidasContainer>
                <PartidasConfrontoTeams
                  etapaId={etapaId}
                  confrontoId={confronto.id}
                  totalPartidas={confronto.partidas?.length || 0}
                  etapaFinalizada={etapaFinalizada}
                  onAtualizar={onAtualizar}
                  setGlobalLoading={setGlobalLoading}
                  setGlobalLoadingMessage={setGlobalLoadingMessage}
                />
              </PartidasContainer>
            )}
          </>
        )}
      </ConfrontoCard>
    );
  };

  return (
    <Container>
      {/* Botão para resetar todas as partidas */}
      {!etapaFinalizada && temAlgumaPartida && (
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <ActionButton
            $variant="warning"
            onClick={handleResetarPartidas}
            disabled={loadingResetarPartidas}
          >
            {loadingResetarPartidas ? (
              <>
                <Spinner />
                <span>Resetando...</span>
              </>
            ) : (
              <span>Resetar Todas as Partidas</span>
            )}
          </ActionButton>
        </div>
      )}

      {/* Fase de Grupos */}
      {temFaseGrupos && (
        <FaseSection>
          <FaseHeader $tipo="grupos">
            <FaseTitle>Fase de Grupos</FaseTitle>
          </FaseHeader>
          <FaseContent>
            {grupoIds.map((grupoId) => {
              const confrontosGrupo = confrontosAgrupados.grupos[grupoId];
              const primeiroConfronto = confrontosGrupo[0];
              const nomeGrupo = primeiroConfronto?.grupoId
                ? `Grupo ${primeiroConfronto.grupoId}`
                : "Grupo";

              return (
                <GrupoSection key={grupoId}>
                  <GrupoTitle>{nomeGrupo}</GrupoTitle>
                  {confrontosGrupo.map((confronto, index) => renderConfronto(confronto, index))}
                </GrupoSection>
              );
            })}
          </FaseContent>
        </FaseSection>
      )}

      {/* Oitavas de Final */}
      {temOitavas && (
        <FaseSection>
          <FaseHeader $tipo="oitavas">
            <FaseTitle>Oitavas de Final</FaseTitle>
          </FaseHeader>
          <FaseContent>
            {confrontosAgrupados.oitavas.map((confronto, index) => renderConfronto(confronto, index))}
          </FaseContent>
        </FaseSection>
      )}

      {/* Quartas de Final */}
      {temQuartas && (
        <FaseSection>
          <FaseHeader $tipo="quartas">
            <FaseTitle>Quartas de Final</FaseTitle>
          </FaseHeader>
          <FaseContent>
            {confrontosAgrupados.quartas.map((confronto, index) => renderConfronto(confronto, index))}
          </FaseContent>
        </FaseSection>
      )}

      {/* Semifinais */}
      {temSemifinais && (
        <FaseSection>
          <FaseHeader $tipo="semifinal">
            <FaseTitle>Semifinais</FaseTitle>
          </FaseHeader>
          <FaseContent>
            {confrontosAgrupados.semifinais.map((confronto, index) => renderConfronto(confronto, index))}
          </FaseContent>
        </FaseSection>
      )}

      {/* Final */}
      {temFinal && (
        <FaseSection>
          <FaseHeader $tipo="final">
            <FaseTitle>Final</FaseTitle>
          </FaseHeader>
          <FaseContent>
            {confrontosAgrupados.final.map((confronto, index) => renderConfronto(confronto, index))}
          </FaseContent>
        </FaseSection>
      )}
    </Container>
  );
};

export default ConfrontosTeams;
