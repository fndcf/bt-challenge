/**
 * FaseEliminatoriaReiDaPraia - Fase eliminatória do formato Rei da Praia
 *
 * Diferenças do Dupla Fixa:
 * - Duplas são formadas a partir dos classificados individuais
 * - Tipo de chaveamento define como as duplas são formadas
 * - Visual roxo
 */

import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  TipoFase,
  StatusConfrontoEliminatorio,
  Grupo,
} from "../../types/chave";
import { TipoChaveamentoReiDaPraia } from "../../types/reiDaPraia";
import reiDaPraiaService from "../../services/reiDaPraiaService";
import etapaService from "../../services/etapaService";
import { ModalRegistrarResultadoEliminatorio } from "./ModalRegistrarResultadoEliminatorio";

interface FaseEliminatoriaReiDaPraiaProps {
  etapaId: string;
  arenaId: string;
  grupos: Grupo[];
  etapaTipoChaveamento?: TipoChaveamentoReiDaPraia;
}

interface ConfrontoEliminatorioReiDaPraia {
  id: string;
  etapaId: string;
  fase: TipoFase;
  ordem: number;
  dupla1Id?: string;
  dupla1Nome?: string;
  dupla1Origem?: string;
  dupla2Id?: string;
  dupla2Nome?: string;
  dupla2Origem?: string;
  vencedoraId?: string;
  vencedoraNome?: string;
  placar?: string;
  status: StatusConfrontoEliminatorio;
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
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  color: white;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    @media (min-width: 768px) {
      font-size: 2rem;
    }
  }

  p {
    color: #ede9fe;
    margin: 0;
    font-size: 0.875rem;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }
