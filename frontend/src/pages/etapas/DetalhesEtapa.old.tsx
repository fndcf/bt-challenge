import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { Etapa, Inscricao, StatusEtapa, FormatoEtapa } from "../../types/etapa";
import { TipoChaveamentoReiDaPraia } from "../../types/reiDaPraia";
import etapaService from "../../services/etapaService";
import chaveService from "../../services/chaveService";
import reiDaPraiaService from "../../services/reiDaPraiaService";
import { StatusBadge } from "../../components/etapas/StatusBadge";
import { ModalInscricao } from "../../components/etapas/ModalInscricao";
import { ChavesEtapa } from "../../components/etapas/ChavesEtapa";
import { ChavesReiDaPraia } from "../../components/etapas/ChavesReiDaPraia";
import { ConfirmacaoPerigosa } from "../../components/ConfirmacaoPerigosa";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Footer from "@/components/Footer";
import { GerenciarCabecasDeChave } from "@/components/etapas/GerenciarCabecasDeChave";

// ============== ANIMATIONS ==============

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (min-width: 640px) {
    padding: 2rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem 2rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`;

const LoadingContent = styled.div`
  text-align: center;
`;

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin: 0 auto 1rem;
`;

const LoadingText = styled.p`
  color: #6b7280;
  margin: 0;
`;

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
`;

const ErrorText = styled.p`
  color: #991b1b;
  font-weight: 500;
  margin: 0 0 1rem 0;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  transition: color 0.2s;

  &:hover {
    color: #111827;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0.5rem 0 0 0;
  font-size: 0.9375rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: "primary" | "danger" }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;

  ${(props) =>
    props.$variant === "danger"
      ? `
    background: #dc2626;
    color: white;

    &:hover {
      background: #b91c1c;
    }
  `
      : `
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  `}
`;

//  Badge de formato
const FormatoBadge = styled.span<{ $formato: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  ${(props) =>
    props.$formato === "rei_da_praia"
      ? `
    background: #ede9fe;
    color: #7c3aed;
  `
      : `
    background: #dbeafe;
    color: #2563eb;
  `}
`;

const TabsContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const TabsNav = styled.div`
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    border-bottom: none;
  }
`;

const TabsList = styled.nav`
  display: flex;
  gap: 2rem;
  margin-bottom: -1px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    overflow-x: visible;
    margin-bottom: 0;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  white-space: nowrap;
  padding: 1rem 0.25rem;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? "#3b82f6" : "transparent")};
  background: none;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  color: ${(props) => (props.$active ? "#3b82f6" : "#6b7280")};

  &:hover {
    color: ${(props) => (props.$active ? "#3b82f6" : "#374151")};
    border-bottom-color: ${(props) => (props.$active ? "#3b82f6" : "#d1d5db")};
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${(props) => (props.$active ? "#eff6ff" : "white")};
    border-color: ${(props) => (props.$active ? "#3b82f6" : "#e5e7eb")};
    border-bottom: 1px solid
      ${(props) => (props.$active ? "#3b82f6" : "#e5e7eb")};

    &:hover {
      background: ${(props) => (props.$active ? "#eff6ff" : "#f9fafb")};
      border-bottom-color: ${(props) =>
        props.$active ? "#3b82f6" : "#e5e7eb"};
    }
  }
`;

const TabBadge = styled.span`
  margin-left: 0.375rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #dbeafe;
  color: #2563eb;

  @media (max-width: 768px) {
    margin-left: auto;
    margin-right: 0;
  }
`;

const Grid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(${(props) => props.$cols || 3}, 1fr);
  }
`;

const Card = styled.div<{ $variant?: "purple" }>`
  background: ${(props) => (props.$variant === "purple" ? "#faf5ff" : "white")};
  border-radius: 0.5rem;
  border: 1px solid
    ${(props) => (props.$variant === "purple" ? "#e9d5ff" : "#e5e7eb")};
  padding: 1.5rem;
`;

const CardIconRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const CardInfo = styled.div`
  flex: 1;
`;

const CardLabel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const CardValue = styled.p`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const ProgressBar = styled.div`
  margin-bottom: 0.5rem;
`;

const ProgressBarTrack = styled.div`
  width: 100%;
  height: 0.75rem;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $progress: number }>`
  height: 100%;
  border-radius: 9999px;
  transition: all 0.3s;
  width: ${(props) => props.$progress}%;
  background: ${(props) =>
    props.$progress === 100
      ? "#22c55e"
      : props.$progress >= 75
      ? "#eab308"
      : "#3b82f6"};
`;

const ProgressText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const CardContent = styled.div`
  font-size: 0.875rem;
  color: #6b7280;

  p {
    margin: 0;
  }

  p + p {
    margin-top: 0.5rem;
  }
