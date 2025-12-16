import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getTeamsService } from "@/services";
import {
  Equipe,
  ConfrontoEquipe,
  StatusConfronto,
  VarianteTeams,
  PartidaTeams,
  TipoFormacaoJogos,
} from "@/types/teams";
import { FaseEtapa } from "@/types/chave";
import { LoadingOverlay } from "@/components/ui";
import { ModalLancamentoResultadosLoteTeams } from "../ModalLancamentoResultadosLoteTeams";
import { ModalDefinirJogadoresPartida } from "../ModalDefinirJogadoresPartida";

interface ChavesTeamsProps {
  etapaId: string;
  arenaId?: string;
  varianteTeams?: VarianteTeams;
  tipoFormacaoJogos?: TipoFormacaoJogos;
  etapaFinalizada?: boolean;
  onAtualizar?: () => void;
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #581c87;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const VarianteBadge = styled.span`
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const Stats = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const TabContainer = styled.div`
  margin-top: 1rem;
`;

const TabNav = styled.div`
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  gap: 0.5rem;
  overflow-x: auto;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
  white-space: nowrap;

  ${(props) =>
    props.$active
      ? `
    color: #059669;
    border-bottom-color: #059669;
  `
      : `
    color: #6b7280;
    &:hover {
      color: #374151;
    }
  `}
`;

const TabContent = styled.div`
  padding: 1.5rem 0;
`;

const GrupoSection = styled.div`
  margin-bottom: 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const GrupoHeader = styled.div<{ $grupo: string }>`
  background: ${(props) => {
    switch (props.$grupo) {
      case "A":
        return "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
      case "B":
        return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      default:
        return "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)";
    }
  }};
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const GrupoTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const GrupoStats = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
`;

const GrupoContent = styled.div`
  padding: 1rem;
`;

const EquipesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const EquipeCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const EquipeHeader = styled.div<{ $posicao: number }>`
  background: ${(props) => {
    if (props.$posicao === 1) return "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
    if (props.$posicao === 2) return "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
    if (props.$posicao === 3) return "linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)";
    return "linear-gradient(135deg, #059669 0%, #047857 100%)";
  }};
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EquipeNome = styled.h4`
  color: white;
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
`;

const EquipeNomeInput = styled.input`
  color: white;
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  outline: none;

  &:focus {
    border-color: white;
    background: rgba(255, 255, 255, 0.3);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const EditButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0.375rem;
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const PosicaoBadge = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
`;

const EquipeContent = styled.div`
  padding: 0.75rem;
`;

const JogadoresList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
`;

const JogadorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem;
  background: #f9fafb;
  border-radius: 0.375rem;
`;

const JogadorNome = styled.span`
  font-weight: 500;
  color: #374151;
  font-size: 0.8125rem;
  flex: 1;
`;

const NivelBadge = styled.span<{ $nivel: string }>`
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$nivel) {
      case "iniciante":
        return `background: #dcfce7; color: #166534;`;
      case "intermediario":
        return `background: #fef3c7; color: #92400e;`;
      case "avancado":
        return `background: #fee2e2; color: #991b1b;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
`;

const GeneroBadge = styled.span<{ $genero: string }>`
  padding: 0.125rem 0.25rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$genero) {
      case "masculino":
        return `background: #dbeafe; color: #1e40af;`;
      case "feminino":
        return `background: #fce7f3; color: #9d174d;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.5rem;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
`;

const StatLabel = styled.div`
  font-size: 0.625rem;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
`;

const StatValue = styled.div<{ $variant?: "primary" | "success" | "error" | "neutral" }>`
  font-weight: 700;
  font-size: 0.875rem;

  color: ${(props) => {
    switch (props.$variant) {
      case "primary":
        return "#059669";
      case "success":
        return "#16a34a";
      case "error":
        return "#dc2626";
      default:
        return "#374151";
    }
  }};
`;

const ConfrontosSection = styled.div`
  border-top: 2px solid #e5e7eb;
  padding-top: 1rem;
`;

const ConfrontosHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ConfrontosTitulo = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
`;

const ConfrontosList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ConfrontoCard = styled.div<{ $status: StatusConfronto }>`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid ${(props) => {
    switch (props.$status) {
      case StatusConfronto.FINALIZADO:
        return "#bbf7d0";
      case StatusConfronto.EM_ANDAMENTO:
        return "#bfdbfe";
      default:
        return "#e5e7eb";
    }
  }};
  overflow: hidden;
`;

const ConfrontoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ConfrontoEquipes = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 200px;
`;

const ConfrontoEquipeNome = styled.span<{ $isWinner?: boolean }>`
  font-weight: ${(props) => (props.$isWinner ? 700 : 500)};
  color: ${(props) => (props.$isWinner ? "#166534" : "#374151")};
  font-size: 0.875rem;
`;

const ConfrontoPlacar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  min-width: 50px;
  justify-content: center;
`;

const ConfrontoActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ActionButton = styled.button<{ $variant?: "primary" | "secondary" | "warning" }>`
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.375rem;

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

const StatusBadge = styled.span<{ $status: StatusConfronto }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
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

const PartidasExpanded = styled.div`
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem;
`;

const PartidasGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PartidaItem = styled.div<{ $status: string }>`
  background: white;
  border: 1px solid ${(props) => (props.$status === "finalizada" ? "#bbf7d0" : "#e5e7eb")};
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PartidaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
`;

const PartidaLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
`;

const TipoBadge = styled.span<{ $tipo: string }>`
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$tipo) {
      case "feminino":
        return `background: #fce7f3; color: #9d174d;`;
      case "masculino":
        return `background: #dbeafe; color: #1e40af;`;
      case "decider":
        return `background: #fef3c7; color: #92400e;`;
      default:
        return `background: #e5e7eb; color: #374151;`;
    }
  }}