`;

const ChaveamentoInfo = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  span:first-child {
    font-size: 1.25rem;
  }

  div {
    font-size: 0.875rem;

    strong {
      display: block;
      font-size: 0.75rem;
      opacity: 0.8;
      margin-bottom: 0.125rem;
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
          background: #7c3aed;
          color: white;
          &:hover:not(:disabled) { background: #6d28d9; }
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
    background: #7c3aed;
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
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #7c3aed;
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
  color: #581c87;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const AlertBox = styled.div<{ $variant: "success" | "warning" | "purple" }>`
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  ${(props) => {
    switch (props.$variant) {
      case "success":
        return `
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case "warning":
        return `
          background: #fef3c7;
          border: 1px solid #fde68a;
          color: #92400e;
        `;
      case "purple":
        return `
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          color: #6b21a8;
        `;
    }
  }}

  h4 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;

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

const ChaveamentoIcon = styled.span`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const ChaveamentoContent = styled.div`
  flex: 1;
`;

const ChaveamentoTitle = styled.div`
  font-weight: 600;
  color: #581c87;
  margin-bottom: 0.25rem;
`;

const ChaveamentoDesc = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
`;

const ClassificadosInput = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;

  label {
    font-weight: 500;
    color: #374151;
  }

  input {
    width: 80px;
    padding: 0.5rem;
    border: 1px solid #e9d5ff;
    border-radius: 0.375rem;
    font-size: 1rem;
    text-align: center;

    &:focus {
      outline: none;
      border-color: #7c3aed;
    }
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
  border-bottom: 1px solid #e9d5ff;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
`;

const FaseTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #581c87;
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
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(124, 58, 237, 0.15);
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

const ConfrontoLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #7c3aed;
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
  color: #7c3aed;
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
    color: #7c3aed;
    font-weight: 700;
    background: #ede9fe;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
  }
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

const PlacarDetalhado = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e9d5ff;
`;

const PlacarInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;

  span:first-child {
    font-weight: 600;
    color: #7c3aed;
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
  color: #581c87;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #7c3aed;
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
  border: 2px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: #faf5ff;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(124, 58, 237, 0.15);
    border-color: #7c3aed;
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
  border-top: 1px solid #e9d5ff;
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
  color: #581c87;
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

// ============== HELPERS ==============

const getNomeChaveamento = (
  tipo: TipoChaveamentoReiDaPraia
): { icon: string; nome: string; desc: string } => {
  switch (tipo) {
    case TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES:
      return {
        icon: "🏆",
        nome: "Melhores com Melhores",
        desc: "Os top classificados formam dupla juntos",
      };
    case TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING:
      return {
        icon: "📊",
        nome: "Pareamento por Ranking",
        desc: "1º melhor 1º lugar + 1º melhor 2º lugar",
      };
    case TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO:
      return {
        icon: "🎲",
        nome: "Sorteio Aleatório",
        desc: "Sorteio protegido (mesmo grupo não forma dupla)",
      };
    default:
      return {
        icon: "❓",
        nome: "Não definido",
        desc: "",
      };
  }
};

// ============== COMPONENTE ==============

export const FaseEliminatoriaReiDaPraia: React.FC<
  FaseEliminatoriaReiDaPraiaProps
> = ({ etapaId, grupos, etapaTipoChaveamento }) => {
  const [confrontos, setConfrontos] = useState<
    ConfrontoEliminatorioReiDaPraia[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confrontoSelecionado, setConfrontoSelecionado] =
    useState<ConfrontoEliminatorioReiDaPraia | null>(null);
  const [visualizacao, setVisualizacao] = useState<"lista" | "bracket">(
    "lista"
  );
  const [faseAtual, setFaseAtual] = useState<TipoFase | "todas">("todas");
  const [etapaFinalizada, setEtapaFinalizada] = useState(false);

  // Estado para geração
  const [classificadosPorGrupo, setClassificadosPorGrupo] = useState(2);

  const todosGruposCompletos = useMemo(() => {
    if (!grupos || grupos.length === 0) return false;
    return grupos.every((g) => g.completo);
  }, [grupos]);

  const partidasPendentes = useMemo(() => {
    if (!grupos) return 0;
    return grupos.reduce((total, g) => {
      return total + ((g.totalPartidas || 3) - (g.partidasFinalizadas || 0));
    }, 0);
  }, [grupos]);

  const finalFinalizada = useMemo(() => {
    if (!confrontos || confrontos.length === 0) return false;
    const confrontoFinal = confrontos.find((c) => c.fase === TipoFase.FINAL);
    if (!confrontoFinal) return false;
    return confrontoFinal.status === StatusConfrontoEliminatorio.FINALIZADA;
  }, [confrontos]);

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

      const dados = await reiDaPraiaService.buscarConfrontosEliminatorios(
        etapaId
      );
      setConfrontos(dados);
    } catch (err: any) {
      setErro(err.message || "Erro ao carregar confrontos");
    } finally {
      setLoading(false);
    }
  };

  const gerarEliminatoria = async () => {
    const tipoChaveamento =
      etapaTipoChaveamento || TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES;

    // ✅ ADICIONAR LOG AQUI
    console.log("🔍 [FRONTEND] Valores antes de enviar:", {
      etapaId,
      classificadosPorGrupo,
      tipoChaveamento,
      etapaTipoChaveamento, // Ver se tem valor
    });

    const chaveamentoInfo = getNomeChaveamento(tipoChaveamento);

    if (
      !confirm(
        `👑 Gerar fase eliminatória Rei da Praia?\n\n` +
          `Tipo de Chaveamento: ${chaveamentoInfo.icon} ${chaveamentoInfo.nome}\n` +
          `Classificados por grupo: ${classificadosPorGrupo}\n\n` +
          `Esta ação não pode ser desfeita!`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // ✅ ADICIONAR LOG AQUI TAMBÉM
      console.log("🚀 [FRONTEND] Chamando service com:", {
        classificadosPorGrupo,
        tipoChaveamento,
      });

      await reiDaPraiaService.gerarEliminatoria(etapaId, {
        classificadosPorGrupo,
        tipoChaveamento,
      });
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
        "⚠️ ATENÇÃO!\n\n" +
          "Cancelar a fase eliminatória irá:\n" +
          "• Excluir TODAS as duplas formadas\n" +
          "• Excluir TODOS os confrontos eliminatórios\n" +
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

      await reiDaPraiaService.cancelarEliminatoria(etapaId);

      alert(
        " Fase eliminatória cancelada!\n\n" +
          "Você pode agora:\n" +
          "• Ajustar resultados da fase de grupos\n" +
          "• Gerar a eliminatória novamente"
      );

      // Recarregar para limpar os confrontos
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
        "🏆 Encerrar Etapa?\n\n" +
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
      alert(" Etapa encerrada com sucesso! ");
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
      [StatusConfrontoEliminatorio.BYE]: "✅ BYE",
      [StatusConfrontoEliminatorio.AGENDADA]: "⏳ Aguardando",
      [StatusConfrontoEliminatorio.FINALIZADA]: "✅ Finalizada",
    };
    return <StatusBadge $status={status}>{labels[status]}</StatusBadge>;
  };

  const agruparPorFase = () => {
    const grupos: Record<TipoFase, ConfrontoEliminatorioReiDaPraia[]> = {
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

  const contarStatus = (fase: ConfrontoEliminatorioReiDaPraia[]) => {
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

  // Sem confrontos - mostrar tela de geração
  if (!confrontos || confrontos.length === 0) {
    return (
      <EmptyStateCard>
        <EmptyStateContent>
          <EmptyTitle>
            <span>👑</span>
            Fase Eliminatória - Rei da Praia
          </EmptyTitle>

          {!todosGruposCompletos ? (
            <>
              <AlertBox $variant="warning">
                <h4>⏳ Fase de Grupos em Andamento</h4>
                <p>
                  Finalize todas as partidas da fase de grupos primeiro. Ainda
                  há <strong>{partidasPendentes} partida(s)</strong>{" "}
                  pendente(s).
                </p>
              </AlertBox>
              <Button disabled>👑 Gerar Fase Eliminatória</Button>
            </>
          ) : (
            <>
              <AlertBox $variant="purple">
                <h4> Fase de Grupos Concluída!</h4>
                <p>
                  Todos os jogadores completaram suas partidas. Agora você pode
                  formar as duplas para a fase eliminatória.
                </p>
              </AlertBox>

              {/* Classificados por grupo */}
              <ClassificadosInput>
                <label>Classificados por grupo:</label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={classificadosPorGrupo}
                  onChange={(e) =>
                    setClassificadosPorGrupo(Number(e.target.value))
                  }
                />
              </ClassificadosInput>

              <ButtonGroup>
                <Button onClick={gerarEliminatoria} disabled={loading}>
                  👑 Gerar Fase Eliminatória
                </Button>
              </ButtonGroup>

              <HintText>
                As duplas serão formadas automaticamente com base no tipo de
                chaveamento selecionado e na classificação individual dos
                jogadores.
              </HintText>
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
        <h2>
          <span>👑</span>
          Fase Eliminatória
        </h2>
        <p>Confrontos mata-mata com duplas formadas na eliminatória!</p>

        {etapaTipoChaveamento && (
          <ChaveamentoInfo>
            <ChaveamentoIcon>
              {getNomeChaveamento(etapaTipoChaveamento).icon}
            </ChaveamentoIcon>
            <ChaveamentoContent>
              <ChaveamentoTitle>
                {getNomeChaveamento(etapaTipoChaveamento).nome}
              </ChaveamentoTitle>
              <ChaveamentoDesc>
                {getNomeChaveamento(etapaTipoChaveamento).desc}
              </ChaveamentoDesc>
              <small
                style={{
                  color: "#9ca3af",
                  marginTop: "0.5rem",
                  display: "block",
                }}
              >
                (Definido na criação da etapa)
              </small>
            </ChaveamentoContent>
          </ChaveamentoInfo>
        )}
      </Header>

      <ActionsRow>
        <Button
          $variant="danger"
          onClick={cancelarEliminatoria}
          disabled={loading || etapaFinalizada}
        >
          🗑️ Cancelar Eliminatória
        </Button>

        {finalFinalizada && (
          <Button
            $variant="warning"
            onClick={encerrarEtapa}
            disabled={loading || etapaFinalizada}
          >
            {etapaFinalizada ? "✅ Etapa Encerrada" : "🏆 Encerrar Etapa"}
          </Button>
        )}
      </ActionsRow>

      <Controls>
        <ToggleGroup>
          <ToggleButton
            $active={visualizacao === "lista"}
            onClick={() => setVisualizacao("lista")}
          >
            📋 Lista
          </ToggleButton>
          <ToggleButton
            $active={visualizacao === "bracket"}
            onClick={() => setVisualizacao("bracket")}
          >
            🏆 Bracket
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

      {visualizacao === "lista" ? (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {fasesComConfrontos.map(([fase, confrontosFase]) => (
            <FaseCard key={fase}>
              <FaseHeader>
                <FaseTitle>{getNomeFase(fase as TipoFase)}</FaseTitle>
                <FaseStatus>
                  {contarStatus(confrontosFase)} completos
                </FaseStatus>
              </FaseHeader>

              <ConfrontosList>
                {confrontosFase.map((confronto) => (
                  <ConfrontoCard key={confronto.id}>
                    <ConfrontoHeader>
                      <ConfrontoInfo>
                        <ConfrontoLabel>
                          CONFRONTO {confronto.ordem}
                        </ConfrontoLabel>
                        {getStatusBadge(confronto.status)}
                      </ConfrontoInfo>
                    </ConfrontoHeader>

                    {confronto.status === StatusConfrontoEliminatorio.BYE ? (
                      <ByeBox>
                        <ByeTeam>{confronto.dupla1Nome}</ByeTeam>
                        <ByeOrigin>({confronto.dupla1Origem})</ByeOrigin>
                        <ByeLabel>Classificado automaticamente (BYE)</ByeLabel>
                      </ByeBox>
                    ) : (
                      <>
                        <ConfrontoContent>
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

                          <VsSeparator>
                            <span>VS</span>
                          </VsSeparator>

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

                        {confronto.status ===
                          StatusConfrontoEliminatorio.FINALIZADA && (
                          <PlacarDetalhado>
                            <PlacarInfo>
                              <span>Vencedor:</span>
                              <span
                                style={{ fontWeight: 700, color: "#16a34a" }}
                              >
                                {confronto.vencedoraNome}
                              </span>
                            </PlacarInfo>
                          </PlacarDetalhado>
                        )}

                        {confronto.status ===
                          StatusConfrontoEliminatorio.AGENDADA && (
                          <ActionSection>
                            <ActionButton
                              $variant="register"
                              onClick={() => setConfrontoSelecionado(confronto)}
                            >
                              🎾 Registrar Resultado
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
                                  : "✏️ Editar Resultado"}{" "}
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
      ) : (
        <BracketContainer>
          <BracketContent>
            {fasesComConfrontos.map(([fase, confrontosFase]) => (
              <BracketColumn key={fase}>
                <BracketTitle>{getNomeFase(fase as TipoFase)}</BracketTitle>

                <BracketMatches>
                  {confrontosFase.map((confronto) => (
                    <BracketMatch
                      key={confronto.id}
                      onClick={() => {
                        if (
                          confronto.status !==
                            StatusConfrontoEliminatorio.BYE &&
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
                            $isWinner={
                              confronto.vencedoraId === confronto.dupla1Id
                            }
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
                            $isWinner={
                              confronto.vencedoraId === confronto.dupla2Id
                            }
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

            {/* Campeão */}
            {confrontosPorFase[TipoFase.FINAL]?.length > 0 &&
              confrontosPorFase[TipoFase.FINAL][0].status ===
                StatusConfrontoEliminatorio.FINALIZADA && (
                <ChampionBox>
                  <ChampionTitle>🏆 CAMPEÃO</ChampionTitle>
                  <ChampionCard>
                    <ChampionContent>
                      <ChampionName>
                        {confrontosPorFase[TipoFase.FINAL][0].vencedoraNome}
                      </ChampionName>
                      <ChampionScore>
                        Placar final:{" "}
                        {confrontosPorFase[TipoFase.FINAL][0].placar}
                      </ChampionScore>
                    </ChampionContent>
                  </ChampionCard>
                </ChampionBox>
              )}
          </BracketContent>
        </BracketContainer>
      )}

      {/* Modal de Resultado */}
      {confrontoSelecionado && (
        <ModalRegistrarResultadoEliminatorio
          confronto={confrontoSelecionado as any}
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

export default FaseEliminatoriaReiDaPraia;
