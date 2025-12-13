import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  GeneroJogador,
  Jogador,
  NivelJogador,
  StatusJogador,
} from "@/types/jogador";
import { FormatoEtapa } from "@/types/etapa";
import { getJogadorService, getEtapaService } from "@/services";

interface ModalInscricaoProps {
  etapaId: string;
  etapaNome: string;
  etapaNivel?: NivelJogador;
  etapaGenero: GeneroJogador;
  etapaFormato?: FormatoEtapa;
  maxJogadores: number;
  totalInscritos: number;
  onClose: () => void;
  onSuccess: () => void;
}

// ============== STYLED COMPONENTS ==============

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 56rem;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderContent = styled.div``;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const CloseButton = styled.button`
  font-size: 2rem;
  color: #9ca3af;
  border: none;
  background: none;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;

  &:hover {
    color: #4b5563;
  }
`;

const InfoRow = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;

  @media (min-width: 375px) {
    display: none;
  }
`;

const InfoBadge = styled.div<{
  $variant: "purple" | "cyan" | "blue" | "green";
}>`
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;

  ${(props) => {
    switch (props.$variant) {
      case "purple":
        return `background: #faf5ff; color: #7c3aed;`;
      case "cyan":
        return `background: #ecfeff; color: #0891b2;`;
      case "blue":
        return `background: #eff6ff; color: #2563eb;`;
      case "green":
        return `background: #f0fdf4; color: #16a34a;`;
    }
  }}

  span:first-child {
    font-weight: 600;
  }

  span:last-child {
    font-weight: 700;
  }
`;

const WarningBox = styled.div`
  margin-top: 0.75rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: #92400e;

  strong {
    font-weight: 600;
  }

  @media (min-width: 375px) {
    display: none;
  }
`;

const TabsContainer = styled.div`
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const TabsRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  ${(props) =>
    props.$active
      ? `
    background: #2563eb;
    color: white;
  `
      : `
    background: white;
    color: #374151;
    &:hover { background: #f3f4f6; }
  `}
`;

const SearchContainer = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const SearchInput = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #2563eb;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const FormContainer = styled.div`
  max-width: 32rem;
  margin: 0 auto;
`;

const FormTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
`;

const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormField = styled.div``;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;

  .required {
    color: #ef4444;
  }
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #2563eb;
  }

  &:disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #2563eb;
  }
`;

const HintText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const Button = styled.button<{
  $variant?: "primary" | "secondary" | "success";
}>`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) => {
    switch (props.$variant) {
      case "success":
        return `
          background: #16a34a;
          color: white;
          &:hover:not(:disabled) { background: #15803d; }
        `;
      case "secondary":
        return `
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover:not(:disabled) { background: #f9fafb; }
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
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem 0;
`;

const Spinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: #6b7280;
  margin: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 0;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const EmptyText = styled.p`
  color: #6b7280;
  margin: 0 0 0.5rem 0;
`;

const EmptyLink = styled.button`
  color: #2563eb;
  font-weight: 600;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover {
    color: #1d4ed8;
  }
`;

const EmptyHint = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.5rem 0 0 0;
`;

const JogadoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const JogadorCard = styled.div<{ $selected: boolean }>`
  border: 1px solid ${(props) => (props.$selected ? "#bae6fd" : "#e5e7eb")};
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.$selected ? "#f0f9ff" : "white")};

  &:hover {
    background: ${(props) => (props.$selected ? "#f0f9ff" : "#f9fafb")};
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
`;

const JogadorContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const JogadorInfo = styled.div`
  flex: 1;
`;

const JogadorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const JogadorName = styled.h3`
  font-weight: 600;
  color: #111827;
  margin: 0;
  font-size: 0.9375rem;
`;

const CheckIcon = styled.span`
  color: #2563eb;
  font-size: 1rem;
`;

const JogadorEmail = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const JogadorLevel = styled.span`
  display: inline-block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const JogadorGenero = styled.span<{ $genero: GeneroJogador }>`
  display: inline-block;
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  margin-left: 0.5rem;
  font-weight: 500;

  ${(props) =>
    props.$genero === GeneroJogador.MASCULINO
      ? `background: #dbeafe; color: #1e40af;`
      : `background: #fce7f3; color: #9d174d;`
  }