`;

const PartidaDuplas = styled.span`
  font-size: 0.75rem;
  color: #374151;
`;

const PartidaPlacar = styled.span`
  font-weight: 700;
  font-size: 0.875rem;
  color: #111827;
`;

const DeciderAlert = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #92400e;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
`;

const Spinner = styled.div`
  width: 2.5rem;
  height: 2.5rem;
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

const ErrorContainer = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #991b1b;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
  font-size: 0.9375rem;
`;

const InfoCard = styled.div`
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1.5rem;

  h4 {
    color: #166534;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    font-size: 0.9375rem;
  }

  p {
    color: #166534;
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.25rem;
    color: #166534;
    font-size: 0.875rem;
  }

  li {
    margin-top: 0.25rem;
  }
`;

// Styled component para fases eliminatórias
const FaseSection = styled.section`
  margin-bottom: 2rem;
`;

const FaseHeader = styled.div<{ $tipo: string }>`
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
`;

const FaseTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const FaseContent = styled.div`
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  padding: 1rem;
  background: #fafafa;
`;

// ============== HELPERS ==============

const getNivelLabel = (nivel?: string): string => {
  if (!nivel) return "";
  switch (nivel) {
    case "iniciante":
      return "INI";
    case "intermediario":
      return "INT";
    case "avancado":
      return "AVA";
    default:
      return nivel.substring(0, 3).toUpperCase();
  }
};

const getGeneroLabel = (genero?: string): string => {
  if (!genero) return "";
  switch (genero) {
    case "masculino":
      return "M";
    case "feminino":
      return "F";
    default:
      return "";
  }
};

const getVarianteInfo = (
  variante?: VarianteTeams
): { nome: string; jogadoresPorEquipe: number; jogosPorConfronto: number } => {
  switch (variante) {
    case VarianteTeams.TEAMS_4:
      return { nome: "TEAMS 4", jogadoresPorEquipe: 4, jogosPorConfronto: 2 };
    case VarianteTeams.TEAMS_6:
      return { nome: "TEAMS 6", jogadoresPorEquipe: 6, jogosPorConfronto: 3 };
    default:
      return { nome: "TEAMS", jogadoresPorEquipe: 4, jogosPorConfronto: 2 };
  }
};

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

const getTipoJogoLabel = (tipo?: string): string => {
  if (!tipo) return "";
  switch (tipo) {
    case "feminino":
      return "FEM";
    case "masculino":
      return "MASC";
    case "misto":
      return "MISTO";
    case "decider":
      return "DECIDER";
    default:
      return tipo.toUpperCase();
  }
};

// ============== COMPONENTE ==============

