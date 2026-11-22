import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getTeamsService, getEtapaService } from "@/services";
import {
  Equipe,
  ConfrontoEquipe,
  StatusConfronto,
  TipoJogoTeams,
  VarianteTeams,
  PartidaTeams,
  TipoFormacaoJogos,
} from "@/types/teams";
import { FaseEtapa } from "@/types/chave";
import { LoadingOverlay, Button, Badge, BadgeTom } from "@/components/ui";
import {
  CardConfronto,
  GrupoPainel,
  ListaConfrontos,
  TabelaClassificacao,
} from "@/components/torneio";
import { theme } from "@/styles/theme";
import { CoresStatus } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";
import {
  COLUNAS_ADMIN_TEAMS,
  linhasDeEquipes,
  ordenarEquipes,
} from "@/utils/classificacao";
import { ModalLancamentoResultadosLoteTeams } from "../ModalLancamentoResultadosLoteTeams";
import { ModalDefinirJogadoresPartida } from "../ModalDefinirJogadoresPartida";
import { ConfirmacaoAcao } from "@/components/modals/ConfirmacaoAcao";
import { invalidateRankingCache } from "@/components/jogadores/RankingList";
import { PainelEmpatesPendentes } from "../PainelEmpatesPendentes";

interface ChavesTeamsProps {
  etapaId: string;
  arenaId?: string;
  varianteTeams?: VarianteTeams;
  tipoFormacaoJogos?: TipoFormacaoJogos;
  etapaFinalizada?: boolean;
  melhorDe3?: boolean;
  melhorDe3Eliminatoria?: boolean;
  onAtualizar?: () => void;
}

// ============== STYLED COMPONENTS ==============

const { texto, superficie, acao, medalha, status } = theme.semantic;

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

const Espacado = styled.div`
  margin-bottom: 1.5rem;
`;

const PainelConteudo = styled.div`
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

const coresDaPosicao = (posicao: number): CoresStatus => {
  if (posicao === 1) return medalha.ouro;
  if (posicao === 2) return medalha.prata;
  if (posicao === 3) return medalha.bronze;
  return status.neutro;
};

const EquipeHeader = styled.div<{ $posicao: number }>`
  background: ${({ $posicao }) => coresDaPosicao($posicao).fundo};
  border-bottom: 1px solid ${({ $posicao }) => coresDaPosicao($posicao).borda};
  color: ${({ $posicao }) => coresDaPosicao($posicao).texto};
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const EquipeNome = styled.h4`
  color: inherit;
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
`;

const EquipeNomeInput = styled.input`
  color: ${texto.principal};
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
  min-width: 0;
  background: ${superficie.fundo};
  border: 1px solid ${superficie.bordaForte};
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.375rem;
  border-radius: 0.375rem;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const PosicaoBadge = styled.div`
  font-size: 0.875rem;
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

const ConfrontosSection = styled.div`
  border-top: 2px solid #e5e7eb;
  padding-top: 1rem;
`;

const ConfrontosTitulo = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: ${texto.principal};
  margin: 0 0 1rem 0;
`;

const PartidasExpanded = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${superficie.borda};
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

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const AlertBox = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #92400e;
  font-size: 0.875rem;

  svg {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const EliminatoriaAcoesCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;

  p {
    margin: 0 0 1rem 0;
    color: #6b7280;
    font-size: 0.9375rem;
  }

  small {
    display: block;
    margin-top: 0.75rem;
    color: #92400e;
    font-size: 0.8125rem;
  }
`;

// Styled component para fases eliminatórias
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