`;

const GeneroCounter = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  margin-top: 0.5rem;
`;

const GeneroCounterItem = styled.span<{ $genero: "masculino" | "feminino"; $atLimite?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  ${(props) => {
    const baseColor = props.$genero === "masculino" ? "#1e40af" : "#9d174d";
    const bgColor = props.$genero === "masculino" ? "#dbeafe" : "#fce7f3";
    return `
      color: ${props.$atLimite ? "#dc2626" : baseColor};
      padding: 0.25rem 0.5rem;
      background: ${props.$atLimite ? "#fee2e2" : bgColor};
      border-radius: 0.25rem;
      font-weight: ${props.$atLimite ? 600 : 500};
    `;
  }}
`;

const MessageBox = styled.div<{ $variant: "success" | "error" }>`
  padding: 0.75rem 1.5rem;
  border-top: 1px solid
    ${(props) => (props.$variant === "success" ? "#bbf7d0" : "#fecaca")};
  background: ${(props) =>
    props.$variant === "success" ? "#f0fdf4" : "#fee2e2"};
  font-size: 0.875rem;
  color: ${(props) => (props.$variant === "success" ? "#166534" : "#991b1b")};
`;

const Footer = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const FooterContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FooterInfo = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const FooterButtons = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const FooterButton = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #2563eb;
    color: white;
    &:hover:not(:disabled) { background: #1d4ed8; }
  `
      : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    &:hover:not(:disabled) { background: #f9fafb; }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ============== COMPONENTE ==============

export const ModalInscricao: React.FC<ModalInscricaoProps> = ({
  etapaId,
  etapaNome,
  etapaNivel,
  etapaGenero,
  etapaFormato,
  maxJogadores,
  totalInscritos,
  onClose,
  onSuccess,
}) => {
  const jogadorService = getJogadorService();
  const etapaService = getEtapaService();
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [jogadoresInscritosIds, setJogadoresInscritosIds] = useState<string[]>(
    []
  );
  const [jogadoresSelecionados, setJogadoresSelecionados] = useState<Jogador[]>(
    []
  );
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingJogadores, setLoadingJogadores] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Se gênero da etapa for misto, o jogador precisa escolher
  const isMisto = etapaGenero === GeneroJogador.MISTO;
  // Se nível da etapa não está definido (nível livre), o jogador precisa escolher
  const isNivelLivre = !etapaNivel;
  const [novoJogador, setNovoJogador] = useState({
    nome: "",
    email: "",
    telefone: "",
    nivel: etapaNivel || NivelJogador.INTERMEDIARIO, // Default intermediário se nível livre
    status: StatusJogador.ATIVO,
    genero: isMisto ? GeneroJogador.MASCULINO : etapaGenero, // Default masculino se misto
  });

  const vagasDisponiveis = maxJogadores - totalInscritos;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    await Promise.all([carregarJogadores(), carregarInscritos()]);
  };

  const carregarJogadores = async () => {
    try {
      setLoadingJogadores(true);
      // Se gênero for "misto", não filtra por gênero (busca todos)
      const isMisto = etapaGenero === GeneroJogador.MISTO;
      const data = await jogadorService.listar({
        nivel: etapaNivel,
        genero: isMisto ? undefined : etapaGenero,
      });
      setJogadores(data.jogadores || []);
    } catch (err: any) {
      setError("Erro ao carregar jogadores");
      setJogadores([]);
    } finally {
      setLoadingJogadores(false);
    }
  };

  // Estado para guardar as inscrições completas (para contar gêneros)
  const [inscricoesAtuais, setInscricoesAtuais] = useState<{ jogadorId: string; jogadorGenero?: GeneroJogador }[]>([]);

  const carregarInscritos = async () => {
    try {
      const inscricoes = await etapaService.listarInscricoes(etapaId);
      const ids = inscricoes.map((i) => i.jogadorId);
      setJogadoresInscritosIds(ids);
      // Guardar as inscrições completas para contar gêneros
      setInscricoesAtuais(inscricoes.map(i => ({ jogadorId: i.jogadorId, jogadorGenero: i.jogadorGenero as GeneroJogador | undefined })));
    } catch (err: any) {
      setJogadoresInscritosIds([]);
      setInscricoesAtuais([]);
    }
  };

  // Verificar se é etapa TEAMS mista (requer 50% de cada gênero)
  const isTeamsMisto = etapaFormato === FormatoEtapa.TEAMS && isMisto;
  const maxPorGenero = maxJogadores / 2;

  // Contar inscritos por gênero (já inscritos + selecionados)
  const contadorGenero = useMemo(() => {
    // Contar inscritos atuais
    const masculinosInscritos = inscricoesAtuais.filter(
      (i) => i.jogadorGenero === GeneroJogador.MASCULINO
    ).length;
    const femininasInscritas = inscricoesAtuais.filter(
      (i) => i.jogadorGenero === GeneroJogador.FEMININO
    ).length;

    // Contar selecionados
    const masculinosSelecionados = jogadoresSelecionados.filter(
      (j) => j.genero === GeneroJogador.MASCULINO
    ).length;
    const femininasSelecionadas = jogadoresSelecionados.filter(
      (j) => j.genero === GeneroJogador.FEMININO
    ).length;

    return {
      masculinosTotal: masculinosInscritos + masculinosSelecionados,
      femininasTotal: femininasInscritas + femininasSelecionadas,
      masculinosInscritos,
      femininasInscritas,
      masculinosSelecionados,
      femininasSelecionadas,
    };
  }, [inscricoesAtuais, jogadoresSelecionados]);

  const handleCadastrarJogador = async () => {
    if (!novoJogador.nome.trim()) {
      setError("Por favor, preencha o nome do jogador");
      setSuccessMessage(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const jogadorCriado = await jogadorService.criar(novoJogador);

      setJogadores([...jogadores, jogadorCriado]);

      setNovoJogador({
        nome: "",
        email: "",
        telefone: "",
        nivel: etapaNivel || NivelJogador.INTERMEDIARIO,
        status: StatusJogador.ATIVO,
        genero: isMisto ? GeneroJogador.MASCULINO : etapaGenero,
      });
      setMostrarFormulario(false);

      setSuccessMessage(`✓ ${jogadorCriado.nome} cadastrado com sucesso!`);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      let mensagemErro = err.message || "Erro ao cadastrar jogador";

      if (mensagemErro.toLowerCase().includes("já existe")) {
        mensagemErro = mensagemErro;
      }

      setError(mensagemErro);
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const jogadoresDisponiveis = (jogadores || []).filter(
    (jogador) =>
      !jogadoresInscritosIds.includes(jogador.id) &&
      jogador.status === StatusJogador.ATIVO
  );

  const jogadoresFiltrados = jogadoresDisponiveis.filter(
    (jogador) =>
      jogador.nome.toLowerCase().includes(busca.toLowerCase()) ||
      jogador.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleJogador = (jogador: Jogador) => {
    const jaEstaSelecionado = jogadoresSelecionados.some(
      (j) => j.id === jogador.id
    );

    if (jaEstaSelecionado) {
      setJogadoresSelecionados(
        jogadoresSelecionados.filter((j) => j.id !== jogador.id)
      );
    } else {
      if (jogadoresSelecionados.length >= vagasDisponiveis) {
        alert(
          `Você só pode inscrever ${vagasDisponiveis} jogador(es) nesta etapa.`
        );
        return;
      }

      // Validar proporção de gênero para etapas TEAMS mistas
      if (isTeamsMisto) {
        if (jogador.genero === GeneroJogador.MASCULINO) {
          if (contadorGenero.masculinosTotal >= maxPorGenero) {
            alert(
              `Limite de jogadores masculinos atingido (${maxPorGenero}). ` +
              `Etapas mistas requerem 50% de cada gênero.`
            );
            return;
          }
        } else if (jogador.genero === GeneroJogador.FEMININO) {
          if (contadorGenero.femininasTotal >= maxPorGenero) {
            alert(
              `Limite de jogadoras femininas atingido (${maxPorGenero}). ` +
              `Etapas mistas requerem 50% de cada gênero.`
            );
            return;
          }
        }
      }

      setJogadoresSelecionados([...jogadoresSelecionados, jogador]);
    }
  };

  const handleInscrever = async () => {
    if (jogadoresSelecionados.length === 0) {
      alert("Selecione pelo menos um jogador");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const jogadorIds = jogadoresSelecionados.map((j) => j.id);
      const inscricoes = await etapaService.inscreverJogadores(etapaId, jogadorIds);

      // Verificar se houve erros parciais
      if (inscricoes.length < jogadoresSelecionados.length) {
        const sucesso = inscricoes.length;
        const falhas = jogadoresSelecionados.length - inscricoes.length;
        alert(
          `${sucesso} jogador(es) inscrito(s) com sucesso!\n${falhas} inscrição(ões) falharam. Verifique os critérios (nível, gênero, limite).`
        );
      } else {
        alert(
          `${jogadoresSelecionados.length} jogador(es) inscrito(s) com sucesso!`
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao inscrever jogadores");
    } finally {
      setLoading(false);
    }
  };

  const getNivelLabel = (nivel: NivelJogador) => {
    switch (nivel) {
      case NivelJogador.INICIANTE:
        return "Iniciante";
      case NivelJogador.INTERMEDIARIO:
        return "Intermediário";
      case NivelJogador.AVANCADO:
        return "Avançado";
      default:
        return nivel;
    }
  };

  const getGeneroLabel = (genero: GeneroJogador) => {
    switch (genero) {
      case GeneroJogador.MASCULINO:
        return "Masculino";
      case GeneroJogador.FEMININO:
        return "Feminino";
      default:
        return genero;
    }
  };

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContainer>
        <Header>
          <HeaderTop>
            <HeaderContent>
              <Title>Inscrever Jogadores</Title>
              <Subtitle>{etapaNome}</Subtitle>
            </HeaderContent>
            <CloseButton onClick={onClose}>×</CloseButton>
          </HeaderTop>

          <InfoRow>
            {etapaNivel && (
              <InfoBadge $variant="purple">
                <span>Nível: </span>
                <span>{getNivelLabel(etapaNivel)}</span>
              </InfoBadge>
            )}

            <InfoBadge $variant="cyan">
              <span>Jogadores disponíveis: </span>
              <span>
                {jogadoresDisponiveis.length} de {jogadores.length}
              </span>
            </InfoBadge>

            <InfoBadge $variant="blue">
              <span>Vagas na etapa: </span>
              <span>{vagasDisponiveis}</span>
            </InfoBadge>

            <InfoBadge $variant="green">
              <span>Selecionados: </span>
              <span>{jogadoresSelecionados.length}</span>
            </InfoBadge>
          </InfoRow>

          {etapaNivel && (
            <WarningBox>
              <strong>Atenção:</strong> Apenas jogadores{" "}
              <strong>{etapaNivel}</strong> que ainda não estão inscritos aparecem
              na lista
            </WarningBox>
          )}

          {isTeamsMisto && (
            <GeneroCounter>
              <span style={{ fontWeight: 600, color: "#374151" }}>Proporção de gênero (50%/50%):</span>
              <GeneroCounterItem
                $genero="masculino"
                $atLimite={contadorGenero.masculinosTotal >= maxPorGenero}
              >
                ♂ Masc: {contadorGenero.masculinosTotal}/{maxPorGenero}
              </GeneroCounterItem>
              <GeneroCounterItem
                $genero="feminino"
                $atLimite={contadorGenero.femininasTotal >= maxPorGenero}
              >
                ♀ Fem: {contadorGenero.femininasTotal}/{maxPorGenero}
              </GeneroCounterItem>
            </GeneroCounter>
          )}
        </Header>

        <TabsContainer>
          <TabsRow>
            <Tab
              $active={!mostrarFormulario}
              onClick={() => setMostrarFormulario(false)}
            >
              Selecionar Jogadores
            </Tab>
            <Tab
              $active={mostrarFormulario}
              onClick={() => setMostrarFormulario(true)}
            >
              Cadastrar Novo
            </Tab>
          </TabsRow>
        </TabsContainer>

        {!mostrarFormulario && (
          <SearchContainer>
            <SearchInput
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar jogador por nome ou email..."
            />
          </SearchContainer>
        )}

        <Content>
          {mostrarFormulario ? (
            <FormContainer>
              <FormTitle>Cadastrar Novo Jogador</FormTitle>

              <FormFields>
                <FormField>
                  <Label>
                    Nome <span className="required">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={novoJogador.nome}
                    onChange={(e) =>
                      setNovoJogador({ ...novoJogador, nome: e.target.value })
                    }
                    placeholder="Nome completo"
                  />
                </FormField>

                <FormField>
                  <Label>
                    Email <span className="required">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={novoJogador.email}
                    onChange={(e) =>
                      setNovoJogador({ ...novoJogador, email: e.target.value })
                    }
                    placeholder="email@exemplo.com"
                  />
                </FormField>

                <FormField>
                  <Label>Telefone</Label>
                  <Input
                    type="tel"
                    value={novoJogador.telefone}
                    onChange={(e) =>
                      setNovoJogador({
                        ...novoJogador,
                        telefone: e.target.value,
                      })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </FormField>

                <FormField>
                  <Label>
                    Gênero <span className="required">*</span>
                  </Label>
                  {isMisto ? (
                    <>
                      <Select
                        value={novoJogador.genero}
                        onChange={(e) =>
                          setNovoJogador({
                            ...novoJogador,
                            genero: e.target.value as GeneroJogador.MASCULINO | GeneroJogador.FEMININO,
                          })
                        }
                      >
                        <option value={GeneroJogador.MASCULINO}>Masculino</option>
                        <option value={GeneroJogador.FEMININO}>Feminino</option>
                      </Select>
                      <HintText>
                        Etapa mista: selecione o gênero do jogador
                      </HintText>
                    </>
                  ) : (
                    <>
                      <Input
                        type="text"
                        value={getGeneroLabel(etapaGenero)}
                        disabled
                      />
                      <HintText>
                        O jogador será criado automaticamente com o gênero desta
                        etapa
                      </HintText>
                    </>
                  )}
                </FormField>

                <FormField>
                  <Label>
                    Nível <span className="required">*</span>
                  </Label>
                  {isNivelLivre ? (
                    <>
                      <Select
                        value={novoJogador.nivel}
                        onChange={(e) =>
                          setNovoJogador({
                            ...novoJogador,
                            nivel: e.target.value as NivelJogador,
                          })
                        }
                      >
                        <option value={NivelJogador.INICIANTE}>Iniciante</option>
                        <option value={NivelJogador.INTERMEDIARIO}>Intermediário</option>
                        <option value={NivelJogador.AVANCADO}>Avançado</option>
                      </Select>
                      <HintText>
                        Etapa nível livre: selecione o nível do jogador
                      </HintText>
                    </>
                  ) : (
                    <>
                      <Input
                        type="text"
                        value={getNivelLabel(etapaNivel!)}
                        disabled
                      />
                      <HintText>
                        O jogador será criado automaticamente com o nível desta
                        etapa
                      </HintText>
                    </>
                  )}
                </FormField>

                <Button
                  $variant="success"
                  onClick={handleCadastrarJogador}
                  disabled={loading || !novoJogador.nome.trim()}
                >
                  {loading ? "Cadastrando..." : " Cadastrar Jogador"}
                </Button>
              </FormFields>
            </FormContainer>
          ) : loadingJogadores ? (
            <LoadingContainer>
              <Spinner />
              <LoadingText>Carregando jogadores...</LoadingText>
            </LoadingContainer>
          ) : jogadoresFiltrados.length === 0 ? (
            <EmptyState>
              <EmptyText>
                {busca
                  ? "Nenhum jogador encontrado com esse termo"
                  : jogadores.length === 0
                  ? etapaNivel
                    ? "Nenhum jogador cadastrado neste nível"
                    : "Nenhum jogador cadastrado"
                  : jogadoresDisponiveis.length === 0
                  ? etapaNivel
                    ? "Todos os jogadores deste nível já estão inscritos!"
                    : "Todos os jogadores já estão inscritos!"
                  : "Nenhum jogador disponível"}
              </EmptyText>
              {!busca && jogadores.length === 0 && (
                <EmptyLink onClick={() => setMostrarFormulario(true)}>
                  Cadastrar primeiro jogador
                </EmptyLink>
              )}
              {jogadoresDisponiveis.length === 0 && jogadores.length > 0 && (
                <EmptyHint>
                  {jogadores.length} jogador(es){" "}
                  {etapaNivel ? `${etapaNivel} ` : ""}já inscrito(s) nesta etapa
                </EmptyHint>
              )}
            </EmptyState>
          ) : (
            <JogadoresGrid>
              {jogadoresFiltrados.map((jogador) => {
                const selecionado = jogadoresSelecionados.some(
                  (j) => j.id === jogador.id
                );

                return (
                  <JogadorCard
                    key={jogador.id}
                    $selected={selecionado}
                    onClick={() => toggleJogador(jogador)}
                  >
                    <JogadorContent>
                      <JogadorInfo>
                        <JogadorHeader>
                          <JogadorName>{jogador.nome}</JogadorName>
                          {isMisto && jogador.genero && (
                            <JogadorGenero $genero={jogador.genero}>
                              {jogador.genero === GeneroJogador.MASCULINO ? "♂ M" : "♀ F"}
                            </JogadorGenero>
                          )}
                          {selecionado && <CheckIcon>✓</CheckIcon>}
                        </JogadorHeader>
                        <JogadorEmail>{jogador.email}</JogadorEmail>
                        {jogador.nivel && (
                          <JogadorLevel>Nível: {jogador.nivel}</JogadorLevel>
                        )}
                      </JogadorInfo>
                    </JogadorContent>
                  </JogadorCard>
                );
              })}
            </JogadoresGrid>
          )}
        </Content>

        {successMessage && (
          <MessageBox $variant="success">{successMessage}</MessageBox>
        )}

        {error && <MessageBox $variant="error">{error}</MessageBox>}

        <Footer>
          <FooterContent>
            <FooterInfo>
              {jogadoresSelecionados.length > 0 && !mostrarFormulario && (
                <span>
                  {jogadoresSelecionados.length} jogador(es) selecionado(s)
                </span>
              )}
            </FooterInfo>

            <FooterButtons>
              <FooterButton
                $variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </FooterButton>
              {!mostrarFormulario && (
                <FooterButton
                  $variant="primary"
                  onClick={handleInscrever}
                  disabled={loading || jogadoresSelecionados.length === 0}
                >
                  {loading ? "Inscrevendo..." : "Inscrever"}
                </FooterButton>
              )}
            </FooterButtons>
          </FooterContent>
        </Footer>
      </ModalContainer>
    </Overlay>
  );
};

export default ModalInscricao;