`;

const CardTitle = styled.h2<{ $variant?: "purple" }>`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => (props.$variant === "purple" ? "#7c3aed" : "#111827")};
  margin: 0 0 1rem 0;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InfoRow = styled.div<{ $highlight?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;

  ${(props) =>
    props.$highlight &&
    `
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  `}
`;

const InfoLabel = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const InfoValue = styled.span<{ $color?: string }>`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => props.$color || "#111827"};
`;

const ActionsSection = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
`;

const ActionsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Button = styled.button<{
  $variant?: "blue" | "orange" | "green" | "purple" | "red" | "gray";
  $fullWidth?: boolean;
}>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  ${(props) => props.$fullWidth && "width: 100%;"}

  ${(props) => {
    switch (props.$variant) {
      case "blue":
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
      case "orange":
        return `
          background: #f97316;
          color: white;
          &:hover { background: #ea580c; }
        `;
      case "green":
        return `
          background: #22c55e;
          color: white;
          &:hover { background: #16a34a; }
        `;
      case "purple":
        return `
          background: #a855f7;
          color: white;
          &:hover { background: #9333ea; }
        `;
      case "red":
        return `
          background: #dc2626;
          color: white;
          &:hover { background: #b91c1c; }
        `;
      case "gray":
        return `
          background: #6b7280;
          color: white;
          &:hover { background: #4b5563; }
        `;
      default:
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
    }
  }}
`;

const Alert = styled.div<{
  $variant: "orange" | "red" | "blue" | "yellow" | "green" | "purple";
}>`
  margin-top: 1rem;
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;

  ${(props) => {
    switch (props.$variant) {
      case "orange":
        return `
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
        `;
      case "red":
        return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
      case "blue":
        return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
      case "yellow":
        return `
          background: #fefce8;
          border: 1px solid #fef08a;
          color: #854d0e;
        `;
      case "green":
        return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case "purple":
        return `
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          color: #6b21a8;
        `;
    }
  }}

  p {
    margin: 0;
  }

  p + p {
    margin-top: 0.5rem;
  }

  ul {
    margin: 0.25rem 0 0 0;
    padding-left: 1.5rem;
  }

  li {
    margin-top: 0.25rem;
  }
`;

const InscricoesEmpty = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;

  p {
    color: #6b7280;
    margin: 0;
  }

  button {
    margin-top: 1rem;
  }
`;

const InscricoesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const InscricaoCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const InscricaoInfo = styled.div`
  flex: 1;
`;

const InscricaoNome = styled.p`
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.25rem 0;
`;

const InscricaoNivel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const CancelButton = styled.button`
  margin-left: 0.75rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  color: #dc2626;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;

  &:hover {
    color: #b91c1c;
    background: #fef2f2;
  }
`;

const SelectionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SelectionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SelectionCount = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const SelectAllButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;

const DeleteSelectedButton = styled.button<{ disabled?: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background: ${(props) => (props.disabled ? "#d1d5db" : "#dc2626")};
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  border: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${(props) => (props.disabled ? "#d1d5db" : "#b91c1c")};
  }
`;

const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
`;

const Checkbox = styled.input.attrs({ type: "checkbox" })`
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: #3b82f6;
`;

const InscricaoCardSelectable = styled(InscricaoCard)<{ $selected?: boolean }>`
  ${(props) =>
    props.$selected &&
    `
    background: #eff6ff;
    border-color: #3b82f6;
  `}
`;

const InscricaoCardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

// ============== HELPERS ==============

/**
 * Obter nome do tipo de chaveamento
 */
const getNomeChaveamento = (tipo: TipoChaveamentoReiDaPraia): string => {
  switch (tipo) {
    case TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES:
      return "🏆 Melhores com Melhores";
    case TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING:
      return "📊 Pareamento por Ranking";
    case TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO:
      return "🎲 Sorteio Aleatório";
    default:
      return "Não definido";
  }
};

// ============== COMPONENTE ==============

