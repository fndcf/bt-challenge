import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
  Grupo,
} from "../../types/chave";
import chaveService from "../../services/chaveService";
import etapaService from "../../services/etapaService";
import { ModalRegistrarResultadoEliminatorio } from "./ModalRegistrarResultadoEliminatorio";

interface FaseEliminatoriaProps {
  etapaId: string;
  arenaId: string;
  grupos: Grupo[];
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  color: white;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;

    @media (min-width: 768px) {
      font-size: 2rem;
    }
  }

  p {
    color: #dbeafe;
    margin: 0;
    font-size: 0.875rem;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Button = styled.button<{
  $variant?: "primary" | "danger" | "warning" | "gray";
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) => {
    switch (props.$variant) {
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) { background: #dc2626; }
        `;
      case "warning":
        return `
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-weight: 700;
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          }
        `;
      case "gray":
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover:not(:disabled) { background: #e5e7eb; }
        `;
      default:
        return `
          background: #2563eb;
          color: white;
          &:hover:not(:disabled) { background: #1d4ed8; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const Controls = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$active
      ? `
    background: #2563eb;
    color: white;
  `
      : `
    background: #f3f4f6;
    color: #374151;
    &:hover { background: #e5e7eb; }
  `}
`;

const Select = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #2563eb;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
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
  text-align: center;
`;

const EmptyStateCard = styled.div`
  max-width: 42rem;
  margin: 0 auto;
  padding: 1.5rem;
`;

const EmptyStateContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const AlertBox = styled.div<{ $variant: "success" | "warning" }>`
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  ${(props) =>
    props.$variant === "success"
      ? `
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #166534;
  `
      : `
    background: #fef3c7;
    border: 1px solid #fde68a;
    color: #92400e;
  `}

  h4 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;

    @media (min-width: 768px) {
      font-size: 1.25rem;
    }
  }

  p {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    line-height: 1.5;

    @media (min-width: 768px) {
      font-size: 0.9375rem;
    }
  }
`;

const InfoBox = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  padding: 1rem;
  margin-top: 0.75rem;
`;

const InfoText = styled.p`
  font-size: 0.8125rem;
  color: #374151;
  margin: 0 0 0.5rem 0;

  strong {
    color: #166534;
    font-weight: 600;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

const HintText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 1rem 0 0 0;
`;

// ============== FASE CARDS ==============

const FaseCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const FaseHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
`;

const FaseTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const FaseStatus = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
`;

const ConfrontosList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ConfrontoCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ConfrontoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ConfrontoInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusInfo = styled.span`
  display: flex;

  @media (max-width: 414px) {
    display: none;
  }
`;

const ConfrontoLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
`;

const StatusBadge = styled.span<{ $status: StatusConfrontoEliminatorio }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$status) {
      case StatusConfrontoEliminatorio.BYE:
        return `background: #dcfce7; color: #166534;`;
      case StatusConfrontoEliminatorio.FINALIZADA:
        return `background: #dcfce7; color: #166534;`;
      default:
        return `background: #fef3c7; color: #92400e;`;
    }
  }}
`;

const ConfrontoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ByeBox = styled.div`
  background: #dcfce7;
  border: 2px solid #86efac;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
`;

const ByeTeam = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #166534;
  margin-bottom: 0.25rem;
`;

const ByeOrigin = styled.div`
  font-size: 0.75rem;
  color: #16a34a;
  margin-top: 0.25rem;
`;

const ByeLabel = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #86efac;
  font-size: 0.75rem;
  font-weight: 600;
  color: #15803d;
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

const DuplaOrigemText = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
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

// ============== BRACKET ==============

const BracketContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  overflow-x: auto;
`;

const BracketContent = styled.div`
  display: flex;
  gap: 2rem;
  min-width: max-content;
`;

const BracketColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 250px;
`;

const BracketTitle = styled.div`
  text-align: center;
  font-weight: 700;
  color: #111827;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #2563eb;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const BracketMatches = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
  gap: 1rem;
`;

const BracketMatch = styled.div`
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const BracketStatus = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
`;

const BracketBye = styled.div`
  text-align: center;
`;