const getStatusConfronto = (
  status: StatusConfronto
): { label: string; tom: BadgeTom } => {
  switch (status) {
    case StatusConfronto.FINALIZADO:
      return { label: "Finalizado", tom: "sucesso" };
    case StatusConfronto.EM_ANDAMENTO:
      return { label: "Em andamento", tom: "info" };
    default:
      return { label: "Aguardando", tom: "aviso" };
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
  melhorDe3 = false,
  melhorDe3Eliminatoria = false,
  onAtualizar,
}) => {
  const teamsService = getTeamsService();
  const etapaService = getEtapaService();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [confrontos, setConfrontos] = useState<ConfrontoEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"grupos" | "eliminatoria">("grupos");
  const [editandoEquipeId, setEditandoEquipeId] = useState<string | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");
  const [confrontoExpandido, setConfrontoExpandido] = useState<string | null>(null);
  const [partidasConfronto, setPartidasConfronto] = useState<Map<string, PartidaTeams[]>>(new Map());
  const [modalEncerrarAberto, setModalEncerrarAberto] = useState(false);
  const [temEmpatePendente, setTemEmpatePendente] = useState(false);
  const [modalCancelarEliminatoriaAberto, setModalCancelarEliminatoriaAberto] =
    useState(false);

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

  const handleGerarDecider = async (confronto: ConfrontoEquipe) => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Gerando decider...");
      await teamsService.gerarDecider(etapaId, confronto.id);
      await carregarDados(true);

      const partidas = await teamsService.buscarPartidasConfronto(etapaId, confronto.id);
      setPartidasConfronto((prev) => new Map(prev).set(confronto.id, partidas));
      // Se o admin fechar o modal, o decider já fica à vista para definir depois
      setConfrontoExpandido(confronto.id);

      // No sorteio o decider já vem com as duplas; na formação manual, escolhe agora
      const decider = partidas.find((p) => p.tipoJogo === TipoJogoTeams.DECIDER);
      const equipe1 = equipes.find((e) => e.id === confronto.equipe1Id);
      const equipe2 = equipes.find((e) => e.id === confronto.equipe2Id);
      if (decider && !decider.dupla1?.length && equipe1 && equipe2) {
        setModalDefinirJogadores({
          partida: decider,
          equipe1,
          equipe2,
          partidasConfronto: partidas,
        });
      }
    } catch (err: any) {
      // As partidas guardadas podem estar sem o decider
      setPartidasConfronto((prev) => {
        const novo = new Map(prev);
        novo.delete(confronto.id);
        return novo;
      });
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
    // Limpar cache do confronto e recarregar dados locais
    if (modalResultados) {
      setPartidasConfronto((prev) => {
        const novo = new Map(prev);
        novo.delete(modalResultados.confronto.id);
        return novo;
      });
    }
    setModalResultados(null);
    // Fechar o painel expandido após salvar os resultados
    setConfrontoExpandido(null);
    // Apenas recarrega dados locais, sem notificar o pai
    // O onAtualizar só deve ser chamado quando encerrar a etapa
    await carregarDados(true);
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
    // Erro sobe para o modal, que mostra a mensagem
    await teamsService.definirJogadoresPartida(
      etapaId,
      modalDefinirJogadores.partida.id,
      dupla1Ids,
      dupla2Ids
    );
    await handleJogadoresDefinidos();
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

  const handleGerarEliminatoria = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Gerando fase eliminatória...");
      await teamsService.gerarFaseEliminatoria(etapaId);
      await carregarDados(true);
    } catch (err: any) {
      alert(err.message || "Erro ao gerar fase eliminatória");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  const handleCancelarEliminatoria = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Cancelando fase eliminatória...");
      await teamsService.cancelarFaseEliminatoria(etapaId);
      setModalCancelarEliminatoriaAberto(false);
      setPartidasConfronto(new Map());
      await carregarDados(true);
    } catch (err: any) {
      alert(err.message || "Erro ao cancelar fase eliminatória");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  const encerrarEtapa = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Encerrando etapa...");
      await etapaService.encerrarEtapa(etapaId);
      invalidateRankingCache();
      setModalEncerrarAberto(false);
      if (onAtualizar) {
        onAtualizar();
      }
    } catch (err: any) {
      alert(err.message || "Erro ao encerrar etapa");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
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

  // Os confrontos do mata-mata existem desde a geração das chaves, com as
  // vagas ("1º Grupo A") vazias até o admin gerar a fase eliminatória
  const eliminatoriaGerada = confrontosEliminatoria.some((c) => !!c.equipe1Id);
  const gruposConcluidos =
    confrontosGrupos.length > 0 &&
    confrontosGrupos.every((c) => c.status === StatusConfronto.FINALIZADO);

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
        </EquipeContent>
      </EquipeCard>
    );
  };

  // Renderizar confronto
  const renderConfronto = (confronto: ConfrontoEquipe) => {
    const isExpanded = confrontoExpandido === confronto.id;
    const isEquipe1Winner = !!confronto.vencedoraId && confronto.vencedoraId === confronto.equipe1Id;
    const isEquipe2Winner = !!confronto.vencedoraId && confronto.vencedoraId === confronto.equipe2Id;
    const equipesDefinidas = !!confronto.equipe1Id && !!confronto.equipe2Id;
    const precisaDecider =
      varianteTeams === VarianteTeams.TEAMS_4 &&
      confronto.jogosEquipe1 === 1 &&
      confronto.jogosEquipe2 === 1 &&
      confronto.status !== StatusConfronto.FINALIZADO &&
      !confronto.temDecider;
    const partidas = partidasConfronto.get(confronto.id) || [];
    // Resultados da fase de grupos ficam travados depois de gerar a eliminatória
    const resultadosBloqueados =
      confronto.fase === FaseEtapa.GRUPOS && eliminatoriaGerada;

    return (
      <CardConfronto
        key={confronto.id}
        situacao={getStatusConfronto(confronto.status)}
        lado1={{
          nome: confronto.equipe1Nome || confronto.equipe1Origem || "A definir",
          placar: confronto.jogosEquipe1,
          vencedor: isEquipe1Winner,
        }}
        lado2={{
          nome: confronto.equipe2Nome || confronto.equipe2Origem || "A definir",
          placar: confronto.jogosEquipe2,
          vencedor: isEquipe2Winner,
        }}
        acoes={
          equipesDefinidas && (
            <>
              {!etapaFinalizada && !resultadosBloqueados && (
                <>
                  <Button
                    size="sm"
                    variant={confronto.status === StatusConfronto.FINALIZADO ? "outline" : "primary"}
                    onClick={() => handleAbrirModalResultados(confronto)}
                  >
                    {confronto.status === StatusConfronto.FINALIZADO ? "Editar" : "Resultados"}
                  </Button>
                  {precisaDecider && (
                    <Button size="sm" onClick={() => handleGerarDecider(confronto)}>
                      Gerar Decider
                    </Button>
                  )}
                </>
              )}
              <Button size="sm" variant="secondary" onClick={() => handleExpandirConfronto(confronto.id, confronto)}>
                {isExpanded ? "Ocultar" : "Ver Partidas"}
              </Button>
            </>
          )
        }
      >

        {precisaDecider && (
          <DeciderAlert>
            Empate 1-1! Gere o Decider para definir o vencedor.
          </DeciderAlert>
        )}

        {isExpanded && partidas.length > 0 && (
          <PartidasExpanded>
            <ListaConfrontos>
              {partidas.map((partida, idx) => {
                // Verifica se precisa definir jogadores (sem duplas definidas)
                const semJogadores = !partida.dupla1 || partida.dupla1.length === 0;
                const podeDefinirJogadores = semJogadores && !etapaFinalizada && partida.status !== "finalizada";
                const podeEditarJogadores = !semJogadores && !etapaFinalizada && partida.status !== "finalizada";
                const temPlacar = partida.status === "finalizada" && partida.placar?.length > 0;
                const placar1 = temPlacar ? partida.placar.map((s) => s.gamesDupla1).join(", ") : undefined;
                const placar2 = temPlacar ? partida.placar.map((s) => s.gamesDupla2).join(", ") : undefined;

                // Montar label das duplas
                const dupla1Label = partida.dupla1?.length > 0
                  ? partida.dupla1.map((j) => j.nome).join(" / ")
                  : confronto.equipe1Nome || "A definir";
                const dupla2Label = partida.dupla2?.length > 0
                  ? partida.dupla2.map((j) => j.nome).join(" / ")
                  : confronto.equipe2Nome || "A definir";

                return (
                  <CardConfronto
                    key={partida.id}
                    compacto
                    titulo={`Jogo ${idx + 1}`}
                    etiquetas={
                      <>
                        {partida.tipoJogo && (
                          <TipoBadge $tipo={partida.tipoJogo}>{getTipoJogoLabel(partida.tipoJogo)}</TipoBadge>
                        )}
                        {semJogadores && <Badge tom="neutro">Sem jogadores definidos</Badge>}
                      </>
                    }
                    lado1={{
                      nome: dupla1Label,
                      placar: placar1,
                      vencedor: !!partida.vencedoraEquipeId && partida.vencedoraEquipeId === partida.equipe1Id,
                    }}
                    lado2={{
                      nome: dupla2Label,
                      placar: placar2,
                      vencedor: !!partida.vencedoraEquipeId && partida.vencedoraEquipeId === partida.equipe2Id,
                    }}
                    acoes={
                      (podeDefinirJogadores || podeEditarJogadores) && (
                        <Button
                          size="sm"
                          variant={podeEditarJogadores ? "outline" : "primary"}
                          onClick={() => handleDefinirJogadores(partida, confronto)}
                        >
                          {podeEditarJogadores ? "Editar" : "Definir Jogadores"}
                        </Button>
                      )
                    }
                  />
                );
              })}
            </ListaConfrontos>
          </PartidasExpanded>
        )}
      </CardConfronto>
    );
  };

  // Renderizar grupo: classificação, equipes e confrontos
  const renderGrupo = (
    id: string,
    nome: string,
    equipesGrupo: Equipe[],
    confrontosGrupo: ConfrontoEquipe[],
    tituloConfrontos: string
  ) => {
    const finalizados = confrontosGrupo.filter(
      (c) => c.status === StatusConfronto.FINALIZADO
    ).length;

    return (
      <Espacado key={id}>
        <GrupoPainel
          formato={FormatoEtapa.TEAMS}
          nome={nome}
          etiquetas={[
            `${equipesGrupo.length} equipes`,
            `${finalizados}/${confrontosGrupo.length} confrontos`,
          ]}
        >
          <TabelaClassificacao
            formato={FormatoEtapa.TEAMS}
            legenda={`Classificação: ${nome}`}
            rotuloNome="Equipe"
            colunas={COLUNAS_ADMIN_TEAMS}
            linhas={linhasDeEquipes(equipesGrupo)}
          />

          <PainelConteudo>
            <EquipesGrid>
              {ordenarEquipes(equipesGrupo).map(renderEquipeCard)}
            </EquipesGrid>

            {confrontosGrupo.length > 0 && (
              <ConfrontosSection>
                <ConfrontosTitulo>{tituloConfrontos}</ConfrontosTitulo>
                <ListaConfrontos>
                  {[...confrontosGrupo]
                    .sort((a, b) => a.ordem - b.ordem)
                    .map(renderConfronto)}
                </ListaConfrontos>
              </ConfrontosSection>
            )}
          </PainelConteudo>
        </GrupoPainel>
      </Espacado>
    );
  };

  // Renderizar seção de fase eliminatória
  const renderFaseEliminatoria = () => {
    const fases = [
      { fase: FaseEtapa.OITAVAS, nome: "Oitavas de Final" },
      { fase: FaseEtapa.QUARTAS, nome: "Quartas de Final" },
      { fase: FaseEtapa.SEMIFINAL, nome: "Semifinais" },
      { fase: FaseEtapa.FINAL, nome: "Final" },
    ];

    return (
      <>
        {!etapaFinalizada && !eliminatoriaGerada && (
          <EliminatoriaAcoesCard>
            <p>
              {gruposConcluidos
                ? "A fase de grupos foi concluída! Gere a fase eliminatória para preencher as vagas com os classificados."
                : "Finalize todos os confrontos da fase de grupos para gerar a fase eliminatória."}
            </p>
            <Button
              onClick={handleGerarEliminatoria}
              disabled={!gruposConcluidos || temEmpatePendente}
            >
              Gerar Fase Eliminatória
            </Button>
            {gruposConcluidos && temEmpatePendente && (
              <small>Resolva o empate indicado acima para liberar esta ação.</small>
            )}
          </EliminatoriaAcoesCard>
        )}

        {eliminatoriaGerada && (
          <ActionsRow>
            <Button
              variant="danger"
              onClick={() => setModalCancelarEliminatoriaAberto(true)}
              disabled={etapaFinalizada}
            >
              Cancelar Eliminatória
            </Button>
          </ActionsRow>
        )}

        {fases.map(({ fase, nome }) => {
          const confrontosFase = confrontosEliminatoria
            .filter((c) => c.fase === fase)
            .sort((a, b) => a.ordem - b.ordem);

          if (confrontosFase.length === 0) return null;

          return (
            <Espacado key={fase}>
              <GrupoPainel formato={FormatoEtapa.TEAMS} nome={nome}>
                <PainelConteudo>
                  <ListaConfrontos>
                    {confrontosFase.map(renderConfronto)}
                  </ListaConfrontos>
                </PainelConteudo>
              </GrupoPainel>
            </Espacado>
          );
        })}
      </>
    );
  };

  return (
    <Container>
      {/* Botão de Encerrar Etapa no topo - só aparece quando todos os confrontos estiverem finalizados */}
      {!etapaFinalizada && confrontos.length > 0 && confrontosFinalizados === confrontos.length && (
        <ActionsRow>
          <Button
            onClick={() => setModalEncerrarAberto(true)}
            disabled={temEmpatePendente}
            title={
              temEmpatePendente
                ? "Resolva o empate na classificação para encerrar"
                : undefined
            }
          >
            Encerrar Etapa
          </Button>
        </ActionsRow>
      )}

      {etapaFinalizada && (
        <AlertBox>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Esta etapa foi encerrada. Os resultados não podem mais ser alterados.</span>
        </AlertBox>
      )}

      {/* Eliminatória só é preenchida depois que os empates dos grupos forem resolvidos */}
      <PainelEmpatesPendentes
        etapaId={etapaId}
        atualizarEm={equipes}
        onResolvido={() => carregarDados(true)}
        desabilitado={etapaFinalizada}
        onEmpatesChange={(empates) => setTemEmpatePendente(empates.length > 0)}
      />

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

                  return renderGrupo(
                    grupoId,
                    `Grupo ${grupoId}`,
                    equipesGrupo,
                    confrontosGrupo,
                    "Confrontos do Grupo"
                  );
                })
              ) : (
                // Sem grupos - todas equipes juntas
                renderGrupo(
                  "todas",
                  "Todas as Equipes",
                  equipes,
                  confrontosGrupos,
                  "Confrontos"
                )
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
          melhorDe3={
            melhorDe3 &&
            (modalResultados.confronto.fase === FaseEtapa.GRUPOS || melhorDe3Eliminatoria)
          }
          onClose={() => {
            // Limpar cache do confronto para garantir dados atualizados
            // (caso jogadores tenham sido definidos e o usuário cancelou)
            setPartidasConfronto((prev) => {
              const novo = new Map(prev);
              novo.delete(modalResultados.confronto.id);
              return novo;
            });
            setModalResultados(null);
            // Fechar o painel expandido ao fechar o modal
            setConfrontoExpandido(null);
          }}
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

      {/* Modal de Confirmação para Encerrar Etapa */}
      <ConfirmacaoAcao
        acao="encerrarEtapa"
        isOpen={modalEncerrarAberto}
        onConfirm={encerrarEtapa}
        onClose={() => setModalEncerrarAberto(false)}
      />

      <ConfirmacaoAcao
        acao="cancelarEliminatoria"
        isOpen={modalCancelarEliminatoriaAberto}
        onConfirm={handleCancelarEliminatoria}
        onClose={() => setModalCancelarEliminatoriaAberto(false)}
      />
    </Container>
  );
};

export default ChavesTeams;