export const DetalhesEtapa: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalInscricaoAberto, setModalInscricaoAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<
    "visao-geral" | "inscricoes" | "chaves"
  >("visao-geral");

  const [jogadoresSelecionados, setJogadoresSelecionados] = useState<
    Set<string>
  >(new Set());

  // ✅ Detectar formato
  const isReiDaPraia = etapa?.formato === FormatoEtapa.REI_DA_PRAIA;

  useEffect(() => {
    carregarEtapa();
  }, [id]);

  const carregarEtapa = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError("ID da etapa não informado");
        return;
      }

      const data = await etapaService.buscarPorId(id);
      setEtapa(data);
      await carregarInscricoes(id);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar etapa");
    } finally {
      setLoading(false);
    }
  };

  const carregarInscricoes = async (etapaId: string) => {
    try {
      const data = await etapaService.listarInscricoes(etapaId);
      setInscricoes(data);
    } catch (err: any) {
      setInscricoes([]);
    }
  };

  const handleCancelarInscricao = async (
    inscricaoId: string,
    jogadorNome: string
  ) => {
    if (!etapa) return;

    if (!confirm(`Deseja cancelar a inscrição de ${jogadorNome}?`)) {
      return;
    }

    try {
      await etapaService.cancelarInscricao(etapa.id, inscricaoId);
      await carregarEtapa();
      alert("Inscrição cancelada com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao cancelar inscrição");
    }
  };

  const handleEditar = () => {
    if (!etapa) return;
    navigate(`/admin/etapas/${etapa.id}/editar`);
  };

  const handleExcluir = async () => {
    if (!etapa) return;

    const confirmar = confirm(
      `⚠️ ATENÇÃO: Deseja realmente excluir a etapa "${etapa.nome}"?\n\n` +
        `Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await etapaService.deletar(etapa.id);
      alert("Etapa excluída com sucesso!");
      navigate("/admin/etapas");
    } catch (err: any) {
      alert(err.message || "Erro ao excluir etapa");
      setLoading(false);
    }
  };

  const formatarData = (data: any) => {
    try {
      if (data && typeof data === "object" && "_seconds" in data) {
        const date = new Date(data._seconds * 1000);
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }

      if (typeof data === "string") {
        return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
      }

      if (data instanceof Date) {
        return format(data, "dd/MM/yyyy", { locale: ptBR });
      }

      return "Data inválida";
    } catch (error) {
      return "Data inválida";
    }
  };

  const calcularProgresso = () => {
    if (!etapa || etapa.maxJogadores === 0) return 0;
    return Math.round((etapa.totalInscritos / etapa.maxJogadores) * 100);
  };

  const handleInscreverJogador = () => {
    setModalInscricaoAberto(true);
  };

  const handleInscricaoSuccess = async () => {
    await carregarEtapa();
  };

  //  Gerar chaves baseado no formato
  const handleGerarChaves = async () => {
    if (!etapa) return;

    const formatoNome = isReiDaPraia ? "Rei da Praia" : "Dupla Fixa";
    const detalhes = isReiDaPraia
      ? `• ${etapa.totalInscritos / 4} grupos de 4 jogadores\n` +
        `• ${(etapa.totalInscritos / 4) * 3} partidas na fase de grupos\n` +
        `• Estatísticas individuais por jogador`
      : `• ${etapa.qtdGrupos} grupos\n` +
        `• ${Math.floor(etapa.totalInscritos / 2)} duplas\n` +
        `• Todos os confrontos da fase de grupos`;

    const confirmar = window.confirm(
      `🎾 Deseja gerar as chaves para a etapa "${etapa.nome}"?\n\n` +
        `Formato: ${formatoNome}\n\n` +
        `Isso criará:\n${detalhes}\n\n` +
        `⚠️ Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      let resultado;

      if (isReiDaPraia) {
        // ✅ Usar service do Rei da Praia
        resultado = await reiDaPraiaService.gerarChaves(etapa.id);

        alert(
          `✅ Chaves Rei da Praia geradas com sucesso!\n\n` +
            `• ${resultado.jogadores.length} jogadores distribuídos\n` +
            `• ${resultado.grupos.length} grupos formados\n` +
            `• ${resultado.partidas.length} partidas agendadas`
        );
      } else {
        // Usar service tradicional
        resultado = await chaveService.gerarChaves(etapa.id);

        alert(
          `✅ Chaves geradas com sucesso!\n\n` +
            `• ${resultado.duplas.length} duplas criadas\n` +
            `• ${resultado.grupos.length} grupos formados\n` +
            `• ${resultado.partidas.length} partidas agendadas`
        );
      }

      await carregarEtapa();
      setAbaAtiva("chaves");
    } catch (err: any) {
      alert(err.message || "Erro ao gerar chaves");
    } finally {
      setLoading(false);
    }
  };

  const handleEncerrarInscricoes = async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `🔒 Deseja encerrar as inscrições da etapa "${etapa.nome}"?\n\n` +
        `Atualmente há ${etapa.totalInscritos} jogador(es) inscrito(s).\n\n` +
        `Após encerrar, não será mais possível:\n` +
        `• Adicionar novos jogadores\n` +
        `• Cancelar inscrições\n\n` +
        `Você poderá gerar as chaves após o encerramento.`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await etapaService.encerrarInscricoes(etapa.id);
      alert(
        "✅ Inscrições encerradas com sucesso!\n\nAgora você pode gerar as chaves da etapa."
      );
      await carregarEtapa();
    } catch (err: any) {
      alert(err.message || "Erro ao encerrar inscrições");
    } finally {
      setLoading(false);
    }
  };

  const handleReabrirInscricoes = async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `🔓 Deseja reabrir as inscrições da etapa "${etapa.nome}"?\n\n` +
        `Atualmente há ${etapa.totalInscritos} jogador(es) inscrito(s) ` +
        `de ${etapa.maxJogadores} vaga(s).\n\n` +
        `Após reabrir, você poderá:\n` +
        `• Adicionar novos jogadores\n` +
        `• Cancelar inscrições existentes\n\n` +
        `Você poderá encerrar novamente quando estiver pronto.`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await etapaService.reabrirInscricoes(etapa.id);
      alert(
        "✅ Inscrições reabertas com sucesso!\n\nAgora você pode adicionar ou remover jogadores."
      );
      await carregarEtapa();
    } catch (err: any) {
      alert(err.message || "Erro ao reabrir inscrições");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirChaves = async () => {
    if (!etapa) return;

    try {
      setExcluindo(true);
      await chaveService.excluirChaves(etapa.id);
      setModalExcluirAberto(false);

      alert(
        "✅ Chaves excluídas com sucesso!\n\n" +
          'A etapa voltou ao status "Inscrições Encerradas".\n' +
          "Você pode gerar as chaves novamente quando quiser."
      );

      await carregarEtapa();
      setAbaAtiva("visao-geral");
    } catch (err: any) {
      alert(err.message || "Erro ao excluir chaves");
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingContent>
          <Spinner />
          <LoadingText>Carregando etapa...</LoadingText>
        </LoadingContent>
      </LoadingContainer>
    );
  }

  if (error || !etapa) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorText>{error || "Etapa não encontrada"}</ErrorText>
          <Button $variant="blue" onClick={() => navigate("/admin/etapas")}>
            Voltar para etapas
          </Button>
        </ErrorContainer>
      </Container>
    );
  }

  const progresso = calcularProgresso();
  const inscricoesAbertas = etapa.status === StatusEtapa.INSCRICOES_ABERTAS;
  const inscricoesEncerradas =
    etapa.status === StatusEtapa.INSCRICOES_ENCERRADAS;
  const vagasCompletas = etapa.totalInscritos === etapa.maxJogadores;

  // ✅ VALIDAÇÕES ESPECÍFICAS POR FORMATO
  const numeroValido = isReiDaPraia
    ? etapa.totalInscritos >= 8 && etapa.totalInscritos % 4 === 0
    : etapa.totalInscritos >= 4 && etapa.totalInscritos % 2 === 0;

  const podeGerarChaves =
    inscricoesEncerradas &&
    vagasCompletas &&
    numeroValido &&
    !etapa.chavesGeradas;

  const podeEncerrarInscricoes = inscricoesAbertas && numeroValido;
  const podeReabrirInscricoes =
    inscricoesEncerradas && !etapa.chavesGeradas && !vagasCompletas;

  const toggleSelecionarJogador = (inscricaoId: string) => {
    setJogadoresSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(inscricaoId)) {
        novo.delete(inscricaoId);
      } else {
        novo.add(inscricaoId);
      }
      return novo;
    });
  };

  const selecionarTodos = () => {
    if (jogadoresSelecionados.size === inscricoes.length) {
      setJogadoresSelecionados(new Set());
    } else {
      setJogadoresSelecionados(new Set(inscricoes.map((i) => i.id)));
    }
  };

  const handleExcluirSelecionados = async () => {
    if (jogadoresSelecionados.size === 0) return;

    const confirmacao = confirm(
      `Deseja excluir ${jogadoresSelecionados.size} inscrição(ões)?`
    );

    if (!confirmacao) return;

    try {
      setLoading(true);

      // ✅ SEQUENCIAL ao invés de paralelo
      for (const inscricaoId of Array.from(jogadoresSelecionados)) {
        await etapaService.cancelarInscricao(etapa!.id, inscricaoId);
      }

      alert(`${jogadoresSelecionados.size} inscrição(ões) cancelada(s)!`);

      setJogadoresSelecionados(new Set());
      await carregarEtapa(); // Recarrega tudo
    } catch (error: any) {
      alert(error.message || "Erro ao cancelar inscrições");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate("/admin/etapas")}>
          ← Voltar
        </BackButton>

        <HeaderRow>
          <HeaderContent>
            <Title>
              {isReiDaPraia ? "👑" : "👥"} {etapa.nome}
            </Title>
            {etapa.descricao && <Subtitle>{etapa.descricao}</Subtitle>}
          </HeaderContent>

          <HeaderActions>
            {/* ✅ Badge de formato */}
            <FormatoBadge $formato={etapa.formato || "dupla_fixa"}>
              {isReiDaPraia ? "👑 Rei da Praia" : "👥 Dupla Fixa"}
            </FormatoBadge>

            <StatusBadge status={etapa.status} />

            {!etapa.chavesGeradas && (
              <>
                <ActionButton onClick={handleEditar}>✏️ Editar</ActionButton>

                {etapa.totalInscritos === 0 && (
                  <ActionButton $variant="danger" onClick={handleExcluir}>
                    🗑️ Excluir
                  </ActionButton>
                )}
              </>
            )}
          </HeaderActions>
        </HeaderRow>
      </Header>

      <TabsContainer>
        <TabsNav>
          <TabsList>
            <Tab
              $active={abaAtiva === "visao-geral"}
              onClick={() => setAbaAtiva("visao-geral")}
            >
              <span>📊 Visão Geral</span>
            </Tab>

            <Tab
              $active={abaAtiva === "inscricoes"}
              onClick={() => setAbaAtiva("inscricoes")}
            >
              <span>👤 Inscrições</span>
              {etapa.totalInscritos > 0 && (
                <TabBadge>{etapa.totalInscritos}</TabBadge>
              )}
            </Tab>

            {etapa.chavesGeradas && (
              <Tab
                $active={abaAtiva === "chaves"}
                onClick={() => setAbaAtiva("chaves")}
              >
                <span>
                  {isReiDaPraia
                    ? "👑 Grupos & Partidas"
                    : "🎾 Grupos & Partidas"}
                </span>
              </Tab>
            )}
          </TabsList>
        </TabsNav>
      </TabsContainer>

      {/* ABA: VISÃO GERAL */}
      {abaAtiva === "visao-geral" && (
        <>
          {/* Cards Principais */}
          <Grid $cols={3}>
            {/* Inscrições */}
            <Card>
              <CardIconRow>
                <CardInfo>
                  <CardLabel>Inscritos</CardLabel>
                  <CardValue>
                    {etapa.totalInscritos} / {etapa.maxJogadores}
                  </CardValue>
                </CardInfo>
              </CardIconRow>

              <ProgressBar>
                <ProgressBarTrack>
                  <ProgressBarFill $progress={progresso} />
                </ProgressBarTrack>
                <ProgressText>{progresso}% preenchido</ProgressText>
              </ProgressBar>
            </Card>

            {/* ✅ Card adaptado por formato */}
            <Card>
              <CardIconRow>
                <CardInfo>
                  <CardLabel>
                    {isReiDaPraia ? "Grupos de 4" : "Grupos"}
                  </CardLabel>
                  <CardValue>
                    {isReiDaPraia
                      ? etapa.totalInscritos / 4 || 0
                      : etapa.qtdGrupos || 0}
                  </CardValue>
                </CardInfo>
              </CardIconRow>

              <CardContent>
                {isReiDaPraia ? (
                  <>
                    <p>• 4 jogadores por grupo</p>
                    <p>• 3 partidas por grupo</p>
                  </>
                ) : (
                  <p>• {etapa.jogadoresPorGrupo} duplas por grupo</p>
                )}
                {etapa.chavesGeradas ? (
                  <p style={{ color: "#22c55e", fontWeight: 500 }}>
                    ✓ Chaves geradas
                  </p>
                ) : (
                  <p style={{ color: "#9ca3af" }}>Chaves não geradas</p>
                )}
              </CardContent>
            </Card>

            {/* Realização */}
            <Card>
              <CardIconRow>
                <CardInfo>
                  <CardLabel>Realização</CardLabel>
                  <CardValue style={{ fontSize: "1.125rem" }}>
                    {formatarData(etapa.dataRealizacao)}
                  </CardValue>
                </CardInfo>
              </CardIconRow>

              {etapa.local && (
                <CardContent>
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>📍 {etapa.local}</span>
                  </p>
                </CardContent>
              )}
            </Card>
          </Grid>

          {/* Informações Detalhadas */}
          <Grid $cols={2}>
            {/* Datas */}
            <Card>
              <CardTitle>📅 Datas Importantes</CardTitle>

              <InfoList>
                <InfoRow>
                  <InfoLabel>Início das inscrições:</InfoLabel>
                  <InfoValue>{formatarData(etapa.dataInicio)}</InfoValue>
                </InfoRow>

                <InfoRow>
                  <InfoLabel>Fim das inscrições:</InfoLabel>
                  <InfoValue>{formatarData(etapa.dataFim)}</InfoValue>
                </InfoRow>

                <InfoRow $highlight>
                  <InfoLabel>Data de realização:</InfoLabel>
                  <InfoValue $color="#3b82f6">
                    {formatarData(etapa.dataRealizacao)}
                  </InfoValue>
                </InfoRow>
              </InfoList>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardTitle>📊 Estatísticas</CardTitle>

              <InfoList>
                {/* ✅ Formato */}
                <InfoRow>
                  <InfoLabel>Formato:</InfoLabel>
                  <InfoValue $color={isReiDaPraia ? "#7c3aed" : "#3b82f6"}>
                    {isReiDaPraia ? "👑 Rei da Praia" : "👥 Dupla Fixa"}
                  </InfoValue>
                </InfoRow>

                {/* ✅ Tipo de chaveamento (apenas Rei da Praia) */}
                {isReiDaPraia && (etapa as any).tipoChaveamento && (
                  <InfoRow>
                    <InfoLabel>Chaveamento:</InfoLabel>
                    <InfoValue $color="#7c3aed">
                      {getNomeChaveamento((etapa as any).tipoChaveamento)}
                    </InfoValue>
                  </InfoRow>
                )}

                <InfoRow>
                  <InfoLabel>Nível:</InfoLabel>
                  <InfoValue $color="#a855f7">
                    {etapa.nivel === "iniciante" && "Iniciante"}
                    {etapa.nivel === "intermediario" && "Intermediário"}
                    {etapa.nivel === "avancado" && "Avançado"}
                  </InfoValue>
                </InfoRow>

                <InfoRow>
                  <InfoLabel>Gênero:</InfoLabel>
                  <InfoValue $color="#3b82f6">
                    {etapa.genero === "masculino"
                      ? "♂️ Masculino"
                      : "♀️ Feminino"}
                  </InfoValue>
                </InfoRow>

                {/* ✅ Estatística adaptada */}
                <InfoRow>
                  <InfoLabel>
                    {isReiDaPraia ? "Total de jogadores:" : "Total de duplas:"}
                  </InfoLabel>
                  <InfoValue>
                    {isReiDaPraia
                      ? etapa.totalInscritos
                      : Math.floor(etapa.totalInscritos / 2)}
                  </InfoValue>
                </InfoRow>

                <InfoRow>
                  <InfoLabel>Vagas disponíveis:</InfoLabel>
                  <InfoValue>
                    {etapa.maxJogadores - etapa.totalInscritos}
                  </InfoValue>
                </InfoRow>

                <InfoRow>
                  <InfoLabel>Taxa de preenchimento:</InfoLabel>
                  <InfoValue>{progresso}%</InfoValue>
                </InfoRow>

                {etapa.chavesGeradas && etapa.dataGeracaoChaves && (
                  <InfoRow $highlight>
                    <InfoLabel>Chaves geradas em:</InfoLabel>
                    <InfoValue $color="#22c55e">
                      {formatarData(etapa.dataGeracaoChaves)}
                    </InfoValue>
                  </InfoRow>
                )}
              </InfoList>
            </Card>
          </Grid>

          {/* Ações */}
          <ActionsSection>
            <CardTitle>⚡ Ações</CardTitle>

            <ActionsGrid>
              {inscricoesAbertas && (
                <Button $variant="blue" onClick={handleInscreverJogador}>
                  <span>➕ Inscrever Jogador</span>
                </Button>
              )}

              {podeEncerrarInscricoes && (
                <Button $variant="orange" onClick={handleEncerrarInscricoes}>
                  <span>🔒 Encerrar Inscrições</span>
                </Button>
              )}

              {podeGerarChaves && (
                <Button
                  $variant={isReiDaPraia ? "purple" : "green"}
                  onClick={handleGerarChaves}
                >
                  <span>
                    {isReiDaPraia ? "👑 Gerar Chaves" : "🎾 Gerar Chaves"}
                  </span>
                </Button>
              )}

              {podeReabrirInscricoes && (
                <Button $variant="blue" onClick={handleReabrirInscricoes}>
                  <span>🔓 Reabrir Inscrições</span>
                </Button>
              )}

              {etapa.chavesGeradas && (
                <>
                  <Button
                    $variant="purple"
                    onClick={() => setAbaAtiva("chaves")}
                  >
                    <span>👁️ Ver Chaves</span>
                  </Button>

                  <Button
                    $variant="red"
                    onClick={() => setModalExcluirAberto(true)}
                  >
                    <span>🗑️ Excluir Chaves</span>
                  </Button>
                </>
              )}

              <Button
                $variant="gray"
                onClick={() => navigate(`/admin/etapas/${etapa.id}/editar`)}
              >
                <span>✏️ Editar Etapa</span>
              </Button>

              {!etapa.chavesGeradas && etapa.totalInscritos === 0 && (
                <Button $variant="red" onClick={handleExcluir}>
                  <span>🗑️ Excluir Etapa</span>
                </Button>
              )}
            </ActionsGrid>

            {/* ✅ Alertas adaptados por formato */}
            {etapa.totalInscritos > 0 && !etapa.chavesGeradas && (
              <Alert $variant="orange">
                <p>
                  <strong>Atenção:</strong> Para excluir esta etapa, você
                  precisa cancelar todas as {etapa.totalInscritos}{" "}
                  inscrição(ões) primeiro.
                </p>
              </Alert>
            )}

            {etapa.chavesGeradas && (
              <Alert $variant="red">
                <p>
                  <strong>Bloqueado:</strong> Não é possível excluir etapa após
                  geração de chaves.
                </p>
              </Alert>
            )}

            {/* ✅ Alertas específicos por formato */}
            {inscricoesAbertas && isReiDaPraia && etapa.totalInscritos < 8 && (
              <Alert $variant="purple">
                <p>
                  <strong>👑 Rei da Praia:</strong> Você precisa de pelo menos 8
                  jogadores inscritos (múltiplo de 4) para encerrar as
                  inscrições.
                </p>
              </Alert>
            )}

            {inscricoesAbertas &&
              isReiDaPraia &&
              etapa.totalInscritos >= 8 &&
              etapa.totalInscritos % 4 !== 0 && (
                <Alert $variant="purple">
                  <p>
                    <strong>👑 Rei da Praia:</strong> Você tem{" "}
                    {etapa.totalInscritos} jogadores. O número deve ser múltiplo
                    de 4 para formar grupos completos.
                  </p>
                  <p>
                    Próximos valores válidos:{" "}
                    {Math.floor(etapa.totalInscritos / 4) * 4} ou{" "}
                    {Math.ceil(etapa.totalInscritos / 4) * 4}
                  </p>
                </Alert>
              )}

            {inscricoesAbertas && !isReiDaPraia && etapa.totalInscritos < 4 && (
              <Alert $variant="blue">
                <p>
                  Você precisa de pelo menos 4 jogadores inscritos (número par)
                  para encerrar as inscrições.
                </p>
              </Alert>
            )}

            {inscricoesAbertas &&
              !isReiDaPraia &&
              etapa.totalInscritos >= 4 &&
              etapa.totalInscritos % 2 !== 0 && (
                <Alert $variant="yellow">
                  <p>
                    <strong>Atenção:</strong> Você tem {etapa.totalInscritos}{" "}
                    jogadores (número ímpar). É necessário um número PAR de
                    jogadores para formar duplas.
                  </p>
                </Alert>
              )}

            {inscricoesAbertas && numeroValido && !vagasCompletas && (
              <Alert $variant="yellow">
                <p>
                  <strong>Vagas incompletas:</strong> Esta etapa está
                  configurada para {etapa.maxJogadores} jogadores, mas possui
                  apenas {etapa.totalInscritos} inscrito(s).
                </p>
                <p>
                  <strong>Opções:</strong>
                </p>
                <ul>
                  <li>
                    Aguardar completar as{" "}
                    {etapa.maxJogadores - etapa.totalInscritos} vaga(s)
                    restante(s), OU
                  </li>
                  <li>
                    Editar a etapa e ajustar o número máximo para{" "}
                    {etapa.totalInscritos} jogadores
                  </li>
                </ul>
              </Alert>
            )}

            {inscricoesEncerradas && !etapa.chavesGeradas && vagasCompletas && (
              <Alert $variant="green">
                <p>
                  <strong>✅ Pronto!</strong> Inscrições encerradas com{" "}
                  {etapa.totalInscritos} jogadores (vagas completas). Agora você
                  pode gerar as chaves!
                </p>
              </Alert>
            )}

            {inscricoesEncerradas &&
              !etapa.chavesGeradas &&
              !vagasCompletas && (
                <Alert $variant="orange">
                  <p>
                    <strong>Não é possível gerar chaves:</strong> Esta etapa
                    está configurada para {etapa.maxJogadores} jogadores, mas
                    possui apenas {etapa.totalInscritos} inscrito(s).
                  </p>
                  <p>
                    <strong>Soluções:</strong>
                  </p>
                  <ul>
                    <li>
                      Clique em "Reabrir Inscrições" e adicione mais{" "}
                      {etapa.maxJogadores - etapa.totalInscritos} jogador(es),
                      OU
                    </li>
                    <li>
                      Edite a etapa e ajuste o número máximo de jogadores para{" "}
                      {etapa.totalInscritos}
                    </li>
                  </ul>
                </Alert>
              )}
          </ActionsSection>
        </>
      )}

      {abaAtiva === "inscricoes" && (
        <Card>
          <CardTitle>👤 Jogadores Inscritos ({etapa.totalInscritos})</CardTitle>

          {inscricoes.length === 0 ? (
            <InscricoesEmpty>
              <p>
                {etapa.totalInscritos === 0
                  ? "Nenhum jogador inscrito ainda."
                  : "Carregando inscrições..."}
              </p>
              {etapa.totalInscritos === 0 && inscricoesAbertas && (
                <Button $variant="blue" onClick={handleInscreverJogador}>
                  ➕ Inscrever Primeiro Jogador
                </Button>
              )}
            </InscricoesEmpty>
          ) : (
            <>
              {/* ✅ Barra de Seleção Múltipla */}
              {!etapa.chavesGeradas && (
                <SelectionBar>
                  <SelectionInfo>
                    <SelectAllButton onClick={selecionarTodos}>
                      {jogadoresSelecionados.size === inscricoes.length
                        ? "✓ Desmarcar Todos"
                        : "☐ Selecionar Todos"}
                    </SelectAllButton>

                    {jogadoresSelecionados.size > 0 && (
                      <SelectionCount>
                        {jogadoresSelecionados.size} selecionado(s)
                      </SelectionCount>
                    )}
                  </SelectionInfo>

                  <DeleteSelectedButton
                    onClick={handleExcluirSelecionados}
                    disabled={jogadoresSelecionados.size === 0}
                  >
                    <span>🗑️</span>
                    <span>Excluir Selecionados</span>
                  </DeleteSelectedButton>
                </SelectionBar>
              )}

              {/* ✅ Grid de Inscrições com Checkboxes */}
              <InscricoesGrid>
                {inscricoes.map((inscricao) => (
                  <InscricaoCardSelectable
                    key={inscricao.id}
                    $selected={jogadoresSelecionados.has(inscricao.id)}
                  >
                    <InscricaoCardContent>
                      {/* ✅ Checkbox (apenas se chaves não foram geradas) */}
                      {!etapa.chavesGeradas && (
                        <CheckboxWrapper>
                          <Checkbox
                            checked={jogadoresSelecionados.has(inscricao.id)}
                            onChange={() =>
                              toggleSelecionarJogador(inscricao.id)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </CheckboxWrapper>
                      )}

                      <InscricaoInfo>
                        <InscricaoNome>{inscricao.jogadorNome}</InscricaoNome>
                        <InscricaoNivel>
                          {inscricao.jogadorNivel === "iniciante" &&
                            "🟢 Iniciante"}
                          {inscricao.jogadorNivel === "intermediario" &&
                            "🟡 Intermediário"}
                          {inscricao.jogadorNivel === "avancado" &&
                            "🔴 Avançado"}
                        </InscricaoNivel>
                      </InscricaoInfo>
                    </InscricaoCardContent>

                    {/* ✅ Botão individual de cancelar */}
                    {!etapa.chavesGeradas && (
                      <CancelButton
                        onClick={() =>
                          handleCancelarInscricao(
                            inscricao.id,
                            inscricao.jogadorNome
                          )
                        }
                        title="Cancelar inscrição"
                      >
                        ✕
                      </CancelButton>
                    )}
                  </InscricaoCardSelectable>
                ))}
              </InscricoesGrid>

              {/* ✅ Componente GerenciarCabecasDeChave INLINE */}
              {inscricoes.length > 0 && (
                <GerenciarCabecasDeChave
                  arenaId={etapa.arenaId}
                  etapaId={etapa.id}
                  inscricoes={inscricoes}
                  formato={etapa.formato}
                  totalInscritos={etapa.totalInscritos}
                  qtdGrupos={etapa.qtdGrupos}
                  onUpdate={carregarEtapa}
                  readOnly={etapa.chavesGeradas}
                />
              )}
            </>
          )}

          {etapa.chavesGeradas && (
            <Alert $variant="yellow">
              <p>
                <strong>Atenção:</strong> Não é possível cancelar inscrições
                após a geração de chaves
              </p>
            </Alert>
          )}

          {inscricoesAbertas && (
            <div style={{ marginTop: "1rem" }}>
              <Button
                $variant="blue"
                $fullWidth
                onClick={handleInscreverJogador}
              >
                <span>➕ Inscrever Novo Jogador</span>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ✅ ABA: CHAVES - Adaptar por formato */}
      {abaAtiva === "chaves" && etapa.chavesGeradas && (
        <Card>
          {isReiDaPraia ? (
            // ✅ Componente específico Rei da Praia (criar depois)
            <ChavesReiDaPraia
              etapaId={etapa.id}
              arenaId={etapa.arenaId}
              tipoChaveamento={etapa.tipoChaveamento}
            />
          ) : (
            // Componente tradicional Dupla Fixa
            <ChavesEtapa etapaId={etapa.id} arenaId={etapa.arenaId} />
          )}
        </Card>
      )}

      {/* Modais */}
      {modalInscricaoAberto && etapa && (
        <ModalInscricao
          etapaId={etapa.id}
          etapaNome={etapa.nome}
          etapaNivel={etapa.nivel}
          etapaGenero={etapa.genero}
          maxJogadores={etapa.maxJogadores}
          totalInscritos={etapa.totalInscritos}
          onClose={() => setModalInscricaoAberto(false)}
          onSuccess={handleInscricaoSuccess}
        />
      )}

      <ConfirmacaoPerigosa
        isOpen={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={handleExcluirChaves}
        titulo="🗑️ Excluir Chaves?"
        mensagem={
          `Você está prestes a EXCLUIR TODAS AS CHAVES da etapa "${etapa?.nome}".\n\n` +
          `Isso irá remover:\n` +
          (isReiDaPraia
            ? `• Todas as estatísticas individuais\n`
            : `• Todas as duplas\n`) +
          `• Todos os grupos\n` +
          `• Todas as partidas\n` +
          `• Todo o progresso do torneio\n\n` +
          `⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA!\n\n` +
          `A etapa voltará ao status "Inscrições Encerradas" e você precisará gerar as chaves novamente do zero.`
        }
        palavraConfirmacao="EXCLUIR"
        textoBotao="Sim, excluir tudo"
        loading={excluindo}
      />
      <Footer />
    </Container>
  );
};