export const ChavesTeams: React.FC<ChavesTeamsProps> = ({
  etapaId,
  varianteTeams,
  tipoFormacaoJogos,
  etapaFinalizada = false,
  onAtualizar,
}) => {
  const teamsService = getTeamsService();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [confrontos, setConfrontos] = useState<ConfrontoEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"grupos" | "eliminatoria">("grupos");
  const [editandoEquipeId, setEditandoEquipeId] = useState<string | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");
  const [confrontoExpandido, setConfrontoExpandido] = useState<string | null>(null);
  const [partidasConfronto, setPartidasConfronto] = useState<Map<string, PartidaTeams[]>>(new Map());

  // Estado global de loading para operações críticas
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState("");

  // Estado para modals
  const [modalResultados, setModalResultados] = useState<{
    confronto: ConfrontoEquipe;
    partidas: PartidaTeams[];
  } | null>(null);
  const [modalDefinirJogadores, setModalDefinirJogadores] = useState<{
    partida: PartidaTeams;
    equipe1: Equipe;
    equipe2: Equipe;
    partidasConfronto: PartidaTeams[];
  } | null>(null);

  const varianteInfo = getVarianteInfo(varianteTeams);
  const isFormacaoManual = tipoFormacaoJogos === TipoFormacaoJogos.MANUAL;

  useEffect(() => {
    carregarDados();
  }, [etapaId]);

  const carregarDados = async (silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }
      setError(null);

      const [equipesData, confrontosData] = await Promise.all([
        teamsService.buscarEquipes(etapaId),
        teamsService.buscarConfrontos(etapaId),
      ]);

      // Ordenar equipes por posicao ou pontos
      const equipesOrdenadas = [...equipesData].sort((a, b) => {
        if (a.posicao !== undefined && b.posicao !== undefined) {
          return a.posicao - b.posicao;
        }
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        if (a.saldoJogos !== b.saldoJogos) return b.saldoJogos - a.saldoJogos;
        if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
        return a.nome.localeCompare(b.nome);
      });

      setEquipes(equipesOrdenadas);
      setConfrontos(confrontosData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarComNotificacao = async () => {
    await carregarDados(true);
    if (onAtualizar) {
      onAtualizar();
    }
  };

  const handleRenomearEquipe = async (equipeId: string, novoNome: string) => {
    try {
      await teamsService.renomearEquipe(etapaId, equipeId, novoNome);
      setEquipes((prev) =>
        prev.map((eq) => (eq.id === equipeId ? { ...eq, nome: novoNome } : eq))
      );
      setEditandoEquipeId(null);
      setNomeEditando("");
    } catch (err: any) {
      alert(err.message || "Erro ao renomear equipe");
    }
  };

  const handleIniciarEdicao = (equipe: Equipe) => {
    setEditandoEquipeId(equipe.id);
    setNomeEditando(equipe.nome);
  };

  const handleCancelarEdicao = () => {
    setEditandoEquipeId(null);
    setNomeEditando("");
  };

  const handleSalvarNome = (equipeId: string) => {
    if (nomeEditando.trim()) {
      handleRenomearEquipe(equipeId, nomeEditando.trim());
    } else {
      handleCancelarEdicao();
    }
  };

  const handleExpandirConfronto = async (confrontoId: string, confronto?: ConfrontoEquipe) => {
    if (confrontoExpandido === confrontoId) {
      setConfrontoExpandido(null);
      return;
    }

    try {
      // Verificar se o confronto tem partidas geradas
      const temPartidasGeradas = confronto?.partidas && confronto.partidas.length > 0;

      // Se não tem partidas, gerar automaticamente
      if (confronto && !temPartidasGeradas) {
        setGlobalLoading(true);
        setGlobalLoadingMessage("Gerando partidas...");
        await teamsService.gerarPartidasConfronto(etapaId, confrontoId);

        // Limpar cache e recarregar dados
        setPartidasConfronto((prev) => {
          const novo = new Map(prev);
          novo.delete(confrontoId);
          return novo;
        });
        await carregarDados(true);
        setGlobalLoading(false);
        setGlobalLoadingMessage("");
      }

      // Buscar partidas do confronto se não estiverem em cache
      if (!partidasConfronto.has(confrontoId)) {
        const partidas = await teamsService.buscarPartidasConfronto(etapaId, confrontoId);
        setPartidasConfronto((prev) => new Map(prev).set(confrontoId, partidas));
      }
      setConfrontoExpandido(confrontoId);
    } catch (err: any) {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
      alert(err.message || "Erro ao carregar partidas");
    }
  };

  const handleGerarDecider = async (confrontoId: string) => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Gerando decider...");
      await teamsService.gerarDecider(etapaId, confrontoId);

      // Limpar cache e recarregar
      setPartidasConfronto((prev) => {
        const novo = new Map(prev);
        novo.delete(confrontoId);
        return novo;
      });
      await carregarDados(true);
    } catch (err: any) {
      alert(err.message || "Erro ao gerar decider");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  const handleAbrirModalResultados = async (confronto: ConfrontoEquipe) => {
    try {
      setGlobalLoading(true);

      // Verificar se o confronto tem partidas geradas
      const temPartidasGeradas = confronto.partidas && confronto.partidas.length > 0;

      // Se não tem partidas, gerar automaticamente antes de abrir o modal
      if (!temPartidasGeradas) {
        setGlobalLoadingMessage("Gerando partidas...");
        await teamsService.gerarPartidasConfronto(etapaId, confronto.id);

        // Limpar cache e recarregar dados para atualizar o confronto
        setPartidasConfronto((prev) => {
          const novo = new Map(prev);
          novo.delete(confronto.id);
          return novo;
        });
        await carregarDados(true);

        // Buscar o confronto atualizado
        const confrontosAtualizados = await teamsService.buscarConfrontos(etapaId);
        const confrontoAtualizado = confrontosAtualizados.find((c) => c.id === confronto.id);
        if (confrontoAtualizado) {
          confronto = confrontoAtualizado;
        }
      }

      setGlobalLoadingMessage("Carregando partidas...");

      let partidas = partidasConfronto.get(confronto.id);
      if (!partidas) {
        partidas = await teamsService.buscarPartidasConfronto(etapaId, confronto.id);
        setPartidasConfronto((prev) => new Map(prev).set(confronto.id, partidas!));
      }

      setModalResultados({ confronto, partidas });
    } catch (err: any) {
      alert(err.message || "Erro ao carregar partidas");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  const handleModalResultadosSuccess = async () => {
    // Limpar cache do confronto e recarregar tudo
    if (modalResultados) {
      setPartidasConfronto((prev) => {
        const novo = new Map(prev);
        novo.delete(modalResultados.confronto.id);
        return novo;
      });
    }
    setModalResultados(null);
    await handleAtualizarComNotificacao();
  };

  const handleDefinirJogadores = async (partida: PartidaTeams, confronto: ConfrontoEquipe) => {
    const equipe1 = equipes.find((e) => e.id === confronto.equipe1Id);
    const equipe2 = equipes.find((e) => e.id === confronto.equipe2Id);
    if (equipe1 && equipe2) {
      // Buscar partidas do confronto para validação de jogadores já usados
      let partConf = partidasConfronto.get(confronto.id);
      if (!partConf) {
        partConf = await teamsService.buscarPartidasConfronto(etapaId, confronto.id);
      }
      setModalDefinirJogadores({ partida, equipe1, equipe2, partidasConfronto: partConf || [] });
    }
  };

  const handleConfirmDefinirJogadores = async (dupla1Ids: [string, string], dupla2Ids: [string, string]) => {
    if (!modalDefinirJogadores) return;
    try {
      await teamsService.definirJogadoresPartida(
        etapaId,
        modalDefinirJogadores.partida.id,
        dupla1Ids,
        dupla2Ids
      );
      await handleJogadoresDefinidos();
    } catch (err: any) {
      throw err;
    }
  };

  const handleJogadoresDefinidos = async () => {
    // Recarregar partidas do confronto relacionado
    const partida = modalDefinirJogadores?.partida;
    if (partida) {
      try {
        // Buscar partidas atualizadas do confronto
        const partidasAtualizadas = await teamsService.buscarPartidasConfronto(etapaId, partida.confrontoId);
        setPartidasConfronto((prev) => new Map(prev).set(partida.confrontoId, partidasAtualizadas));
      } catch (error) {
        console.error("Erro ao recarregar partidas:", error);
        // Se falhar, limpar cache para forçar recarregamento na próxima vez
        setPartidasConfronto((prev) => {
          const novo = new Map(prev);
          novo.delete(partida.confrontoId);
          return novo;
        });
      }
    }
    setModalDefinirJogadores(null);
    await carregarDados(true);
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <strong>Erro:</strong> {error}
        </ErrorContainer>
      </Container>
    );
  }

  if (equipes.length === 0) {
    return (
      <Container>
        <EmptyState>Nenhuma equipe gerada ainda</EmptyState>
      </Container>
    );
  }

  // Verificar se tem fase de grupos
  const temFaseGrupos = equipes.some((e) => e.grupoId);

  // Agrupar equipes por grupo
  const equipesPorGrupo = temFaseGrupos
    ? equipes.reduce((acc, equipe) => {
        const grupoId = equipe.grupoId || "A";
        if (!acc[grupoId]) acc[grupoId] = [];
        acc[grupoId].push(equipe);
        return acc;
      }, {} as Record<string, Equipe[]>)
    : null;

  // Ordenar equipes dentro de cada grupo
  if (equipesPorGrupo) {
    Object.keys(equipesPorGrupo).forEach((grupoId) => {
      equipesPorGrupo[grupoId].sort((a, b) => {
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        if (a.saldoJogos !== b.saldoJogos) return b.saldoJogos - a.saldoJogos;
        if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
        return a.nome.localeCompare(b.nome);
      });
    });
  }

  // Separar confrontos por fase
  const confrontosGrupos = confrontos.filter((c) => c.fase === FaseEtapa.GRUPOS);
  const confrontosEliminatoria = confrontos.filter((c) => c.fase !== FaseEtapa.GRUPOS);

  // Agrupar confrontos de grupos por grupoId
  const confrontosPorGrupo = confrontosGrupos.reduce((acc, confronto) => {
    const grupoId = confronto.grupoId || "A";
    if (!acc[grupoId]) acc[grupoId] = [];
    acc[grupoId].push(confronto);
    return acc;
  }, {} as Record<string, ConfrontoEquipe[]>);

  const confrontosFinalizados = confrontos.filter(
    (c) => c.status === StatusConfronto.FINALIZADO
  ).length;

  const temConfrontosEliminatoria = confrontosEliminatoria.length > 0;

  // Renderizar card de equipe
  const renderEquipeCard = (equipe: Equipe, index: number) => {
    const estaEditando = editandoEquipeId === equipe.id;

    return (
      <EquipeCard key={equipe.id}>
        <EquipeHeader $posicao={index + 1}>
          {estaEditando ? (
            <EquipeNomeInput
              value={nomeEditando}
              onChange={(e) => setNomeEditando(e.target.value)}
              onBlur={() => handleSalvarNome(equipe.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSalvarNome(equipe.id);
                else if (e.key === "Escape") handleCancelarEdicao();
              }}
              autoFocus
              maxLength={50}
            />
          ) : (
            <EquipeNome>{equipe.nome}</EquipeNome>
          )}
          <HeaderActions>
            {!etapaFinalizada && !estaEditando && (
              <EditButton onClick={() => handleIniciarEdicao(equipe)} title="Renomear equipe">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </EditButton>
            )}
            <PosicaoBadge>#{index + 1}</PosicaoBadge>
          </HeaderActions>
        </EquipeHeader>

        <EquipeContent>
          <JogadoresList>
            {equipe.jogadores.map((jogador) => (
              <JogadorItem key={jogador.id}>
                <JogadorNome>{jogador.nome}</JogadorNome>
                {jogador.genero && (
                  <GeneroBadge $genero={jogador.genero}>{getGeneroLabel(jogador.genero)}</GeneroBadge>
                )}
                {jogador.nivel && (
                  <NivelBadge $nivel={jogador.nivel}>{getNivelLabel(jogador.nivel)}</NivelBadge>
                )}
              </JogadorItem>
            ))}
          </JogadoresList>

          <StatsGrid>
            <StatItem>
              <StatLabel>PTS</StatLabel>
              <StatValue $variant="primary">{equipe.pontos}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>V-D</StatLabel>
              <StatValue>{equipe.vitorias}-{equipe.derrotas}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>SJ</StatLabel>
              <StatValue $variant={equipe.saldoJogos > 0 ? "success" : equipe.saldoJogos < 0 ? "error" : "neutral"}>
                {equipe.saldoJogos > 0 ? "+" : ""}{equipe.saldoJogos}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>SG</StatLabel>
              <StatValue $variant={equipe.saldoGames > 0 ? "success" : equipe.saldoGames < 0 ? "error" : "neutral"}>
                {equipe.saldoGames > 0 ? "+" : ""}{equipe.saldoGames}
              </StatValue>
            </StatItem>
          </StatsGrid>
        </EquipeContent>
      </EquipeCard>
    );
  };

  // Renderizar confronto
  const renderConfronto = (confronto: ConfrontoEquipe) => {
    const isExpanded = confrontoExpandido === confronto.id;
    const isEquipe1Winner = confronto.vencedoraId === confronto.equipe1Id;
    const isEquipe2Winner = confronto.vencedoraId === confronto.equipe2Id;
    const equipesDefinidas = !!confronto.equipe1Id && !!confronto.equipe2Id;
    const precisaDecider =
      varianteTeams === VarianteTeams.TEAMS_4 &&
      confronto.jogosEquipe1 === 1 &&
      confronto.jogosEquipe2 === 1 &&
      confronto.status !== StatusConfronto.FINALIZADO &&
      !confronto.temDecider;
    const partidas = partidasConfronto.get(confronto.id) || [];

    return (
      <ConfrontoCard key={confronto.id} $status={confronto.status}>
        <ConfrontoRow>
          <ConfrontoEquipes>
            <ConfrontoEquipeNome $isWinner={isEquipe1Winner}>
              {confronto.equipe1Nome || confronto.equipe1Origem || "A definir"}
            </ConfrontoEquipeNome>
            <ConfrontoPlacar>
              <span>{confronto.jogosEquipe1}</span>
              <span style={{ color: "#9ca3af" }}>x</span>
              <span>{confronto.jogosEquipe2}</span>
            </ConfrontoPlacar>
            <ConfrontoEquipeNome $isWinner={isEquipe2Winner}>
              {confronto.equipe2Nome || confronto.equipe2Origem || "A definir"}
            </ConfrontoEquipeNome>
          </ConfrontoEquipes>

          <ConfrontoActions>
            <StatusBadge $status={confronto.status}>{getStatusLabel(confronto.status)}</StatusBadge>

            {!etapaFinalizada && equipesDefinidas && (
              <>
                <ActionButton
                  $variant={confronto.status === StatusConfronto.FINALIZADO ? "secondary" : "primary"}
                  onClick={() => handleAbrirModalResultados(confronto)}
                >
                  {confronto.status === StatusConfronto.FINALIZADO ? "Editar" : "Resultados"}
                </ActionButton>
                {precisaDecider && (
                  <ActionButton $variant="warning" onClick={() => handleGerarDecider(confronto.id)}>
                    Gerar Decider
                  </ActionButton>
                )}
              </>
            )}

            {equipesDefinidas && (
              <ActionButton onClick={() => handleExpandirConfronto(confronto.id, confronto)}>
                {isExpanded ? "Ocultar" : "Ver Partidas"}
              </ActionButton>
            )}
          </ConfrontoActions>
        </ConfrontoRow>

        {precisaDecider && (
          <DeciderAlert>
            Empate 1-1! Gere o Decider para definir o vencedor.
          </DeciderAlert>
        )}

        {isExpanded && partidas.length > 0 && (
          <PartidasExpanded>
            <PartidasGrid>
              {partidas.map((partida, idx) => {
                // Verifica se precisa definir jogadores (sem duplas definidas)
                const semJogadores = !partida.dupla1 || partida.dupla1.length === 0;
                const podeDefinirJogadores = semJogadores && !etapaFinalizada && partida.status !== "finalizada";
                const placarStr =
                  partida.status === "finalizada" && partida.placar?.length > 0
                    ? `${partida.placar[0].gamesDupla1} x ${partida.placar[0].gamesDupla2}`
                    : "-";

                // Montar label das duplas
                const dupla1Label = partida.dupla1?.length > 0
                  ? partida.dupla1.map((j) => j.nome).join(" / ")
                  : partida.equipe1Nome || "Equipe 1";
                const dupla2Label = partida.dupla2?.length > 0
                  ? partida.dupla2.map((j) => j.nome).join(" / ")
                  : partida.equipe2Nome || "Equipe 2";

                return (
                  <PartidaItem key={partida.id} $status={partida.status}>
                    <PartidaInfo>
                      <PartidaLabel>Jogo {idx + 1}</PartidaLabel>
                      {partida.tipoJogo && (
                        <TipoBadge $tipo={partida.tipoJogo}>{getTipoJogoLabel(partida.tipoJogo)}</TipoBadge>
                      )}
                      {!semJogadores && (
                        <PartidaDuplas>
                          {dupla1Label} vs {dupla2Label}
                        </PartidaDuplas>
                      )}
                      {podeDefinirJogadores && (
                        <ActionButton $variant="warning" onClick={() => handleDefinirJogadores(partida, confronto)}>
                          Definir Jogadores
                        </ActionButton>
                      )}
                      {semJogadores && !podeDefinirJogadores && (
                        <PartidaDuplas style={{ color: "#9ca3af", fontStyle: "italic" }}>
                          {dupla1Label} vs {dupla2Label} (sem jogadores definidos)
                        </PartidaDuplas>
                      )}
                    </PartidaInfo>
                    <PartidaPlacar>{placarStr}</PartidaPlacar>
                  </PartidaItem>
                );
              })}
            </PartidasGrid>
          </PartidasExpanded>
        )}
      </ConfrontoCard>
    );
  };

  // Renderizar seção de fase eliminatória
  const renderFaseEliminatoria = () => {
    const fases = [
      { fase: FaseEtapa.OITAVAS, nome: "Oitavas de Final", tipo: "oitavas" },
      { fase: FaseEtapa.QUARTAS, nome: "Quartas de Final", tipo: "quartas" },
      { fase: FaseEtapa.SEMIFINAL, nome: "Semifinais", tipo: "semifinal" },
      { fase: FaseEtapa.FINAL, nome: "Final", tipo: "final" },
    ];

    return (
      <>
        {fases.map(({ fase, nome, tipo }) => {
          const confrontosFase = confrontosEliminatoria
            .filter((c) => c.fase === fase)
            .sort((a, b) => a.ordem - b.ordem);

          if (confrontosFase.length === 0) return null;

          return (
            <FaseSection key={fase}>
              <FaseHeader $tipo={tipo}>
                <FaseTitle>{nome}</FaseTitle>
              </FaseHeader>
              <FaseContent>
                <ConfrontosList>
                  {confrontosFase.map(renderConfronto)}
                </ConfrontosList>
              </FaseContent>
            </FaseSection>
          );
        })}
      </>
    );
  };

  return (
    <Container>
      <Header>
        <Title>
          {varianteInfo.nome}
          <VarianteBadge>Equipes</VarianteBadge>
        </Title>
        <Stats>
          {equipes.length} equipes - {confrontos.length} confrontos ({confrontosFinalizados} finalizados)
        </Stats>
      </Header>

      <TabContainer>
        <TabNav>
          <TabButton $active={abaAtiva === "grupos"} onClick={() => setAbaAtiva("grupos")}>
            Fase de Grupos ({confrontosGrupos.length})
          </TabButton>
          {temConfrontosEliminatoria && (
            <TabButton $active={abaAtiva === "eliminatoria"} onClick={() => setAbaAtiva("eliminatoria")}>
              Eliminatória ({confrontosEliminatoria.length})
            </TabButton>
          )}
        </TabNav>

        <TabContent>
          {abaAtiva === "grupos" && (
            <>
              {temFaseGrupos && equipesPorGrupo ? (
                Object.keys(equipesPorGrupo).sort().map((grupoId) => {
                  const equipesGrupo = equipesPorGrupo[grupoId];
                  const confrontosGrupo = confrontosPorGrupo[grupoId] || [];
                  const confrontosGrupoFinalizados = confrontosGrupo.filter(
                    (c) => c.status === StatusConfronto.FINALIZADO
                  ).length;

                  return (
                    <GrupoSection key={grupoId}>
                      <GrupoHeader $grupo={grupoId}>
                        <GrupoTitle>Grupo {grupoId}</GrupoTitle>
                        <GrupoStats>
                          <span>{equipesGrupo.length} equipes</span>
                          <span>
                            {confrontosGrupoFinalizados}/{confrontosGrupo.length} confrontos
                          </span>
                        </GrupoStats>
                      </GrupoHeader>

                      <GrupoContent>
                        <EquipesGrid>
                          {equipesGrupo.map((equipe, index) => renderEquipeCard(equipe, index))}
                        </EquipesGrid>

                        {confrontosGrupo.length > 0 && (
                          <ConfrontosSection>
                            <ConfrontosHeader>
                              <ConfrontosTitulo>Confrontos do Grupo</ConfrontosTitulo>
                            </ConfrontosHeader>
                            <ConfrontosList>
                              {confrontosGrupo
                                .sort((a, b) => a.ordem - b.ordem)
                                .map(renderConfronto)}
                            </ConfrontosList>
                          </ConfrontosSection>
                        )}
                      </GrupoContent>
                    </GrupoSection>
                  );
                })
              ) : (
                // Sem grupos - todas equipes juntas
                <GrupoSection>
                  <GrupoHeader $grupo="A">
                    <GrupoTitle>Todas as Equipes</GrupoTitle>
                    <GrupoStats>
                      <span>{equipes.length} equipes</span>
                      <span>
                        {confrontosFinalizados}/{confrontosGrupos.length} confrontos
                      </span>
                    </GrupoStats>
                  </GrupoHeader>

                  <GrupoContent>
                    <EquipesGrid>
                      {equipes.map((equipe, index) => renderEquipeCard(equipe, index))}
                    </EquipesGrid>

                    {confrontosGrupos.length > 0 && (
                      <ConfrontosSection>
                        <ConfrontosHeader>
                          <ConfrontosTitulo>Confrontos</ConfrontosTitulo>
                        </ConfrontosHeader>
                        <ConfrontosList>
                          {confrontosGrupos
                            .sort((a, b) => a.ordem - b.ordem)
                            .map(renderConfronto)}
                        </ConfrontosList>
                      </ConfrontosSection>
                    )}
                  </GrupoContent>
                </GrupoSection>
              )}

              <InfoCard>
                <h4>Formato {varianteInfo.nome}</h4>
                <p>
                  Campeonato por equipes onde cada equipe tem {varianteInfo.jogadoresPorEquipe} jogadores.
                  {temFaseGrupos
                    ? " Com 6+ equipes: fase de grupos + eliminatórias (top 2 de cada grupo)."
                    : " As equipes jogam todas contra todas (round-robin)."}
                </p>
                <ul>
                  <li>Cada confronto tem {varianteInfo.jogosPorConfronto} jogos{varianteTeams === VarianteTeams.TEAMS_4 ? " (+1 decider se empate 1-1)" : ""}</li>
                  <li>Vitória no confronto = 3 pontos</li>
                  <li>Desempate: saldo de jogos, depois saldo de games</li>
                  {temFaseGrupos && <li>Os 2 melhores de cada grupo vão para as eliminatórias</li>}
                </ul>
              </InfoCard>
            </>
          )}

          {abaAtiva === "eliminatoria" && renderFaseEliminatoria()}
        </TabContent>
      </TabContainer>

      {/* Loading Overlay Global */}
      <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />

      {/* Modal de Resultados em Lote */}
      {modalResultados && (
        <ModalLancamentoResultadosLoteTeams
          etapaId={etapaId}
          confronto={modalResultados.confronto}
          partidas={modalResultados.partidas}
          equipes={equipes}
          tipoFormacaoManual={isFormacaoManual}
          etapaFinalizada={etapaFinalizada}
          onClose={() => setModalResultados(null)}
          onSuccess={handleModalResultadosSuccess}
        />
      )}

      {/* Modal para Definir Jogadores */}
      {modalDefinirJogadores && (
        <ModalDefinirJogadoresPartida
          isOpen={true}
          partida={modalDefinirJogadores.partida}
          equipe1Nome={modalDefinirJogadores.equipe1.nome}
          equipe2Nome={modalDefinirJogadores.equipe2.nome}
          equipe1Jogadores={modalDefinirJogadores.equipe1.jogadores}
          equipe2Jogadores={modalDefinirJogadores.equipe2.jogadores}
          partidasConfrontoComJogadores={modalDefinirJogadores.partidasConfronto}
          onClose={() => setModalDefinirJogadores(null)}
          onConfirm={handleConfirmDefinirJogadores}
        />
      )}
    </Container>
  );
};

export default ChavesTeams;
