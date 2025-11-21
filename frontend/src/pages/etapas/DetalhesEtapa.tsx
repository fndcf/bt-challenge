import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { Etapa, Inscricao, StatusEtapa } from "../../types/etapa";
import etapaService from "../../services/etapaService";
import chaveService from "../../services/chaveService";
import { StatusBadge } from "../../components/etapas/StatusBadge";
import { ModalInscricao } from "../../components/etapas/ModalInscricao";
import { ChavesEtapa } from "../../components/etapas/ChavesEtapa";
import { ConfirmacaoPerigosa } from "../../components/ConfirmacaoPerigosa";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const TabsContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const TabsNav = styled.div`
  border-bottom: 1px solid #e5e7eb;

  /* ⭐ MOBILE: Remove borda */
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

  /* ⭐ MOBILE: Layout vertical */
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

  /* ⭐ MOBILE: Botão full-width com fundo */
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

  /* ⭐ MOBILE: Badge à direita */
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

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
`;

const CardIconRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const CardIcon = styled.span`
  font-size: 1.875rem;
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

const CardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
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
  $variant: "orange" | "red" | "blue" | "yellow" | "green";
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

/**
 * Página de detalhes da etapa
 */
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
      console.error("Erro ao carregar etapa:", err);
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
      console.error("Erro ao carregar inscrições:", err);
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
      console.error("Erro ao cancelar inscrição:", err);
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
      console.error("Erro ao excluir etapa:", err);
      alert(err.message || "Erro ao excluir etapa");
      setLoading(false);
    }
  };

  const formatarData = (data: any) => {
    try {
      // Se for um Timestamp do Firebase
      if (data && typeof data === "object" && "_seconds" in data) {
        const date = new Date(data._seconds * 1000);
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }

      // Se for string ISO
      if (typeof data === "string") {
        return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
      }

      // Se for Date
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
    await carregarEtapa(); // Recarregar dados após inscrição
  };

  const handleGerarChaves = async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `🎾 Deseja gerar as chaves para a etapa "${etapa.nome}"?\n\n` +
        `Isso criará:\n` +
        `• ${etapa.qtdGrupos} grupos\n` +
        `• ${Math.floor(etapa.totalInscritos / 2)} duplas\n` +
        `• Todos os confrontos da fase de grupos\n\n` +
        `⚠️ Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      const resultado = await chaveService.gerarChaves(etapa.id);

      alert(
        `✅ Chaves geradas com sucesso!\n\n` +
          `• ${resultado.duplas.length} duplas criadas\n` +
          `• ${resultado.grupos.length} grupos formados\n` +
          `• ${resultado.partidas.length} partidas agendadas`
      );

      await carregarEtapa();
      setAbaAtiva("chaves");
    } catch (err: any) {
      console.error("Erro ao gerar chaves:", err);
      alert(err.message || "Erro ao gerar chaves");
    } finally {
      setLoading(false);
    }
  };

  const handleEncerrarInscricoes = async () => {
    if (!etapa) return;

    const confirmar = window.confirm(
      `📝 Deseja encerrar as inscrições da etapa "${etapa.nome}"?\n\n` +
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
      console.error("Erro ao encerrar inscrições:", err);
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
      console.error("Erro ao reabrir inscrições:", err);
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
      console.error("Erro ao excluir chaves:", err);
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
  const numeroValido =
    etapa.totalInscritos >= 4 && etapa.totalInscritos % 2 === 0;
  const podeGerarChaves =
    inscricoesEncerradas &&
    vagasCompletas &&
    numeroValido &&
    !etapa.chavesGeradas;
  const podeEncerrarInscricoes = inscricoesAbertas && numeroValido;
  const podeReabrirInscricoes =
    inscricoesEncerradas && !etapa.chavesGeradas && !vagasCompletas;

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate("/admin/etapas")}>
          ← Voltar
        </BackButton>

        <HeaderRow>
          <HeaderContent>
            <Title>{etapa.nome}</Title>
            {etapa.descricao && <Subtitle>{etapa.descricao}</Subtitle>}
          </HeaderContent>

          <HeaderActions>
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
              <span>📝 Inscrições</span>
              {etapa.totalInscritos > 0 && (
                <TabBadge>{etapa.totalInscritos}</TabBadge>
              )}
            </Tab>

            {etapa.chavesGeradas && (
              <Tab
                $active={abaAtiva === "chaves"}
                onClick={() => setAbaAtiva("chaves")}
              >
                <span>🎯 Grupos & Partidas</span>
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
                <CardIcon>👥</CardIcon>
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

            {/* Grupos */}
            <Card>
              <CardIconRow>
                <CardIcon>🎯</CardIcon>
                <CardInfo>
                  <CardLabel>Grupos</CardLabel>
                  <CardValue>{etapa.qtdGrupos || 0}</CardValue>
                </CardInfo>
              </CardIconRow>

              <CardContent>
                <p>• {etapa.jogadoresPorGrupo} duplas por grupo</p>
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
                <CardIcon>📅</CardIcon>
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
                    <span>📍</span>
                    <span>{etapa.local}</span>
                  </p>
                </CardContent>
              )}
            </Card>
          </Grid>

          {/* Informações Detalhadas */}
          <Grid $cols={2}>
            {/* Datas */}
            <Card>
              <CardTitle>📋 Datas Importantes</CardTitle>

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
                <InfoRow>
                  <InfoLabel>Nível:</InfoLabel>
                  <InfoValue $color="#a855f7">
                    {etapa.nivel === "iniciante" && "🌱 Iniciante"}
                    {etapa.nivel === "intermediario" && "⚡ Intermediário"}
                    {etapa.nivel === "avancado" && "🔥 Avançado"}
                  </InfoValue>
                </InfoRow>

                {/* ✅ ADICIONAR: Gênero */}
                <InfoRow>
                  <InfoLabel>Gênero:</InfoLabel>
                  <InfoValue $color="#3b82f6">
                    {etapa.genero === "masculino"
                      ? "♂️ Masculino"
                      : "♀️ Feminino"}
                  </InfoValue>
                </InfoRow>

                <InfoRow>
                  <InfoLabel>Total de duplas:</InfoLabel>
                  <InfoValue>{Math.floor(etapa.totalInscritos / 2)}</InfoValue>
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
                  <span>➕</span>
                  <span>Inscrever Jogador</span>
                </Button>
              )}

              {podeEncerrarInscricoes && (
                <Button $variant="orange" onClick={handleEncerrarInscricoes}>
                  <span>📝</span>
                  <span>Encerrar Inscrições</span>
                </Button>
              )}

              {podeGerarChaves && (
                <Button $variant="green" onClick={handleGerarChaves}>
                  <span>🎲</span>
                  <span>Gerar Chaves</span>
                </Button>
              )}

              {podeReabrirInscricoes && (
                <Button $variant="blue" onClick={handleReabrirInscricoes}>
                  <span>🔓</span>
                  <span>Reabrir Inscrições</span>
                </Button>
              )}

              {etapa.chavesGeradas && (
                <>
                  <Button
                    $variant="purple"
                    onClick={() => setAbaAtiva("chaves")}
                  >
                    <span>👁️</span>
                    <span>Ver Chaves</span>
                  </Button>

                  <Button
                    $variant="red"
                    onClick={() => setModalExcluirAberto(true)}
                  >
                    <span>🗑️</span>
                    <span>Excluir Chaves</span>
                  </Button>
                </>
              )}

              <Button
                $variant="gray"
                onClick={() => navigate(`/admin/etapas/${etapa.id}/editar`)}
              >
                <span>✏️</span>
                <span>Editar Etapa</span>
              </Button>

              {!etapa.chavesGeradas && etapa.totalInscritos === 0 && (
                <Button $variant="red" onClick={handleExcluir}>
                  <span>🗑️</span>
                  <span>Excluir Etapa</span>
                </Button>
              )}
            </ActionsGrid>

            {/* Alertas */}
            {etapa.totalInscritos > 0 && !etapa.chavesGeradas && (
              <Alert $variant="orange">
                <p>
                  ⚠️ <strong>Atenção:</strong> Para excluir esta etapa, você
                  precisa cancelar todas as {etapa.totalInscritos}{" "}
                  inscrição(ões) primeiro.
                </p>
              </Alert>
            )}

            {etapa.chavesGeradas && (
              <Alert $variant="red">
                <p>
                  🔒 <strong>Bloqueado:</strong> Não é possível excluir etapa
                  após geração de chaves.
                </p>
              </Alert>
            )}

            {inscricoesAbertas && etapa.totalInscritos < 4 && (
              <Alert $variant="blue">
                <p>
                  ℹ️ Você precisa de pelo menos 4 jogadores inscritos (número
                  par) para encerrar as inscrições.
                </p>
              </Alert>
            )}

            {inscricoesAbertas &&
              etapa.totalInscritos >= 4 &&
              etapa.totalInscritos % 2 !== 0 && (
                <Alert $variant="yellow">
                  <p>
                    ⚠️ <strong>Atenção:</strong> Você tem {etapa.totalInscritos}{" "}
                    jogadores (número ímpar). É necessário um número PAR de
                    jogadores para formar duplas.
                  </p>
                </Alert>
              )}

            {inscricoesAbertas && numeroValido && !vagasCompletas && (
              <Alert $variant="yellow">
                <p>
                  ⚠️ <strong>Vagas incompletas:</strong> Esta etapa está
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
                  ✅ <strong>Pronto!</strong> Inscrições encerradas com{" "}
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
                    ⚠️ <strong>Não é possível gerar chaves:</strong> Esta etapa
                    está configurada para {etapa.maxJogadores} jogadores, mas
                    possui apenas {etapa.totalInscritos} inscrito(s).
                  </p>
                  <p>
                    <strong>Soluções:</strong>
                  </p>
                  <ul>
                    <li>
                      Clique em "🔓 Reabrir Inscrições" e adicione mais{" "}
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
      {/* ABA: INSCRIÇÕES */}
      {abaAtiva === "inscricoes" && (
        <Card>
          <CardTitle>📝 Jogadores Inscritos ({etapa.totalInscritos})</CardTitle>

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
            <InscricoesGrid>
              {inscricoes.map((inscricao) => (
                <InscricaoCard key={inscricao.id}>
                  <InscricaoInfo>
                    <InscricaoNome>{inscricao.jogadorNome}</InscricaoNome>
                    <InscricaoNivel>
                      {inscricao.jogadorNivel === "iniciante" && "🌱 Iniciante"}
                      {inscricao.jogadorNivel === "intermediario" &&
                        "⚡ Intermediário"}
                      {inscricao.jogadorNivel === "avancado" && "🔥 Avançado"}
                    </InscricaoNivel>
                  </InscricaoInfo>

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
                </InscricaoCard>
              ))}
            </InscricoesGrid>
          )}

          {etapa.chavesGeradas && (
            <Alert $variant="yellow">
              <p>
                ⚠️ <strong>Atenção:</strong> Não é possível cancelar inscrições
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
                <span>➕</span>
                <span>Inscrever Novo Jogador</span>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ABA: CHAVES */}
      {abaAtiva === "chaves" && etapa.chavesGeradas && (
        <Card>
          <ChavesEtapa etapaId={etapa.id} arenaId={etapa.arenaId} />
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
        titulo="⚠️ Excluir Chaves?"
        mensagem={`Você está prestes a EXCLUIR TODAS AS CHAVES da etapa "${etapa?.nome}".\n\nIsso irá remover:\n• Todas as duplas\n• Todos os grupos\n• Todas as partidas\n• Todo o progresso do torneio\n\n⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA!\n\nA etapa voltará ao status "Inscrições Encerradas" e você precisará gerar as chaves novamente do zero.`}
        palavraConfirmacao="EXCLUIR"
        textoBotao="Sim, excluir tudo"
        loading={excluindo}
      />
    </Container>
  );
};