const BracketTeam = styled.div<{ $isWinner?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.875rem;

  span:first-child {
    ${(props) =>
      props.$isWinner &&
      `
      font-weight: 700;
      color: #16a34a;
    `}
  }

  span:last-child {
    font-weight: 700;
  }
`;

const BracketDivider = styled.div`
  border-top: 1px solid #d1d5db;
  margin: 0.25rem 0;
`;

const ChampionBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 250px;
`;

const ChampionTitle = styled.div`
  text-align: center;
  font-weight: 700;
  color: #111827;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f59e0b;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const ChampionCard = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

const ChampionContent = styled.div`
  width: 100%;
  border: 4px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  text-align: center;
`;

const ChampionName = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: #92400e;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const ChampionScore = styled.div`
  font-size: 0.875rem;
  color: #b45309;
  margin-top: 0.5rem;
`;

// ============== COMPONENTE ==============

export const FaseEliminatoria: React.FC<FaseEliminatoriaProps> = ({
  etapaId,
  grupos,
}) => {
  const [confrontos, setConfrontos] = useState<ConfrontoEliminatorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confrontoSelecionado, setConfrontoSelecionado] =
    useState<ConfrontoEliminatorio | null>(null);
  const [visualizacao, setVisualizacao] = useState<"lista" | "bracket">(
    "lista"
  );
  const [faseAtual, setFaseAtual] = useState<TipoFase | "todas">("todas");
  const [etapaFinalizada, setEtapaFinalizada] = useState(false);

  const todosGruposCompletos = useMemo(() => {
    if (!grupos || grupos.length === 0) return false;
    return grupos.every((g) => g.completo);
  }, [grupos]);

  const isGrupoUnico = useMemo(() => {
    return grupos && grupos.length === 1;
  }, [grupos]);

  const partidasPendentes = useMemo(() => {
    if (!grupos) return 0;
    return grupos.reduce((total, g) => {
      return total + (g.totalPartidas - g.partidasFinalizadas);
    }, 0);
  }, [grupos]);

  const finalFinalizada = useMemo(() => {
    if (!confrontos || confrontos.length === 0) return false;
    const confrontoFinal = confrontos.find((c) => c.fase === TipoFase.FINAL);
    if (!confrontoFinal) return false;
    return confrontoFinal.status === StatusConfrontoEliminatorio.FINALIZADA;
  }, [confrontos]);

  const grupoUnicoCompleto = useMemo(() => {
    if (!isGrupoUnico) return false;
    return grupos[0]?.completo || false;
  }, [isGrupoUnico, grupos]);

  useEffect(() => {
    const verificarStatusEtapa = async () => {
      try {
        const etapa = await etapaService.buscarPorId(etapaId);
        if (etapa) {
          setEtapaFinalizada(etapa.status === "finalizada");
        }
      } catch (error) {}
    };

    verificarStatusEtapa();
  }, [etapaId]);

  useEffect(() => {
    carregarConfrontos();
  }, [etapaId, faseAtual]);

  const carregarConfrontos = async () => {
    try {
      setLoading(true);
      setErro(null);

      const fase = faseAtual === "todas" ? undefined : faseAtual;
      const dados = await chaveService.buscarConfrontosEliminatorios(
        etapaId,
        fase
      );

      setConfrontos(dados);
    } catch (err: any) {
      setErro(err.message || "Erro ao carregar confrontos");
    } finally {
      setLoading(false);
    }
  };

  const gerarEliminatoria = async () => {
    if (!confirm("Gerar fase eliminatória? Esta ação não pode ser desfeita!")) {
      return;
    }

    try {
      setLoading(true);
      await chaveService.gerarFaseEliminatoria(etapaId, 2);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(" Fase eliminatória gerada com sucesso!");
      await carregarConfrontos();
    } catch (err: any) {
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelarEliminatoria = async () => {
    if (
      !confirm(
        " ATENÇÃO!\n\n" +
          "Cancelar a fase eliminatória irá:\n" +
          "• Excluir TODOS os confrontos eliminatórios\n" +
          "• Excluir TODAS as partidas da eliminatória\n" +
          "• Permitir ajustar resultados da fase de grupos\n" +
          "• Permitir gerar a eliminatória novamente\n\n" +
          "Esta ação NÃO pode ser desfeita!\n\n" +
          "Deseja continuar?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await chaveService.cancelarFaseEliminatoria(etapaId);
      alert(
        " Fase eliminatória cancelada!\n\n" +
          "Você pode agora:\n" +
          "• Ajustar resultados da fase de grupos\n" +
          "• Gerar a eliminatória novamente"
      );
      await carregarConfrontos();
    } catch (err: any) {
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const encerrarEtapa = async () => {
    if (
      !confirm(
        "Encerrar Etapa?\n\n" +
          "Isso irá marcar a etapa como finalizada.\n" +
          "O campeão foi definido!\n\n" +
          "Deseja continuar?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await etapaService.encerrarEtapa(etapaId);
      alert("Etapa encerrada com sucesso! ");
      window.location.reload();
    } catch (err: any) {
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getNomeFase = (fase: TipoFase): string => {
    const nomes = {
      [TipoFase.OITAVAS]: "Oitavas de Final",
      [TipoFase.QUARTAS]: "Quartas de Final",
      [TipoFase.SEMIFINAL]: "Semifinal",
      [TipoFase.FINAL]: "Final",
    };
    return nomes[fase] || fase;
  };

  const getStatusBadge = (status: StatusConfrontoEliminatorio) => {
    const labels = {
      [StatusConfrontoEliminatorio.BYE]: " BYE",
      [StatusConfrontoEliminatorio.AGENDADA]: " Aguardando",
      [StatusConfrontoEliminatorio.FINALIZADA]: " Finalizada",
    };
    return <StatusBadge $status={status}>{labels[status]}</StatusBadge>;
  };

  const agruparPorFase = () => {
    const grupos: Record<TipoFase, ConfrontoEliminatorio[]> = {
      [TipoFase.OITAVAS]: [],
      [TipoFase.QUARTAS]: [],
      [TipoFase.SEMIFINAL]: [],
      [TipoFase.FINAL]: [],
    };

    if (confrontos && Array.isArray(confrontos)) {
      confrontos.forEach((c) => {
        grupos[c.fase].push(c);
      });
    }

    return grupos;
  };

  const contarStatus = (fase: ConfrontoEliminatorio[]) => {
    const finalizados = fase.filter(
      (c) =>
        c.status === StatusConfrontoEliminatorio.FINALIZADA ||
        c.status === StatusConfrontoEliminatorio.BYE
    ).length;
    return `${finalizados}/${fase.length}`;
  };

  if (loading && (!confrontos || confrontos.length === 0)) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (erro) {
    return (
      <EmptyStateCard>
        <EmptyStateContent>
          <ErrorBox>❌ {erro}</ErrorBox>
          <ButtonGroup>
            <Button onClick={carregarConfrontos}>🔄 Tentar Novamente</Button>
          </ButtonGroup>
        </EmptyStateContent>
      </EmptyStateCard>
    );
  }

  if (!confrontos || confrontos.length === 0) {
    return (
      <EmptyStateCard>
        <EmptyStateContent>
          <EmptyTitle>Fase Eliminatória</EmptyTitle>

          {isGrupoUnico ? (
            <>
              <AlertBox $variant="success">
                <h4>Grupo Único - Sistema Round-Robin</h4>
                <p>
                  Com apenas 1 grupo, todos os jogadores já se enfrentaram no
                  sistema <strong>Todos contra Todos</strong>.
                </p>
                <InfoBox>
                  <InfoText>
                    <strong>Sistema:</strong> Round-Robin (Todos contra Todos)
                  </InfoText>
                  <InfoText>
                    O <strong>1º colocado</strong> do grupo é automaticamente o{" "}
                    <strong>CAMPEÃO</strong>!
                  </InfoText>
                </InfoBox>
              </AlertBox>

              {/*  Verificar se grupo está completo */}
              {grupoUnicoCompleto ? (
                <>
                  {/*  Se etapa já finalizada */}
                  {etapaFinalizada ? (
                    <AlertBox $variant="success">
                      <h4>Etapa Finalizada!</h4>
                      <p>
                        Esta etapa já foi encerrada. O campeão foi definido e os
                        pontos foram atribuídos.
                      </p>
                    </AlertBox>
                  ) : (
                    /*  Se grupo completo mas etapa não finalizada */
                    <>
                      <AlertBox $variant="warning">
                        <h4>Grupo Completo!</h4>
                        <p>
                          Todas as partidas foram finalizadas. O campeão está
                          definido!
                        </p>
                        <InfoBox>
                          <InfoText>
                            <strong>Próximo passo:</strong> Encerre a etapa para
                            atribuir pontos ao ranking.
                          </InfoText>
                        </InfoBox>
                      </AlertBox>

                      <ButtonGroup>
                        <Button
                          $variant="warning"
                          onClick={encerrarEtapa}
                          disabled={loading}
                        >
                          <span>Encerrar Etapa e Atribuir Pontos</span>
                        </Button>
                      </ButtonGroup>
                    </>
                  )}
                </>
              ) : (
                /*  Grupo ainda não completo */
                <AlertBox $variant="warning">
                  <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                    Finalize todas as partidas do grupo primeiro
                  </p>
                  <p style={{ fontSize: "0.875rem", margin: 0 }}>
                    Ainda há {partidasPendentes} partida(s) pendente(s).
                    <br />
                    Complete todos os jogos para definir o campeão.
                  </p>
                </AlertBox>
              )}

              <HintText>
                Para ter fase eliminatória, configure a etapa com 2 ou mais
                grupos
              </HintText>
            </>
          ) : !todosGruposCompletos ? (
            <>
              <AlertBox $variant="warning">
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Finalize todas as partidas da fase de grupos primeiro
                </p>
                <p style={{ fontSize: "0.875rem", margin: 0 }}>
                  Ainda há {partidasPendentes} partida(s) pendente(s) nos
                  grupos.
                  <br />
                  Complete todos os jogos para gerar a fase eliminatória.
                </p>
              </AlertBox>
              <Button disabled>Gerar Fase Eliminatória</Button>
            </>
          ) : (
            <>
              <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                A fase de grupos foi concluída! Gere a fase eliminatória para
                continuar o torneio.
              </p>
              <ButtonGroup>
                <Button onClick={gerarEliminatoria} disabled={loading}>
                  Gerar Fase Eliminatória
                </Button>
              </ButtonGroup>
            </>
          )}
        </EmptyStateContent>
      </EmptyStateCard>
    );
  }

  const confrontosPorFase = agruparPorFase();
  const fasesComConfrontos = Object.entries(confrontosPorFase).filter(
    ([_, c]) => c && c.length > 0
  );

  return (
    <Container>
      <Header>
        <h2>Fase Eliminatória</h2>
        <p>Confrontos mata-mata até o campeão!</p>
      </Header>

      <ActionsRow>
        <Button
          $variant="danger"
          onClick={cancelarEliminatoria}
          disabled={loading || etapaFinalizada}
        >
          <span>Cancelar Eliminatória</span>
        </Button>
        {/*  Botão com estados */}
        {finalFinalizada && (
          <>
            <Button
              $variant="warning"
              onClick={encerrarEtapa}
              disabled={loading || etapaFinalizada}
            >
              <span>
                {etapaFinalizada ? "Etapa Encerrada " : "Encerrar Etapa "}
              </span>
            </Button>
            {etapaFinalizada && (
              <AlertBox $variant="success">
                <h4>Etapa Finalizada!</h4>
                <p>
                  Esta etapa já foi encerrada. O campeão foi definido e os
                  pontos foram atribuídos.
                </p>
              </AlertBox>
            )}
          </>
        )}
      </ActionsRow>

      <Controls>
        <ToggleGroup>
          <ToggleButton
            $active={visualizacao === "lista"}
            onClick={() => setVisualizacao("lista")}
          >
            Lista
          </ToggleButton>
          <ToggleButton
            $active={visualizacao === "bracket"}
            onClick={() => setVisualizacao("bracket")}
          >
            Bracket
          </ToggleButton>
        </ToggleGroup>

        <Select
          value={faseAtual}
          onChange={(e) => setFaseAtual(e.target.value as TipoFase | "todas")}
        >
          <option value="todas">Todas as Fases</option>
          {fasesComConfrontos.map(([fase]) => (
            <option key={fase} value={fase}>
              {getNomeFase(fase as TipoFase)}
            </option>
          ))}
        </Select>
      </Controls>

      {erro && <ErrorBox>❌ {erro}</ErrorBox>}

      {visualizacao === "lista" ? (
        <VisualizacaoLista
          confrontosPorFase={confrontosPorFase}
          fasesComConfrontos={fasesComConfrontos}
          getNomeFase={getNomeFase}
          getStatusBadge={getStatusBadge}
          contarStatus={contarStatus}
          setConfrontoSelecionado={setConfrontoSelecionado}
          etapaFinalizada={etapaFinalizada}
        />
      ) : (
        <VisualizacaoBracket
          confrontosPorFase={confrontosPorFase}
          getNomeFase={getNomeFase}
          getStatusBadge={getStatusBadge}
          setConfrontoSelecionado={setConfrontoSelecionado}
          etapaFinalizada={etapaFinalizada}
        />
      )}

      {confrontoSelecionado && (
        <ModalRegistrarResultadoEliminatorio
          confronto={confrontoSelecionado}
          onClose={() => setConfrontoSelecionado(null)}
          onSuccess={() => {
            setConfrontoSelecionado(null);
            carregarConfrontos();
          }}
        />
      )}
    </Container>
  );
};

// ============== VISUALIZAÇÃO LISTA ==============

const VisualizacaoLista: React.FC<{
  confrontosPorFase: Record<TipoFase, ConfrontoEliminatorio[]>;
  fasesComConfrontos: [string, ConfrontoEliminatorio[]][];
  getNomeFase: (fase: TipoFase) => string;
  getStatusBadge: (status: StatusConfrontoEliminatorio) => JSX.Element;
  contarStatus: (fase: ConfrontoEliminatorio[]) => string;
  setConfrontoSelecionado: (confronto: ConfrontoEliminatorio) => void;
  etapaFinalizada: boolean;
}> = ({
  fasesComConfrontos,
  getNomeFase,
  getStatusBadge,
  contarStatus,
  setConfrontoSelecionado,
  etapaFinalizada,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {fasesComConfrontos.map(([fase, confrontos]) => (
        <FaseCard key={fase}>
          <FaseHeader>
            <FaseTitle>{getNomeFase(fase as TipoFase)}</FaseTitle>
            <FaseStatus>{contarStatus(confrontos)} completos</FaseStatus>
          </FaseHeader>

          <ConfrontosList>
            {confrontos.map((confronto) => (
              <ConfrontoCard key={confronto.id}>
                {/* HEADER - Igual PartidasGrupo */}
                <ConfrontoHeader>
                  <ConfrontoInfo>
                    <ConfrontoLabel>CONFRONTO {confronto.ordem}</ConfrontoLabel>
                    <StatusInfo>{getStatusBadge(confronto.status)}</StatusInfo>
                  </ConfrontoInfo>
                </ConfrontoHeader>

                {/* BYE */}
                {confronto.status === StatusConfrontoEliminatorio.BYE ? (
                  <ByeBox>
                    <ByeTeam>{confronto.dupla1Nome}</ByeTeam>
                    <ByeOrigin>({confronto.dupla1Origem})</ByeOrigin>
                    <ByeLabel>Classificado automaticamente (BYE)</ByeLabel>
                  </ByeBox>
                ) : (
                  <>
                    {/* CONTENT - Igual PartidasGrupo */}
                    <ConfrontoContent>
                      {/* DUPLA 1 */}
                      <DuplaRow>
                        <div>
                          <DuplaNome
                            $isWinner={
                              confronto.vencedoraId === confronto.dupla1Id
                            }
                          >
                            {confronto.dupla1Nome}
                          </DuplaNome>
                          <DuplaOrigemText>
                            ({confronto.dupla1Origem})
                          </DuplaOrigemText>
                        </div>
                        {confronto.status ===
                          StatusConfrontoEliminatorio.FINALIZADA &&
                          confronto.placar && (
                            <Score>{confronto.placar.split("-")[0]}</Score>
                          )}
                      </DuplaRow>

                      {/* VS */}
                      <VsSeparator>
                        <span>VS</span>
                      </VsSeparator>

                      {/* DUPLA 2 */}
                      <DuplaRow>
                        <div>
                          <DuplaNome
                            $isWinner={
                              confronto.vencedoraId === confronto.dupla2Id
                            }
                          >
                            {confronto.dupla2Nome}
                          </DuplaNome>
                          <DuplaOrigemText>
                            ({confronto.dupla2Origem})
                          </DuplaOrigemText>
                        </div>
                        {confronto.status ===
                          StatusConfrontoEliminatorio.FINALIZADA &&
                          confronto.placar && (
                            <Score>{confronto.placar.split("-")[1]}</Score>
                          )}
                      </DuplaRow>
                    </ConfrontoContent>

                    {/* PLACAR DETALHADO - Igual PartidasGrupo */}
                    {confronto.status ===
                      StatusConfrontoEliminatorio.FINALIZADA && (
                      <PlacarDetalhado>
                        <PlacarInfo>
                          <span>Vencedor:</span>
                          <span style={{ fontWeight: 700, color: "#16a34a" }}>
                            {confronto.vencedoraNome}
                          </span>
                        </PlacarInfo>
                      </PlacarDetalhado>
                    )}

                    {/* ACTION SECTION - Igual PartidasGrupo */}
                    {confronto.status ===
                      StatusConfrontoEliminatorio.AGENDADA && (
                      <ActionSection>
                        <ActionButton
                          $variant="register"
                          onClick={() => setConfrontoSelecionado(confronto)}
                        >
                          <span>Registrar Resultado</span>
                        </ActionButton>
                      </ActionSection>
                    )}

                    {confronto.status ===
                      StatusConfrontoEliminatorio.FINALIZADA && (
                      <ActionSection>
                        <ActionButton
                          $variant={etapaFinalizada ? "disabled" : "edit"}
                          onClick={() =>
                            !etapaFinalizada &&
                            setConfrontoSelecionado(confronto)
                          }
                          disabled={etapaFinalizada}
                        >
                          <span>
                            {etapaFinalizada
                              ? "🔒 Etapa Finalizada"
                              : "Editar Resultado"}{" "}
                          </span>
                        </ActionButton>
                      </ActionSection>
                    )}
                  </>
                )}
              </ConfrontoCard>
            ))}
          </ConfrontosList>
        </FaseCard>
      ))}
    </div>
  );
};

// ============== VISUALIZAÇÃO BRACKET ==============

const VisualizacaoBracket: React.FC<{
  confrontosPorFase: Record<TipoFase, ConfrontoEliminatorio[]>;
  getNomeFase: (fase: TipoFase) => string;
  getStatusBadge: (status: StatusConfrontoEliminatorio) => JSX.Element;
  setConfrontoSelecionado: (confronto: ConfrontoEliminatorio) => void;
  etapaFinalizada: boolean;
}> = ({
  confrontosPorFase,
  getNomeFase,
  getStatusBadge,
  setConfrontoSelecionado,
  etapaFinalizada,
}) => {
  const fases = [
    TipoFase.OITAVAS,
    TipoFase.QUARTAS,
    TipoFase.SEMIFINAL,
    TipoFase.FINAL,
  ].filter((f) => confrontosPorFase[f].length > 0);

  return (
    <BracketContainer>
      <BracketContent>
        {fases.map((fase) => (
          <BracketColumn key={fase}>
            <BracketTitle>{getNomeFase(fase)}</BracketTitle>

            <BracketMatches>
              {confrontosPorFase[fase].map((confronto) => (
                <BracketMatch
                  key={confronto.id}
                  onClick={() => {
                    if (
                      confronto.status !== StatusConfrontoEliminatorio.BYE &&
                      !etapaFinalizada
                    ) {
                      setConfrontoSelecionado(confronto);
                    }
                  }}
                  style={{
                    cursor: etapaFinalizada ? "not-allowed" : "pointer",
                    opacity: etapaFinalizada ? 0.6 : 1,
                  }}
                >
                  <BracketStatus>
                    {getStatusBadge(confronto.status)}
                  </BracketStatus>

                  {confronto.status === StatusConfrontoEliminatorio.BYE ? (
                    <BracketBye>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#166534",
                          fontSize: "0.875rem",
                        }}
                      >
                        {confronto.dupla1Nome}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#16a34a",
                          marginTop: "0.25rem",
                        }}
                      >
                        BYE
                      </div>
                    </BracketBye>
                  ) : (
                    <>
                      <BracketTeam
                        $isWinner={confronto.vencedoraId === confronto.dupla1Id}
                      >
                        <span>
                          {confronto.dupla1Nome?.split("&")[0].trim()}
                        </span>
                        {confronto.placar && (
                          <span>{confronto.placar.split("-")[0]}</span>
                        )}
                      </BracketTeam>

                      <BracketDivider />

                      <BracketTeam
                        $isWinner={confronto.vencedoraId === confronto.dupla2Id}
                      >
                        <span>
                          {confronto.dupla2Nome?.split("&")[0].trim()}
                        </span>
                        {confronto.placar && (
                          <span>{confronto.placar.split("-")[1]}</span>
                        )}
                      </BracketTeam>
                    </>
                  )}
                </BracketMatch>
              ))}
            </BracketMatches>
          </BracketColumn>
        ))}

        {confrontosPorFase[TipoFase.FINAL].length > 0 &&
          confrontosPorFase[TipoFase.FINAL][0].status ===
            StatusConfrontoEliminatorio.FINALIZADA && (
            <ChampionBox>
              <ChampionTitle>CAMPEÃO</ChampionTitle>
              <ChampionCard>
                <ChampionContent>
                  <ChampionName>
                    {confrontosPorFase[TipoFase.FINAL][0].vencedoraNome}
                  </ChampionName>
                  <ChampionScore>
                    Placar final: {confrontosPorFase[TipoFase.FINAL][0].placar}
                  </ChampionScore>
                </ChampionContent>
              </ChampionCard>
            </ChampionBox>
          )}
      </BracketContent>
    </BracketContainer>
  );
};

export default FaseEliminatoria;
